import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, Landmark, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/wallet/")({
  loader: async ({ context }) => {
    const { data: { user } } = await supabase.auth.getUser();
    return context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["wallet-history", user?.id || 'anon'],
      queryFn: async () => {
        let { data: wallet } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user?.id as string)
          .maybeSingle();

        if (!wallet && user?.id) {
          const { data: newWallet } = await supabase
            .from("wallets")
            .insert({ user_id: user.id, balance: 0 })
            .select()
            .single();
          wallet = newWallet;
        }
        
        const { data: history } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("wallet_id", wallet?.id || '00000000-0000-0000-0000-000000000000')
          .order("created_at", { ascending: false });
        
        // Mock totals if not in DB, for UI consistency
        const totals = {
          deposited: history?.filter(t => t.type === 'deposit').reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0,
          staked: history?.filter(t => t.type === 'bet').reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0) || 0,
          won: history?.filter(t => t.type === 'win').reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0,
          withdrawn: history?.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0) || 0,
        };
        
        return { wallet, history: history || [], totals };
      }
    }));
  },
  component: WalletPage,
});

function WalletPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

function WalletPage() {
  const { data } = useSuspenseQuery(Route.options.loader as any) as { data: any };
  const { wallet, history, totals } = data as any;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Carteira</h1>
          <p className="text-slate-500 font-medium">Gerencie seu saldo e movimentações.</p>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-green-500/20 transition-colors duration-700" />
        <CardContent className="p-8 md:p-12 flex flex-col items-center justify-center text-center relative z-10">
          <div className="bg-slate-800 p-3 rounded-full mb-4">
            <Wallet className="h-6 w-6 text-green-500" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Saldo disponível</span>
          <div className="text-5xl md:text-6xl font-black tracking-tighter text-white flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-500">R$</span>
            {Number(wallet?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          
          <div className="flex gap-3 mt-8 w-full max-w-sm">
            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-[10px] h-11">
              <TrendingUp className="h-4 w-4 mr-2" /> Depositar
            </Button>
            <Button variant="outline" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] h-11">
              <TrendingDown className="h-4 w-4 mr-2" /> Sacar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Depositado', value: totals.deposited, icon: Landmark, color: 'text-blue-500' },
          { label: 'Apostado', value: totals.staked, icon: TrendingDown, color: 'text-orange-500' },
          { label: 'Ganhos', value: totals.won, icon: TrendingUp, color: 'text-green-500' },
          { label: 'Sacado', value: totals.withdrawn, icon: Receipt, color: 'text-red-500' },
        ].map((item) => (
          <Card key={item.label} className="border-none shadow-sm bg-white">
            <CardContent className="p-4 md:p-6 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <item.icon className={`h-3 w-3 ${item.color}`} />
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{item.label}</span>
              </div>
              <div className="text-lg font-black text-slate-900">
                R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 pb-4">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-green-600" /> Histórico de Transações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-[9px] font-black uppercase pl-6 text-slate-400">Data</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-slate-400">Tipo</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-slate-400">Referência</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-right pr-6 text-slate-400">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history?.map((tx: any) => (
                  <TableRow key={tx.id} className="hover:bg-slate-50/50 border-slate-50">
                    <TableCell className="text-[11px] font-medium text-slate-500 pl-6">
                      {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-black uppercase border-none bg-slate-100 text-slate-700 flex w-fit gap-1 items-center px-2 py-0.5">
                        {tx.type === 'deposit' || tx.type === 'win' ? (
                          <ArrowDownCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowUpCircle className="h-3 w-3 text-red-500" />
                        )}
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] font-bold text-slate-400 font-mono">
                      {tx.reference_id ? `#${tx.reference_id.substring(0, 8)}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right pr-6 font-black text-sm ${Number(tx.amount || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Number(tx.amount || 0) > 0 ? '+' : ''} R$ {Number(tx.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
                {(!history || history.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-slate-400 font-medium">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <Receipt className="h-8 w-8" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Nenhuma movimentação encontrada</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}