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
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { approveWithdrawalFn, rejectWithdrawalFn, approveDepositFn } from "@/lib/admin.functions";

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
  const { data } = useSuspenseQuery(Route.options.loader as any);
  const { deposits, withdrawals } = data as any;
  const [processingId, setProcessingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const approveWithdrawal = useServerFn(approveWithdrawalFn);
  const approveDeposit = useServerFn(approveDepositFn);
  const rejectWithdrawal = useServerFn(rejectWithdrawalFn);

  const handleApproveDeposit = async (id: string) => {
    setProcessingId(id);
    try {
      await approveDeposit({ data: { depositId: id } });
      toast.success("Depósito aprovado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-finance"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao aprovar depósito");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    setProcessingId(id);
    try {
      await approveWithdrawal({ data: { withdrawalId: id } });
      toast.success("Saque aprovado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-finance"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao aprovar saque");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    setProcessingId(id);
    try {
      await rejectWithdrawal({ data: { withdrawalId: id } });
      toast.success("Saque rejeitado e estornado!");
      queryClient.invalidateQueries({ queryKey: ["admin-finance"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao rejeitar saque");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-[1600px] mx-auto">
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
                        <Badge variant={d.status === 'PAID' ? 'default' : 'secondary'} className="text-[10px] font-black">
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
                  {deposits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400 italic">Nenhum depósito registrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
           <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase pl-6">Data</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Usuário</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-right">Valor</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-right pr-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-xs text-slate-500 pl-6">{format(new Date(w.created_at), "dd/MM/yy HH:mm")}</TableCell>
                      <TableCell className="text-xs font-bold">{w.profiles?.email}</TableCell>
                      <TableCell className="text-xs font-black text-right text-red-600">R$ {Number(w.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={w.status === 'APPROVED' ? 'default' : w.status === 'REJECTED' ? 'destructive' : 'secondary'} className="text-[10px] font-black">
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {w.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleApproveWithdrawal(w.id)}
                              disabled={processingId === w.id}
                              className="bg-green-600 hover:bg-green-700 font-black uppercase text-[10px] h-8 w-8 p-0"
                              title="Aprovar"
                            >
                              {processingId === w.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRejectWithdrawal(w.id)}
                              disabled={processingId === w.id}
                              className="font-black uppercase text-[10px] h-8 w-8 p-0"
                              title="Rejeitar e Estornar"
                            >
                              {processingId === w.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {withdrawals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400 italic">Nenhum saque registrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}