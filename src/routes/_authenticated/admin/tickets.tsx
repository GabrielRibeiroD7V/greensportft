import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getTickets } from "@/lib/admin.functions";
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

const ticketsQueryOptions = queryOptions({
  queryKey: ["admin-tickets"],
  queryFn: () => getTickets(),
});

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  loader: ({ context }) => context.queryClient.ensureQueryData(ticketsQueryOptions),
  component: AdminTickets,
});

function AdminTickets() {
  const { data: tickets } = useSuspenseQuery(ticketsQueryOptions);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Gestão de Bilhetes</h1>
        <p className="text-slate-500 font-medium">Visualize e controle todas as apostas da plataforma.</p>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase pl-6">ID Bilhete</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Usuário</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Data/Hora</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-right">Stake</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Odd Total</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-right">Retorno</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets?.map((ticket: any) => (
                <TableRow key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <TableCell className="font-bold text-xs text-blue-600 pl-6">{ticket.ticket_code}</TableCell>
                  <TableCell className="text-xs font-medium">{ticket.profiles?.email || 'N/A'}</TableCell>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
