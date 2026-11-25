/* =====================================================================================
   ESTILO "SIMPLES" — 3D bem básico e colorido: bonequinhos de cápsula com cabeça redonda grande,
   olhinhos de bolinha, praça clara, árvores de bolinha low-poly, céu azul limpo. Cara de vídeo "E SE…?".
   Funciona muito bem com MULTIDÃO (várias pessoinhas reagindo juntas).

   import * as E from '../../../biblioteca/estilos/simples/estilo.js';
   E.preparar();
   const ze = E.boneco();                              // boneco modelo (camisa branca, calça azul-escura, cabelo preto). Altura ≈ 1,5 m
   const povo = E.multidao(14, { raio: 4 });           // várias pessoinhas de cores diferentes (povo.pessoas = lista)
   E.animar(ze, t, { humor, fala, andar, pose, poseK });
   Peças: E.material(cor) · E.caixa · E.cilindro · E.esfera · E.capsula · E.cone · E.icosa (pedra/copa low-poly)
   Cenários: E.chao() · E.praca() · E.fonte() · E.arvore() · E.predio() · E.sala(R)
   ===================================================================================== */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, lerp, ease, hash } from '../../../sistema/motor/lib.js';
import { scene, camera, renderer, ceu, luzes, V } from '../../../sistema/motor/video.js';

export const TIPO = '3d';
export const NOME = 'Simples';
export const COR = {
  pele: '#f3c29a', camisa: '#f5f5f2', calca: '#1f3462', cabelo: '#141416', sapato: '#2a2a2e', olho: '#1a1a1a',
  chao: '#f1ead8', grama: '#8fd36a', arvore: ['#5cbf4a', '#4aa83c', '#6fd05a'], tronco: '#8a5a3c', agua: '#7fd1f5', pedra: '#d9d4cc',
  camisas: ['#f4b63f', '#ef7e3a', '#57b36b', '#e9545a', '#5aa0e6', '#a77be0', '#f2d14a'], cabelos: ['#141416', '#5b3a24', '#c06a2b', '#2b1a10', '#d9a35a'],
  peles: ['#f3c29a', '#e2a57a', '#c4865a', '#8d5a3a', '#f6d2b5'], calcas: ['#1f3462', '#3b3f48', '#6b4a2e', '#2f5d8a'],
  ceu: ['#5fb1ee', '#8ccaf5', '#d8eefc'],
};
const cache = new Map();
export function material(cor, o = {}) {
  const k = cor + JSON.stringify(o); if (cache.has(k)) return cache.get(k);
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(cor), roughness: o.rugosidade ?? 0.88, metalness: 0, flatShading: !!o.facetado, transparent: (o.opacity ?? 1) < 1, opacity: o.opacity ?? 1 });
  cache.set(k, m); return m;
}
const mk = (geo, cor, o = {}) => { const m = new THREE.Mesh(geo, typeof cor === 'object' && cor.isMaterial ? cor : material(cor, o)); m.castShadow = o.sombra ?? true; m.receiveShadow = true; return m; };
export const caixa = (w, h, d, cor, o = {}) => mk(o.r ? new RoundedBoxGeometry(w, h, d, 3, o.r) : new THREE.BoxGeometry(w, h, d), cor, o);
export const cilindro = (r, h, cor, o = {}) => mk(new THREE.CylinderGeometry(o.rTopo ?? r, r, h, o.seg ?? 24), cor, o);
export const esfera = (r, cor, o = {}) => mk(new THREE.SphereGeometry(r, o.seg ?? 32, Math.round((o.seg ?? 32) * 0.7)), cor, o);
export const capsula = (r, h, cor, o = {}) => mk(new THREE.CapsuleGeometry(r, h, 8, 24), cor, o);
export const cone = (r, h, cor, o = {}) => mk(new THREE.ConeGeometry(r, h, o.seg ?? 24), cor, o);
export const icosa = (r, cor, o = {}) => mk(new THREE.IcosahedronGeometry(r, o.detalhe ?? 0), cor, { facetado: true, ...o });
export const em = (o, x, y, z = 0) => { o.position.set(x, y, z); return o; };
export function grupo(...f) { const g = new THREE.Group(); f.forEach((x) => x && g.add(x)); return g; }

