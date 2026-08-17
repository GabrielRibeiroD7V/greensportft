import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/matches")({
  component: () => <div className="p-8"><h1 className="text-2xl font-black uppercase">Partidas (Mock)</h1></div>,
});
