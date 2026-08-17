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
      throw new Error("As apostas estão temporariamente desabilitadas.");
    }
    
    if (data.stake < config.min_stake) {
      throw new Error(`Aposta mínima é de R$ ${config.min_stake.toFixed(2)}`);
    }

    if (config.max_stake && data.stake > config.max_stake) {
      throw new Error(`Aposta máxima é de R$ ${config.max_stake.toFixed(2)}`);
    }

    if (data.selections.length > config.max_ticket_selections) {
      throw new Error(`Máximo de ${config.max_ticket_selections} seleções por bilhete.`);
    }

    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Prepare selections for PostgreSQL JSONB
    const selections = data.selections.map(s => ({
      fixture_id: s.fixtureId,
      market_name: s.marketName,
      selection_name: s.selectionName,
      odd: s.odd
    }));

    // 2. Call the transactional RPC function
    const { data: ticketId, error: rpcError } = await supabase.rpc('place_bet', {
      p_user_id: user.id,
      p_stake: data.stake,
      p_selections: selections,
      p_idempotency_key: data.idempotencyKey
    });

    if (rpcError) {
      console.error("Bet placement error:", rpcError);
      throw new Error(rpcError.message || "Erro ao processar aposta");
    }

    // 3. Fetch ticket code for response
    const { data: ticket } = await supabase
      .from("betting_tickets")
      .select("ticket_code")
      .eq("id", ticketId)
      .single();

    return { success: true, ticketCode: ticket?.ticket_code };
  });
