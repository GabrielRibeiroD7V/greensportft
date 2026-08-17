import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { getFixtures, getCompetitions } from "@/lib/football.functions";
import { Fixture, Market, MarketOption } from "@/lib/types";
import { placeBet } from "@/lib/betting.functions";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Ticket, Trophy, Timer, Trash2, Dribbble as SoccerBall, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";

const fixturesQueryOptions = queryOptions({
  queryKey: ["fixtures"],
  queryFn: () => getFixtures(),
});

export const Route = createFileRoute("/football")({
  loader: ({ context }) => context.queryClient.ensureQueryData(fixturesQueryOptions),
  component: FootballPage,
});

interface Selection {
  fixtureId: string;
  fixtureName: string;
  marketName: string;
  optionId: string;
  optionName: string;
  selectionName: string;
  odd: number;
}

function FootballPage() {
  const { data: fixtures } = useSuspenseQuery(fixturesQueryOptions);
  const { data: allCompetitions } = useSuspenseQuery(queryOptions({
    queryKey: ["competitions"],
    queryFn: () => getCompetitions(),
  }));
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tudo");
  const [selections, setSelections] = useState<Selection[]>([]);
  const [stake, setStake] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const placeBetFn = useServerFn(placeBet);

  const filteredFixtures = fixtures.filter(f => {
    const matchComp = !selectedCompetition || f.competition_name === selectedCompetition;
    return matchComp;
  });

  const handlePlaceBet = async () => {
    if (selections.length === 0) return;
    setIsSubmitting(true);
    try {
      const result = await placeBetFn({
        data: {
          selections: selections.map(s => ({
            fixtureId: s.fixtureId,
            marketName: s.marketName,
            selectionName: s.selectionName,
            odd: s.odd,
          })),
          stake,
          idempotencyKey: crypto.randomUUID(),
        }
      });
      toast.success(`Aposta realizada com sucesso! Código: ${result.ticketCode}`);
      setSelections([]);
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar aposta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelection = (fixture: Fixture, market: Market, option: MarketOption) => {
    setSelections((prev) => {
      const exists = prev.find((s) => s.optionId === option.id);
      if (exists) {
        return prev.filter((s) => s.optionId !== option.id);
      }
      
      // Rule 13: Conflict detection (basic: one market per fixture)
      const sameFixtureSelections = prev.filter(s => s.fixtureId === fixture.id);
      if (sameFixtureSelections.length > 0) {
        toast.warning("Você já possui uma seleção para este jogo.");
        return prev;
      }

      return [
        ...prev,
        {
          fixtureId: fixture.id,
          fixtureName: `${fixture.home_team_name} x ${fixture.away_team_name}`,
          marketName: market.name,
          optionId: option.id,
          optionName: option.name,
          selectionName: option.name,
          odd: option.odd,
        },
      ];
    });
  };

  const totalOdd = selections.length > 0 ? selections.reduce((acc, s) => acc * s.odd, 1) : 0;
  const potentialReturn = totalOdd * stake;
  const potentialProfit = potentialReturn - stake;

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
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SoccerBall className="text-green-600" /> Próximas Partidas
          </h1>
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
                              onClick={() => toggleSelection(fixture, market, option)}
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

      {/* Sidebar Direita (Bilhete) */}
      <aside className="w-80 border-l bg-white dark:bg-slate-900 hidden lg:flex flex-col shadow-xl">
        <div className="p-4 border-b flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-green-500" />
            <h2 className="font-bold">Bilhete de Aposta</h2>
          </div>
          {selections.length > 0 && (
            <span className="bg-green-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
              {selections.length} Seleções
            </span>
          )}
        </div>

        <ScrollArea className="flex-1 p-4">
          {selections.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
              <Ticket className="h-12 w-12 mb-2" />
              <p className="text-sm font-medium">Selecione uma cotação para começar seu bilhete</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selections.map((s) => (
                <div key={s.optionId} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 relative group">
                  <button
                    onClick={() => setSelections((prev) => prev.filter((p) => p.optionId !== s.optionId))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <div className="text-[10px] font-bold text-green-600 uppercase mb-1">{s.marketName}</div>
                  <div className="text-xs font-bold truncate mb-1">{s.fixtureName}</div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-black">{s.optionName}</span>
                    <span className="text-sm font-black text-green-600">x{s.odd.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {selections.length > 0 && (
          <div className="p-4 border-t bg-slate-50 dark:bg-slate-800/50 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-500 uppercase">
                <span>Cotação Total</span>
                <span className="font-black text-slate-900 dark:text-white">{totalOdd.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">R$</span>
                <Input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                  className="h-9 font-black"
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500 uppercase">Retorno</span>
              <span className="text-xl font-black text-green-600">R$ {potentialReturn.toFixed(2)}</span>
            </div>

            <Button 
              onClick={handlePlaceBet}
              disabled={isSubmitting || selections.length === 0}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg shadow-green-600/20 uppercase tracking-wider"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Apostar Agora"}
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}
