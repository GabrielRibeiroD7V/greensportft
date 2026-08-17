import { z } from "zod";

export type MarketStatus = 'OPEN' | 'SUSPENDED' | 'CLOSED' | 'STALE' | 'SETTLED';

export interface OddsProvider {
  name: string;
  getFixtureOdds(externalFixtureId: string): Promise<ExternalFixtureOdds[]>;
}

export interface ExternalFixtureOdds {
  marketName: string;
  selections: ExternalSelectionOdds[];
}

export interface ExternalSelectionOdds {
  name: string;
  odd: number;
  line?: string;
  status: MarketStatus;
}

export const INTERNAL_MARKETS = [
  "MATCH_WINNER",
  "DOUBLE_CHANCE",
  "TOTAL_GOALS",
  "BOTH_TEAMS_SCORE",
  "HOME_TEAM_TOTAL_GOALS",
  "AWAY_TEAM_TOTAL_GOALS",
  "TOTAL_CORNERS",
  "TOTAL_CARDS",
  "FIRST_HALF_RESULT",
  "FIRST_HALF_TOTAL_GOALS",
  "HANDICAP",
  "ASIAN_HANDICAP",
  "PLAYER_TO_SCORE"
] as const;

export type InternalMarket = typeof INTERNAL_MARKETS[number];
