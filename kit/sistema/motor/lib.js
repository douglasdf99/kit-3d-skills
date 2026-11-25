import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const ease = {
  lin: (t) => t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOut2: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  back: (t) => { const c1 = 2.0, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  bounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};
/** 0→1 progress of a tween starting at t0 lasting dur */
export function prog(t, t0, dur, fn = ease.inOut) {
  if (dur <= 0) return t >= t0 ? 1 : 0;
  return fn(clamp((t - t0) / dur));
}
/** window: rises at t0 (d1) and falls at t1 (d2) */
export function win(t, t0, t1, d1 = 0.3, d2 = 0.3) {
  return Math.max(0, Math.min(prog(t, t0, d1, ease.out), 1 - prog(t, t1, d2, ease.in)));
}
/** pop scale: 0 → overshoot → 1 at t0; shrinks to 0 at t1 (if given) */
export function pop(t, t0, t1 = Infinity, d = 0.4) {
  if (t < t0) return 0;
  let s = ease.back(clamp((t - t0) / d));
  if (t > t1) s *= 1 - ease.in(clamp((t - t1) / 0.25));
  return Math.max(0, s);
}
export function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
export const fract = (x) => x - Math.floor(x);

const matCache = new Map();
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (matCache.has(key) && !o.unique) return matCache.get(key);
  const oo = Object.assign({}, o); delete oo.unique;
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: true, roughness: 0.82, metalness: 0.0 }, oo));
  if (o.opacity !== undefined && o.opacity < 1) { m.transparent = true; m.depthWrite = o.depthWrite ?? false; }
  if (!o.unique) matCache.set(key, m);
  return m;
}
export function basic(color, o = {}) {
  return new THREE.MeshBasicMaterial(Object.assign({ color }, o));
}
export function mesh(geo, material, cast = true, receive = true) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}
export function box(w, h, d, color, o = {}) { return mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'object' ? color : mat(color, o)); }
export function rbox(w, h, d, r, color, o = {}) { return mesh(new RoundedBoxGeometry(w, h, d, 2, r), typeof color === 'object' ? color : mat(color, o)); }
export function cyl(rt, rb, h, color, seg = 16, o = {}) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof color === 'object' ? color : mat(color, o)); }
export function sph(r, color, detail = 1, o = {}) { return mesh(new THREE.IcosahedronGeometry(r, detail), typeof color === 'object' ? color : mat(color, o)); }
export function cap(r, len, color, o = {}) { return mesh(new THREE.CapsuleGeometry(r, len, 4, 10), typeof color === 'object' ? color : mat(color, o)); }
export function at(obj, x, y, z) { obj.position.set(x, y, z); return obj; }
export function group(...children) { const g = new THREE.Group(); children.forEach((c) => c && g.add(c)); return g; }

/** polyline with rounded corners → CurvePath */
export function roundedPath(pts, r = 0.12) {
  const path = new THREE.CurvePath();
  const P = pts.map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p)));
  if (P.length === 2) { path.add(new THREE.LineCurve3(P[0], P[1])); return path; }
  let cur = P[0].clone();
  for (let i = 1; i < P.length - 1; i++) {
    const a = P[i - 1], b = P[i], c = P[i + 1];
    const d1 = b.clone().sub(a), d2 = c.clone().sub(b);
    const l1 = d1.length(), l2 = d2.length();
    const rr = Math.min(r, l1 * 0.5, l2 * 0.5);
    const p1 = b.clone().sub(d1.normalize().multiplyScalar(rr));
    const p2 = b.clone().add(d2.normalize().multiplyScalar(rr));
    if (cur.distanceTo(p1) > 1e-5) path.add(new THREE.LineCurve3(cur.clone(), p1));
    path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
    cur = p2;
  }
  path.add(new THREE.LineCurve3(cur, P[P.length - 1].clone()));
  return path;
}

/** sampled curve: positions by arc length, fast lookups */
export class Sampled {
  constructor(curve, n = 400) {
    this.set(curve, n);
  }
  set(curve, n = 400) {
    this.curve = curve;
    this.pts = curve.getSpacedPoints(n);
    this.n = n;
    this.len = curve.getLength();
  }
  at(u, out = new THREE.Vector3()) {
    u = clamp(u);
    const f = u * this.n, i = Math.min(this.n - 1, Math.floor(f)), k = f - i;
    return out.copy(this.pts[i]).lerp(this.pts[i + 1], k);
  }
  tangent(u, out = new THREE.Vector3()) {
    u = clamp(u);
    const i = Math.min(this.n - 1, Math.floor(u * this.n));
    return out.copy(this.pts[i + 1]).sub(this.pts[i]).normalize();
  }
}

