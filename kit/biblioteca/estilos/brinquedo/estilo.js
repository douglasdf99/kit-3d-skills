/* =====================================================================================
   ESTILO "BRINQUEDO" — bonequinhos 3D lisinhos e brilhantes (cabeçudos, olhos grandes), como brinquedo
   de plástico, num cenário mais realista (terra com pedrinhas, plantas, cerca, morros ao longe).
   Luz de sol suave com sombra macia; cara de miniatura bem iluminada.

   import * as E from '../../../biblioteca/estilos/brinquedo/estilo.js';
   E.preparar();
   const ze = E.boneco();              // boneco modelo (camisa branca, calça azul-escura, cabelo preto). Altura ≈ 1,5 m
   E.animar(ze, t, { humor, fala, andar, pose, poseK });
   Peças: E.material(cor, {brilho}) · E.caixa(w,h,d,cor,{r}) · E.cilindro(r,h,cor) · E.esfera(r,cor) · E.capsula(r,h,cor)
   Cenários: E.chao({...}) · E.pedras(...) · E.agave() · E.cerca(...) · E.arvore() · E.morros() · E.trilho(...) · E.sala(R)
   ===================================================================================== */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, lerp, ease, hash } from '../../../sistema/motor/lib.js';
import { scene, camera, renderer, ceu, luzes, V } from '../../../sistema/motor/video.js';

export const TIPO = '3d';
export const NOME = 'Brinquedo';
export const COR = {
  pele: '#f1b98f', camisa: '#f6f4ef', calca: '#1e3361', cabelo: '#17171b', sapato: '#2c2f38', sola: '#f2f2f2', olho: '#2a1a12', boca: '#7a2e2a',
  terra: '#b08a62', terraClara: '#c9a47c', pedra: ['#9a8f84', '#857a70', '#b0a598'], agave: ['#5f8f86', '#6f9e93', '#557f77'], grama: '#7a9a4a',
  madeira: '#8a6440', ceu: ['#7fb2e5', '#a9cdef', '#e6eef2'],
};

