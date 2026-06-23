import Link from "next/link";
import { Building2, FileText, Plus, Search, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatRelative } from "@/lib/format";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const role = user.profile.role;

  if (role === "owner") return <OwnerDashboard userId={user.id} name={user.profile.full_name} supabase={supabase} />;
  if (role === "operator") return <OperatorDashboard userId={user.id} name={user.profile.full_name} supabase={supabase} />;
  return <AdminDashboard name={user.profile.full_name} supabase={supabase} />;
}

type DB = Awaited<ReturnType<typeof createClient>>;

function Greeting({ name }: { name: string | null }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">
        Welcome back{name ? `, ${name.split(" ")[0]}` : ""}
      </h1>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      </CardContent>
    </Card>
  );
}

async function OwnerDashboard({
  userId,
  name,
  supabase,
}: {
  userId: string;
  name: string | null;
  supabase: DB;
}) {
  const [{ data: properties }, { count: proposalCount }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, title, status, desired_monthly_rent, created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("status", "pending"),
  ]);

  const activeCount =
    properties?.filter((p) => p.status === "active").length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Greeting name={name} />
        <Button asChild>
          <Link href="/properties/new">
            <Plus className="h-4 w-4" /> New listing
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Listings" value={properties?.length ?? 0} icon={Building2} />
        <StatCard label="Active" value={activeCount} icon={TrendingUp} />
        <StatCard label="Pending proposals" value={proposalCount ?? 0} icon={FileText} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your recent listings</CardTitle>
          <CardDescription>Manage properties and review offers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {properties && properties.length > 0 ? (
            properties.map((p) => (
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Asking {formatCurrency(p.desired_monthly_rent)}/mo ·{" "}
                    {formatRelative(p.created_at)}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))
          ) : (
            <EmptyState
              title="No listings yet"
              body="Create your first property listing to start receiving proposals."
              href="/properties/new"
              cta="Create listing"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function OperatorDashboard({
  userId,
  name,
  supabase,
}: {
  userId: string;
  name: string | null;
  supabase: DB;
}) {
  const [{ data: proposals }, { count: activeListings }] = await Promise.all([
    supabase
      .from("proposals")
      .select("id, status, offered_monthly_rent, created_at, properties(title)")
      .eq("operator_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const pending = proposals?.filter((p) => p.status === "pending").length ?? 0;
  const accepted = proposals?.filter((p) => p.status === "accepted").length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Greeting name={name} />
        <Button asChild>
          <Link href="/properties">
            <Search className="h-4 w-4" /> Browse marketplace
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open opportunities" value={activeListings ?? 0} icon={Building2} />
        <StatCard label="Pending proposals" value={pending} icon={FileText} />
        <StatCard label="Accepted" value={accepted} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your recent proposals</CardTitle>
          <CardDescription>Track the offers you&apos;ve submitted.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {proposals && proposals.length > 0 ? (
            proposals.map((p) => {
              const property = p.properties as unknown as { title: string } | null;
              return (
                <Link
                  key={p.id}
                  href={`/proposals/${p.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{property?.title ?? "Property"}</p>
                    <p className="text-sm text-muted-foreground">
                      Offered {formatCurrency(p.offered_monthly_rent)}/mo ·{" "}
                      {formatRelative(p.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              );
            })
          ) : (
            <EmptyState
              title="No proposals yet"
              body="Browse the marketplace and submit your first proposal."
              href="/properties"
              cta="Browse listings"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function AdminDashboard({
  name,
  supabase,
}: {
  name: string | null;
  supabase: DB;
}) {
  const [users, listings, proposals, agreements] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("proposals").select("id", { count: "exact", head: true }),
    supabase.from("agreements").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-8">
      <Greeting name={name} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={users.count ?? 0} icon={Building2} />
        <StatCard label="Listings" value={listings.count ?? 0} icon={Search} />
        <StatCard label="Proposals" value={proposals.count ?? 0} icon={FileText} />
        <StatCard label="Agreements" value={agreements.count ?? 0} icon={TrendingUp} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Admin tools</CardTitle>
          <CardDescription>Moderate listings and monitor activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/admin">Open admin dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      <Button asChild size="sm">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}
