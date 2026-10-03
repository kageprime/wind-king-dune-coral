import { create } from "zustand";
import type { RankId } from "@/lib/veilspire/types";
import type { LoadoutId, MetaSave } from "./save";
import { loadSave } from "./save";

export type Screen =
  | "title"
  | "loadout"
  | "codex"
  | "upgrades"
  | "playing"
  | "paused"
  | "bargain"
  | "dead"
  | "victory";

export type Phase =
  | "attract"
  | "intro"
  | "wave1"
  | "wave2"
  | "bargain"
  | "wave3"
  | "boss"
  | "victory"
  | "dead";

export type BoonId = "heart" | "cinder" | "edge" | "dash" | "well";

export type BoonDef = {
  id: BoonId;
  name: string;
  line: string;
};

export type FloatNum = {
  id: number;
  x: number;
  y: number;
  text: string;
  kind: "dmg" | "ash" | "heal";
};

export type HudState = {
  screen: Screen;
  phase: Phase;
  hp: number;
  maxHp: number;
  ash: number;
  runAsh: number;
  rank: RankId;
  loadout: LoadoutId;
  ledger: string;
  floorName: string;
  cinderAlive: boolean;
  cinderCd: number;
  dashCd: number;
  skillCd: number;
  bossHp: number;
  bossMax: number;
  bossName: string;
  waveHint: string;
  floats: FloatNum[];
  boons: BoonDef[];
  meta: MetaSave;
  muted: boolean;
  ready: boolean;
};

const meta = loadSave();

export const useGameStore = create<
  HudState & {
    patch: (p: Partial<HudState>) => void;
  }
>((set) => ({
  screen: "title",
  phase: "attract",
  hp: 100,
  maxHp: 100,
  ash: meta.ashBank,
  runAsh: 0,
  rank: meta.highestRank,
  loadout: meta.loadout,
  ledger: "THE LEDGER IS WATCHING.",
  floorName: "Floor I — The First Hollow",
  cinderAlive: false,
  cinderCd: 0,
  dashCd: 0,
  skillCd: 0,
  bossHp: 0,
  bossMax: 0,
  bossName: "",
  waveHint: "",
  floats: [],
  boons: [],
  meta,
  muted: false,
  ready: false,
  patch: (p) => set(p),
}));