/** a pipe (tube) that can be revealed progressively and carry flow dots */
export class Pipe {
  constructor({ points, radius = 0.035, corner = 0.12, color = 0xd98a5f, opacity = 0.42, maxDots = 160, dotR = 0.022, tubSeg = 220, metal = false }) {
    this.radius = radius; this.corner = corner; this.tubSeg = tubSeg; this.dotR = dotR;
    this.mat = metal ? mat(color, { metalness: 0.45, roughness: 0.4, unique: true }) : new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.25, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
    this.group = new THREE.Group();
    this.tube = new THREE.Mesh(new THREE.BufferGeometry(), this.mat);
    this.tube.castShadow = true; this.tube.renderOrder = 2;
    this.group.add(this.tube);
    const dg = new THREE.IcosahedronGeometry(1, 1);
    this.dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, emissive: 0x000000, flatShading: true });
    this.dots = new THREE.InstancedMesh(dg, this.dotMat, maxDots);
    this.dots.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.dots.setColorAt(0, new THREE.Color());
    this.dots.count = 0; this.dots.frustumCulled = false; this.dots.renderOrder = 1;
    this.group.add(this.dots);
    this.maxDots = maxDots;
    this.setPoints(points || [[0, 0, 0], [0, 0.01, 0]]);
  }
  setPoints(points) {
    const key = JSON.stringify(points.map((p) => (p.isVector3 ? p.toArray().map((v) => +v.toFixed(4)) : p)));
    if (key === this._key) return;
    this._key = key;
    this.curve = roundedPath(points, this.corner);
    this.s = new Sampled(this.curve, 500);
    this.tube.geometry.dispose();
    this.tube.geometry = new THREE.TubeGeometry(this.curve, this.tubSeg, this.radius, 10, false);
    this.idxCount = this.tube.geometry.index.count;
  }
  /** fraction of tube drawn from its start */
  reveal(f) {
    f = clamp(f);
    this.tube.visible = f > 0.001;
    const per = this.idxCount / this.tubSeg;
    this.tube.geometry.setDrawRange(0, Math.ceil(this.tubSeg * f) * per);
  }
  /**
   * flow dots. opts: phase (arc-length offset, m), spacing (m), fill (0..1 front), style(u, k) → {r, color(THREE.Color), vis}
   */
  flow(phase, spacing, fill, style, fromU = 0) {
    const L = this.s.len, n = Math.min(this.maxDots, Math.floor(L / spacing) + 1);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    let c = 0;
    if (fill <= 0) { this.dots.count = 0; return; }
    const off = ((phase % spacing) + spacing) % spacing;
    const base = Math.floor(phase / spacing);
    for (let i = 0; i < n; i++) {
      const s = i * spacing + off;
      if (s > L) break;
      const u = s / L;
      if (u > fill || u < fromU) continue;
      const k = i - base; // stable identity of the moving dot
      const st = style(u, k);
      if (!st || st.r <= 0.0005) continue;
      this.s.at(u, p);
      if (st.jitter) { p.x += (hash(k * 3.1) - 0.5) * st.jitter; p.y += (hash(k * 5.7) - 0.5) * st.jitter; p.z += (hash(k * 7.9) - 0.5) * st.jitter; }
      sc.setScalar(st.r);
      m.compose(p, q, sc);
      this.dots.setMatrixAt(c, m);
      this.dots.setColorAt(c, st.color);
      c++;
      if (c >= this.maxDots) break;
    }
    this.dots.count = c;
    this.dots.instanceMatrix.needsUpdate = true;
    if (this.dots.instanceColor) this.dots.instanceColor.needsUpdate = true;
  }
}

/** canvas-texture plane (for small screens, gauges) */
export function canvasPlane(w, h, pxW, pxH) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  m.userData.ctx = c.getContext('2d'); m.userData.tex = tex; m.userData.canvas = c;
  return m;
}

export const C = {
  hot: new THREE.Color(0xff6a2b), warm: new THREE.Color(0xffa040), cold: new THREE.Color(0x35b8ff), coldLiq: new THREE.Color(0x1e6fff),
  gasCold: new THREE.Color(0x9fe3ff), gasHot: new THREE.Color(0xff3b2f), liqWarm: new THREE.Color(0xff9a1f), white: new THREE.Color(0xffffff),
};
export function mixColor(a, b, t, out = new THREE.Color()) { return out.copy(a).lerp(b, clamp(t)); }
