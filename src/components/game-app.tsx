import { useEffect, useRef } from "react";
import { VeilspireGame } from "@/game/engine";
import { Overlays } from "@/components/overlays";
import { useGameStore } from "@/game/store";

export function GameApp() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<VeilspireGame | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new VeilspireGame(canvas);
    gameRef.current = game;
    (window as unknown as { __veilspire?: VeilspireGame }).__veilspire = game;
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  const ready = useGameStore((s) => s.ready);

  return (
    <div
      ref={wrapRef}
      className="relative h-dvh w-full overflow-hidden bg-bg-deep text-fg"
      style={{ touchAction: "none" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {ready ? <Overlays gameRef={gameRef} /> : <Boot />}
    </div>
  );
}

function Boot() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-bg-deep">
      <p className="font-display text-4xl tracking-tight text-fg">Veilspire</p>
      <p className="font-mono text-xs tracking-[0.28em] text-muted uppercase">Opening the Ledger</p>
    </div>
  );
}
