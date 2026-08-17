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
    const ticketDate = new Date(ticket.created_at);
    const stake = Number(ticket.stake);
    
    if (ticketDate >= todayStart) {
      totalApostadoHoje += stake;
    }
    if (ticketDate >= monthStart) {
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
      bilhetesHoje: ticketStats?.filter(t => new Date(t.created_at) >= todayStart).length || 0,
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
