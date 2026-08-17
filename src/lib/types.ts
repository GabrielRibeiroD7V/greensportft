import { z } from "zod";

export const ticketStatusSchema = z.enum(["PENDING", "WON", "LOST", "VOID", "CANCELLED"]);
export type TicketStatus = z.infer<typeof ticketStatusSchema>;

export const selectionStatusSchema = z.enum(["pending", "won", "lost", "void"]);
export type SelectionStatus = z.infer<typeof selectionStatusSchema>;

export type FixtureStatus = 'NS' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'POSTPONED' | 'CANCELLED' | 'SUSPENDED' | 'ABANDONED';

export interface BettingTicketItem {
  id: string;
  fixture_id: string;
  market_name: string;
  selection_name: string;
  odd: number;
  status: SelectionStatus;
}

export interface BettingTicket {
  id: string;
  ticket_code: string;
  total_odd: number;
  stake: number;
  potential_return: number;
  status: TicketStatus;
  created_at: string;
  items?: BettingTicketItem[];
}

export interface Competition {
  id: string;
  name: string;
  country: string | null;
  country_code: string | null;
  logo_url: string | null;
  type: 'league' | 'cup' | null;
  is_active: boolean;
}

export interface Fixture {
  id: string;
  competition_name: string;
  home_team_name: string;
  away_team_name: string;
  home_team_logo?: string;
  away_team_logo?: string;
  start_time: string;
  status: string;
  home_score?: number | null;
  away_score?: number | null;
  markets?: Market[];
}

export interface Market {
  id: string;
  name: string;
  category: string;
  options: MarketOption[];
  status?: 'OPEN' | 'SUSPENDED' | 'CLOSED' | 'SETTLED';
}

export interface MarketOption {
  id: string;
  name: string;
  odd: number;
  status?: 'OPEN' | 'SUSPENDED' | 'CLOSED' | 'SETTLED';
}
