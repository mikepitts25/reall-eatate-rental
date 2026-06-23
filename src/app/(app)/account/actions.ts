"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const profileSchema = z.object({
  full_name: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  company_name: z.string().max(160).optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
});

export async function updateProfileAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  if (!parsed.success) return { error: "Please check your inputs." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name || null,
      phone: parsed.data.phone || null,
      company_name: parsed.data.company_name || null,
      bio: parsed.data.bio || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/account");
  return { success: true };
}
