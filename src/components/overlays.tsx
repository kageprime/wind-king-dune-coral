import { useRef, type ReactNode, type RefObject } from "react";
import { FOUNDING } from "@/lib/veilspire/characters";
import { APP_NAME, GLOSSARY, RANKS, ROLES, TAGLINE } from "@/lib/veilspire/content";
import { Button } from "@/components/ui/button";
import type { VeilspireGame } from "@/game/engine";
import { LOADOUTS, nextUpgradeCost, type LoadoutId } from "@/game/save";
import { useGameStore, type BoonId, type Screen } from "@/game/store";
import { cn } from "@/lib/utils";

export function Overlays({ gameRef }: { gameRef: RefObject<VeilspireGame | null> }) {
  const screen = useGameStore((s) => s.screen);
  const muted = useGameStore((s) => s.muted);
  const g = () => gameRef.current;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-fg">
      <Hud />
      {screen === "playing" || screen === "paused" ? <TouchPad gameRef={gameRef} /> : null}
      {screen === "title" ? <Title onPlay={() => g()?.startRun()} onNav={(s) => g()?.setScreen(s)} /> : null}
      {screen === "loadout" ? <Loadout onBack={() => g()?.setScreen("title")} onPick={(id) => g()?.setLoadout(id)} /> : null}
      {screen === "codex" ? <Codex onBack={() => g()?.setScreen("title")} /> : null}
      {screen === "upgrades" ? (
        <Upgrades
          onBack={() => g()?.setScreen("title")}
          onBuy={(k) => g()?.buyUpgrade(k)}
        />
      ) : null}
      {screen === "paused" ? (
        <Pause
          onResume={() => g()?.setScreen("playing")}
          onQuit={() => g()?.returnToTitle()}
          muted={muted}
          onMute={() => g()?.setMuted(!muted)}
        />
      ) : null}
      {screen === "bargain" ? <Bargain onPick={(id) => g()?.chooseBoon(id)} /> : null}
      {screen === "dead" ? (
        <End
          win={false}
          onAgain={() => g()?.startRun()}
          onTitle={() => g()?.returnToTitle()}
        />
      ) : null}
      {screen === "victory" ? (
        <End win onAgain={() => g()?.startRun()} onTitle={() => g()?.returnToTitle()} />
      ) : null}
    </div>
  );
}

