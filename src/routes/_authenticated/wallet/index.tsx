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
import { Wallet, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wallet/")({
  loader: async ({ context }) => {
    const { data: { user } } = await supabase.auth.getUser();
    return context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["wallet-history", user?.id],
      queryFn: async () => {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", user?.id)
          .single();
        
        const { data: history } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("wallet_id", (wallet as any)?.id) // This assumes we get the wallet id
          .order("created_at", { ascending: false });
        
        return { wallet, history: history || [] };
      }
    }));
  },
  component: WalletPage,
});

function WalletPage() {
  const { data } = useSuspenseQuery(Route.options.loader as any);
  const { wallet, history } = data as any;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Minha Carteira</h1>
        <p className="text-slate-500 font-medium">Extrato detalhado e gestão de saldo.</p>
      </div>

      <Card className="border-none shadow-lg bg-green-600 text-white">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <Wallet className="h-10 w-10 mb-4 opacity-50" />
          <span className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Saldo Atual</span>
          <div className="text-5xl font-black">R$ {Number(wallet?.balance || 0).toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase">Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase pl-6">Data</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Tipo</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Referência</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-right pr-6">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs text-slate-500 pl-6">{format(new Date(tx.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-black uppercase flex w-fit gap-1 items-center">
                      {tx.type === 'DEPOSIT' || tx.type === 'WIN' ? (
                        <ArrowDownCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <ArrowUpCircle className="h-3 w-3 text-red-500" />
                      )}
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-500 truncate max-w-[200px]">{tx.reference_id || '-'}</TableCell>
                  <TableCell className={`text-right pr-6 font-black text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''} R$ {Number(tx.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-400 font-medium italic">
                    Nenhuma movimentação registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
