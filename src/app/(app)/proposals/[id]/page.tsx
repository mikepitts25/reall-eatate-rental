import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ProposalActions } from "@/components/proposal-actions";
import { MessageThread } from "@/components/message-thread";
import { AgreementPanel } from "@/components/agreement-panel";
import { formatCurrency, formatDate } from "@/lib/format";
import { analyzeDeal } from "@/lib/finance";
import type {
  Agreement,
  Message,
  Payment,
  Profile,
  Property,
  Proposal,
} from "@/lib/supabase/database.types";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select(
      "*, properties(*), operator:profiles!proposals_operator_id_fkey(*), owner:profiles!proposals_owner_id_fkey(*)"
    )
    .eq("id", id)
    .single();

  if (!proposal) notFound();

  const pr = proposal as unknown as Proposal & {
    properties: Property;
    operator: Profile;
    owner: Profile;
  };

  const isOwner = pr.owner_id === user.id;
  const isOperator = pr.operator_id === user.id;
  const isAdmin = user.profile.role === "admin";
  if (!isOwner && !isOperator && !isAdmin) notFound();

  const viewerRole: "owner" | "operator" = isOperator ? "operator" : "owner";

  const [{ data: messages }, { data: agreement }] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .eq("proposal_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("agreements")
      .select("*")
      .eq("proposal_id", id)
      .maybeSingle(),
  ]);

  let payments: Payment[] = [];
  if (agreement) {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("agreement_id", (agreement as Agreement).id)
      .order("due_date", { ascending: true });
    payments = (data ?? []) as Payment[];
  }

  const analysis = analyzeDeal({
    monthlyMortgage: Number(pr.properties.monthly_mortgage),
    marketRent: Number(pr.properties.estimated_market_rent),
    operatorOffer: Number(pr.offered_monthly_rent),
    monthlyExpenses: Number(pr.estimated_expenses),
    leaseTermMonths: pr.lease_term_months,
  });

  const counterpart = isOperator ? pr.owner : pr.operator;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/properties/${pr.property_id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← {pr.properties.title}
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Proposal · {formatCurrency(pr.offered_monthly_rent)}/mo
          </h1>
        </div>
        <StatusBadge status={pr.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Proposal terms</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Term label="Offered rent" value={formatCurrency(pr.offered_monthly_rent)} />
              <Term label="Lease term" value={`${pr.lease_term_months} mo`} />
              <Term label="Security deposit" value={formatCurrency(pr.security_deposit)} />
              <Term label="Intended use" value={pr.intended_use || "—"} />
              <Term label="Est. expenses" value={formatCurrency(pr.estimated_expenses)} />
              <Term label="Submitted" value={formatDate(pr.created_at)} />
            </CardContent>
          </Card>

          {pr.message && (
            <Card>
              <CardHeader>
                <CardTitle>Cover note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {pr.message}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Profitability snapshot */}
          <Card>
            <CardHeader>
              <CardTitle>Deal economics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Term
                label="Operator profit /mo"
                value={formatCurrency(analysis.monthlyProfit)}
                positive={analysis.monthlyProfit >= 0}
              />
              <Term label="Margin" value={`${analysis.profitMargin.toFixed(0)}%`} />
              <Term
                label="Owner net /mo"
                value={formatCurrency(analysis.ownerMonthlyNet)}
                positive={analysis.ownerMonthlyNet >= 0}
              />
              <Term label="Deal score" value={`${analysis.dealScore}/100`} />
            </CardContent>
          </Card>

          {/* Messaging */}
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <MessageThread
                proposalId={pr.id}
                currentUserId={user.id}
                initialMessages={(messages ?? []) as Message[]}
              />
            </CardContent>
          </Card>

          {/* Payments */}
          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {payments.slice(0, 12).map((pay) => (
                  <div
                    key={pay.id}
                    className="flex items-center justify-between border-b py-2 text-sm last:border-0"
                  >
                    <span>{formatDate(pay.due_date)}</span>
                    <span className="font-medium">
                      {formatCurrency(pay.amount)}
                    </span>
                    <StatusBadge status={pay.status} />
                  </div>
                ))}
                {payments.length > 12 && (
                  <p className="pt-2 text-xs text-muted-foreground">
                    +{payments.length - 12} more scheduled payments
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Counterpart */}
          <Card>
            <CardHeader>
              <CardTitle>{isOperator ? "Owner" : "Operator"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {counterpart.company_name || counterpart.full_name || "User"}
              </p>
              {counterpart.bio && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {counterpart.bio}
                </p>
              )}
              {counterpart.is_verified && (
                <span className="mt-2 inline-block text-xs font-medium text-success">
                  ✓ Verified
                </span>
              )}
            </CardContent>
          </Card>

          {/* Negotiation actions */}
          {(isOwner || isOperator) && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ProposalActions
                  proposalId={pr.id}
                  role={viewerRole}
                  status={pr.status}
                />
                {["rejected", "withdrawn"].includes(pr.status) && (
                  <p className="text-sm text-muted-foreground">
                    This proposal is closed.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Agreement */}
          {agreement && (
            <AgreementPanel
              agreement={agreement as Agreement}
              role={viewerRole}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Term({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          "font-medium " +
          (positive === undefined
            ? ""
            : positive
              ? "text-success"
              : "text-destructive")
        }
      >
        {value}
      </p>
    </div>
  );
}
