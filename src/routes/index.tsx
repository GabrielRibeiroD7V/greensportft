import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Green Sport" },
      { name: "description", content: "Green Sport — performance, sustainability, movement." },
      { property: "og:title", content: "Green Sport" },
      { property: "og:description", content: "Green Sport — performance, sustainability, movement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
        Green Sport
      </h1>
    </div>
  );
}
