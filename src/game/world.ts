import * as THREE from "three";

export type Obstacle = { x: number; z: number; r: number };

export function buildArena(scene: THREE.Scene): { obstacles: Obstacle[]; rift: THREE.Mesh } {
  scene.fog = new THREE.Fog(0x0c0d0b, 22, 52);
  scene.background = new THREE.Color(0x0c0d0b);

  const hemi = new THREE.HemisphereLight(0xb8c4c8, 0x1a1410, 0.7);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xe8e4d8, 1.15);
  dir.position.set(-10, 22, 12);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.near = 4;
  dir.shadow.camera.far = 50;
  dir.shadow.camera.left = -22;
  dir.shadow.camera.right = 22;
  dir.shadow.camera.top = 22;
  dir.shadow.camera.bottom = -22;
  scene.add(dir);
  scene.add(new THREE.AmbientLight(0x2a3230, 0.28));

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x2a2620,
    roughness: 0.92,
    metalness: 0.04,
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(20, 48), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x3a342c,
    roughness: 0.85,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(18.2, 19.6, 48), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  scene.add(ring);

  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xc45c32,
    emissive: 0xc45c32,
    emissiveIntensity: 1.4,
    roughness: 0.4,
  });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const crack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 3.4 + (i % 3)), emberMat);
    crack.position.set(Math.sin(a) * 8.5, 0.03, Math.cos(a) * 8.5);
    crack.rotation.y = a;
    scene.add(crack);
    const light = new THREE.PointLight(0xc45c32, 0.55, 8);
    light.position.set(Math.sin(a) * 8.5, 0.4, Math.cos(a) * 8.5);
    scene.add(light);
  }

  const stone = new THREE.MeshStandardMaterial({
    color: 0x3e3a34,
    roughness: 0.88,
    metalness: 0.08,
  });
  const bone = new THREE.MeshStandardMaterial({
    color: 0x8a8478,
    roughness: 0.7,
  });
  const obstacles: Obstacle[] = [];
  const pillarPos = [
    [7.5, 7.5],
    [-8, 6.5],
    [8.2, -7],
    [-7.2, -8.4],
    [0, 11.5],
    [12.4, 0.5],
    [-12.2, 1.2],
  ];
  for (const [x, z] of pillarPos) {
    const h = 2.2 + ((Math.abs(x) + Math.abs(z)) % 5) * 0.15;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, h, 8), stone);
    p.position.set(x, h / 2, z);
    p.castShadow = true;
    p.receiveShadow = true;
    scene.add(p);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.16, 8), bone);
    cap.position.set(x, h + 0.08, z);
    scene.add(cap);
    obstacles.push({ x, z, r: 0.85 });
  }

  const rubbleGeo = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 5 + Math.random() * 12;
    const m = new THREE.Mesh(rubbleGeo, i % 2 ? stone : bone);
    const s = 0.3 + Math.random() * 0.7;
    m.scale.set(s, 0.18 + Math.random() * 0.35, s * 0.7);
    m.position.set(Math.sin(a) * r, m.scale.y / 2, Math.cos(a) * r);
    m.rotation.y = Math.random() * Math.PI;
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
  }

  const dais = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.28, 12), bone);
  dais.position.set(0, 0.14, -16.2);
  dais.receiveShadow = true;
  scene.add(dais);

  const riftMat = new THREE.MeshBasicMaterial({
    color: 0x6ea8b8,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const rift = new THREE.Mesh(new THREE.RingGeometry(2.4, 3.2, 32), riftMat);
  rift.position.set(0, 11.5, -6);
  rift.rotation.x = 0.4;
  scene.add(rift);
  const riftLight = new THREE.PointLight(0x6ea8b8, 1.2, 28);
  riftLight.position.set(0, 10, -4);
  scene.add(riftLight);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1c1a16,
    roughness: 0.95,
  });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(20.4, 20.4, 2.4, 48, 1, true), wallMat);
  wall.position.y = 1.2;
  wall.receiveShadow = true;
  scene.add(wall);

  return { obstacles, rift };
}
