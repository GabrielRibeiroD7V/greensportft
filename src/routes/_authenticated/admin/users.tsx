import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: () => <div className="p-8"><h1 className="text-2xl font-black uppercase">Usuários (Mock)</h1></div>,
});
