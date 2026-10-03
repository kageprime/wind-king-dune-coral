import type { RankDef, RoleDef } from "./types";

export const APP_NAME = "Veilspire";
export const TAGLINE = "Unranked. Unforgiven. Climb.";

export const TITLE_OPTIONS = [
  {
    name: "Veilspire",
    note: "Working title. The tower is a spire of stacked rifts; the veil is the wound between worlds.",
  },
  {
    name: "Ashrank",
    note: "Leans into the rank-climb fantasy and the ash that dead floors leave behind.",
  },
  {
    name: "The Unsealed",
    note: "Names the player, not the world. Strong as a subtitle even if the title stays Veilspire.",
  },
  {
    name: "Nullfloor",
    note: "Roguelike and tower in one word. Colder, more system-like.",
  },
  {
    name: "Cinder Ledger",
    note: "Puts the game-HUD 'system' in the title. Good for UI tone, weaker as a world name.",
  },
] as const;

export const GLOSSARY = [
  {
    ours: "Ashwalkers",
    theirs: "Hunters (Solo Leveling) / Regulars (Tower of God)",
    meaning:
      "People who can enter rifts. Most are branded by the Ledger and assigned a rank. They are not a military; they are a licensed disaster profession.",
  },
  {
    ours: "The Spire",
    theirs: "The Tower",
    meaning:
      "Not a building you walk into. A vertical stack of sealed worlds, each a Floor. You climb by clearing or surviving a Floor's test, not by stairs.",
  },
  {
    ours: "Rifts",
    theirs: "Gates",
    meaning:
      "Tears that open a Floor into the living world. Left uncleared, they bleed monsters. Cleared, they become a climb.",
  },
  {
    ours: "Hollows",
    theirs: "Dungeons / Floor tests",
    meaning:
      "The rooms inside a Floor. Some are combat, some are puzzles, some are social tests. A run is a chain of Hollows.",
  },
  {
    ours: "The Ledger",
    theirs: "The System / Administrators",
    meaning:
      "A cold, typographic interface only some Ashwalkers can see. It ranks, records, and bargains. It is not a friend.",
  },
  {
    ours: "Ash",
    theirs: "Mana / Shinsu",
    meaning:
      "Residue of collapsed Floors. Fuel for skills, currency for the Ledger, matter from which the Cinder Host is pressed.",
  },
  {
    ours: "The Unsealed",
    theirs: "Irregular + the weakest hunter",
    meaning:
      "Someone who entered the Spire from outside its rules. Starts with no rank. Can grow in ways the branded cannot.",
  },
  {
    ours: "Cinder Host",
    theirs: "Shadow army",
    meaning:
      "Ash pressed into loyal silhouettes of the fallen. Same stick rig, matte-black, pin-light eyes. Limited slots in a run.",
  },
  {
    ours: "Seals",
    theirs: "Rank badges / Position contracts",
    meaning:
      "A mark that floats the rank and role. Cosmetics can hide, crack, or forge a seal — the Ledger still knows.",
  },
  {
    ours: "Floor Voice",
    theirs: "Floor Administrator",
    meaning:
      "A tall, almost featureless stick figure that sets the test. Not killable. Not allied.",
  },
] as const;

export const RANKS: RankDef[] = [
  {
    id: "unsealed",
    mark: "—",
    name: "Unsealed",
    analog: "E-rank / unranked irregular",
    summary: "No brand. The Ledger sees you and does not know where to file you. Weak on paper. Illegal in practice.",
  },
  {
    id: "ember",
    mark: "I",
    name: "Ember",
    analog: "E / D",
    summary: "Spark rank. Licensed to enter the shallowest rifts, usually as fodder or porters.",
  },
  {
    id: "coal",
    mark: "II",
    name: "Coal",
    analog: "D / C",
    summary: "Reliable street-level Ashwalkers. Most of the living roster sits here and dies here.",
  },
  {
    id: "iron",
    mark: "III",
    name: "Iron",
    analog: "C / B",
    summary: "Can hold a Hollow. Guild meat and backbone.",
  },
  {
    id: "steel",
    mark: "IV",
    name: "Steel",
    analog: "B / A",
    summary: "Named. A Steel can close a city rift alone if the Floor is kind.",
  },
  {
    id: "glass",
    mark: "V",
    name: "Glass",
    analog: "A / S",
    summary: "National-level threat, named for how the world looks at them — precious, sharp, one crack from disaster.",
  },
  {
    id: "crown",
    mark: "VI",
    name: "Crown",
    analog: "National / Ranker",
    summary: "The few who have climbed high enough that Floors start speaking back. Guild chairs, living legends.",
  },
  {
    id: "null",
    mark: "Ø",
    name: "Null",
    analog: "Monarch / Irregular at the top",
    summary: "Not a rank the Ledger issues. A hole it cannot close. Bosses, Floor Voices, and the late-game Unsealed.",
  },
];

