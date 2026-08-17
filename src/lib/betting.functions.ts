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
});

export const placeBet = createServerFn({ method: "POST" })
  .validator((data: unknown) => placeBetSchema.parse(data))
  .handler(async ({ data, context }) => {
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // 2. Validate wallet and balance
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      throw new Error("Wallet not found. Please contact support.");
    }

    if (Number(wallet.balance) < data.stake) {
      throw new Error("Insufficient balance.");
    }

    // 3. Calculate totals
    const totalOdd = data.selections.reduce((acc, s) => acc * s.odd, 1);
    const potentialReturn = totalOdd * data.stake;
    const ticketCode = `GS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 4. Atomic transaction (using RPC)
    // We should ideally use a stored procedure for atomic bet placement
    // For now, we'll use standard client calls as a base, but mark as risk if not RPC
    
    // Create Ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("betting_tickets")
      .insert({
        user_id: user.id,
        ticket_code: ticketCode,
        total_odd: totalOdd,
        stake: data.stake,
        potential_return: potentialReturn,
        status: 'PENDING'
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Create Items
    const itemsToInsert = data.selections.map(s => ({
      ticket_id: ticket.id,
      fixture_id: s.fixtureId,
      market_name: s.marketName,
      selection_name: s.selectionName,
      odd: s.odd,
      status: 'pending'
    }));

    const { error: itemsError } = await supabase
      .from("betting_ticket_items")
      .insert(itemsToInsert as any);

    if (itemsError) throw itemsError;

    // Update Wallet Balance
    const newBalance = Number(wallet.balance) - data.stake;
    const { error: balanceError } = await supabase
      .from("wallets")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", wallet.id);

    if (balanceError) throw balanceError;

    // Record Transaction
    const { error: txError } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        type: 'bet',
        amount: -data.stake,
        balance_before: Number(wallet.balance),
        balance_after: newBalance,
        reference_id: ticket.id,
        description: `Bet placed: ${ticketCode}`
      });

    if (txError) throw txError;

    return { success: true, ticketCode };
  });
