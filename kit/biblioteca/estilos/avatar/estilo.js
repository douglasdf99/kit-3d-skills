/* =====================================================================================
   ESTILO "AVATAR DE JOGO" — bonequinho de blocos de plástico, como avatar de jogo online:
   cabeça quadradinha com rosto desenhado, tronco e membros retos (sem cotovelo), mundo de blocos lisos,
   paredes de tijolo de textura simples, luz de jogo. Edição de meme: soco de zoom, tremor, círculo vermelho.

   import * as E from '../../../biblioteca/estilos/avatar/estilo.js';
   E.preparar();
   const ze = E.boneco();             // avatar modelo (camisa branca, calça azul-escura, cabelo preto). Altura ≈ 1,7 m
   E.animar(ze, t, { humor, fala, andar, pose, poseK });
   Peças: E.material(cor) · E.bloco(w,h,d,cor,{r}) · E.cilindro · E.esfera · E.cunha (rampa)
   Cenários: E.chao() · E.paredeTijolo(w,h,{cor}) · E.sala(R) · E.arvore() · E.plataforma()
   ===================================================================================== */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, lerp, ease, hash } from '../../../sistema/motor/lib.js';
import { scene, camera, renderer, ceu, luzes, V } from '../../../sistema/motor/video.js';

export const TIPO = '3d';
export const NOME = 'Avatar de jogo';
export const COR = {
  pele: '#f0c39b', camisa: '#f4f4f4', calca: '#1f3463', cabelo: '#151518', sapato: '#26272b', rosto: '#151518',
  chao: '#4cae4c', tijolo: '#7a3f34', tijoloEsc: '#3b3f4a', piso: '#b7b2a8', madeira: '#a8743f', ceu: ['#69b5f0', '#9fd0f7', '#e6f4ff'],
};
const cache = new Map();
export function material(cor, o = {}) {
  const k = cor + JSON.stringify(Object.keys(o).filter((x) => x !== 'map').map((x) => [x, o[x]])) + (o.map ? o.map.uuid : '');
  if (cache.has(k) && !o.unico) return cache.get(k);
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(cor), roughness: o.rugosidade ?? 0.5, metalness: o.metal ?? 0, map: o.map || null, transparent: (o.opacity ?? 1) < 1, opacity: o.opacity ?? 1 });
  if (o.neon) { m.emissive = new THREE.Color(cor); m.emissiveIntensity = o.neon; }
  if (!o.unico) cache.set(k, m); return m;
}
const mk = (geo, cor, o = {}) => { const m = new THREE.Mesh(geo, typeof cor === 'object' && cor.isMaterial ? cor : material(cor, o)); m.castShadow = o.sombra ?? true; m.receiveShadow = true; return m; };
export const bloco = (w, h, d, cor, o = {}) => mk(o.r === 0 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 2, o.r ?? Math.min(w, h, d) * 0.06), cor, o);
export const cilindro = (r, h, cor, o = {}) => mk(new THREE.CylinderGeometry(o.rTopo ?? r, r, h, o.seg ?? 32), cor, o);
export const esfera = (r, cor, o = {}) => mk(new THREE.SphereGeometry(r, o.seg ?? 32, 24), cor, o);
export function cunha(w, h, d, cor, o = {}) { const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(-d / 2, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2); return mk(g, cor, o); }
export const em = (o, x, y, z = 0) => { o.position.set(x, y, z); return o; };
export function grupo(...f) { const g = new THREE.Group(); f.forEach((x) => x && g.add(x)); return g; }
function tex(w, h, draw, rx = 1, ry = 1, pixel = false) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); if (pixel) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; } return t; }

export function preparar(o = {}) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = o.exposicao ?? 1.05;
  ceu(...(o.ceu || COR.ceu));
  return luzes({ hemi: ['#ffffff', '#8a8a8a', 1.3], sol: ['#fffaf0', 2.4, [-4, 10, 6]], contra: ['#cfe0ff', 0.6, [6, 5, -4]], ...(o.luz || {}) });
}

/* ------------------------------------------------------------------ o avatar modelo
   look: { camisa, calca, cabelo, pele, sapato, bone: '#cor' (opcional) }  — braços e pernas são retos (giram só no ombro e no quadril) */
