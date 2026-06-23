import Link from "next/link";
import Image from "next/image";
import { Bath, Bed, MapPin, Ruler } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, humanize } from "@/lib/format";
import { quickListingRoi } from "@/lib/finance";
import type { Property, PropertyPhoto } from "@/lib/supabase/database.types";

type PropertyWithPhotos = Property & {
  property_photos?: Pick<PropertyPhoto, "public_url" | "is_cover">[];
};

export function PropertyCard({
  property,
  showStatus = false,
  href,
}: {
  property: PropertyWithPhotos;
  showStatus?: boolean;
  href?: string;
}) {
  const cover =
    property.property_photos?.find((p) => p.is_cover)?.public_url ??
    property.property_photos?.[0]?.public_url ??
    null;
  const roi = quickListingRoi(property);

  return (
    <Link href={href ?? `/properties/${property.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {cover ? (
            <Image
              src={cover}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No photo
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge variant="secondary">{humanize(property.property_type)}</Badge>
            {showStatus && <StatusBadge status={property.status} />}
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-1 font-semibold">{property.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {[property.city, property.state].filter(Boolean).join(", ") || "—"}
          </p>

          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            {property.bedrooms != null && (
              <span className="flex items-center gap-1">
                <Bed className="h-4 w-4" /> {property.bedrooms}
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath className="h-4 w-4" /> {property.bathrooms}
              </span>
            )}
            {property.square_feet != null && (
              <span className="flex items-center gap-1">
                <Ruler className="h-4 w-4" /> {property.square_feet} sqft
              </span>
            )}
          </div>

          <div className="mt-4 flex items-end justify-between border-t pt-3">
            <div>
              <p className="text-xs text-muted-foreground">Owner asks</p>
              <p className="text-lg font-bold">
                {formatCurrency(property.desired_monthly_rent)}
                <span className="text-sm font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Est. profit</p>
              <p
                className={
                  "text-lg font-bold " +
                  (roi.monthlyProfit >= 0 ? "text-success" : "text-destructive")
                }
              >
                {formatCurrency(roi.monthlyProfit)}
                <span className="text-sm font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
