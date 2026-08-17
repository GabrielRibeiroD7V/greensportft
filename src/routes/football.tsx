import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { getFixtures, getCompetitions } from "@/lib/football.functions";
import { Fixture, Market, MarketOption } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Dribbble as SoccerBall } from "lucide-react";
import { format } from "date-fns";
import { useBetSlip } from "@/hooks/use-bet-slip";
import { BetSlipSidebar } from "@/components/bet-slip/bet-slip-sidebar";
import { BetSlipDrawer } from "@/components/bet-slip/bet-slip-drawer";
import { BetSlipButton } from "@/components/bet-slip/bet-slip-button";

const fixturesQueryOptions = queryOptions({
  queryKey: ["fixtures"],
  queryFn: () => getFixtures(),
});

export const Route = createFileRoute("/football")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search['tab'] as string) || 'all',
      competition: (search['competition'] as string) || undefined,
      q: (search['q'] as string) || undefined,
    } as const;
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(fixturesQueryOptions),
  component: FootballPage,
});

function FootballPage() {
  const { tab, competition, q } = Route.useSearch();
  const { data: fixtures } = useSuspenseQuery(fixturesQueryOptions);
  const { data: allCompetitions } = useSuspenseQuery(queryOptions({
    queryKey: ["competitions"],
    queryFn: () => getCompetitions(),
  }));
  
  const { selections, addSelection } = useBetSlip();

  const filteredFixtures = fixtures.filter(f => {
    if (competition && f.competition_name !== competition) return false;
    if (q) {
        const searchLower = q.toLowerCase();
        if (!f.home_team_name.toLowerCase().includes(searchLower) && 
            !f.away_team_name.toLowerCase().includes(searchLower) &&
            !f.competition_name.toLowerCase().includes(searchLower)) return false;
    }
    
    if (tab === 'live') return f.status === 'LIVE';
    if (tab === 'today') {
        const today = new Date().toISOString().split('T')[0];
        return f.start_time.startsWith(today);
    }
    return true;
  });

  const categories = [
    { label: "Tudo", value: "all" },
    { label: "Ao Vivo", value: "live" },
    { label: "Hoje", value: "today" },
    { label: "Amanhã", value: "tomorrow" },
    { label: "Próximos", value: "upcoming" }
  ];



  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden">
      {/* Sidebar Esquerda (Profissional) */}
      <aside className="w-[240px] border-r border-slate-800 bg-slate-900 hidden md:flex flex-col flex-none">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-green-500" />
          <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Navegação</span>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <Link 
              to="/football" 
              search={{ tab: 'all', competition: undefined, q: undefined }}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all ${!competition && tab === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <SoccerBall className="h-4 w-4" /> Futebol
            </Link>
            <Link 
              to="/football" 
              search={{ tab: 'live', competition: undefined, q: undefined }}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all ${tab === 'live' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Ao Vivo
            </Link>
            
            <div className="pt-4 pb-2 px-3">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Principais Ligas</span>
            </div>

            {allCompetitions.map((comp: any) => (
              <Link 
                key={comp.id}
                to="/football"
                search={{ tab: 'all', competition: comp.name, q: undefined }}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold transition-all ${competition === comp.name ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-3 truncate">
                    {comp.logo_url ? (
                      <img src={comp.logo_url} alt="" className="h-4 w-4 object-contain" />
                    ) : (
                      <Trophy className="h-4 w-4 opacity-20" />
                    )}
                    <span className="truncate">{comp.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Área Central */}
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0f172a] p-4 md:p-6 space-y-6">
        <header className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <SoccerBall className="text-green-500 h-6 w-6" /> 
              {competition || categories.find(c => c.value === tab)?.label}
            </h1>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {filteredFixtures.length} Partidas
            </span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <Link
                key={cat.value}
                to="/football"
                search={{ tab: cat.value, competition, q }}
                className={`
                    px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all
                    ${tab === cat.value 
                        ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/20" 
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-green-500"}
                `}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </header>

        {/* Feed de Jogos Profissional */}
        <div className="space-y-8">
          {filteredFixtures.length > 0 ? (
            // Agrupamento por Competição
            Object.entries(
                filteredFixtures.reduce((acc, f) => {
                    const comp = f.competition_name || 'Outros';
                    if (!acc[comp]) acc[comp] = [];
                    acc[comp].push(f);
                    return acc;
                }, {} as Record<string, typeof filteredFixtures>)
            ).map(([compName, compFixtures]) => (
                <section key={compName} className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Trophy className="h-3 w-3 text-slate-400" />
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{compName}</h2>
                    </div>
                    
                    <div className="grid gap-2">
                        {compFixtures.map((fixture) => (
                            <Card key={fixture.id} className="overflow-hidden border-none shadow-sm hover:ring-1 hover:ring-green-500/30 transition-all bg-white dark:bg-slate-900">
                                <CardContent className="p-0">
                                    <div className="flex items-center h-20">
                                        {/* Info Tempo */}
                                        <div className="w-20 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800 text-center px-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">
                                                {format(new Date(fixture.start_time), "HH:mm")}
                                            </span>
                                            {fixture.status === 'LIVE' ? (
                                                <span className="text-[9px] font-black text-red-500 uppercase mt-1 animate-pulse">Live</span>
                                            ) : (
                                                <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">
                                                    {format(new Date(fixture.start_time), "dd/MM")}
                                                </span>
                                            )}
                                        </div>

                                        {/* Times */}
                                        <Link 
                                            to="/football/match/$fixtureId" 
                                            params={{ fixtureId: fixture.id }}
                                            className="flex-1 flex items-center px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors h-full"
                                        >
                                            <div className="flex flex-col gap-1 w-full">
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-2">
                                                        <img src={fixture.home_team_logo} alt="" className="w-4 h-4 object-contain" />
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{fixture.home_team_name}</span>
                                                    </div>
                                                    {fixture.status === 'LIVE' && <span className="text-xs font-black text-green-600">{fixture.home_score}</span>}
                                                </div>
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-2">
                                                        <img src={fixture.away_team_logo} alt="" className="w-4 h-4 object-contain" />
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{fixture.away_team_name}</span>
                                                    </div>
                                                    {fixture.status === 'LIVE' && <span className="text-xs font-black text-green-600">{fixture.away_score}</span>}
                                                </div>
                                            </div>
                                        </Link>

                                        {/* Odds Principais */}
                                        <div className="flex items-center gap-1.5 px-4">
                                            {fixture.markets?.filter((m: any) => m.name === 'Match Winner' || m.name === '1x2').slice(0, 1).map((market: Market) => (
                                                <div key={market.id} className="flex gap-1">
                                                    {market.options.map((option: MarketOption) => {
                                                        const isSelected = selections.find((s) => s.optionId === option.id);
                                                        return (
                                                            <button
                                                                key={option.id}
                                                                onClick={() => addSelection(fixture, market, option)}
                                                                className={`
                                                                    flex flex-col items-center justify-center w-[54px] h-[54px] rounded border transition-all
                                                                    ${isSelected 
                                                                        ? "bg-green-600 border-green-600 text-white shadow-md" 
                                                                        : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-green-500 text-slate-700 dark:text-slate-300"}
                                                                `}
                                                            >
                                                                <span className="text-[8px] uppercase font-black opacity-50 mb-0.5">
                                                                    {option.name === fixture.home_team_name ? "1" : option.name === fixture.away_team_name ? "2" : "X"}
                                                                </span>
                                                                <span className="text-xs font-black">{option.odd.toFixed(2)}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                            <Link 
                                                to="/football/match/$fixtureId" 
                                                params={{ fixtureId: fixture.id }}
                                                className="text-[9px] font-black text-slate-400 hover:text-green-500 uppercase tracking-widest px-2"
                                            >
                                                +{fixture.markets?.length || 0}
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            ))
          ) : (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <SoccerBall className="h-12 w-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Nenhuma partida disponível</p>
              {tab !== 'all' && (
                <Link 
                    to="/football" 
                    search={{ tab: 'all', competition: undefined, q: undefined }}
                    className="inline-block mt-4 text-[10px] font-black uppercase text-green-600 hover:underline"
                >
                    Ver todas as partidas
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Bet Slip Integration */}
      <div className={`
        flex-none transition-all duration-300 overflow-hidden
        hidden lg:block
        ${selections.length > 0 ? 'w-80 border-l' : 'w-0'}
      `}>
        <BetSlipSidebar />
      </div>
      
      <BetSlipDrawer />
      <BetSlipButton />
    </div>
  );
}
