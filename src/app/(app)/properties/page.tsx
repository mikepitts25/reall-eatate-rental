import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PropertyCard } from "@/components/property-card";
import { PropertyFilters } from "@/components/property-filters";
import { propertyFilterSchema } from "@/lib/validations";
import { quickListingRoi } from "@/lib/finance";
import type { Property, PropertyPhoto } from "@/lib/supabase/database.types";

export const metadata = { title: "Marketplace" };

type Row = Property & {
  property_photos: Pick<PropertyPhoto, "public_url" | "is_cover">[];
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;
  const filters = propertyFilterSchema.parse(sp);
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select(
      "*, property_photos(public_url, is_cover)"
    )
    .eq("status", "active");

  if (filters.q) {
    query = query.or(
      `title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,city.ilike.%${filters.q}%`
    );
  }
  if (filters.city) query = query.ilike("city", `%${filters.city}%`);
  if (filters.property_type)
    query = query.eq("property_type", filters.property_type);

  // Primary sort handled in SQL where possible; ROI sort done in memory.
  if (filters.sort === "rent_low")
    query = query.order("desired_monthly_rent", { ascending: true });
  else if (filters.sort === "rent_high")
    query = query.order("desired_monthly_rent", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query.limit(60);
  let rows = (data ?? []) as Row[];

  // Derived ROI filter + sort (computed app-side from the finance engine).
  if (filters.min_roi != null && !Number.isNaN(filters.min_roi)) {
    rows = rows.filter(
      (r) => quickListingRoi(r).monthlyProfit >= filters.min_roi!
    );
  }
  if (filters.sort === "roi") {
    rows = [...rows].sort(
      (a, b) => quickListingRoi(b).monthlyProfit - quickListingRoi(a).monthlyProfit
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground">
          Browse active listings and find your next operating opportunity.
        </p>
      </div>

      <PropertyFilters />

      {error ? (
        <p className="text-destructive">Failed to load listings.</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          No properties match your filters.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
