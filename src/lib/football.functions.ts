import { createServerFn } from "@tanstack/react-start";
// import { supabaseAdmin } from "@/integrations/supabase/client.server";



export const getFixtures = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const { getPublicSupabaseServerClient } = await import(
        "@/integrations/supabase/public.server"
      );
      const supabase = getPublicSupabaseServerClient();
      const { data: settings } = await supabase
        .from("app_settings")
        .select("football_data_mode")
        .maybeSingle();

    const mode = settings?.football_data_mode || 'SIMULATION';
    const isSimulated = mode === 'SIMULATION';

      const { data, error } = await supabase
        .from("fixtures")
        .select(`
        id,
        start_time,
        status,
        home_score,
        away_score,
        is_simulated,
        competitions (name),
        home:teams!home_team_id (name, logo_url),
        away:teams!away_team_id (name, logo_url),
        markets (
          id,
          name,
          category,
          market_options (
            id,
            name,
            odd
          )
        )
        `)
        .eq("is_simulated", isSimulated)
        .order("start_time", { ascending: true });

      if (error) {
        console.warn("[Football] Unable to load public fixtures:", error.message);
        return [];
      }

      return (data as any[]).map((f) => ({
      id: f.id,
      competition_name: f.competitions?.name,
      home_team_name: f.home?.name,
      away_team_name: f.away?.name,
      home_team_logo: f.home?.logo_url,
      away_team_logo: f.away?.logo_url,
      start_time: f.start_time,
      status: f.status,
      home_score: f.home_score,
      away_score: f.away_score,
      markets: (f.markets || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        options: (m.market_options || []).map((o: any) => ({
          id: o.id,
          name: o.name,
          odd: Number(o.odd),
        })),
      })),
      }));
    } catch (error) {
      console.warn(
        "[Football] Public fixtures are temporarily unavailable:",
        error instanceof Error ? error.message : "unknown error",
      );
      return [];
    }
  });

export const getCompetitions = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const { getPublicSupabaseServerClient } = await import(
        "@/integrations/supabase/public.server"
      );
      const supabase = getPublicSupabaseServerClient();
      const { data: settings } = await supabase
        .from("app_settings")
        .select("football_data_mode")
        .maybeSingle();

    const mode = settings?.football_data_mode || 'SIMULATION';
    const isSimulated = mode === 'SIMULATION';

      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .eq("is_active", true)
        .eq("is_simulated", isSimulated)
        .order("name", { ascending: true });

      if (error) {
        console.warn("[Football] Unable to load public competitions:", error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn(
        "[Football] Public competitions are temporarily unavailable:",
        error instanceof Error ? error.message : "unknown error",
      );
      return [];
    }
  });
