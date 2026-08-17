import { z } from "zod";

export interface FootballProvider {
  name: string;
  getCompetitions(): Promise<ExternalCompetition[]>;
  getTeams(competitionId: string, season: number): Promise<ExternalTeam[]>;
  getFixtures(params: { competitionId?: string; season?: number; from?: string; to?: string; live?: boolean }): Promise<ExternalFixture[]>;
}

export interface ExternalCompetition {
  id: string;
  name: string;
  type: string;
  country: string;
  countryCode?: string;
  logo?: string;
}

export interface ExternalTeam {
  id: string;
  name: string;
  logo?: string;
  country?: string;
}

export interface ExternalFixture {
  id: string;
  externalCompetitionId: string;
  season: number;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string; // ISO UTC
  status: string;
  venue?: string;
  round?: string;
  homeScore?: number;
  awayScore?: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
}
