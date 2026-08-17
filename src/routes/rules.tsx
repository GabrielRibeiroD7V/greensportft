import { createFileRoute } from "@tanstack/react-router";
import { Shield, Gavel, Scale, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/rules")({
  component: RulesPage,
});

function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Regras e Termos</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Transparência e Jogo Limpo</p>
      </div>

      <div className="grid gap-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Shield className="h-4 w-4 text-green-500" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Regras Gerais</h2>
          </div>
          <Card className="border-none shadow-sm dark:bg-slate-900">
            <CardContent className="pt-6 space-y-4 text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>1. Para apostar na GreenSport, você deve ter no mínimo 18 anos de idade.</p>
              <p>2. Todas as apostas são finais e não podem ser canceladas após a confirmação no bilhete.</p>
              <p>3. Os resultados das partidas são baseados no tempo regulamentar (90 minutos + acréscimos), a menos que especificado de outra forma no mercado.</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Gavel className="h-4 w-4 text-green-500" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Política de Pagamentos</h2>
          </div>
          <Card className="border-none shadow-sm dark:bg-slate-900">
            <CardContent className="pt-6 space-y-4 text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>1. O valor mínimo de depósito é de R$ 10,00.</p>
              <p>2. Saques serão processados apenas para a chave Pix de mesma titularidade do cadastro na plataforma.</p>
              <p>3. A GreenSport reserva-se o direito de auditar qualquer bilhete em caso de suspeita de fraude ou erro técnico evidente nas odds.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
