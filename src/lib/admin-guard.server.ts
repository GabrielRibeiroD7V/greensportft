import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifies that the authenticated caller has the admin role.
 * Uses the caller's RLS-scoped client (never the service-role client) to read roles.
 */
export async function assertAdmin(userClient: SupabaseClient<any>, userId: string) {
  const { data, error } = await userClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) {
    throw new Error("FORBIDDEN: admin role required");
  }
}
