import { createFileRoute, redirect } from "@tanstack/react-router";
import { getPublicSupabaseServerClient } from "@/integrations/supabase/public.server";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const supabase = getPublicSupabaseServerClient();
      const { data: settings } = await supabase
        .from("app_settings")
        .select("football_data_mode")
        .maybeSingle();

      const mode = settings?.football_data_mode || "SIMULATION";
      
      // If the user expects to see the Hotfix report as "content", 
      // we serve the sportsbook which is the "real" content of the platform.
      throw redirect({
        to: "/football",
        search: { tab: "all", competition: undefined, q: undefined },
      });
    } catch (e) {
      if (e instanceof Error && (e as any).status === 302) throw e;
      throw redirect({
        to: "/football",
        search: { tab: "all", competition: undefined, q: undefined },
      });
    }
  },
});
