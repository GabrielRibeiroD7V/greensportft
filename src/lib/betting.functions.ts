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
    // In a real scenario, we would fetch fresh odds from the provider here.
    // For Phase 4 simulation, we verify against the DB.
    for (const selection of data.selections) {
      const { data: fixture } = await supabase
        .from('fixtures')
        .select('status, start_time')
        .eq('id', selection.fixtureId)
        .single();
        
      if (!fixture || fixture.status !== 'NS') {
        throw new Error("FIXTURE_UNAVAILABLE");
      }

      if (new Date(fixture.start_time) <= new Date()) {
        throw new Error("FIXTURE_STARTED");
      }

      // Check for odd changes (simulation)
      const { data: option } = await supabase
        .from('market_options')
        .select('odd')
        .eq('id', selection.fixtureId) // This is simplified for simulation
        .single();

      if (option && Math.abs(option.odd - selection.odd) > 0.001) {
        throw new Error("ODDS_CHANGED");
      }
    }

    const selections = data.selections.map(s => ({
      fixture_id: s.fixtureId,
      market_name: s.marketName,
      selection_name: s.selectionName,
      odd: s.odd
    }));

    const { data: ticketId, error: rpcError } = await supabase.rpc('place_bet', {
      p_user_id: user.id,
      p_stake: data.stake,
      p_selections: selections,
      p_idempotency_key: data.idempotencyKey
    });

    if (rpcError) {
      if (rpcError.message.includes('insufficient_balance')) throw new Error("INSUFFICIENT_BALANCE");
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
