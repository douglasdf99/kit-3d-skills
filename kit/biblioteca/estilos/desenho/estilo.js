/* =====================================================================================
   ESTILO "DESENHO" — 3D com cara de desenho animado japonês: sombra em 2 ou 3 tons (sem degradê),
   contorno preto em tudo, olhos grandes brilhantes, cabelo espetado, cores fortes e lugares internos
   bem iluminados (ginásio, sala de aula, quarto).

   import * as E from '../../../biblioteca/estilos/desenho/estilo.js';
   E.preparar();
   const ze = E.boneco();                  // boneco modelo (camisa branca, calça azul-escura, cabelo preto). Altura ≈ 1,5 m
   E.animar(ze, t, { humor, fala, andar, pose, poseK });
   Peças: E.material(cor) · E.caixa(w,h,d,cor,{r}) · E.cilindro · E.esfera · E.capsula · E.cone · E.toro
   IMPORTANTE: depois de montar um objeto, chame E.contorno(objeto) pra ganhar o contorno preto do desenho
   (o boneco e os cenários do estilo já vêm com contorno).
   Cenários: E.ginasio({...}) · E.sala(R) · E.chao()
   ===================================================================================== */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, lerp, ease, hash } from '../../../sistema/motor/lib.js';
import { scene, camera, renderer, ceu, luzes, V } from '../../../sistema/motor/video.js';

