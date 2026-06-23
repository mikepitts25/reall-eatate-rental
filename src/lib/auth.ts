import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/database.types";

export interface SessionUser {
  id: string;
  email: string | null;
  profile: Profile;
}

/**
 * Load the current user + profile. Returns null when signed out.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { id: user.id, email: user.email ?? null, profile };
}

/**
 * Require an authenticated user. Redirects to /login when signed out.
 */
export async function requireUser(redirectTo = "/login"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(redirectTo);
  return user;
}

/**
 * Require one of the given roles. Redirects unauthenticated users to /login and
 * authenticated-but-unauthorized users to /dashboard.
 */
export async function requireRole(
  roles: UserRole | UserRole[]
): Promise<SessionUser> {
  const user = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.profile.role)) {
    redirect("/dashboard");
  }
  return user;
}

export function isOwner(user: SessionUser | null): boolean {
  return user?.profile.role === "owner";
}
export function isOperator(user: SessionUser | null): boolean {
  return user?.profile.role === "operator";
}
export function isAdmin(user: SessionUser | null): boolean {
  return user?.profile.role === "admin";
}
