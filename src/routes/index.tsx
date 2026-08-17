// ============= Full file contents =============

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: '/football', search: { tab: 'all', competition: undefined, q: undefined } });
  },
  component: () => null,
});