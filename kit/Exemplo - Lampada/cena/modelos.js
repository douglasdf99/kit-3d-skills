import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mat, basic, mesh, box, rbox, cyl, sph, at, group, canvasPlane, hash, clamp, lerp } from '../../sistema/motor/lib.js';

export function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

/* ------------------------------------------------------------------ dim room: walls, floor, window (night), desk, chair, pendant cord */
export const R = { x0: -3, x1: 3, z0: -2.5, z1: 3.6, h: 2.8 };
export function buildRoom() {
  const g = new THREE.Group();
  const wallM = new THREE.MeshStandardMaterial({ color: 0x5a6b85, roughness: 0.95, side: THREE.DoubleSide });
  const floorTex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#6b4a35'; x.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) { const off = (r % 2) * 128; for (let k = -1; k < 3; k++) { const v = 0.9 + 0.15 * hash(r * 7 + k); x.fillStyle = `rgb(${Math.round(120 * v)},${Math.round(82 * v)},${Math.round(56 * v)})`; x.fillRect(off + k * 256 + 2, r * 64 + 2, 252, 60); } } }, [3, 3]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(R.x1 - R.x0, R.z1 - R.z0), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 0); floor.receiveShadow = true; g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(R.x1 - R.x0, R.z1 - R.z0), new THREE.MeshStandardMaterial({ color: 0xcfd6e0, roughness: 0.95, side: THREE.DoubleSide }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, R.h, 0); g.add(ceil);
  // walls (planes facing inward)
  const W = (w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallM); m.receiveShadow = true; return m; };
  const back = W(R.x1 - R.x0, R.h); back.position.set(0, R.h / 2, R.z0); g.add(back);
  const front = W(R.x1 - R.x0, R.h); front.position.set(0, R.h / 2, R.z1); front.rotation.y = Math.PI; g.add(front);
  const left = W(R.z1 - R.z0, R.h); left.position.set(R.x0, R.h / 2, 0); left.rotation.y = Math.PI / 2; g.add(left);
  const right = W(R.z1 - R.z0, R.h); right.position.set(R.x1, R.h / 2, 0); right.rotation.y = -Math.PI / 2; g.add(right);
  // baseboard
  g.add(at(box(R.x1 - R.x0, 0.1, 0.03, 0x3e4a5e), 0, 0.05, R.z0 + 0.015));
  g.add(at(box(0.03, 0.1, R.z1 - R.z0, 0x3e4a5e), R.x0 + 0.015, 0.05, 0));
  // window on the back wall (night sky + moon)
  const win = new THREE.Group(); win.position.set(-1.4, 1.65, R.z0 + 0.02);
  const nightTex = canvasTex(256, 256, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1a3a'); gr.addColorStop(1, '#1b3566'); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(hash(i) * w, hash(i * 3) * h * 0.7, 1 + hash(i * 5), 0, 7); x.fill(); } x.fillStyle = '#f4f1dc'; x.beginPath(); x.arc(190, 60, 22, 0, 7); x.fill(); x.fillStyle = '#1b3566'; x.beginPath(); x.arc(200, 52, 18, 0, 7); x.fill(); x.fillStyle = '#2a3b2a'; x.fillRect(0, h * 0.78, w, h * 0.22); });
  win.add(mesh(new THREE.PlaneGeometry(1.2, 1.0), new THREE.MeshBasicMaterial({ map: nightTex }), false, false));
  win.add(at(box(1.3, 0.06, 0.06, 0xf0ece4), 0, 0.5, 0.02)); win.add(at(box(1.3, 0.06, 0.06, 0xf0ece4), 0, -0.5, 0.02));
  win.add(at(box(0.06, 1.0, 0.06, 0xf0ece4), -0.6, 0, 0.02)); win.add(at(box(0.06, 1.0, 0.06, 0xf0ece4), 0.6, 0, 0.02)); win.add(at(box(0.04, 1.0, 0.04, 0xf0ece4), 0, 0, 0.02));
  g.add(win);
  // desk
  const woodM = mat(0x8a5a3a, { flatShading: false, roughness: 0.6 });
  const desk = new THREE.Group(); desk.position.set(0, 0, -0.9);
  desk.add(at(rbox(2.0, 0.06, 0.9, 0.01, woodM), 0, 0.75, 0));
  for (const [x, z] of [[-0.92, -0.38], [0.92, -0.38], [-0.92, 0.38], [0.92, 0.38]]) desk.add(at(box(0.07, 0.72, 0.07, 0x5e3b24), x, 0.36, z));
  g.add(desk);
  // chair (behind the desk)
  const chair = new THREE.Group(); chair.position.set(-0.6, 0, -1.7);
  chair.add(at(rbox(0.5, 0.06, 0.5, 0.01, 0x3b3f45), 0, 0.46, 0)); chair.add(at(rbox(0.5, 0.5, 0.06, 0.01, 0x3b3f45), 0, 0.74, -0.22));
  for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) chair.add(at(cyl(0.02, 0.02, 0.44, 0x2a2d31, 8), x, 0.22, z));
  g.add(chair);
  // shelf with a few objects on the right wall
  g.add(at(box(0.9, 0.04, 0.25, woodM), R.x1 - 0.13, 1.6, -1.2));
  g.add(at(rbox(0.12, 0.3, 0.2, 0.01, 0xc0392b), R.x1 - 0.2, 1.77, -1.35)); g.add(at(rbox(0.1, 0.26, 0.2, 0.01, 0x2980b9), R.x1 - 0.07, 1.75, -1.35)); g.add(at(rbox(0.14, 0.22, 0.2, 0.01, 0x27ae60), R.x1 - 0.2, 1.73, -1.08));
  // pendant cord + socket hanging above the desk
  const cord = cyl(0.008, 0.008, 1.0, 0x222222, 6); cord.position.set(0, R.h - 0.5, -1.15); g.add(cord);
  const socket = new THREE.Group(); socket.position.set(0, R.h - 1.05, -1.15);
  socket.add(cyl(0.04, 0.045, 0.08, 0x1d1f23, 16)); socket.add(at(cyl(0.05, 0.05, 0.02, 0x2b2e33, 16), 0, -0.05, 0));
  g.add(socket);
  return { group: g, desk, socket, cord, deskTop: 0.78, deskZ: -0.9 };
}

