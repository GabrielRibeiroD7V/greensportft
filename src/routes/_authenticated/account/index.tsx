import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Shield, Wallet, QrCode, Copy, RefreshCw, BarChart3, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, Suspense } from "react";
import { createDepositFn, getWalletData } from "@/lib/finance.functions";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/account/")({
  pendingComponent: AccountPageSkeleton,
  loader: async ({ context }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: '/auth', search: { redirect: '/account' } as any });
    
    return context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["user-account-data", user.id],
      queryFn: async () => {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        const walletData = await getWalletData();

        const { data: stats } = await supabase
          .from('betting_tickets')
          .select('stake, status, created_at')
          .eq('user_id', user.id);
        
        const totalStaked = stats?.reduce((acc: number, curr: any) => acc + Number(curr.stake || 0), 0) || 0;
        const totalTickets = stats?.length || 0;
        const sortedStats = [...(stats || [])].sort((a: any, b: any) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });
        const lastActivity = sortedStats.length > 0 && sortedStats[0]?.created_at
          ? new Date(sortedStats[0].created_at)
          : null;

        return { 
          user, 
          profile: roleData || { role: 'user' }, 
          walletData: walletData || { wallet: { balance: 0 }, recentTransactions: [], activeDeposits: [] }, 
          stats: { totalStaked, totalTickets, lastActivity } 
        };
      }
    }));
  },
  component: () => <AccountPage />,
});

function AccountPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function AccountPage() {
  const { data } = useSuspenseQuery(Route.options.loader as any) as { data: any };
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
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Minha Conta</h1>
          <p className="text-slate-500 font-medium">Gerencie suas informações e segurança.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["user-account-data"] })}
          className="gap-2 bg-white border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest h-9"
        >
          <RefreshCw className="h-3 w-3" /> Atualizar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" /> Detalhes do Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Endereço de E-mail</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="font-bold text-sm text-slate-700">{user.email}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Status da Conta</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-green-700">
                  <Shield className="h-4 w-4" />
                  <span className="font-black text-sm uppercase tracking-widest">{profile?.role || 'USUÁRIO'}</span>
                </div>
              </div>
              {stats.lastActivity && (
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium pt-2">
                  <Clock className="h-3.5 w-3.5" />
                  Última atividade: {stats.lastActivity.toLocaleDateString()} às {stats.lastActivity.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" /> Recarga Rápida (Pix)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">R$</span>
                  <Input 
                    type="number" 
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="pl-9 font-black border-slate-200 focus:ring-green-500 h-11"
                    placeholder="0,00"
                  />
                </div>
                <Button 
                  onClick={() => depositMutation.mutate({ data: { amount: Number(depositAmount) } } as any)}
                  disabled={depositMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-[10px] px-6 h-11 shadow-lg shadow-green-600/20"
                >
                  Recarregar
                </Button>
              </div>

              {walletData?.activeDeposits?.length > 0 && (
                <div className="mt-4 p-5 bg-yellow-50 border border-yellow-100 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 text-yellow-800 font-black text-[10px] uppercase tracking-widest">
                    <QrCode className="h-4 w-4" /> Depósito Pendente
                  </div>
                  
                  {walletData?.activeDeposits[0].pix_qr_code ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-white p-3 rounded-xl border border-yellow-200 shadow-sm">
                        <img 
                          src={`data:image/png;base64,${walletData.activeDeposits[0].pix_qr_code}`} 
                          alt="Pix QR Code" 
                          className="w-40 h-40"
                        />
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="w-full font-black text-[10px] uppercase tracking-widest gap-2 bg-white hover:bg-yellow-100 text-yellow-900 border-yellow-200"
                        onClick={() => copyToClipboard(walletData?.activeDeposits[0].pix_copy_paste)}
                      >
                        <Copy className="h-3 w-3" /> Copiar Código Pix
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[10px] text-yellow-700 font-black uppercase tracking-widest animate-pulse">
                      Aguardando confirmação do servidor...
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-2xl bg-slate-900 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-green-500/20 transition-colors duration-500" />
            <CardContent className="p-8 space-y-8 relative z-10">
              <div className="text-center space-y-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">Saldo na Conta</span>
                <div className="text-5xl font-black tracking-tighter flex items-baseline justify-center gap-1.5">
                  <span className="text-xl font-bold text-slate-500">R$</span>
                  {Number(walletData?.wallet?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-8">
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-slate-500">
                    <BarChart3 className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Total Apostado</span>
                  </div>
                  <div className="text-xl font-black text-white">R$ {(stats?.totalStaked || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-slate-500">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Bilhetes</span>
                  </div>
                  <div className="text-xl font-black text-white">{stats?.totalTickets || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-600" /> Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {walletData?.recentTransactions?.length > 0 ? (
                  walletData?.recentTransactions.map((tx: any) => (
                    <div key={tx.id} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                      <div className="space-y-0.5">
                        <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs font-black text-slate-700 uppercase tracking-tight">{tx.type}</div>
                      </div>
                      <div className={`text-sm font-black ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''} R$ {Number(tx.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-300">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <RefreshCw className="h-8 w-8" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sem movimentações</span>
                    </div>
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