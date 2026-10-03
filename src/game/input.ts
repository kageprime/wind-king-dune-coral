import { radialDeadzone } from "./math";

export type ControlsProbe = {
  getYaw: () => number;
  getSpeed: () => number;
  setSteer?: (v: number) => void;
  setKeys?: (codes: string[]) => void;
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
  }
}

const GAME_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
  "Space",
  "KeyJ",
  "KeyK",
  "KeyQ",
  "KeyE",
  "KeyF",
  "Escape",
  "KeyP",
]);

export type Actions = {
  moveX: number;
  moveY: number;
  aimNx: number;
  aimNz: number;
  hasAim: boolean;
  attack: boolean;
  attackHeld: boolean;
  dash: boolean;
  skill: boolean;
  summon: boolean;
  pause: boolean;
  confirm: boolean;
};

const empty = (): Actions => ({
  moveX: 0,
  moveY: 0,
  aimNx: 0,
  aimNz: -1,
  hasAim: false,
  attack: false,
  attackHeld: false,
  dash: false,
  skill: false,
  summon: false,
  pause: false,
  confirm: false,
});

export class Input {
  keys = new Set<string>();
  injected: string[] | null = null;
  pointer = { x: 0, y: 0, down: false, inside: false };
  touchMove = { x: 0, y: 0, active: false };
  touchAim = { x: 0, y: 0, active: false };
  touchButtons = new Set<string>();
  prevAttack = false;
  prevDash = false;
  prevSkill = false;
  prevSummon = false;
  prevPause = false;
  prevConfirm = false;
  canvas: HTMLCanvasElement | null = null;
  private unbind: Array<() => void> = [];

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const onDown = (e: KeyboardEvent) => {
      this.keys.add(e.code);
      if (GAME_KEYS.has(e.code)) e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    const clear = () => this.keys.clear();
    const onPointer = (e: PointerEvent) => {
      this.pointer.inside = true;
      const r = canvas.getBoundingClientRect();
      this.pointer.x = e.clientX - r.left;
      this.pointer.y = e.clientY - r.top;
      if (e.type === "pointerdown" && e.button === 0) this.pointer.down = true;
      if (e.type === "pointerup" || e.type === "pointercancel") {
        if (e.button === 0 || e.pointerType !== "mouse") this.pointer.down = false;
      }
    };
    const onContext = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clear();
    });
    canvas.addEventListener("pointerdown", onPointer);
    canvas.addEventListener("pointermove", onPointer);
    window.addEventListener("pointerup", onPointer);
    window.addEventListener("pointercancel", onPointer);
    canvas.addEventListener("contextmenu", onContext);
    this.unbind.push(
      () => window.removeEventListener("keydown", onDown),
      () => window.removeEventListener("keyup", onUp),
      () => window.removeEventListener("blur", clear),
      () => canvas.removeEventListener("pointerdown", onPointer),
      () => canvas.removeEventListener("pointermove", onPointer),
      () => window.removeEventListener("pointerup", onPointer),
      () => window.removeEventListener("pointercancel", onPointer),
      () => canvas.removeEventListener("contextmenu", onContext),
    );
  }

  dispose() {
    for (const u of this.unbind) u();
    this.unbind = [];
  }

  setKeys(codes: string[]) {
    this.injected = codes;
  }

  private down(code: string) {
    if (this.injected) return this.injected.includes(code);
    return this.keys.has(code);
  }

  sample(): Actions {
    const a = empty();
    let mx = 0;
    let my = 0;
    if (this.down("KeyW") || this.down("ArrowUp")) my += 1;
    if (this.down("KeyS") || this.down("ArrowDown")) my -= 1;
    if (this.down("KeyD") || this.down("ArrowRight")) mx += 1;
    if (this.down("KeyA") || this.down("ArrowLeft")) mx -= 1;

    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : null;
    if (pads) {
      for (const pad of pads) {
        if (!pad || pad.mapping !== "standard") continue;
        const ls = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
        mx += ls.x;
        my += -ls.y;
        const rs = radialDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0, 0.25);
        if (rs.x !== 0 || rs.y !== 0) {
          a.hasAim = true;
          a.aimNx = rs.x;
          a.aimNz = rs.y;
        }
        if (pad.buttons[0]?.pressed) a.attackHeld = true;
        if (pad.buttons[1]?.pressed) a.dash = true;
        if (pad.buttons[2]?.pressed) a.skill = true;
        if (pad.buttons[3]?.pressed) a.summon = true;
        if (pad.buttons[9]?.pressed) a.pause = true;
      }
    }

    if (this.touchMove.active) {
      mx += this.touchMove.x;
      my += this.touchMove.y;
    }
    if (this.touchAim.active) {
      a.hasAim = true;
      a.aimNx = this.touchAim.x;
      a.aimNz = -this.touchAim.y;
    }
    if (this.touchButtons.has("attack")) a.attackHeld = true;
    if (this.touchButtons.has("dash")) a.dash = true;
    if (this.touchButtons.has("skill")) a.skill = true;
    if (this.touchButtons.has("summon")) a.summon = true;

    const ml = Math.hypot(mx, my);
    if (ml > 1) {
      mx /= ml;
      my /= ml;
    }
    a.moveX = mx;
    a.moveY = my;

    a.attackHeld = a.attackHeld || this.pointer.down || this.down("KeyJ");
    a.dash = a.dash || this.down("Space") || this.down("KeyL");
    a.skill = a.skill || this.down("KeyK") || this.down("KeyF") || this.keys.has("Mouse2");
    a.summon = a.summon || this.down("KeyQ") || this.down("KeyE");
    a.pause = a.pause || this.down("Escape") || this.down("KeyP");
    a.confirm = this.down("Enter") || this.down("Space");

    a.attack = a.attackHeld && !this.prevAttack;
    const dashEdge = a.dash && !this.prevDash;
    const skillEdge = a.skill && !this.prevSkill;
    const summonEdge = a.summon && !this.prevSummon;
    const pauseEdge = a.pause && !this.prevPause;
    const confirmEdge = a.confirm && !this.prevConfirm;
    this.prevAttack = a.attackHeld;
    this.prevDash = a.dash;
    this.prevSkill = a.skill;
    this.prevSummon = a.summon;
    this.prevPause = a.pause;
    this.prevConfirm = a.confirm;
    a.dash = dashEdge;
    a.skill = skillEdge;
    a.summon = summonEdge;
    a.pause = pauseEdge;
    a.confirm = confirmEdge;
    return a;
  }
}
