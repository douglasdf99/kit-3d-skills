import * as THREE from 'three';
import { mat, basic, mesh, box, rbox, cyl, sph, cap, at, group, Pipe, Sampled, canvasPlane, hash, clamp, lerp, roundedPath } from './lib.js';

/* ------------------------------------------------------------------ tema do cenário (cores do mundo/casa/sala)
   Padrão = cores dos vídeos originais. O estilo escolhido (biblioteca/estilos/<estilo>/estilo.json → "cenario")
   e o próprio vídeo (setTema) podem trocar qualquer chave. Cores: número 0xRRGGBB ou texto '#rrggbb'.
   Opções de forma: cerca 'branca' | 'tabuas' | 'ferro' | 'nenhuma'; arvores 'redondas' | 'pinheiros' | 'ciprestes';
   piso 'madeira' | 'xadrez' | 'lajota' (cor em floor [r,g,b]); fachada 'ripas' | 'reboco'; nuvens/sol true | false. */
export const TH = {
  grass: 0x7cc95a, grassRim: 0x5fae45, soil: ['#9b6a43', '#8a5a36', '#c79a6a'], side: 0x7a4f30,
  fence: 0xffffff, fenceAlt: 0xb47d50, fencePost: 0x8a5d3b, greens: [0x3f9e3a, 0x4cae42, 0x2f8a34, 0x58b84a], trunk: 0x7b5134,
  wallBack: 0xf3e7d3, wallLeft: 0xe4d3bb, cut: 0xb9a088, wallBackOut: 0xd9cbb5, ceiling: 0xe8d9c2,
  siding: ['#f4d6a8', 'rgba(150,100,50,0.18)', '#d9b07c'], checker: ['#f2efe8', '#3b4a5a'],
  roof: 0xc4553b, roofStripe: 0xa9432d, roofIn: 0x9c7656, gable: 0xd8c7ae, chimney: 0xa0503c, beam: 0x7a5a40,
  sky: ['#5aa2e8', '#8cc4f2', '#cfe9fb'], sun: 0xffd84a,
  cerca: 'branca', arvores: 'redondas', piso: 'madeira', fachada: 'ripas',
  fenceBase: 0xf1e6c8, floor: [196, 112, 72], floorLine: 'rgba(250,236,214,0.85)',
  nuvens: true, cloud: 0xffffff, sol: true, halo: 0xffe9a0,   // nuvens/sol no céu (false = sem)
};
/** troca cores/formas do cenário. Chame ANTES de construir o mundo/casa (ex.: setTema({ grass: '#9fcf55', cerca: 'tabuas' })) */
export function setTema(o = {}) { for (const k in o) if (o[k] !== undefined && o[k] !== null) TH[k] = o[k]; return TH; }
if (globalThis.__ESTILO__ && globalThis.__ESTILO__.cenario) setTema(globalThis.__ESTILO__.cenario);

