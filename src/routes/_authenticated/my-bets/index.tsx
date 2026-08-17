import { createFileRoute } from "@tanstack/react-router";
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
import { format } from "date-fns";
import { Ticket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-bets/")({
  loader: async ({ context }) => {
    const { data: { user } } = await supabase.auth.getUser();
    return context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["my-bets", user?.id || 'anon'],
      queryFn: async () => {
        const { data } = await supabase
          .from("betting_tickets")
          .select("*, betting_ticket_items(*)")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false });
        return data || [];
      }
    }));
  },
  component: MyBetsPage,
});

function MyBetsPage() {
  const { data: tickets = [] } = useSuspenseQuery(Route.options.loader as any) as { data: any[] };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Minhas Apostas</h1>
        <p className="text-slate-500 font-medium">Acompanhe o status e histórico de seus bilhetes.</p>
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
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400 font-medium italic">
                    <Ticket className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    Nenhuma aposta realizada ainda.
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