function rostoTex(tipo) {
  return tex(256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.fillStyle = COR.rosto; x.strokeStyle = COR.rosto; x.lineCap = 'round';
    const olho = (cx, alto) => { x.beginPath(); x.ellipse(cx, 104, 15, alto, 0, 0, 7); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(cx - 4, 96, 5, 7, 0, 0, 7); x.fill(); x.fillStyle = COR.rosto; };
    if (tipo === 'piscando') { x.lineWidth = 9; for (const cx of [92, 164]) { x.beginPath(); x.moveTo(cx - 16, 106); x.lineTo(cx + 16, 106); x.stroke(); } }
    else { olho(92, tipo === 'susto' ? 30 : 24); olho(164, tipo === 'susto' ? 30 : 24); }
    if (tipo !== 'triste') { const yb = tipo === 'susto' ? 56 : 66; x.lineWidth = 8; x.beginPath(); x.moveTo(74, yb); x.quadraticCurveTo(92, yb - 9, 110, yb); x.moveTo(146, yb); x.quadraticCurveTo(164, yb - 9, 182, yb); x.stroke(); }
    x.lineWidth = 9;
    if (tipo === 'sorriso' || tipo === 'piscando') { x.beginPath(); x.arc(128, 150, 36, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke(); }
    else if (tipo === 'triste') { x.beginPath(); x.arc(128, 196, 34, 1.2 * Math.PI, 1.8 * Math.PI); x.stroke(); x.lineWidth = 7; x.beginPath(); x.moveTo(70, 70); x.lineTo(108, 80); x.moveTo(186, 70); x.lineTo(148, 80); x.stroke(); }
    else if (tipo === 'aberta' || tipo === 'susto') { x.beginPath(); x.ellipse(128, 168, tipo === 'susto' ? 20 : 30, tipo === 'susto' ? 26 : 20, 0, 0, 7); x.fill(); x.fillStyle = '#d9605a'; x.beginPath(); x.ellipse(128, tipo === 'susto' ? 180 : 176, 14, 8, 0, 0, 7); x.fill(); }
    else { x.beginPath(); x.moveTo(104, 166); x.lineTo(152, 166); x.stroke(); }
  });
}
const ROSTOS = {};
export function boneco(look = {}) {
  const C = Object.assign({}, COR, look);
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const camisaTex = tex(64, 64, (x, w, h) => { x.fillStyle = C.camisa; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,0.08)'; x.fillRect(0, h - 6, w, 6); x.fillStyle = C.pele; x.beginPath(); x.moveTo(w * 0.36, 0); x.lineTo(w * 0.64, 0); x.lineTo(w / 2, h * 0.16); x.closePath(); x.fill(); }, 1, 1, true);
  const bracoTex = tex(32, 64, (x, w, h) => { x.fillStyle = C.pele; x.fillRect(0, 0, w, h); x.fillStyle = C.camisa; x.fillRect(0, 0, w, h * 0.38); x.fillStyle = 'rgba(0,0,0,0.08)'; x.fillRect(0, h * 0.36, w, 2); }, 1, 1, true);
  const pernaTex = tex(32, 64, (x, w, h) => { x.fillStyle = C.calca; x.fillRect(0, 0, w, h); x.fillStyle = C.sapato; x.fillRect(0, h * 0.84, w, h * 0.16); }, 1, 1, true);
  const legs = [], arms = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(sx * 0.15, 0.62, 0); body.add(hip);
    hip.add(em(bloco(0.29, 0.62, 0.3, material('#ffffff', { map: pernaTex }), { r: 0.025 }), 0, -0.31, 0));
    legs.push({ hip, knee: new THREE.Group(), sx });
  }
  const torso = new THREE.Group(); torso.position.y = 0.62; body.add(torso);
  torso.add(em(bloco(0.6, 0.62, 0.3, material('#ffffff', { map: camisaTex }), { r: 0.025 }), 0, 0.31, 0));
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.45, 1.2, 0); body.add(sh);
    sh.add(em(bloco(0.28, 0.62, 0.29, material('#ffffff', { map: bracoTex }), { r: 0.025 }), 0, -0.27, 0));
    const el = new THREE.Group(); el.position.y = -0.55; sh.add(el);
    const handP = new THREE.Group(); el.add(handP);
    arms.push({ sh, el, handP, sx, L1: 0.55, L2: 0.01 });
  }
  const headP = new THREE.Group(); headP.position.set(0, 1.27, 0); body.add(headP);
  headP.add(em(cilindro(0.08, 0.08, C.pele), 0, 0, 0));
  const cab = bloco(0.44, 0.4, 0.42, C.pele, { r: 0.08 }); cab.position.y = 0.22; headP.add(cab);
  // cabelo de bloco (peça de encaixar)
  const hairM = material(C.cabelo, { rugosidade: 0.45 });
  headP.add(em(bloco(0.48, 0.16, 0.46, hairM, { r: 0.06 }), 0, 0.42, -0.01), em(bloco(0.48, 0.3, 0.12, hairM, { r: 0.05 }), 0, 0.3, -0.18));
  for (const sx of [-1, 1]) headP.add(em(bloco(0.06, 0.18, 0.28, hairM, { r: 0.025 }), sx * 0.235, 0.32, -0.06));
  headP.add(em(bloco(0.38, 0.08, 0.1, hairM, { r: 0.035 }), 0.02, 0.38, 0.19));
  if (look.bone) headP.add(em(bloco(0.5, 0.14, 0.48, look.bone, { r: 0.06 }), 0, 0.46, 0), em(bloco(0.44, 0.04, 0.22, look.bone, { r: 0.015 }), 0, 0.4, 0.3));
  // rosto desenhado (troca de imagem)
  const mouths = {};
  for (const tipo of ['sorriso', 'aberta', 'triste', 'reta', 'susto', 'piscando']) {
    if (!ROSTOS[tipo]) ROSTOS[tipo] = new THREE.MeshBasicMaterial({ map: rostoTex(tipo), transparent: true, depthWrite: false });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36), ROSTOS[tipo]); f.position.set(0, 0.21, 0.212); f.userData.semPiscar = true; f.renderOrder = 2; headP.add(f); mouths[tipo] = f;
  }
  g.userData = { body, headP, mouths, arms, legs, torso, brows: [], eyes: new THREE.Group() };
  return g;
}
export function animar(p, t, st = {}) {
  const u = p.userData, humor = st.humor ?? 0.3, andar = st.andar ?? 0, fala = st.fala ?? 0;
  u.body.position.y = 0;
  const falando = fala > 0.05 && Math.sin(t * 20) > 0, bl = (t * 0.37 + 0.13) % 1;
  for (const k in u.mouths) u.mouths[k].visible = false;
  let r = st.boca && u.mouths[st.boca] ? st.boca : falando ? 'aberta' : humor > 0.15 ? 'sorriso' : humor < -0.15 ? 'triste' : 'reta';
  if (bl < 0.03 && r === 'sorriso') r = 'piscando';
  u.mouths[r].visible = true;
  const ph = t * (st.passo ?? 8);
  u.legs.forEach((L, i) => { L.hip.rotation.x = Math.sin(ph + i * Math.PI) * 0.75 * andar; });
  u.arms.forEach((A, i) => { A.sh.rotation.set(-Math.sin(ph + i * Math.PI) * 0.75 * andar, 0, 0); });
  u.headP.rotation.set(0, (st.olhar ?? 0) * 0.5, 0);
  pose(p, t, st.pose, st.poseK ?? 1);
}
export function pose(p, t, nome, k = 1) {
  if (!nome || k <= 0.001) return;
  const u = p.userData, [Lf, Rt] = u.arms;
  const set = (A, x, z) => { A.sh.rotation.x = lerp(A.sh.rotation.x, x, k); A.sh.rotation.z = lerp(A.sh.rotation.z, A.sx * z, k); };
  const rosto = (n) => { for (const m in u.mouths) u.mouths[m].visible = false; u.mouths[n].visible = true; };
  if (nome === 'comemora') { set(Lf, 0, 2.7 + 0.15 * Math.sin(t * 13)); set(Rt, 0, 2.7 + 0.15 * Math.sin(t * 13 + 1)); u.body.position.y += Math.abs(Math.sin(t * 9)) * 0.12 * k; rosto('aberta'); }
  else if (nome === 'aponta') set(Rt, -1.55, 0.05);
  else if (nome === 'segura') { set(Rt, -1.4, 0); set(Lf, -1.4, 0); }
  else if (nome === 'pensa') { set(Rt, -2.6, 0.5); }
  else if (nome === 'susto') { set(Lf, 0, 2.6); set(Rt, 0, 2.6); rosto('susto'); }
  else if (nome === 'tchau') set(Rt, 0, 2.7 + 0.35 * Math.sin(t * 10));
}