/* ------------------------------------------------------------------ 9 V battery */
export function buildBattery() {
  const g = new THREE.Group();
  g.add(at(rbox(0.026, 0.048, 0.017, 0.003, 0x1f2a44, { roughness: 0.5 }), 0, 0.024, 0));
  g.add(at(box(0.0272, 0.012, 0.0182, 0xd4b03a), 0, 0.03, 0));
  g.add(at(cyl(0.004, 0.004, 0.005, 0xcfd4d9, 10, { metalness: 0.7 }), -0.006, 0.0505, 0));
  g.add(at(cyl(0.0045, 0.0045, 0.005, 0xcfd4d9, 10, { metalness: 0.7 }), 0.006, 0.0505, 0));
  g.scale.setScalar(4);  // big enough to read on screen (the whole scene is "macro" around the desk)
  return g;
}

/* ------------------------------------------------------------------ steel wool: a tangle of thin fibers (instanced short tubes) */
export function buildSteelWool(n = 220) {
  const geo = new THREE.CylinderGeometry(0.004, 0.004, 0.16, 5, 1);
  const m = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.6, roughness: 0.5, emissive: 0xff6a00, emissiveIntensity: 0 });
  const im = new THREE.InstancedMesh(geo, m, n); im.castShadow = true;
  const tmp = new THREE.Object3D(); const seeds = [];
  for (let i = 0; i < n; i++) {
    const a = hash(i * 1.7) * Math.PI * 2, b = hash(i * 2.3) * Math.PI, r = 0.11 * Math.cbrt(hash(i * 3.1));
    tmp.position.set(r * Math.sin(b) * Math.cos(a), 0.1 + r * Math.cos(b) * 0.8, r * Math.sin(b) * Math.sin(a));
    tmp.rotation.set(hash(i * 5.1) * 6, hash(i * 7.1) * 6, hash(i * 9.1) * 6); tmp.updateMatrix(); im.setMatrixAt(i, tmp.matrix);
    im.setColorAt(i, new THREE.Color(0x9aa0a6)); seeds.push(tmp.position.clone());
  }
  im.userData = { seeds, m };
  return im;
}
/** glow 0..1 spreads from the contact point; burnt 0..1 turns fibers black */
export function updateSteelWool(im, glow, burnt, contact = new THREE.Vector3(-0.08, 0.1, 0.05)) {
  const c = new THREE.Color(), base = new THREE.Color(0x9aa0a6), hot = new THREE.Color(0xff7a1a), bright = new THREE.Color(0xfff2b0), black = new THREE.Color(0x9c9890);
  im.userData.seeds.forEach((p, i) => {
    const d = p.distanceTo(contact) / 0.26; const k = clamp((glow - d) * 3);
    c.copy(base).lerp(hot, k); if (k > 0.6) c.lerp(bright, (k - 0.6) * 1.5);
    c.lerp(black, burnt * clamp(1.2 - d));
    im.setColorAt(i, c);
  });
  im.instanceColor.needsUpdate = true;
  im.userData.m.emissiveIntensity = 1.2 * glow * (1 - burnt);
  im.scale.set(1 - 0.15 * burnt, 1 - 0.45 * burnt, 1 - 0.15 * burnt);
}