/* ------------------------------------------------------------------ materiais e peças lisinhas */
const cache = new Map();
/** material de brinquedo: plástico com brilho. o.brilho 0..1 (padrão 0.6) · o.fosco true pra tecido/terra */
export function material(cor, o = {}) {
  const k = cor + JSON.stringify(o); if (cache.has(k) && !o.unico) return cache.get(k);
  const m = o.fosco ? new THREE.MeshStandardMaterial({ color: new THREE.Color(cor), roughness: o.rugosidade ?? 0.85, metalness: 0, map: o.map || null })
    : new THREE.MeshPhysicalMaterial({ color: new THREE.Color(cor), roughness: o.rugosidade ?? 0.42, metalness: o.metal ?? 0, clearcoat: o.brilho ?? 0.6, clearcoatRoughness: 0.28, map: o.map || null });
  if ((o.opacity ?? 1) < 1) { m.transparent = true; m.opacity = o.opacity; m.depthWrite = false; }
  if (!o.unico) cache.set(k, m); return m;
}
const mk = (geo, cor, o = {}) => { const m = new THREE.Mesh(geo, typeof cor === 'object' && cor.isMaterial ? cor : material(cor, o)); m.castShadow = o.sombra ?? true; m.receiveShadow = true; return m; };
export const caixa = (w, h, d, cor, o = {}) => mk(new RoundedBoxGeometry(w, h, d, 4, o.r ?? Math.min(w, h, d) * 0.18), cor, o);
export const cilindro = (r, h, cor, o = {}) => mk(new THREE.CylinderGeometry(o.rTopo ?? r, r, h, o.seg ?? 40), cor, o);
export const esfera = (r, cor, o = {}) => mk(new THREE.SphereGeometry(r, o.seg ?? 40, Math.round((o.seg ?? 40) * 0.75)), cor, o);
export const capsula = (r, h, cor, o = {}) => mk(new THREE.CapsuleGeometry(r, h, 10, 28), cor, o);
export const toro = (r, tubo, cor, o = {}) => mk(new THREE.TorusGeometry(r, tubo, 18, 48, o.arco ?? Math.PI * 2), cor, o);
export const cone = (r, h, cor, o = {}) => mk(new THREE.ConeGeometry(r, h, o.seg ?? 32), cor, o);
export const em = (o, x, y, z = 0) => { o.position.set(x, y, z); return o; };
export function grupo(...f) { const g = new THREE.Group(); f.forEach((x) => x && g.add(x)); return g; }
/** textura desenhada (terra, cascalho, madeira) */
function texCanvas(n, draw, rep = 1) { const c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d'), n); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
export function texTerra(rep = 6, base = COR.terra) {
  return texCanvas(512, (x, n) => {
    x.fillStyle = base; x.fillRect(0, 0, n, n);
    for (let i = 0; i < 2600; i++) { const r = 1 + 5 * hash(i * 1.3) ** 3; x.fillStyle = `rgba(${hash(i) > 0.5 ? '255,235,210' : '70,40,20'},${0.05 + 0.12 * hash(i * 2.7)})`; x.beginPath(); x.arc(hash(i * 3.1) * n, hash(i * 5.7) * n, r, 0, 7); x.fill(); }
    for (let i = 0; i < 260; i++) { const r = 2 + 4 * hash(i * 9.1); x.fillStyle = ['#8d8378', '#a59a8e', '#6f655c'][i % 3]; x.beginPath(); x.ellipse(hash(i * 4.4) * n, hash(i * 6.6) * n, r, r * 0.7, hash(i) * 3, 0, 7); x.fill(); }
  }, rep);
}

/* ------------------------------------------------------------------ preparar a cena */
export function preparar(o = {}) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = o.exposicao ?? 1.08;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  ceu(...(o.ceu || COR.ceu));
  scene.fog = new THREE.Fog(new THREE.Color(o.neblina || '#dfe9ee'), o.neblinaPerto ?? 16, o.neblinaLonge ?? 60);
  const L = luzes({ hemi: ['#eaf4ff', '#a07d58', 1.45], sol: ['#fff3e2', 2.6, [-5, 9, 6]], contra: ['#cfe3ff', 0.7, [6, 4, -5]], ...(o.luz || {}) });
  L.sol.shadow.radius = 6; L.sol.shadow.mapSize.set(2048, 2048);
  return L;
}

/* ------------------------------------------------------------------ o boneco modelo (brinquedo cabeçudo)
   look: { camisa, calca, cabelo, pele, sapato, capacete: '#cor' (opcional), colete: '#cor' (opcional), oculos: '#cor' }       */
