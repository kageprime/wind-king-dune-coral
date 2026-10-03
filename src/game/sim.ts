import { FOUNDING } from "@/lib/veilspire/characters";
import { generateFigure, cinderize } from "@/lib/veilspire/generator";
import type { FigureSpec } from "@/lib/veilspire/types";
import type { LoadoutId } from "./save";
import { LOADOUTS } from "./save";
import type { BoonDef, BoonId, Phase } from "./store";
import { headingFromVel, len, norm } from "./math";

export const ARENA_R = 18.4;
export const DT = 1 / 60;

export type Team = 0 | 1;
export type Kind = "player" | "cinder" | "enemy" | "boss" | "npc" | "proj";

export type Ent = {
  id: number;
  kind: Kind;
  spec: FigureSpec;
  x: number;
  z: number;
  vx: number;
  vz: number;
  yaw: number;
  hp: number;
  maxHp: number;
  radius: number;
  team: Team;
  atkCd: number;
  dashCd: number;
  skillCd: number;
  iFrames: number;
  stun: number;
  state: "idle" | "walk" | "attack" | "dash" | "cast" | "hit" | "dead" | "telegraph";
  stateT: number;
  attack: number;
  hitFlash: number;
  deadT: number;
  dashT: number;
  range: number;
  dmg: number;
  speed: number;
  proj: boolean;
  projLife: number;
  projDmg: number;
  homing: boolean;
  ally: boolean;
  name: string;
};

export type Obstacle = { x: number; z: number; r: number };

export type SimEvent =
  | { type: "ledger"; text: string }
  | { type: "float"; x: number; z: number; text: string; kind: "dmg" | "ash" | "heal" }
  | { type: "shake"; amt: number }
  | { type: "hitstop"; ms: number }
  | { type: "sfx"; name: "swing" | "hit" | "dash" | "skill" | "summon" | "death" | "stamp" | "pickup" | "hurt" | "win" }
  | { type: "ash"; n: number }
  | { type: "phase"; phase: Phase }
  | { type: "bargain"; boons: BoonDef[] }
  | { type: "dead" }
  | { type: "victory" }
  | { type: "spawn"; ent: Ent }
  | { type: "despawn"; id: number };

const BOONS: BoonDef[] = [
  { id: "heart", name: "Ember Heart", line: "The Floor lends you a pulse. +40 vitality, wounds close." },
  { id: "cinder", name: "Second Press", line: "Another Host slot. The dead walk longer, hit harder." },
  { id: "edge", name: "Void Edge", line: "Blades remember the last Floor. Damage up." },
  { id: "dash", name: "Still Step", line: "The Hollow cannot hold your feet. Dash sooner, move faster." },
  { id: "well", name: "Ashfont", line: "The Ledger opens a tap. Skills return twice as fast." },
];

function playerSpec(loadout: LoadoutId): FigureSpec {
  const base = FOUNDING.find((c) => c.id === "ren-calder")!;
  const L = LOADOUTS[loadout];
  return {
    ...base,
    role: L.role,
    wear: { ...base.wear, weapon: L.weapon, offhand: loadout === "shade" ? "none" : base.wear.offhand },
  };
}

let nextId = 1;
function id() {
  return nextId++;
}

export class Sim {
  ents: Ent[] = [];
  obstacles: Obstacle[] = [];
  phase: Phase = "attract";
  phaseT = 0;
  loadout: LoadoutId = "shade";
  runAsh = 0;
  events: SimEvent[] = [];
  paused = false;
  rng = Math.random;
  boonsTaken = new Set<BoonId>();
  dmgMul = 1;
  speedMul = 1;
  dashMul = 1;
  skillMul = 1;
  hostMul = 1;
  extraHost = false;
  vitality = 0;
  attractSpawned = false;

  player(): Ent | undefined {
    return this.ents.find((e) => e.kind === "player" && e.state !== "dead");
  }

  emit(e: SimEvent) {
    this.events.push(e);
  }

  drainEvents() {
    const e = this.events;
    this.events = [];
    return e;
  }

