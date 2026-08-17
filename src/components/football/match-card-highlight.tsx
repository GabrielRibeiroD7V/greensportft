import { Fixture, Market, MarketOption } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useBetSlip } from "@/hooks/use-bet-slip";
import { Trophy } from "lucide-react";

export function MatchCardHighlight({ fixture }: { fixture: Fixture }) {
  const { selections, addSelection } = useBetSlip();
  const market = fixture.markets?.find((m: any) => m.name === 'Match Winner' || m.name === '1x2');

  return (
    <div className="min-w-[300px] md:min-w-[400px] bg-slate-900 rounded-xl overflow-hidden relative group border border-slate-800 shadow-xl snap-start">
      <div className="p-4 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-3 w-3 text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate max-w-[150px]">
              {fixture.competition_name}
            </span>
          </div>
          {fixture.status === 'LIVE' ? (
            <span className="bg-red-600 text-[9px] font-black px-2 py-0.5 rounded text-white animate-pulse">LIVE</span>
          ) : (
            <span className="text-[9px] font-black text-slate-500">{format(new Date(fixture.start_time), "HH:mm")}</span>
          )}
        </div>

        <div className="flex justify-between items-center px-4 mb-6">
          <div className="flex flex-col items-center gap-2 w-20">
            <img src={fixture.home_team_logo} className="h-10 w-10 object-contain" alt="" />
            <span className="text-[10px] font-black text-white text-center line-clamp-2">{fixture.home_team_name}</span>
          </div>
          
          <div className="flex flex-col items-center">
            {fixture.status === 'LIVE' ? (
              <span className="text-2xl font-black text-green-500">{fixture.home_score} - {fixture.away_score}</span>
            ) : (
              <span className="text-xs font-black text-slate-600 uppercase tracking-[0.3em]">VS</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 w-20">
            <img src={fixture.away_team_logo} className="h-10 w-10 object-contain" alt="" />
            <span className="text-[10px] font-black text-white text-center line-clamp-2">{fixture.away_team_name}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {market?.options.map((option: MarketOption) => {
            const isSelected = selections.find((s) => s.optionId === option.id);
            const label = option.name === fixture.home_team_name ? '1' : option.name === fixture.away_team_name ? '2' : 'X';
            
            return (
              <button
                key={option.id}
                onClick={() => addSelection(fixture, market as any, option)}
                className={`
                  flex flex-col items-center justify-center h-12 rounded-lg transition-all border
                  ${isSelected 
                    ? "bg-green-600 border-green-600 text-white" 
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-green-500"}
                `}
              >
                <span className="text-[9px] font-black uppercase opacity-60">{label}</span>
                <span className="text-sm font-black">{option.odd.toFixed(2)}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      <Link 
        to="/football/match/$fixtureId" 
        params={{ fixtureId: fixture.id }}
        className="absolute inset-0 z-0 pointer-events-none"
      />
    </div>
  );
}
