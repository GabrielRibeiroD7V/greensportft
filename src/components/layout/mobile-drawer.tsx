import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from "@/components/ui/sheet";
import { Link } from "@tanstack/react-router";
import { 
  Menu, 
  Dribbble as SoccerBall, 
  Radio, 
  Calendar, 
  Star, 
  History, 
  Ticket, 
  Wallet, 
  User,
  Trophy
} from "lucide-react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getCompetitions } from "@/lib/football.functions";

export function MobileDrawer({ userRole }: { userRole?: string | undefined }) {
  const { data: competitions } = useSuspenseQuery(queryOptions({
    queryKey: ["competitions"],
    queryFn: () => getCompetitions(),
  }));

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="p-2 text-slate-300 hover:text-white md:hidden">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-slate-950 border-slate-800 text-slate-300 overflow-y-auto">
        <SheetHeader className="p-6 border-b border-slate-800 text-left">
          <SheetTitle className="text-white font-black uppercase tracking-tighter text-xl italic">
            GREEN<span className="text-green-500">SPORT</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="p-4 space-y-6">
          <section className="space-y-1">
            <h3 className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Explorar</h3>
            <Link to="/football" search={{ tab: 'all', competition: undefined, q: undefined }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 text-sm font-bold">
              <SoccerBall className="h-4 w-4" /> Futebol
            </Link>
            <Link to="/football" search={{ tab: 'live', competition: undefined, q: undefined }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 text-sm font-bold">
              <Radio className="h-4 w-4 text-red-500" /> Ao Vivo
            </Link>
            <Link to="/football" search={{ tab: 'today', competition: undefined, q: undefined }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 text-sm font-bold">
              <Calendar className="h-4 w-4" /> Hoje
            </Link>
            <Link to="/football" search={{ tab: 'upcoming', competition: undefined, q: undefined }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 text-sm font-bold">
              <Calendar className="h-4 w-4" /> Próximos
            </Link>
            <Link to="/football" search={{ tab: 'all' }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 text-sm font-bold">
              <Star className="h-4 w-4 text-amber-500" /> Favoritos
            </Link>
          </section>

          <section className="space-y-1">
            <h3 className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Minha Área</h3>
            <Link to="/my-bets" search={{ status: 'all' }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 text-sm font-bold">
              <History className="h-4 w-4" /> Minhas Apostas
            </Link>
            <Link to="/my-bets" search={{ status: 'pending' }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 text-sm font-bold">
              <Ticket className="h-4 w-4" /> Bilhetes em Aberto
            </Link>
            <Link to="/wallet" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 text-sm font-bold">
              <Wallet className="h-4 w-4" /> Carteira
            </Link>
            <Link to="/account" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 text-sm font-bold">
              <User className="h-4 w-4" /> Minha Conta
            </Link>
          </section>

          <section className="space-y-1">
            <h3 className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Ligas</h3>
            {competitions.slice(0, 10).map((comp: any) => (
              <Link 
                key={comp.id} 
                to="/football" 
                search={{ tab: 'all', competition: comp.name, q: undefined }} 
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-900 text-sm font-bold"
              >
                <div className="flex items-center gap-3 truncate">
                  {comp.logo_url ? (
                    <img src={comp.logo_url} className="h-4 w-4 object-contain" alt="" />
                  ) : (
                    <Trophy className="h-4 w-4 text-slate-700" />
                  )}
                  <span className="truncate">{comp.name}</span>
                </div>
              </Link>
            ))}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
