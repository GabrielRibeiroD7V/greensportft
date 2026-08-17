import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

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
        <div className="flex-1">
          <Outlet />
        </div>
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
    <header className="h-16 border-b bg-white dark:bg-slate-900 sticky top-0 z-40 shrink-0">
      <div className="h-full max-w-[1600px] mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/football" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white font-bold">GS</div>
            <span className="font-bold text-xl tracking-tighter hidden sm:block">GreenSport</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/football" className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-green-600 transition-colors [&.active]:text-green-600">Futebol</Link>
            {user && (
              <>
                <Link to="/my-bets" className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-green-600 transition-colors [&.active]:text-green-600">Minhas Apostas</Link>
                <Link to="/wallet" className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-green-600 transition-colors [&.active]:text-green-600">Carteira</Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-slate-400 leading-none">Saldo</span>
                <span className="font-black text-sm text-green-600">R$ {Number(user.balance).toFixed(2)}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <Link to="/account" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border capitalize">
                  {user.email?.[0]}
                </div>
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">
                  Painel Admin
                </Link>
              )}
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="font-black uppercase tracking-widest text-[10px] px-6">Entrar</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
