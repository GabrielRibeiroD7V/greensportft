import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Ticket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-bets/")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: (search['status'] as string) || 'all',
  }),
  loader: async ({ context, search }: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    return context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["my-bets", user?.id || 'anon', search.status],
      queryFn: async () => {
        let query = supabase
          .from("betting_tickets")
          .select("*, betting_ticket_items(*)")
          .eq("user_id", user?.id as string)
          .order("created_at", { ascending: false });

        if (search.status && search.status !== 'all') {
          query = query.eq('status', search.status.toUpperCase());
        }

        const { data } = await query;
        return data || [];
      }
    }));
  },
  component: MyBetsPage,
});

function MyBetsPage() {
  const { status } = Route.useSearch();
  const { data: tickets = [] } = useSuspenseQuery(Route.options.loader as any) as { data: any[] };

  const filters = [
    { label: 'Todos', value: 'all' },
    { label: 'Em Aberto', value: 'pending' },
    { label: 'Ganhos', value: 'won' },
    { label: 'Perdidos', value: 'lost' },
    { label: 'Anulados', value: 'void' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Minhas Apostas</h1>
        <p className="text-slate-500 font-medium">Acompanhe o status e histórico de seus bilhetes.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map((f) => (
          <Link
            key={f.value}
            to="/my-bets"
            search={{ status: f.value }}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
              status === f.value
                ? 'bg-green-600 border-green-600 text-white shadow-md'
                : 'bg-white text-slate-500 border-slate-200 hover:border-green-500 hover:text-green-600'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase pl-6">Código</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Data</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-right">Valor</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Odd</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-right">Retorno</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket: any) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-bold text-xs text-blue-600 pl-6 uppercase">{ticket.ticket_code}</TableCell>
                  <TableCell className="text-xs text-slate-500">{format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell className="text-xs font-black text-right">R$ {Number(ticket.stake).toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-bold text-center text-slate-500">{Number(ticket.total_odd).toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-black text-right text-green-600">R$ {Number(ticket.potential_return).toFixed(2)}</TableCell>
                  <TableCell className="text-center pr-6">
                    <Badge variant={ticket.status === 'WON' ? 'default' : ticket.status === 'LOST' ? 'destructive' : 'secondary'} className="text-[10px] font-black">
                      {ticket.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {tickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium">
                    <Ticket className="h-10 w-10 mx-auto mb-4 opacity-20" />
                    <p className="mb-4">Você ainda não possui bilhetes {status !== 'all' ? `com status ${status.toUpperCase()}` : ''}.</p>
                    <Link to="/football" search={{ tab: 'all' }}>
                      <Button className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-widest">Ver jogos</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
