import * as THREE from "three";
import { Input } from "./input";
import { GameAudio } from "./audio";
import { Sim, type Ent } from "./sim";
import { buildArena } from "./world";
import { createStick, disposeStick, poseStick, type StickRig } from "./stick-mesh";
import { useGameStore, type BoonId, type FloatNum, type Screen } from "./store";
import { loadSave, writeSave, type LoadoutId } from "./save";
import { expSmooth } from "./math";

const reduced =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export class VeilspireGame {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
  input = new Input();
  audio = new GameAudio();
  sim = new Sim();
  rigs = new Map<number, StickRig>();
  projMeshes = new Map<number, THREE.Mesh>();
  particles: { m: THREE.Points; life: number; vel: Float32Array } | null = null;
  acc = 0;
  last = performance.now();
  raf = 0;
  trauma = 0;
  hitstop = 0;
  orbit = 0.6;
  floatId = 1;
  rift: THREE.Mesh | null = null;
  disposed = false;
  canvas: HTMLCanvasElement;
  camTarget = new THREE.Vector3();
  camPos = new THREE.Vector3(0, 14, 16);
  mouseWorld = new THREE.Vector3();
  ray = new THREE.Raycaster();
  ndc = new THREE.Vector2();
  plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  tmp = new THREE.Vector3();
  hudTimer = 0;
  playerLight: THREE.PointLight;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x0c0d0b, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera.position.copy(this.camPos);
    this.input.attach(canvas);
    const { obstacles, rift } = buildArena(this.scene);
    this.sim.obstacles = obstacles;
    this.rift = rift;
    this.playerLight = new THREE.PointLight(0xe4dcc8, 0.7, 9);
    this.playerLight.position.set(0, 2.2, 0);
    this.scene.add(this.playerLight);
    this.sim.resetAttract();
    this.syncSpawns();
    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.onVis);
    this.bindControlsTest();
    this.patchHud({ ready: true, screen: "title", phase: "attract" });
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  onVis = () => {
    if (document.hidden) return;
    this.last = performance.now();
    this.audio.unlock();
    if (this.audio.ctx?.state === "suspended") void this.audio.ctx.resume();
  };

  bindControlsTest() {
    window.__controlsTest = {
      getYaw: () => this.sim.playerYaw(),
      getSpeed: () => this.sim.playerSpeed(),
      setKeys: (codes) => this.input.setKeys(codes),
    };
  }

  resize = () => {
    const p = this.canvas.parentElement;
    const w = p?.clientWidth || window.innerWidth;
    const h = p?.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  };

  patchHud(p: Partial<import("./store").HudState>) {
    useGameStore.getState().patch(p);
  }

  startRun() {
    this.audio.unlock();
    this.clearActors();
    const meta = loadSave();
    meta.runs += 1;
    writeSave(meta);
    this.sim.startRun({
      loadout: meta.loadout,
      vitality: meta.upgrades.vitality,
      host: meta.upgrades.host,
      edge: meta.upgrades.edge,
    });
    this.syncSpawns();
    this.introCam = true;
    this.patchHud({
      screen: "playing",
      phase: "intro",
      runAsh: 0,
      hp: this.sim.player()?.hp ?? 100,
      maxHp: this.sim.player()?.maxHp ?? 100,
      loadout: meta.loadout,
      meta,
      bossHp: 0,
      bossMax: 0,
      floats: [],
    });
  }

  setScreen(screen: Screen) {
    this.patchHud({ screen });
    if (screen === "playing") this.sim.paused = false;
    if (screen === "paused") this.sim.paused = true;
  }

  setLoadout(id: LoadoutId) {
    const meta = loadSave();
    meta.loadout = id;
    writeSave(meta);
    this.patchHud({ loadout: id, meta });
  }

  buyUpgrade(key: "vitality" | "host" | "edge") {
    const meta = loadSave();
    const cost = [40, 80, 140, 220][Math.min(meta.upgrades[key], 3)] ?? 220;
    if (meta.ashBank < cost) return;
    meta.ashBank -= cost;
    meta.upgrades[key] += 1;
    writeSave(meta);
    this.audio.pickup();
    this.patchHud({ meta, ash: meta.ashBank });
  }

  chooseBoon(id: BoonId) {
    this.sim.chooseBoon(id);
    this.patchHud({ screen: "playing", boons: [] });
  }

  setMuted(m: boolean) {
    this.audio.setMuted(m);
    this.patchHud({ muted: m });
  }

  clearActors() {
    for (const rig of this.rigs.values()) disposeStick(rig);
    this.rigs.clear();
    for (const m of this.projMeshes.values()) {
      m.removeFromParent();
      (m.material as THREE.Material).dispose();
    }
    this.projMeshes.clear();
  }

  syncSpawns() {
    for (const e of this.sim.ents) {
      if (!this.rigs.has(e.id) && !this.projMeshes.has(e.id) && e.kind !== "proj") {
        const rig = createStick(e.spec);
        this.scene.add(rig.group);
        this.rigs.set(e.id, rig);
      }
    }
  }

  loop = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1;
    const hud = useGameStore.getState();
    const playing = hud.screen === "playing" || hud.screen === "title" || hud.screen === "loadout" || hud.screen === "codex" || hud.screen === "upgrades";

    if (this.hitstop > 0 && !reduced) {
      this.hitstop -= dt;
      dt *= 0.08;
    }

    this.acc += dt;
    const actions = this.input.sample();
    if (actions.pause && hud.screen === "playing") this.setScreen("paused");
    else if (actions.pause && hud.screen === "paused") this.setScreen("playing");

    this.updateMouseWorld();

    while (this.acc >= 1 / 60) {
      if (hud.screen === "playing") {
        this.sim.step(1 / 60, {
          moveX: actions.moveX,
          moveY: actions.moveY,
          aimX: this.mouseWorld.x,
          aimZ: this.mouseWorld.z,
          hasMouseAim: !this.input.injected && (this.input.pointer.inside || actions.hasAim),
          attack: actions.attack,
          attackHeld: actions.attackHeld,
          dash: actions.dash,
          skill: actions.skill,
          summon: actions.summon,
        });
      } else if (hud.screen === "title" || hud.screen === "loadout" || hud.screen === "codex" || hud.screen === "upgrades") {
        this.sim.step(1 / 60, {
          moveX: 0,
          moveY: 0,
          aimX: 0,
          aimZ: 0,
          hasMouseAim: false,
          attack: false,
          attackHeld: false,
          dash: false,
          skill: false,
          summon: false,
        });
      }
      this.acc -= 1 / 60;
    }

    this.handleEvents();
    this.syncSpawns();
    this.updateRigs(dt);
    this.updateCamera(dt, hud.screen);
    if (this.rift) this.rift.rotation.z += dt * 0.15;
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    this.renderShake();
    this.renderer.render(this.scene, this.camera);
    this.hudTimer += dt;
    if (this.hudTimer > 0.08) {
      this.hudTimer = 0;
      this.pushLiveHud();
    }
    void playing;
  };

  updateMouseWorld() {
    if (actionsAimFromPad(this.input)) return;
    const r = this.canvas.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    this.ndc.x = (this.input.pointer.x / r.width) * 2 - 1;
    this.ndc.y = -(this.input.pointer.y / r.height) * 2 + 1;
    this.ray.setFromCamera(this.ndc, this.camera);
    const hit = this.ray.ray.intersectPlane(this.plane, this.tmp);
    if (hit) this.mouseWorld.copy(hit);
  }

  handleEvents() {
    const evs = this.sim.drainEvents();
    if (!evs.length) return;
    const patch: Partial<import("./store").HudState> = {};
    const floats = [...useGameStore.getState().floats];
    for (const e of evs) {
      if (e.type === "spawn") {
        if (e.ent.proj) {
          const mat = new THREE.MeshBasicMaterial({
            color: e.ent.team === 0 ? 0x9b7bb8 : 0x6a8a50,
            transparent: true,
            opacity: 0.9,
          });
          const mesh = new THREE.Mesh(new THREE.SphereGeometry(e.ent.radius, 10, 8), mat);
          mesh.position.set(e.ent.x, 0.9, e.ent.z);
          this.scene.add(mesh);
          this.projMeshes.set(e.ent.id, mesh);
        }
      } else if (e.type === "despawn") {
        const rig = this.rigs.get(e.id);
        if (rig) {
          disposeStick(rig);
          this.rigs.delete(e.id);
        }
        const pm = this.projMeshes.get(e.id);
        if (pm) {
          pm.removeFromParent();
          (pm.material as THREE.Material).dispose();
          this.projMeshes.delete(e.id);
        }
      } else if (e.type === "ledger") {
        patch.ledger = e.text;
        this.audio.stamp();
      } else if (e.type === "sfx") {
        this.audio[e.name]();
      } else if (e.type === "shake") {
        this.trauma = Math.min(1, this.trauma + e.amt);
      } else if (e.type === "hitstop") {
        this.hitstop = Math.max(this.hitstop, e.ms / 1000);
      } else if (e.type === "phase") {
        patch.phase = e.phase;
        if (e.phase === "boss") {
          const b = this.sim.ents.find((x) => x.kind === "boss");
          patch.bossName = "The Carapace";
          patch.bossMax = b?.maxHp ?? 420;
        }
      } else if (e.type === "bargain") {
        patch.screen = "bargain";
        patch.boons = e.boons;
      } else if (e.type === "float") {
        const v = this.worldToScreen(e.x, e.z);
        floats.push({
          id: this.floatId++,
          x: v.x,
          y: v.y,
          text: e.text,
          kind: e.kind,
        });
        if (floats.length > 10) floats.shift();
      } else if (e.type === "ash") {
        patch.runAsh = this.sim.runAsh;
      } else if (e.type === "dead") {
        this.bankAsh();
        patch.screen = "dead";
      } else if (e.type === "victory") {
        this.bankAsh(true);
        patch.screen = "victory";
      }
    }
    patch.floats = floats;
    this.patchHud(patch);
  }

  bankAsh(clear = false) {
    const meta = loadSave();
    meta.ashBank += this.sim.runAsh;
    if (clear) {
      meta.clears += 1;
      if (meta.highestRank === "unsealed") meta.highestRank = "ember";
    }
    writeSave(meta);
    this.patchHud({ meta, ash: meta.ashBank, rank: meta.highestRank, runAsh: this.sim.runAsh });
  }

  worldToScreen(x: number, z: number) {
    this.tmp.set(x, 1.4, z).project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (this.tmp.x * 0.5 + 0.5) * r.width,
      y: (-this.tmp.y * 0.5 + 0.5) * r.height,
    };
  }

  updateRigs(dt: number) {
    const t = performance.now() / 1000;
    for (const e of this.sim.ents) {
      if (e.proj) {
        const m = this.projMeshes.get(e.id);
        if (m) {
          m.position.set(e.x, 0.9, e.z);
          m.scale.setScalar(e.state === "dead" ? 0.2 : 1);
        }
        continue;
      }
      const rig = this.rigs.get(e.id);
      if (!rig) continue;
      rig.group.position.x = e.x;
      rig.group.position.z = e.z;
      rig.group.rotation.y = e.yaw;
      const sp = Math.hypot(e.vx, e.vz);
      poseStick(rig, {
        dt,
        speed: sp,
        attack: e.attack,
        hit: e.hitFlash,
        dead: e.state === "dead" ? e.deadT : 0,
        dash: e.dashT,
        time: t,
      });
    }
  }

  updateCamera(dt: number, screen: Screen) {
    if (screen !== "playing") {
      this.orbit += dt * 0.12;
      const r = 20;
      this.camPos.set(Math.sin(this.orbit) * r, 12.5, Math.cos(this.orbit) * r);
      this.camTarget.set(0, 1.2, 0);
    } else {
      const p = this.sim.player();
      if (p) {
        this.playerLight.position.set(p.x, 2.15, p.z);
        this.camTarget.set(p.x, 1.15, p.z);
        const desired = this.tmp.set(p.x, 15.5, p.z + 13.5);
        this.camPos.x = expSmooth(this.camPos.x, desired.x, 4.2, dt);
        this.camPos.y = expSmooth(this.camPos.y, desired.y, 4.2, dt);
        this.camPos.z = expSmooth(this.camPos.z, desired.z, 4.2, dt);
      }
    }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);
  }

  renderShake() {
    if (reduced || this.trauma <= 0) return;
    const s = this.trauma * this.trauma;
    this.camera.position.x += (Math.random() - 0.5) * s * 0.55;
    this.camera.position.y += (Math.random() - 0.5) * s * 0.35;
    this.camera.rotation.z = (Math.random() - 0.5) * s * 0.03;
  }

  pushLiveHud() {
    const p = this.sim.player();
    const b = this.sim.ents.find((e) => e.kind === "boss" && e.state !== "dead");
    const cinder = this.sim.ents.some((e) => e.kind === "cinder" && e.state !== "dead");
    const pe = p as (Ent & { summonCd?: number }) | undefined;
    const floats = useGameStore
      .getState()
      .floats.map((f: FloatNum) => f)
      .slice(-8);
    this.patchHud({
      hp: p?.hp ?? 0,
      maxHp: p?.maxHp ?? 1,
      runAsh: this.sim.runAsh,
      cinderAlive: cinder,
      cinderCd: pe?.summonCd ?? 0,
      dashCd: p?.dashCd ?? 0,
      skillCd: p?.skillCd ?? 0,
      bossHp: b?.hp ?? (useGameStore.getState().phase === "boss" ? 0 : useGameStore.getState().bossHp),
      bossMax: b?.maxHp ?? useGameStore.getState().bossMax,
      waveHint: hint(this.sim.phase),
    });
    void floats;
  }

  returnToTitle() {
    this.clearActors();
    this.sim.resetAttract();
    this.syncSpawns();
    this.patchHud({
      screen: "title",
      phase: "attract",
      boons: [],
      floats: [],
      bossHp: 0,
      ledger: "THE LEDGER IS WATCHING.",
    });
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.onVis);
    this.input.dispose();
    this.clearActors();
    this.renderer.dispose();
    if (window.__controlsTest) delete window.__controlsTest;
  }
}

function hint(phase: string) {
  if (phase === "intro") return "The Floor Voice names the test.";
  if (phase === "wave1") return "Hollow 1 — Occupy and cut.";
  if (phase === "wave2") return "Hollow 2 — Second cut.";
  if (phase === "wave3") return "Hollow 3 — Do not waste the room.";
  if (phase === "boss") return "Final test — The Carapace.";
  if (phase === "victory") return "The Floor accepts you.";
  if (phase === "dead") return "Record closed.";
  return "";
}

function actionsAimFromPad(input: Input) {
  return !!input.injected;
}
