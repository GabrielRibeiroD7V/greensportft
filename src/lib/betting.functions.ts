import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

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