export function preparar(o = {}) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = o.exposicao ?? 1.12;
  ceu(...(o.ceu || COR.ceu));
  return luzes({ hemi: ['#ffffff', '#d9caa8', 1.7], sol: ['#fff8ec', 2.3, [-4, 10, 7]], contra: ['#d6e8ff', 0.6, [6, 5, -4]], ...(o.luz || {}) });
}

/* ------------------------------------------------------------------ boneco (cápsula + cabeção redondo + olhinhos de bolinha)
   look: { camisa, calca, cabelo, pele, sapato, penteado: 'curto' | 'comprido' | 'careca' }                              */
export function boneco(look = {}) {
  const C = Object.assign({}, COR, look);
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const legs = [], arms = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(sx * 0.09, 0.5, 0); body.add(hip);
    hip.add(em(cilindro(0.075, 0.46, C.calca, { rTopo: 0.08 }), 0, -0.23, 0));
    const knee = new THREE.Group(); knee.position.y = -0.46; hip.add(knee);
    knee.add(em(caixa(0.14, 0.07, 0.2, C.sapato, { r: 0.03 }), 0, -0.01, 0.03));
    legs.push({ hip, knee, sx });
  }
  const torso = new THREE.Group(); torso.position.y = 0.5; body.add(torso);
  torso.add(em(capsula(0.2, 0.26, C.camisa), 0, 0.3, 0));
  torso.add(em(cilindro(0.205, 0.12, C.calca), 0, 0.04, 0));
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.2, 0.92, 0); body.add(sh);
    sh.add(em(capsula(0.055, 0.22, C.camisa), 0, -0.14, 0));
    const el = new THREE.Group(); el.position.y = -0.26; sh.add(el);
    el.add(em(esfera(0.058, C.pele), 0, -0.03, 0));
    const handP = new THREE.Group(); handP.position.y = -0.06; el.add(handP);
    arms.push({ sh, el, handP, sx, L1: 0.26, L2: 0.06 });
  }
  const headP = new THREE.Group(); headP.position.set(0, 1.25, 0); body.add(headP);
  headP.add(esfera(0.25, C.pele));
  const pen = look.penteado ?? 'curto';
  if (pen !== 'careca') { const h = new THREE.Mesh(new THREE.SphereGeometry(0.262, 32, 20, 0, Math.PI * 2, 0, pen === 'comprido' ? Math.PI * 0.62 : Math.PI * 0.45), material(C.cabelo)); h.rotation.x = -0.35; h.castShadow = true; headP.add(h); if (pen === 'comprido') { const t = capsula(0.17, 0.25, C.cabelo); t.position.set(0, -0.1, -0.12); headP.add(t); } }
  const eyes = new THREE.Group(); headP.add(eyes);
  for (const sx of [-1, 1]) eyes.add(em(esfera(0.026, C.olho, { seg: 12 }), sx * 0.085, 0.02, 0.235));
  const brows = [-1, 1].map((sx) => { const b = caixa(0.06, 0.014, 0.01, C.cabelo); b.position.set(sx * 0.085, 0.085, 0.237); headP.add(b); return b; });
  const mouths = {
    sorriso: em(mk(new THREE.TorusGeometry(0.035, 0.009, 8, 20, Math.PI), '#7a2e2a'), 0, -0.07, 0.24),
    aberta: em(esfera(0.03, '#5a1d1d', { seg: 12 }), 0, -0.08, 0.235),
    triste: em(mk(new THREE.TorusGeometry(0.03, 0.008, 8, 20, Math.PI), '#7a2e2a'), 0, -0.1, 0.238),
    reta: em(caixa(0.05, 0.01, 0.01, '#7a2e2a'), 0, -0.08, 0.246),
  };
  mouths.sorriso.rotation.z = Math.PI; mouths.aberta.scale.set(1, 0.8, 0.4);
  for (const k in mouths) headP.add(mouths[k]);
  g.userData = { body, headP, eyes, brows, mouths, arms, legs, torso };
  return g;
}
/** várias pessoinhas de cores diferentes, espalhadas num círculo (ou numa área). Devolve um grupo com .pessoas */
export function multidao(n = 12, o = {}) {
  const g = new THREE.Group(); g.pessoas = [];
  for (let i = 0; i < n; i++) {
    const p = boneco({ camisa: COR.camisas[i % COR.camisas.length], cabelo: COR.cabelos[(i * 3) % COR.cabelos.length], pele: COR.peles[(i * 7) % COR.peles.length], calca: COR.calcas[i % COR.calcas.length], penteado: hash(i * 3.3) > 0.7 ? 'comprido' : hash(i * 9.1) > 0.92 ? 'careca' : 'curto' });
    const a = (o.arco ?? Math.PI * 2) * (i / n) + (o.a0 ?? 0) + hash(i) * 0.3, r = (o.raio ?? 3) * (0.75 + 0.35 * hash(i * 2.2));
    p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); p.rotation.y = Math.atan2(-p.position.x, -p.position.z) + (hash(i * 5.5) - 0.5) * 0.6;
    p.scale.setScalar(0.88 + 0.22 * hash(i * 4.4)); g.add(p); g.pessoas.push(p);
  }
  return g;
}
export function animar(p, t, st = {}) {
  const u = p.userData, humor = st.humor ?? 0.3, andar = st.andar ?? 0, fala = st.fala ?? 0;
  u.body.position.y = Math.sin(t * 2.2 + p.id) * 0.006;
  const falando = fala > 0.05 && Math.sin(t * 20) > 0;
  for (const k in u.mouths) u.mouths[k].visible = false;
  (st.boca && u.mouths[st.boca]) ? (u.mouths[st.boca].visible = true) : ((falando ? u.mouths.aberta : humor > 0.15 ? u.mouths.sorriso : humor < -0.15 ? u.mouths.triste : u.mouths.reta).visible = true);
  u.brows.forEach((b, i) => { b.rotation.z = (i ? 1 : -1) * (humor < -0.2 ? -0.4 : 0.1); });
  const bl = (t * 0.37 + 0.13 + p.id * 0.07) % 1; u.eyes.scale.y = bl < 0.03 ? 0.2 : 1;
  const ph = t * (st.passo ?? 7);
  u.legs.forEach((L, i) => { L.hip.rotation.x = Math.sin(ph + i * Math.PI) * 0.5 * andar; });
  u.body.position.y += Math.abs(Math.sin(ph)) * 0.025 * andar;
  u.arms.forEach((A, i) => { A.sh.rotation.set(-Math.sin(ph + i * Math.PI) * 0.5 * andar, 0, A.sx * 0.12); A.el.rotation.set(0, 0, 0); });
  u.headP.rotation.set(0, (st.olhar ?? 0) * 0.5, Math.sin(t * 1.3 + p.id) * 0.02);
  pose(p, t, st.pose, st.poseK ?? 1);
}
export function pose(p, t, nome, k = 1) {
  if (!nome || k <= 0.001) return;
  const u = p.userData, [Lf, Rt] = u.arms;
  const set = (A, x, z) => { A.sh.rotation.x = lerp(A.sh.rotation.x, x, k); A.sh.rotation.z = lerp(A.sh.rotation.z, A.sx * z, k); };
  const boca = (n) => { for (const m in u.mouths) u.mouths[m].visible = false; u.mouths[n].visible = true; };
  if (nome === 'comemora') { set(Lf, 0, 2.6 + 0.15 * Math.sin(t * 13)); set(Rt, 0, 2.6 + 0.15 * Math.sin(t * 13 + 1)); u.body.position.y += Math.abs(Math.sin(t * 9)) * 0.08 * k; boca('aberta'); }
  else if (nome === 'aponta') set(Rt, -1.5, 0.2);
  else if (nome === 'segura') { set(Rt, -1.2, 0.05); set(Lf, -1.2, 0.05); }
  else if (nome === 'pensa') { set(Rt, -2.4, 0.4); u.headP.rotation.z = lerp(u.headP.rotation.z, 0.12, k); }
  else if (nome === 'susto') { set(Lf, -0.4, 2.4); set(Rt, -0.4, 2.4); boca('aberta'); }
  else if (nome === 'tchau') set(Rt, 0, 2.5 + 0.35 * Math.sin(t * 10));
}

