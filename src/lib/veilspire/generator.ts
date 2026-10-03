import { FOUNDING } from "./characters";
import { ROLES, TONE_SWATCHES } from "./content";
import type {
  AuraId,
  BackId,
  ChestId,
  ExtraId,
  FigureSpec,
  HelmId,
  LegsId,
  RankId,
  RoleId,
  WeaponId,
} from "./types";
import { AURA_IDS, BACK_IDS, CHEST_IDS, HELM_IDS, LEGS_IDS, RANK_IDS, WEAPON_IDS } from "./types";

const FIRST = [
  "Ren", "Cal", "Nyx", "Ivo", "Mira", "Tor", "Ash", "Len", "Rho", "Nia",
  "Vex", "Ora", "Sid", "Wren", "Kai", "Sol", "Fen", "Ryn", "Vale", "Joss",
];
const LAST = [
  "Calder", "Quill", "Morr", "Holt", "Vale", "Rake", "Venn", "Ash", "Hollow",
  "Fen", "Kade", "Voss", "Nox", "Reed", "Hale", "Sable", "Crowe", "Pike",
];
const TITLES = [
  "Unlisted", "Rift-cut", "Ash-left", "Second Door", "Pale Seal", "Last Porter",
  "Quiet Floor", "Red Ledger", "Hollow-born", "Still Knife", "Crowded Rank",
];

const ROLE_WEAPONS: Record<RoleId, WeaponId[]> = {
  breaker: ["shield", "maul", "gauntlets", "longsword"],
  lance: ["spear", "saber", "bow", "longsword"],
  weaver: ["staff", "gauntlets", "scythe", "tablet"],
  beacon: ["lantern", "staff", "tablet", "bow"],
  shade: ["dual", "dagger", "saber", "scythe"],
  warden: ["staff", "lantern", "shield", "saber"],
};

const ROLE_HELMS: Record<RoleId, HelmId[]> = {
  breaker: ["helm", "none", "visor", "wrap"],
  lance: ["none", "circlet", "visor", "hood"],
  weaver: ["circlet", "hood", "none", "wrap"],
  beacon: ["none", "circlet", "hood", "wrap"],
  shade: ["visor", "mask", "hood", "wrap", "none"],
  warden: ["circlet", "hood", "none", "wrap"],
};

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)] as T;
}

