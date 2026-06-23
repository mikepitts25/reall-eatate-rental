import { requireRole } from "@/lib/auth";
import { PropertyForm } from "./property-form";

export const metadata = { title: "New Listing" };

export default async function NewPropertyPage() {
  await requireRole(["owner", "admin"]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create a listing</h1>
        <p className="text-muted-foreground">
          Tell operators about your property and the guaranteed income you want.
        </p>
      </div>
      <PropertyForm />
    </div>
  );
}
