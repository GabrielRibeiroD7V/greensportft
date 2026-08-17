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
import { Ticket, History, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/my-bets/")({
  pendingComponent: MyBetsSkeleton,
  validateSearch: (search: Record<string, unknown>) => ({
    status: (search['status'] as string) || 'all',
  }),
  loader: async ({ context, search }: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Though _authenticated layout handles this, we be extra safe for loader race
      return { tickets: [], status: search.status };
    }

    return context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["my-bets", user.id, search.status],
      queryFn: async () => {
        let query = supabase
          .from("betting_tickets")
          .select(`
            *,
            betting_ticket_items (
              *
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (search.status && search.status !== 'all') {
          query = query.eq('status', search.status.toUpperCase() as any);
        }

        const { data, error } = await query;
        if (error) {
          console.error("Error fetching tickets:", error);
          throw error;
        }
        return data || [];
      }
    }));
  },
  component: MyBetsPage,
});

function MyBetsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-9 w-24 rounded-full flex-shrink-0" />)}
      </div>
      <Skeleton className="h-[600px] w-full rounded-xl" />
    </div>
  );
}

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

  // Helper for currency formatting
  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Helper for odd formatting
  const formatOdd = (val: any) => {
    return Number(val || 1).toFixed(2);
  };

  // Helper for safe dates
  const formatDate = (dateStr: any) => {
    if (!dateStr) return '--/--/----';
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm");
    } catch (e) {
      return '--/--/----';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Minhas Apostas</h1>
          <p className="text-slate-500 font-medium">Acompanhe o status e histórico de seus bilhetes.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Filter className="h-4 w-4 text-slate-400 flex-shrink-0 ml-1" />
        {filters.map((f) => (
          <Link
            key={f.value}
            to="/my-bets"
            search={{ status: f.value }}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap flex-shrink-0 ${
              status === f.value
                ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/20'
                : 'bg-white text-slate-500 border-slate-200 hover:border-green-500 hover:text-green-600'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <History className="h-4 w-4 text-green-600" /> Bilhetes Recentemente
          </CardTitle>
          <Badge variant="outline" className="text-[9px] font-black uppercase bg-slate-100 border-none px-2">
            {tickets.length} {tickets.length === 1 ? 'Bilhete' : 'Bilhetes'}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-[9px] font-black uppercase pl-6 text-slate-400">Código</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-slate-400">Data</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-right text-slate-400">Valor</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-center text-slate-400">Odd</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-right text-slate-400">Retorno</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-center pr-6 text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket: any) => (
                  <TableRow key={ticket.id} className="hover:bg-slate-50/50 border-slate-50">
                    <TableCell className="font-bold text-[11px] text-blue-600 pl-6 uppercase font-mono">
                      {ticket.ticket_code || '---'}
                    </TableCell>
                    <TableCell className="text-[11px] font-medium text-slate-500">
                      {formatDate(ticket.created_at)}
                    </TableCell>
                    <TableCell className="text-[11px] font-black text-right text-slate-900">
                      {formatCurrency(ticket.stake)}
                    </TableCell>
                    <TableCell className="text-[11px] font-bold text-center text-slate-400">
                      {formatOdd(ticket.total_odd)}
                    </TableCell>
                    <TableCell className="text-[11px] font-black text-right text-green-600">
                      {formatCurrency(ticket.potential_return)}
                    </TableCell>
                    <TableCell className="text-center pr-6">
                      <Badge 
                        variant="outline" 
                        className={`text-[9px] font-black uppercase border-none px-2 py-0.5 ${
                          ticket.status === 'WON' 
                            ? 'bg-green-100 text-green-700' 
                            : ticket.status === 'LOST' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ticket.status || 'PENDING'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {tickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 text-slate-400 font-medium">
                      <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                        <div className="bg-slate-50 p-6 rounded-full opacity-50">
                          <Ticket className="h-12 w-12 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Sem bilhetes encontrados</p>
                          <p className="text-xs text-slate-400">Você ainda não possui apostas {status !== 'all' ? `com status ${status.toUpperCase()}` : ''}.</p>
                        </div>
                        <Link to="/football" search={{ tab: 'all' }}>
                          <Button className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-widest px-8 mt-2 shadow-lg shadow-green-600/20">
                            Ver jogos agora
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}