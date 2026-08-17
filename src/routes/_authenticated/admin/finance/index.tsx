import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/finance/")({
  loader: async ({ context }) => {
    return context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["admin-finance"],
      queryFn: async () => {
        const { data: deposits } = await supabase
          .from("deposits")
          .select("*, profiles:user_id(email)")
          .order("created_at", { ascending: false });
        
        const { data: withdrawals } = await supabase
          .from("withdrawals")
          .select("*, profiles:user_id(email)")
          .order("created_at", { ascending: false });
        
        return { deposits: deposits || [], withdrawals: withdrawals || [] };
      }
    }));
  },
  component: AdminFinancePage,
});

function AdminFinancePage() {
  const { data: { deposits, withdrawals } } = useSuspenseQuery(Route.options.loader as any);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleApproveDeposit = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase.rpc('approve_deposit', { p_deposit_id: id });
      if (error) throw error;
      toast.success("Depósito aprovado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-finance"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao aprovar depósito");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Financeiro</h1>
        <p className="text-slate-500 font-medium">Gestão de depósitos e saques da plataforma.</p>
      </div>

      <Tabs defaultValue="deposits" className="w-full">
        <TabsList className="bg-slate-100 p-1 font-black uppercase text-[10px]">
          <TabsTrigger value="deposits">Depósitos</TabsTrigger>
          <TabsTrigger value="withdrawals">Saques</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits">
          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase pl-6">Data</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Usuário</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-right">Valor</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-right pr-6">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-xs text-slate-500 pl-6">{format(new Date(d.created_at), "dd/MM/yy HH:mm")}</TableCell>
                      <TableCell className="text-xs font-bold">{d.profiles?.email}</TableCell>
                      <TableCell className="text-xs font-black text-right">R$ {Number(d.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={d.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-[10px] font-black">
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {d.status === 'PENDING' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveDeposit(d.id)}
                            disabled={processingId === d.id}
                            className="bg-green-600 hover:bg-green-700 font-black uppercase text-[10px]"
                          >
                            {processingId === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aprovar"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
           <Card className="border-none shadow-sm">
            <CardContent className="p-8 text-center text-slate-400 font-medium italic">
              Módulo de gestão de saques em desenvolvimento.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