  resetAttract() {
    this.ents = [];
    this.phase = "attract";
    this.phaseT = 0;
    this.attractSpawned = false;
    this.spawnNpc(FOUNDING.find((c) => c.id === "floor-voice")!, 0, -16.2, "npc");
    this.spawnNpc(FOUNDING.find((c) => c.id === "ren-calder")!, -2.2, 1.4, "npc");
    this.spawnNpc(FOUNDING.find((c) => c.id === "cinder-soldier")!, 2.6, 0.8, "npc");
    this.spawnNpc(FOUNDING.find((c) => c.id === "the-carapace")!, 6.5, -4.5, "npc");
    this.attractSpawned = true;
  }

  startRun(opts: { loadout: LoadoutId; vitality: number; host: number; edge: number }) {
    this.ents = [];
    this.loadout = opts.loadout;
    this.runAsh = 0;
    this.phaseT = 0;
    this.boonsTaken.clear();
    this.dmgMul = 1 + opts.edge * 0.12;
    this.speedMul = 1;
    this.dashMul = 1;
    this.skillMul = 1;
    this.hostMul = 1 + opts.host * 0.18;
    this.extraHost = opts.host >= 2;
    this.vitality = opts.vitality;
    this.paused = false;
    const spec = playerSpec(opts.loadout);
    const hp = 100 + opts.vitality * 18;
    const p = this.make(spec, "player", 0, 4, 0);
    p.hp = hp;
    p.maxHp = hp;
    p.speed = this.loadout === "lance" ? 6.0 : 6.4;
    p.range = opts.loadout === "lance" ? 2.55 : opts.loadout === "weaver" ? 1.4 : 1.7;
    p.dmg = opts.loadout === "lance" ? 18 : opts.loadout === "weaver" ? 14 : 15;
    this.ents.push(p);
    this.emit({ type: "spawn", ent: p });
    const voice = this.spawnNpc(FOUNDING.find((c) => c.id === "floor-voice")!, 0, -16.2, "npc");
    voice.yaw = 0;
    this.setPhase("intro");
    this.emit({ type: "ledger", text: "FLOOR I — THE FIRST HOLLOW." });
    this.emit({ type: "sfx", name: "stamp" });
  }

  spawnNpc(spec: FigureSpec, x: number, z: number, kind: Kind = "npc") {
    const e = this.make(spec, kind, x, z, 1);
    e.hp = 9999;
    e.maxHp = 9999;
    this.ents.push(e);
    this.emit({ type: "spawn", ent: e });
    return e;
  }

  make(spec: FigureSpec, kind: Kind, x: number, z: number, team: Team): Ent {
    return {
      id: id(),
      kind,
      spec,
      x,
      z,
      vx: 0,
      vz: 0,
      yaw: 0,
      hp: 40,
      maxHp: 40,
      radius: kind === "boss" ? 1.35 : kind === "player" ? 0.42 : 0.4,
      team,
      atkCd: 0,
      dashCd: 0,
      skillCd: 0,
      iFrames: 0,
      stun: 0,
      state: "idle",
      stateT: 0,
      attack: 0,
      hitFlash: 0,
      deadT: 0,
      dashT: 0,
      range: 1.5,
      dmg: 10,
      speed: 3.6,
      proj: false,
      projLife: 0,
      projDmg: 0,
      homing: false,
      ally: team === 0,
      name: spec.name,
    };
  }

  setPhase(p: Phase) {
    this.phase = p;
    this.phaseT = 0;
    this.emit({ type: "phase", phase: p });
  }

