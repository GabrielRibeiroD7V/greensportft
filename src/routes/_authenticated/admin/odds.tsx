import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_authenticated/admin/odds")({
  loader: async ({ context }) => {
    return context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["admin-odds-overview"],
      queryFn: async () => {
        const { data: odds } = await supabase
          .from("market_options")
          .select(`
            *,
            market:markets(
              name,
              fixture:fixtures(
                home_team:teams!fixtures_home_team_id_fkey(name),
                away_team:teams!fixtures_away_team_id_fkey(name),
                start_time
              )
            )
          `)
          .order('last_provider_update', { ascending: false })
          .limit(100);
        return { odds };
      }
    }));
  },
  component: AdminOddsPage,
});

function AdminOddsPage() {
  const { data } = useSuspenseQuery(Route.options.loader as any) as { data: any };
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOdds = data.odds?.filter((o: any) => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.market?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.market?.fixture?.home_team?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.market?.fixture?.away_team?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Monitor de Odds</h1>
          <p className="text-slate-500 font-medium">Visualização em tempo real das cotações injetadas.</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar fixture ou mercado..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="bg-slate-900 text-white py-4">
          <CardTitle className="text-sm font-black uppercase tracking-wider">Últimas Atualizações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-slate-200">
                <TableHead className="font-black text-slate-500 uppercase text-[10px]">Partida / Mercado</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[10px]">Seleção</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[10px]">Provider Odd</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[10px]">Display Odd</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[10px]">Status</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[10px]">Último Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOdds?.map((odd: any) => (
                <TableRow key={odd.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700">
                        {odd.market?.fixture?.home_team?.name} vs {odd.market?.fixture?.away_team?.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase">{odd.market?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-600">
                    {odd.name} {odd.line && <span className="text-slate-400 ml-1">({odd.line})</span>}
                  </TableCell>
                  <TableCell className="font-mono text-slate-400 text-xs">
                    {odd.provider_odd?.toFixed(2) || "N/A"}
                  </TableCell>
                  <TableCell className="font-black text-slate-900">
                    {odd.odd.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] font-black uppercase ${
                        odd.status === 'OPEN' ? 'border-green-200 text-green-700 bg-green-50' : 
                        odd.status === 'SUSPENDED' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                        'border-slate-200 text-slate-500 bg-slate-50'
                      }`}
                    >
                      {odd.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] text-slate-500 font-medium">
                    {odd.last_provider_update ? new Date(odd.last_provider_update).toLocaleString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredOdds || filteredOdds.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 italic">
                    Nenhuma odd encontrada.
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