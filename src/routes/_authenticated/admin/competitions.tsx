import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { getCompetitions } from "@/lib/football.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const competitionsQueryOptions = queryOptions({
  queryKey: ["admin-competitions"],
  queryFn: () => getCompetitions(),
});

export const Route = createFileRoute("/_authenticated/admin/competitions")({
  loader: ({ context }) => context.queryClient.ensureQueryData(competitionsQueryOptions),
  component: AdminCompetitions,
});

function AdminCompetitions() {
  const { data: competitions } = useSuspenseQuery(competitionsQueryOptions);

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase text-slate-900 dark:text-white">Competições</h1>
        <p className="text-slate-500 font-medium">Gerenciamento de ligas e copas integradas.</p>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="text-[10px] font-black uppercase">Nome</TableHead>
                <TableHead className="text-[10px] font-black uppercase">País</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Tipo</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Provider ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitions.map((comp: any) => (
                <TableRow key={comp.id}>
                  <TableCell>
                    {comp.logo_url && <img src={comp.logo_url} alt={comp.name} className="w-8 h-8 object-contain" />}
                  </TableCell>
                  <TableCell className="font-bold text-sm">{comp.name}</TableCell>
                  <TableCell className="text-sm text-slate-500">{comp.country || "Internacional"}</TableCell>
                  <TableCell className="text-xs uppercase font-bold text-slate-400">{comp.type}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{comp.provider_id}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={comp.is_active ? "default" : "secondary"} className="text-[10px] font-black">
                      {comp.is_active ? "ATIVO" : "INATIVO"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
