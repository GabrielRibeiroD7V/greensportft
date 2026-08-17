import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings/")({
  loader: async ({ context }) => {
    return context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["admin-settings"],
      queryFn: async () => {
        const { data } = await supabase
          .from("app_settings")
          .select("*")
          .single();
        return data || {
          global_margin_percentage: 0,
          min_stake: 10,
          max_stake: 5000,
          max_payout: 50000,
          betting_enabled: true
        };
      }
    }));
  },
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const { data: initialSettings } = useSuspenseQuery(Route.options.loader as any);
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ ...settings, id: settings.id || undefined })
        .select();
      
      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Configurações Globais</h1>
        <p className="text-slate-500 font-medium">Controle de limites, margens e status da plataforma.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase">Limites de Aposta</CardTitle>
          <CardDescription>Defina os valores mínimos e máximos permitidos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Aposta Mínima (R$)</Label>
              <Input 
                type="number" 
                value={settings.min_stake} 
                onChange={e => setSettings({...settings, min_stake: Number(e.target.value)})}
                className="font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Aposta Máxima (R$)</Label>
              <Input 
                type="number" 
                value={settings.max_stake} 
                onChange={e => setSettings({...settings, max_stake: Number(e.target.value)})}
                className="font-bold"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">Prêmio Máximo por Bilhete (R$)</Label>
            <Input 
              type="number" 
              value={settings.max_payout} 
              onChange={e => setSettings({...settings, max_payout: Number(e.target.value)})}
              className="font-bold"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase">Operação</CardTitle>
          <CardDescription>Controle de margem e status do sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">Margem da Casa (%)</Label>
            <Input 
              type="number" 
              value={settings.global_margin_percentage} 
              onChange={e => setSettings({...settings, global_margin_percentage: Number(e.target.value)})}
              className="font-bold"
            />
            <p className="text-[10px] text-slate-400 font-medium italic">A margem reduz as odds exibidas para o usuário final.</p>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
            <div className="space-y-0.5">
              <Label className="text-sm font-black uppercase">Apostas Habilitadas</Label>
              <p className="text-xs text-slate-500">Ative ou desative o recebimento de novos bilhetes.</p>
            </div>
            <Switch 
              checked={settings.betting_enabled}
              onCheckedChange={checked => setSettings({...settings, betting_enabled: checked})}
            />
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase py-6 gap-2"
      >
        <Save className="h-5 w-5" />
        {isSaving ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
}