export const TIPO = '3d';
export const NOME = 'Desenho';
export const COR = {
  pele: '#ffd9bd', camisa: '#fbfbfb', calca: '#1d2f63', cabelo: '#1b1b26', sapato: '#ffffff', solado: '#e63946', olho: '#2b1d14', iris: '#5a3a24', boca: '#a3343a', bochecha: '#ff8f9a',
  piso: '#d9a066', linha: '#ffcf33', parede: '#e9e7e2', ceu: ['#bfe6ff', '#e3f4ff', '#ffffff'],
};
/* ------------------------------------------------------------------ material de desenho (sombra em tons) + contorno */
let GRAD = null;
function gradiente() {
  if (GRAD) return GRAD;
  const d = new Uint8Array([110, 110, 110, 255, 190, 190, 190, 255, 255, 255, 255, 255]);
  GRAD = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); GRAD.magFilter = GRAD.minFilter = THREE.NearestFilter; GRAD.needsUpdate = true; return GRAD;
}
const cache = new Map();
export function material(cor, o = {}) {
  const k = cor + JSON.stringify(o); if (cache.has(k) && !o.unico) return cache.get(k);
  const m = new THREE.MeshToonMaterial({ color: new THREE.Color(cor), gradientMap: gradiente(), map: o.map || null, transparent: (o.opacity ?? 1) < 1, opacity: o.opacity ?? 1 });
  if (o.brilho) { m.emissive = new THREE.Color(cor); m.emissiveIntensity = o.brilho; }
  if (!o.unico) cache.set(k, m); return m;
}
const contornos = new Map();
function matContorno(esp, cor = '#15151c') {
  const k = esp + cor; if (contornos.has(k)) return contornos.get(k);
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(cor), side: THREE.BackSide });
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n  transformed += normal * ${esp.toFixed(4)};`); };
  m.customProgramCacheKey = () => 'contorno' + esp;
  contornos.set(k, m); return m;
}
/** contorno preto de desenho em tudo que estiver dentro do objeto. esp = grossura (em metros, ~0,012) */
export function contorno(obj, esp = 0.012, cor) {
  const lista = []; obj.traverse((m) => { if (m.isMesh && !m.userData.contorno && !m.userData.semContorno) lista.push(m); });
  for (const m of lista) { const s = Math.max(m.scale.x, m.scale.y, m.scale.z) || 1; const c = new THREE.Mesh(m.geometry, matContorno(esp / s, cor)); c.userData.contorno = true; c.userData.semPiscar = true; c.castShadow = false; m.add(c); }
  return obj;
}
const mk = (geo, cor, o = {}) => { const m = new THREE.Mesh(geo, typeof cor === 'object' && cor.isMaterial ? cor : material(cor, o)); m.castShadow = o.sombra ?? true; m.receiveShadow = true; return m; };
export const caixa = (w, h, d, cor, o = {}) => mk(new RoundedBoxGeometry(w, h, d, 3, o.r ?? Math.min(w, h, d) * 0.12), cor, o);
export const cilindro = (r, h, cor, o = {}) => mk(new THREE.CylinderGeometry(o.rTopo ?? r, r, h, o.seg ?? 32), cor, o);
export const esfera = (r, cor, o = {}) => mk(new THREE.SphereGeometry(r, o.seg ?? 36, Math.round((o.seg ?? 36) * 0.7)), cor, o);
export const capsula = (r, h, cor, o = {}) => mk(new THREE.CapsuleGeometry(r, h, 8, 24), cor, o);
export const cone = (r, h, cor, o = {}) => mk(new THREE.ConeGeometry(r, h, o.seg ?? 24), cor, o);
export const toro = (r, tubo, cor, o = {}) => mk(new THREE.TorusGeometry(r, tubo, 12, 40, o.arco ?? Math.PI * 2), cor, o);
export const em = (o, x, y, z = 0) => { o.position.set(x, y, z); return o; };
export function grupo(...f) { const g = new THREE.Group(); f.forEach((x) => x && g.add(x)); return g; }

export function preparar(o = {}) {
  renderer.toneMapping = THREE.NoToneMapping;
  ceu(...(o.ceu || COR.ceu));
  const L = luzes({ hemi: ['#ffffff', '#d8c6b0', 1.15], sol: ['#ffffff', 2.4, [-4, 9, 7]], contra: ['#e6f0ff', 0.5, [6, 5, -4]], ...(o.luz || {}) });
  L.sol.shadow.radius = 1.5; L.sol.shadow.bias = -0.0015; L.sol.shadow.normalBias = 0.05;
  return L;
}

/* ------------------------------------------------------------------ o boneco modelo (desenho)
   look: { camisa, calca, cabelo, pele, sapato, solado, oculos }                                                       */
export function boneco(look = {}) {
  const C = Object.assign({}, COR, look);
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const legs = [], arms = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(sx * 0.1, 0.52, 0); body.add(hip);
    hip.add(em(capsula(0.085, 0.18, C.calca), 0, -0.13, 0));
    const knee = new THREE.Group(); knee.position.y = -0.26; hip.add(knee);
    knee.add(em(capsula(0.07, 0.14, C.calca), 0, -0.08, 0));
    knee.add(em(caixa(0.16, 0.1, 0.25, C.sapato, { r: 0.045 }), 0, -0.22, 0.04), em(caixa(0.17, 0.035, 0.26, C.solado, { r: 0.015 }), 0, -0.27, 0.04));
    legs.push({ hip, knee, sx });
  }
  const torso = new THREE.Group(); torso.position.y = 0.52; body.add(torso);
  const tr = capsula(0.19, 0.2, C.camisa); tr.scale.set(1.1, 1, 0.8); tr.position.y = 0.27; torso.add(tr);
  const cint = cilindro(0.2, 0.14, C.calca); cint.scale.set(1.1, 1, 0.8); cint.position.y = 0.05; torso.add(cint);
  const gola = toro(0.075, 0.02, '#e9e9e9'); gola.rotation.x = Math.PI / 2; gola.position.y = 0.5; torso.add(gola);
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.23, 0.93, 0); body.add(sh);
    sh.add(em(esfera(0.08, C.camisa), 0, -0.02, 0));
    sh.add(em(capsula(0.052, 0.13, C.pele), 0, -0.13, 0));
    const el = new THREE.Group(); el.position.y = -0.21; sh.add(el);
    el.add(em(capsula(0.048, 0.1, C.pele), 0, -0.08, 0), em(esfera(0.062, C.pele), 0, -0.19, 0));
    const handP = new THREE.Group(); handP.position.y = -0.2; el.add(handP);
    arms.push({ sh, el, handP, sx, L1: 0.21, L2: 0.2 });
  }
  const headP = new THREE.Group(); headP.position.set(0, 1.21, 0); body.add(headP);
  const cabeca = esfera(0.27, C.pele); cabeca.scale.set(1, 0.97, 0.95); headP.add(cabeca);
  const queixo = esfera(0.2, C.pele); queixo.scale.set(1, 0.8, 0.9); queixo.position.set(0, -0.08, 0.04); headP.add(queixo);
  for (const sx of [-1, 1]) headP.add(em(esfera(0.05, C.pele), sx * 0.265, -0.02, -0.02));
  // cabelo espetado
  const cab = material(C.cabelo), cabG = new THREE.Group(); headP.add(cabG);
  const capa = new THREE.Mesh(new THREE.SphereGeometry(0.29, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.55), cab); capa.rotation.x = -0.3; capa.position.y = 0.02; capa.castShadow = true; cabG.add(capa);
  const espinhos = [[0, 0.3, 0.05, 0.1, 0.2, -0.3, 0], [-0.12, 0.27, 0.12, 0.09, 0.18, -0.6, 0.5], [0.13, 0.27, 0.12, 0.09, 0.18, -0.6, -0.5], [-0.2, 0.18, 0.18, 0.08, 0.16, -1.0, 0.9], [0.21, 0.17, 0.17, 0.08, 0.16, -1.0, -0.9], [0, 0.2, 0.22, 0.09, 0.16, -1.3, 0], [-0.1, 0.12, 0.25, 0.07, 0.13, -1.7, 0.4], [0.1, 0.12, 0.25, 0.07, 0.13, -1.7, -0.4], [0, 0.25, -0.15, 0.1, 0.2, 0.5, 0], [-0.2, 0.2, -0.08, 0.09, 0.18, 0.4, 0.9], [0.2, 0.2, -0.08, 0.09, 0.18, 0.4, -0.9], [-0.25, 0.05, 0.02, 0.07, 0.14, 0.2, 1.6], [0.25, 0.05, 0.02, 0.07, 0.14, 0.2, -1.6]];
  for (const [x, y, z, r, h, rx, rz] of espinhos) { const c = cone(r, h, cab, { seg: 10 }); c.position.set(x, y, z); c.rotation.set(rx, 0, rz); cabG.add(c); }
  // olhos de desenho: branco + íris grande + 2 brilhos + cílio de cima
  const eyes = new THREE.Group(); headP.add(eyes);
  for (const sx of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(sx * 0.1, 0.0, 0.235); e.rotation.y = sx * 0.33; eyes.add(e);
    const branco = esfera(0.065, '#ffffff'); branco.scale.set(0.8, 1.05, 0.3); branco.userData.semContorno = true; e.add(branco);
    const iris = esfera(0.05, C.iris); iris.scale.set(0.72, 1.0, 0.3); iris.position.z = 0.012; iris.userData.semContorno = true; e.add(iris);
    const pupila = esfera(0.03, C.olho); pupila.scale.set(0.7, 1.0, 0.3); pupila.position.z = 0.018; pupila.userData.semContorno = true; e.add(pupila);
    const b1 = esfera(0.016, '#ffffff', { brilho: 1 }); b1.position.set(sx * -0.014, 0.022, 0.026); b1.userData.semContorno = true; e.add(b1);
    const b2 = esfera(0.008, '#ffffff', { brilho: 1 }); b2.position.set(sx * 0.012, -0.02, 0.026); b2.userData.semContorno = true; e.add(b2);
    const cilio = toro(0.055, 0.009, '#15151c', { arco: Math.PI * 0.8 }); cilio.rotation.z = Math.PI * 0.1; cilio.scale.set(0.95, 1.05, 1); cilio.position.z = 0.012; cilio.userData.semContorno = true; e.add(cilio);
    const boch = esfera(0.04, C.bochecha, { opacity: 0.55 }); boch.scale.set(1.2, 0.5, 0.2); boch.position.set(sx * 0.02, -0.085, 0.0); boch.userData.semContorno = true; e.add(boch);
  }
  const brows = [-1, 1].map((sx) => { const b = capsula(0.012, 0.07, C.cabelo); b.rotation.z = Math.PI / 2 + sx * 0.1; b.position.set(sx * 0.1, 0.105, 0.252); b.rotation.y = sx * 0.3; b.userData.semContorno = true; headP.add(b); return b; });
  const bocaM = material(C.boca);
  const mouths = {
    sorriso: em(toro(0.04, 0.009, bocaM, { arco: Math.PI }), 0, -0.1, 0.255),
    aberta: em(esfera(0.04, '#7a1f2a'), 0, -0.11, 0.25),
    triste: em(toro(0.035, 0.009, bocaM, { arco: Math.PI }), 0, -0.13, 0.252),
    reta: em(capsula(0.008, 0.05, bocaM), 0, -0.11, 0.258),
  };
  mouths.sorriso.rotation.z = Math.PI; mouths.aberta.scale.set(1.1, 0.75, 0.35); mouths.reta.rotation.z = Math.PI / 2;
  for (const k in mouths) { mouths[k].userData.semContorno = true; headP.add(mouths[k]); }
  contorno(g, 0.011);
  g.userData = { body, headP, eyes, brows, mouths, arms, legs, torso };
  return g;
}
export function animar(p, t, st = {}) {
  const u = p.userData, humor = st.humor ?? 0.3, andar = st.andar ?? 0, fala = st.fala ?? 0;
  u.body.position.y = Math.sin(t * 2.2) * 0.006;
  const falando = fala > 0.05 && Math.sin(t * 20) > 0;
  for (const k in u.mouths) u.mouths[k].visible = false;
  (st.boca && u.mouths[st.boca]) ? (u.mouths[st.boca].visible = true) : ((falando ? u.mouths.aberta : humor > 0.15 ? u.mouths.sorriso : humor < -0.15 ? u.mouths.triste : u.mouths.reta).visible = true);
  u.brows.forEach((b, i) => { const sx = i ? 1 : -1; b.rotation.z = Math.PI / 2 + sx * (humor < -0.2 ? -0.4 : 0.1); });
  const bl = (t * 0.37 + 0.13) % 1; u.eyes.scale.y = bl < 0.03 ? 0.12 : 1;
  const ph = t * (st.passo ?? 7);
  u.legs.forEach((L, i) => { L.hip.rotation.x = Math.sin(ph + i * Math.PI) * 0.6 * andar; L.knee.rotation.x = Math.max(0, Math.sin(ph + i * Math.PI)) * 0.8 * andar; });
  u.body.position.y += Math.abs(Math.sin(ph)) * 0.03 * andar;
  u.arms.forEach((A, i) => { A.sh.rotation.set(-Math.sin(ph + i * Math.PI) * 0.6 * andar, 0, A.sx * 0.15); A.el.rotation.set(-0.25 - 0.4 * andar, 0, 0); });
  u.headP.rotation.set(humor < -0.3 ? 0.12 : 0, (st.olhar ?? 0) * 0.5, Math.sin(t * 1.3) * 0.02);
  pose(p, t, st.pose, st.poseK ?? 1);
}
export function pose(p, t, nome, k = 1) {
  if (!nome || k <= 0.001) return;
  const u = p.userData, [Lf, Rt] = u.arms;
  const set = (A, x, z, el) => { A.sh.rotation.x = lerp(A.sh.rotation.x, x, k); A.sh.rotation.z = lerp(A.sh.rotation.z, A.sx * z, k); A.el.rotation.x = lerp(A.el.rotation.x, el, k); };
  const boca = (n) => { for (const m in u.mouths) u.mouths[m].visible = false; u.mouths[n].visible = true; };
  if (nome === 'comemora') { set(Lf, 0, 2.5 + 0.15 * Math.sin(t * 13), -0.3); set(Rt, 0, 2.5 + 0.15 * Math.sin(t * 13 + 1), -0.3); u.body.position.y += Math.abs(Math.sin(t * 9)) * 0.09 * k; boca('aberta'); }
  else if (nome === 'aponta') set(Rt, -1.5, 0.25, -0.05);
  else if (nome === 'segura') { set(Rt, -1.1, 0.1, -0.6); set(Lf, -1.1, 0.1, -0.6); }
  else if (nome === 'pensa') { set(Rt, -0.8, 0.3, -2.1); u.headP.rotation.z = lerp(u.headP.rotation.z, 0.12, k); }
  else if (nome === 'susto') { set(Lf, -0.5, 2.2, -1.0); set(Rt, -0.5, 2.2, -1.0); boca('aberta'); }
  else if (nome === 'tchau') set(Rt, 0, 2.45, -0.35 - 0.5 * (0.5 + 0.5 * Math.sin(t * 10)));
}

/* ------------------------------------------------------------------ cenários */
function texCanvas(w, h, draw, rx = 1, ry = 1) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
/** ginásio: piso de madeira com faixas, círculo amarelo, paredes claras, janelas altas, arquibancada com grade e cortina vermelha */
export function ginasio(o = {}) {
  const g = new THREE.Group(), w = o.largura ?? 16, d = o.prof ?? 12;
  const piso = texCanvas(512, 512, (x, cw, ch) => { x.fillStyle = COR.piso; x.fillRect(0, 0, cw, ch); for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? 'rgba(120,70,30,0.10)' : 'rgba(255,230,190,0.10)'; x.fillRect(i * cw / 16, 0, cw / 16, ch); x.fillStyle = 'rgba(90,50,20,0.35)'; x.fillRect(i * cw / 16, 0, 2, ch); } }, w / 4, d / 4);
  const ch = mk(new THREE.PlaneGeometry(w, d), material(COR.piso, { map: piso }), { sombra: false }); ch.rotation.x = -Math.PI / 2; g.add(ch);
  const circ = mk(new THREE.RingGeometry(1.75, 1.85, 64), COR.linha, { sombra: false }); circ.rotation.x = -Math.PI / 2; circ.position.set(o.circuloX ?? 0, 0.005, o.circuloZ ?? 0.5); g.add(circ);
  const faixa = mk(new THREE.PlaneGeometry(w, 0.06), '#2a9d55', { sombra: false }); faixa.rotation.x = -Math.PI / 2; faixa.position.set(0, 0.005, -d / 2 + 1.2); g.add(faixa);
  const parede = contorno(em(caixa(w, 5, 0.3, COR.parede, { r: 0.02 }), 0, 2.5, -d / 2), 0.02); g.add(parede);
  g.add(contorno(em(caixa(w, 1.0, 0.34, '#3f9d7a', { r: 0.02 }), 0, 0.5, -d / 2), 0.015), contorno(em(caixa(w, 0.08, 0.36, '#2a7a5c', { r: 0.01 }), 0, 1.02, -d / 2), 0.01));
  for (let i = 0; i < 5; i++) { const x = -w / 2 + 2 + i * 1.5; g.add(contorno(em(caixa(1.2, 1.9, 0.06, '#5a6470', { r: 0.01 }), x, 3.6, -d / 2 + 0.16), 0.012)); const jan = em(caixa(1.05, 1.75, 0.05, material('#bfe6ff', { brilho: 0.75 }), { r: 0.01 }), x, 3.6, -d / 2 + 0.2); jan.userData.semContorno = true; g.add(jan); g.add(em(caixa(0.05, 1.75, 0.06, '#5a6470'), x, 3.6, -d / 2 + 0.22)); }
  const lat = contorno(em(caixa(0.3, 5, d, '#dedbd4', { r: 0.02 }), -w / 2, 2.5, 0), 0.02); g.add(lat);
  // arquibancada (balcão) com grade e plaquinha, cortina vermelha
  const bal = contorno(em(caixa(6, 0.9, 1.4, '#2f8a6b', { r: 0.03 }), w / 2 - 3.2, 2.6, -d / 2 + 0.85), 0.02); g.add(bal);
  for (let i = 0; i < 13; i++) g.add(contorno(em(cilindro(0.025, 0.7, '#1e5f49'), w / 2 - 6 + i * 0.5, 3.4, -d / 2 + 1.5), 0.008));
  g.add(contorno(em(caixa(6, 0.06, 0.06, '#1e5f49'), w / 2 - 3.2, 3.76, -d / 2 + 1.5), 0.008));
  const cort = contorno(em(caixa(2.4, 2.2, 0.15, '#c8242c', { r: 0.03 }), w / 2 - 1.5, 1.1, -d / 2 + 0.3), 0.015); g.add(cort);
  g.add(contorno(em(cilindro(0.04, 7, '#b88a52'), w / 2 - 4.5, 2.4, -1.5), 0.01)); g.children[g.children.length - 1].rotation.z = Math.PI / 2;   // barra de madeira
  return g;
}
export function chao(o = {}) { const m = mk(new THREE.CircleGeometry(o.raio ?? 30, 48), o.cor ?? '#9bd46a', { sombra: false }); m.rotation.x = -Math.PI / 2; return m; }
export function sala(R = {}) {
  const x0 = R.x0 ?? -3, x1 = R.x1 ?? 3, z0 = R.z0 ?? -2.5, z1 = R.z1 ?? 2, h = R.h ?? 2.7, w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const g = new THREE.Group();
  g.add(em(caixa(w, 0.08, d, R.piso ?? '#d9a066', { r: 0.01 }), cx, -0.04, cz));
  g.add(contorno(em(caixa(w, h, 0.12, R.parede ?? '#fbe3c8', { r: 0.01 }), cx, h / 2, z0), 0.015));
  g.add(contorno(em(caixa(0.12, h, d, R.parede ?? '#fbe3c8', { r: 0.01 }), x0, h / 2, cz), 0.015));
  const jan = em(caixa(1.4, 1.1, 0.05, material('#cfeeff', { brilho: 0.6 })), cx + w * 0.2, 1.5, z0 + 0.08); g.add(contorno(jan, 0.015));
  return g;
}
