import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Shield, Wallet, QrCode, Copy, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { createDepositFn, getWalletData } from "@/lib/finance.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/")({
  loader: async ({ context }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: '/auth' });
    
    return context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["user-account-data", user.id],
      queryFn: async () => {
        const { data: profile } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        const walletData = await getWalletData();

        const { data: stats } = await supabase
          .from('betting_tickets')
          .select('stake, status')
          .eq('user_id', user.id);
        
        const totalStaked = stats?.reduce((acc, curr) => acc + Number(curr.stake), 0) || 0;
        const totalTickets = stats?.length || 0;

        return { user, profile, walletData, stats: { totalStaked, totalTickets } };
      }
    }));
  },
  component: AccountPage,
});

function AccountPage() {
  const { data } = useSuspenseQuery(Route.options.loader as any);
  const { user, profile, walletData, stats } = data as any;
  const [depositAmount, setDepositAmount] = useState("50");
  const queryClient = useQueryClient();

  const depositMutation = useMutation({
    mutationFn: createDepositFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-account-data"] });
      toast.success("Depósito solicitado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Minha Conta</h1>
          <p className="text-slate-500 font-medium">Gerencie suas informações e segurança.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["user-account-data"] })}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase text-slate-500 flex items-center gap-2">
                <User className="h-4 w-4" /> Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">E-mail</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="font-bold text-sm">{user.email}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Nível de Acesso</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border text-green-700">
                  <Shield className="h-4 w-4" />
                  <span className="font-black text-sm uppercase">{profile?.role}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase text-slate-500 flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Novo Depósito (Pix)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <Input 
                    type="number" 
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="pl-9 font-bold"
                    placeholder="0,00"
                  />
                </div>
                <Button 
                  onClick={() => depositMutation.mutate({ amount: Number(depositAmount) })}
                  disabled={depositMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white font-black uppercase"
                >
                  Depositar
                </Button>
              </div>

              {walletData.activeDeposits?.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-yellow-800 font-black text-[10px] uppercase">
                    <QrCode className="h-4 w-4" /> Depósito Pendente
                  </div>
                  
                  {walletData.activeDeposits[0].pix_qr_code ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-white p-2 rounded-lg border">
                        <img 
                          src={`data:image/png;base64,${walletData.activeDeposits[0].pix_qr_code}`} 
                          alt="Pix QR Code" 
                          className="w-48 h-48"
                        />
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="w-full font-bold text-xs gap-2"
                        onClick={() => copyToClipboard(walletData.activeDeposits[0].pix_copy_paste)}
                      >
                        <Copy className="h-3 w-3" /> Copiar Código Pix
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-yellow-700 font-medium">
                      Depósito em simulação. Aguardando processamento...
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-green-600 text-white">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <span className="text-[10px] font-black uppercase opacity-80 block mb-1">Saldo Disponível</span>
                <div className="text-4xl font-black">R$ {Number(walletData.wallet?.balance || 0).toFixed(2)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase opacity-70 block mb-1">Total Apostado</span>
                  <div className="text-lg font-black">R$ {stats.totalStaked.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase opacity-70 block mb-1">Bilhetes</span>
                  <div className="text-lg font-black">{stats.totalTickets}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase text-slate-500">Últimas Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {walletData.recentTransactions?.length > 0 ? (
                  walletData.recentTransactions.map((tx: any) => (
                    <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <div className="text-[10px] font-black uppercase text-slate-400">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm font-bold text-slate-700">{tx.type}</div>
                      </div>
                      <div className={`text-sm font-black ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''} R$ {tx.amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm font-medium italic">
                    Nenhuma transação encontrada.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
