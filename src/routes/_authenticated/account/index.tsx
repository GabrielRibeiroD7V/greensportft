import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Shield, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/")({
  loader: async ({ context }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: '/auth' });
    
    return context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["user-profile", user.id],
      queryFn: async () => {
        const { data: profile } = await supabase
          .from('user_roles')
          .select('role, wallets(balance)')
          .eq('user_id', user.id)
          .single();
        return { user, profile };
      }
    }));
  },
  component: AccountPage,
});

function AccountPage() {
  const { data } = useSuspenseQuery(Route.options.loader as any);
  const { user, profile } = data as any;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Minha Conta</h1>
        <p className="text-slate-500 font-medium">Gerencie suas informações e segurança.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase text-slate-500 flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-green-600 rounded-xl text-white text-center">
              <span className="text-[10px] font-black uppercase opacity-80 block mb-1">Saldo Disponível</span>
              <div className="text-3xl font-black">R$ {Number(profile?.wallets?.[0]?.balance || 0).toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
