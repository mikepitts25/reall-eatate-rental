import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatRelative } from "@/lib/format";

export const metadata = { title: "Proposals" };

export default async function ProposalsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const role = user.profile.role;

  // Owners see proposals on their listings; operators see their submissions.
  let query = supabase
    .from("proposals")
    .select(
      "*, properties(title, city, state), operator:profiles!proposals_operator_id_fkey(full_name, company_name)"
    )
    .order("created_at", { ascending: false });

  if (role === "owner") query = query.eq("owner_id", user.id);
  else if (role === "operator") query = query.eq("operator_id", user.id);

  const { data } = await query;
  const proposals = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Proposals</h1>
        <p className="text-muted-foreground">
          {role === "owner"
            ? "Review and compare offers on your listings."
            : role === "operator"
              ? "Track the offers you've submitted."
              : "All proposals across the marketplace."}
        </p>
      </div>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No proposals yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{proposals.length} proposal(s)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {proposals.map((pr) => {
              const property = pr.properties as unknown as {
                title: string;
                city: string | null;
                state: string | null;
              } | null;
              const operator = pr.operator as unknown as {
                full_name: string | null;
                company_name: string | null;
              } | null;
              return (
                <Link
                  key={pr.id}
                  href={`/proposals/${pr.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {property?.title ?? "Property"}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {role !== "operator" &&
                        (operator?.company_name || operator?.full_name) +
                          " · "}
                      {[property?.city, property?.state]
                        .filter(Boolean)
                        .join(", ")}{" "}
                      · {formatRelative(pr.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {formatCurrency(pr.offered_monthly_rent)}/mo
                    </span>
                    <StatusBadge status={pr.status} />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
