import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getRiskExposure } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, Ticket } from "lucide-react";

const riskQueryOptions = queryOptions({
  queryKey: ["admin-risk"],
  queryFn: () => getRiskExposure(),
});

export const Route = createFileRoute("/_authenticated/admin/exposure")({
  loader: ({ context }) => context.queryClient.ensureQueryData(riskQueryOptions),
  component: AdminRisk,
});

function AdminRisk() {
  const { data: risk } = useSuspenseQuery(riskQueryOptions);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Exposição e Risco</h1>
        <p className="text-slate-500 font-medium">Análise de passivos e exposição em tempo real.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-lg bg-white dark:bg-slate-900 border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Passivo Total (Potential Payout)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">R$ {risk.totalPotentialPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-tighter">Valor total a ser pago se todos os bilhetes vencerem</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white dark:bg-slate-900 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Volume em Aberto (Stakes)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">R$ {risk.totalStakes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-tighter">Total de apostas aguardando resultado</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white dark:bg-slate-900 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Bilhetes Pendentes</CardTitle>
            <Ticket className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">{risk.pendingTicketsCount}</div>
            <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-tighter">Quantidade de tickets no mercado</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase tracking-tight">Análise de Risco</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h4 className="text-sm font-black uppercase mb-2">Resumo Operacional</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Atualmente, a plataforma possui uma exposição bruta de <span className="font-bold text-red-600">R$ {risk.totalPotentialPayout.toFixed(2)}</span>. 
              O lucro garantido (se todas as apostas forem perdidas) é de <span className="font-bold text-green-600">R$ {risk.totalStakes.toFixed(2)}</span>.
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-medium italic">
            * Dados calculados com base em todos os bilhetes com status PENDING.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