function Hud() {
  const hp = useGameStore((s) => s.hp);
  const maxHp = useGameStore((s) => s.maxHp);
  const runAsh = useGameStore((s) => s.runAsh);
  const ledger = useGameStore((s) => s.ledger);
  const hint = useGameStore((s) => s.waveHint);
  const screen = useGameStore((s) => s.screen);
  const bossHp = useGameStore((s) => s.bossHp);
  const bossMax = useGameStore((s) => s.bossMax);
  const bossName = useGameStore((s) => s.bossName);
  const floats = useGameStore((s) => s.floats);
  const dashCd = useGameStore((s) => s.dashCd);
  const skillCd = useGameStore((s) => s.skillCd);
  const cinderCd = useGameStore((s) => s.cinderCd);
  const loadout = useGameStore((s) => s.loadout);
  if (screen === "title" || screen === "loadout" || screen === "codex" || screen === "upgrades") return null;
  const hpPct = maxHp > 0 ? Math.max(0, hp / maxHp) : 0;
  return (
    <>
      <div className="pointer-events-none absolute top-0 left-0 right-0 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 rounded-md border border-border bg-bg/80 px-3 py-2">
            <p className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">Unsealed</p>
            <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-raised sm:w-52">
              <div className="h-full bg-fg transition-[width] duration-150" style={{ width: `${hpPct * 100}%` }} />
            </div>
            <p className="mt-1 font-mono text-xs tabular-nums text-muted">
              {Math.ceil(hp)} / {maxHp}
            </p>
          </div>
          <div className="rounded-md border border-border bg-bg/80 px-3 py-2 text-right">
            <p className="font-mono text-[10px] tracking-[0.22em] text-ember uppercase">Ash</p>
            <p className="font-mono text-base tabular-nums text-fg">{runAsh}</p>
          </div>
        </div>
        {bossMax > 0 && screen !== "victory" && screen !== "dead" ? (
          <div className="mx-auto mt-3 max-w-md rounded-md border border-border bg-bg/75 px-3 py-2">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">{bossName}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised">
              <div
                className="h-full bg-ember transition-[width] duration-150"
                style={{ width: `${Math.max(0, (bossHp / bossMax) * 100)}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
        <div className="max-w-xl rounded-md border border-border bg-bg/80 px-3 py-2">
          <p className="font-mono text-[11px] leading-relaxed tracking-wide text-fg">{ledger}</p>
          {hint ? <p className="mt-1 font-mono text-[10px] text-muted">{hint}</p> : null}
        </div>
        {screen === "playing" ? (
          <div className="mt-2 hidden gap-2 font-mono text-[10px] tracking-wide text-subtle sm:flex">
            <span>WASD move</span>
            <span>Mouse aim</span>
            <span>Strike</span>
            <span>Space dash</span>
            <span>K {LOADOUTS[loadout].skill}</span>
            <span>Q Host</span>
          </div>
        ) : null}
        {screen === "playing" ? (
          <div className="mt-2 hidden sm:flex gap-2">
            <Cd label="Dash" v={dashCd} />
            <Cd label="Skill" v={skillCd} />
            <Cd label="Host" v={cinderCd} />
          </div>
        ) : null}
      </div>
      {floats.map((f) => (
        <span
          key={f.id}
          className={cn(
            "pointer-events-none absolute -translate-x-1/2 font-mono text-xs tabular-nums",
            f.kind === "ash" ? "text-ember" : f.kind === "heal" ? "text-rift" : "text-fg",
          )}
          style={{ left: f.x, top: f.y }}
        >
          {f.text}
        </span>
      ))}
    </>
  );
}

function Cd({ label, v }: { label: string; v: number }) {
  const ready = v <= 0.05;
  return (
    <span className={cn("rounded-sm border border-border px-2 py-1 font-mono text-[10px]", ready ? "text-fg" : "text-subtle")}>
      {label} {ready ? "ready" : v.toFixed(1)}
    </span>
  );
}

function Title({ onPlay, onNav }: { onPlay: () => void; onNav: (s: Screen) => void }) {
  const rank = useGameStore((s) => s.rank);
  const ash = useGameStore((s) => s.meta.ashBank);
  const rankDef = RANKS.find((r) => r.id === rank);
  return (
    <div className="pointer-events-auto absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-bg-deep via-bg-deep/70 to-transparent p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-10">
      <div className="max-w-xl">
        <p className="font-mono text-[11px] tracking-[0.32em] text-muted uppercase">A Ledger record</p>
        <h1 className="mt-2 font-display text-6xl leading-[0.9] tracking-tight text-fg sm:text-8xl">{APP_NAME}</h1>
        <p className="mt-3 font-display text-xl italic text-muted sm:text-2xl">{TAGLINE}</p>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
          A run-based climb through a tower of dead worlds. You are the Unsealed — weakest licensed body in a city of ranked killers. The Floor Voice is waiting.
        </p>
        <p className="mt-4 font-mono text-xs text-subtle">
          Seal {rankDef?.mark} {rankDef?.name} · Banked Ash {ash}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button size="lg" className="min-h-12" onClick={onPlay}>
            Start climb
          </Button>
          <Button variant="secondary" className="min-h-12" onClick={() => onNav("loadout")}>
            Loadout
          </Button>
          <Button variant="ghost" className="min-h-12" onClick={() => onNav("upgrades")}>
            Ash bank
          </Button>
          <Button variant="ghost" className="min-h-12" onClick={() => onNav("codex")}>
            Codex
          </Button>
        </div>
      </div>
    </div>
  );
}

function Loadout({ onBack, onPick }: { onBack: () => void; onPick: (id: LoadoutId) => void }) {
  const current = useGameStore((s) => s.loadout);
  return (
    <Panel title="Loadout" kicker="Wear the same skeleton. Change the job." onBack={onBack}>
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(LOADOUTS) as LoadoutId[]).map((id) => {
          const L = LOADOUTS[id];
          const on = current === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors duration-150",
                on ? "border-fg bg-raised" : "border-border bg-surface hover:border-border-strong",
              )}
            >
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">{L.role}</p>
              <p className="mt-1 font-display text-2xl text-fg">{L.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{L.line}</p>
              <p className="mt-3 font-mono text-[10px] text-subtle">{L.skill}</p>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function Upgrades({
  onBack,
  onBuy,
}: {
  onBack: () => void;
  onBuy: (k: "vitality" | "host" | "edge") => void;
}) {
  const meta = useGameStore((s) => s.meta);
  const rows: { key: "vitality" | "host" | "edge"; name: string; line: string }[] = [
    { key: "vitality", name: "Vitality", line: "The Unsealed thickens. +18 HP per stamp." },
    { key: "host", name: "Host press", line: "Cinder hits harder. Two slots at rank 2." },
    { key: "edge", name: "Ledger edge", line: "Every cut writes deeper. +12% damage." },
  ];
  return (
    <Panel title="Ash bank" kicker={`${meta.ashBank} Ash held between climbs.`} onBack={onBack}>
      <div className="grid gap-3">
        {rows.map((r) => {
          const lv = meta.upgrades[r.key];
          const cost = nextUpgradeCost(lv);
          const can = meta.ashBank >= cost;
          return (
            <div key={r.key} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-xl text-fg">
                  {r.name} <span className="font-mono text-sm text-muted">I{lv}</span>
                </p>
                <p className="text-sm text-muted">{r.line}</p>
              </div>
              <Button variant={can ? "default" : "secondary"} disabled={!can} onClick={() => onBuy(r.key)}>
                Stamp · {cost}
              </Button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Codex({ onBack }: { onBack: () => void }) {
  return (
    <Panel title="Codex" kicker="Original world. One skeleton. Personality is wear." onBack={onBack}>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h3 className="font-mono text-[10px] tracking-[0.24em] text-muted uppercase">Ranks</h3>
          <ul className="mt-3 space-y-2">
            {RANKS.map((r) => (
              <li key={r.id} className="flex gap-3 text-sm">
                <span className="w-6 font-mono text-fg">{r.mark}</span>
                <span className="text-fg">{r.name}</span>
                <span className="text-muted">{r.summary}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="font-mono text-[10px] tracking-[0.24em] text-muted uppercase">Roles</h3>
          <ul className="mt-3 space-y-2">
            {ROLES.map((r) => (
              <li key={r.id} className="text-sm">
                <span className="text-fg">{r.name}</span>
                <span className="text-muted"> — {r.partyJob} {r.summary}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="lg:col-span-2">
          <h3 className="font-mono text-[10px] tracking-[0.24em] text-muted uppercase">Founding roster</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {FOUNDING.map((c) => (
              <div key={c.id} className="rounded-md border border-border bg-surface p-3">
                <p className="font-display text-lg text-fg">
                  {c.name} <span className="text-muted">· {c.title}</span>
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
                  {c.role} · {c.rank}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{c.blurb}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="lg:col-span-2">
          <h3 className="font-mono text-[10px] tracking-[0.24em] text-muted uppercase">Glossary</h3>
          <ul className="mt-3 space-y-2">
            {GLOSSARY.map((g) => (
              <li key={g.ours} className="text-sm">
                <span className="text-fg">{g.ours}</span>
                <span className="text-muted"> — {g.meaning}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Panel>
  );
}

function Bargain({ onPick }: { onPick: (id: BoonId) => void }) {
  const boons = useGameStore((s) => s.boons);
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-end justify-center bg-bg-deep/55 p-4 sm:items-center">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-panel)] sm:p-7">
        <p className="font-mono text-[10px] tracking-[0.28em] text-muted uppercase">The Ledger offers a bargain</p>
        <h2 className="mt-1 font-display text-3xl text-fg">Choose one. The Floor keeps the rest.</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {boons.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onPick(b.id)}
              className="rounded-lg border border-border bg-raised p-4 text-left hover:border-fg"
            >
              <p className="font-display text-xl text-fg">{b.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.line}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pause({
  onResume,
  onQuit,
  muted,
  onMute,
}: {
  onResume: () => void;
  onQuit: () => void;
  muted: boolean;
  onMute: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg-deep/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-3xl text-fg">Paused</h2>
        <p className="mt-1 text-sm text-muted">The Hollow holds its breath.</p>
        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={onResume}>Resume</Button>
          <Button variant="secondary" onClick={onMute}>
            {muted ? "Unmute" : "Mute"}
          </Button>
          <Button variant="ghost" onClick={onQuit}>
            Leave the Floor
          </Button>
        </div>
      </div>
    </div>
  );
}

function End({
  win,
  onAgain,
  onTitle,
}: {
  win: boolean;
  onAgain: () => void;
  onTitle: () => void;
}) {
  const runAsh = useGameStore((s) => s.runAsh);
  const rank = useGameStore((s) => s.rank);
  const rankDef = RANKS.find((r) => r.id === rank);
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-end justify-center bg-gradient-to-t from-bg-deep via-bg-deep/80 to-transparent p-6 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8">
        <p className="font-mono text-[10px] tracking-[0.28em] text-muted uppercase">{win ? "Floor cleared" : "Record closed"}</p>
        <h2 className="mt-1 font-display text-4xl text-fg">{win ? "The Floor accepts you." : "Ash, then again."}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {win
            ? "A rank shard writes itself. The Unsealed is no longer empty paper."
            : "Death is information. The climb still wrote Ash into your record."}
        </p>
        <p className="mt-4 font-mono text-sm text-fg">
          +{runAsh} Ash · Seal {rankDef?.mark} {rankDef?.name}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={onAgain}>
            Climb again
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onTitle}>
            Threshold
          </Button>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  kicker,
  onBack,
  children,
}: {
  title: string;
  kicker: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 overflow-y-auto bg-bg-deep/88 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-8">
      <div className="mx-auto max-w-4xl pb-12">
        <Button variant="ghost" onClick={onBack} className="mb-4 px-0">
          Back
        </Button>
        <h2 className="font-display text-4xl text-fg sm:text-5xl">{title}</h2>
        <p className="mt-1 text-sm text-muted">{kicker}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function TouchPad({ gameRef }: { gameRef: RefObject<VeilspireGame | null> }) {
  const screen = useGameStore((s) => s.screen);
  if (screen !== "playing") return null;
  return (
    <div className="pointer-events-none absolute inset-0 sm:hidden">
      <Stick
        side="left"
        onVec={(x, y, active) => {
          const g = gameRef.current;
          if (!g) return;
          g.input.touchMove = { x, y, active };
        }}
      />
      <div className="pointer-events-auto absolute right-4 bottom-[max(1.2rem,env(safe-area-inset-bottom))] flex w-44 flex-wrap justify-end gap-2">
        <TouchBtn label="Host" on={(on) => toggle(gameRef, "summon", on)} />
        <TouchBtn label="Skill" on={(on) => toggle(gameRef, "skill", on)} />
        <TouchBtn label="Dash" on={(on) => toggle(gameRef, "dash", on)} />
        <TouchBtn label="Strike" big on={(on) => toggle(gameRef, "attack", on)} />
      </div>
    </div>
  );
}

function toggle(gameRef: RefObject<VeilspireGame | null>, key: string, on: boolean) {
  const g = gameRef.current;
  if (!g) return;
  if (on) g.input.touchButtons.add(key);
  else g.input.touchButtons.delete(key);
}

function TouchBtn({ label, on, big }: { label: string; on: (v: boolean) => void; big?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border border-border bg-bg/70 font-mono text-[10px] tracking-wider text-fg uppercase",
        big ? "h-16 w-16" : "h-12 w-12",
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
        on(true);
      }}
      onPointerUp={() => on(false)}
      onPointerCancel={() => on(false)}
    >
      {label}
    </button>
  );
}

function Stick({
  side,
  onVec,
}: {
  side: "left" | "right";
  onVec: (x: number, y: number, active: boolean) => void;
}) {
  const origin = useRef({ x: 0, y: 0 });
  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-[max(1.2rem,env(safe-area-inset-bottom))] h-32 w-32 rounded-full border border-border bg-bg/40",
        side === "left" ? "left-4" : "right-4",
      )}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        origin.current.x = r.left + r.width / 2;
        origin.current.y = r.top + r.height / 2;
        e.currentTarget.setPointerCapture(e.pointerId);
        const x = (e.clientX - origin.current.x) / 56;
        const y = -(e.clientY - origin.current.y) / 56;
        const l = Math.hypot(x, y) || 1;
        onVec(x / Math.max(1, l), y / Math.max(1, l), true);
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        const x = (e.clientX - origin.current.x) / 56;
        const y = -(e.clientY - origin.current.y) / 56;
        const l = Math.hypot(x, y) || 1;
        onVec(x / Math.max(1, l), y / Math.max(1, l), true);
      }}
      onPointerUp={() => onVec(0, 0, false)}
      onPointerCancel={() => onVec(0, 0, false)}
    />
  );
}
