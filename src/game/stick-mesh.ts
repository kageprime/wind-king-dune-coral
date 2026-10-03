import * as THREE from "three";
import type { FigureSpec, WeaponId } from "@/lib/veilspire/types";
import { RANKS } from "@/lib/veilspire/content";
import { hexToInt } from "./math";

const geo = {
  head: new THREE.SphereGeometry(0.13, 14, 12),
  joint: new THREE.SphereGeometry(0.055, 10, 8),
  limb: new THREE.CapsuleGeometry(0.045, 0.28, 4, 8),
  torso: new THREE.CapsuleGeometry(0.09, 0.42, 4, 10),
  blade: new THREE.BoxGeometry(0.04, 0.04, 0.55),
  pole: new THREE.CylinderGeometry(0.02, 0.025, 1.35, 8),
  disc: new THREE.CircleGeometry(0.28, 16),
  box: new THREE.BoxGeometry(1, 1, 1),
  cone: new THREE.ConeGeometry(0.08, 0.18, 8),
  ring: new THREE.TorusGeometry(0.22, 0.018, 8, 20),
};

function mat(color: string, extras: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({
    color: hexToInt(color),
    roughness: 0.55,
    metalness: 0.12,
    ...extras,
  });
}

export type StickRig = {
  group: THREE.Group;
  spec: FigureSpec;
  mats: THREE.Material[];
  lThigh: THREE.Object3D;
  rThigh: THREE.Object3D;
  lShin: THREE.Object3D;
  rShin: THREE.Object3D;
  lArm: THREE.Object3D;
  rArm: THREE.Object3D;
  lFore: THREE.Object3D;
  rFore: THREE.Object3D;
  torso: THREE.Object3D;
  head: THREE.Object3D;
  seal: THREE.Object3D;
  aura: THREE.Mesh;
  eyes: THREE.Mesh[];
  weapon: THREE.Object3D;
  shadow: THREE.Mesh;
  walk: number;
};

function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function bone(y = 0) {
  const g = new THREE.Group();
  g.position.y = y;
  return g;
}

function weaponMesh(id: WeaponId, mPrimary: THREE.Material, mAccent: THREE.Material, mEmissive: THREE.Material) {
  const g = new THREE.Group();
  if (id === "none") return g;
  if (id === "dual" || id === "dagger" || id === "saber" || id === "longsword") {
    const len = id === "dagger" ? 0.42 : id === "longsword" ? 0.82 : 0.62;
    const blade = addMesh(g, geo.blade, mAccent, 0, 0, -len * 0.35, 0, 0, 0, 1, 1, len / 0.55);
    blade.position.z = -len * 0.42;
    addMesh(g, geo.box, mPrimary, 0, 0, 0.02, 0, 0, 0, 0.12, 0.04, 0.08);
  } else if (id === "spear") {
    addMesh(g, geo.pole, mPrimary, 0, 0, -0.55, Math.PI / 2, 0, 0);
    addMesh(g, geo.cone, mAccent, 0, 0, -1.28, -Math.PI / 2, 0, 0);
  } else if (id === "staff") {
    addMesh(g, geo.pole, mPrimary, 0, 0, -0.5, Math.PI / 2, 0, 0, 1, 1.1, 1);
    addMesh(g, geo.head, mEmissive, 0, 0, -1.22, 0, 0, 0, 0.55, 0.55, 0.55);
  } else if (id === "maul") {
    addMesh(g, geo.pole, mPrimary, 0, 0, -0.35, Math.PI / 2, 0, 0, 1.4, 0.7, 1.4);
    addMesh(g, geo.box, mAccent, 0, 0, -0.85, 0, 0, 0, 0.28, 0.22, 0.22);
  } else if (id === "shield") {
    const d = addMesh(g, geo.disc, mPrimary, 0, 0, -0.12, 0, 0, 0, 1.1, 1.3, 1);
    d.material = mPrimary;
    addMesh(g, geo.box, mAccent, 0, 0, -0.1, 0, 0, 0, 0.08, 0.4, 0.04);
  } else if (id === "bow") {
    addMesh(g, geo.ring, mAccent, 0, 0, -0.15, 0, Math.PI / 2, 0, 1.2, 1.6, 1);
  } else if (id === "scythe") {
    addMesh(g, geo.pole, mPrimary, 0, 0, -0.55, Math.PI / 2, 0, 0);
    addMesh(g, geo.blade, mAccent, 0.18, 0, -1.18, 0, 0.6, 0, 1, 0.4, 1.4);
  } else if (id === "gauntlets") {
    addMesh(g, geo.box, mAccent, 0, 0, -0.08, 0, 0, 0, 0.16, 0.1, 0.18);
  } else if (id === "lantern") {
    addMesh(g, geo.box, mPrimary, 0, -0.05, -0.12, 0, 0, 0, 0.14, 0.2, 0.14);
    addMesh(g, geo.head, mEmissive, 0, -0.05, -0.12, 0, 0, 0, 0.45, 0.45, 0.45);
  } else if (id === "tablet") {
    addMesh(g, geo.box, mAccent, 0, 0, -0.1, 0.2, 0, 0, 0.18, 0.26, 0.03);
  }
  return g;
}

