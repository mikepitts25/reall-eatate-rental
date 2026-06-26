"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole, requireUser } from "@/lib/auth";
import { proposalSchema } from "@/lib/validations";
import { renderAgreementText } from "@/lib/agreements/template";
import type { AgreementData } from "@/lib/agreements/types";

export interface ProposalFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/** Operator submits a proposal on a property. */
export async function submitProposalAction(
  _prev: ProposalFormState,
  formData: FormData
): Promise<ProposalFormState> {
  const user = await requireRole(["operator", "admin"]);

  const parsed = proposalSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const supabase = await createClient();

  // Look up the property's owner (and confirm it's active) for owner_id + RLS.
  const { data: property, error: propErr } = await supabase
    .from("properties")
    .select("id, owner_id, status")
    .eq("id", d.property_id)
    .single();

  if (propErr || !property) return { error: "Property not found." };
  if (property.status !== "active")
    return { error: "This listing is no longer accepting proposals." };

  const { data: proposal, error } = await supabase
    .from("proposals")
    .insert({
      property_id: d.property_id,
      operator_id: user.id,
      owner_id: property.owner_id,
      offered_monthly_rent: d.offered_monthly_rent,
      lease_term_months: d.lease_term_months,
      security_deposit: d.security_deposit,
      intended_use: d.intended_use || null,
      estimated_expenses: d.estimated_expenses,
      message: d.message || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "You already submitted a proposal on this property." };
    }
    return { error: error.message };
  }

  // Notify the owner.
  await supabase.rpc("create_notification", {
    p_user_id: property.owner_id,
    p_type: "proposal_received",
    p_title: "New proposal received",
    p_body: `You received a new proposal of $${d.offered_monthly_rent}/mo.`,
    p_link: `/proposals/${proposal.id}`,
  });

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "proposal.created",
    entity_type: "proposal",
    entity_id: proposal.id,
    metadata: { property_id: d.property_id },
  });

  revalidatePath("/proposals");
  redirect(`/proposals/${proposal.id}`);
}

type RespondAction = "accept" | "reject" | "counter" | "withdraw";

/** Owner accepts/rejects/counters; operator withdraws. */
export async function respondToProposalAction(
  proposalId: string,
  action: RespondAction,
  counterAmount?: number
): Promise<{ error?: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (!proposal) return { error: "Proposal not found." };

  const isOwner = proposal.owner_id === user.id;
  const isOperator = proposal.operator_id === user.id;
  const isAdmin = user.profile.role === "admin";

  if (!isOwner && !isOperator && !isAdmin)
    return { error: "Not authorized." };

  let newStatus: string;
  switch (action) {
    case "accept":
      if (!isOwner && !isAdmin) return { error: "Only the owner can accept." };
      newStatus = "accepted";
      break;
    case "reject":
      if (!isOwner && !isAdmin) return { error: "Only the owner can reject." };
      newStatus = "rejected";
      break;
    case "counter":
      if (!isOwner && !isAdmin) return { error: "Only the owner can counter." };
      newStatus = "countered";
      break;
    case "withdraw":
      if (!isOperator && !isAdmin)
        return { error: "Only the operator can withdraw." };
      newStatus = "withdrawn";
      break;
    default:
      return { error: "Unknown action." };
  }

  const update: Record<string, unknown> = { status: newStatus };
  if (action === "counter" && counterAmount && counterAmount > 0) {
    update.offered_monthly_rent = counterAmount;
  }

  const { error } = await supabase
    .from("proposals")
    .update(update)
    .eq("id", proposalId);

  if (error) return { error: error.message };

  // When accepted, mark the property under offer and generate a draft agreement.
  if (action === "accept") {
    await supabase
      .from("properties")
      .update({ status: "under_offer" })
      .eq("id", proposal.property_id);

    await generateAgreementFromProposal(supabase, proposal);
  }

  // Notify the counterpart.
  const notifyUserId = isOwner ? proposal.operator_id : proposal.owner_id;
  await supabase.rpc("create_notification", {
    p_user_id: notifyUserId,
    p_type: "proposal_updated",
    p_title: `Proposal ${newStatus}`,
    p_body: `A proposal was ${newStatus}.`,
    p_link: `/proposals/${proposalId}`,
  });

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: `proposal.${action}`,
    entity_type: "proposal",
    entity_id: proposalId,
    metadata: { counterAmount: counterAmount ?? null },
  });

  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath("/proposals");
  return {};
}

type AnySupabase = Awaited<ReturnType<typeof createClient>>;

/** Internal: create a draft agreement from an accepted proposal (idempotent). */
async function generateAgreementFromProposal(
  supabase: AnySupabase,
  proposal: {
    id: string;
    property_id: string;
    owner_id: string;
    operator_id: string;
    offered_monthly_rent: number;
    lease_term_months: number;
    security_deposit?: number;
    intended_use?: string | null;
  }
) {
  const { data: existing } = await supabase
    .from("agreements")
    .select("id")
    .eq("proposal_id", proposal.id)
    .maybeSingle();
  if (existing) return existing.id;

  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + proposal.lease_term_months);

  // Pull party + property details so we can render the full agreement text.
  const [{ data: property }, { data: owner }, { data: operator }] =
    await Promise.all([
      supabase
        .from("properties")
        .select(
          "title, address_line1, city, state, postal_code, lease_restrictions"
        )
        .eq("id", proposal.property_id)
        .single(),
      supabase
        .from("profiles")
        .select("full_name, company_name, email")
        .eq("id", proposal.owner_id)
        .single(),
      supabase
        .from("profiles")
        .select("full_name, company_name, email")
        .eq("id", proposal.operator_id)
        .single(),
    ]);

  const agreementData: AgreementData = {
    id: proposal.id,
    owner: {
      role: "owner",
      name: owner?.full_name ?? "Owner",
      companyName: owner?.company_name,
      email: owner?.email,
    },
    operator: {
      role: "operator",
      name: operator?.full_name ?? "Operator",
      companyName: operator?.company_name,
      email: operator?.email,
    },
    property: {
      title: property?.title ?? "Property",
      addressLine1: property?.address_line1,
      city: property?.city,
      state: property?.state,
      postalCode: property?.postal_code,
      leaseRestrictions: property?.lease_restrictions,
    },
    monthlyRent: proposal.offered_monthly_rent,
    leaseTermMonths: proposal.lease_term_months,
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    securityDeposit: proposal.security_deposit,
    intendedUse: proposal.intended_use,
    governingLaw: property?.state ? `the State of ${property.state}` : undefined,
  };

  const { data: agreement } = await supabase
    .from("agreements")
    .insert({
      proposal_id: proposal.id,
      property_id: proposal.property_id,
      owner_id: proposal.owner_id,
      operator_id: proposal.operator_id,
      status: "draft",
      monthly_rent: proposal.offered_monthly_rent,
      lease_term_months: proposal.lease_term_months,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      terms: renderAgreementText(agreementData),
    })
    .select("id")
    .single();

  // Generate the payment schedule (one obligation per month).
  if (agreement) {
    const payments = Array.from({ length: proposal.lease_term_months }).map(
      (_, i) => {
        const due = new Date(start);
        due.setMonth(due.getMonth() + i);
        return {
          agreement_id: agreement.id,
          due_date: due.toISOString().slice(0, 10),
          amount: proposal.offered_monthly_rent,
          status: "scheduled" as const,
        };
      }
    );
    await supabase.from("payments").insert(payments);
  }

  return agreement?.id;
}
