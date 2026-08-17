import { OddsProvider } from "./provider.interface";
import { ApiFootballOddsProvider } from "./api-football.provider";
// import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function getOddsProvider(): Promise<OddsProvider> {
  const apiKey = process.env['API_FOOTBALL_KEY'];
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error("PROVIDER_NOT_CONFIGURED");
  }
  return new ApiFootballOddsProvider(apiKey);
}

export async function syncFixtureOdds(fixtureId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: fixture } = await supabaseAdmin
    .from("fixtures")
    .select("provider_id, id")
    .eq("id", fixtureId)
    .single();

  if (!fixture?.provider_id) return { success: false, message: "Fixture provider ID missing" };

  try {
    const provider = await getOddsProvider();
    const externalOdds = await provider.getFixtureOdds(fixture.provider_id);
    
    // Logic for upserting odds into market_options with internal mapping would go here
    // Registering UNMAPPED_MARKET if not in market_mappings
    
    return { success: true, count: externalOdds.length };
  } catch (e: any) {
    if (e.message === "PROVIDER_NOT_CONFIGURED") return { success: false, message: "Simulation active (No API Key)" };
    throw e;
  }
}

export async function syncPreMatchOdds() {
  // Sync logic for upcoming fixtures
}

export async function syncLiveOdds() {
  // Sync logic for live fixtures
}
