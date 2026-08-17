import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Database, RefreshCw, Activity, ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { createServerFn, useServerFn } from "@tanstack/react-start";

// Server function to test connection
export const testFootballConnection = createServerFn({ method: "POST" })
  .handler(async () => {
    const apiKey = process.env['API_FOOTBALL_KEY'];
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return { success: false, code: 'PROVIDER_NOT_CONFIGURED', message: 'API Key não configurada no ambiente.' };
    }
    
    try {
      const response = await fetch("https://v3.football.api-sports.io/status", {
        headers: { "x-rapidapi-key": apiKey, "x-rapidapi-host": "v3.football.api-sports.io" }
      });
      const data = await response.json();
      if (data.errors && Object.keys(data.errors).length > 0) {
        return { success: false, code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas ou erro no provider.' };
      }
      return { success: true, message: 'Conexão validada com sucesso!', data: data.response };
    } catch (e) {
      return { success: false, code: 'PROVIDER_UNAVAILABLE', message: 'Provider indisponível no momento.' };
    }
  });

export const Route = createFileRoute("/_authenticated/admin/integrations/")({
  loader: async ({ context }) => {
    return context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["admin-integrations-settings"],
      queryFn: async () => {
        const { data } = await supabase
          .from("app_settings" as any)
          .select("football_data_mode, id")
          .single();
        return data;
      }
    }));
  },
  component: AdminIntegrationsPage,
});

function AdminIntegrationsPage() {
  const queryClient = useQueryClient();
  const { data: settings } = useSuspenseQuery(Route.options.loader as any) as { data: any };
  const [isTesting, setIsTesting] = useState(false);
  const testConnection = useServerFn(testFootballConnection);

  const handleModeChange = async (mode: 'SIMULATION' | 'REAL') => {
    if (mode === 'REAL') {
        const result = await testConnection();
        if (!result.success) {
            toast.error(`Bloqueado: ${result.message}`);
            return;
        }
    }

    try {
      const { error } = await supabase
        .from("app_settings" as any)
        .update({ football_data_mode: mode })
        .eq('id', settings.id);
      
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-integrations-settings"] });
      toast.success(`Modo de dados alterado para ${mode}`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao alterar modo");
    }
  };

  const runTest = async () => {
    setIsTesting(true);
    try {
      const result = await testConnection();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (e: any) {
      toast.error("Erro técnico ao testar conexão");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Integrações</h1>
        <p className="text-slate-500 font-medium">Gerencie provedores externos de dados e pagamentos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-900 text-white pb-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" /> API-Football
                </CardTitle>
                <CardDescription className="text-slate-400">Provedor de Ligas, Partidas e Scores.</CardDescription>
              </div>
              <Badge variant={settings?.football_data_mode === 'REAL' ? "default" : "secondary"} className="bg-green-600">
                {settings?.football_data_mode}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-xs font-black uppercase">Chave de API</Label>
                  <p className="text-[10px] text-slate-500">Configurada via variável de ambiente.</p>
                </div>
                {process.env.API_FOOTBALL_KEY ? (
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                ) : (
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-sm font-black uppercase">Modo de Operação</Label>
                  <p className="text-xs text-slate-500">REAL requer conexão validada.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">SIM</span>
                    <Switch 
                        checked={settings?.football_data_mode === 'REAL'}
                        onCheckedChange={checked => handleModeChange(checked ? 'REAL' : 'SIMULATION')}
                    />
                    <span className="text-[10px] font-bold text-slate-400">REAL</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={runTest} 
                disabled={isTesting}
                className="font-black uppercase text-[10px] tracking-widest gap-2"
              >
                <Activity className="h-4 w-4" /> {isTesting ? "Testando..." : "Testar Conexão"}
              </Button>
              <Button 
                variant="outline" 
                disabled={settings?.football_data_mode !== 'REAL'}
                className="font-black uppercase text-[10px] tracking-widest gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Sincronizar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm opacity-50 grayscale pointer-events-none">
          <CardHeader className="bg-slate-100 pb-6">
             <CardTitle className="text-lg font-black uppercase flex items-center gap-2 text-slate-500">
              <Database className="h-5 w-5" /> Pagamentos (ASAAS)
            </CardTitle>
            <CardDescription>Gateway de PIX e Liquidação Financeira.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="p-8 text-center border-2 border-dashed rounded-lg">
                <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <span className="text-[10px] font-black uppercase text-slate-400">Bloqueado — Fase 5B</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase text-slate-500">Logs de Integração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-slate-400 italic text-sm">
            Nenhum evento registrado. Configure o provedor para iniciar.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
