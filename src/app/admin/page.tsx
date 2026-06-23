import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { AdminListingModeration } from "@/components/admin-listing-moderation";
import { formatCurrency, formatDate, humanize } from "@/lib/format";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [{ data: users }, { data: listings }, { data: proposals }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("properties")
        .select("*, owner:profiles!properties_owner_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("proposals")
        .select("*, properties(title)")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, moderate listings, and monitor proposals.
        </p>
      </div>

      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">
            Listings ({listings?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="users">Users ({users?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="proposals">
            Proposals ({proposals?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Listings moderation */}
        <TabsContent value="listings">
          <Card>
            <CardHeader>
              <CardTitle>Listing moderation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(listings ?? []).map((l) => {
                const owner = l.owner as unknown as {
                  full_name: string | null;
                } | null;
                return (
                  <div
                    key={l.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{l.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {owner?.full_name ?? "—"} ·{" "}
                        {[l.city, l.state].filter(Boolean).join(", ")} ·{" "}
                        {formatCurrency(l.desired_monthly_rent)}/mo
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={l.status} />
                      <AdminListingModeration
                        propertyId={l.id}
                        status={l.status}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(users ?? []).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {u.full_name ?? u.email ?? "User"}
                      {u.company_name ? ` · ${u.company_name}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {u.email} · joined {formatDate(u.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.is_verified && (
                      <Badge variant="success">Verified</Badge>
                    )}
                    <Badge variant="secondary">{humanize(u.role)}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proposals monitoring */}
        <TabsContent value="proposals">
          <Card>
            <CardHeader>
              <CardTitle>Proposal monitoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(proposals ?? []).map((p) => {
                const property = p.properties as unknown as {
                  title: string;
                } | null;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {property?.title ?? "Property"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(p.offered_monthly_rent)}/mo ·{" "}
                        {p.lease_term_months} mo · {formatDate(p.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
