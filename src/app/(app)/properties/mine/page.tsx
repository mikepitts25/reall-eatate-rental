import Link from "next/link";
import { Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/property-card";
import type { Property, PropertyPhoto } from "@/lib/supabase/database.types";

export const metadata = { title: "My Listings" };

type Row = Property & {
  property_photos: Pick<PropertyPhoto, "public_url" | "is_cover">[];
};

export default async function MyListingsPage() {
  const user = await requireRole(["owner", "admin"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("properties")
    .select("*, property_photos(public_url, is_cover)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
          <p className="text-muted-foreground">
            Manage your properties and review incoming proposals.
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/new">
            <Plus className="h-4 w-4" /> New listing
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="font-medium">No listings yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create your first property listing to start receiving guaranteed-rent
            proposals from operators.
          </p>
          <Button asChild size="sm">
            <Link href="/properties/new">Create listing</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <PropertyCard key={p.id} property={p} showStatus />
          ))}
        </div>
      )}
    </div>
  );
}