export function createStick(spec: FigureSpec): StickRig {
  const mats: THREE.Material[] = [];
  const bodyM = mat(spec.body.tone, { roughness: 0.62 });
  const jointM = mat(spec.body.joint, {
    roughness: 0.28,
    metalness: 0.35,
    emissive: hexToInt(spec.body.joint),
    emissiveIntensity: spec.wear.aura === "ash" || spec.wear.extras.includes("eye-glow") ? 0.45 : 0.05,
  });
  const prim = mat(spec.colors.primary);
  const sec = mat(spec.colors.secondary);
  const acc = mat(spec.colors.accent);
  const emi = mat(spec.colors.emissive, {
    emissive: hexToInt(spec.colors.emissive),
    emissiveIntensity: 0.85,
    roughness: 0.35,
  });
  mats.push(bodyM, jointM, prim, sec, acc, emi);

  const group = new THREE.Group();
  const thick = spec.body.thickness;
  const height = spec.body.height;
  group.scale.set(thick * 0.92 + 0.08, height, thick * 0.92 + 0.08);

  const hip = bone(0.92);
  group.add(hip);

  const torso = bone(0.08);
  hip.add(torso);
  addMesh(torso, geo.torso, bodyM, 0, 0.28, 0);

  if (spec.wear.chest === "plate" || spec.wear.chest === "chitin") {
    addMesh(torso, geo.box, prim, 0, 0.3, 0.06, 0, 0, 0, 0.28, 0.38, 0.12);
  } else if (spec.wear.chest === "coat" || spec.wear.chest === "robe") {
    addMesh(torso, geo.box, prim, 0, 0.18, 0.02, 0.12, 0, 0, 0.32, 0.55, 0.16);
  } else if (spec.wear.chest === "harness") {
    addMesh(torso, geo.box, acc, 0, 0.32, 0.08, 0, 0, 0, 0.22, 0.04, 0.04);
    addMesh(torso, geo.box, acc, 0, 0.22, 0.08, 0, 0, 0, 0.22, 0.04, 0.04);
  } else if (spec.wear.chest === "wraps") {
    addMesh(torso, geo.box, sec, 0, 0.28, 0.05, 0, 0, 0, 0.2, 0.16, 0.08);
  }

  if (spec.wear.back === "cape" || spec.wear.back === "cloak") {
    const cape = addMesh(torso, geo.box, prim, 0, 0.05, -0.12, 0.25, 0, 0, 0.42, 0.7, 0.04);
    cape.material = prim;
  } else if (spec.wear.back === "tendrils") {
    for (const sx of [-1, 1, 0]) {
      addMesh(torso, geo.limb, sec, sx * 0.12, -0.05, -0.16, 0.9, 0, sx * 0.4, 0.6, 1.4, 0.6);
    }
  } else if (spec.wear.back === "shards") {
    addMesh(torso, geo.box, emi, 0.16, 0.4, -0.1, 0.4, 0.2, 0, 0.06, 0.22, 0.02);
    addMesh(torso, geo.box, emi, -0.14, 0.46, -0.08, 0.3, -0.3, 0, 0.05, 0.18, 0.02);
  }

  const head = bone(0.58);
  torso.add(head);
  addMesh(head, geo.head, bodyM, 0, 0.14, 0);
  const eyes: THREE.Mesh[] = [];
  if (spec.wear.extras.includes("eye-glow") || spec.id === "cinder-soldier") {
    eyes.push(addMesh(head, geo.joint, emi, -0.045, 0.16, 0.1, 0, 0, 0, 0.45, 0.45, 0.45));
    eyes.push(addMesh(head, geo.joint, emi, 0.045, 0.16, 0.1, 0, 0, 0, 0.45, 0.45, 0.45));
  }

  const helm = spec.wear.helm;
  if (helm === "wrap") addMesh(head, geo.box, sec, 0, 0.18, 0, 0, 0, 0, 0.22, 0.08, 0.22);
  if (helm === "circlet") addMesh(head, geo.ring, acc, 0, 0.2, 0, Math.PI / 2, 0, 0, 0.7, 0.7, 0.7);
  if (helm === "visor") addMesh(head, geo.box, prim, 0, 0.16, 0.08, 0, 0, 0, 0.22, 0.06, 0.08);
  if (helm === "hood") addMesh(head, geo.head, sec, 0, 0.16, -0.02, 0, 0, 0, 1.25, 1.15, 1.3);
  if (helm === "helm") {
    addMesh(head, geo.head, prim, 0, 0.16, 0, 0, 0, 0, 1.2, 1.1, 1.2);
    addMesh(head, geo.box, acc, 0, 0.16, 0.12, 0, 0, 0, 0.18, 0.06, 0.06);
  }
  if (helm === "mask") addMesh(head, geo.box, prim, 0, 0.14, 0.1, 0, 0, 0, 0.16, 0.12, 0.04);
  if (helm === "crown") {
    addMesh(head, geo.cone, acc, -0.08, 0.3, 0, 0, 0, 0, 0.5, 0.7, 0.5);
    addMesh(head, geo.cone, acc, 0.08, 0.3, 0, 0, 0, 0, 0.5, 0.7, 0.5);
  }
  if (helm === "mandible") {
    addMesh(head, geo.cone, prim, -0.08, 0.08, 0.12, 1.1, 0, 0.4, 0.7, 1.1, 0.7);
    addMesh(head, geo.cone, prim, 0.08, 0.08, 0.12, 1.1, 0, -0.4, 0.7, 1.1, 0.7);
  }

  const seal = bone(0.42);
  head.add(seal);
  const rank = RANKS.find((r) => r.id === spec.rank);
  const sealMesh = addMesh(seal, geo.ring, emi, 0, 0, 0, Math.PI / 2, 0, 0, 0.55, 0.55, 0.55);
  sealMesh.material = emi;
  if (spec.wear.extras.includes("cracked-seal")) sealMesh.scale.set(0.45, 0.45, 0.45);
  if (rank) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 128, 64);
    ctx.fillStyle = spec.colors.emissive;
    ctx.font = "700 42px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(rank.mark, 64, 34);
    const tex = new THREE.CanvasTexture(canvas);
    const sm = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    mats.push(sm);
    const sprite = new THREE.Sprite(sm);
    sprite.scale.set(0.42, 0.21, 1);
    sprite.position.set(0, 0.02, 0);
    seal.add(sprite);
  }

  const lArm = bone(0.48);
  lArm.position.set(-0.16, 0.48, 0);
  torso.add(lArm);
  addMesh(lArm, geo.joint, jointM, 0, 0, 0);
  const lUpper = addMesh(lArm, geo.limb, bodyM, 0, -0.16, 0, 0, 0, 0, 0.85, 1, 0.85);
  lUpper.position.y = -0.18;
  const lFore = bone(-0.36);
  lArm.add(lFore);
  addMesh(lFore, geo.limb, bodyM, 0, -0.14, 0, 0, 0, 0, 0.75, 0.9, 0.75);
  const lHand = bone(-0.3);
  lFore.add(lHand);
  addMesh(lHand, geo.joint, jointM);

  const rArm = bone(0.48);
  rArm.position.set(0.16, 0.48, 0);
  torso.add(rArm);
  addMesh(rArm, geo.joint, jointM);
  addMesh(rArm, geo.limb, bodyM, 0, -0.18, 0, 0, 0, 0, 0.85, 1, 0.85);
  const rFore = bone(-0.36);
  rArm.add(rFore);
  addMesh(rFore, geo.limb, bodyM, 0, -0.14, 0, 0, 0, 0, 0.75, 0.9, 0.75);
  const rHand = bone(-0.3);
  rFore.add(rHand);
  addMesh(rHand, geo.joint, jointM);

  const weapon = weaponMesh(spec.wear.weapon, prim, acc, emi);
  weapon.rotation.x = -Math.PI / 2;
  rHand.add(weapon);
  if (spec.wear.weapon === "dual") {
    const w2 = weaponMesh("dagger", prim, acc, emi);
    w2.rotation.x = -Math.PI / 2;
    lHand.add(w2);
  } else if (spec.wear.offhand !== "none") {
    const w2 = weaponMesh(spec.wear.offhand, prim, acc, emi);
    w2.rotation.x = -Math.PI / 2;
    lHand.add(w2);
  }

  const lThigh = bone(0);
  lThigh.position.set(-0.08, 0, 0);
  hip.add(lThigh);
  addMesh(lThigh, geo.joint, jointM);
  addMesh(lThigh, geo.limb, bodyM, 0, -0.2, 0, 0, 0, 0, 1, 1.15, 1);
  const lShin = bone(-0.4);
  lThigh.add(lShin);
  addMesh(lShin, geo.limb, bodyM, 0, -0.2, 0, 0, 0, 0, 0.9, 1.1, 0.9);
  addMesh(lShin, geo.joint, jointM, 0, -0.42, 0.04, 0.4, 0, 0, 1.1, 0.7, 1.4);

  const rThigh = bone(0);
  rThigh.position.set(0.08, 0, 0);
  hip.add(rThigh);
  addMesh(rThigh, geo.joint, jointM);
  addMesh(rThigh, geo.limb, bodyM, 0, -0.2, 0, 0, 0, 0, 1, 1.15, 1);
  const rShin = bone(-0.4);
  rThigh.add(rShin);
  addMesh(rShin, geo.limb, bodyM, 0, -0.2, 0, 0, 0, 0, 0.9, 1.1, 0.9);
  addMesh(rShin, geo.joint, jointM, 0, -0.42, 0.04, 0.4, 0, 0, 1.1, 0.7, 1.4);

  if (spec.wear.legs === "greaves" || spec.wear.legs === "plated") {
    addMesh(lShin, geo.box, prim, 0, -0.1, 0.04, 0, 0, 0, 0.12, 0.28, 0.1);
    addMesh(rShin, geo.box, prim, 0, -0.1, 0.04, 0, 0, 0, 0.12, 0.28, 0.1);
  } else if (spec.wear.legs === "hakama") {
    addMesh(hip, geo.box, prim, 0, -0.12, 0, 0, 0, 0, 0.32, 0.28, 0.18);
  } else if (spec.wear.legs === "wraps") {
    addMesh(lThigh, geo.box, sec, 0, -0.12, 0, 0, 0, 0, 0.12, 0.12, 0.08);
    addMesh(rThigh, geo.box, sec, 0, -0.12, 0, 0, 0, 0, 0.12, 0.12, 0.08);
  }

  if (spec.wear.extras.includes("shoulder-spike")) {
    addMesh(torso, geo.cone, acc, 0.18, 0.52, 0, 0, 0, -0.5, 0.6, 1, 0.6);
  }
  if (spec.wear.extras.includes("pouch")) {
    addMesh(hip, geo.box, sec, 0.14, 0.02, 0.06, 0, 0, 0, 0.08, 0.1, 0.06);
  }

  const auraM = new THREE.MeshBasicMaterial({
    color: hexToInt(spec.colors.emissive),
    transparent: true,
    opacity: spec.wear.aura === "none" ? 0 : 0.12,
    depthWrite: false,
  });
  mats.push(auraM);
  const aura = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), auraM);
  aura.position.y = 1.0;
  aura.scale.set(0.7, 1.15, 0.7);
  group.add(aura);

  const shadowM = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  mats.push(shadowM);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), shadowM);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  return {
    group,
    spec,
    mats,
    lThigh,
    rThigh,
    lShin,
    rShin,
    lArm,
    rArm,
    lFore,
    rFore,
    torso,
    head,
    seal,
    aura,
    eyes,
    weapon,
    shadow,
    walk: 0,
  };
}