/* ------------------------------------------------------------------ cenários */
export function chao(o = {}) { const m = mk(new THREE.CircleGeometry(o.raio ?? 40, 64), o.cor ?? COR.grama, { sombra: false }); m.rotation.x = -Math.PI / 2; return m; }
/** praça clara redonda com borda, no meio do gramado */
export function praca(o = {}) {
  const g = new THREE.Group(), r = o.raio ?? 7;
  const p = mk(new THREE.CylinderGeometry(r, r, 0.06, 64), COR.chao, { sombra: false }); p.position.y = 0.03; g.add(p);
  const b = mk(new THREE.TorusGeometry(r, 0.06, 8, 64), '#e2d9c4'); b.rotation.x = Math.PI / 2; b.position.y = 0.06; g.add(b);
  return g;
}
export function fonte(o = {}) {
  const g = new THREE.Group();
  g.add(em(cilindro(1.1, 0.35, '#efeae0', { seg: 40 }), 0, 0.175, 0), em(cilindro(1.0, 0.05, COR.agua, { seg: 40 }), 0, 0.33, 0), em(cilindro(0.12, 0.7, '#e8e2d6'), 0, 0.6, 0));
  g.add(em(esfera(0.28, '#7fc3ef'), 0, 1.05, 0));
  return g;
}
export function arvore(o = {}) {
  const g = new THREE.Group(), s = o.tam ?? 1;
  g.add(em(cilindro(0.08 * s, 0.9 * s, COR.tronco), 0, 0.45 * s, 0));
  g.add(em(icosa(0.55 * s, COR.arvore[Math.floor(hash(s * 99) * 3)], { detalhe: 1 }), 0, 1.2 * s, 0), em(icosa(0.38 * s, COR.arvore[1], { detalhe: 1 }), 0.25 * s, 1.55 * s, 0.1 * s));
  return g;
}
export function predio(o = {}) {
  const g = new THREE.Group(), w = o.largura ?? 3, h = o.altura ?? 6;
  g.add(em(caixa(w, h, w, o.cor ?? '#f2e6d6'), 0, h / 2, 0));
  for (let y = 1; y < h - 0.5; y += 1) for (let x = -w / 2 + 0.5; x < w / 2; x += 0.8) g.add(em(caixa(0.45, 0.55, 0.05, '#9fd4f2', { sombra: false }), x, y, w / 2 + 0.01));
  return g;
}
export function sala(R = {}) {
  const x0 = R.x0 ?? -3, x1 = R.x1 ?? 3, z0 = R.z0 ?? -2.5, z1 = R.z1 ?? 2, h = R.h ?? 2.7, w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const g = new THREE.Group();
  g.add(em(caixa(w, 0.08, d, R.piso ?? '#e9dcc4'), cx, -0.04, cz), em(caixa(w, h, 0.1, R.parede ?? '#cfe6f5'), cx, h / 2, z0), em(caixa(0.1, h, d, R.parede ?? '#cfe6f5'), x0, h / 2, cz));
  g.add(em(caixa(1.3, 1.0, 0.04, '#ffffff', { sombra: false }), cx + w * 0.2, 1.5, z0 + 0.06), em(caixa(1.2, 0.9, 0.05, '#9fd4f2', { sombra: false }), cx + w * 0.2, 1.5, z0 + 0.07));
  return g;
}