/* ------------------------------------------------------------------ cenários */
export function chao(o = {}) {
  const t = tex(64, 64, (x, w, h) => { x.fillStyle = o.cor ?? COR.chao; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,0.09)'; x.fillRect(0, 0, w, 2); x.fillRect(0, 0, 2, h); }, (o.largura ?? 40) / 2, (o.prof ?? 40) / 2);
  const m = mk(new THREE.PlaneGeometry(o.largura ?? 40, o.prof ?? 40), material(o.cor ?? COR.chao, { map: t, rugosidade: 0.7 }), { sombra: false }); m.rotation.x = -Math.PI / 2; return m;
}
/** parede de tijolo com textura simples de jogo (pixelada) */
export function paredeTijolo(w, h, o = {}) {
  const cor = o.cor ?? COR.tijoloEsc;
  const t = tex(64, 64, (x, cw, ch) => { x.fillStyle = cor; x.fillRect(0, 0, cw, ch); x.fillStyle = 'rgba(0,0,0,0.35)'; for (let r = 0; r < 4; r++) { x.fillRect(0, r * 16 + 14, cw, 2); for (let i = 0; i < 2; i++) x.fillRect(((r % 2) * 16 + i * 32) % cw, r * 16, 2, 16); } x.fillStyle = 'rgba(255,255,255,0.06)'; for (let r = 0; r < 4; r++) x.fillRect(0, r * 16, cw, 2); }, w / 1.2, h / 1.2, true);
  return bloco(w, h, o.esp ?? 0.3, material('#ffffff', { map: t, rugosidade: 0.85 }), { r: 0 });
}
export function plataforma(w = 2, d = 2, cor = '#e0e0e0', o = {}) { return em(bloco(w, o.altura ?? 0.3, d, cor, { r: 0.03 }), 0, (o.altura ?? 0.3) / 2, 0); }
export function arvore(o = {}) {
  const s = o.tam ?? 1;
  return grupo(em(bloco(0.3 * s, 1.4 * s, 0.3 * s, '#7a4f2d', { r: 0.02 }), 0, 0.7 * s, 0), em(bloco(1.4 * s, 1.2 * s, 1.4 * s, '#3f9e3f', { r: 0.12 }), 0, 1.9 * s, 0), em(bloco(0.9 * s, 0.7 * s, 0.9 * s, '#4fb84f', { r: 0.1 }), 0, 2.65 * s, 0));
}
/** cômodo de jogo: piso liso, paredes de tijolo, janela que brilha. R = { x0, x1, z0, z1, h, tijolo: cor } */
export function sala(R = {}) {
  const x0 = R.x0 ?? -3, x1 = R.x1 ?? 3, z0 = R.z0 ?? -2.5, z1 = R.z1 ?? 2, h = R.h ?? 3, w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const g = new THREE.Group();
  const pt = tex(64, 64, (x, cw, ch) => { x.fillStyle = R.piso ?? COR.piso; x.fillRect(0, 0, cw, ch); x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 0, cw, 2); x.fillRect(0, 0, 2, ch); }, w / 1.5, d / 1.5, true);
  g.add(em(bloco(w, 0.2, d, material('#ffffff', { map: pt, rugosidade: 0.6 }), { r: 0 }), cx, -0.1, cz));
  const fundo = paredeTijolo(w, h, { cor: R.tijolo }); fundo.position.set(cx, h / 2, z0); g.add(fundo);
  const lado = paredeTijolo(d, h, { cor: R.tijolo }); lado.rotation.y = Math.PI / 2; lado.position.set(x0, h / 2, cz); g.add(lado);
  const jx = R.janelaX ?? cx + w * 0.25;
  g.add(em(bloco(1.3, 1.3, 0.1, '#20242c', { r: 0.01 }), jx, 1.7, z0 + 0.15), em(bloco(1.15, 1.15, 0.05, material('#dff1ff', { neon: 1.4 }), { r: 0 }), jx, 1.7, z0 + 0.2));
  g.add(em(bloco(0.06, 1.15, 0.06, '#20242c', { r: 0 }), jx, 1.7, z0 + 0.23), em(bloco(1.15, 0.06, 0.06, '#20242c', { r: 0 }), jx, 1.7, z0 + 0.23));
  return g;
}
