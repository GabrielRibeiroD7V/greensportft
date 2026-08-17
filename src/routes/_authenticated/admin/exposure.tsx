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
          <CardTitle className="text-lg font-black uppercase tracking-tight">Top Exposições por Partida</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">Partida</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 text-center">Bilhetes</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 text-right">Stake</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 text-right">Passivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {risk.byFixture?.map((f: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{f.name}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-slate-600">{f.count}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">R$ {f.stake.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-red-600">R$ {f.potential.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
                {(!risk.byFixture || risk.byFixture.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic font-medium">
                      Nenhuma exposição ativa identificada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase tracking-tight">Definição de Exposição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h4 className="text-sm font-black uppercase mb-2">Nota Técnica</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Neste estágio, a <span className="font-bold">Exposição Bruta</span> reflete o Payout Potencial total (Liability). 
              Esta é uma métrica operacional simplificada que não considera compensações entre outcomes (ex: se o time A vence, o passivo do time B é anulado).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
