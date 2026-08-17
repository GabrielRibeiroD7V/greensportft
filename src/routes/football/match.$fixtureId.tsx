import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Clock, Trophy, Info } from "lucide-react";
import { format } from "date-fns";
import { useBetSlip } from "@/hooks/use-bet-slip";

// This is a placeholder for the actual server function that should be in lib
// but since I can't easily add one to football.functions.ts without risk of breaking it,
// I'll define a query option here that uses the client directly (read-only)
const matchDetailQueryOptions = (fixtureId: string) => queryOptions({
  queryKey: ["match", fixtureId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("fixtures")
      .select(`
        *,
        competitions (name),
        home:teams!home_team_id (name, logo_url),
        away:teams!away_team_id (name, logo_url),
        markets (
          *,
          market_options (*)
        )
      `)
      .eq("id", fixtureId)
      .single();
    
    if (error) throw error;
    return data;
  }
});

export const Route = createFileRoute("/football/match/$fixtureId")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(matchDetailQueryOptions(params.fixtureId)),
  component: MatchDetailPage,
});

function MatchDetailPage() {
  const { fixtureId } = Route.useParams();
  const { data: match } = useSuspenseQuery(matchDetailQueryOptions(fixtureId));
  const { addSelection, selections } = useBetSlip();

  if (!match) return <div>Partida não encontrada</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Link to="/football" search={{ tab: 'all', competition: undefined, q: undefined }}>
        <Button variant="ghost" size="sm" className="gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Button>
      </Link>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-6 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
            {(match.competitions as any)?.name} • {format(new Date(match.start_time), "dd/MM/yyyy HH:mm")}
          </div>
          <div className="flex items-center justify-center gap-8 md:gap-16">
            <div className="flex flex-col items-center gap-3 w-32">
              <img src={(match.home as any)?.logo_url} className="w-16 h-16 object-contain" alt="" />
              <span className="font-black text-sm uppercase tracking-tight">{(match.home as any)?.name}</span>
            </div>
            <div className="flex flex-col items-center">
                {match.status === 'LIVE' || match.status === 'FINISHED' ? (
                    <div className="text-4xl font-black">{match.home_score} : {match.away_score}</div>
                ) : (
                    <div className="text-4xl font-black text-slate-700">VS</div>
                )}
                <div className="mt-2">
                    <span className="text-[10px] font-black uppercase bg-green-600 px-2 py-0.5 rounded">
                        {match.status}
                    </span>
                </div>
            </div>
            <div className="flex flex-col items-center gap-3 w-32">
              <img src={(match.away as any)?.logo_url} className="w-16 h-16 object-contain" alt="" />
              <span className="font-black text-sm uppercase tracking-tight">{(match.away as any)?.name}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {(match.markets as any[] || []).map(market => (
          <Card key={market.id} className="border-none shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">
                {market.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(market.market_options as any[] || []).map(option => {
                  const isSelected = selections.find(s => s.optionId === option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => addSelection(match as any, market, option)}
                      className={`
                        flex justify-between items-center p-3 rounded-lg border transition-all
                        ${isSelected ? "bg-green-600 border-green-600 text-white shadow-md" : "bg-white border-slate-100 hover:border-green-200 text-slate-700"}
                      `}
                    >
                      <span className="text-[11px] font-bold uppercase">{option.name}</span>
                      <span className="text-sm font-black">{Number(option.odd).toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
        {(!match.markets || match.markets.length === 0) && (
            <div className="text-center py-12 text-slate-400">
                <Info className="mx-auto h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Nenhum mercado disponível para esta partida</p>
            </div>
        )}
      </div>
    </div>
  );
}
