import { OddsProvider, ExternalFixtureOdds, MarketStatus } from "./provider.interface";

export class ApiFootballOddsProvider implements OddsProvider {
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
      if (response.status === 429) throw new Error("RATE_LIMITED");
      if (response.status === 401 || response.status === 403) throw new Error("INVALID_CREDENTIALS");
      throw new Error(`API-Football error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
      const errorStr = JSON.stringify(data.errors);
      if (errorStr.includes("token") || errorStr.includes("key")) throw new Error("INVALID_CREDENTIALS");
      throw new Error(`API-Football provider error: ${errorStr}`);
    }
    return data;
  }

  async getFixtureOdds(externalFixtureId: string): Promise<ExternalFixtureOdds[]> {
    const data = await this.fetch("/odds", { fixture: externalFixtureId });
    
    // API-Football returns a list of bookmakers, we usually pick the first one or a specific one like 1xBet / Bet365
    const odds = data.response[0];
    if (!odds) return [];

    const bookmaker = odds.bookmakers[0];
    if (!bookmaker) return [];

    return bookmaker.bets.map((bet: any) => ({
      marketName: bet.name,
      selections: bet.values.map((val: any) => ({
        name: val.value,
        odd: parseFloat(val.odd),
        status: 'OPEN' as MarketStatus // API-Football basic odds doesn't always include live status in this endpoint
      }))
    }));
  }
}
