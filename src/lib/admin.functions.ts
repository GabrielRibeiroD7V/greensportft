import { createServerFn } from "@tanstack/react-start";
// import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "./admin-guard.server";
import { z } from "zod";

export const getAdminStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // 1. Get overall ticket stats
  const { data: ticketStats, error: ticketError } = await supabaseAdmin
    .from("betting_tickets")
    .select("stake, potential_return, status, created_at");

  if (ticketError) throw ticketError;

  // 2. Get user count
  const { count: userCount } = await supabaseAdmin
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
  const { data: recentTickets } = await supabaseAdmin
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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
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
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    fixtureId: z.string().uuid(),
    homeScore: z.number().min(0),
    awayScore: z.number().min(0),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc('settle_fixture', {
      p_fixture_id: data.fixtureId,
      p_home_score: data.homeScore,
      p_away_score: data.awayScore
    });

    if (error) throw error;
    return { success: true };
  });

export const getAdminUsers = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select(`
      *,
      wallets:user_id (balance)
    `);

  if (error) throw error;
  return data;
});

export const approveWithdrawalFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ withdrawalId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc('approve_withdrawal', { p_withdrawal_id: data.withdrawalId });
    if (error) throw error;
    return { success: true };
  });

export const rejectWithdrawalFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ withdrawalId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc('reject_withdrawal', { p_withdrawal_id: data.withdrawalId });
    if (error) throw error;
    return { success: true };
  });

export const approveDepositFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ depositId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc('approve_deposit', { p_deposit_id: data.depositId });
    if (error) throw error;
    return { success: true };
  });

export const getRiskExposure = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Exposure by Fixture
  const { data: fixtureExposure } = await supabaseAdmin
    .from("betting_tickets")
    .select(`
      potential_return,
      stake,
      betting_ticket_items (
        fixture_id,
        fixtures (
          home:teams!home_team_id (name),
          away:teams!away_team_id (name)
        )
      )
    `)
    .eq("status", "PENDING");

  const exposureMap: Record<string, any> = {};
  fixtureExposure?.forEach((ticket: any) => {
    ticket.betting_ticket_items?.forEach((item: any) => {
      const fid = item.fixture_id;
      if (!exposureMap[fid]) {
        exposureMap[fid] = {
          name: `${item.fixtures.home.name} vs ${item.fixtures.away.name}`,
          stake: 0,
          potential: 0,
          count: 0
        };
      }
      exposureMap[fid].stake += Number(ticket.stake);
      exposureMap[fid].potential += Number(ticket.potential_return);
      exposureMap[fid].count++;
    });
  });

  return {
    totalPotentialPayout: fixtureExposure?.reduce((acc, t) => acc + Number(t.potential_return), 0) || 0,
    totalStakes: fixtureExposure?.reduce((acc, t) => acc + Number(t.stake), 0) || 0,
    pendingTicketsCount: fixtureExposure?.length || 0,
    byFixture: Object.values(exposureMap).sort((a, b) => b.potential - a.potential)
  };
});