  spawnWave(kind: "ember" | "shade" | "mix" | "weaver", n: number) {
    const p = this.player();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      let x = Math.sin(a) * 13;
      let z = Math.cos(a) * 13;
      if (p && len(x - p.x, z - p.z) < 6) {
        x *= 1.3;
        z *= 1.3;
      }
      const roll =
        kind === "ember"
          ? "ember"
          : kind === "shade"
            ? "shade"
            : kind === "weaver"
              ? i === 0
                ? "weaver"
                : "shade"
              : i % 2 === 0
                ? "ember"
                : "shade";
      this.spawnEnemy(roll, x, z);
    }
  }

  spawnEnemy(roll: "ember" | "shade" | "weaver" | "boss", x: number, z: number) {
    let spec: FigureSpec;
    let e: Ent;
    if (roll === "boss") {
      spec = FOUNDING.find((c) => c.id === "the-carapace")!;
      e = this.make(spec, "boss", x, z, 1);
      e.hp = 420;
      e.maxHp = 420;
      e.speed = 3.1;
      e.range = 2.2;
      e.dmg = 22;
      e.radius = 1.35;
    } else if (roll === "shade") {
      spec = generateFigure({ seed: `shade-${nextId}`, role: "shade", rank: "ember" });
      spec.body.tone = "#3a2424";
      spec.wear.weapon = "dual";
      e = this.make(spec, "enemy", x, z, 1);
      e.hp = 32;
      e.maxHp = 32;
      e.speed = 5.1;
      e.range = 1.45;
      e.dmg = 9;
    } else if (roll === "weaver") {
      spec = generateFigure({ seed: `weaver-${nextId}`, role: "weaver", rank: "coal" });
      spec.body.tone = "#c8d8dc";
      spec.wear.weapon = "staff";
      spec.wear.aura = "frost";
      e = this.make(spec, "enemy", x, z, 1);
      e.hp = 44;
      e.maxHp = 44;
      e.speed = 3.2;
      e.range = 7;
      e.dmg = 11;
    } else {
      spec = generateFigure({ seed: `ember-${nextId}`, role: "breaker", rank: "ember" });
      spec.body.thickness = 1.12;
      spec.body.tone = "#4a4036";
      spec.wear.weapon = "maul";
      spec.wear.helm = "helm";
      e = this.make(spec, "enemy", x, z, 1);
      e.hp = 48;
      e.maxHp = 48;
      e.speed = 2.8;
      e.range = 1.7;
      e.dmg = 12;
    }
    this.ents.push(e);
    this.emit({ type: "spawn", ent: e });
    return e;
  }

  summonCinder() {
    const p = this.player();
    if (!p) return;
    const living = this.ents.filter((e) => e.kind === "cinder" && e.state !== "dead").length;
    const cap = this.extraHost ? 2 : 1;
    if (living >= cap) return;
    if (p.skillCd > 0 && false) return;
    const spec = cinderize(FOUNDING.find((c) => c.id === "cinder-soldier")!);
    const c = this.make(spec, "cinder", p.x + Math.cos(p.yaw) * 1.2, p.z + Math.sin(p.yaw) * 1.2, 0);
    c.hp = Math.round(46 * this.hostMul);
    c.maxHp = c.hp;
    c.speed = 5.4;
    c.range = 1.5;
    c.dmg = Math.round(11 * this.hostMul);
    c.radius = 0.38;
    this.ents.push(c);
    this.emit({ type: "spawn", ent: c });
    this.emit({ type: "sfx", name: "summon" });
    this.emit({ type: "ledger", text: "CINDER HOST PRESSED." });
    this.emit({ type: "shake", amt: 0.18 });
  }

  chooseBoon(id: BoonId) {
    const p = this.player();
    this.boonsTaken.add(id);
    if (id === "heart" && p) {
      p.maxHp += 40;
      p.hp = Math.min(p.maxHp, p.hp + 40);
      this.emit({ type: "float", x: p.x, z: p.z, text: "+40", kind: "heal" });
    }
    if (id === "cinder") {
      this.extraHost = true;
      this.hostMul += 0.25;
    }
    if (id === "edge") this.dmgMul += 0.4;
    if (id === "dash") {
      this.dashMul = 0.55;
      this.speedMul = 1.18;
    }
    if (id === "well") this.skillMul = 0.5;
    this.emit({ type: "sfx", name: "pickup" });
    this.emit({ type: "ledger", text: "BARGAIN STRUCK. THE TEST CONTINUES." });
    this.setPhase("wave3");
    this.spawnWave("weaver", 4);
    this.paused = false;
  }

  step(
    dt: number,
    input: {
      moveX: number;
      moveY: number;
      aimX: number;
      aimZ: number;
      hasMouseAim: boolean;
      attack: boolean;
      attackHeld: boolean;
      dash: boolean;
      skill: boolean;
      summon: boolean;
    },
  ) {
    if (this.paused || this.phase === "bargain") return;
    this.phaseT += dt;
    for (const e of this.ents) {
      e.atkCd = Math.max(0, e.atkCd - dt);
      e.dashCd = Math.max(0, e.dashCd - dt);
      e.skillCd = Math.max(0, e.skillCd - dt);
      e.iFrames = Math.max(0, e.iFrames - dt);
      e.stun = Math.max(0, e.stun - dt);
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.attack = Math.max(0, e.attack - dt * 2.4);
      if (e.state === "dead") e.deadT += dt;
      if (e.dashT > 0) e.dashT = Math.max(0, e.dashT - dt);
    }

    if (this.phase === "attract") {
      for (const e of this.ents) {
        if (e.kind === "npc") {
          e.yaw = headingFromVel(-e.x, -e.z);
        }
      }
      return;
    }

    if (this.phase === "intro") {
      if (this.phaseT > 0.4 && this.phaseT < 0.5) {
        this.emit({ type: "ledger", text: "THE TEST IS NAMED: OCCUPY AND CUT." });
      }
      if (this.phaseT > 2.2) {
        this.setPhase("wave1");
        this.emit({ type: "ledger", text: "HOLLOW-BORN APPROACH." });
        this.spawnWave("ember", 4);
      }
    }

    const livingEnemies = () =>
      this.ents.filter((e) => (e.kind === "enemy" || e.kind === "boss") && e.state !== "dead" && !e.proj);

    if (this.phase === "wave1" && livingEnemies().length === 0 && this.phaseT > 0.6) {
      this.setPhase("wave2");
      this.emit({ type: "ledger", text: "SECOND CUT. DO NOT WASTE THE ROOM." });
      this.spawnWave("mix", 5);
    }
    if (this.phase === "wave2" && livingEnemies().length === 0 && this.phaseT > 0.5) {
      this.setPhase("bargain");
      this.paused = true;
      const pool = BOONS.filter((b) => !this.boonsTaken.has(b.id));
      const pick: BoonDef[] = [];
      const copy = [...pool];
      while (pick.length < 3 && copy.length) {
        const i = Math.floor(Math.random() * copy.length);
        pick.push(copy.splice(i, 1)[0]!);
      }
      this.emit({ type: "bargain", boons: pick });
      this.emit({ type: "ledger", text: "THE LEDGER OFFERS A BARGAIN." });
      this.emit({ type: "sfx", name: "stamp" });
    }
    if (this.phase === "wave3" && livingEnemies().length === 0 && this.phaseT > 0.5) {
      this.setPhase("boss");
      this.emit({ type: "ledger", text: "FINAL TEST: THE CARAPACE." });
      this.emit({ type: "sfx", name: "stamp" });
      this.spawnEnemy("boss", 0, -6);
    }
    if (this.phase === "boss") {
      const boss = this.ents.find((e) => e.kind === "boss");
      if (boss && boss.state === "dead" && boss.deadT > 1.1) {
        this.setPhase("victory");
        this.emit({ type: "victory" });
        this.emit({ type: "ledger", text: "THE FLOOR ACCEPTS YOU." });
        this.emit({ type: "sfx", name: "win" });
        this.runAsh += 80;
        this.emit({ type: "ash", n: 80 });
      }
    }

    const p = this.player();
    if (p) this.controlPlayer(p, dt, input);

    for (const e of this.ents) {
      if (e.proj) this.stepProj(e, dt);
      else if (e.kind === "enemy" || e.kind === "boss") this.stepEnemy(e, dt);
      else if (e.kind === "cinder") this.stepCinder(e, dt);
    }

    this.integrate(dt);
    this.collide();
    this.cleanup();
  }

  controlPlayer(
    p: Ent,
    dt: number,
    input: {
      moveX: number;
      moveY: number;
      aimX: number;
      aimZ: number;
      hasMouseAim: boolean;
      attack: boolean;
      attackHeld: boolean;
      dash: boolean;
      skill: boolean;
      summon: boolean;
    },
  ) {
    if (p.state === "dead") return;
    const moving = len(input.moveX, input.moveY) > 0.12;
    // Camera-relative: +moveY is screen-up = world −Z; +moveX is screen-right = world +X
    const wishX = input.moveX;
    const wishZ = -input.moveY;
    let aimX = input.aimX - p.x;
    let aimZ = input.aimZ - p.z;
    if (input.hasMouseAim && len(aimX, aimZ) > 0.2) {
      p.yaw = headingFromVel(aimX, aimZ);
    } else if (moving) {
      p.yaw = headingFromVel(wishX, wishZ);
    }
    if (p.state !== "dash" && p.stun <= 0) {
      const sp = p.speed * this.speedMul * (p.state === "attack" ? 0.45 : 1);
      p.vx = wishX * sp;
      p.vz = wishZ * sp;
      p.state = moving ? "walk" : "idle";
    }
    if (input.dash && p.dashCd <= 0 && p.state !== "dash") {
      const [dx, dz] = moving ? norm(wishX, wishZ) : [-Math.sin(p.yaw), -Math.cos(p.yaw)];
      p.state = "dash";
      p.dashT = 0.16;
      p.dashCd = 0.95 * this.dashMul;
      p.iFrames = 0.16;
      p.vx = dx * 22;
      p.vz = dz * 22;
      this.emit({ type: "sfx", name: "dash" });
    }
    if (p.dashT > 0) {
      p.state = "dash";
    } else if (p.state === "dash") {
      p.state = "idle";
      p.vx *= 0.2;
      p.vz *= 0.2;
    }
    if ((input.attack || input.attackHeld) && p.atkCd <= 0 && p.state !== "dash") {
      this.doMelee(p, p.range, p.dmg * this.dmgMul, 2.2);
      p.atkCd = this.loadout === "lance" ? 0.42 : this.loadout === "weaver" ? 0.12 : 0.32;
      p.attack = 1;
      p.state = "attack";
      p.stateT = 0.2;
      this.emit({ type: "sfx", name: "swing" });
      if (this.loadout === "weaver") {
        this.spawnPlayerProj(p, 11 * this.dmgMul, 14, 0.9);
      }
    }
    if (input.skill && p.skillCd <= 0) {
      p.skillCd = 5.5 * this.skillMul;
      p.attack = 1;
      this.emit({ type: "sfx", name: "skill" });
      this.emit({ type: "shake", amt: 0.28 });
      if (this.loadout === "shade") {
        this.spawnPlayerProj(p, 22 * this.dmgMul, 16, 1.1, true);
      } else if (this.loadout === "lance") {
        const [dx, dz] = [-Math.sin(p.yaw), -Math.cos(p.yaw)];
        p.state = "dash";
        p.dashT = 0.22;
        p.iFrames = 0.22;
        p.vx = dx * 26;
        p.vz = dz * 26;
        this.doMelee(p, 3.2, 28 * this.dmgMul, 3.4);
      } else {
        this.nova(p, 4.2, 20 * this.dmgMul);
      }
    }
    if (input.summon) {
      const cinders = this.ents.filter((e) => e.kind === "cinder" && e.state !== "dead");
      const cap = this.extraHost ? 2 : 1;
      if (cinders.length < cap && p.dashCd >= 0) {
        // dedicated summon cd stored on player skill? use atk unused - use dashCd no
        if ((p as Ent & { summonCd?: number }).summonCd === undefined) {
          (p as Ent & { summonCd?: number }).summonCd = 0;
        }
      }
      const pe = p as Ent & { summonCd?: number };
      pe.summonCd = pe.summonCd ?? 0;
      if (pe.summonCd <= 0) {
        this.summonCinder();
        pe.summonCd = 11;
      }
    }
    const pe = p as Ent & { summonCd?: number };
    if (pe.summonCd) pe.summonCd = Math.max(0, pe.summonCd - dt);
  }

  spawnPlayerProj(p: Ent, dmg: number, speed: number, life: number, crescent = false) {
    const fx = -Math.sin(p.yaw);
    const fz = -Math.cos(p.yaw);
    const pr = this.make(p.spec, "proj", p.x + fx * 0.8, p.z + fz * 0.8, 0);
    pr.proj = true;
    pr.projDmg = dmg;
    pr.projLife = life;
    pr.vx = fx * speed;
    pr.vz = fz * speed;
    pr.yaw = p.yaw;
    pr.radius = crescent ? 0.55 : 0.28;
    pr.hp = 1;
    pr.maxHp = 1;
    this.ents.push(pr);
    this.emit({ type: "spawn", ent: pr });
  }

  nova(p: Ent, r: number, dmg: number) {
    for (const e of this.ents) {
      if (e.team === 1 && e.state !== "dead" && !e.proj && len(e.x - p.x, e.z - p.z) < r) {
        this.hurt(e, dmg, p);
        const [nx, nz] = norm(e.x - p.x, e.z - p.z);
        e.vx += nx * 8;
        e.vz += nz * 8;
        e.stun = 0.7;
      }
    }
    this.emit({ type: "shake", amt: 0.35 });
  }

  doMelee(a: Ent, range: number, dmg: number, knock: number) {
    const fx = -Math.sin(a.yaw);
    const fz = -Math.cos(a.yaw);
    for (const e of this.ents) {
      if (e.team === a.team || e.state === "dead" || e.proj || e.kind === "npc") continue;
      const dx = e.x - a.x;
      const dz = e.z - a.z;
      const dist = len(dx, dz);
      if (dist > range + e.radius) continue;
      const dot = dist < 0.01 ? 1 : (dx * fx + dz * fz) / dist;
      if (dot < 0.15 && dist > a.radius + e.radius + 0.15) continue;
      this.hurt(e, dmg, a);
      const [nx, nz] = norm(dx, dz);
      e.vx += nx * knock;
      e.vz += nz * knock;
    }
  }

  stepEnemy(e: Ent, dt: number) {
    if (e.state === "dead") return;
    const p = this.player();
    if (!p) return;
    if (e.stun > 0) return;
    const dx = p.x - e.x;
    const dz = p.z - e.z;
    const d = len(dx, dz);
    const [nx, nz] = norm(dx, dz);
    e.yaw = headingFromVel(nx, nz);

    if (e.kind === "boss") {
      this.stepBoss(e, dt, p, d, nx, nz);
      return;
    }

    const weaver = e.spec.wear.weapon === "staff";
    const desired = weaver ? 6.2 : e.range * 0.85;
    if (d > desired + 0.4) {
      e.vx = nx * e.speed;
      e.vz = nz * e.speed;
      e.state = "walk";
    } else if (weaver && d < 4.2) {
      e.vx = -nx * e.speed * 0.8;
      e.vz = -nz * e.speed * 0.8;
    } else {
      e.vx *= 0.8;
      e.vz *= 0.8;
    }
    // separation
    for (const o of this.ents) {
      if (o === e || o.team !== 1 || o.state === "dead" || o.proj) continue;
      const sx = e.x - o.x;
      const sz = e.z - o.z;
      const sl = len(sx, sz);
      if (sl > 0.01 && sl < 1.4) {
        e.vx += (sx / sl) * 2.2;
        e.vz += (sz / sl) * 2.2;
      }
    }
    if (weaver && e.atkCd <= 0 && d < 9) {
      e.atkCd = 1.6;
      e.attack = 1;
      const pr = this.make(e.spec, "proj", e.x + nx * 0.7, e.z + nz * 0.7, 1);
      pr.proj = true;
      pr.projDmg = 10;
      pr.projLife = 1.6;
      pr.vx = nx * 8;
      pr.vz = nz * 8;
      pr.yaw = e.yaw;
      pr.radius = 0.28;
      this.ents.push(pr);
      this.emit({ type: "spawn", ent: pr });
    } else if (!weaver && d < e.range + 0.25 && e.atkCd <= 0) {
      e.atkCd = 1.15;
      e.attack = 1;
      e.state = "attack";
      if (d < e.range + p.radius) this.hurt(p, e.dmg, e);
    }
  }

  stepBoss(e: Ent, dt: number, p: Ent, d: number, nx: number, nz: number) {
    const rage = e.hp < e.maxHp * 0.4;
    if (e.state === "telegraph") {
      e.vx *= 0.2;
      e.vz *= 0.2;
      e.stateT -= dt;
      if (e.stateT <= 0) {
        e.state = "attack";
        e.attack = 1;
        if (d < 3.6) this.hurt(p, rage ? 28 : 22, e);
        this.emit({ type: "shake", amt: 0.55 });
        this.emit({ type: "sfx", name: "hit" });
        e.atkCd = rage ? 1.1 : 1.6;
      }
      return;
    }
    if (d > 2.4) {
      e.vx = nx * e.speed * (rage ? 1.35 : 1);
      e.vz = nz * e.speed * (rage ? 1.35 : 1);
      e.state = "walk";
    } else {
      e.vx *= 0.5;
      e.vz *= 0.5;
    }
    if (e.atkCd <= 0) {
      if (d < 3.2) {
        e.state = "telegraph";
        e.stateT = 0.55;
        e.attack = 0.4;
        this.emit({ type: "ledger", text: "THE CARAPACE LIFTS." });
      } else if (e.skillCd <= 0) {
        e.skillCd = rage ? 2.2 : 3.4;
        e.atkCd = 0.8;
        e.attack = 1;
        for (let i = -1; i <= 1; i++) {
          const a = e.yaw + i * 0.28;
          const fx = -Math.sin(a);
          const fz = -Math.cos(a);
          const pr = this.make(e.spec, "proj", e.x + fx, e.z + fz, 1);
          pr.proj = true;
          pr.projDmg = 14;
          pr.projLife = 2.2;
          pr.vx = fx * 9;
          pr.vz = fz * 9;
          pr.radius = 0.32;
          pr.yaw = a;
          this.ents.push(pr);
          this.emit({ type: "spawn", ent: pr });
        }
        this.emit({ type: "sfx", name: "skill" });
      }
    }
  }

  stepCinder(e: Ent, dt: number) {
    if (e.state === "dead") return;
    let best: Ent | null = null;
    let bestD = 99;
    for (const o of this.ents) {
      if (o.team !== 1 || o.state === "dead" || o.proj || o.kind === "npc") continue;
      const d = len(o.x - e.x, o.z - e.z);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    const p = this.player();
    if (!best && p) {
      const [nx, nz] = norm(p.x - e.x, p.z - e.z);
      e.vx = nx * e.speed * 0.7;
      e.vz = nz * e.speed * 0.7;
      e.yaw = headingFromVel(nx, nz);
      return;
    }
    if (!best) return;
    const [nx, nz] = norm(best.x - e.x, best.z - e.z);
    e.yaw = headingFromVel(nx, nz);
    if (bestD > e.range) {
      e.vx = nx * e.speed;
      e.vz = nz * e.speed;
      e.state = "walk";
    } else {
      e.vx *= 0.4;
      e.vz *= 0.4;
      if (e.atkCd <= 0) {
        e.atkCd = 0.7;
        e.attack = 1;
        this.hurt(best, e.dmg, e);
        this.emit({ type: "sfx", name: "hit" });
      }
    }
  }

  stepProj(e: Ent, dt: number) {
    e.projLife -= dt;
    if (e.projLife <= 0) {
      e.state = "dead";
      e.deadT = 9;
      return;
    }
    const foe = e.team === 0 ? 1 : 0;
    for (const o of this.ents) {
      if (o.team !== foe || o.state === "dead" || o.proj || o.kind === "npc") continue;
      if (len(o.x - e.x, o.z - e.z) < e.radius + o.radius) {
        this.hurt(o, e.projDmg, e);
        e.state = "dead";
        e.deadT = 9;
        break;
      }
    }
  }

  hurt(e: Ent, dmg: number, src: Ent) {
    if (e.iFrames > 0 || e.state === "dead" || e.kind === "npc") return;
    const d = Math.round(dmg);
    e.hp -= d;
    e.hitFlash = 0.12;
    e.stun = Math.max(e.stun, e.kind === "boss" ? 0.05 : 0.12);
    this.emit({ type: "float", x: e.x, z: e.z, text: `${d}`, kind: "dmg" });
    this.emit({ type: "shake", amt: e.kind === "boss" ? 0.32 : 0.16 });
    this.emit({ type: "hitstop", ms: e.kind === "boss" ? 70 : 40 });
    this.emit({ type: "sfx", name: e.kind === "player" ? "hurt" : "hit" });
    if (e.kind === "player") e.iFrames = 0.28;
    if (e.hp <= 0) {
      e.hp = 0;
      e.state = "dead";
      e.deadT = 0;
      e.vx = 0;
      e.vz = 0;
      this.emit({ type: "sfx", name: "death" });
      if (e.kind === "player") {
        this.setPhase("dead");
        this.emit({ type: "dead" });
        this.emit({ type: "ledger", text: "RECORD CLOSED. ASH WRITTEN." });
      } else if (e.kind === "enemy" || e.kind === "boss") {
        const ash = e.kind === "boss" ? 40 : 6 + Math.floor(Math.random() * 6);
        this.runAsh += ash;
        this.emit({ type: "ash", n: ash });
        this.emit({ type: "float", x: e.x, z: e.z, text: `+${ash} Ash`, kind: "ash" });
      }
    }
  }

  integrate(dt: number) {
    for (const e of this.ents) {
      if (e.state === "dead" && !e.proj) continue;
      e.x += e.vx * dt;
      e.z += e.vz * dt;
      if (!e.proj && e.state !== "dash") {
        e.vx *= Math.pow(0.04, dt);
        e.vz *= Math.pow(0.04, dt);
      }
      if (e.kind !== "proj") {
        const l = len(e.x, e.z);
        const max = ARENA_R - e.radius;
        if (l > max) {
          const [nx, nz] = norm(e.x, e.z);
          e.x = nx * max;
          e.z = nz * max;
        }
        for (const o of this.obstacles) {
          const dx = e.x - o.x;
          const dz = e.z - o.z;
          const d = len(dx, dz);
          const min = o.r + e.radius;
          if (d < min && d > 0.001) {
            const [nx, nz] = norm(dx, dz);
            e.x = o.x + nx * min;
            e.z = o.z + nz * min;
          }
        }
      }
      const sp = len(e.vx, e.vz);
      if (sp > 0.35 && e.state !== "attack" && e.state !== "dash" && e.state !== "dead") e.state = "walk";
    }
  }

  collide() {
    const list = this.ents.filter((e) => !e.proj && e.state !== "dead" && e.kind !== "npc");
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!;
        const b = list[j]!;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const d = len(dx, dz);
        const min = a.radius + b.radius;
        if (d < min && d > 0.0001) {
          const push = (min - d) / 2;
          const [nx, nz] = norm(dx, dz);
          a.x -= nx * push;
          a.z -= nz * push;
          b.x += nx * push;
          b.z += nz * push;
        }
      }
    }
  }

  cleanup() {
    const keep: Ent[] = [];
    for (const e of this.ents) {
      if (e.state === "dead" && (e.proj || e.deadT > 1.6) && e.kind !== "player" && e.kind !== "boss") {
        this.emit({ type: "despawn", id: e.id });
      } else keep.push(e);
    }
    this.ents = keep;
  }

  playerSpeed() {
    const p = this.player();
    if (!p) return 0;
    return len(p.vx, p.vz);
  }

  playerYaw() {
    const p = this.player();
    if (!p) return 0;
    const sp = len(p.vx, p.vz);
    if (sp > 0.15) return headingFromVel(p.vx, p.vz);
    return p.yaw;
  }
}


