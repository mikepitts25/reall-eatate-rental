import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Bath, Bed, CalendarDays, MapPin, Ruler } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { OperatorDealPanel } from "@/components/operator-deal-panel";
import { ProposalActions } from "@/components/proposal-actions";
import { OwnerListingControls } from "@/components/owner-listing-controls";
import { formatCurrency, formatDate, humanize } from "@/lib/format";
import type {
  Profile,
  Property,
  PropertyPhoto,
  Proposal,
} from "@/lib/supabase/database.types";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("*, property_photos(*)")
    .eq("id", id)
    .single();

  if (!property) notFound();

  const p = property as Property & { property_photos: PropertyPhoto[] };
  const role = user.profile.role;
  const isPropertyOwner = p.owner_id === user.id;
  const isOperator = role === "operator";
  const isAdmin = role === "admin";

  // Owner/admin: load incoming proposals with operator profiles.
  type ProposalWithOperator = Proposal & {
    operator: Pick<Profile, "full_name" | "company_name">;
  };
  let proposals: ProposalWithOperator[] | null = null;
  if (isPropertyOwner || isAdmin) {
    const { data } = await supabase
      .from("proposals")
      .select("*, operator:profiles!proposals_operator_id_fkey(full_name, company_name)")
      .eq("property_id", id)
      .order("offered_monthly_rent", { ascending: false });
    proposals = (data ?? []) as unknown as ProposalWithOperator[];
  }

  // Operator: have they already proposed?
  let alreadyProposed = false;
  if (isOperator) {
    const { count } = await supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("property_id", id)
      .eq("operator_id", user.id);
    alreadyProposed = (count ?? 0) > 0;
  }

  const photos = [...(p.property_photos ?? [])].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">{humanize(p.property_type)}</Badge>
            <StatusBadge status={p.status} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{p.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {[p.address_line1, p.city, p.state, p.postal_code]
              .filter(Boolean)
              .join(", ") || "Location not specified"}
          </p>
        </div>
        {(isPropertyOwner || isAdmin) && (
          <OwnerListingControls propertyId={p.id} status={p.status} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Gallery */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-xl">
              {photos.slice(0, 4).map((photo, i) => (
                <div
                  key={photo.id}
                  className={
                    "relative aspect-video bg-muted " +
                    (i === 0 && photos.length > 1 ? "col-span-2" : "")
                  }
                >
                  {photo.public_url && (
                    <Image
                      src={photo.public_url}
                      alt={p.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border bg-muted text-muted-foreground">
              No photos uploaded
            </div>
          )}

          {/* Quick facts */}
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
              <Fact icon={Bed} label="Bedrooms" value={p.bedrooms ?? "—"} />
              <Fact icon={Bath} label="Bathrooms" value={p.bathrooms ?? "—"} />
              <Fact
                icon={Ruler}
                label="Square feet"
                value={p.square_feet ?? "—"}
              />
              <Fact
                icon={CalendarDays}
                label="Available"
                value={p.available_from ? formatDate(p.available_from) : "—"}
              />
            </CardContent>
          </Card>

          {p.description && (
            <Card>
              <CardHeader>
                <CardTitle>About this property</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {p.description}
                </p>
              </CardContent>
            </Card>
          )}

          {p.lease_restrictions && (
            <Card>
              <CardHeader>
                <CardTitle>Lease restrictions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {p.lease_restrictions}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Financials */}
          <Card>
            <CardHeader>
              <CardTitle>Financials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FinRow label="Monthly mortgage" value={p.monthly_mortgage} />
              <FinRow label="Estimated market rent" value={p.estimated_market_rent} />
              <Separator />
              <FinRow
                label="Owner's guaranteed rent ask"
                value={p.desired_monthly_rent}
                emphasize
              />
              <p className="text-xs text-muted-foreground">
                Minimum lease: {p.min_lease_months} months
              </p>
            </CardContent>
          </Card>

          {/* Owner/admin: proposals */}
          {(isPropertyOwner || isAdmin) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Incoming proposals ({proposals?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {proposals && proposals.length > 0 ? (
                  proposals.map((pr) => (
                    <div key={pr.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {pr.operator.company_name ||
                              pr.operator.full_name ||
                              "Operator"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {pr.intended_use || "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {formatCurrency(pr.offered_monthly_rent)}/mo
                          </p>
                          <StatusBadge status={pr.status} />
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {pr.lease_term_months} mo term · deposit{" "}
                        {formatCurrency(pr.security_deposit)}
                      </p>
                      {pr.message && (
                        <p className="mt-2 rounded-md bg-muted p-2 text-sm">
                          {pr.message}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        {isPropertyOwner ? (
                          <ProposalActions
                            proposalId={pr.id}
                            role="owner"
                            status={pr.status}
                          />
                        ) : (
                          <span />
                        )}
                        <Link
                          href={`/proposals/${pr.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Open thread →
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No proposals yet.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: operator deal panel */}
        <div className="lg:col-span-1">
          {isOperator && p.status === "active" && (
            <OperatorDealPanel
              propertyId={p.id}
              marketRent={Number(p.estimated_market_rent)}
              desiredRent={Number(p.desired_monthly_rent)}
              monthlyMortgage={Number(p.monthly_mortgage)}
              minLeaseMonths={p.min_lease_months}
              alreadyProposed={alreadyProposed}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function FinRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number | string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={emphasize ? "font-medium" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={emphasize ? "text-lg font-bold" : "font-medium"}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
