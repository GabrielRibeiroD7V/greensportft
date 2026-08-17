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
  loader: ({ context }) => context.queryClient.ensureQueryData(fixturesQueryOptions),
  component: FootballPage,
});

function FootballPage() {
  const { data: fixtures } = useSuspenseQuery(fixturesQueryOptions);
  const { data: allCompetitions } = useSuspenseQuery(queryOptions({
    queryKey: ["competitions"],
    queryFn: () => getCompetitions(),
  }));
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tudo");
  
  const { selections, addSelection } = useBetSlip();

  const filteredFixtures = fixtures.filter(f => {
    const matchComp = !selectedCompetition || f.competition_name === selectedCompetition;
    return matchComp;
  });

  const categories = ["Tudo", "Ao Vivo", "Hoje", "Amanhã", "Próximos"];



  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar Esquerda (Ligas Reais) */}
      <div className="w-16 md:w-64 border-r bg-white dark:bg-slate-900 flex flex-none flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white font-bold">GS</div>
          <span className="hidden md:block font-bold text-xl tracking-tight">GreenSport</span>
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="mb-4">
            <h3 className="hidden md:block px-3 text-[10px] font-black uppercase text-slate-400 mb-2">Principais Ligas</h3>
            <Button 
              variant={selectedCompetition === null ? "secondary" : "ghost"} 
              className="w-full justify-start gap-3 mb-1"
              onClick={() => setSelectedCompetition(null)}
            >
              <Trophy className="h-5 w-5 text-green-600" />
              <span className="hidden md:block">Todas</span>
            </Button>
            {allCompetitions.map((comp: any) => (
              <Button 
                key={comp.id}
                variant={selectedCompetition === comp.name ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3 mb-1"
                onClick={() => setSelectedCompetition(comp.name)}
              >
                {comp.logo_url ? (
                  <img src={comp.logo_url} alt={comp.name} className="h-5 w-5 object-contain" />
                ) : (
                  <Trophy className="h-5 w-5 text-slate-400" />
                )}
                <span className="hidden md:block truncate">{comp.name}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Área Central */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <header className="space-y-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SoccerBall className="text-green-600" /> Futebol
          </h1>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                className="rounded-full px-6 font-bold uppercase text-[10px] tracking-widest"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </header>

        <div className="grid gap-4">

          {filteredFixtures.map((fixture) => (
            <Card key={fixture.id} className="overflow-hidden border-slate-200">
              <CardHeader className="bg-slate-50/50 p-3 flex flex-row items-center justify-between space-y-0">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {fixture.competition_name} • {format(new Date(fixture.start_time), "dd/MM HH:mm")}
                </span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium uppercase">
                  {fixture.status}
                </span>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col items-center gap-1 w-24 text-center">
                      {fixture.home_team_logo ? (
                        <img src={fixture.home_team_logo} alt={fixture.home_team_name} className="w-12 h-12 object-contain mb-1" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-full mb-1" />
                      )}
                      <span className="text-sm font-bold leading-tight">{fixture.home_team_name}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-300">VS</div>
                    <div className="flex flex-col items-center gap-1 w-24 text-center">
                      {fixture.away_team_logo ? (
                        <img src={fixture.away_team_logo} alt={fixture.away_team_name} className="w-12 h-12 object-contain mb-1" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-full mb-1" />
                      )}
                      <span className="text-sm font-bold leading-tight">{fixture.away_team_name}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {fixture.markets?.map((market: Market) => (
                      <div key={market.id} className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                        {market.options.map((option: MarketOption) => {
                          const isSelected = selections.find((s) => s.optionId === option.id);
                          return (
                            <button
                              key={option.id}
                              onClick={() => addSelection(fixture, market, option)}
                              className={`
                                flex flex-col items-center justify-center min-w-[60px] md:min-w-[80px] p-2 rounded-md transition-all
                                ${isSelected ? "bg-green-600 text-white shadow-lg scale-105" : "bg-white hover:bg-slate-50 text-slate-700"}
                              `}
                            >
                              <span className="text-[10px] uppercase font-bold opacity-70">
                                {option.name === fixture.home_team_name ? "1" : option.name === fixture.away_team_name ? "2" : "X"}
                              </span>
                              <span className="text-sm font-black">{option.odd.toFixed(2)}</span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredFixtures.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <SoccerBall className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest">Nenhuma partida encontrada</p>
            </div>
          )}
        </div>
      </main>

      <BetSlipSidebar />
      <BetSlipDrawer />
      <BetSlipButton />
    </div>
  );
}
