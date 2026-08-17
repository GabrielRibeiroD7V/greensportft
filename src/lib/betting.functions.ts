import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { getPricingConfig } from "./pricing.server";

const betSelectionSchema = z.object({
  fixtureId: z.string().uuid(),
  marketName: z.string(),
  selectionName: z.string(),
  odd: z.number().positive(),
});

const placeBetSchema = z.object({
  selections: z.array(betSelectionSchema).min(1),
  stake: z.number().min(1),
  idempotencyKey: z.string().uuid(),
  oddSnapshot: z.any().optional(), // Snapshot of odds at time of bet
});

export const placeBet = createServerFn({ method: "POST" })
  .validator((data: unknown) => placeBetSchema.parse(data))
  .handler(async ({ data }) => {
    const config = await getPricingConfig();
    
    if (!config.betting_enabled) {
      throw new Error("BETTING_DISABLED");
    }
    
    if (data.stake < config.min_stake) {
      throw new Error("MIN_STAKE");
    }

    if (config.max_stake && data.stake > config.max_stake) {
      throw new Error("MAX_STAKE");
    }

    if (data.selections.length > config.max_ticket_selections) {
      throw new Error("TOO_MANY_SELECTIONS");
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("UNAUTHORIZED");
    }

    // Server-side validation of odds and market status
    for (const selection of data.selections) {
      // 1. Check for fixture isolation (Requirement #3)
      // Real fixtures MUST NOT use simulated odds
      const { data: fixture } = await supabase
        .from('fixtures')
        .select('status, start_time, is_simulated')
        .eq('id', selection.fixtureId)
        .single();
        
      if (!fixture) throw new Error("FIXTURE_NOT_FOUND");
      
      const status = fixture.status;
      if (!['NS', 'LIVE'].includes(status)) {
        throw new Error("FIXTURE_UNAVAILABLE");
      }

      if (new Date(fixture.start_time) <= new Date()) {
        throw new Error("FIXTURE_STARTED");
      }

      // Check for odds data mode alignment
      if (config.odds_data_mode === 'REAL' && fixture.is_simulated) {
        throw new Error("REAL_ODDS_REQUIRED_FOR_SIMULATED_FIXTURE_BLOCKED");
      }

      const { data: option } = await supabase
        .from('market_options')
        .select(`
          odd, 
          status, 
          last_provider_update, 
          is_simulated,
          market:markets!inner(
            fixture:fixtures!inner(
              id,
              is_simulated
            )
          )
        `)
        .eq('id', selection.fixtureId) // Selection ID is market_option ID in current schema
        .single();

      if (!option) throw new Error("ODD_NOT_FOUND");

      // Validate status
      if (option.status !== 'OPEN') {
        throw new Error(`ODD_${option.status}`);
      }
      
      // Requirement #3: Fixture real sem odds reais
      // If fixture is REAL, odds MUST be REAL (not simulated)
      if (!fixture.is_simulated && option.is_simulated) {
        throw new Error("REAL_FIXTURE_REQUIRES_REAL_ODDS");
      }
      
      // Check for STALE odds
      if (option.last_provider_update) {
        const lastUpdate = new Date(option.last_provider_update).getTime();
        const now = new Date().getTime();
        if ((now - lastUpdate) / 1000 > config.odds_stale_after_seconds) {
           throw new Error("ODD_STALE");
        }
      }

      if (Math.abs(option.odd - selection.odd) > 0.001) {
        return { 
          success: false, 
          error: "ODDS_CHANGED", 
          oldOdd: selection.odd, 
          newOdd: option.odd,
          fixtureId: selection.fixtureId
        };
      }
    }

    const selections = data.selections.map(s => ({
      fixture_id: s.fixtureId,
      market_name: s.marketName,
      selection_name: s.selectionName,
      odd: s.odd,
      odd_snapshot: data.oddSnapshot?.[s.fixtureId] || null,
      odd_status_at_bet: 'OPEN'
    }));

    const { data: ticketId, error: rpcError } = await supabase.rpc('place_bet', {
      p_user_id: user.id,
      p_stake: data.stake,
      p_selections: selections,
      p_idempotency_key: data.idempotencyKey
    });

    if (rpcError) {
      if (rpcError.message.includes('insufficient_balance')) throw new Error("INSUFFICIENT_BALANCE");
      // Wallet remains intact if RPC fails because it's an atomic transaction
      throw new Error(rpcError.message || "BET_ERROR");
    }

    // 3. Fetch ticket code for response
    const { data: ticket } = await supabase
      .from("betting_tickets")
      .select("ticket_code")
      .eq("id", ticketId)
      .single();

    return { success: true, ticketCode: ticket?.ticket_code };
  });
