import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getFixtures, getCompetitions } from "@/lib/football.functions";
import { Fixture, Market, MarketOption } from "@/lib/types";
import { Trophy, Dribbble as SoccerBall, Search, Radio, Calendar, History, Wallet, Star, Ticket } from "lucide-react";
import { useBetSlip } from "@/hooks/use-bet-slip";
import { BetSlipSidebar } from "@/components/bet-slip/bet-slip-sidebar";
import { BetSlipDrawer } from "@/components/bet-slip/bet-slip-drawer";
import { BetSlipButton } from "@/components/bet-slip/bet-slip-button";
import logoAsset from "@/assets/greensport-logo.png.asset.json";
import { MatchCardHighlight } from "@/components/football/match-card-highlight";
import { MatchCardCompact } from "@/components/football/match-card-compact";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HomeBannerCarousel } from "@/components/football/home-banner-carousel";

const fixturesQueryOptions = queryOptions({
  queryKey: ["fixtures"],
  queryFn: () => getFixtures(),
});

type FootballSearch = {
  tab?: 'all' | 'live' | 'today' | 'tomorrow' | 'upcoming';
  competition?: string | undefined;
  q?: string | undefined;
};

export const Route = createFileRoute("/football")({
  validateSearch: (search: Record<string, unknown>): FootballSearch => {
    return {
      tab: (search['tab'] as any) || 'all',
      competition: (search['competition'] as string) || undefined,
      q: (search['q'] as string) || undefined,
    };
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
  
  const { selections } = useBetSlip();

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
    if (tab === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      return f.start_time.startsWith(tomorrowStr);
    }
    if (tab === 'upcoming') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return new Date(f.start_time) > tomorrow;
    }
    return true;
  });

  const shortcuts = [
    { label: "Tudo", icon: SoccerBall, tab: 'all' },
    { label: "Ao Vivo", icon: Radio, tab: 'live', color: 'text-red-500' },
    { label: "Hoje", icon: Calendar, tab: 'today' },
    { label: "Amanhã", icon: Calendar, tab: 'tomorrow' },
    { label: "Favoritos", icon: Star, tab: 'all', color: 'text-amber-500' },
  ];

  const highlights = filteredFixtures.filter(f => f.status === 'LIVE').slice(0, 5);
  if (highlights.length === 0 && filteredFixtures.length > 0) {
      highlights.push(...filteredFixtures.slice(0, 3));
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0f172a] overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="w-[230px] border-r border-slate-800 bg-slate-950 hidden md:flex flex-col shrink-0">
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-6">
            <section className="space-y-1">
              <h3 className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Explorar</h3>
              <Link to="/football" search={{ tab: 'all' }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-xs font-bold transition-colors [&.active]:bg-slate-800 [&.active]:text-white text-slate-400">
                <SoccerBall className="h-4 w-4" /> Futebol
              </Link>
              <Link to="/football" search={{ tab: 'live' }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-xs font-bold transition-colors [&.active]:bg-slate-800 [&.active]:text-white text-slate-400">
                <Radio className="h-4 w-4 text-red-500" /> Ao Vivo
              </Link>
              <Link to="/football" search={{ tab: 'today' }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-xs font-bold transition-colors [&.active]:bg-slate-800 [&.active]:text-white text-slate-400">
                <Calendar className="h-4 w-4" /> Hoje
              </Link>
              <Link to="/football" search={{ tab: 'tomorrow' }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-xs font-bold transition-colors [&.active]:bg-slate-800 [&.active]:text-white text-slate-400">
                <Calendar className="h-4 w-4" /> Amanhã
              </Link>
              <Link to="/football" search={{ tab: 'upcoming' }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-xs font-bold transition-colors [&.active]:bg-slate-800 [&.active]:text-white text-slate-400">
                <Calendar className="h-4 w-4" /> Próximos
              </Link>
            </section>

            <section className="space-y-1">
              <h3 className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Minha Área</h3>
              <Link to="/my-bets" search={{ status: 'all' }} className="flex items-center justify-between px-3 py-2 rounded hover:bg-slate-900 text-[11px] font-bold text-slate-400 transition-colors [&.active]:bg-slate-900 [&.active]:text-white">
                <div className="flex items-center gap-3">
                  <History className="h-3.5 w-3.5" /> Minhas Apostas
                </div>
              </Link>
              <Link to="/my-bets" search={{ status: 'pending' }} className="flex items-center justify-between px-3 py-2 rounded hover:bg-slate-900 text-[11px] font-bold text-slate-400 transition-colors [&.active]:bg-slate-900 [&.active]:text-white">
                <div className="flex items-center gap-3">
                  <Ticket className="h-3.5 w-3.5" /> Bilhetes em Aberto
                </div>
              </Link>
              <Link to="/wallet" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-900 text-[11px] font-bold text-slate-400 transition-colors [&.active]:bg-slate-900 [&.active]:text-white">
                <Wallet className="h-3.5 w-3.5" /> Carteira
              </Link>
            </section>

            <section className="space-y-1">
              <h3 className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Principais Ligas</h3>
              {allCompetitions.map((comp: any) => (
                <Link 
                  key={comp.id}
                  to="/football"
                  search={{ competition: comp.name }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${competition === comp.name ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
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
            </section>
            <section className="space-y-1 pt-4 border-t border-slate-900">
              <h3 className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Conta</h3>
              <Link to="/rules" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-900 text-[11px] font-bold text-slate-400 transition-colors">
                Regras
              </Link>
              <Link to="/support" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-900 text-[11px] font-bold text-slate-400 transition-colors">
                Suporte
              </Link>
              <Link to="/account" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-900 text-[11px] font-bold text-slate-400 transition-colors">
                Minha Conta
              </Link>
            </section>
          </div>
        </ScrollArea>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Atalhos Horizontais Mobile */}
        <div className="md:hidden flex gap-2 overflow-x-auto p-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 scrollbar-hide sticky top-0 z-20">
          {shortcuts.map((s, idx) => (
            <Link
              key={idx}
              to="/football"
              search={{ tab: s.tab as any }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all ${tab === s.tab && !competition ? 'bg-green-600 border-green-600 text-white font-black' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold'}`}
            >
              <s.icon className={`h-3.5 w-3.5 ${s.color || ''}`} />
              <span className="text-[10px] uppercase tracking-widest">{s.label}</span>
            </Link>
          ))}
          {allCompetitions.slice(0, 5).map((comp: any) => (
            <Link
              key={comp.id}
              to="/football"
              search={{ competition: comp.name }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all ${competition === comp.name ? 'bg-green-600 border-green-600 text-white font-black' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold'}`}
            >
              {comp.logo_url && <img src={comp.logo_url} className="h-3.5 w-3.5 object-contain" alt="" />}
              <span className="text-[10px] uppercase tracking-widest">{comp.name}</span>
            </Link>
          ))}
        </div>

        <div className="p-4 md:p-6 space-y-8 max-w-[1200px] mx-auto">
          {/* Carrossel de Banners Oficiais */}
          <HomeBannerCarousel />

          {/* Seção Destaques */}
          {highlights.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Destaques</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {highlights.map(f => (
                  <MatchCardHighlight key={f.id} fixture={f} />
                ))}
              </div>
            </section>
          )}

          {/* Lista Principal Grouped */}
          <section className="space-y-6">
            <div className="flex flex-col gap-1 px-1">
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Futebol</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{filteredFixtures.length} partidas disponíveis</p>
            </div>
            
            <div className="space-y-8">
              {filteredFixtures.length > 0 ? (
                Object.entries(
                  filteredFixtures.reduce((acc, f) => {
                    const comp = f.competition_name || 'Outros';
                    if (!acc[comp]) acc[comp] = [];
                    acc[comp].push(f);
                    return acc;
                  }, {} as Record<string, typeof filteredFixtures>)
                ).map(([compName, compFixtures]) => (
                  <div key={compName} className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-1 h-3 bg-green-500 rounded-full" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{compName}</h3>
                    </div>
                    <div className="grid gap-2">
                      {compFixtures.map(f => (
                        <MatchCardCompact key={f.id} fixture={f} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <SoccerBall className="h-10 w-10 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Nenhuma partida encontrada</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Bet Slip Sidebar Desktop */}
      <div className={`
        flex-none transition-all duration-300 overflow-hidden
        hidden lg:block
        w-[330px] border-l border-slate-800
      `}>
        <BetSlipSidebar />
      </div>

      {/* Mobile Overlays */}
      <BetSlipDrawer />
    </div>
  );
}
