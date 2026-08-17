import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const getAdminStats = createServerFn({ method: "GET" }).handler(async () => {
  // 1. Get overall ticket stats
  const { data: ticketStats, error: ticketError } = await supabase
    .from("betting_tickets")
    .select("stake, potential_return, status, created_at");

  if (ticketError) throw ticketError;

  // 2. Get user count
  const { count: userCount } = await supabase
    .from("user_roles")
    .select("*", { count: 'exact', head: true });

  // 3. Process calculations
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalApostadoHoje = 0;
  let totalApostadoMes = 0;
  let bilhetesPendentes = 0;
  let exposicaoBruta = 0;

  ticketStats?.forEach(ticket => {
    const ticketDate = ticket.created_at ? new Date(ticket.created_at) : null;
    const stake = Number(ticket.stake);
    
    if (ticketDate && ticketDate >= todayStart) {
      totalApostadoHoje += stake;
    }
    if (ticketDate && ticketDate >= monthStart) {
      totalApostadoMes += stake;
    }
    if (ticket.status === 'PENDING') {
      bilhetesPendentes++;
      exposicaoBruta += Number(ticket.potential_return);
    }
  });

  // 4. Get recent tickets
  const { data: recentTickets } = await supabase
    .from("betting_tickets")
    .select(`
      id,
      ticket_code,
      total_odd,
      stake,
      potential_return,
      status,
      created_at
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    stats: {
      totalApostadoHoje,
      totalApostadoMes,
      bilhetesHoje: ticketStats?.filter(t => t.created_at && new Date(t.created_at) >= todayStart).length || 0,
      bilhetesPendentes,
      usuariosCadastrados: userCount || 0,
      exposicaoMaxima: exposicaoBruta,
      saldoLiquido: totalApostadoMes // Simple metric for now
    },
    recentTickets: recentTickets || []
  };
});

export const getTickets = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("betting_tickets")
    .select(`
      *,
      profiles:user_id (email),
      betting_ticket_items (*)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
});

export const getAdminMatches = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("fixtures")
    .select(`
      *,
      competitions (name),
      home:teams!home_team_id (name, logo_url),
      away:teams!away_team_id (name, logo_url)
    `)
    .order("start_time", { ascending: false });

  if (error) throw error;
  return data;
});

export const settleMatch = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    fixtureId: z.string().uuid(),
    homeScore: z.number().min(0),
    awayScore: z.number().min(0),
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase.rpc('settle_fixture', {
      p_fixture_id: data.fixtureId,
      p_home_score: data.homeScore,
      p_away_score: data.awayScore
    });

    if (error) throw error;
    return { success: true };
  });

export const getAdminUsers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("user_roles")
    .select(`
      *,
      wallets:user_id (balance)
    `);

  if (error) throw error;
  return data;
});

export const approveWithdrawalFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ withdrawalId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase.rpc('approve_withdrawal', { p_withdrawal_id: data.withdrawalId });
    if (error) throw error;
    return { success: true };
  });

export const rejectWithdrawalFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ withdrawalId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase.rpc('reject_withdrawal', { p_withdrawal_id: data.withdrawalId });
    if (error) throw error;
    return { success: true };
  });

export const getRiskExposure = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("betting_tickets")
    .select("potential_return, stake, status")
    .eq("status", "PENDING");

  if (error) throw error;

  const totalPotentialPayout = data.reduce((acc, t) => acc + Number(t.potential_return), 0);
  const totalStakes = data.reduce((acc, t) => acc + Number(t.stake), 0);

  return {
    totalPotentialPayout,
    totalStakes,
    pendingTicketsCount: data.length
  };
});
