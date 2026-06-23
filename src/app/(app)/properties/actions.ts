"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { propertySchema } from "@/lib/validations";

export interface PropertyFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function toNumberOrNull(v: FormDataEntryValue | null): number | null {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function createPropertyAction(
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const user = await requireRole(["owner", "admin"]);

  const parsed = propertySchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .insert({
      owner_id: user.id,
      title: d.title,
      description: d.description || null,
      property_type: d.property_type,
      status: d.status,
      address_line1: d.address_line1 || null,
      city: d.city,
      state: d.state,
      postal_code: d.postal_code || null,
      bedrooms: toNumberOrNull(formData.get("bedrooms")),
      bathrooms: toNumberOrNull(formData.get("bathrooms")),
      square_feet: toNumberOrNull(formData.get("square_feet")),
      monthly_mortgage: d.monthly_mortgage,
      estimated_market_rent: d.estimated_market_rent,
      desired_monthly_rent: d.desired_monthly_rent,
      lease_restrictions: d.lease_restrictions || null,
      min_lease_months: d.min_lease_months,
      available_from: d.available_from || null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/properties/mine");
  revalidatePath("/dashboard");
  redirect(`/properties/${data.id}`);
}

export async function updatePropertyStatusAction(
  propertyId: string,
  status: "active" | "draft" | "archived"
): Promise<{ error?: string }> {
  await requireRole(["owner", "admin"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({ status })
    .eq("id", propertyId);

  if (error) return { error: error.message };
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/properties/mine");
  return {};
}
