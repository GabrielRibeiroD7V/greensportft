import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Fixture } from "./types";

export const getFixtures = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("fixtures")
    .select(`
      id,
      start_time,
      status,
      home_score,
      away_score,
      competitions (name),
      home:teams!home_team_id (name),
      away:teams!away_team_id (name),
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
    .order("start_time", { ascending: true });

  if (error) throw error;

  return (data as any[]).map((f) => ({
    id: f.id,
    competition_name: f.competitions?.name,
    home_team_name: f.home?.name,
    away_team_name: f.away?.name,
    start_time: f.start_time,
    status: f.status,
    home_score: f.home_score,
    away_score: f.away_score,
    markets: f.markets.map((m: any) => ({
      id: m.id,
      name: m.name,
      category: m.category,
      options: m.market_options.map((o: any) => ({
        id: o.id,
        name: o.name,
        odd: Number(o.odd),
      })),
    })),
  })) as Fixture[];
});