export const ROLES: RoleDef[] = [
  {
    id: "breaker",
    name: "Breaker",
    analog: "Tank / Fisherman",
    summary: "Holds the front of a Hollow. Shields, grabs, body-checks the thing that should not be touched.",
    partyJob: "Occupy and survive.",
    defaultWeapon: "shield",
    palette: ["#8a8680", "#5c5348", "#c45c32"],
  },
  {
    id: "lance",
    name: "Lance",
    analog: "Spear bearer",
    summary: "Long-range pierce. Keeps a line of death down a corridor while others move.",
    partyJob: "Kill through the gap.",
    defaultWeapon: "spear",
    palette: ["#3f5c48", "#cfc6b0", "#8fb89a"],
  },
  {
    id: "weaver",
    name: "Weaver",
    analog: "Wave controller / mage",
    summary: "Shapes Ash into weather — frost, ember, still-air, venom. Area denial and Floor control.",
    partyJob: "Change the room.",
    defaultWeapon: "staff",
    palette: ["#9ec4c8", "#e8eef0", "#6ea8b8"],
  },
  {
    id: "beacon",
    name: "Beacon",
    analog: "Light bearer",
    summary: "Sees the Floor. Marks weak points, opens paths, carries the lantern that keeps a party honest.",
    partyJob: "Call the true map.",
    defaultWeapon: "lantern",
    palette: ["#d6b16a", "#2c6b6a", "#f0e2b2"],
  },
  {
    id: "shade",
    name: "Shade",
    analog: "Scout / assassin",
    summary: "Enters first, ends things quietly, maps the Hollow by surviving it.",
    partyJob: "Find and cut.",
    defaultWeapon: "dual",
    palette: ["#3a2a28", "#8a3a32", "#c9b8b0"],
  },
  {
    id: "warden",
    name: "Warden",
    analog: "Support / healer-guardian",
    summary: "Keeps the branded alive. Seals wounds with Ash, holds dying seals together for one more room.",
    partyJob: "Refuse the wipe.",
    defaultWeapon: "staff",
    palette: ["#e4d7c4", "#b7a48a", "#d8c48a"],
  },
];

export const PITCH = {
  oneLiner:
    "A run-based climb through a tower of dead worlds, fought by stick-figure Ashwalkers who share one skeleton and differ by wear, color, and the seal above their head.",
  fantasy:
    "You are the Unsealed — the weakest licensed body in a city of ranked killers. A rift goes wrong. The Ledger notices you. Each failed climb still writes Ash into your record. Each success lets you steal a little more of the Spire's rules.",
  whyStick:
    "One Mixamo stick rig for every body in the game. Personality is not a new mesh — it is tone, thickness, cosmetics, weapons, and aura. That is how a roster of dozens stays coherent, cheap to animate, and readable in a roguelike.",
  influences: [
    {
      from: "Solo Leveling",
      take: "The weakest becomes a problem. A ruthless rank society. A game-like HUD. An army of the dead that looks like you, desaturated.",
      leave: "Named characters, monarch lore, exact gates/hunters vocabulary, the specific blue system window copypaste.",
    },
    {
      from: "Tower of God",
      take: "Climbing as a test, not a raid. Party positions. An irregular who was not supposed to enter. Floors that have opinions.",
      leave: "Shinsu, named Regulars/Rankers, the Zahard court, position names used verbatim.",
    },
    {
      from: "Roguelike",
      take: "A Floor is a run. Death is information. Gear and cosmetics drop. Meta-Ash persists. Builds are loadouts on the same body.",
      leave: "Pixel-dungeon clutter. Permadeath with no story hook. Randomness without a test.",
    },
  ],
};

export const LOOP = {
  run: [
    "Pick a loadout on the Unsealed (wear, weapon, two Cinder slots).",
    "A rift opens a Floor. The Floor Voice names the test.",
    "Traverse Hollows: fight, bargain, solve, or flee.",
    "Boss or verdict. Climb a rank shard — or scatter as Ash.",
  ],
  meta: [
    "Ash banked between runs buys cosmetics, Host slots, and Ledger perks.",
    "Fallen named Ashwalkers can be pressed into the Cinder Host (same rig, black tone, their weapon).",
    "Seals and cosmetics are account-wide. Stats from a run are not.",
  ],
};

export const VISUAL_RULES = [
  "Every character uses the Mixamo Simple Stick skeleton. No extra limbs unless a Null boss (Carapace spikes are wear, not bones).",
  "Readability first: silhouette from helm, back, and weapon. Color second. Face last (stick heads barely have faces).",
  "Body tone is a material, not a skin-tone chart: charcoal, bone, ice, rust, ink, olive, slate.",
  "Thickness is a rank/role signal. Breakers read heavy. Shades read thin. The Unsealed starts thin and can thicken as Null.",
  "Auras are VFX, not outfits. One aura family per character so a fight stays readable.",
  "Cinder Host are the same spec with tone locked to matte black, joints to pin-light, aura to ash.",
  "UI chrome stays bone/steel. Ember copper is for Ash, ranks, and world — not every button.",
];

