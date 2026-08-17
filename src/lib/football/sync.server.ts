import { FootballProvider, ExternalTeam, ExternalFixture } from "./provider.interface";
import { ApiFootballProvider } from "./api-football.provider";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function getProvider(): Promise<FootballProvider> {
  const apiKey = process.env['API_FOOTBALL_KEY'];
  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY not configured in environment");
  }
  return new ApiFootballProvider(apiKey);
}

export async function syncCompetitions() {
  const provider = await getProvider();
  const externalCompetitions = await provider.getCompetitions();
  
  const enabledLeagues = [
    "Brasileirão Série A", "Brasileirão Série B", "Copa do Brasil",
    "Premier League", "Championship", "La Liga", "Serie A", "Bundesliga", 
    "Ligue 1", "Primeira Liga", "UEFA Champions League", "UEFA Europa League",
    "CONMEBOL Libertadores", "CONMEBOL Sul-Americana"
  ];

  const filtered = externalCompetitions.filter(c => enabledLeagues.includes(c.name));
  
  let created = 0;
  let updated = 0;

  for (const ext of filtered) {
    const { data: comp, error: upsertError } = await supabaseAdmin
      .from("competitions")
      .upsert({
        name: ext.name,
        country: ext.country || null,
        country_code: ext.countryCode || null,
        logo_url: ext.logo || null,
        type: ext.type || null,
        provider_id: ext.id
      }, { onConflict: 'provider_id' })
      .select()
      .single();

    if (upsertError) continue;

    await supabaseAdmin.from("provider_mappings").upsert({
      internal_id: comp.id,
      provider: provider.name,
      provider_entity_id: ext.id,
      entity_type: 'competition'
    }, { onConflict: 'provider,provider_entity_id,entity_type' });
    
    created++;
  }

  return { received: filtered.length, created, updated };
}

async function getOrSyncTeam(provider: FootballProvider, extId: string, name: string, logo?: string) {
  const { data: mapping } = await supabaseAdmin
    .from("provider_mappings")
    .select("internal_id")
    .eq("provider", provider.name)
    .eq("provider_entity_id", extId)
    .eq("entity_type", "team")
    .single();
  
  if (mapping) return mapping.internal_id;

  const { data: team, error: teamError } = await supabaseAdmin
    .from("teams")
    .upsert({
      name,
      logo_url: logo || null,
      provider_id: extId
    }, { onConflict: 'provider_id' })
    .select()
    .single();

  if (teamError || !team) throw teamError || new Error("Team upsert failed");

  await supabaseAdmin.from("provider_mappings").upsert({
    internal_id: team.id,
    provider: provider.name,
    provider_entity_id: extId,
    entity_type: 'team'
  }, { onConflict: 'provider,provider_entity_id,entity_type' });

  return team.id;
}

export async function syncFixtures(competitionId: string, season: number) {
  const provider = await getProvider();
  const { data: internalComp } = await supabaseAdmin
    .from("competitions")
    .select("id, provider_id")
    .eq("id", competitionId)
    .single();

  if (!internalComp?.provider_id) throw new Error("Competition provider mapping missing");

  const extFixtures = await provider.getFixtures({ 
    competitionId: internalComp.provider_id, 
    season 
  });

  // 1. Sync Season
  await supabaseAdmin.from("seasons").upsert({
    competition_id: internalComp.id,
    year: season,
    is_current: true
  }, { onConflict: 'competition_id,year' });

  let created = 0;
  for (const ext of extFixtures) {
    try {
      const homeTeamId = await getOrSyncTeam(provider, ext.homeTeamId, ext.homeTeamName, ext.homeTeamLogo);
      const awayTeamId = await getOrSyncTeam(provider, ext.awayTeamId, ext.awayTeamName, ext.awayTeamLogo);

      const { data: fixture } = await supabaseAdmin
        .from("fixtures")
        .upsert({
          competition_id: internalComp.id,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          start_time: ext.startTime,
          status: ext.status,
          home_score: ext.homeScore ?? null,
          away_score: ext.awayScore ?? null,
          venue: ext.venue || null,
          round: ext.round || null,
          provider_id: ext.id,
          last_sync: new Date().toISOString()
        }, { onConflict: 'provider_id' })
        .select()
        .single();

      if (fixture) {
        await supabaseAdmin.from("provider_mappings").upsert({
          internal_id: fixture.id,
          provider: provider.name,
          provider_entity_id: ext.id,
          entity_type: 'fixture'
        }, { onConflict: 'provider,provider_entity_id,entity_type' });
        created++;
      }
    } catch (e) {
      console.error(`Error syncing fixture ${ext.id}:`, e);
    }
  }

  return { received: extFixtures.length, created };
}
