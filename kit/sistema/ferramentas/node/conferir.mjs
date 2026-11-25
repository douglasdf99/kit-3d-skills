// Roda a cena SEM navegador (Node.js) pra achar erros e exportar âncoras, sons e letreiros.
// Uso interno do conferir.py:  node conferir.mjs <globais.json> <url-da-cena> <saida.json>
import fs from 'node:fs';

const [, , globaisPath, entryUrl, outPath] = process.argv;
const out = { ok: false, erro: null, avisos: [] };
const salvar = () => fs.writeFileSync(outPath, JSON.stringify(out));

// ---------- um "navegador de mentira": canvas e document que aceitam tudo e não desenham nada
function fakeCtx(canvas) {
  const store = { canvas };
  const grad = { addColorStop() {} };
  return new Proxy({}, {
    get(o, k) {
      if (k in store) return store[k];
      if (k === 'measureText') return (t) => ({ width: String(t).length * 0.55 * (parseFloat(String(store.font || '').match(/(\d+(\.\d+)?)px/)?.[1]) || 10), actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 3 });
      if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createConicGradient' || k === 'createPattern') return () => grad;
      if (k === 'getImageData' || k === 'createImageData') return (a, b, w, h) => { const W = (typeof a === 'object' ? a.width : w) | 0, H = (typeof a === 'object' ? a.height : h) | 0; return { width: W, height: H, data: new Uint8ClampedArray(Math.max(4, W * H * 4)) }; };
      if (k === 'getLineDash') return () => [];
      if (k === 'isPointInPath' || k === 'isPointInStroke') return () => false;
      if (k === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
      return () => {};
    },
    set(o, k, v) { store[k] = v; return true; },
  });
}
class FakeCanvas {
  constructor() { this.width = 300; this.height = 150; this.style = {}; this._ctx = null; }
  getContext() { return this._ctx || (this._ctx = fakeCtx(this)); }
  toDataURL() { return 'data:,'; }
  addEventListener() {} removeEventListener() {} setAttribute() {} getBoundingClientRect() { return { left: 0, top: 0, width: this.width, height: this.height }; }
}
const el = () => ({ style: {}, appendChild() {}, append() {}, setAttribute() {}, addEventListener() {}, removeEventListener() {}, classList: { add() {}, remove() {} } });
globalThis.window = globalThis;
globalThis.document = { createElement: (t) => (t === 'canvas' ? new FakeCanvas() : el()), createElementNS: (ns, t) => (t === 'canvas' ? new FakeCanvas() : el()), body: el(), head: el(), getElementById: () => null, querySelector: () => null, fonts: { load: async () => [], ready: Promise.resolve() }, addEventListener() {} };
globalThis.location = { search: '', hash: '', href: 'file:///conferir' };
globalThis.Image = class { constructor() { this.width = 1; this.height = 1; } set src(v) { setTimeout(() => this.onload && this.onload(), 0); } };
globalThis.requestAnimationFrame = (f) => setTimeout(() => f(Date.now()), 16);
globalThis.HTMLCanvasElement = FakeCanvas;
globalThis.OffscreenCanvas = FakeCanvas;

const G = JSON.parse(fs.readFileSync(globaisPath, 'utf8'));
for (const k in G) globalThis[k] = G[k];
globalThis.__DRYRUN__ = true;

function limpaErro(e) {
  const msg = (e && e.message) || String(e);
  const stack = ((e && e.stack) || '').split('\n').filter((l) => /\.m?js:\d+/.test(l)).slice(0, 6).join('\n');
  return { mensagem: msg, pilha: stack };
}


function enquadramento(V) {
  const THREE = globalThis.__THREE__, C = globalThis.__CENA__;
  if (!THREE || !C) return;
  const fmt = (t) => t.toFixed(1) + 's';
  // 1) letreiros que não aparecem, ficam longe da peça ou caem em cima da legenda
  const log = globalThis.__LOG_LETREIROS__ || [], por = new Map();
  for (const e of log) { if (!por.has(e[0])) por.set(e[0], []); por.get(e[0]).push(e); }
  const capY = V.legendaY || 1330;
  V.letreiros.forEach((l, i) => {
    const es = por.get(i) || []; if (es.length < 2) return;
    const vis = es.filter((e) => e[4] === 'ok' || e[4] === 'empurrado');
    if (vis.length / es.length < 0.5) out.avisos.push(`letreiro "${l.texto}" (${fmt(l.t0)}) quase não aparece: o ponto dele fica fora da tela ou atrás da câmera nessa tomada — mude a âncora do letreiro ou a câmera`);
    else if (es.filter((e) => e[4] === 'empurrado').length / es.length > 0.5) out.avisos.push(`letreiro "${l.texto}" (${fmt(l.t0)}) fica longe da peça: o ponto dele está perto da borda e o texto foi empurrado pra dentro da tela — centralize a peça na tomada ou ajuste dy`);
    if (vis.filter((e) => Math.abs(e[3] - capY) < 95).length / es.length > 0.4) out.avisos.push(`letreiro "${l.texto}" (${fmt(l.t0)}) cai em cima da legenda (altura ≈${Math.round(capY)}) — suba com dy negativo`);
  });
  // 2) objeto tampando o que a câmera mira, e 3) close exagerado no rosto do boneco
  const pessoas = []; C.scene.traverse((o) => { if (o.userData && o.userData.headP && o.userData.arms) pessoas.push(o); });
  const visivel = (o) => { for (let p = o; p; p = p.parent) if (p.visible === false) return false; return true; };
  const opaco = (h) => {
    const m = Array.isArray(h.object.material) ? h.object.material[(h.face && h.face.materialIndex) || 0] : h.object.material;
    if (!m || m.visible === false) return false;
    if (m.blending === THREE.AdditiveBlending) return false;
    if (m.transparent) return false;   // vidro, água, brilho: dá pra ver através
    return true;
  };
  const rc = new THREE.Raycaster(); rc.camera = C.camera;
  const tom = V.tomadas;
  for (let k = 0; k < tom.length; k++) {
    const s = tom[k], fim = k + 1 < tom.length ? tom[k + 1].t : V.duracao;
    const t = Math.min(fim - 0.05, s.t + Math.max(s.dur || 0, 0) + 0.35);
    if (t < s.t || t > V.duracao) continue;
    V.compose(t);
    const c = C.cameraAt(t), pos = C.camera.position.clone(), tgt = c.tgt.clone();
    const dir = tgt.clone().sub(pos), dist = dir.length(); if (dist < 0.05) continue;
    rc.set(pos, dir.normalize()); rc.near = 0.06; rc.far = dist - Math.max(0.25, 0.35 * dist);   // ignora o próprio objeto mirado
    if (rc.far <= rc.near) continue;
    const hits = rc.intersectObject(C.scene, true).filter((h) => h.object.isMesh && visivel(h.object) && opaco(h) && h.distance > 0.06);
    if (hits.length) out.avisos.push(`tomada de ${fmt(s.t)}: tem algo na frente do que a câmera mira (a ${hits[0].distance.toFixed(2)} m da câmera; o alvo está a ${dist.toFixed(2)} m) — gire, suba ou aproxime a câmera`);
    const tanHalf = Math.tan((C.camera.fov * Math.PI) / 360);
    for (const P of pessoas) {
      if (!visivel(P)) continue;
      const head = P.userData.headP, hp = head.getWorldPosition(new THREE.Vector3());
      const ndc = hp.clone().project(C.camera); if (ndc.z > 1 || Math.abs(ndc.x) > 1.1 || Math.abs(ndc.y) > 1.1) continue;
      const box = new THREE.Box3().setFromObject(head), alt = box.getSize(new THREE.Vector3()).y || 0.4;
      const d = hp.distanceTo(pos), frac = alt / d / (2 * tanHalf);
      if (frac > 0.45 && Math.abs(ndc.x) < 0.95) out.avisos.push(`tomada de ${fmt(s.t)}: close exagerado no rosto do boneco (a cabeça ocupa ~${Math.round(frac * 100)}% da altura da tela) — afaste a câmera; o mais perto que a série usa é do peito pra cima`);
    }
  }
}

try {
  await import(entryUrl);
  const V = globalThis.__VIDEO__;
  if (!V) throw new Error('A cena não chamou iniciar({ duracao, ancoras, update, ... }) no final.');
  await globalThis.__VIDEO_PRONTO__;
  // passa por todo o vídeo (10 quadros por segundo) chamando a mesma função do render
  const passo = 0.1;
  let t = 0;
  try { for (t = 0; t <= V.duracao + 1e-6; t += passo) V.compose(Math.min(t, V.duracao)); }
  catch (e) { const er = limpaErro(e); er.mensagem = `no segundo ${t.toFixed(2)} do vídeo: ` + er.mensagem; throw Object.assign(new Error(er.mensagem), { stack: (e && e.stack) || '' }); }
  // ---------- conferências de enquadramento (sem ver a imagem)
  try { enquadramento(V); } catch (e) { out.avisos.push('(não consegui conferir o enquadramento: ' + ((e && e.message) || e) + ')'); }
  const anc = {};
  for (const [k, v] of Object.entries(V.ancoras || {})) {
    if (typeof v === 'number') { anc[k] = v; if (!Number.isFinite(v)) out.avisos.push(`âncora A.${k} não é um número válido (${v})`); }
  }
  const ambientes = V.ambientes.map((a) => {
    const o = { ...a, env: null };
    if (typeof a.env === 'function') { const arr = []; for (let x = a.t0; x <= a.t1; x += 0.02) arr.push(+(+a.env(x) || 0).toFixed(4)); o.env = arr; o.env_dt = 0.02; }
    return o;
  });
  for (const s of V.sons) if (!Number.isFinite(s.t)) out.avisos.push(`som "${s.nome}" com tempo inválido (${s.t}) — alguma âncora não existe?`);
  for (const l of V.letreiros) if (!(l.t1 > l.t0)) out.avisos.push(`letreiro "${l.texto}" termina antes de começar (${l.t0} → ${l.t1})`);
  Object.assign(out, { ok: true, duracao: V.duracao, ancoras: anc, sons: V.sons, ambientes, letreiros: V.letreiros, tomadas: V.tomadas });
} catch (e) {
  out.erro = limpaErro(e);
}
salvar();
process.exit(0);