export function boneco(look = {}) {
  const C = Object.assign({}, COR, look);
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const pele = material(C.pele, { brilho: 0.35, rugosidade: 0.5 }), camisa = material(C.camisa, { fosco: true, rugosidade: 0.7 }), calca = material(C.calca, { fosco: true, rugosidade: 0.72 });
  const legs = [], arms = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(sx * 0.1, 0.5, 0); body.add(hip);
    hip.add(em(capsula(0.088, 0.16, calca), 0, -0.13, 0));
    const knee = new THREE.Group(); knee.position.y = -0.24; hip.add(knee);
    knee.add(em(capsula(0.08, 0.12, calca), 0, -0.08, 0));
    const shoe = caixa(0.17, 0.11, 0.26, C.sapato, { r: 0.05 }); shoe.position.set(0, -0.2, 0.04); knee.add(shoe);
    knee.add(em(caixa(0.18, 0.035, 0.27, C.sola, { r: 0.015 }), 0, -0.25, 0.04));
    legs.push({ hip, knee, sx });
  }
  const torso = new THREE.Group(); torso.position.y = 0.5; body.add(torso);
  const tr = capsula(0.205, 0.2, camisa); tr.scale.set(1.08, 1, 0.82); tr.position.y = 0.27; torso.add(tr);
  const cint = cilindro(0.214, 0.15, calca, { rTopo: 0.21 }); cint.scale.set(1.08, 1, 0.82); cint.position.y = 0.05; torso.add(cint);
  const pelve = esfera(0.2, calca); pelve.scale.set(1.08, 0.55, 0.8); pelve.position.y = -0.01; torso.add(pelve);
  torso.add(em(toro(0.085, 0.022, camisa), 0, 0.47, 0.01)); torso.children[torso.children.length - 1].rotation.x = Math.PI / 2;
  if (look.colete) { const cv = capsula(0.215, 0.18, material(look.colete, { fosco: true })); cv.scale.set(1.1, 0.92, 0.86); cv.position.y = 0.26; torso.add(cv); for (const yy of [0.18, 0.3]) { const b = cilindro(0.222, 0.03, material('#e9ecef', { brilho: 0.9 })); b.scale.set(1.1, 1, 0.86); b.position.y = yy; torso.add(b); } }
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.235, 0.92, 0); body.add(sh);
    sh.add(em(esfera(0.085, camisa), 0, -0.01, 0));
    sh.add(em(capsula(0.06, 0.12, pele), 0, -0.12, 0));
    const el = new THREE.Group(); el.position.y = -0.2; sh.add(el);
    el.add(em(capsula(0.055, 0.1, pele), 0, -0.08, 0));
    el.add(em(esfera(0.07, pele), 0, -0.19, 0.005));
    const handP = new THREE.Group(); handP.position.y = -0.2; el.add(handP);
    arms.push({ sh, el, handP, sx, L1: 0.2, L2: 0.2 });
  }
  // cabeça grande
  const headP = new THREE.Group(); headP.position.set(0, 1.22, 0); body.add(headP);
  const head = esfera(0.28, pele); head.scale.set(1, 0.94, 0.94); headP.add(head);
  for (const sx of [-1, 1]) headP.add(em(esfera(0.055, pele), sx * 0.27, -0.01, -0.02));
  headP.add(em(esfera(0.04, material(tom(C.pele, -0.06), { brilho: 0.4 })), 0, -0.035, 0.27));
  // cabelo: casquinho liso + topete curto
  const cab = material(C.cabelo, { brilho: 0.75, rugosidade: 0.35 });
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.297, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.52), cab); hair.castShadow = true;
  hair.rotation.x = -0.38; hair.position.set(0, 0.02, -0.015); hair.scale.set(1.02, 0.98, 1); headP.add(hair);
  if (!look.capacete) for (const [x, y, z, r, rz] of [[-0.11, 0.215, 0.17, 0.1, 0.5], [0.03, 0.24, 0.18, 0.105, -0.2], [0.15, 0.2, 0.15, 0.09, -0.6]]) { const tf = esfera(r, cab); tf.scale.set(1.25, 0.62, 0.9); tf.rotation.z = rz; tf.position.set(x, y, z); headP.add(tf); }
  if (look.capacete) { hair.scale.multiplyScalar(0.97); const cp = new THREE.Mesh(new THREE.SphereGeometry(0.325, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), material(look.capacete, { brilho: 0.9 })); cp.position.y = 0.05; headP.add(cp); const aba = cilindro(0.355, 0.025, material(look.capacete, { brilho: 0.9 })); aba.position.set(0, 0.06, 0.03); headP.add(aba); }
  // olhos grandes com brilho, sobrancelhas
  const eyes = new THREE.Group(); headP.add(eyes);
  const olhoM = material(C.olho, { brilho: 1, rugosidade: 0.2 }), brM = material('#ffffff', { brilho: 1, rugosidade: 0.1 });
  for (const sx of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(sx * 0.105, 0.03, 0.245); e.rotation.y = sx * 0.38; eyes.add(e);
    const iris = esfera(0.052, olhoM); iris.scale.set(0.85, 1.12, 0.45); e.add(iris);
    e.add(em(esfera(0.016, brM), sx * -0.012, 0.025, 0.022));
    e.add(em(esfera(0.007, brM), sx * 0.012, -0.018, 0.022));
  }
  const brows = [-1, 1].map((sx) => { const b = capsula(0.014, 0.06, material(C.cabelo, { brilho: 0.5 })); b.rotation.z = Math.PI / 2 + sx * 0.12; b.position.set(sx * 0.105, 0.115, 0.252); b.rotation.y = sx * 0.35; headP.add(b); return b; });
  const bocaM = material(C.boca, { brilho: 0.6 });
  const mouths = {
    sorriso: em(toro(0.05, 0.012, bocaM, { arco: Math.PI }), 0, -0.1, 0.255),
    triste: em(toro(0.045, 0.011, bocaM, { arco: Math.PI }), 0, -0.135, 0.252),
    aberta: em(esfera(0.042, material('#5a1d1d', { brilho: 0.5 })), 0, -0.115, 0.248),
    reta: em(capsula(0.01, 0.06, bocaM), 0, -0.115, 0.258),
  };
  mouths.sorriso.rotation.z = Math.PI; mouths.aberta.scale.set(1, 0.8, 0.4); mouths.reta.rotation.z = Math.PI / 2;
  for (const k in mouths) headP.add(mouths[k]);
  if (look.oculos) for (const sx of [-1, 1]) { const o2 = toro(0.06, 0.008, material(look.oculos, { brilho: 0.9 })); o2.position.set(sx * 0.105, 0.03, 0.265); headP.add(o2); }
  g.userData = { body, headP, eyes, brows, mouths, arms, legs, torso };
  return g;
}
function tom(hex, d) { const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, clamp(hsl.l + d)); return '#' + c.getHexString(); }

