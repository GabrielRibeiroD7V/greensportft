import { Link } from "@tanstack/react-router";
import { Dribbble as SoccerBall, Radio, Ticket, History, Wallet } from "lucide-react";
import { useBetSlip } from "@/hooks/use-bet-slip";

export function BottomNav() {
  const { selections, toggleOpen } = useBetSlip();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around md:hidden z-50 px-2">
      <Link 
        to="/football" 
        search={{ tab: 'all' }}
        className="flex flex-col items-center gap-1 text-slate-500 transition-colors [&.active]:text-green-500"
      >
        <SoccerBall className="h-5 w-5" />
        <span className="text-[10px] font-black uppercase tracking-tight">Futebol</span>
      </Link>
      
      <Link 
        to="/football" 
        search={{ tab: 'live' }}
        className="flex flex-col items-center gap-1 text-slate-500 transition-colors [&.active]:text-green-500"
      >
        <Radio className="h-5 w-5" />
        <span className="text-[10px] font-black uppercase tracking-tight">Ao Vivo</span>
      </Link>
      
      <button 
        onClick={toggleOpen}
        className="flex flex-col items-center gap-1 -mt-6 bg-green-600 w-14 h-14 rounded-full border-4 border-slate-900 shadow-lg justify-center relative"
      >
        <Ticket className="h-6 w-6 text-white" />
        {selections.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 font-black">
            {selections.length}
          </span>
        )}
      </button>
      
      <Link 
        to="/my-bets" 
        search={{ status: 'all' }}
        className="flex flex-col items-center gap-1 text-slate-500 transition-colors [&.active]:text-green-500"
      >
        <History className="h-5 w-5" />
        <span className="text-[10px] font-black uppercase tracking-tight">Apostas</span>
      </Link>
      
      <Link 
        to="/wallet" 
        className="flex flex-col items-center gap-1 text-slate-500 transition-colors [&.active]:text-green-500"
      >
        <Wallet className="h-5 w-5" />
        <span className="text-[10px] font-black uppercase tracking-tight">Carteira</span>
      </Link>
    </nav>
  );
}
