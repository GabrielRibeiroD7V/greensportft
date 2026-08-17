import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/admin.functions";
import { 
  TrendingUp, 
  Users, 
  Ticket, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const adminStatsQueryOptions = queryOptions({
  queryKey: ["admin-stats"],
  queryFn: () => getAdminStats(),
});

export const Route = createFileRoute("/_authenticated/admin/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminStatsQueryOptions),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: { stats, recentTickets } } = useSuspenseQuery(adminStatsQueryOptions);

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase text-slate-900 dark:text-white">Painel Geral</h1>
        <p className="text-slate-500 font-medium">Bem-vindo à central de operações GreenSport.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Total Apostado Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">R$ {stats.totalApostadoHoje.toLocaleString('pt-BR')}</div>
            <p className="text-[10px] text-green-600 font-bold flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12.5% em relação a ontem
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Bilhetes Hoje</CardTitle>
            <Ticket className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.bilhetesHoje}</div>
            <p className="text-[10px] text-slate-500 font-bold mt-1">
              {stats.bilhetesPendentes} aguardando liquidação
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Exposição Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">R$ {stats.exposicaoMaxima.toLocaleString('pt-BR')}</div>
            <p className="text-[10px] text-amber-600 font-bold flex items-center mt-1">
              Alto risco em 3 partidas
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Saldo Líquido (Mês)</CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">R$ {stats.saldoLiquido.toLocaleString('pt-BR')}</div>
            <p className="text-[10px] text-green-600 font-bold flex items-center mt-1">
              Lucratividade saudável
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets Table */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-black uppercase tracking-tight">Bilhetes Recentes</CardTitle>
          <Button variant="outline" size="sm" className="font-bold text-xs uppercase">Ver Todos</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase">ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Data/Hora</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-right">Valor</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Odd</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-right">Retorno</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTickets.map((ticket: any) => (
                <TableRow key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <TableCell className="font-bold text-xs text-blue-600 dark:text-blue-400">{ticket.ticket_code}</TableCell>
                  <TableCell className="text-xs text-slate-500">{format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell className="text-xs font-black text-right">R$ {Number(ticket.stake).toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-bold text-center text-slate-500">{Number(ticket.total_odd).toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-black text-right text-green-600">R$ {Number(ticket.potential_return).toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={ticket.status === 'WON' ? 'default' : ticket.status === 'LOST' ? 'destructive' : 'secondary'} className="text-[10px] font-black">
                      {ticket.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {recentTickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400 font-medium italic">Nenhum bilhete encontrado no momento.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
