import { createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: '/football' });
  },
});


function Index() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-white space-y-8">
      <h1 className="text-5xl font-black tracking-tighter text-slate-900 sm:text-8xl uppercase">
        Green<span className="text-green-600">Sport</span>
      </h1>
      
      <div className="flex gap-4">
        <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-widest px-8">
          <Link to="/football">Ver Jogos</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="border-2 font-bold uppercase tracking-widest px-8">
          <Link to="/admin">Painel Admin</Link>
        </Button>
      </div>
    </div>
  );
}