export const RIG_CONTRACT = {
  files: [
    "public/rigs/simple-stick/tpose.fbx — bind pose, cosmetics attach here",
    "public/rigs/simple-stick/simple-stick.fbx — Mixamo motion clip on the same skeleton",
  ],
  bones: [
    { bone: "spine / spine.001–.006", slot: "Torso stack. Chest wear at .003, back at .002, head at .006" },
    { bone: "shoulder.L / .R", slot: "Pauldrons, spikes" },
    { bone: "upper_arm / forearm / hand", slot: "Sleeves, weapons, lantern, tablet" },
    { bone: "thigh / shin / foot / toe", slot: "Greaves, hakama, boots" },
    { bone: "heel.02, breast.*, pelvis.*", slot: "Keep for Mixamo compatibility; do not hang hero cosmetics here" },
  ],
  later: [
    "Convert FBX → glTF, keep bone names.",
    "Cosmetics as child meshes or skinned add-ons, never a second skeleton.",
    "Mixamo animation pack on this rig: idle, walk, run, slash, cast, hit, death.",
    "VFX attach to hand.L/R, spine.003, spine.006.",
  ],
};

export const COSMETIC_SLOTS = [
  { id: "helm", label: "Helm / head", bone: "spine.006" },
  { id: "chest", label: "Chest / coat", bone: "spine.003" },
  { id: "legs", label: "Legs", bone: "thigh / shin" },
  { id: "back", label: "Cape / back", bone: "spine.002" },
  { id: "weapon", label: "Main hand", bone: "hand.R" },
  { id: "offhand", label: "Off hand", bone: "hand.L" },
  { id: "aura", label: "Aura (VFX)", bone: "root" },
  { id: "seal", label: "Rank seal", bone: "above spine.006" },
  { id: "extras", label: "Marks / kit", bone: "mixed" },
] as const;

export const ROADMAP = [
  {
    phase: "0 — Bible",
    now: true,
    items: [
      "World names, ranks, roles, visual law",
      "Founding roster as stick figures",
      "Atelier: generate and save looks",
      "Mixamo rig filed as the only skeleton",
    ],
  },
  {
    phase: "1 — 3D body",
    now: false,
    items: [
      "Show the Mixamo stick in-engine",
      "Attach cosmetics to bones",
      "Same generator drives 3D wear",
    ],
  },
  {
    phase: "2 — Motion",
    now: false,
    items: [
      "Idle / walk / run / attack / cast / hit / death",
      "Per-weapon attack variants",
      "Cinder Host share player animations, slower",
    ],
  },
  {
    phase: "3 — Feel",
    now: false,
    items: [
      "Ledger window SFX (type, stamp, error)",
      "Rift-open, Ash drain, Host-summon VFX",
      "Hit-stop, floor dust, seal-crack",
    ],
  },
  {
    phase: "4 — One Floor",
    now: false,
    items: [
      "A short Hollow chain with one test and one boss",
      "Drop a cosmetic, bank Ash, die once",
    ],
  },
] as const;

export const OPEN_QUESTIONS = [
  {
    q: "How hard is death?",
    opts: [
      "Full wipe of the run, Ash kept (classic roguelike)",
      "The Unsealed always crawls out; Cinder Host is lost",
      "A Floor can brand you — fail a test and you keep a curse cosmetic",
    ],
  },
  {
    q: "Party or solo?",
    opts: [
      "Solo Unsealed + Cinder Host (closer to Solo Leveling)",
      "You plus two NPC Ashwalkers with roles (closer to Tower of God)",
      "Both: early Floors are party tests, later Floors strip the party away",
    ],
  },
  {
    q: "Lock the title?",
    opts: ["Veilspire", "Ashrank", "The Unsealed", "keep workshopping"],
  },
  {
    q: "How visible is the Ledger?",
    opts: [
      "Always on, like a game HUD",
      "Only in rifts and after kills",
      "A physical book the Unsealed carries",
    ],
  },
  {
    q: "Next build after this bible?",
    opts: [
      "More founding characters",
      "3D Mixamo viewer with these cosmetics",
      "A tiny combat slice using 2D stick figures",
    ],
  },
];

export const TONE_SWATCHES = [
  { id: "charcoal", hex: "#2a2724", label: "Charcoal" },
  { id: "ink", hex: "#1a1c20", label: "Ink" },
  { id: "slate", hex: "#4a4e55", label: "Slate" },
  { id: "ash", hex: "#8a847c", label: "Ash" },
  { id: "bone", hex: "#d8d0c4", label: "Bone" },
  { id: "ice", hex: "#c8d8dc", label: "Ice" },
  { id: "rust", hex: "#6a3a32", label: "Rust" },
  { id: "olive", hex: "#4a5340", label: "Olive" },
  { id: "soot-red", hex: "#3a2424", label: "Soot" },
  { id: "chitin", hex: "#24322a", label: "Chitin" },
] as const;
