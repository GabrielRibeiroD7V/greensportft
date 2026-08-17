import { FootballProvider, ExternalCompetition, ExternalTeam, ExternalFixture } from "./provider.interface";

export class ApiFootballProvider implements FootballProvider {
  name = "api-football";
  private baseUrl = "https://v3.football.api-sports.io";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

    const response = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-key": this.apiKey,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
    });

    if (!response.ok) {
      throw new Error(`API-Football error: ${response.statusText}`);
    }

    return response.json();
  }

  async getCompetitions(): Promise<ExternalCompetition[]> {
    const data = await this.fetch("/leagues");
    return data.response.map((item: any) => ({
      id: item.league.id.toString(),
      name: item.league.name,
      type: item.league.type,
      country: item.country.name,
      countryCode: item.country.code,
      logo: item.league.logo,
    }));
  }

  async getTeams(competitionId: string, season: number): Promise<ExternalTeam[]> {
    const data = await this.fetch("/teams", { league: competitionId, season: season.toString() });
    return data.response.map((item: any) => ({
      id: item.team.id.toString(),
      name: item.team.name,
      logo: item.team.logo,
      country: item.team.country,
    }));
  }

  async getFixtures(params: { competitionId?: string; season?: number; from?: string; to?: string; live?: boolean }): Promise<ExternalFixture[]> {
    const query: Record<string, string> = {};
    if (params.competitionId) query.league = params.competitionId;
    if (params.season) query.season = params.season.toString();
    if (params.from) query.from = params.from;
    if (params.to) query.to = params.to;
    if (params.live) query.live = "all";

    const data = await this.fetch("/fixtures", query);
    return data.response.map((item: any) => ({
      id: item.fixture.id.toString(),
      externalCompetitionId: item.league.id.toString(),
      season: item.league.season,
      homeTeamId: item.teams.home.id.toString(),
      awayTeamId: item.teams.away.id.toString(),
      startTime: item.fixture.date,
      status: item.fixture.status.short,
      venue: item.fixture.venue.name,
      round: item.league.round,
      homeScore: item.goals.home,
      awayScore: item.goals.away,
      homeTeamName: item.teams.home.name,
      awayTeamName: item.teams.away.name,
      homeTeamLogo: item.teams.home.logo,
      awayTeamLogo: item.teams.away.logo,
    }));
  }
}