/** anima o boneco. st: { humor -1..1, fala 0..1, andar 0..1, passo, pose, poseK, olhar -1..1 } · poses: comemora | aponta | pensa | susto | tchau | segura */
export function animar(p, t, st = {}) {
  const u = p.userData, humor = st.humor ?? 0.3, andar = st.andar ?? 0, fala = st.fala ?? 0;
  u.body.position.y = Math.sin(t * 2.2) * 0.006;
  const falando = fala > 0.05 && Math.sin(t * 20) > 0;
  for (const k in u.mouths) u.mouths[k].visible = false;
  (st.boca && u.mouths[st.boca]) ? (u.mouths[st.boca].visible = true) : ((falando ? u.mouths.aberta : humor > 0.15 ? u.mouths.sorriso : humor < -0.15 ? u.mouths.triste : u.mouths.reta).visible = true);
  u.brows.forEach((b, i) => { const sx = i ? 1 : -1; b.rotation.z = Math.PI / 2 + sx * (humor < -0.2 ? -0.35 : 0.12); b.position.y = 0.115 + (humor > 0.6 ? 0.012 : 0); });
  const bl = (t * 0.37 + 0.13) % 1; u.eyes.scale.y = bl < 0.03 ? 0.15 : 1;
  const ph = t * (st.passo ?? 7);
  u.legs.forEach((L, i) => { L.hip.rotation.x = Math.sin(ph + i * Math.PI) * 0.55 * andar; L.knee.rotation.x = Math.max(0, Math.sin(ph + i * Math.PI)) * 0.7 * andar; });
  u.body.position.y += Math.abs(Math.sin(ph)) * 0.025 * andar;
  u.arms.forEach((A, i) => { A.sh.rotation.set(-Math.sin(ph + i * Math.PI) * 0.5 * andar, 0, A.sx * 0.18); A.el.rotation.set(-0.2 - 0.25 * andar, 0, 0); });
  u.headP.rotation.set(humor < -0.3 ? 0.12 : 0, (st.olhar ?? 0) * 0.5, Math.sin(t * 1.3) * 0.02);
  pose(p, t, st.pose, st.poseK ?? 1);
}
export function pose(p, t, nome, k = 1) {
  if (!nome || k <= 0.001) return;
  const u = p.userData, [Lf, Rt] = u.arms;
  const set = (A, x, z, el) => { A.sh.rotation.x = lerp(A.sh.rotation.x, x, k); A.sh.rotation.z = lerp(A.sh.rotation.z, A.sx * z, k); A.el.rotation.x = lerp(A.el.rotation.x, el, k); };
  const boca = (n) => { for (const m in u.mouths) u.mouths[m].visible = false; u.mouths[n].visible = true; };
  if (nome === 'comemora') { set(Lf, 0, 2.5 + 0.15 * Math.sin(t * 13), -0.3); set(Rt, 0, 2.5 + 0.15 * Math.sin(t * 13 + 1), -0.3); u.body.position.y += Math.abs(Math.sin(t * 9)) * 0.08 * k; boca('aberta'); }
  else if (nome === 'aponta') set(Rt, -1.45, 0.25, -0.05);
  else if (nome === 'segura') { set(Rt, -1.1, 0.1, -0.6); set(Lf, -1.1, 0.1, -0.6); }
  else if (nome === 'pensa') { set(Rt, -0.8, 0.3, -2.1); u.headP.rotation.z = lerp(u.headP.rotation.z, 0.12, k); }
  else if (nome === 'susto') { set(Lf, -0.5, 2.2, -1.0); set(Rt, -0.5, 2.2, -1.0); boca('aberta'); }
  else if (nome === 'tchau') set(Rt, 0, 2.45, -0.35 - 0.5 * (0.5 + 0.5 * Math.sin(t * 10)));
}

