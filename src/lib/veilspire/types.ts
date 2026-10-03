export const ROLE_IDS = [
  "breaker",
  "lance",
  "weaver",
  "beacon",
  "shade",
  "warden",
] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export const RANK_IDS = [
  "unsealed",
  "ember",
  "coal",
  "iron",
  "steel",
  "glass",
  "crown",
  "null",
] as const;
export type RankId = (typeof RANK_IDS)[number];

export const HELM_IDS = [
  "none",
  "wrap",
  "circlet",
  "visor",
  "hood",
  "helm",
  "mask",
  "crown",
  "mandible",
] as const;
export type HelmId = (typeof HELM_IDS)[number];

export const CHEST_IDS = [
  "none",
  "wraps",
  "harness",
  "coat",
  "plate",
  "robe",
  "chitin",
] as const;
export type ChestId = (typeof CHEST_IDS)[number];

export const LEGS_IDS = ["none", "wraps", "greaves", "hakama", "plated"] as const;
export type LegsId = (typeof LEGS_IDS)[number];

export const BACK_IDS = [
  "none",
  "cape",
  "cloak",
  "quiver",
  "tendrils",
  "shards",
] as const;
export type BackId = (typeof BACK_IDS)[number];

export const WEAPON_IDS = [
  "none",
  "dagger",
  "dual",
  "longsword",
  "saber",
  "spear",
  "staff",
  "bow",
  "shield",
  "maul",
  "gauntlets",
  "scythe",
  "lantern",
  "tablet",
] as const;
export type WeaponId = (typeof WEAPON_IDS)[number];

export const AURA_IDS = [
  "none",
  "ember",
  "frost",
  "void",
  "light",
  "venom",
  "storm",
  "ash",
] as const;
export type AuraId = (typeof AURA_IDS)[number];

export const EXTRA_IDS = [
  "scar",
  "cracked-seal",
  "floating-runes",
  "eye-glow",
  "shoulder-spike",
  "pouch",
] as const;
export type ExtraId = (typeof EXTRA_IDS)[number];

export type FigureColors = {
  primary: string;
  secondary: string;
  accent: string;
  emissive: string;
};

export type FigureBody = {
  tone: string;
  joint: string;
  thickness: number;
  height: number;
};

export type FigureWear = {
  helm: HelmId;
  chest: ChestId;
  legs: LegsId;
  back: BackId;
  weapon: WeaponId;
  offhand: WeaponId;
  aura: AuraId;
  extras: ExtraId[];
};

export type FigureSpec = {
  id: string;
  name: string;
  title: string;
  role: RoleId;
  rank: RankId;
  origin: "founding" | "atelier";
  blurb: string;
  body: FigureBody;
  colors: FigureColors;
  wear: FigureWear;
  notes: string;
};

export type RankDef = {
  id: RankId;
  mark: string;
  name: string;
  analog: string;
  summary: string;
};

export type RoleDef = {
  id: RoleId;
  name: string;
  analog: string;
  summary: string;
  partyJob: string;
  defaultWeapon: WeaponId;
  palette: string[];
};