function maybe<T>(rng: () => number, list: readonly T[], chance: number, fallback: T): T {
  return rng() < chance ? pick(rng, list) : fallback;
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => {
    const ca = (pa >> shift) & 255;
    const cb = (pb >> shift) & 255;
    return Math.round(ca + (cb - ca) * t);
  };
  const r = ch(16);
  const g = ch(8);
  const bl = ch(0);
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

export function generateFigure(opts: {
  seed: string;
  role?: RoleId;
  rank?: RankId;
  name?: string;
}): FigureSpec {
  const rng = mulberry32(hashSeed(opts.seed || "veilspire"));
  const role = opts.role ?? pick(rng, ROLES).id;
  const rank = opts.rank ?? pick(rng, RANK_IDS.filter((id) => id !== "null"));
  const roleDef = ROLES.find((r) => r.id === role) ?? ROLES[0];
  const palette = roleDef.palette;
  const tone = pick(rng, TONE_SWATCHES).hex;
  const thickBase = role === "breaker" ? 1.18 : role === "shade" ? 0.84 : 0.94;
  const rankTall = rank === "null" || rank === "crown" || rank === "glass" ? 1.06 : 1;
  const weapon = pick(rng, ROLE_WEAPONS[role]);
  const offhand: WeaponId =
    role === "breaker" && weapon !== "shield" && rng() > 0.45 ? "shield" : "none";
  const extras: ExtraId[] = [];
  if (rng() > 0.65) extras.push("scar");
  if (rng() > 0.7) extras.push("pouch");
  if (rng() > 0.8) extras.push("eye-glow");
  if (rank === "unsealed" && rng() > 0.4) extras.push("cracked-seal");
  if (role === "weaver" || role === "beacon") extras.push("floating-runes");
  if (role === "breaker" && rng() > 0.5) extras.push("shoulder-spike");

  const auraPool: AuraId[] =
    role === "weaver"
      ? ["ember", "frost", "venom", "storm"]
      : role === "shade"
        ? ["void", "ash", "ember", "none"]
        : role === "beacon" || role === "warden"
          ? ["light", "ash", "none"]
          : ["none", "ash", "ember"];

  const name =
    opts.name?.trim() ||
    `${pick(rng, FIRST)} ${pick(rng, LAST)}`;

  const primary = mixHex(palette[0], pick(rng, palette), rng() * 0.4);
  const secondary = mixHex(tone, palette[1], 0.35 + rng() * 0.3);
  const accent = palette[2] ?? palette[0];

  return {
    id: `atelier-${hashSeed(opts.seed + name).toString(16)}`,
    name,
    title: pick(rng, TITLES),
    role,
    rank,
    origin: "atelier",
    blurb: `Generated Ashwalker. ${roleDef.name} path, ${rank} seal. Seed ${opts.seed}.`,
    body: {
      tone,
      joint: mixHex(tone, "#1a1816", 0.45),
      thickness: +(thickBase + (rng() - 0.5) * 0.18).toFixed(2),
      height: +(rankTall + (rng() - 0.5) * 0.08).toFixed(2),
    },
    colors: {
      primary,
      secondary,
      accent,
      emissive: mixHex(accent, "#f0e8d8", 0.35),
    },
    wear: {
      helm: pick(rng, ROLE_HELMS[role]),
      chest: maybe(rng, CHEST_IDS, 0.92, "wraps"),
      legs: maybe(rng, LEGS_IDS, 0.8, "none"),
      back: maybe(rng, BACK_IDS, 0.55, "none"),
      weapon,
      offhand,
      aura: pick(rng, auraPool),
      extras,
    },
    notes: "Atelier output. Tweak wear in the ledger and save to the working roster.",
  };
}

export function cinderize(spec: FigureSpec): FigureSpec {
  return {
    ...spec,
    id: `${spec.id}-cinder`,
    name: `Cinder ${spec.name.split(" ")[0]}`,
    title: "Host unit",
    rank: spec.rank === "null" ? "null" : "ember",
    body: { ...spec.body, tone: "#121210", joint: "#d8d4cc" },
    colors: {
      primary: "#1a1a18",
      secondary: "#0c0c0b",
      accent: "#d8d4cc",
      emissive: "#e8e4dc",
    },
    wear: {
      ...spec.wear,
      aura: "ash",
      extras: Array.from(new Set([...spec.wear.extras, "eye-glow"])),
    },
    notes: `Pressed from ${spec.name}. Same rig, same weapon, lights for eyes.`,
  };
}

export function foundingById(id: string): FigureSpec | undefined {
  return FOUNDING.find((c) => c.id === id);
}

export const WEAR_LABELS: Record<string, string> = {
  none: "None",
  wrap: "Head wrap",
  circlet: "Circlet",
  visor: "Visor",
  hood: "Hood",
  helm: "Helm",
  mask: "Mask",
  crown: "Spike crown",
  mandible: "Mandibles",
  wraps: "Wraps",
  harness: "Harness",
  coat: "Coat",
  plate: "Plate",
  robe: "Robe",
  chitin: "Chitin",
  greaves: "Greaves",
  hakama: "Split skirt",
  plated: "Plated",
  cape: "Cape",
  cloak: "Cloak",
  quiver: "Quiver",
  tendrils: "Tendrils",
  shards: "Shards",
  dagger: "Dagger",
  dual: "Twin blades",
  longsword: "Longsword",
  saber: "Saber",
  spear: "Spear",
  staff: "Staff",
  bow: "Bow",
  shield: "Shield",
  maul: "Maul",
  gauntlets: "Gauntlets",
  scythe: "Scythe",
  lantern: "Lantern",
  tablet: "Tablet",
  ember: "Ember",
  frost: "Frost",
  void: "Void",
  light: "Light",
  venom: "Venom",
  storm: "Storm",
  ash: "Ash",
};

export const SELECT_OPTIONS = {
  helm: HELM_IDS,
  chest: CHEST_IDS,
  legs: LEGS_IDS,
  back: BACK_IDS,
  weapon: WEAPON_IDS,
  offhand: WEAPON_IDS,
  aura: AURA_IDS,
};