/* ------------------------------------------------------------------ textures */
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
export function skyTexture() {
  return canvasTex(16, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, TH.sky[0]); g.addColorStop(0.55, TH.sky[1]); g.addColorStop(1, TH.sky[2]);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
}
function woodTex() {
  if (TH.piso === 'lajota') return canvasTex(1024, 1024, (x, w, h) => {   // lajotas quadradas com rejunte claro
    x.fillStyle = TH.floorLine; x.fillRect(0, 0, w, h);
    const n = 8, c = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = 0.9 + 0.16 * hash(i * 17 + j * 5);
      x.fillStyle = `rgb(${Math.round(TH.floor[0] * v)},${Math.round(TH.floor[1] * v)},${Math.round(TH.floor[2] * v)})`;
      x.fillRect(i * c + 4, j * c + 4, c - 8, c - 8);
    }
  });
  if (TH.piso === 'xadrez') return canvasTex(1024, 1024, (x, w, h) => {   // piso xadrez (padrão: tábuas de madeira)
    const n = 8, c = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { x.fillStyle = TH.checker[(i + j) % 2]; x.fillRect(i * c, j * c, c, c); }
    x.strokeStyle = 'rgba(0,0,0,0.12)'; x.lineWidth = 2; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * c, 0); x.lineTo(i * c, h); x.stroke(); x.beginPath(); x.moveTo(0, i * c); x.lineTo(w, i * c); x.stroke(); }
  });
  return canvasTex(1024, 1024, (x, w, h) => {
    x.fillStyle = '#c8935f'; x.fillRect(0, 0, w, h);
    const rows = 10;
    for (let r = 0; r < rows; r++) {
      const y0 = (r / rows) * h; const off = (r % 3) * 170;
      for (let k = -1; k < 4; k++) {
        const x0 = off + k * 340;
        const v = 0.92 + 0.12 * hash(r * 13 + k * 7);
        x.fillStyle = `rgb(${Math.round(200 * v)},${Math.round(147 * v)},${Math.round(95 * v)})`;
        x.fillRect(x0 + 2, y0 + 2, 336, h / rows - 4);
      }
      x.fillStyle = 'rgba(90,55,25,0.55)'; x.fillRect(0, y0, w, 3);
      for (let k = -1; k < 4; k++) x.fillRect(off + k * 340, y0, 3, h / rows);
    }
  });
}
function sidingTex() {
  if (TH.fachada === 'reboco') return canvasTex(512, 512, (x, w, h) => {   // reboco liso com uma faixa mais escura embaixo
    x.fillStyle = TH.siding[0]; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { x.fillStyle = TH.siding[1]; x.beginPath(); x.arc(hash(i * 3) * w, hash(i * 7) * h, 2 + 5 * hash(i * 11), 0, 7); x.fill(); }
    x.fillStyle = TH.siding[2]; x.fillRect(0, h - 56, w, 56);
  });
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = TH.siding[0]; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) { const y = (i / 16) * h; x.fillStyle = TH.siding[1]; x.fillRect(0, y, w, 4); x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(0, y + 4, w, 3); }
    x.fillStyle = TH.siding[2]; x.fillRect(0, h - 40, w, 40);
  });
}
function soilTex() {
  return canvasTex(1024, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, TH.soil[0]); g.addColorStop(0.45, TH.soil[1]); g.addColorStop(1, TH.soil[2]);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    // wavy darker band like the reference
    x.fillStyle = 'rgba(70,40,20,0.35)';
    x.beginPath(); x.moveTo(0, h * 0.42);
    for (let i = 0; i <= 20; i++) x.lineTo((i / 20) * w, h * (0.42 + 0.03 * Math.sin(i * 1.7)));
    x.lineTo(w, h * 0.5); for (let i = 20; i >= 0; i--) x.lineTo((i / 20) * w, h * (0.5 + 0.025 * Math.sin(i * 1.3)));
    x.fill();
    for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(80,50,30,${0.25 + 0.3 * hash(i)})`; x.beginPath(); x.ellipse(hash(i * 3) * w, h * 0.55 + hash(i * 5) * h * 0.4, 6 + 10 * hash(i * 7), 4 + 6 * hash(i * 9), 0, 0, 7); x.fill(); }
  });
}

/* ------------------------------------------------------------------ world */
export function buildWorld() {
  const W = new THREE.Group();
  // ground block (grass top, soil front)
  const soilM = new THREE.MeshStandardMaterial({ map: soilTex(), roughness: 1 });
  const grassM = mat(TH.grass, { flatShading: false, roughness: 1 });
  const sideM = mat(TH.side);
  const gGeo = new THREE.BoxGeometry(30, 3.2, 26);
  const ground = new THREE.Mesh(gGeo, [sideM, sideM, grassM, sideM, soilM, sideM]);
  ground.position.set(1, -1.6, 1.8 - 13); ground.receiveShadow = true;
  W.add(ground);
  // thin grass rim on the cut edge (cartoon lip)
  W.add(at(box(30, 0.07, 0.12, TH.grassRim), 1, -0.02, 1.78));

  // fence
  const fence = new THREE.Group();
  if (TH.cerca === 'tabuas') {   // cerca de tábuas de madeira na horizontal, com postes
    for (let x = -9; x <= 12.01; x += 1.5) fence.add(at(box(0.11, 0.86, 0.11, TH.fencePost), x, 0.43, 0.02));
    for (let k = 0; k < 4; k++) fence.add(at(box(21.5, 0.14, 0.035, k % 2 ? TH.fenceAlt : TH.fence), 1.5, 0.12 + k * 0.19, -0.03));
  } else if (TH.cerca === 'ferro') {   // grade de ferro preta sobre muretinha
    fence.add(at(box(21.5, 0.22, 0.16, TH.fenceBase), 1.5, 0.11, 0));
    for (let x = -9; x <= 12; x += 0.2) { fence.add(at(box(0.025, 0.62, 0.025, TH.fence), x, 0.53, 0)); const tip = mesh(new THREE.ConeGeometry(0.03, 0.08, 4), mat(TH.fence)); tip.position.set(x, 0.88, 0); fence.add(tip); }
    fence.add(at(box(21.5, 0.035, 0.035, TH.fence), 1.5, 0.78, 0));
    fence.add(at(box(21.5, 0.035, 0.035, TH.fence), 1.5, 0.32, 0));
    for (let x = -9; x <= 12.01; x += 2.4) fence.add(at(box(0.16, 0.95, 0.16, TH.fenceBase), x, 0.47, 0));
  } else if (TH.cerca !== 'nenhuma') {   // padrão: cerquinha branca de ripas
    for (let x = -9; x <= 12; x += 0.26) fence.add(at(box(0.09, 0.72, 0.05, TH.fence), x, 0.36, 0));
    fence.add(at(box(21.5, 0.07, 0.04, TH.fence), 1.5, 0.52, -0.04));
    fence.add(at(box(21.5, 0.07, 0.04, TH.fence), 1.5, 0.22, -0.04));
  }
  fence.position.z = -6.2; W.add(fence);
  // trees
  const greens = TH.greens;
  const treePos = [[-7.5, -8.5], [-5.2, -9.6], [-3, -8.2], [-0.6, -9.8], [1.8, -8.4], [4.2, -9.3], [6.5, -8.0], [8.6, -9.5], [10.5, -8.6], [-9.5, -10.5], [3, -11.5], [7.5, -11.6], [-4.2, -11.8]];
  treePos.forEach(([x, z], i) => {
    const s = 0.85 + 0.45 * hash(i * 3.3);
    const t = new THREE.Group();
    if (TH.arvores === 'ciprestes' && i % 3 === 0) {   // ciprestes altos e finos entre árvores redondas
      t.add(at(cyl(0.07, 0.09, 0.5, TH.trunk, 7), 0, 0.25, 0));
      const cy = mesh(new THREE.SphereGeometry(0.42, 9, 7), mat(greens[(i + 2) % 4])); cy.scale.set(0.75, 2.6, 0.75); cy.position.y = 1.45; t.add(cy);
    } else if (TH.arvores === 'pinheiros' && i % 3 !== 1) {   // pinheiros (cones empilhados)
      t.add(at(cyl(0.08, 0.11, 0.7, TH.trunk, 7), 0, 0.35, 0));
      for (let k = 0; k < 3; k++) { const cn = mesh(new THREE.ConeGeometry(0.72 - k * 0.17, 0.95 - k * 0.12, 7), mat(greens[(i + k) % 4])); cn.position.y = 0.85 + k * 0.5; t.add(cn); }
    } else {   // padrão: árvores redondas
      t.add(at(cyl(0.09, 0.12, 1.1, TH.trunk, 7), 0, 0.55, 0));
      t.add(at(sph(0.62, greens[i % 4], 0), 0, 1.45, 0));
      t.add(at(sph(0.45, greens[(i + 1) % 4], 0), 0.35, 1.2, 0.1));
      if (TH.arvores === 'redondas') t.add(at(sph(0.4, greens[(i + 2) % 4], 0), -0.32, 1.25, -0.05));
    }
    t.scale.setScalar(s); t.position.set(x, 0, z); t.rotation.y = hash(i) * 6;
    W.add(t);
  });
  // clouds
  const clouds = new THREE.Group();
  const cm = mat(TH.cloud, { roughness: 1 });
  (TH.nuvens === false ? [] : [[-9, 8.6, -16], [-3, 9.6, -18], [4, 8.3, -16], [10, 9.3, -18], [-14, 7.4, -17], [15, 8.0, -17]]).forEach(([x, y, z], i) => {
    const c = new THREE.Group();
    for (let k = 0; k < 5; k++) c.add(at(mesh(new THREE.IcosahedronGeometry(0.7 + 0.4 * hash(i * 9 + k), 1), cm, false, false), (k - 2) * 0.75, (k % 2) * 0.3 + 0.2 * hash(k + i), 0));
    c.scale.set(1.3, 0.85, 0.8); c.position.set(x, y, z);
    clouds.add(c);
  });
  W.add(clouds);
  // sun
  const sun = new THREE.Group();
  sun.add(mesh(new THREE.IcosahedronGeometry(1.5, 2), basic(TH.sun), false, false));
  const halo = mesh(new THREE.CircleGeometry(2.6, 40), basic(TH.halo, { transparent: true, opacity: 0.35, depthWrite: false }), false, false);
  sun.add(halo); sun.userData.halo = halo;
  sun.position.set(-11, 7.8, -22); sun.visible = TH.sol !== false;
  W.add(sun);
  return { group: W, clouds, sun };
}

/* face colors for cutaway walls: [+x,-x,+y,-y,+z,-z] */
function wallBox(w, h, d, colors) {
  const g = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, colors.map((c) => (typeof c === 'object' ? c : mat(c, { flatShading: false }))));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function buildRoom(R, opts = {}) {
  // R: {x0,x1,z0,z1,h,t}
  const g = new THREE.Group();
  const CUT = TH.cut, BACK = TH.wallBack, LEFT = TH.wallLeft;
  const OUT = new THREE.MeshStandardMaterial({ map: sidingTex(), roughness: 0.9 });
  // floor slab + wood
  g.add(at(wallBox(R.x1 - R.x0 + 0.6, 0.3, R.z1 - R.z0 + 0.25, [0x8e8e8e, 0x8e8e8e, 0x8e8e8e, 0x8e8e8e, 0x9a9a9a, 0x8e8e8e]), (R.x0 + R.x1) / 2 + 0.1, -0.15 + 0.005, (R.z0 + R.z1) / 2 - 0.12));
  const wood = woodTex(); wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(1.3, 1.3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(R.x1 - R.x0, R.z1 - R.z0), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.75 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set((R.x0 + R.x1) / 2, 0.012, (R.z0 + R.z1) / 2); floor.receiveShadow = true;
  g.add(floor);
  // back wall with window opening
  const bw = R.x1 - R.x0 + 2 * R.t, bz = R.z0 - R.t / 2, bx = (R.x0 + R.x1) / 2;
  const win = { x0: -2.45, x1: -1.25, y0: 1.05, y1: 2.15 };
  const bcol = [CUT, CUT, CUT, CUT, BACK, TH.wallBackOut];
  const pieces = [
    [R.x0 - R.t, win.x0, 0, R.h], [win.x1, R.x1 + R.t, 0, R.h], [win.x0, win.x1, 0, win.y0], [win.x0, win.x1, win.y1, R.h],
  ];
  for (const [a, b, c, d] of pieces) g.add(at(wallBox(b - a, d - c, R.t, bcol), (a + b) / 2, (c + d) / 2, bz));
  // window frame + glass + sill
  const wf = 0xffffff;
  const wx = (win.x0 + win.x1) / 2, wy = (win.y0 + win.y1) / 2, ww = win.x1 - win.x0, wh = win.y1 - win.y0;
  g.add(at(box(ww + 0.12, 0.07, R.t + 0.06, wf), wx, win.y1 + 0.02, bz));
  g.add(at(box(ww + 0.2, 0.06, R.t + 0.16, wf), wx, win.y0 - 0.02, bz + 0.05));
  g.add(at(box(0.07, wh, R.t + 0.06, wf), win.x0 - 0.02, wy, bz));
  g.add(at(box(0.07, wh, R.t + 0.06, wf), win.x1 + 0.02, wy, bz));
  g.add(at(box(0.04, wh, 0.04, wf), wx, wy, bz));
  const glassM = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.18, roughness: 0.1, depthWrite: false });
  const glass = at(mesh(new THREE.PlaneGeometry(ww, wh), glassM, false, false), wx, wy, bz);
  g.add(glass);
  const frostM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const frost = at(mesh(new THREE.PlaneGeometry(ww, wh), frostM, false, false), wx, wy, bz + 0.015);
  g.add(frost);
  // left wall
  const lw = R.z1 - R.z0 + R.t;
  g.add(at(wallBox(R.t, R.h, lw, [LEFT, TH.wallBackOut, CUT, CUT, CUT, CUT]), R.x0 - R.t / 2, R.h / 2, (R.z0 + R.z1) / 2 - R.t / 2));
  // right (exterior) wall
  g.add(at(wallBox(R.t, R.h, lw, [OUT, BACK, CUT, CUT, CUT, CUT]), R.x1 + R.t / 2, R.h / 2, (R.z0 + R.z1) / 2 - R.t / 2));
  // baseboards
  g.add(at(box(R.x1 - R.x0, 0.09, 0.03, 0xffffff), bx, 0.045, R.z0 + 0.015));
  g.add(at(box(0.03, 0.09, R.z1 - R.z0, 0xffffff), R.x0 + 0.015, 0.045, (R.z0 + R.z1) / 2));
  g.add(at(box(0.03, 0.09, R.z1 - R.z0, 0xffffff), R.x1 - 0.015, 0.045, (R.z0 + R.z1) / 2));
  // sunbeam (warm light shaft)
  const beamM = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const shape = new THREE.BufferGeometry();
  const fz = R.z0 + 1.9;
  const verts = new Float32Array([
    win.x0, win.y1, R.z0, win.x1, win.y1, R.z0, win.x1 + 0.9, 0.02, fz, win.x0 + 0.9, 0.02, fz,
    win.x0, win.y0, R.z0, win.x1, win.y0, R.z0, win.x1 + 0.5, 0.02, R.z0 + 1.0, win.x0 + 0.5, 0.02, R.z0 + 1.0,
  ]);
  shape.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  shape.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 0, 3, 7, 0, 7, 4, 1, 2, 6, 1, 6, 5]);
  const beam = new THREE.Mesh(shape, beamM); beam.renderOrder = 5;
  g.add(beam);
  // sun patch on floor
  const patchM = new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.9), patchM);
  patch.rotation.x = -Math.PI / 2; patch.position.set((win.x0 + win.x1) / 2 + 0.75, 0.02, R.z0 + 1.45);
  g.add(patch);


  // ceiling slab + gable roof (cutaway attic) — no shadows so the room stays lit
  const slab = wallBox(R.x1 - R.x0 + 2 * R.t + 0.2, 0.16, R.z1 - R.z0 + R.t + 0.1, [CUT, CUT, TH.ceiling, 0xffffff, CUT, CUT]);
  slab.castShadow = false; slab.position.set((R.x0 + R.x1) / 2, R.h + 0.08, (R.z0 + R.z1) / 2 - R.t / 2 - 0.05 + 0.05); g.add(slab);
  const rx0 = R.x0 - R.t - 0.35, rx1 = R.x1 + R.t + 0.35, ry = R.h + 0.16, rh = 1.45, rmid = (rx0 + rx1) / 2;
  const rz0 = R.z0 - R.t - 0.25, rz1 = R.z1 + 0.12;
  const halfW = (rx1 - rx0) / 2, slopeL = Math.hypot(halfW, rh), ang = Math.atan2(rh, halfW);
  const roofTop = mat(TH.roof, { flatShading: true });
  const roofIn = mat(TH.roofIn);
  for (const sd of [-1, 1]) {
    const sl = new THREE.Mesh(new THREE.BoxGeometry(slopeL + 0.1, 0.12, rz1 - rz0), [roofTop, roofTop, roofTop, roofIn, mat(CUT), mat(CUT)]);
    sl.castShadow = false; sl.receiveShadow = true;
    sl.position.set(rmid + sd * halfW / 2, ry + rh / 2, (rz0 + rz1) / 2); sl.rotation.z = -sd * ang;
    g.add(sl);
    // shingle stripes
    for (let k = 1; k < 6; k++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, rz1 - rz0), mat(TH.roofStripe)); const f = k / 6; st.position.set(rmid + sd * halfW * f, ry + rh * (1 - f) + 0.07, (rz0 + rz1) / 2); st.rotation.z = -sd * ang; st.castShadow = false; g.add(st); }
  }
  const tri = new THREE.Shape(); tri.moveTo(rx0 + 0.15, 0); tri.lineTo(rx1 - 0.15, 0); tri.lineTo(rmid, rh - 0.08); tri.lineTo(rx0 + 0.15, 0);
  const gable = new THREE.Mesh(new THREE.ShapeGeometry(tri), mat(TH.gable, { side: THREE.DoubleSide }));
  gable.position.set(0, ry, R.z0 - R.t + 0.01); g.add(gable);
  // attic beam + chimney
  const rbeam = box(0.12, 0.12, rz1 - rz0, TH.beam); rbeam.castShadow = false; rbeam.position.set(rmid, ry + rh - 0.12, (rz0 + rz1) / 2); g.add(rbeam);
  const chim = box(0.4, 0.9, 0.4, TH.chimney); chim.castShadow = false; chim.position.set(rmid + 1.3, ry + rh - 0.1, -1.2); g.add(chim);

  if (opts.decor === false) return { group: g, glass, frost, beam, patch, win };
  // decor: rug, plant, picture, side table
  const rug = rbox(1.9, 0.02, 1.3, 0.01, 0xe76f51); rug.position.set(-1.3, 0.02, -0.55); g.add(rug);
  const rug2 = rbox(1.6, 0.025, 1.0, 0.01, 0xf4a261); rug2.position.set(-1.3, 0.025, -0.55); g.add(rug2);
  const plant = group(at(cyl(0.16, 0.12, 0.32, 0xc0603a, 10), 0, 0.16, 0));
  [[0, 0.55, 0, 0.22], [0.12, 0.45, 0.06, 0.17], [-0.12, 0.47, -0.04, 0.18], [0.02, 0.72, -0.05, 0.15]].forEach(([x, y, z, r], i) => plant.add(at(sph(r, [0x3a9d4a, 0x2f8a3c, 0x4cb35a, 0x3a9d4a][i], 0), x, y, z)));
  plant.position.set(R.x0 + 0.35, 0, R.z0 + 0.35); g.add(plant);
  const pic = group(at(box(0.62, 0.46, 0.03, 0x5b3a29), 0, 0, 0));
  const art = canvasTex(256, 192, (x, w, h) => { x.fillStyle = '#9ad1f5'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffcf4a'; x.beginPath(); x.arc(180, 60, 30, 0, 7); x.fill(); x.fillStyle = '#4cae42'; x.beginPath(); x.moveTo(0, h); x.lineTo(90, 80); x.lineTo(170, h); x.fill(); x.fillStyle = '#2f8a34'; x.beginPath(); x.moveTo(110, h); x.lineTo(200, 100); x.lineTo(w, h); x.fill(); });
  pic.add(at(mesh(new THREE.PlaneGeometry(0.54, 0.38), new THREE.MeshStandardMaterial({ map: art }), false, false), 0, 0, 0.017));
  pic.position.set(-0.35, 1.75, R.z0 + 0.02); g.add(pic);
  return { group: g, glass, frost, beam, patch, win };
}

/* ------------------------------------------------------------------ wall clock & thermometer */
export function buildClock() {
  const g = new THREE.Group();
  const face = cyl(0.2, 0.2, 0.04, 0xffffff, 28); face.rotation.x = Math.PI / 2; g.add(face);
  const rim = mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 28), mat(0x2d3436)); g.add(rim);
  for (let i = 0; i < 12; i++) { const tk = box(0.012, 0.035, 0.01, 0x2d3436); const a = (i / 12) * Math.PI * 2; tk.position.set(Math.sin(a) * 0.16, Math.cos(a) * 0.16, 0.025); tk.rotation.z = -a; g.add(tk); }
  const hourP = new THREE.Group(); hourP.position.z = 0.03; const hr = at(box(0.022, 0.1, 0.01, 0x2d3436), 0, 0.045, 0); hourP.add(hr); g.add(hourP);
  const minP = new THREE.Group(); minP.position.z = 0.04; const mn = at(box(0.014, 0.15, 0.01, 0xe63946), 0, 0.07, 0); minP.add(mn); g.add(minP);
  g.add(at(sph(0.018, 0x2d3436), 0, 0, 0.045));
  g.userData = { hourP, minP };
  return g;
}
export function buildThermo() {
  const g = new THREE.Group();
  g.add(rbox(0.14, 0.62, 0.03, 0.012, 0xffffff));
  g.add(at(box(0.035, 0.46, 0.012, 0xe8eef2), 0, 0.04, 0.02));
  const colP = new THREE.Group(); colP.position.set(0, -0.19, 0.03);
  const col = at(box(0.02, 1, 0.01, 0xe63946), 0, 0.5, 0); colP.add(col); g.add(colP);
  g.add(at(sph(0.035, 0xe63946, 2), 0, -0.22, 0.03));
  for (let i = 0; i < 9; i++) g.add(at(box(0.03, 0.006, 0.005, 0x636e72), 0.04, -0.15 + i * 0.045, 0.02));
  g.userData = { colP, col };
  return g;
}

/* ------------------------------------------------------------------ person */
export function buildArmchair() {
  const g = new THREE.Group();
  const C1 = 0x2a9d8f, C2 = 0x238579;
  g.add(at(rbox(0.86, 0.22, 0.74, 0.06, C1), 0, 0.3, 0.02));
  g.add(at(rbox(0.86, 0.85, 0.2, 0.07, C2), 0, 0.68, -0.33));
  g.add(at(rbox(0.17, 0.42, 0.78, 0.06, C2), -0.47, 0.42, 0.0));
  g.add(at(rbox(0.17, 0.42, 0.78, 0.06, C2), 0.47, 0.42, 0.0));
  g.add(at(rbox(0.66, 0.08, 0.58, 0.04, 0x34b3a3), 0, 0.44, 0.05));
  for (const [x, z] of [[-0.45, -0.32], [0.45, -0.32], [-0.45, 0.32], [0.45, 0.32]]) g.add(at(cyl(0.035, 0.03, 0.18, 0x5b3a29, 8), x, 0.09, z));
  return g;
}
export function buildPerson(opts = {}) {
  const g = new THREE.Group();
  // sem look: o boneco modelo do kit (camisa branca, calça azul-escura, cabelo preto curtinho)
  const LK = Object.assign({ pants: true }, opts.look || {});
  if (LK.hairstyle === undefined && !LK.quiff && !LK.curls && !LK.franja) LK.hairstyle = 'curto';
  const SKIN = LK.skin ?? 0xf0b98a, SHIRT = LK.shirt ?? 0xf6f4ef, SHORTS = LK.shorts ?? 0x1f3462, HAIR = LK.hair ?? 0x16161a, SHOES = LK.shoes ?? 0x2b2f36;
  const SHIN = LK.pants ? SHORTS : SKIN;            // calça comprida em vez de bermuda (look.pants)
  const body = new THREE.Group(); g.add(body);
  // torso
  const torso = cap(0.2, 0.26, SHIRT); torso.scale.set(1.05, 1, 0.78); torso.position.set(0, 0.8, -0.1); torso.rotation.x = -0.12; body.add(torso);
  if (LK.stripe) {   // faixa no peito da camiseta (look.stripe)
    const band = mesh(new THREE.CylinderGeometry(0.203, 0.203, 0.055, 24, 1, true), mat(LK.stripe), false, false); band.position.y = 0.06; torso.add(band);
  }
  // o que vai por cima da camiseta: look.coat = 'jaleco' | 'colete' | 'avental' | 'macacao' (look.coatColor = cor)
  const coatG = new THREE.Group(); body.add(coatG);   // same frame as the torso (it follows torso.position in the standing fix below)
  if (LK.coat === 'jaleco' || LK.coat === 'colete') {
    const cc = LK.coatColor ?? (LK.coat === 'jaleco' ? 0xf4f4f0 : 0xb9a67a); const m = mat(cc, { roughness: 0.85 });
    const long = LK.coat === 'jaleco';
    for (const sx of [-1, 1]) { const panel = rbox(0.12, long ? 0.6 : 0.4, 0.035, 0.015, m); panel.position.set(sx * 0.1, long ? -0.12 : -0.02, 0.172); panel.rotation.y = sx * 0.3; coatG.add(panel); }
    const back = rbox(0.4, long ? 0.6 : 0.4, 0.035, 0.015, m); back.position.set(0, long ? -0.12 : -0.02, -0.15); coatG.add(back);
    for (const sx of [-1, 1]) { const side = rbox(0.035, long ? 0.58 : 0.38, 0.3, 0.015, m); side.position.set(sx * 0.205, long ? -0.12 : -0.02, 0.01); coatG.add(side); }
    for (const sx of [-1, 1]) { const lapel = rbox(0.06, 0.16, 0.02, 0.01, mat(long ? 0xe4e4df : 0x9d8c60)); lapel.position.set(sx * 0.07, 0.17, 0.2); lapel.rotation.z = sx * 0.5; coatG.add(lapel); }
    if (long) for (const sx of [-1, 1]) { const slv = cyl(0.085, 0.09, 0.2, m, 12); slv.position.set(sx * 0.25, 0.1, -0.01); coatG.add(slv); }
    if (!long) for (const y of [0.0, -0.1, -0.2]) { const bt = sph(0.012, mat(0x3a3a3a), 0); bt.position.set(0.0, y, 0.2); coatG.add(bt); }
  } else if (LK.coat === 'avental') {
    const m = mat(LK.coatColor ?? 0xd62828, { roughness: 0.9 });
    const bib = rbox(0.26, 0.26, 0.03, 0.02, m); bib.position.set(0, 0.03, 0.165); coatG.add(bib);
    const skirt = rbox(0.44, 0.42, 0.03, 0.02, m); skirt.position.set(0, -0.3, 0.17); coatG.add(skirt);
    const loop = mesh(new THREE.TorusGeometry(0.135, 0.012, 6, 20, Math.PI), m, false, false); loop.position.set(0, 0.17, 0.0); loop.rotation.x = -0.1; coatG.add(loop);
    const pk = rbox(0.16, 0.1, 0.02, 0.01, mat(0xa83030)); pk.position.set(0.06, -0.2, 0.19); coatG.add(pk);
  } else if (LK.coat === 'macacao') {
    const m = mat(LK.coatColor ?? 0x3d5a80, { roughness: 0.85 });
    const bib = rbox(0.24, 0.22, 0.04, 0.02, m); bib.position.set(0, -0.02, 0.17); coatG.add(bib);
    for (const sx of [-1, 1]) { const strap = rbox(0.05, 0.3, 0.03, 0.01, m); strap.position.set(sx * 0.09, 0.16, 0.14); strap.rotation.x = -0.35; coatG.add(strap); const bk = rbox(0.05, 0.2, 0.03, 0.01, m); bk.position.set(sx * 0.09, 0.18, -0.12); bk.rotation.x = 0.3; coatG.add(bk); const bt = sph(0.016, mat(0xc9a227, { metalness: 0.6 }), 0); bt.position.set(sx * 0.09, 0.07, 0.19); coatG.add(bt); }
    const belly = rbox(0.44, 0.22, 0.42, 0.06, m); belly.position.set(0, -0.2, -0.03); belly.scale.set(1.0, 1, 0.9); coatG.add(belly);
    if (!LK.pocket) { const pk = rbox(0.15, 0.1, 0.02, 0.01, mat(0x2f4a6b)); pk.position.set(0, -0.03, 0.195); coatG.add(pk); }
  }
  // bolsinho na camiseta (look.pocket = true) com algo dentro (look.pocketItem = 'parafuso' | 'caneta' | 'chave' | 'lapis')
  if (LK.pocket) {
    const onBib = LK.coat === 'macacao'; const PY = onBib ? -0.06 : 0.07, PZ = onBib ? 0.2 : 0.165, PX = onBib ? 0 : 0.095;   // bolso do lado esquerdo do peito
    const pm = mat(onBib ? (LK.coatColor ?? 0x3d5a80) : SHIRT, { roughness: 0.85 }); const pk = rbox(0.12, 0.11, 0.02, 0.01, pm); pk.position.set(PX, PY, PZ); coatG.add(pk);
    const seam = rbox(0.12, 0.012, 0.022, 0.004, mat(SHIRT, { unique: true })); seam.position.set(PX, PY + 0.055, PZ + 0.005); seam.material.color.offsetHSL(0, 0, -0.12); coatG.add(seam);
    const item = LK.pocketItem;
    if (item === 'parafuso') {
      const sm = mat(0xb8bfc6, { metalness: 0.75, roughness: 0.3 }); const shank = cyl(0.014, 0.014, 0.1, sm, 10); shank.position.set(PX, PY + 0.045, PZ + 0.013); coatG.add(shank);
      const hd = cyl(0.03, 0.03, 0.018, sm, 14); hd.position.set(PX, PY + 0.1, PZ + 0.013); coatG.add(hd); const slot = box(0.042, 0.005, 0.007, mat(0x55606a)); slot.position.set(PX, PY + 0.11, PZ + 0.013); coatG.add(slot);
      for (let k = 0; k < 4; k++) { const th = mesh(new THREE.TorusGeometry(0.015, 0.0035, 4, 10), sm, false, false); th.rotation.x = Math.PI / 2; th.position.set(PX, PY + 0.01 + k * 0.016, PZ + 0.013); coatG.add(th); }
    } else if (item === 'caneta' || item === 'lapis') {
      const cols = item === 'caneta' ? [0x1d3557, 0xd62828] : [0xf2c230]; cols.forEach((c, i) => { const pen = cyl(0.008, 0.008, 0.1, mat(c), 8); pen.position.set(PX - 0.015 + i * 0.03, PY + 0.05, PZ + 0.013); coatG.add(pen); const tip = cyl(0.004, 0.008, 0.02, mat(item === 'lapis' ? 0xf0b98a : 0xc9c9c9), 8); tip.position.set(PX - 0.015 + i * 0.03, PY + 0.11, PZ + 0.013); coatG.add(tip); });
    } else if (item === 'chave') {
      const wm = mat(0xb8bfc6, { metalness: 0.75, roughness: 0.3 }); const handle = box(0.014, 0.1, 0.008, wm); handle.position.set(PX, PY + 0.04, PZ + 0.013); coatG.add(handle);
      const jaw = mesh(new THREE.TorusGeometry(0.02, 0.007, 6, 12, Math.PI * 1.5), wm, false, false); jaw.position.set(PX, PY + 0.1, PZ + 0.013); jaw.rotation.z = Math.PI * 0.75; coatG.add(jaw);
    }
  }
  // gravata (look.tie = cor) ou gravata-borboleta (look.bowtie = cor)
  if (LK.tie) { const tm = mat(LK.tie); const kn = rbox(0.045, 0.035, 0.03, 0.01, tm); kn.position.set(0, 0.2, 0.175); coatG.add(kn); const tl = rbox(0.05, 0.25, 0.02, 0.01, tm); tl.position.set(0, 0.06, 0.18); coatG.add(tl); }
  if (LK.bowtie) { const tm = mat(LK.bowtie); for (const sx of [-1, 1]) { const w = rbox(0.06, 0.045, 0.02, 0.01, tm); w.position.set(sx * 0.04, 0.2, 0.175); w.rotation.z = sx * 0.15; coatG.add(w); } const kn = sph(0.016, tm, 1); kn.position.set(0, 0.2, 0.18); coatG.add(kn); }
  coatG.position.copy(torso.position); coatG.rotation.copy(torso.rotation);
  // head
  const headP = new THREE.Group(); headP.position.set(0, 1.2, -0.08); body.add(headP);
  const head = sph(0.175, SKIN, 2); head.scale.set(1, 1.04, 0.98); headP.add(head);
  const hair = sph(0.185, HAIR, 2); hair.scale.set(1.02, 0.78, 1.0); hair.position.set(0, 0.06, -0.025); headP.add(hair);
  if (LK.quiff) {
    // topete (look.quiff): alguns espetinhos macios pra frente + risca do lado
    hair.scale.set(1.03, 0.74, 1.0);
    const fr = rbox(0.24, 0.05, 0.1, 0.025, HAIR); fr.position.set(0.035, 0.125, 0.125); fr.rotation.set(0.42, 0, -0.18); headP.add(fr);
    [[-0.07, 0.17, 0.07, 0.05, 0.5, 0.25], [0.0, 0.19, 0.09, 0.058, 0.55, 0.0], [0.07, 0.175, 0.06, 0.05, 0.45, -0.25], [-0.03, 0.19, -0.02, 0.05, 0.25, 0.15], [0.05, 0.185, -0.03, 0.048, 0.2, -0.15]]
      .forEach(([x, y, z, r, rx, rz]) => { const c = mesh(new THREE.ConeGeometry(r, r * 2.1, 7), mat(HAIR), true, false); c.position.set(x, y, z); c.rotation.set(rx, 0, rz); headP.add(c); });
  } else if (LK.curls) {
    // cachos (look.curls): touca de cachinhos redondos no alto e atrás da cabeça
    hair.scale.set(1.04, 0.8, 1.02);
    for (let i = 0; i < 26; i++) {
      const u = (i * 0.618034) % 1, v = (i * 0.3819 + 0.13) % 1;
      const th = u * Math.PI * 2, ph = 0.18 + v * 1.05;                       // around the crown, down to the ears
      const x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th);
      if (z > 0.55 && y < 0.75) continue;                                     // keep the face (front) clear
      const c = sph(0.042 + 0.012 * ((i * 7) % 3) / 2, HAIR, 1); c.position.set(x * 0.18, 0.05 + y * 0.15, z * 0.18 - 0.01); headP.add(c);
    }
    const fr = rbox(0.26, 0.05, 0.08, 0.025, HAIR); fr.position.set(0, 0.135, 0.115); fr.rotation.x = 0.4; headP.add(fr);
  } else if (LK.hairstyle === 'rabo') {
    // rabo de cavalo (look.hairstyle = 'rabo'): cabelo puxado pra trás com uma franja fina e o rabo caindo atrás
    hair.scale.set(1.03, 0.82, 1.03);
    const fr = rbox(0.22, 0.045, 0.09, 0.02, HAIR); fr.position.set(0.04, 0.125, 0.125); fr.rotation.set(0.4, 0, -0.12); headP.add(fr);
    const knot = sph(0.05, HAIR, 1); knot.position.set(0, 0.07, -0.17); headP.add(knot);
    const tail = cap(0.04, 0.2, HAIR); tail.position.set(0, -0.08, -0.2); tail.rotation.x = 0.25; headP.add(tail);
    const tip = sph(0.045, HAIR, 1); tip.position.set(0, -0.22, -0.16); headP.add(tip);
    const band = mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 12), mat(LK.hairBand ?? 0xd62828), false, false); band.position.set(0, 0.07, -0.18); band.rotation.x = Math.PI / 2 * 0.3; headP.add(band);
  } else if (LK.hairstyle === 'coque') {
    // coque (look.hairstyle = 'coque'): cabelo liso e um coque no alto, atrás
    hair.scale.set(1.03, 0.8, 1.03);
    const fr = rbox(0.26, 0.045, 0.09, 0.02, HAIR); fr.position.set(-0.03, 0.125, 0.125); fr.rotation.set(0.4, 0, 0.12); headP.add(fr);
    const bun = sph(0.075, HAIR, 1); bun.scale.set(1, 0.85, 1); bun.position.set(0, 0.16, -0.12); headP.add(bun);
  } else if (LK.hairstyle === 'comprido') {
    // cabelo comprido liso (look.hairstyle = 'comprido'): cai dos lados e atrás até os ombros
    hair.scale.set(1.04, 0.84, 1.04);
    const fr = rbox(0.28, 0.05, 0.09, 0.025, HAIR); fr.position.set(0, 0.13, 0.12); fr.rotation.x = 0.35; headP.add(fr);
    for (const sx of [-1, 1]) { const sd = cap(0.055, 0.22, HAIR); sd.position.set(sx * 0.155, -0.1, -0.03); headP.add(sd); }
    const bk = rbox(0.3, 0.3, 0.1, 0.04, HAIR); bk.position.set(0, -0.08, -0.15); headP.add(bk);
  } else if (LK.hairstyle === 'careca') {
    // careca com cabelo dos lados (look.hairstyle = 'careca')
    hair.visible = false;
    for (const sx of [-1, 1]) { const sd = sph(0.075, HAIR, 1); sd.scale.set(0.6, 0.9, 1.2); sd.position.set(sx * 0.155, 0.0, -0.03); headP.add(sd); }
    const bk = rbox(0.24, 0.1, 0.06, 0.03, HAIR); bk.position.set(0, 0.0, -0.165); headP.add(bk);
  } else if (LK.hairstyle === 'espetado') {
    // cabelo espetado pra todo lado (look.hairstyle = 'espetado'): o cientista maluco
    hair.scale.set(1.05, 0.9, 1.05);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = 0.035 + 0.012 * ((i * 5) % 3) / 2; const c = mesh(new THREE.ConeGeometry(r, r * 2.6, 7), mat(HAIR), true, false); const ph = 0.35 + 0.5 * ((i * 7) % 3) / 2; c.position.set(Math.sin(ph) * Math.cos(a) * 0.17, 0.06 + Math.cos(ph) * 0.16, Math.sin(ph) * Math.sin(a) * 0.17 - 0.02); c.lookAt(c.position.clone().multiplyScalar(3)); c.rotateX(Math.PI / 2); headP.add(c); }
  } else if (LK.hairstyle === 'curto') {
    // cabelo curto bem rente (look.hairstyle = 'curto'): só a touca de cabelo, sem franja
    hair.scale.set(1.02, 0.76, 1.0);
  } else { const fringe = rbox(0.3, 0.06, 0.1, 0.03, HAIR); fringe.position.set(0, 0.13, 0.12); fringe.rotation.x = 0.35; headP.add(fringe); }
  // barba curta e/ou bigode (look.beard / look.mustache = cor)
  if (LK.beard) { const bm = mat(LK.beard, { roughness: 0.9 }); const bd = sph(0.155, bm, 2); bd.scale.set(1.02, 0.6, 0.72); bd.position.set(0, -0.11, 0.065); headP.add(bd); for (const sx of [-1, 1]) { const sd = sph(0.06, bm, 1); sd.scale.set(0.5, 1.0, 0.9); sd.position.set(sx * 0.15, -0.04, 0.07); headP.add(sd); } }
  if (LK.beard || LK.mustache) { const mm = mat(LK.mustache || LK.beard, { roughness: 0.9 }); const ms = rbox(0.13, 0.03, 0.045, 0.012, mm); ms.position.set(0, -0.045, 0.168); headP.add(ms); if (LK.mustache && !LK.beard) { for (const sx of [-1, 1]) { const tip = sph(0.022, mm, 1); tip.position.set(sx * 0.075, -0.04, 0.165); headP.add(tip); } } }
  // chapéus (look.hat = 'bone' | 'bone_tras' | 'capacete' | 'chapeu' | 'touca' | 'chef' | 'palha'; look.hatColor = cor). Com chapéu, a franja/topete somem.
  if (LK.hat) {
    const hc = LK.hatColor ?? 0xd62828; const hatG = new THREE.Group(); hatG.position.set(0, 0.1, 0); headP.add(hatG); hatG.name = 'hat';
    headP.children.forEach((o) => { if (o !== hatG && o !== hair && o.isMesh && o.position.y > 0.1 && o.material && o.material.color && o.material.color.getHex() === (typeof HAIR === 'number' ? HAIR : 0)) o.visible = false; });
    if (LK.hat === 'bone' || LK.hat === 'bone_tras') {
      hatG.add(at(mesh(new THREE.SphereGeometry(0.19, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(hc)), 0, 0.0, 0)); hatG.add(at(cyl(0.19, 0.19, 0.03, mat(hc), 20), 0, 0.01, 0));
      const visor = mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.02, 18, 1, false, -Math.PI / 2, Math.PI), mat(hc)); visor.position.set(0, 0.0, 0.07); visor.scale.set(1, 1, 0.85); hatG.add(visor);
      hatG.add(at(sph(0.025, mat(hc), 1), 0, 0.19, 0));
      if (LK.hat === 'bone_tras') hatG.rotation.y = Math.PI;
    } else if (LK.hat === 'capacete') {
      const dome = mesh(new THREE.SphereGeometry(0.205, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(hc, { roughness: 0.45 })); dome.scale.set(1, 0.95, 1.05); hatG.add(dome);
      const brim = cyl(0.235, 0.235, 0.025, mat(hc, { roughness: 0.45 }), 20); brim.scale.set(1, 1, 1.12); brim.position.set(0, 0.0, 0.02); hatG.add(brim); hatG.add(at(box(0.05, 0.05, 0.4, mat(hc)), 0, 0.2, 0.0));
    } else if (LK.hat === 'chapeu' || LK.hat === 'palha') {
      const m = mat(hc, { roughness: 0.85 }); hatG.add(at(cyl(0.175, 0.19, 0.13, m, 20), 0, 0.065, 0)); hatG.add(at(mesh(new THREE.SphereGeometry(0.175, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), m), 0, 0.13, 0));
      const brim = cyl(LK.hat === 'palha' ? 0.34 : 0.3, 0.26, 0.025, m, 24); brim.rotation.x = 0.1; hatG.add(brim); hatG.add(at(cyl(0.193, 0.193, 0.04, mat(LK.hatBand ?? 0x5b4a2f), 20), 0, 0.045, 0));
    } else if (LK.hat === 'touca') {
      const m = mat(hc, { roughness: 0.95 }); const d = mesh(new THREE.SphereGeometry(0.2, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), m); d.scale.set(1, 1.15, 1); d.position.y = 0.0; hatG.add(d);
      hatG.add(at(cyl(0.205, 0.205, 0.07, m, 20), 0, 0.02, 0)); hatG.add(at(sph(0.05, m, 1), 0, 0.26, 0));
    } else if (LK.hat === 'chef') {
      const m = mat(0xffffff, { roughness: 0.9 }); hatG.add(at(cyl(0.17, 0.18, 0.08, m, 20), 0, 0.04, 0));
      const puff = sph(0.2, m, 2); puff.scale.set(1, 0.95, 1); puff.position.y = 0.22; hatG.add(puff); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const pf = sph(0.09, m, 1); pf.position.set(Math.cos(a) * 0.15, 0.24, Math.sin(a) * 0.15); hatG.add(pf); }
    }
  }
  if (LK.glasses) {   // óculos redondos (look.glasses = cor da armação)
    const gm = mat(LK.glasses, { metalness: 0.3, roughness: 0.4, flatShading: false });
    for (const sx of [-1, 1]) { const r = mesh(new THREE.TorusGeometry(0.037, 0.0055, 8, 24), gm, false, false); r.position.set(sx * 0.062, 0.022, 0.172); headP.add(r); }
    const br = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.05, 6), gm, false, false); br.rotation.z = Math.PI / 2; br.position.set(0, 0.03, 0.176); headP.add(br);
    for (const sx of [-1, 1]) { const arm = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.15, 6), gm, false, false); arm.rotation.x = Math.PI / 2; arm.position.set(sx * 0.1, 0.028, 0.1); headP.add(arm); }
  }
  for (const sx of [-1, 1]) { const ear = sph(0.04, SKIN, 1); ear.position.set(sx * 0.172, 0, 0); headP.add(ear); }
  const eyeM = mat(0x1e1e1e, { roughness: 0.3 });
  const eyes = [];
  for (const sx of [-1, 1]) {
    const e = mesh(new THREE.SphereGeometry(0.023, 10, 8), eyeM, false, false); e.position.set(sx * 0.062, 0.02, 0.158); headP.add(e); eyes.push(e);
    const hl = mesh(new THREE.SphereGeometry(0.007, 6, 6), basic(0xffffff), false, false); hl.position.set(sx * 0.062 + 0.008, 0.03, 0.178); headP.add(hl); eyes.push(hl);
  }
  const brows = [];
  for (const sx of [-1, 1]) { const b = box(0.06, 0.013, 0.012, HAIR); b.position.set(sx * 0.064, 0.072, 0.162); headP.add(b); brows.push(b); }
  const nose = sph(0.022, 0xe9a676, 1); nose.position.set(0, -0.015, 0.175); headP.add(nose);
  const mouthP = new THREE.Group(); mouthP.position.set(0, -0.075, 0.158); headP.add(mouthP);
  const mouth = mesh(new THREE.TorusGeometry(0.04, 0.009, 6, 14, Math.PI), mat(0x7a2e2e), false, false); mouthP.add(mouth);
  const cheekM = new THREE.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: 0, depthWrite: false });
  for (const sx of [-1, 1]) { const ck = mesh(new THREE.CircleGeometry(0.03, 12), cheekM, false, false); ck.position.set(sx * 0.105, -0.035, 0.148); ck.rotation.y = sx * 0.55; headP.add(ck); }
  // sweat drops
  const dropM = new THREE.MeshStandardMaterial({ color: 0x7fd3ff, roughness: 0.1, transparent: true, opacity: 0.95 });
  const drops = [];
  for (let i = 0; i < 4; i++) {
    const d = new THREE.Group();
    const s1 = mesh(new THREE.SphereGeometry(0.02, 10, 8), dropM, false, false); d.add(s1);
    const c1 = mesh(new THREE.ConeGeometry(0.0195, 0.035, 10), dropM, false, false); c1.position.y = 0.025; d.add(c1);
    headP.add(d); drops.push(d);
  }
  // breath puff (cold)
  const breathM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0, roughness: 1, depthWrite: false });
  const breath = [];
  for (let i = 0; i < 3; i++) { const b = mesh(new THREE.IcosahedronGeometry(0.04, 1), breathM, false, false); headP.add(b); breath.push(b); }
  // legs (sitting)
  const legs = [];
  for (const sx of [-1, 1]) {
    if (opts.standing) {
      const hip = new THREE.Group(); hip.position.set(sx * 0.1, 0.77, -0.1); body.add(hip);
      const th = cap(0.085, 0.3, SHORTS); th.position.set(0, -0.15, 0); hip.add(th);
      const sh = cap(LK.pants ? 0.07 : 0.06, 0.34, SHIN); sh.position.set(0, -0.5, 0); hip.add(sh);
      const ft = rbox(0.1, 0.05, 0.2, 0.02, SHOES); ft.position.set(0, -0.72, 0.06); hip.add(ft);
      legs.push({ hip, sx });
      continue;
    }
    const th = cap(0.085, 0.36, SHORTS); th.rotation.x = Math.PI / 2; th.position.set(sx * 0.1, 0.555, 0.2); body.add(th);
    const sh = cap(LK.pants ? 0.07 : 0.06, 0.34, SHIN); sh.position.set(sx * 0.1, 0.31, 0.48); body.add(sh);
    const ft = rbox(0.1, 0.05, 0.2, 0.02, SHOES); ft.position.set(sx * 0.1, 0.05, 0.54); body.add(ft);
  }
  // arms with pivots
  const arms = [];
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.25, 0.98, -0.1); body.add(sh);
    const sleeve = sph(0.08, SHIRT, 1); sh.add(sleeve);
    const up = cap(0.055, 0.2, SKIN); up.position.y = -0.14; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.27; sh.add(el);
    const fo = cap(0.05, 0.2, SKIN); fo.position.y = -0.12; el.add(fo);
    const hand = sph(0.06, SKIN, 1); hand.position.y = -0.26; el.add(hand);
    const handP = new THREE.Group(); handP.position.y = -0.27; el.add(handP);
    arms.push({ sh, el, handP, sx });
  }
  if (opts.standing) {
    const up = 0.33;
    torso.position.y += up; torso.position.z = -0.1; torso.rotation.x = 0;
    coatG.position.copy(torso.position); coatG.rotation.copy(torso.rotation);
    headP.position.y += up; headP.position.z = -0.1;
    arms.forEach((a) => { a.sh.position.y += up; });
  }
  g.userData = { body, headP, mouthP, mouth, brows, drops, cheekM, breath, breathM, arms, legs, torso, coatG, eyes, standing: !!opts.standing };
  return g;
}
/** state: mood (-1 hot/sad … 1 happy), sweat 0..1, fan 0..1 (fanning with hand), shiver 0..1, remote 0..1 (arm forward holding remote) */
export function updatePerson(P, t, st) {
  const u = P.userData;
  const mood = st.mood ?? 0, sweat = st.sweat ?? 0, fanA = st.fan ?? 0, shiver = st.shiver ?? 0, remote = st.remote ?? 0;
  // mouth: smile (arc down) vs frown (arc up)
  u.mouth.rotation.z = mood >= 0 ? Math.PI : 0;
  const curve = Math.abs(mood);
  u.mouthP.scale.set(1, 0.25 + 0.75 * curve, 1);
  u.mouthP.position.y = mood >= 0 ? -0.06 : -0.1;
  // brows
  u.brows[0].rotation.z = -0.35 * Math.min(0, mood) * -1 * -1; // left
  u.brows[0].rotation.z = mood < 0 ? -0.3 * -mood : 0.08 * mood;
  u.brows[1].rotation.z = mood < 0 ? 0.3 * -mood : -0.08 * mood;
  u.cheekM.opacity = 0.55 * clamp(sweat);
  // head bob / breathing
  const br = Math.sin(t * 2.2) * 0.008;
  u.body.position.y = br;
  // shiver
  u.body.position.x = shiver * Math.sin(t * 55) * 0.012;
  u.headP.rotation.z = shiver * Math.sin(t * 43) * 0.04 + (mood < 0 ? Math.sin(t * 1.3) * 0.04 : 0);
  u.headP.rotation.x = mood > 0.3 ? -0.08 * mood : 0.06 * clamp(-mood);
  // sweat drops loop
  u.drops.forEach((d, i) => {
    const cyc = (t * 0.9 + i * 0.27) % 1;
    const side = i % 2 ? 1 : -1;
    const sx = side * (0.11 + 0.04 * (i > 1));
    d.position.set(sx, 0.08 - cyc * 0.32, 0.1 + 0.03 * (i > 1));
    const vis = sweat > 0.05 ? clamp(sweat * 1.5) : 0;
    const sc = vis * (cyc < 0.15 ? cyc / 0.15 : cyc > 0.85 ? (1 - cyc) / 0.15 : 1);
    d.scale.setScalar(Math.max(0.0001, sc));
  });
  // breath
  u.breathM.opacity = 0;
  u.breath.forEach((b, i) => {
    const cyc = (t * 0.7 + i / 3) % 1;
    b.position.set(0, -0.08 + cyc * 0.06, 0.2 + cyc * 0.35);
    b.scale.setScalar(Math.max(0.0001, shiver * (0.5 + cyc * 1.6)));
  });
  u.breathM.opacity = 0.75 * shiver;
  // arms: rest pose on armrests
  const [L, Rr] = u.arms;
  for (const a of u.arms) {
    if (u.standing) { a.sh.rotation.set(0.05, 0, a.sx * 0.1); a.el.rotation.set(-0.25, 0, 0); }
    else { a.sh.rotation.set(-0.35, 0, a.sx * 0.12); a.el.rotation.set(-1.15, 0, 0); }
  }
  // fanning (right hand near face, waving)
  if (fanA > 0) {
    const w = Math.sin(t * 16) * 0.35;
    Rr.sh.rotation.set(lerp(-0.35, -2.2, fanA), 0, lerp(0.12, 0.35, fanA) + w * 0.2 * fanA);
    Rr.el.rotation.set(lerp(-1.15, -1.5, fanA), 0, w * fanA);
  }
  if (remote > 0) {
    Rr.sh.rotation.set(lerp(Rr.sh.rotation.x, -0.9, remote), 0, lerp(Rr.sh.rotation.z, 0.05, remote));
    Rr.el.rotation.set(lerp(Rr.el.rotation.x, -0.75, remote), 0, 0);
  }
  if (shiver > 0) {
    // arms hugging
    L.sh.rotation.set(lerp(-0.35, -0.6, shiver), 0, lerp(-0.12, 0.55, shiver));
    L.el.rotation.set(lerp(-1.15, -1.6, shiver), lerp(0, 0.9, shiver), 0);
    if (remote < 0.5) { Rr.sh.rotation.set(lerp(-0.35, -0.6, shiver), 0, lerp(0.12, -0.55, shiver)); Rr.el.rotation.set(lerp(-1.15, -1.6, shiver), lerp(0, -0.9, shiver), 0); }
  }
}

/* ------------------------------------------------------------------ fan (ventilador) */
export function buildFan() {
  const g = new THREE.Group();
  const W = 0xf5f6f7, D = 0x2d3436, B = 0x2a8fd6;
  g.add(at(cyl(0.26, 0.29, 0.06, W, 24), 0, 0.03, 0));
  g.add(at(cyl(0.035, 0.035, 0.75, 0xcfd6db, 10), 0, 0.42, 0));
  const head = new THREE.Group(); head.position.set(0, 0.86, 0); g.add(head);
  const motor = cap(0.085, 0.12, W); motor.rotation.x = Math.PI / 2; motor.position.z = -0.12; head.add(motor);
  const cage = new THREE.Group(); head.add(cage);
  const wireM = mat(0xdfe6e9, { metalness: 0.3, roughness: 0.4 });
  const ringF = mesh(new THREE.TorusGeometry(0.31, 0.012, 6, 36), wireM); ringF.position.z = 0.06; cage.add(ringF);
  const ringB = mesh(new THREE.TorusGeometry(0.31, 0.012, 6, 36), wireM); ringB.position.z = -0.06; cage.add(ringB);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const s = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.12, 4), wireM, false); s.rotation.x = Math.PI / 2; s.position.set(Math.cos(a) * 0.31, Math.sin(a) * 0.31, 0); cage.add(s);
    for (const zz of [0.065, -0.065]) {
      const sp = mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.3, 3), wireM, false); sp.position.set(Math.cos(a) * 0.15, Math.sin(a) * 0.15, zz); sp.rotation.z = a - Math.PI / 2; cage.add(sp);
    }
  }
  const badge = cyl(0.05, 0.05, 0.02, B, 16); badge.rotation.x = Math.PI / 2; badge.position.z = 0.075; cage.add(badge);
  const rotor = new THREE.Group(); rotor.position.z = 0.0; head.add(rotor);
  const bladeM = new THREE.MeshStandardMaterial({ color: B, transparent: true, opacity: 0.92, roughness: 0.4, flatShading: true });
  for (let i = 0; i < 3; i++) {
    const bl = mesh(new THREE.SphereGeometry(0.13, 10, 6), bladeM); bl.scale.set(0.55, 1, 0.12);
    const p = new THREE.Group(); bl.position.y = 0.15; bl.rotation.y = 0.35; p.add(bl); p.rotation.z = (i / 3) * Math.PI * 2; rotor.add(p);
  }
  rotor.add(at(cyl(0.045, 0.045, 0.05, D, 12), 0, 0, 0)); rotor.children[rotor.children.length - 1].rotation.x = Math.PI / 2;
  const blurM = new THREE.MeshBasicMaterial({ color: B, transparent: true, opacity: 0, depthWrite: false });
  const blur = mesh(new THREE.CircleGeometry(0.29, 32), blurM, false, false); head.add(blur);
  g.userData = { head, rotor, blurM, bladeM };
  return g;
}
export function spinFan(F, angle, speed01) {
  const u = F.userData;
  u.rotor.rotation.z = angle;
  u.blurM.opacity = 0.28 * speed01;
  u.bladeM.opacity = 0.92 - 0.45 * speed01;
}

/* ------------------------------------------------------------------ bucket of ice */
export function buildBucket() {
  const g = new THREE.Group();
  const prof = [new THREE.Vector2(0.0, 0), new THREE.Vector2(0.17, 0), new THREE.Vector2(0.22, 0.36), new THREE.Vector2(0.235, 0.37), new THREE.Vector2(0.235, 0.385), new THREE.Vector2(0.215, 0.38), new THREE.Vector2(0.155, 0.02), new THREE.Vector2(0.0, 0.02)];
  const b = mesh(new THREE.LatheGeometry(prof, 24), mat(0xa9b4bb, { metalness: 0.5, roughness: 0.35, flatShading: false, side: THREE.DoubleSide }));
  g.add(b);
  for (const y of [0.1, 0.25]) { const r = mesh(new THREE.TorusGeometry(0.18 + y * 0.12, 0.007, 6, 30), mat(0x8a959c, { metalness: 0.5 })); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }
  const handle = mesh(new THREE.TorusGeometry(0.23, 0.01, 6, 24, Math.PI), mat(0x6c7a83, { metalness: 0.6 })); handle.position.y = 0.38; handle.rotation.y = 0.3; g.add(handle);
  // water
  const waterM = new THREE.MeshStandardMaterial({ color: 0x6fc3ef, transparent: true, opacity: 0.85, roughness: 0.1 });
  const water = mesh(new THREE.CylinderGeometry(1, 1, 0.01, 24), waterM, false);
  g.add(water);
  // ice
  const iceM = new THREE.MeshStandardMaterial({ color: 0xe3f6ff, transparent: true, opacity: 0.88, roughness: 0.15, flatShading: true, emissive: 0x9bd8ff, emissiveIntensity: 0.15 });
  const ice = [];
  const spots = [[0, 0.33, 0], [0.09, 0.31, 0.05], [-0.08, 0.32, 0.06], [0.05, 0.36, -0.08], [-0.07, 0.35, -0.06], [0.12, 0.35, -0.02], [-0.12, 0.33, 0.0], [0.02, 0.4, 0.06], [0.0, 0.42, -0.02], [-0.04, 0.4, 0.1], [0.1, 0.42, 0.08]];
  spots.forEach((p, i) => { const c = mesh(new THREE.BoxGeometry(0.095, 0.095, 0.095), iceM); c.position.set(...p); c.rotation.set(hash(i) * 3, hash(i * 2) * 3, hash(i * 3) * 3); g.add(c); ice.push({ m: c, p, i }); });
  g.userData = { water, ice };
  return g;
}
export function updateBucket(B, melt) {
  const u = B.userData;
  u.ice.forEach(({ m, p, i }) => {
    const k = clamp(melt * 1.25 - hash(i * 7) * 0.25);
    const s = Math.max(0.0001, 1 - k);
    m.scale.setScalar(s);
    m.position.set(p[0], lerp(p[1], 0.08 + melt * 0.18, k * 0.8), p[2]);
  });
  const h = 0.05 + melt * 0.2;
  u.water.position.y = h;
  const r = 0.155 + (0.215 - 0.155) * (h / 0.37);
  u.water.scale.set(r, 1, r);
}

/* ------------------------------------------------------------------ clear refrigerant tank */
export function buildTank() {
  const g = new THREE.Group();
  const shell = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.28, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }), false, false);
  shell.position.y = 0.3; shell.renderOrder = 3; g.add(shell);
  const top = cyl(0.165, 0.165, 0.05, 0xe85d9b, 24); top.position.y = 0.575; g.add(top);
  const bot = cyl(0.165, 0.17, 0.06, 0xe85d9b, 24); bot.position.y = 0.03; g.add(bot);
  g.add(at(cyl(0.03, 0.03, 0.08, 0xc8a24a, 10, { metalness: 0.6, roughness: 0.3 }), 0, 0.64, 0));
  const ring = mesh(new THREE.TorusGeometry(0.1, 0.018, 6, 20), mat(0xe85d9b)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.66; g.add(ring);
  const liqM = new THREE.MeshStandardMaterial({ color: 0x2f7dff, transparent: true, opacity: 0.55, depthWrite: false, roughness: 0.2, emissive: 0x0b3fa8, emissiveIntensity: 0.25 });
  const liq = mesh(new THREE.CylinderGeometry(0.15, 0.15, 1, 24), liqM, false); g.add(liq);
  // outlet nozzle (side, bottom) towards +x
  const noz = cyl(0.025, 0.025, 0.12, 0xc8a24a, 10, { metalness: 0.6 }); noz.rotation.z = Math.PI / 2; noz.position.set(0.2, 0.1, 0); g.add(noz);
  const bubM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, roughness: 0.1, emissive: 0xbfe8ff, emissiveIntensity: 0.4 });
  const bubbles = [];
  for (let i = 0; i < 22; i++) { const b = mesh(new THREE.IcosahedronGeometry(0.022 + 0.016 * hash(i), 1), bubM, false, false); g.add(b); bubbles.push(b); }
  g.userData = { liq, bubbles, outlet: new THREE.Vector3(0.26, 0.1, 0) };
  return g;
}
export function updateTank(T, t, level, boil) {
  const u = T.userData;
  const h = Math.max(0.001, 0.46 * level);
  u.liq.scale.y = h; u.liq.position.y = 0.07 + h / 2; u.liq.visible = level > 0.005;
  u.bubbles.forEach((b, i) => {
    const cyc = (t * (0.9 + hash(i) * 0.8) + hash(i * 3)) % 1;
    const a = hash(i * 5) * 6.28, r = 0.11 * Math.sqrt(hash(i * 7));
    b.position.set(Math.cos(a) * r, 0.08 + cyc * h, Math.sin(a) * r);
    b.visible = boil > 0.05 && level > 0.03;
    b.scale.setScalar(Math.max(0.001, boil * (0.6 + cyc)));
  });
}

/* ------------------------------------------------------------------ coil (serpentina) */
export function buildCoil({ w = 0.86, h = 0.62, rows = 7, frame = 0xc7cfd4, radius = 0.028, pipeColor = 0xd98a5f, fins = 11, finOpacity = 0.22, stub = 0.16, maxDots = 260 }) {
  const g = new THREE.Group();
  const y0 = 0.08, dy = (h - 0.16) / (rows - 1);
  const pts = [[-w / 2 - stub, y0, 0]];
  for (let i = 0; i < rows; i++) {
    const y = y0 + i * dy;
    const left = i % 2 === 0;
    pts.push([left ? -w / 2 + 0.06 : w / 2 - 0.06, y, 0]);
    pts.push([left ? w / 2 - 0.06 : -w / 2 + 0.06, y, 0]);
  }
  const last = pts[pts.length - 1];
  const outX = last[0] > 0 ? w / 2 + stub : -w / 2 - stub;
  pts.push([outX, last[1], 0]);
  const pipe = new Pipe({ points: pts, radius, corner: dy / 2, color: pipeColor, opacity: 0.5, maxDots, dotR: radius * 0.75, tubSeg: 420 });
  g.add(pipe.group);
  // side plates
  const sm = mat(frame, { metalness: 0.25, roughness: 0.5 });
  g.add(at(mesh(new THREE.BoxGeometry(0.03, h + 0.04, 0.14), sm), -w / 2, h / 2 - 0.02 + 0.0, 0));
  g.add(at(mesh(new THREE.BoxGeometry(0.03, h + 0.04, 0.14), sm), w / 2, h / 2 - 0.02, 0));
  // thin fins
  const finM = new THREE.MeshStandardMaterial({ color: 0xdfe6ea, transparent: true, opacity: finOpacity, roughness: 0.35, metalness: 0.3, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 1; i < fins; i++) { const f = mesh(new THREE.PlaneGeometry(0.12, h - 0.02), finM, false, false); f.rotation.y = Math.PI / 2; f.position.set(-w / 2 + (i / fins) * w, h / 2 - 0.02, 0); g.add(f); }
  g.userData = { pipe, inlet: new THREE.Vector3(...pts[0]), outlet: new THREE.Vector3(...pts[pts.length - 1]), w, h };
  return g;
}


/* ------------------------------------------------------------------ helix coil (serpentina em espiral) — axis along local +x */
export function buildHelix({ r = 0.2, L = 0.6, turns = 6, h0 = 0.24, stub = 0.2, radius = 0.028, maxDots = 300 }) {
  const g = new THREE.Group();
  const pts = [];
  pts.push([-L / 2 - 0.02, h0, r + stub]);
  const N = turns * 28;
  for (let i = 0; i <= N; i++) {
    const f = i / N, a = Math.PI / 2 + f * turns * Math.PI * 2;
    pts.push([-L / 2 + f * L, h0 + r * Math.cos(a), r * Math.sin(a)]);
  }
  const P = pts.map((p) => new THREE.Vector3(...p));
  const path = new THREE.CurvePath();
  // straight stub in, helix as catmull-rom, outlet: back then up (open mouth pointing up)
  const hel = new THREE.CatmullRomCurve3(P.slice(1));
  path.add(new THREE.LineCurve3(P[0], P[1]));
  path.add(hel);
  const e = P[P.length - 1];
  const o1 = new THREE.Vector3(L / 2 + 0.02, h0, r + stub - 0.06);
  const o2 = new THREE.Vector3(L / 2 + 0.02, h0 + 0.06, r + stub);
  const o3 = new THREE.Vector3(L / 2 + 0.02, h0 + 0.3, r + stub);
  path.add(new THREE.LineCurve3(e, o1));
  path.add(new THREE.QuadraticBezierCurve3(o1, new THREE.Vector3(L / 2 + 0.02, h0, r + stub), o2));
  path.add(new THREE.LineCurve3(o2, o3));
  P.push(o3);
  const pipe = new Pipe({ points: [[0, 0, 0], [0, 0.01, 0]], radius, color: 0xd98a5f, opacity: 0.5, maxDots, dotR: radius * 0.75, tubSeg: 520 });
  pipe.curve = path; pipe.s = new Sampled(path, 900); pipe._key = 'helix';
  pipe.tube.geometry.dispose(); pipe.tube.geometry = new THREE.TubeGeometry(path, 520, radius, 10, false); pipe.idxCount = pipe.tube.geometry.index.count; pipe.tubSeg = 520;
  g.add(pipe.group);
  // base plate + two cradles
  const plate = rbox(L + 0.18, 0.03, 0.36, 0.01, 0x8e9ba3); plate.position.set(0, 0.015, 0.06); g.add(plate);
  for (const x of [-L / 2 + 0.05, L / 2 - 0.05]) {
    const post = box(0.03, h0 - r + 0.02, 0.03, 0x8e9ba3); post.position.set(x, (h0 - r + 0.02) / 2, 0); g.add(post);
    const ring = mesh(new THREE.TorusGeometry(r + radius + 0.006, 0.008, 6, 24, Math.PI), mat(0x8e9ba3, { metalness: 0.4 })); ring.rotation.y = Math.PI / 2; ring.rotation.z = Math.PI; ring.position.set(x, h0, 0); g.add(ring);
  }
  const mouth = mesh(new THREE.CylinderGeometry(radius * 1.7, radius * 1.1, 0.05, 14, 1, true), mat(0xc87a4e, { metalness: 0.4, side: THREE.DoubleSide }));
  mouth.position.copy(P[P.length - 1]).add(new THREE.Vector3(0, 0.01, 0)); g.add(mouth);
  g.userData = { pipe, inlet: P[0].clone(), outlet: P[P.length - 1].clone(), r, L, h0, mouth };
  return g;
}

/* ------------------------------------------------------------------ compressor */
export function buildCompressor() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  body.add(at(rbox(0.5, 0.05, 0.42, 0.015, 0x3d4a52), 0, 0.025, 0));
  for (const [x, z] of [[-0.18, -0.14], [0.18, -0.14], [0, 0.15]]) body.add(at(cyl(0.035, 0.04, 0.05, 0x111111, 10), x, 0.07, z));
  const shell = cap(0.16, 0.28, 0x2b3a42, { metalness: 0.35, roughness: 0.45 }); shell.position.set(-0.03, 0.39, 0); body.add(shell);
  body.add(at(rbox(0.13, 0.08, 0.1, 0.02, 0x111111), -0.03, 0.57, 0.1));
  const acc = cap(0.055, 0.16, 0x2b3a42, { metalness: 0.35, roughness: 0.45 }); acc.position.set(0.17, 0.35, 0.02); body.add(acc);
  const lbl = canvasPlane(0.16, 0.08, 256, 128);
  const x = lbl.userData.ctx; x.fillStyle = '#f1c40f'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#111'; x.font = '900 54px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('220V', 128, 66); lbl.userData.tex.needsUpdate = true;
  lbl.position.set(-0.03, 0.36, 0.163); body.add(lbl);
  g.userData = { body, inlet: new THREE.Vector3(0.17, 0.55, 0.02), outlet: new THREE.Vector3(-0.03, 0.66, -0.02) };
  // pipe stubs
  body.add(at(cyl(0.022, 0.022, 0.08, 0xb87333, 8, { metalness: 0.5 }), 0.17, 0.53, 0.02));
  body.add(at(cyl(0.022, 0.022, 0.1, 0xb87333, 8, { metalness: 0.5 }), -0.03, 0.62, -0.02));
  return g;
}

/* ------------------------------------------------------------------ outdoor fan (propeller) */
export function buildPropeller(r = 0.3) {
  const g = new THREE.Group();
  const rotor = new THREE.Group(); g.add(rotor);
  const bm = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.5, flatShading: true, transparent: true, opacity: 1 });
  for (let i = 0; i < 3; i++) { const b = mesh(new THREE.SphereGeometry(r * 0.45, 10, 6), bm); b.scale.set(0.6, 1, 0.12); b.rotation.y = 0.4; b.position.y = r * 0.5; const p = new THREE.Group(); p.add(b); p.rotation.z = (i / 3) * Math.PI * 2; rotor.add(p); }
  const hub = cyl(0.06, 0.06, 0.06, 0x263238, 12); hub.rotation.x = Math.PI / 2; rotor.add(hub);
  const blurM = new THREE.MeshBasicMaterial({ color: 0x455a64, transparent: true, opacity: 0, depthWrite: false });
  const blur = mesh(new THREE.CircleGeometry(r * 0.98, 32), blurM, false, false); g.add(blur);
  // motor + bracket
  const mot = cyl(0.07, 0.07, 0.12, 0x263238, 12); mot.rotation.x = Math.PI / 2; mot.position.z = -0.09; g.add(mot);
  g.userData = { rotor, blurM, bm };
  return g;
}
export function spinProp(Pp, angle, speed01) { Pp.userData.rotor.rotation.z = angle; Pp.userData.blurM.opacity = 0.35 * speed01; Pp.userData.bm.opacity = 1 - 0.5 * speed01; }

/* ------------------------------------------------------------------ expansion valve */
export function buildValve() {
  const g = new THREE.Group();
  const brass = mat(0xd4a93c, { metalness: 0.55, roughness: 0.35 });
  const b1 = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 6), brass); b1.rotation.z = Math.PI / 2; b1.position.x = -0.08; g.add(b1);
  const b2 = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 6), brass); b2.rotation.z = Math.PI / 2; b2.position.x = 0.08; g.add(b2);
  // clear middle showing the narrow hole
  const glassM = new THREE.MeshStandardMaterial({ color: 0xe8f7ff, transparent: true, opacity: 0.3, roughness: 0.1, depthWrite: false });
  const mid = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 16, 1, true), glassM, false, false); mid.rotation.z = Math.PI / 2; g.add(mid);
  const plateM = mat(0xb8892a, { metalness: 0.6, roughness: 0.3 });
  const plate = mesh(new THREE.RingGeometry(0.008, 0.044, 20), plateM, false, false); plate.rotation.y = Math.PI / 2; g.add(plate);
  const plate2 = mesh(new THREE.RingGeometry(0.008, 0.044, 20), plateM, false, false); plate2.rotation.y = -Math.PI / 2; g.add(plate2);
  g.add(at(cyl(0.025, 0.03, 0.08, 0xd4a93c, 8, { metalness: 0.55 }), 0, 0.07, 0));
  return g;
}

/* ------------------------------------------------------------------ analogy props */
export function buildBikePump() {
  const g = new THREE.Group();
  g.add(at(rbox(0.3, 0.03, 0.12, 0.01, 0x222222), 0, 0.015, 0));
  const barrelM = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.5, emissive: 0xff3300, emissiveIntensity: 0, flatShading: true });
  const barrel = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 16), barrelM); barrel.position.y = 0.28; g.add(barrel);
  const rodP = new THREE.Group(); g.add(rodP);
  rodP.add(at(cyl(0.012, 0.012, 0.3, 0xbfbfbf, 8), 0, 0.6, 0));
  const hdl = cyl(0.025, 0.025, 0.3, 0x222222, 10); hdl.rotation.z = Math.PI / 2; hdl.position.y = 0.75; rodP.add(hdl);
  const hose = new Pipe({ points: [[0.045, 0.08, 0], [0.16, 0.06, 0.02], [0.24, 0.2, 0.04], [0.2, 0.34, 0.05]], radius: 0.012, corner: 0.06, color: 0x222222, metal: true, maxDots: 1 });
  hose.reveal(1); g.add(hose.group);
  const glowM = new THREE.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const glow = mesh(new THREE.SphereGeometry(0.12, 16, 12), glowM, false, false); glow.position.y = 0.12; glow.scale.set(1, 1.3, 1); g.add(glow);
  g.userData = { rodP, barrelM, glowM };
  return g;
}
export function updateBikePump(B, t, heat) {
  const u = B.userData;
  u.rodP.position.y = -0.2 * (0.5 + 0.5 * Math.sin(t * 9));
  u.barrelM.emissiveIntensity = 0.6 * heat;
  u.glowM.opacity = 0.35 * heat * (0.8 + 0.2 * Math.sin(t * 9));
}
export function buildPressureCooker() {
  const g = new THREE.Group();
  const al = mat(0xc9ced3, { metalness: 0.55, roughness: 0.35 });
  const pot = mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.26, 24), al); pot.position.y = 0.13; g.add(pot);
  const lid = mesh(new THREE.SphereGeometry(0.225, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), al); lid.scale.y = 0.3; lid.position.y = 0.26; g.add(lid);
  const hdl = rbox(0.32, 0.04, 0.06, 0.02, 0x222222); hdl.position.set(0.3, 0.28, 0); g.add(hdl);
  const hdl2 = rbox(0.12, 0.04, 0.06, 0.02, 0x222222); hdl2.position.set(-0.27, 0.22, 0); g.add(hdl2);
  const vP = new THREE.Group(); vP.position.y = 0.33; g.add(vP);
  vP.add(at(cyl(0.008, 0.008, 0.05, 0x888888, 6), 0, 0.02, 0));
  vP.add(at(cyl(0.03, 0.035, 0.04, 0x222222, 10), 0, 0.05, 0));
  const stM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, roughness: 1, depthWrite: false });
  const steam = [];
  for (let i = 0; i < 6; i++) { const s = mesh(new THREE.IcosahedronGeometry(0.035, 1), stM, false, false); g.add(s); steam.push(s); }
  g.userData = { vP, steam };
  return g;
}
export function updatePressureCooker(P, t) {
  const u = P.userData;
  u.vP.rotation.z = Math.sin(t * 30) * 0.25; u.vP.rotation.x = Math.cos(t * 23) * 0.2;
  u.steam.forEach((s, i) => { const c = (t * 1.6 + i / 6) % 1; s.position.set(Math.sin(i * 2 + t) * 0.04 * c, 0.4 + c * 0.35, 0); s.scale.setScalar(0.4 + c * 1.6); });
}
export function buildSpray() {
  const g = new THREE.Group();
  const can = cyl(0.07, 0.07, 0.32, 0x1f9bd1, 20); can.position.y = 0.16; g.add(can);
  const band = cyl(0.072, 0.072, 0.08, 0xffffff, 20); band.position.y = 0.2; g.add(band);
  const top = mesh(new THREE.SphereGeometry(0.07, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd9dee2, { metalness: 0.5 })); top.position.y = 0.32; top.scale.y = 0.5; g.add(top);
  g.add(at(rbox(0.05, 0.05, 0.05, 0.01, 0xffffff), 0, 0.37, 0));
  g.add(at(cyl(0.008, 0.008, 0.03, 0x333333, 6), 0, 0.37, 0.03)).rotation.x = Math.PI / 2;
  const mM = new THREE.MeshStandardMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.85, roughness: 1, depthWrite: false, emissive: 0x9fdcff, emissiveIntensity: 0.3 });
  const mist = [];
  for (let i = 0; i < 22; i++) { const m = mesh(new THREE.IcosahedronGeometry(0.02, 0), mM, false, false); g.add(m); mist.push(m); }
  // frost on can
  const frM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0, roughness: 1 });
  const fr = mesh(new THREE.CylinderGeometry(0.073, 0.073, 0.12, 20, 1, true), frM, false, false); fr.position.y = 0.06; g.add(fr);
  g.userData = { mist, frM };
  return g;
}
export function updateSpray(S, t, k) {
  const u = S.userData;
  u.mist.forEach((m, i) => { const c = (t * 2.2 + i / 22) % 1; const a = (hash(i) - 0.5) * 0.7, b = (hash(i * 3) - 0.5) * 0.5; m.position.set(Math.sin(a) * c * 0.5, 0.37 + b * c * 0.25, 0.05 + c * 0.55); m.scale.setScalar(0.5 + c * 2.2); m.visible = k > 0.1; });
  u.frM.opacity = 0.7 * k;
}
export function buildGlass() {
  const g = new THREE.Group();
  const glassM = new THREE.MeshStandardMaterial({ color: 0xe6f6ff, transparent: true, opacity: 0.32, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false });
  const gl = mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.3, 24, 1, true), glassM, false, false); gl.position.y = 0.15; gl.renderOrder = 4; g.add(gl);
  g.add(at(cyl(0.08, 0.08, 0.015, 0xe6f6ff, 24, { transparent: true, opacity: 0.5 }), 0, 0.008, 0));
  const soda = cyl(0.09, 0.077, 0.22, 0x6b2e0e, 24, { transparent: true, opacity: 0.88 }); soda.position.y = 0.12; g.add(soda);
  const iceM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, roughness: 0.1 });
  [[0.02, 0.23, 0.01], [-0.03, 0.22, -0.02], [0.0, 0.25, -0.03]].forEach((p, i) => { const c = mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), iceM); c.position.set(...p); c.rotation.set(i, i * 2, i * 0.5); g.add(c); });
  const lemon = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 16), mat(0xc6e33b)); lemon.position.set(0.07, 0.3, 0); lemon.rotation.z = 1.2; g.add(lemon);
  const dM = new THREE.MeshStandardMaterial({ color: 0xcff0ff, transparent: true, opacity: 0.85, roughness: 0.05 });
  const drops = [];
  for (let i = 0; i < 16; i++) { const d = mesh(new THREE.SphereGeometry(0.011, 8, 6), dM, false, false); g.add(d); drops.push(d); }
  g.userData = { drops };
  return g;
}
export function updateGlass(G, t, k) {
  G.userData.drops.forEach((d, i) => {
    const a = (i / 16) * Math.PI * 2 + 0.3; const c = (t * 0.35 + hash(i)) % 1;
    const y = 0.28 - c * 0.26; const r = 0.08 + (y / 0.3) * 0.02 + 0.006;
    d.position.set(Math.cos(a) * r, y, Math.sin(a) * r); d.scale.setScalar(Math.max(0.001, k * (0.7 + c * 0.6)));
  });
}
export function buildRemote() {
  const g = new THREE.Group();
  g.add(rbox(0.06, 0.02, 0.17, 0.008, 0xfafafa));
  const cols = [0xe63946, 0x2a9d8f, 0x2a9d8f, 0x457b9d, 0x457b9d, 0x457b9d];
  cols.forEach((c, i) => { const b = cyl(0.009, 0.009, 0.008, c, 8); b.position.set(i === 0 ? 0 : ((i - 1) % 2 - 0.5) * 0.025, 0.012, -0.05 + (i === 0 ? 0 : Math.floor((i + 1) / 2)) * 0.03); g.add(b); });
  const scr = box(0.04, 0.004, 0.035, 0x9ad0c2); scr.position.set(0, 0.012, 0.05); g.add(scr);
  return g;
}

/* ------------------------------------------------------------------ indoor unit cover & outdoor cabinet */
export function buildIndoorCover() {
  const g = new THREE.Group();
  const body = rbox(1.2, 0.4, 0.32, 0.07, 0xfbfbfb, { flatShading: false, roughness: 0.35 });
  g.add(body);
  const slot = rbox(1.02, 0.05, 0.05, 0.02, 0x2d3436); slot.position.set(0, -0.15, 0.145); g.add(slot);
  const louver = rbox(1.0, 0.025, 0.1, 0.01, 0xeeeeee); louver.position.set(0, -0.17, 0.17); louver.rotation.x = 0.5; g.add(louver);
  const line = box(1.1, 0.008, 0.01, 0xdddddd); line.position.set(0, 0.09, 0.161); g.add(line);
  const disp = canvasPlane(0.14, 0.06, 256, 110); disp.position.set(0.38, -0.03, 0.163); g.add(disp);
  g.userData = { disp };
  return g;
}
export function drawIndoorDisplay(disp, txt, on) {
  const x = disp.userData.ctx; x.clearRect(0, 0, 256, 110);
  x.fillStyle = on ? 'rgba(10,30,40,0.9)' : 'rgba(0,0,0,0)'; x.fillRect(0, 0, 256, 110);
  if (on) { x.fillStyle = '#5fe3ff'; x.font = '800 80px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 128, 60); }
  disp.userData.tex.needsUpdate = true;
}
export function buildOutdoorCabinet() {
  const g = new THREE.Group();
  const W = 1.35, H = 0.92, D = 0.6;
  const shell = new THREE.Group(); g.add(shell);
  const m = mat(0xeef1f3, { flatShading: false, roughness: 0.45 });
  // build as panels so the grille is see-through-ish
  shell.add(at(rbox(W, 0.05, D, 0.02, m), 0, H - 0.025, 0));
  shell.add(at(rbox(W, 0.05, D, 0.02, m), 0, 0.025, 0));
  shell.add(at(rbox(0.05, H, D, 0.02, m), -W / 2 + 0.025, H / 2, 0));
  shell.add(at(rbox(0.05, H, D, 0.02, m), W / 2 - 0.025, H / 2, 0));
  shell.add(at(rbox(W, H, 0.03, 0.01, m), 0, H / 2, -D / 2 + 0.015));
  // front panel with round grille (front at +z)
  const front = new THREE.Group(); front.position.z = D / 2 - 0.015; shell.add(front);
  const fr = 0.33, fcx = -0.18, fcy = H / 2;
  const shape = new THREE.Shape(); shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0); shape.lineTo(W / 2, H); shape.lineTo(-W / 2, H); shape.lineTo(-W / 2, 0);
  const hole = new THREE.Path(); hole.absarc(fcx, fcy, fr, 0, Math.PI * 2, true); shape.holes.push(hole);
  const fp = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false, curveSegments: 32 }), m); fp.position.z = -0.015; front.add(fp);
  const gm = mat(0x3c4a52, { metalness: 0.3 });
  for (let i = 1; i <= 4; i++) { const r = mesh(new THREE.TorusGeometry(fr * i / 4, 0.008, 4, 40), gm); r.position.set(fcx, fcy, 0.03); front.add(r); }
  for (let i = 0; i < 2; i++) { const b = box(fr * 2, 0.015, 0.012, 0x3c4a52); b.position.set(fcx, fcy, 0.03); b.rotation.z = i * Math.PI / 2; front.add(b); }
  // side grille lines (right part = compressor side)
  for (let i = 0; i < 6; i++) front.add(at(box(0.3, 0.012, 0.01, 0xc9d0d4), 0.42, 0.25 + i * 0.08, 0.025));
  const logo = box(0.16, 0.03, 0.01, 0x9aa5ab); logo.position.set(0.42, 0.78, 0.025); front.add(logo);
  g.userData = { shell, W, H, D, fanCenter: new THREE.Vector3(fcx, fcy, D / 2) };
  return g;
}

/* ------------------------------------------------------------------ thermostat sensor */
export function buildSensor() {
  const g = new THREE.Group();
  g.add(rbox(0.16, 0.12, 0.05, 0.015, 0xfafafa));
  const scr = canvasPlane(0.12, 0.07, 240, 140); scr.position.z = 0.027; g.add(scr);
  const led = sph(0.008, 0x2ecc71); led.position.set(0.065, 0.045, 0.026); g.add(led);
  g.userData = { scr, led };
  return g;
}
export function drawSensor(S, txt, color = '#7CFFB2') {
  const x = S.userData.scr.userData.ctx; x.fillStyle = '#0e2a33'; x.fillRect(0, 0, 240, 140);
  x.fillStyle = color; x.font = '800 92px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 120, 76);
  S.userData.scr.userData.tex.needsUpdate = true;
}

/* gauge (inverter speed) */
export function buildGauge() {
  const p = canvasPlane(0.42, 0.3, 420, 300);
  return p;
}
export function drawGauge(G, v, label) {
  const x = G.userData.ctx, w = 420, h = 300; x.clearRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,255,255,0.96)'; x.beginPath(); x.roundRect(6, 6, w - 12, h - 12, 34); x.fill();
  x.lineWidth = 10; x.strokeStyle = '#1e1e1e'; x.stroke();
  const cx = w / 2, cy = 215, r = 140;
  const segs = [['#2ecc71', 0, 0.4], ['#f1c40f', 0.4, 0.7], ['#e74c3c', 0.7, 1]];
  for (const [c, a, b] of segs) { x.strokeStyle = c; x.lineWidth = 30; x.beginPath(); x.arc(cx, cy, r - 18, Math.PI + a * Math.PI, Math.PI + b * Math.PI); x.stroke(); }
  const ang = Math.PI + v * Math.PI;
  x.strokeStyle = '#1e1e1e'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ang) * (r - 30), cy + Math.sin(ang) * (r - 30)); x.stroke();
  x.fillStyle = '#1e1e1e'; x.beginPath(); x.arc(cx, cy, 16, 0, 7); x.fill();
  x.font = '900 38px Montserrat'; x.textAlign = 'center'; x.fillText(label, cx, 280);
  G.userData.tex.needsUpdate = true;
}
