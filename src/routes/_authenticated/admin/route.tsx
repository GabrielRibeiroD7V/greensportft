import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Trophy, 
  Settings, 
  BarChart3, 
  LogOut,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-black text-xl tracking-tight text-white uppercase">Green<span className="text-green-500">Admin</span></span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link 
            to="/admin" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link 
            to="/admin/tickets" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white"
          >
            <Ticket className="h-5 w-5" />
            <span className="font-medium">Bilhetes</span>
          </Link>
          <Link 
            to="/admin/users" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white"
          >
            <Users className="h-5 w-5" />
            <span className="font-medium">Usuários</span>
          </Link>
          <Link 
            to="/admin/matches" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white"
          >
            <Trophy className="h-5 w-5" />
            <span className="font-medium">Partidas</span>
          </Link>
          
          <div className="pt-4 pb-2 px-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Relatórios</div>
          <Link 
            to="/admin/exposure" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-medium">Exposição</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800">
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
