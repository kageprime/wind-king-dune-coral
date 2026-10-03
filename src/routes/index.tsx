import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  const [App, setApp] = useState<ComponentType | null>(null);
  useEffect(() => {
    void import("@/components/game-app").then((m) => setApp(() => m.GameApp));
  }, []);
  if (!App) {
    return (
      <main className="flex h-dvh items-center justify-center bg-bg-deep text-fg">
        <div className="text-center">
          <h1 className="font-display text-5xl tracking-tight">Veilspire</h1>
          <p className="mt-2 font-mono text-xs tracking-[0.28em] text-muted uppercase">Opening the Ledger</p>
        </div>
      </main>
    );
  }
  return <App />;
}
