export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function expSmooth(current: number, target: number, lambda: number, dt: number) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function len(x: number, z: number) {
  return Math.hypot(x, z);
}

export function norm(x: number, z: number): [number, number] {
  const l = Math.hypot(x, z);
  if (l < 1e-6) return [0, 0];
  return [x / l, z / l];
}

export function angleLerp(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function headingFromVel(vx: number, vz: number) {
  return Math.atan2(-vx, -vz);
}

export function radialDeadzone(x: number, y: number, dz = 0.18): { x: number; y: number } {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

export function hexToInt(hex: string) {
  return parseInt(hex.replace("#", ""), 16);
}

export function randRange(rng: () => number, a: number, b: number) {
  return a + rng() * (b - a);
}