export function poseStick(
  rig: StickRig,
  opts: {
    dt: number;
    speed: number;
    attack: number;
    hit: number;
    dead: number;
    dash: number;
    time: number;
  },
) {
  const spd = Math.min(opts.speed, 8);
  rig.walk += opts.dt * (4.5 + spd * 1.6);
  const w = spd > 0.4 ? Math.sin(rig.walk) : Math.sin(opts.time * 1.4) * 0.08;
  const w2 = spd > 0.4 ? Math.sin(rig.walk + Math.PI) : 0;
  const dead = Math.min(1, opts.dead);
  const hit = opts.hit;
  const atk = opts.attack;
  const dash = opts.dash;

  rig.lThigh.rotation.x = w * 0.7 * (1 - dead);
  rig.rThigh.rotation.x = w2 * 0.7 * (1 - dead);
  rig.lShin.rotation.x = Math.max(0, -w) * 0.45;
  rig.rShin.rotation.x = Math.max(0, -w2) * 0.45;
  rig.lArm.rotation.x = w2 * 0.45 * (1 - atk);
  rig.rArm.rotation.x = w * 0.35 * (1 - atk) - atk * 1.6 + dash * 0.4;
  rig.rArm.rotation.y = atk * 0.8;
  rig.rFore.rotation.x = atk * -0.6;
  rig.lArm.rotation.z = 0.18;
  rig.rArm.rotation.z = -0.18;
  rig.torso.rotation.x = spd * 0.02 + atk * 0.15;
  rig.torso.rotation.z = w * 0.04;
  rig.head.rotation.x = -spd * 0.01;
  rig.seal.rotation.y += opts.dt * 1.2;
  rig.group.rotation.x = dead * 1.35;
  rig.group.position.y = dead > 0 ? Math.max(0, 0.35 - dead * 0.5) : 0;
  const flash = hit > 0.02 ? 0.85 : 0;
  const body = rig.mats[0];
  if (body instanceof THREE.MeshStandardMaterial) {
    body.emissive.setRGB(flash, flash, flash);
  }
  const aura = rig.aura.material as THREE.MeshBasicMaterial;
  const pulse = 0.1 + Math.sin(opts.time * 3) * 0.04;
  aura.opacity = rig.spec.wear.aura === "none" ? 0 : pulse + (rig.spec.wear.aura === "ash" ? 0.06 : 0);
  rig.aura.scale.set(0.7 + pulse, 1.15 + pulse * 0.4, 0.7 + pulse);
}

export function disposeStick(rig: StickRig) {
  rig.group.removeFromParent();
  for (const m of rig.mats) m.dispose();
}

export function disposeSharedGeo() {
  Object.values(geo).forEach((g) => g.dispose());
}
