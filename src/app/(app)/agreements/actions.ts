"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

/**
 * E-signature placeholder. In production this would integrate with a real
 * provider (DocuSign / Dropbox Sign). Here we record the signer + timestamp and
 * advance the agreement status. When both parties have signed, the agreement
 * becomes `active` and the property is marked `leased`.
 */
export async function signAgreementAction(
  agreementId: string
): Promise<{ error?: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: agreement } = await supabase
    .from("agreements")
    .select("*")
    .eq("id", agreementId)
    .single();

  if (!agreement) return { error: "Agreement not found." };

  const isOwner = agreement.owner_id === user.id;
  const isOperator = agreement.operator_id === user.id;
  if (!isOwner && !isOperator && user.profile.role !== "admin") {
    return { error: "Not authorized." };
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {};
  if (isOwner) update.owner_signed_at = now;
  if (isOperator) update.operator_signed_at = now;

  const ownerSigned = isOwner || !!agreement.owner_signed_at;
  const operatorSigned = isOperator || !!agreement.operator_signed_at;

  if (ownerSigned && operatorSigned) {
    update.status = "active";
  } else if (ownerSigned) {
    update.status = "owner_signed";
  } else if (operatorSigned) {
    update.status = "operator_signed";
  } else {
    update.status = "sent";
  }

  const { error } = await supabase
    .from("agreements")
    .update(update)
    .eq("id", agreementId);
  if (error) return { error: error.message };

  // Both signed -> activate the lease.
  if (update.status === "active") {
    await supabase
      .from("properties")
      .update({ status: "leased" })
      .eq("id", agreement.property_id);
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "agreement.signed",
    entity_type: "agreement",
    entity_id: agreementId,
    metadata: { role: isOwner ? "owner" : "operator" },
  });

  revalidatePath(`/proposals/${agreement.proposal_id}`);
  revalidatePath("/agreements");
  return {};
}
