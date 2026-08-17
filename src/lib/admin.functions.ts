import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const getAdminStats = createServerFn({ method: "GET" }).handler(async () => {
  // In a real app, these would be complex queries. For Fase 1, we simulate based on DB counts.
  const { count: ticketCount } = await supabase.from("betting_tickets").select("*", { count: 'exact', head: true });
  const { count: userCount } = await supabase.from("user_roles").select("*", { count: 'exact', head: true });
  
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
      totalApostadoHoje: 12500.50,
      totalApostadoMes: 450000.00,
      bilhetesHoje: ticketCount || 0,
      bilhetesPendentes: 12,
      usuariosCadastrados: userCount || 0,
      exposicaoMaxima: 8500.00,
      saldoLiquido: 25400.00
    },
    recentTickets: recentTickets || []
  };
});

export const getTickets = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("betting_tickets")
    .select(`
      *,
      betting_ticket_items (*)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
});
