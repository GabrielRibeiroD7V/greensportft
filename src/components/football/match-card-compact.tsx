import { Fixture, MarketOption } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useBetSlip } from "@/hooks/use-bet-slip";
import { Trophy, ChevronRight } from "lucide-react";

export function MatchCardCompact({ fixture }: { fixture: Fixture }) {
  const { selections, addSelection } = useBetSlip();
  const market = fixture.markets?.find((m: any) => m.name === 'Match Winner' || m.name === '1x2');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-md overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:ring-1 hover:ring-green-500/20 transition-all">
      <div className="p-2">
        {/* Header Compacto */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Trophy className="h-2.5 w-2.5 text-slate-400 shrink-0" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 truncate">
              {fixture.competition_name}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {fixture.status === 'LIVE' ? (
              <span className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="text-[8px] font-black text-slate-400">
                {format(new Date(fixture.start_time), "dd/MM • HH:mm")}
              </span>
            )}
          </div>
        </div>

        {/* Centro: Times e Placar */}
        <div className="flex items-center gap-4 mb-2">
          <Link 
            to="/football/match/$fixtureId" 
            params={{ fixtureId: fixture.id }}
            className="flex-1 space-y-1.5 min-w-0"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <img src={fixture.home_team_logo} className="h-3.5 w-3.5 object-contain" alt="" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{fixture.home_team_name}</span>
              </div>
              {fixture.status === 'LIVE' && <span className="text-[11px] font-black text-green-600">{fixture.home_score}</span>}
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <img src={fixture.away_team_logo} className="h-3.5 w-3.5 object-contain" alt="" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{fixture.away_team_name}</span>
              </div>
              {fixture.status === 'LIVE' && <span className="text-[11px] font-black text-green-600">{fixture.away_score}</span>}
            </div>
          </Link>

          {/* Odds 1X2 */}
          <div className="flex gap-1 shrink-0 items-center">
            {market?.options.map((option: MarketOption) => {
              const isSelected = selections.find((s) => s.optionId === option.id);
              const label = option.name === fixture.home_team_name ? '1' : option.name === fixture.away_team_name ? '2' : 'X';
              
              return (
                <button
                  key={option.id}
                  onClick={() => addSelection(fixture, market as any, option)}
                  className={`
                    flex flex-col items-center justify-center w-10 h-10 rounded-sm border transition-all
                    ${isSelected 
                      ? "bg-green-600 border-green-600 text-white" 
                      : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-green-500 text-slate-700 dark:text-slate-300"}
                  `}
                >
                  <span className="text-[7px] font-black opacity-50">{label}</span>
                  <span className="text-[10px] font-black">{option.odd.toFixed(2)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer: Mais mercados */}
        <div className="flex justify-end pt-1 border-t border-slate-50 dark:border-slate-800/50">
          <Link 
            to="/football/match/$fixtureId" 
            params={{ fixtureId: fixture.id }}
            className="flex items-center gap-1 text-[8px] font-black text-slate-400 hover:text-green-600 uppercase tracking-widest transition-colors"
          >
            +{fixture.markets?.length || 0} Mercados
            <ChevronRight className="h-2 w-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
