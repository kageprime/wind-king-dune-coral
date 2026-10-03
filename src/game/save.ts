import type { RankId, RoleId, WeaponId } from "@/lib/veilspire/types";

const KEY = "veilspire-save-v1";
export const SAVE_VERSION = 1;

export type LoadoutId = "shade" | "lance" | "weaver";

export type MetaSave = {
  version: number;
  ashBank: number;
  highestRank: RankId;
  loadout: LoadoutId;
  upgrades: {
    vitality: number;
    host: number;
    edge: number;
  };
  cosmetics: string[];
  runs: number;
  clears: number;
};

const DEFAULT: MetaSave = {
  version: SAVE_VERSION,
  ashBank: 0,
  highestRank: "unsealed",
  loadout: "shade",
  upgrades: { vitality: 0, host: 0, edge: 0 },
  cosmetics: [],
  runs: 0,
  clears: 0,
};

function migrate(raw: Partial<MetaSave>): MetaSave {
  return {
    ...DEFAULT,
    ...raw,
    version: SAVE_VERSION,
    upgrades: { ...DEFAULT.upgrades, ...raw.upgrades },
    cosmetics: raw.cosmetics ?? [],
  };
}

export function loadSave(): MetaSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT, upgrades: { ...DEFAULT.upgrades } };
    return migrate(JSON.parse(raw) as Partial<MetaSave>);
  } catch {
    return { ...DEFAULT, upgrades: { ...DEFAULT.upgrades } };
  }
}

export function writeSave(save: MetaSave) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* private mode / quota */
  }
}

export const LOADOUTS: Record<
  LoadoutId,
  {
    role: RoleId;
    weapon: WeaponId;
    title: string;
    line: string;
    skill: string;
  }
> = {
  shade: {
    role: "shade",
    weapon: "dual",
    title: "Shade",
    line: "Find and cut. Twin blades, a void crescent.",
    skill: "Void crescent",
  },
  lance: {
    role: "lance",
    weapon: "spear",
    title: "Lance",
    line: "Kill through the gap. Longreach, a piercing dash.",
    skill: "Pierce dash",
  },
  weaver: {
    role: "weaver",
    weapon: "staff",
    title: "Weaver",
    line: "Change the room. Frost nova that holds a Hollow still.",
    skill: "Frost nova",
  },
};

export const UPGRADE_COST = [40, 80, 140, 220];

export function nextUpgradeCost(level: number) {
  return UPGRADE_COST[Math.min(level, UPGRADE_COST.length - 1)] ?? 220;
}