/* ------------------------------------------------------------------ cenários */
/** chão de terra com pedrinhas (textura) — o.cor muda a terra */
export function chao(o = {}) {
  const w = o.largura ?? 60, d = o.prof ?? 60;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material(o.cor ?? COR.terra, { fosco: true, map: texTerra(o.repetir ?? 10, o.cor ?? COR.terra), rugosidade: 0.95 }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m;
}
/** pedras soltas espalhadas numa área [x0, x1, z0, z1] */
export function pedras(n = 30, area = [-4, 4, -3, 3], o = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const r = (o.tam ?? 0.12) * (0.4 + hash(i * 3.7)); const m = mk(new THREE.DodecahedronGeometry(r, 1), material(COR.pedra[i % 3], { fosco: true, rugosidade: 0.8 })); m.scale.set(1, 0.6 + 0.3 * hash(i), 1); m.position.set(lerp(area[0], area[1], hash(i * 1.9)), r * 0.25, lerp(area[2], area[3], hash(i * 5.3))); m.rotation.set(hash(i) * 3, hash(i * 2) * 3, 0); g.add(m); }
  return g;
}
/** planta tipo agave (folhas compridas e pontudas, azul-esverdeadas) */
export function agave(o = {}) {
  const g = new THREE.Group(), s = o.tam ?? 1, n = o.folhas ?? 14;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + hash(i) * 0.3, inc = 0.45 + 0.5 * hash(i * 2.3), L = (0.55 + 0.3 * hash(i * 4.1)) * s; const f = cone(0.06 * s, L, material(COR.agave[i % 3], { brilho: 0.25, rugosidade: 0.6 }), { seg: 6 }); f.scale.z = 0.35; f.geometry.translate(0, L / 2, 0); f.rotation.set(0, a, 0); f.rotation.x = 0; const pv = new THREE.Group(); pv.rotation.y = a; f.rotation.set(inc, 0, 0); pv.add(f); g.add(pv); }
  return g;
}
/** cerca de arame com postes de madeira ao longo de x (de x0 a x1, na profundidade z) */
export function cerca(x0, x1, z, o = {}) {
  const g = new THREE.Group(), n = Math.max(2, Math.round((x1 - x0) / (o.passo ?? 2)));
  for (let i = 0; i <= n; i++) g.add(em(cilindro(0.045, 1.1, material(COR.madeira, { fosco: true })), lerp(x0, x1, i / n), 0.55, z));
  for (const y of [0.45, 0.75, 1.0]) { const fio = cilindro(0.006, x1 - x0, material('#8f969c', { metal: 0.6, rugosidade: 0.4 }), { seg: 6 }); fio.rotation.z = Math.PI / 2; fio.position.set((x0 + x1) / 2, y, z); g.add(fio); }
  return g;
}
export function arvore(o = {}) {
  const g = new THREE.Group(), s = o.tam ?? 1;
  g.add(em(cilindro(0.08 * s, 1.6 * s, material('#6e5440', { fosco: true }), { rTopo: 0.05 * s }), 0, 0.8 * s, 0));
  for (const [x, y, z, r] of [[0, 1.8, 0, 0.7], [-0.5, 1.65, 0.1, 0.5], [0.5, 1.7, -0.1, 0.55], [0.1, 2.05, 0.2, 0.45]]) { const c = esfera(r * s, material('#5e8a3c', { fosco: true, rugosidade: 0.8 }), { seg: 16 }); c.scale.y = 0.55; c.position.set(x * s, y * s, z * s); g.add(c); }
  return g;
}
/** morros e mato ao longe (fundo) */
export function morros(o = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) { const m = esfera(6 + 6 * hash(i * 2.1), material(i % 2 ? '#8fa36a' : '#9bb07a', { fosco: true }), { seg: 24, sombra: false }); m.scale.y = 0.28; m.position.set(-40 + i * 10, -0.5, -(o.dist ?? 32) - 6 * hash(i)); g.add(m); }
  return g;
}
/** trilho de trem (dois trilhos de aço sobre dormentes) ao longo de x */
export function trilho(x0, x1, z, o = {}) {
  const g = new THREE.Group(), L = x1 - x0;
  for (let i = 0; i <= L / 0.6; i++) g.add(em(caixa(0.22, 0.08, 1.5, material('#6a5848', { fosco: true }), { r: 0.02 }), x0 + i * 0.6, 0.04, z));
  for (const dz of [-0.5, 0.5]) { const r = caixa(L, 0.1, 0.07, material('#8e959b', { metal: 0.7, rugosidade: 0.35 }), { r: 0.015 }); r.position.set((x0 + x1) / 2, 0.13, z + dz); g.add(r); }
  return g;
}
/** cômodo simples (piso de madeira, paredes pintadas, janela). R = { x0, x1, z0, z1, h } */
export function sala(R = {}) {
  const x0 = R.x0 ?? -3, x1 = R.x1 ?? 3, z0 = R.z0 ?? -2.5, z1 = R.z1 ?? 2, h = R.h ?? 2.7, w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const g = new THREE.Group();
  const piso = texCanvas(256, (x, n) => { x.fillStyle = '#c99a68'; x.fillRect(0, 0, n, n); for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(90,55,25,${0.08 + 0.1 * hash(i)})`; x.fillRect(0, i * n / 8, n, n / 8 - 3); x.fillStyle = 'rgba(60,35,15,0.5)'; x.fillRect(0, i * n / 8 + n / 8 - 3, n, 3); } }, 3);
  g.add(em(caixa(w, 0.1, d, material('#c99a68', { fosco: true, map: piso }), { r: 0.01 }), cx, -0.05, cz));
  g.add(em(caixa(w, h, 0.12, R.parede ?? '#e9e2d4', { fosco: true, r: 0.01 }), cx, h / 2, z0));
  g.add(em(caixa(0.12, h, d, R.parede ?? '#e9e2d4', { fosco: true, r: 0.01 }), x0, h / 2, cz));
  g.add(em(caixa(1.4, 1.1, 0.04, material('#bfe0f2', { opacity: 0.6, brilho: 1 })), cx + w * 0.2, 1.5, z0 + 0.07));
  return g;
}
