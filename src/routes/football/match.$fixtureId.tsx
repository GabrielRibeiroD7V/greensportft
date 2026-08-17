import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Clock, Trophy, Info, Share2 } from "lucide-react";
import { format } from "date-fns";
import { useBetSlip } from "@/hooks/use-bet-slip";
import { BetSlipSidebar } from "@/components/bet-slip/bet-slip-sidebar";
import { BetSlipDrawer } from "@/components/bet-slip/bet-slip-drawer";
import { BetSlipButton } from "@/components/bet-slip/bet-slip-button";

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
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: match } = useSuspenseQuery(matchDetailQueryOptions(fixtureId));
  const { addSelection, selections } = useBetSlip();

  if (!match) return <div>Partida não encontrada</div>;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0f172a] overflow-hidden">
      {/* Sidebar Desktop Placeholder (Same as football.tsx for consistency) */}
      <aside className="w-[240px] border-r border-slate-800 bg-slate-900 hidden md:flex flex-col shrink-0">
        <div className="p-4">
           <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 text-slate-400 hover:text-white font-bold uppercase text-[10px] tracking-widest"
            onClick={() => navigate({ to: '/football', search })}
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0f172a]">
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between md:hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest"
              onClick={() => navigate({ to: '/football', search })}
            >
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>
            <Share2 className="h-4 w-4 text-slate-400" />
          </div>

          <Card className="border-none shadow-xl overflow-hidden bg-slate-900 text-white">
            <CardHeader className="p-6 md:p-10 text-center relative overflow-hidden">
               {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800/50 to-transparent pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">
                  {(match.competitions as any)?.name}
                </div>
                
                <div className="flex items-center justify-center gap-6 md:gap-16">
                  <div className="flex flex-col items-center gap-4 w-28 md:w-40">
                    <img src={(match.home as any)?.logo_url} className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-2xl" alt="" />
                    <span className="font-black text-xs md:text-sm uppercase tracking-tight text-center">{(match.home as any)?.name}</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center space-y-2 min-w-[80px]">
                      {match.status === 'LIVE' || match.status === 'FINISHED' ? (
                          <div className="text-4xl md:text-6xl font-black tabular-nums tracking-tighter">{match.home_score} : {match.away_score}</div>
                      ) : (
                          <div className="text-3xl md:text-5xl font-black text-slate-700">VS</div>
                      )}
                      <div className="flex flex-col items-center">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${match.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                              {match.status}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 mt-2 uppercase">
                            {format(new Date(match.start_time), "dd/MM HH:mm")}
                          </span>
                      </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 w-28 md:w-40">
                    <img src={(match.away as any)?.logo_url} className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-2xl" alt="" />
                    <span className="font-black text-xs md:text-sm uppercase tracking-tight text-center">{(match.away as any)?.name}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4">
            {(match.markets as any[] || []).map(market => (
              <Card key={market.id} className="border-none shadow-sm dark:bg-slate-900">
                <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {market.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-3 md:px-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(market.market_options as any[] || []).map(option => {
                      const isSelected = selections.find(s => s.optionId === option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => addSelection(match as any, market, option)}
                          className={`
                            flex justify-between items-center p-3 rounded-lg border transition-all
                            ${isSelected ? "bg-green-600 border-green-600 text-white shadow-lg" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-green-500 text-slate-700 dark:text-slate-300"}
                          `}
                        >
                          <span className="text-[10px] font-bold uppercase truncate pr-2">{option.name}</span>
                          <span className="text-xs font-black shrink-0">{Number(option.odd).toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!match.markets || match.markets.length === 0) && (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Info className="mx-auto h-8 w-8 mb-2 text-slate-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhum mercado disponível</p>
                </div>
            )}
          </div>
        </div>
      </main>

      {/* Bet Slip Sidebar Desktop */}
      <div className={`
        flex-none transition-all duration-300 overflow-hidden
        hidden lg:block
        ${selections.length > 0 ? 'w-[360px] border-l border-slate-800' : 'w-0'}
      `}>
        <BetSlipSidebar />
      </div>

      <BetSlipDrawer />
    </div>
  );
}