/* ------------------------------------------------------------------ stove coil (boca do fogão) */
export function buildStoveCoil() {
  const g = new THREE.Group();
  const pts = []; for (let i = 0; i <= 200; i++) { const t = i / 200; const r = 0.03 + 0.11 * t; const a = t * Math.PI * 2 * 3.2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const m = new THREE.MeshStandardMaterial({ color: 0x3a3d42, emissive: 0xff5a00, emissiveIntensity: 0, roughness: 0.6 });
  const coil = mesh(new THREE.TubeGeometry(curve, 240, 0.012, 8, false), m); coil.position.y = 0.012; g.add(coil);
  g.add(at(cyl(0.17, 0.17, 0.01, 0x24272b, 32), 0, 0.0, 0));
  g.userData = { m };
  return g;
}

/* ------------------------------------------------------------------ glass bulb (pear) + inner blackening shell + base cap */
export function bulbProfile(scale = 1) {
  // y up: from the neck (bottom) to the top; radius in x
  const P = [[0.06, 0.0], [0.06, 0.08], [0.07, 0.14], [0.1, 0.2], [0.14, 0.27], [0.165, 0.36], [0.17, 0.45], [0.16, 0.54], [0.13, 0.61], [0.08, 0.655], [0.0, 0.665]];
  return P.map(([x, y]) => new THREE.Vector2(x * scale, y * scale));
}
/** glass that reads as glass: transparent in the middle, denser at grazing angles (fresnel) + a specular streak */
export function glassMat({ color = 0xd8ecf7, base = 0.07, rim = 0.6, side = THREE.FrontSide, hl = 0.7 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uBase: { value: base }, uRim: { value: rim }, uK: { value: 1 }, uHL: { value: hl }, uS: { value: 1 }, uWarm: { value: 0 }, uWarmC: { value: new THREE.Color(0xffc070) } },
    vertexShader: `varying vec3 vN; varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uColor; uniform vec3 uWarmC; uniform float uBase, uRim, uK, uHL, uWarm, uS; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        vec3 v = normalize(cameraPosition - vW);
        float f = 1.0 - abs(dot(n, v)); float fr = pow(f, 2.5);
        vec3 L = normalize(vec3(-0.45, 0.75, 0.5)); vec3 H = normalize(L + v);
        float sp = pow(max(dot(n, H), 0.0), 70.0) * uHL * uS;
        vec3 L2 = normalize(vec3(0.6, 0.3, 0.7)); float sp2 = pow(max(dot(n, normalize(L2 + v)), 0.0), 140.0) * uHL * 0.6 * uS;
        float a = (uBase + uRim * fr) * uK + sp + sp2 + uWarm * (0.12 + 0.5 * fr);
        vec3 c = uColor * (0.6 + 0.7 * fr) + vec3(sp + sp2) + uWarmC * uWarm * (0.6 + fr);
        gl_FragColor = vec4(c, clamp(a, 0.0, 0.95));
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side,
  });
}
export function buildBulb(scale = 1) {
  const g = new THREE.Group();
  const prof = bulbProfile(scale);
  const SPLIT = 7;                                                     // profile index where the top cap starts (y 0.54)
  const shell = new THREE.Group(); g.add(shell);                      // glass parts (can slide down over the base)
  const top = new THREE.Group(); top.position.y = prof[SPLIT].y; shell.add(top);
  const backM = glassMat({ side: THREE.BackSide, base: 0.12, rim: 0.38, hl: 0.12 });
  const frontM = glassMat({ side: THREE.FrontSide, base: 0.06, rim: 0.62, hl: 0.8 });
  const lower = prof.slice(0, SPLIT + 1), upper = prof.slice(SPLIT).map((v) => new THREE.Vector2(v.x, v.y - prof[SPLIT].y));
  const full = new THREE.LatheGeometry(prof, 48), fn = full.attributes.normal, NP = prof.length;
  for (const [pts, parent, off] of [[lower, shell, 0], [upper, top, SPLIT]]) {
    const geo = new THREE.LatheGeometry(pts, 48), nn = geo.attributes.normal;   // seam-free: normals from the full lathe
    for (let i = 0; i <= 48; i++) for (let j = 0; j < pts.length; j++) { const a = i * pts.length + j, b = i * NP + off + j; nn.setXYZ(a, fn.getX(b), fn.getY(b), fn.getZ(b)); }
    const b = mesh(geo, backM, false, false); b.renderOrder = 5; parent.add(b);
    const f = mesh(geo, frontM, false, false); f.renderOrder = 6; parent.add(f);
  }
  const soot = new THREE.MeshStandardMaterial({ color: 0x151515, transparent: true, opacity: 0, roughness: 0.9, side: THREE.BackSide, depthWrite: false });
  const sootMesh = mesh(new THREE.LatheGeometry(bulbProfile(scale * 0.985).map((v) => new THREE.Vector2(v.x, v.y + 0.004 * scale)), 40), soot, false, false); sootMesh.renderOrder = 4; shell.add(sootMesh);
  // milky diffuser version (LED bulb)
  const milkM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0, roughness: 0.6, emissive: 0xfff2c8, emissiveIntensity: 0, side: THREE.DoubleSide, depthWrite: false });
  const milk = mesh(new THREE.LatheGeometry(bulbProfile(scale * 1.012).map((v) => new THREE.Vector2(v.x, v.y + 0.006 * scale)), 48), milkM, false, false); milk.renderOrder = 7; shell.add(milk);
  // glass stem + support wires (the two posts the filament hangs on)
  const base = new THREE.Group(); g.add(base);
  const stem = cyl(0.012 * scale, 0.016 * scale, 0.22 * scale, 0xcfe8f5, 10, { transparent: true, opacity: 0.6 }); stem.position.y = 0.11 * scale; base.add(stem);
  const wireM = mat(0x8a8f94, { metalness: 0.7, roughness: 0.3 });
  const leads = [];
  for (const sx of [-1, 1]) { const w = cyl(0.004 * scale, 0.004 * scale, 0.22 * scale, wireM, 6); w.position.set(sx * 0.05 * scale, 0.32 * scale, 0); base.add(w); leads.push(w); }
  g.userData = { glassMs: [backM, frontM], soot, milkM, milk, leads, scale, stem, shell, top, base };
  return g;
}

/* ------------------------------------------------------------------ soft light textures */
export function glowTexture() {
  return canvasTex(256, 256, (x, w, h) => {
    const gr = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    const st = [[0, 1], [0.05, 0.85], [0.12, 0.55], [0.22, 0.3], [0.35, 0.14], [0.5, 0.06], [0.7, 0.018], [1, 0]];
    for (const [k, a] of st) gr.addColorStop(k, `rgba(255,255,255,${a})`);
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
  });
}
export function flameTexture() {
  return canvasTex(128, 256, (x, w, h) => {
    x.filter = 'blur(7px)';
    const gr = x.createRadialGradient(64, 196, 4, 64, 170, 120);
    gr.addColorStop(0, 'rgba(255,255,235,1)'); gr.addColorStop(0.25, 'rgba(255,225,140,0.95)'); gr.addColorStop(0.55, 'rgba(255,150,50,0.7)'); gr.addColorStop(0.85, 'rgba(230,70,20,0.25)'); gr.addColorStop(1, 'rgba(200,40,10,0)');
    x.fillStyle = gr; x.beginPath(); x.moveTo(64, 18); x.bezierCurveTo(98, 100, 112, 170, 64, 238); x.bezierCurveTo(16, 170, 30, 100, 64, 18); x.fill();
  });
}
export function beamTexture() {   // vertical fade for light beams: bright at the source (bottom), gone at the far end (top)
  return canvasTex(8, 256, (x, w, h) => {
    const gr = x.createLinearGradient(0, h, 0, 0);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
  });
}

/* ------------------------------------------------------------------ filament: straight → coil → coiled coil (TubeGeometry rebuilt on demand) */
export function filamentCurve(k1, k2, len = 0.1, R1 = 0.018, R2 = 0.006, turns1 = 9, turns2 = 60) {
  // k1: 0 straight … 1 primary coil; k2: 0 … 1 secondary (coiled coil); the filament spans x from -len/2 to len/2
  const pts = [];
  const N = 600;
  for (let i = 0; i <= N; i++) {
    const t = i / N; const x = -len / 2 + t * len;
    const a1 = t * turns1 * Math.PI * 2, a2 = t * turns2 * Math.PI * 2;
    const r1 = R1 * k1, r2 = R2 * k2;
    // primary helix around the x axis
    let y = r1 * Math.cos(a1), z = r1 * Math.sin(a1);
    // secondary helix around the primary path (approximate normal = radial direction)
    const ny = Math.cos(a1), nz = Math.sin(a1);
    y += r2 * (ny * Math.cos(a2)); z += r2 * (nz * Math.cos(a2));
    const px = r2 * Math.sin(a2);
    pts.push(new THREE.Vector3(x + px, y, z));
  }
  return new THREE.CatmullRomCurve3(pts);
}
export function buildFilament() {
  const m = new THREE.MeshStandardMaterial({ color: 0xe0782a, emissive: 0xff8c1a, emissiveIntensity: 0, roughness: 0.4, metalness: 0.35 });
  const fil = mesh(new THREE.TubeGeometry(filamentCurve(0, 0), 300, 0.0035, 6, false), m, false, false);
  const glowM = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd9a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const glow = new THREE.Sprite(glowM); glow.scale.set(0.3, 0.3, 1);
  const g = group(fil, glow);
  g.userData = { fil, m, glowM, glow, k: [-1, -1, -1] };
  return g;
}
export function setFilament(F, k1, k2, radius = 0.0035, gap = 0) {
  const u = F.userData; const key = [+k1.toFixed(3), +k2.toFixed(3), +radius.toFixed(5), +gap.toFixed(3)];
  if (key.every((v, i) => v === u.k[i])) return;
  u.k = key; u.fil.geometry.dispose();
  if (gap > 0) {
    // broken: two halves pulled apart
    const c = filamentCurve(k1, k2); const pts = c.getPoints(600);
    const a = new THREE.CatmullRomCurve3(pts.slice(0, 270).map((p) => p.clone().add(new THREE.Vector3(-gap, 0, 0)))), b = new THREE.CatmullRomCurve3(pts.slice(330).map((p) => p.clone().add(new THREE.Vector3(gap, 0, 0))));
    const ga = new THREE.TubeGeometry(a, 140, radius, 6, false), gb = new THREE.TubeGeometry(b, 140, radius, 6, false);
    // merge
    const n = ga.attributes.position.count + gb.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); pos.set(ga.attributes.position.array); pos.set(gb.attributes.position.array, ga.attributes.position.count * 3); nor.set(ga.attributes.normal.array); nor.set(gb.attributes.normal.array, ga.attributes.normal.count * 3);
    const idx = Array.from(ga.index.array).concat(Array.from(gb.index.array).map((v) => v + ga.attributes.position.count));
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setIndex(idx);
    u.fil.geometry = geo;
  } else {
    u.fil.geometry = new THREE.TubeGeometry(filamentCurve(k1, k2), 300 + Math.round(600 * k2), radius, 6, false);
  }
}

/* ------------------------------------------------------------------ vacuum pump */
export function buildPump() {
  const g = new THREE.Group();
  g.add(at(rbox(0.22, 0.16, 0.16, 0.02, 0x3b6ea5, { flatShading: false }), 0, 0.08, 0));
  g.add(at(cyl(0.06, 0.06, 0.12, 0x2d3e50, 16), 0, 0.2, 0));
  const pist = new THREE.Group(); pist.position.set(0, 0.3, 0); g.add(pist);
  pist.add(at(cyl(0.013, 0.013, 0.2, 0x9aa3a9, 10, { metalness: 0.6 }), 0, 0.0, 0));
  pist.add(at(rbox(0.16, 0.025, 0.035, 0.01, 0xe74c3c), 0, 0.1, 0));
  for (const sx of [-1, 1]) pist.add(at(cyl(0.016, 0.016, 0.05, 0x2b2b2b, 10), sx * 0.08, 0.1, 0));
  pist.children[2].rotation.z = pist.children[3].rotation.z = Math.PI / 2;
  const hoseM = new THREE.MeshStandardMaterial({ color: 0xcfe3ee, roughness: 0.2, transparent: true, opacity: 0.38, depthWrite: false });   // clear tubing: you see the air going through
  g.userData = { pist, hoseM };
  return g;
}

/* ------------------------------------------------------------------ metal blocks that melt */
export function buildMetalBlock(label, color, w = 0.12) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.6, emissive: 0xff4a00, emissiveIntensity: 0 });
  const cube = mesh(new THREE.BoxGeometry(w, w, w), m); cube.position.y = w / 2; g.add(cube);
  const pool = mesh(new THREE.CylinderGeometry(w * 0.9, w * 0.9, 0.012, 24), m.clone()); pool.position.y = 0.006; pool.scale.setScalar(0.001); g.add(pool);
  const tag = canvasPlane(0.24, 0.06, 400, 100); tag.position.set(0, w + 0.07, 0);
  const x = tag.userData.ctx; x.fillStyle = 'rgba(255,255,255,0.95)'; x.beginPath(); x.roundRect(0, 0, 400, 100, 34); x.fill(); x.fillStyle = '#1e1e1e'; x.font = '800 36px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, 200, 52); tag.userData.tex.needsUpdate = true;
  g.add(tag);
  g.userData = { cube, pool, m, tag, w };
  return g;
}
export function meltBlock(B, k) { // k 0 solid … 1 puddle
  const u = B.userData; const s = 1 - 0.95 * k;
  u.cube.scale.set(1 + 0.6 * k, Math.max(0.02, s), 1 + 0.6 * k); u.cube.position.y = u.w / 2 * Math.max(0.02, s);
  u.pool.scale.set(Math.max(0.001, k * 1.6), 1, Math.max(0.001, k * 1.6));
  u.m.emissiveIntensity = 0.6 * k; u.pool.material.emissiveIntensity = 0.6 * k;
}

/* ------------------------------------------------------------------ thermometer gauge (canvas) */
export function buildThermo() {
  const p = canvasPlane(0.2, 0.4, 180, 360);
  p.userData.draw = (T, max = 3600) => {
    const x = p.userData.ctx; x.clearRect(0, 0, 180, 360);
    x.fillStyle = 'rgba(255,255,255,0.95)'; x.beginPath(); x.roundRect(10, 10, 160, 340, 28); x.fill();
    x.fillStyle = '#e5e7eb'; x.beginPath(); x.roundRect(70, 40, 40, 250, 20); x.fill();
    const h = 250 * clamp(T / max); const gr = x.createLinearGradient(0, 290, 0, 40); gr.addColorStop(0, '#f59e0b'); gr.addColorStop(1, '#ef4444');
    x.fillStyle = gr; x.beginPath(); x.roundRect(70, 290 - h, 40, h, 20); x.fill();
    x.fillStyle = '#ef4444'; x.beginPath(); x.arc(90, 300, 32, 0, 7); x.fill();
    x.fillStyle = '#1e1e1e'; x.font = '800 30px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(Math.round(T) + ' °C', 90, 328 + 0);
    p.userData.tex.needsUpdate = true;
  };
  return p;
}

/* ------------------------------------------------------------------ LED: base, chip, phosphor dome */
export function buildLED(scale = 1) {
  const g = new THREE.Group();
  g.add(at(rbox(0.09, 0.012, 0.09, 0.004, 0xd8dde3, { metalness: 0.3 }), 0, 0.006, 0));
  const chipM = new THREE.MeshStandardMaterial({ color: 0x1b2b5a, emissive: 0x2f7dff, emissiveIntensity: 0, roughness: 0.3 });
  const chip = mesh(new THREE.BoxGeometry(0.03, 0.006, 0.03), chipM); chip.position.y = 0.015; g.add(chip);
  const domeM = new THREE.MeshStandardMaterial({ color: 0xf2c200, transparent: true, opacity: 0.85, roughness: 0.4, emissive: 0xffd34a, emissiveIntensity: 0 });
  const dome = mesh(new THREE.SphereGeometry(0.03, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), domeM, false, false); dome.position.y = 0.012; dome.scale.set(1.3, 0.9, 1.3); dome.visible = false; g.add(dome);
  for (const sx of [-1, 1]) g.add(at(cyl(0.003, 0.003, 0.06, 0x8a8f94, 6, { metalness: 0.7 }), sx * 0.03, -0.025, 0));
  g.scale.setScalar(scale);
  g.userData = { chip, chipM, dome, domeM };
  return g;
}

/* ------------------------------------------------------------------ screw base (E27) with bottom pin */
export function buildScrewBase(scale = 1) {
  const g = new THREE.Group();
  const brass = mat(0xc9a43a, { metalness: 0.8, roughness: 0.35, flatShading: false });
  g.add(at(cyl(0.057, 0.057, 0.12, brass, 32), 0, -0.06, 0));
  for (let i = 0; i < 5; i++) { const r = mesh(new THREE.TorusGeometry(0.058, 0.007, 8, 32), brass); r.rotation.x = Math.PI / 2; r.position.y = -0.015 - i * 0.022; g.add(r); }
  g.add(at(cyl(0.05, 0.057, 0.03, brass, 32), 0, -0.135, 0));
  g.add(at(cyl(0.03, 0.045, 0.02, 0x1d1f23, 24), 0, -0.155, 0));           // insulator
  const pin = mesh(new THREE.SphereGeometry(0.014, 12, 10), mat(0xb0b0b0, { metalness: 0.8 })); pin.position.y = -0.165; g.add(pin);
  g.scale.setScalar(scale);
  g.userData = { pin };
  return g;
}

/* ------------------------------------------------------------------ wall switch */
export function buildSwitch() {
  const g = new THREE.Group();
  g.add(rbox(0.12, 0.12, 0.02, 0.01, 0xf1f1ec));
  const lever = rbox(0.05, 0.07, 0.02, 0.008, 0xe5e5df); lever.position.set(0, 0, 0.015); g.add(lever);
  g.userData = { lever };
  return g;
}

// a real LED bulb — a round aluminium board at the top of a white plastic body (the bottom of the bulb),
// one big 'hero' chip in the middle (blue die → yellow drop) and a ring of smaller SMD chips that come later.
// Group origin = the board's top surface; the body hangs below it down to the neck (y = -BODY_H).
export const LED_BOARD_Y = 0.185;
export function buildLEDModule() {
  const g = new THREE.Group();
  const H = LED_BOARD_Y;
  const bodyPts = [[0.0, 0.0], [0.06, 0.0], [0.06, 0.08], [0.07, 0.14], [0.0925, H]].map(([x, y]) => new THREE.Vector2(x * 1.03, y - H - 0.002));
  const bodyM = new THREE.MeshStandardMaterial({ color: 0xf0efea, roughness: 0.55, metalness: 0.0, side: THREE.DoubleSide });
  const body = mesh(new THREE.LatheGeometry(bodyPts, 48), bodyM, false, false); g.add(body);
  for (let i = 0; i < 3; i++) { const r = mesh(new THREE.TorusGeometry(0.0645 + i * 0.0085, 0.0016, 6, 40), mat(0xdcdbd5, { flatShading: false }), false, false); r.rotation.x = Math.PI / 2; r.position.y = -0.07 + i * 0.03; g.add(r); }  // cooling ribs
  const boardM = new THREE.MeshStandardMaterial({ color: 0xd9dde2, metalness: 0.55, roughness: 0.35 });
  const board = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.008, 48), boardM, false, false); board.position.y = -0.004; g.add(board);
  const pkgM = new THREE.MeshStandardMaterial({ color: 0xf6f5f0, roughness: 0.4 });
  const pkg = mesh(new THREE.BoxGeometry(0.042, 0.007, 0.042), pkgM, false, false); pkg.position.y = 0.0035; g.add(pkg);
  const chipM = new THREE.MeshStandardMaterial({ color: 0x1b2b5a, emissive: 0x2f7dff, emissiveIntensity: 0, roughness: 0.3 });
  const chip = mesh(new THREE.BoxGeometry(0.02, 0.004, 0.02), chipM, false, false); chip.position.y = 0.009; g.add(chip);
  const domeM = new THREE.MeshStandardMaterial({ color: 0xf2c200, transparent: true, opacity: 0.88, roughness: 0.4, emissive: 0xffd34a, emissiveIntensity: 0 });
  const dome = mesh(new THREE.SphereGeometry(0.017, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeM, false, false); dome.position.y = 0.007; dome.visible = false; g.add(dome);
  // ring of smaller SMD chips (white package with a yellow window) — pop in one by one
  const smdM = new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0xffe9a8, emissiveIntensity: 0, roughness: 0.4 });
  const ring = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3, s = new THREE.Group(); s.position.set(Math.cos(a) * 0.06, 0, Math.sin(a) * 0.06); s.rotation.y = -a;
    s.add(at(mesh(new THREE.BoxGeometry(0.024, 0.006, 0.02), pkgM, false, false), 0, 0.003, 0));
    s.add(at(mesh(new THREE.BoxGeometry(0.017, 0.0025, 0.013), smdM, false, false), 0, 0.0068, 0));
    s.visible = false; g.add(s); ring.push(s);
  }
  // two solder pads + traces so the board reads as a circuit board
  const traceM = mat(0xc9a43a, { metalness: 0.7, roughness: 0.35, flatShading: false });
  for (const sx of [-1, 1]) g.add(at(mesh(new THREE.BoxGeometry(0.012, 0.0012, 0.03), traceM, false, false), sx * 0.032, 0.0006, 0));
  g.userData = { chip, chipM, dome, domeM, ring, smdM, body, board };
  return g;
}
// the LED driver — a small circuit board that goes inside the screw base
export function buildDriver() {
  const g = new THREE.Group();
  g.add(at(box(0.07, 0.11, 0.007, mat(0x1f7a3a, { roughness: 0.6 })), 0, 0, 0));
  g.add(at(cyl(0.012, 0.012, 0.034, mat(0x23262b, { flatShading: false }), 16), -0.016, 0.02, 0.014));          // capacitor
  g.add(at(cyl(0.0125, 0.0125, 0.002, mat(0x9aa3ad, { flatShading: false }), 16), -0.016, 0.038, 0.014));
  const coil = mesh(new THREE.TorusGeometry(0.011, 0.005, 8, 18), mat(0xb87333, { metalness: 0.6, roughness: 0.4, flatShading: false })); coil.position.set(0.018, 0.02, 0.008); g.add(coil);
  g.add(at(box(0.022, 0.016, 0.005, 0x15171a), 0.012, -0.025, 0.006));                                               // IC
  for (let i = 0; i < 3; i++) g.add(at(box(0.006, 0.014, 0.005, [0x3a6ea5, 0xc9a43a, 0xb02a2a][i]), -0.022 + i * 0.01, -0.03, 0.006));
  g.add(at(cyl(0.0015, 0.0015, 0.05, 0xd23a2a, 6), -0.01, 0.075, 0)); g.add(at(cyl(0.0015, 0.0015, 0.05, 0x222222, 6), 0.01, 0.075, 0));  // wires up to the LED board
  return g;
}
