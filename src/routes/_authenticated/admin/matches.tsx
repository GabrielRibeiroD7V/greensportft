import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { getAdminMatches, settleMatch } from "@/lib/admin.functions";
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
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

const adminMatchesQueryOptions = queryOptions({
  queryKey: ["admin-matches"],
  queryFn: () => getAdminMatches(),
});

export const Route = createFileRoute("/_authenticated/admin/matches")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminMatchesQueryOptions),
  component: AdminMatches,
});

function AdminMatches() {
  const { data: matches } = useSuspenseQuery(adminMatchesQueryOptions);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { home: number; away: number }>>({});
  const settleMatchFn = useServerFn(settleMatch);
  const queryClient = useQueryClient();

  const handleSettle = async (matchId: string) => {
    const score = scores[matchId];
    if (!score) {
      toast.error("Informe o placar");
      return;
    }

    setSettlingId(matchId);
    try {
      await settleMatchFn({
        data: {
          fixtureId: matchId,
          homeScore: score.home,
          awayScore: score.away,
        }
      });
      toast.success("Partida liquidada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao liquidar partida");
    } finally {
      setSettlingId(null);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Gestão de Partidas</h1>
        <p className="text-slate-500 font-medium">Controle e liquidação de fixtures simuladas.</p>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase pl-6">Data/Hora</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Competição</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Partida</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Placar Final</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-right pr-6">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches?.map((match: any) => (
                <TableRow key={match.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <TableCell className="text-xs text-slate-500 pl-6">
                    {format(new Date(match.start_time), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-xs font-bold truncate">
                    {match.competitions?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-xs font-black text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span>{match.home?.name}</span>
                      <span className="text-slate-300">VS</span>
                      <span>{match.away?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={match.status === 'FT' ? 'default' : 'secondary'} className="text-[10px] font-black">
                      {match.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {match.status === 'FT' ? (
                      <span className="font-black text-lg">{match.home_score} - {match.away_score}</span>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Input 
                          type="number" 
                          placeholder="H" 
                          className="w-12 h-8 text-center p-0 font-black"
                          value={scores[match.id]?.home ?? ""}
                          onChange={(e) => setScores(prev => ({ 
                            ...prev, 
                            [match.id]: { ...(prev[match.id] || { away: 0 }), home: Number(e.target.value) } 
                          }))}
                        />
                        <span className="text-slate-300">-</span>
                        <Input 
                          type="number" 
                          placeholder="A" 
                          className="w-12 h-8 text-center p-0 font-black"
                          value={scores[match.id]?.away ?? ""}
                          onChange={(e) => setScores(prev => ({ 
                            ...prev, 
                            [match.id]: { ...(prev[match.id] || { home: 0 }), away: Number(e.target.value) } 
                          }))}
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    {match.status !== 'FT' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 font-bold uppercase text-[10px]"
                        onClick={() => handleSettle(match.id)}
                        disabled={settlingId === match.id}
                      >
                        {settlingId === match.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Liquidar"}
                      </Button>
                    )}
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
