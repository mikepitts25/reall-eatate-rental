"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin moderation. Uses the service-role client to act across all rows, but
 * only after confirming the caller is an admin via the cookie-bound session.
 */
export async function moderateListingAction(
  propertyId: string,
  status: "active" | "archived"
): Promise<{ error?: string }> {
  const admin = await requireRole("admin");

  const service = createAdminClient();
  const { error } = await service
    .from("properties")
    .update({ status })
    .eq("id", propertyId);

  if (error) return { error: error.message };

  // Audit via the user-scoped client so actor_id RLS check passes.
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "admin.moderate_listing",
    entity_type: "property",
    entity_id: propertyId,
    metadata: { status },
  });

  revalidatePath("/admin");
  return {};
}

export async function setUserVerifiedAction(
  userId: string,
  isVerified: boolean
): Promise<{ error?: string }> {
  await requireRole("admin");
  const service = createAdminClient();
  const { error } = await service
    .from("profiles")
    .update({ is_verified: isVerified })
    .eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return {};
}
