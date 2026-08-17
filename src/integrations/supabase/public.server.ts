import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let publicServerClient: ReturnType<typeof createClient<Database>> | undefined;

export function getPublicSupabaseServerClient() {
  if (publicServerClient) return publicServerClient;

  // Use VITE_ variables if process.env is not available (browser context)
  const supabaseUrl =
    (typeof process !== 'undefined' && process.env ? process.env["SUPABASE_URL"] : null) || 
    import.meta.env["VITE_SUPABASE_URL"];
    
  const publishableKey =
    (typeof process !== 'undefined' && process.env ? process.env["SUPABASE_PUBLISHABLE_KEY"] : null) ||
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Public Supabase configuration is unavailable.");
  }

  publicServerClient = createClient<Database>(supabaseUrl, publishableKey, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return publicServerClient;
}