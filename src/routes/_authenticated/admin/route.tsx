import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
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
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    // 1. Get user role from DB
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: '/auth' });

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      throw redirect({ to: '/football' });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950">
      {/* Sidebar Admin */}
      <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-4 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-black text-lg tracking-tight text-white uppercase truncate">Green<span className="text-green-500">Admin</span></span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link 
            to="/admin" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white text-sm"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link 
            to="/admin/tickets" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white text-sm"
          >
            <Ticket className="h-4 w-4" />
            <span className="font-medium">Bilhetes</span>
          </Link>
          <Link 
            to="/admin/users" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white text-sm"
          >
            <Users className="h-4 w-4" />
            <span className="font-medium">Usuários</span>
          </Link>
          <Link 
            to="/admin/matches" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white text-sm"
          >
            <Trophy className="h-4 w-4" />
            <span className="font-medium">Partidas</span>
          </Link>
          <Link 
            to="/admin/finance" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white text-sm"
          >
            <Settings className="h-4 w-4" />
            <span className="font-medium">Financeiro</span>
          </Link>
          
          <div className="pt-4 pb-1 px-3 text-[10px] font-black uppercase text-slate-500 tracking-widest">Relatórios</div>
          <Link 
            to="/admin/exposure" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white text-sm"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium">Exposição</span>
          </Link>
          <Link 
            to="/admin/integrations" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white text-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium">Integrações</span>
          </Link>
          <Link 
            to="/admin/mappings" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white text-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium">Mapeamentos</span>
          </Link>
          <Link 
            to="/admin/logs" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white text-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium">Logs</span>
          </Link>
          <Link 
            to="/admin/settings" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-green-600 [&.active]:text-white text-sm"
          >
            <Settings className="h-4 w-4" />
            <span className="font-medium">Configurações</span>
          </Link>

          <Link 
            to="/football" 
            className="flex items-center gap-3 px-3 py-2 mt-4 rounded-lg border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors text-sm"
          >
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span className="font-medium text-green-500">Ver Site</span>
          </Link>
        </nav>

        <div className="p-3 border-t border-slate-800">
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800 h-9 px-3"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/football';
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Sair</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
