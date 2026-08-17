import { QueryClient, QueryClientProvider, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/greensport-logo.png.asset.json";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { Search } from "lucide-react";


import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GreenSport - Apostas Esportivas em Futebol" },
      { name: "description", content: "GreenSport é a plataforma definitiva para apostas em futebol, com odds reais, gestão de banca e análise de risco." },
      { name: "author", content: "GreenSport" },
      { property: "og:title", content: "GreenSport - A Emoção do Futebol" },
      { property: "og:description", content: "Aposte nos principais campeonatos do mundo com a GreenSport." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 pb-16 md:pb-0">
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </QueryClientProvider>
  );
}

function Header() {
  const { data: user } = useSuspenseQuery(queryOptions({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return null;
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();
        
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', data.user.id)
        .single();
        
      return { ...data.user, role: roleData?.role, balance: wallet?.balance || 0 };
    }
  }));

  return (
    <header className="h-14 border-b bg-slate-900 text-white sticky top-0 z-40 shrink-0">
      <div className="h-full max-w-[1600px] mx-auto px-3 md:px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-8">
          <MobileDrawer userRole={user?.role} />
          
          <Link to="/football" search={{ tab: 'all' }} className="flex items-center">
            <img 
              src={logoAsset.url} 
              alt="GreenSport" 
              className="h-[38px] md:h-[45px] w-auto object-contain"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/football" search={{ tab: 'all' }} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors [&.active]:text-green-500">Futebol</Link>
            <Link to="/football" search={{ tab: 'live' }} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors [&.active]:text-green-500">Ao Vivo</Link>
          </nav>
        </div>

        <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
              <input 
                  type="text" 
                  placeholder="Buscar time, campeonato ou partida" 
                  className="w-full bg-slate-800 border-none rounded-md pl-8 pr-3 py-1.5 text-[10px] text-white placeholder:text-slate-500 focus:ring-1 focus:ring-green-500 outline-none uppercase font-bold"
              />
            </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <button className="p-2 md:hidden text-slate-300">
            <Search className="h-5 w-5" />
          </button>
          
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/my-bets" search={{ status: 'all' }} className="hidden md:block text-[10px] font-black uppercase text-slate-300 hover:text-white">Minhas Apostas</Link>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black uppercase text-slate-500 leading-none">Saldo</span>
                <span className="font-black text-[11px] text-green-500">R$ {Number(user.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <Link to="/account" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-black border border-slate-700 capitalize text-xs hover:border-green-500 transition-colors">
                {user.email?.[0]}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
                <Link to="/auth" search={{ redirect: undefined }} className="text-[10px] font-black uppercase text-slate-300 hover:text-white px-2">Entrar</Link>
                <Link to="/auth" search={{ redirect: undefined }}>
                    <Button size="sm" className="font-black uppercase tracking-widest text-[9px] h-8 bg-green-600 hover:bg-green-700">Criar conta</Button>
                </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
