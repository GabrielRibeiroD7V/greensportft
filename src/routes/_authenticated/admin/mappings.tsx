import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/mappings")({
  loader: async ({ context }) => {
    return context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["admin-mappings"],
      queryFn: async () => {
        const { data: markets } = await supabase
          .from("market_mappings")
          .select("*")
          .order('internal_market_name', { ascending: true });
        
        const { data: selections } = await supabase
          .from("selection_mappings")
          .select("*")
          .order('internal_selection_name', { ascending: true });

        return { markets, selections };
      }
    }));
  },
  component: AdminMappingsPage,
});

function AdminMappingsPage() {
  const { data } = useSuspenseQuery(Route.options.loader as any) as { data: any };
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMarkets = data.markets?.filter((m: any) => 
    m.internal_market_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.provider_market_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSelections = data.selections?.filter((s: any) => 
    s.internal_selection_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.provider_selection_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Mapeamentos</h1>
          <p className="text-slate-500 font-medium">De/Para entre Provider e Sistema Interno.</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar mercado..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="bg-slate-900 text-white py-4">
          <CardTitle className="text-sm font-black uppercase tracking-wider">Mercados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-slate-200">
                <TableHead className="font-black text-slate-500 uppercase text-[10px]">Internal Market</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[10px]">Provider Market</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[10px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {filteredMarkets?.map((market: any) => (
                <TableRow key={market.id}>
                  <TableCell className="font-bold text-slate-700">{market.internal_market_name}</TableCell>
                  <TableCell className="text-slate-500">{market.provider_market_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-black uppercase">
                      MAPPED
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredMarkets || filteredMarkets.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-slate-400 italic">
                    Nenhum mapeamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="bg-slate-900 text-white py-4">
          <CardTitle className="text-sm font-black uppercase tracking-wider">Seleções (De/Para)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-slate-200">
                <TableHead className="font-black text-slate-500 uppercase text-[10px]">Internal Selection</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[10px]">Provider Selection</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[10px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSelections?.map((selection: any) => (
                <TableRow key={selection.id}>
                  <TableCell className="font-bold text-slate-700">{selection.internal_selection_name}</TableCell>
                  <TableCell className="text-slate-500">{selection.provider_selection_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-black uppercase">
                      MAPPED
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredSelections || filteredSelections.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-slate-400 italic">
                    Nenhum mapeamento de seleção encontrado.
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
