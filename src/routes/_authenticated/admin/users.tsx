import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getAdminUsers } from "@/lib/admin.functions";
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

const adminUsersQueryOptions = queryOptions({
  queryKey: ["admin-users"],
  queryFn: () => getAdminUsers(),
});

export const Route = createFileRoute("/_authenticated/admin/users")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminUsersQueryOptions),
  component: AdminUsers,
});

function AdminUsers() {
  const { data: users } = useSuspenseQuery(adminUsersQueryOptions);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Gestão de Usuários</h1>
        <p className="text-slate-500 font-medium">Controle de perfis, saldos e permissões.</p>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase pl-6">Usuário ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Role</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-right pr-6">Saldo (BRL)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user: any) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <TableCell className="text-xs font-mono text-slate-500 pl-6">{user.user_id}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-[10px] font-black uppercase">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 font-black text-sm">
                    R$ {Number(user.wallets?.balance || 0).toFixed(2)}
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
