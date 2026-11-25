/* =====================================================================================
   ESTILO "ILUSTRADO 2D" — desenho plano, visto de lado, cores chapadas (sem luz nem sombra 3D).
   Tudo é feito de formas planas (retângulos arredondados, círculos, polígonos) em camadas.
   A câmera fica de frente, quase sem perspectiva, e anda de lado / aproxima / afasta.

   import * as E from '../../../biblioteca/estilos/ilustrado/estilo.js';
   E.preparar();                         // liga o modo 2D (sem luz, sem sombra, câmera quase plana)
   const ze = E.boneco();                // o boneco modelo (camisa branca, calça azul-escura, cabelo preto)
   E.animar(ze, t, { humor: 1, fala: 0, andar: 0, pose: 'comemora', poseK: 1 });
   E.tomada(t, x, y, alturaVisivel, dur) // câmera: centro (x, y) e quanto de altura aparece na tela (em metros)
   Peças: E.ret(w, h, cor, {r, z}) · E.circ(r, cor) · E.elipse(rx, ry, cor) · E.poli([[x,y],...], cor) · E.anel(r1, r2, cor) · E.traco([[x,y],...], esp, cor)
   Cenários: E.ceuDoEstilo() · E.horizonte() · E.rua() · E.predio({...}) · E.sala(R) · E.planta() · E.arvore()
   Profundidade: z maior = mais na frente (use passos de 0,01). Personagem fica em z = 0.
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, hash } from '../../../sistema/motor/lib.js';
import { scene, camera, renderer, orb, ceu, V } from '../../../sistema/motor/video.js';

export const TIPO = '2d';
export const NOME = 'Ilustrado 2D';
export const COR = {
  pele: '#f2bf94', peleSombra: '#dca47b', camisa: '#f7f5f0', camisaSombra: '#dedad1', calca: '#1f3260', calcaSombra: '#16244a',
  cabelo: '#16161a', sapato: '#2b2b30', sola: '#ffffff', olho: '#1b1b1f', boca: '#8a2b2b',
  ceu: ['#f59d6b', '#f6bf86', '#efdcb4'], sol: '#fde7a6', mar: '#7a78bf', marLuz: '#a19dd8',
  creme: '#f6e8cc', cremeSombra: '#ead6b0', petroleo: '#2a8c88', petroleoEsc: '#1d6a67', mostarda: '#dfa53c', mostardaEsc: '#b9862c',
  lilas: '#c7b4e6', marinho: '#2f5d8a', verde: '#2e9e6b', verdeClaro: '#4fbb86', calcada: '#f0eee8', onda: '#8f8cab', asfalto: '#3b3f48',
  madeira: '#c98a55', madeiraEsc: '#a86c3d', parede: '#f3e6cf', rodape: '#2a8c88',
};

/* ------------------------------------------------------------------ materiais e formas planas */
const mats = new Map();
export function material(cor, o = {}) {
  const k = cor + (o.opacity ?? 1);
  if (mats.has(k) && !o.unico) return mats.get(k);
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(cor), side: THREE.DoubleSide, transparent: (o.opacity ?? 1) < 1, opacity: o.opacity ?? 1, depthWrite: (o.opacity ?? 1) >= 1 });
  if (!o.unico) mats.set(k, m);
  return m;
}
function chapa(shape, cor, o = {}) {
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape, o.seg ?? 16), typeof cor === 'object' && cor.isMaterial ? cor : material(cor, o));
  m.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0); if (o.rot) m.rotation.z = o.rot;
  return m;
}
export function formaRet(w, h, r = 0, cx = 0, cy = 0) {
  const s = new THREE.Shape(); r = Math.min(r, w / 2, h / 2); const x = cx - w / 2, y = cy - h / 2;
  if (r <= 0) { s.moveTo(x, y); s.lineTo(x + w, y); s.lineTo(x + w, y + h); s.lineTo(x, y + h); s.closePath(); return s; }
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2); s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5); return s;
}
/** retângulo (arredondado com {r}) centrado em (0,0) */
export const ret = (w, h, cor, o = {}) => chapa(formaRet(w, h, o.r ?? 0), cor, o);
/** retângulo com a BASE em (0,0) — bom pra pernas, braços, prédios */
export const retBase = (w, h, cor, o = {}) => chapa(formaRet(w, h, o.r ?? 0, 0, h / 2), cor, o);
/** retângulo pendurado: TOPO em (0,0) — bom pra braços e pernas que giram no ombro/quadril */
export const retPend = (w, h, cor, o = {}) => chapa(formaRet(w, h, o.r ?? 0, 0, -h / 2), cor, o);
export function elipse(rx, ry, cor, o = {}) { const s = new THREE.Shape(); s.absellipse(0, 0, rx, ry, o.a0 ?? 0, o.a1 ?? Math.PI * 2, false, 0); return chapa(s, cor, o); }
export const circ = (r, cor, o = {}) => elipse(r, r, cor, o);
export function poli(pts, cor, o = {}) { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return chapa(s, cor, o); }
export function anel(r1, r2, cor, o = {}) { const s = new THREE.Shape(); s.absarc(0, 0, r2, 0, Math.PI * 2, false); const h = new THREE.Path(); h.absarc(0, 0, r1, 0, Math.PI * 2, true); s.holes.push(h); return chapa(s, cor, o); }
/** traço grosso passando pelos pontos (corrimão, fio, cabo) */
export function traco(pts, esp, cor, o = {}) {
  const g = new THREE.Group();
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], L = Math.hypot(x2 - x1, y2 - y1);
    const m = ret(L + esp, esp, cor, { r: esp / 2, z: o.z ?? 0 }); m.position.x = (x1 + x2) / 2; m.position.y = (y1 + y2) / 2; m.rotation.z = Math.atan2(y2 - y1, x2 - x1); g.add(m);
  }
  return g;
}
/** sombra chapada no chão (elipse escura translúcida) */
export const sombra = (larg = 0.5, o = {}) => elipse(larg / 2, larg * 0.07, '#000000', { opacity: o.forca ?? 0.16, z: o.z ?? -0.005, y: o.y ?? 0.005 });
/** textura de padrão desenhada em canvas (ondas da calçada, tijolinhos, listras) repetida num retângulo */
export function retPadrao(w, h, desenho, o = {}) {
  const c = document.createElement('canvas'); c.width = o.px ?? 256; c.height = o.py ?? 256; desenho(c.getContext('2d'), c.width, c.height);
  const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(w / (o.tam ?? 1), h / (o.tamY ?? o.tam ?? 1)); tx.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx, side: THREE.DoubleSide }));
  m.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0); return m;
}
export function grupo(...filhos) { const g = new THREE.Group(); filhos.forEach((f) => f && g.add(f)); return g; }
/** coloca o objeto em (x, y, z) e devolve ele mesmo: em(E.circ(0.1, '#fff'), 1, 2, 0.01) */
export const em = (o, x, y, z = 0) => { o.position.set(x, y, z); return o; };
const at = em;

/* ------------------------------------------------------------------ preparar a cena (chame UMA vez, no começo) */
export function preparar() {
  renderer.toneMapping = THREE.NoToneMapping; renderer.shadowMap.enabled = false;
  camera.near = 20; camera.far = 140; camera.updateProjectionMatrix();
  ceu(...COR.ceu);
}
/** câmera 2D: olha pro ponto (x, y) mostrando `altura` metros de altura na tela. dur = tempo da passagem. */
export function tomada(t, x, y, altura = 4, dur = 1.0, o = {}) {
  const D = 70, fov = 2 * Math.atan(altura / 2 / D) * 180 / Math.PI;
  orb(t, V(x, y, 0), o.giro ?? 0, o.altura ?? 0, D, fov, dur, o.drift ?? 0.03, { spin: o.spin ?? 0.0035 * (o.lado ?? 1), bob: o.bob ?? (1.1 * altura / D), livre: true });
}

/* ------------------------------------------------------------------ o boneco modelo (2D, de perfil 3/4, virado pra direita)
   look: { camisa, calca, cabelo, pele, sapato, oculos, bone } (cores '#rrggbb'). Altura ≈ 1,72 m. Pés em y = 0.
   Pra virar pra esquerda: boneco.scale.x = -1.                                                                          */
export function boneco(look = {}) {
  const C = Object.assign({}, COR, look.pele ? { pele: look.pele, peleSombra: tom(look.pele, -0.12) } : {},
    look.camisa ? { camisa: look.camisa, camisaSombra: tom(look.camisa, -0.12) } : {}, look.calca ? { calca: look.calca, calcaSombra: tom(look.calca, -0.15) } : {},
    look.cabelo ? { cabelo: look.cabelo } : {}, look.sapato ? { sapato: look.sapato } : {});
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  g.add(sombra(0.62));
  const legs = [], arms = [];
  const perna = (sx, zz, cor, corSap) => {
    const hip = new THREE.Group(); hip.position.set(sx * 0.05, 0.8, zz); body.add(hip);
    hip.add(retPend(0.12, 0.43, cor, { r: 0.05 }));
    const knee = new THREE.Group(); knee.position.y = -0.4; hip.add(knee);
    knee.add(retPend(0.105, 0.4, cor, { r: 0.045 }));
    const foot = new THREE.Group(); foot.position.y = -0.37; knee.add(foot);
    foot.add(at(ret(0.23, 0.075, corSap, { r: 0.035 }), 0.05, -0.012, 0.001), at(ret(0.23, 0.022, C.sola, { r: 0.01 }), 0.05, -0.045, 0.002));
    legs.push({ hip, knee, foot, sx });
  };
  const braco = (sx, zz, pele, manga) => {
    const sh = new THREE.Group(); sh.position.set(sx * 0.02, 1.33, zz); body.add(sh);
    sh.add(retPend(0.08, 0.3, pele, { r: 0.04 }), at(retPend(0.125, 0.16, manga, { r: 0.055 }), 0, 0.035, 0.001));
    const el = new THREE.Group(); el.position.y = -0.27; sh.add(el);
    el.add(retPend(0.075, 0.27, pele, { r: 0.037 }));
    const hand = at(circ(0.052, pele), 0, -0.27, 0.001); el.add(hand);
    const handP = new THREE.Group(); handP.position.y = -0.29; el.add(handP);
    arms.push({ sh, el, handP, sx, L1: 0.27, L2: 0.29, dobra: -1 });
  };
  perna(-1, -0.03, C.calcaSombra, tom(C.sapato, -0.1));
  braco(-1, -0.04, C.peleSombra, C.camisaSombra);
  // tronco: camisa com sombra nas costas e gola
  const torso = new THREE.Group(); body.add(torso);
  const tShape = (sombraSo) => { const sh = new THREE.Shape(); if (sombraSo) { sh.moveTo(-0.165, 0); sh.lineTo(-0.07, 0); sh.quadraticCurveTo(-0.09, 0.4, -0.06, 0.6); sh.lineTo(-0.1, 0.6); sh.quadraticCurveTo(-0.2, 0.58, -0.195, 0.42); sh.closePath(); return sh; }
    sh.moveTo(-0.165, 0); sh.lineTo(0.15, 0); sh.quadraticCurveTo(0.185, 0.3, 0.175, 0.44); sh.quadraticCurveTo(0.17, 0.6, 0.06, 0.6); sh.lineTo(-0.1, 0.6); sh.quadraticCurveTo(-0.2, 0.58, -0.195, 0.42); sh.quadraticCurveTo(-0.19, 0.2, -0.165, 0); return sh; };
  torso.add(at(chapa(tShape(false), C.camisa), 0, 0.77, 0));
  torso.add(at(chapa(tShape(true), C.camisaSombra), 0, 0.77, 0.001));
  torso.add(at(ret(0.32, 0.07, C.calca, { r: 0.02 }), 0, 0.79, 0.002));
  torso.add(at(elipse(0.075, 0.04, C.peleSombra), 0.02, 1.37, 0.002));
  // cabeça
  const headP = new THREE.Group(); headP.position.set(0.02, 1.53, 0.01); body.add(headP);
  headP.add(at(ret(0.08, 0.1, C.peleSombra, { r: 0.02 }), -0.01, -0.12, -0.002));
  headP.add(elipse(0.155, 0.17, C.pele));
  headP.add(at(circ(0.034, C.pele), 0.152, -0.015, 0.001));                         // nariz
  headP.add(at(elipse(0.035, 0.045, C.peleSombra), -0.05, -0.005, 0.002));          // orelha
  const hair = new THREE.Group(); headP.add(hair); hair.position.z = 0.003;
  hair.add(at(poli([[-0.17, -0.02], [-0.16, 0.1], [-0.09, 0.17], [0.03, 0.195], [0.12, 0.16], [0.165, 0.08], [0.13, 0.085], [0.05, 0.11], [-0.03, 0.1], [-0.08, 0.04], [-0.1, -0.06], [-0.15, -0.09]], C.cabelo), 0, 0, 0));
  const eyes = new THREE.Group(); eyes.position.set(0.075, 0.025, 0.004); headP.add(eyes);
  eyes.add(elipse(0.021, 0.026, C.olho));
  const brow = at(ret(0.06, 0.016, C.cabelo, { r: 0.008 }), 0.075, 0.085, 0.004); headP.add(brow);
  const mouths = {
    sorriso: at(elipse(0.045, 0.03, C.boca, { a0: Math.PI, a1: Math.PI * 2 }), 0.085, -0.075, 0.004),
    aberta: at(elipse(0.035, 0.04, C.boca), 0.09, -0.085, 0.004),
    triste: at(elipse(0.04, 0.022, C.boca, { a0: 0, a1: Math.PI }), 0.085, -0.1, 0.004),
    reta: at(ret(0.06, 0.014, C.boca, { r: 0.007 }), 0.088, -0.085, 0.004),
  };
  for (const k in mouths) headP.add(mouths[k]);
  if (look.oculos) { headP.add(at(anel(0.034, 0.046, look.oculos), 0.08, 0.025, 0.006)); headP.add(at(ret(0.12, 0.014, look.oculos), 0.0, 0.035, 0.006)); }
  if (look.bone) { headP.add(at(poli([[-0.16, 0.06], [-0.1, 0.18], [0.06, 0.2], [0.15, 0.12], [0.15, 0.07]], look.bone), 0, 0, 0.007)); headP.add(at(ret(0.16, 0.03, tom(look.bone, -0.15), { r: 0.015 }), 0.19, 0.075, 0.007)); }
  braco(1, 0.05, C.pele, C.camisa);
  perna(1, 0.03, C.calca, C.sapato);
  // ordem de desenho: perna da frente na frente do tronco, braço da frente na frente de tudo
  legs[1].hip.position.z = 0.02; arms[1].sh.position.z = 0.04; headP.position.z = 0.015;
  g.userData = { body, headP, eyes, brow, mouths, hair, arms, legs, torso, plano2d: true };
  return g;
}
function tom(hex, d) { const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, clamp(hsl.l + d)); return '#' + c.getHexString(); }

/** anima o boneco. st: { humor -1..1, fala 0..1 (boca mexendo), andar 0..1, passo (velocidade), pose, poseK 0..1, olhar -1..1 }
 *  poses: 'comemora' (braços pra cima e pulinho) | 'aponta' | 'pensa' | 'susto' | 'tchau' | 'segura' (braços pra frente)  */
export function animar(p, t, st = {}) {
  const u = p.userData, humor = st.humor ?? 0.3, andar = st.andar ?? 0, fala = st.fala ?? 0;
  // respiração e balanço
  u.body.position.y = Math.sin(t * 2.2) * 0.006;
  // boca e sobrancelha
  const falando = fala > 0.05 && Math.sin(t * 22) > 0;
  for (const k in u.mouths) u.mouths[k].visible = false;
  (falando ? u.mouths.aberta : humor > 0.15 ? u.mouths.sorriso : humor < -0.15 ? u.mouths.triste : u.mouths.reta).visible = true;
  if (st.boca && u.mouths[st.boca]) { for (const k in u.mouths) u.mouths[k].visible = false; u.mouths[st.boca].visible = true; }
  u.brow.rotation.z = humor < 0 ? -0.35 * -humor : 0.12 * humor; u.brow.position.y = 0.085 + (st.pose === 'susto' ? 0.02 * (st.poseK ?? 1) : 0);
  const bl = (t * 0.37 + 0.13) % 1; u.eyes.scale.y = bl < 0.03 ? 0.15 : 1;   // piscar de olho
  // pernas e braços: parado ou andando
  const ph = t * (st.passo ?? 7);
  u.legs.forEach((L, i) => { const s = Math.sin(ph + i * Math.PI) * 0.5 * andar; L.hip.rotation.z = s; L.knee.rotation.z = -Math.max(0, -Math.sin(ph + i * Math.PI)) * 0.7 * andar; L.foot.rotation.z = 0; });
  u.body.position.y += Math.abs(Math.sin(ph)) * 0.025 * andar;
  u.arms.forEach((A, i) => { A.sh.rotation.z = -Math.sin(ph + i * Math.PI) * 0.45 * andar + (i ? 0.08 : -0.05); A.el.rotation.z = 0.25 + 0.2 * andar; });
  u.headP.rotation.z = (st.olhar ?? 0) * 0.15 + (humor < -0.3 ? -0.08 : 0);
  pose(p, t, st.pose, st.poseK ?? 1);
}
export function pose(p, t, nome, k = 1) {
  if (!nome || k <= 0.001) return;
  const u = p.userData, [B, F] = u.arms;   // B = braço de trás, F = braço da frente
  const set = (A, sh, el) => { A.sh.rotation.z = lerp(A.sh.rotation.z, sh, k); A.el.rotation.z = lerp(A.el.rotation.z, el, k); };
  if (nome === 'comemora') { set(B, 2.7 + 0.15 * Math.sin(t * 13), 0.2); set(F, 2.5 + 0.15 * Math.sin(t * 13 + 1), 0.25); u.body.position.y += Math.abs(Math.sin(t * 9)) * 0.07 * k; for (const k2 in u.mouths) u.mouths[k2].visible = false; u.mouths.aberta.visible = true; }
  else if (nome === 'aponta') { set(F, 1.55, 0.05); }
  else if (nome === 'segura') { set(F, 1.2, 0.5); set(B, 1.25, 0.45); }
  else if (nome === 'pensa') { set(F, 0.4, 2.6); u.headP.rotation.z = lerp(u.headP.rotation.z, 0.12, k); }
  else if (nome === 'susto') { set(F, 2.3, 0.9); set(B, 2.2, 1.0); for (const k2 in u.mouths) u.mouths[k2].visible = false; u.mouths.aberta.visible = true; }
  else if (nome === 'tchau') { set(F, 2.6, 0.5 + 0.45 * Math.sin(t * 10)); }
}

/* ------------------------------------------------------------------ cenários */
export const CEUS = { sol: COR.ceu, nublado: ['#8e93a8', '#a9adbd', '#c9ccd6'], noite: ['#0d1230', '#1d2452', '#3a3f6e'] };
/** céu do estilo: E.ceuDoEstilo('sol' | 'nublado' | 'noite') ou uma lista de 3 cores */
export function ceuDoEstilo(c = 'sol') { ceu(...(Array.isArray(c) ? c : CEUS[c] || COR.ceu)); }
/** fundo distante: sol, mar e silhueta de cidade (fica bem atrás: parallax) */
export function horizonte(o = {}) {
  // o.clima: 'sol' (padrão, pôr do sol) | 'nublado' (cinza, sem sol) | 'noite' (lua e janelas acesas)
  const g = new THREE.Group(), z = o.z ?? -30, w = o.largura ?? 60, clima = o.clima || 'sol';
  if (clima !== 'sol') { o = Object.assign({}, o, { solR: clima === 'noite' ? (o.solR ?? 0.45) : 0.0001 }); }
  const SOL = clima === 'noite' ? '#f2f0dc' : COR.sol, NUV = clima === 'nublado' ? '#9aa0b4' : clima === 'noite' ? '#3a4266' : '#fbe3c4', MAR = clima === 'sol' ? COR.mar : clima === 'noite' ? '#2b2f5a' : '#6d7393', PRED = clima === 'sol' ? ['#b58fbf', '#a37fb3'] : clima === 'noite' ? ['#3b3a66', '#33325a'] : ['#8d8aa8', '#7f7c9c'];
  const sr = o.solR ?? 1.4;
  g.add(at(circ(sr, SOL), o.solX ?? -2.5, o.solY ?? 5.2, z - 1));
  g.add(at(circ(sr * 1.35, SOL, { opacity: 0.35 }), o.solX ?? -2.5, o.solY ?? 5.2, z - 1.01));
  for (let i = 0; i < (o.nuvens ?? 4); i++) { const nx = -6 + 12 * hash(i * 4.3), ny = (o.solY ?? 5.2) + 0.4 + 2.2 * hash(i * 2.9), k = 0.6 + 0.6 * hash(i); g.add(at(ret(1.6 * k, 0.32 * k, NUV, { r: 0.16 * k }), nx, ny, z - 0.2), at(circ(0.3 * k, NUV), nx - 0.25 * k, ny + 0.15 * k, z - 0.21), at(circ(0.4 * k, NUV), nx + 0.2 * k, ny + 0.2 * k, z - 0.21)); }
  const my = o.marY ?? 2.0, mh = o.marAltura ?? 1.4;
  g.add(at(retBase(w, mh, MAR), 0, my, z));
  for (let i = 0; i < 14; i++) g.add(at(ret(0.6 + 1.6 * hash(i), 0.05, COR.marLuz, { r: 0.025 }), -8 + 16 * hash(i * 3.7), my + 0.15 + (mh - 0.3) * hash(i * 1.9), z + 0.01));
  const ch = o.cidadeAltura ?? 3.5;
  for (let i = 0; i < 22; i++) {
    const bw = 0.8 + 1.4 * hash(i * 5.1), bh = ch * (0.3 + 0.7 * hash(i * 2.3)), x = -w / 2 + i * (w / 22) + hash(i) * 0.6;
    g.add(at(retBase(bw, bh, i % 3 ? PRED[0] : PRED[1]), x, my + mh - 0.1, z - 0.5));
    if (clima === 'noite') for (let j = 0; j < 3; j++) if (hash(i * 9 + j) > 0.4) g.add(at(ret(0.12, 0.16, '#ffd97a'), x - bw * 0.25 + j * bw * 0.25, my + mh + 0.2 + bh * 0.6 * hash(i + j * 3), z - 0.49));
  }
  return g;
}
/** chão de rua visto de frente: calçada com ondinhas + meio-fio + asfalto na frente */
export function rua(o = {}) {
  const g = new THREE.Group(), w = o.largura ?? 16;
  g.add(retPadrao(w, 0.62, (x, cw, ch) => { x.fillStyle = COR.calcada; x.fillRect(0, 0, cw, ch); x.strokeStyle = COR.onda; x.lineWidth = 16; for (let yy = 30; yy < ch; yy += 64) { x.beginPath(); for (let xx = 0; xx <= cw; xx += 4) x.lineTo(xx, yy + Math.sin(xx / cw * Math.PI * 2) * 14); x.stroke(); } }, { x: 0, y: -0.28, z: -0.6, tam: 1.2, tamY: 0.62 }));
  g.add(at(ret(w, 0.06, '#d2cfc7'), 0, -0.6, -0.55));
  g.add(at(ret(w, 1.2, COR.asfalto), 0, -1.23, 0.5));
  g.add(at(ret(w, 0.05, '#c9c6bd'), 0, 0.03, -0.62));
  return g;
}
/** fachada de prédio: larg × andares (cada andar 1,6 m), com janelas, toldo listrado, porta e escada em zigue-zague */
export function predio(o = {}) {
  const g = new THREE.Group(), lw = o.largura ?? 6, n = o.andares ?? 3, ah = 1.6, z = o.z ?? -1.5;
  const cor = o.cor ?? COR.creme;
  g.add(at(retBase(lw, n * ah + 0.3, cor), 0, 0, z));
  g.add(at(retBase(lw, 0.55, COR.petroleo), 0, 0, z + 0.01));
  for (let a = 1; a < n; a++) g.add(at(ret(lw, 0.08, COR.cremeSombra), 0, a * ah, z + 0.01));
  for (let a = 1; a < n; a++) for (let j = 0; j < (o.janelas ?? 3); j++) {
    const x = -lw / 2 + (j + 0.5) * lw / (o.janelas ?? 3), y = a * ah + 0.75;
    g.add(at(ret(0.82, 0.92, COR.petroleoEsc, { r: 0.04 }), x, y, z + 0.02), at(ret(0.7, 0.8, '#bfe3e0', { r: 0.03 }), x, y, z + 0.03), at(ret(0.04, 0.8, COR.petroleoEsc), x, y, z + 0.04), at(ret(0.9, 0.06, COR.mostarda), x, y - 0.5, z + 0.04));
  }
  // térreo: porta de vidro com moldura dourada, toldo listrado
  g.add(at(ret(1.3, 1.9, COR.mostardaEsc, { r: 0.02 }), o.portaX ?? 0, 0.95, z + 0.02), at(ret(1.15, 1.8, '#f2e7c9', { r: 0.02 }), o.portaX ?? 0, 0.95, z + 0.03), at(ret(0.04, 1.8, COR.mostardaEsc), o.portaX ?? 0, 0.95, z + 0.04));
  const tw = 2.2, tx = o.portaX ?? 0;
  for (let i = 0; i < 8; i++) g.add(at(poli([[0, 0], [tw / 8, 0], [tw / 8, -0.32], [tw / 16, -0.42], [0, -0.32]], i % 2 ? '#ffffff' : COR.petroleo), tx - tw / 2 + i * tw / 8, 2.35, z + 0.08));
  g.add(at(ret(tw + 0.1, 0.12, COR.petroleoEsc), tx, 2.38, z + 0.09));
  if (o.escada !== false) {
    const ex = (o.escadaX ?? lw / 2 - 1.0), pts = [];
    for (let a = 0; a < n; a++) { const y0 = a * ah + 0.55, y1 = (a + 1) * ah + 0.3; pts.push(a % 2 ? [[ex + 0.6, y0], [ex - 0.6, y1]] : [[ex - 0.6, y0], [ex + 0.6, y1]]); }
    pts.forEach(([p0, p1]) => { g.add(traco([[p0[0], p0[1]], [p1[0], p1[1]]], 0.07, '#ffffff', { z: z + 0.05 })); g.add(traco([[p0[0], p0[1] + 0.45], [p1[0], p1[1] + 0.45]], 0.05, COR.petroleo, { z: z + 0.06 })); });
  }
  return g;
}
/** planta num vaso (folhas chapadas) */
export function planta(o = {}) {
  const g = new THREE.Group(), s = o.tam ?? 1;
  for (let i = 0; i < 7; i++) { const a = -1.2 + i * 0.4; const f = elipse(0.11 * s, 0.32 * s, i % 2 ? COR.verde : COR.verdeClaro, { z: 0.004 * i }); f.position.set(Math.sin(a) * 0.18 * s, 0.42 * s + Math.cos(a) * 0.16 * s, 0); f.rotation.z = -a * 0.8; g.add(f); }
  g.add(at(poli([[-0.17 * s, 0.3 * s], [0.17 * s, 0.3 * s], [0.13 * s, 0], [-0.13 * s, 0]], o.vaso ?? COR.mostarda), 0, 0, 0.02));
  return g;
}
export function arvore(o = {}) {
  const g = new THREE.Group(), s = o.tam ?? 1;
  g.add(retBase(0.16 * s, 1.1 * s, '#7a5236'));
  g.add(at(circ(0.7 * s, COR.verde), 0, 1.5 * s, 0.01), at(circ(0.5 * s, COR.verdeClaro), -0.35 * s, 1.25 * s, 0.02), at(circ(0.45 * s, COR.verdeClaro), 0.4 * s, 1.75 * s, 0.02));
  return g;
}
/** cômodo em corte (visto de frente): R = { x0, x1, y0 (chão), h (pé-direito) } */
export function sala(R = {}) {
  const x0 = R.x0 ?? -3, x1 = R.x1 ?? 3, y0 = R.y0 ?? 0, h = R.h ?? 2.8, w = x1 - x0, cx = (x0 + x1) / 2, z = R.z ?? -1.2;
  const g = new THREE.Group();
  g.add(at(retBase(w, h, R.parede ?? COR.parede), cx, y0, z));
  g.add(at(retBase(w, 0.12, COR.rodape), cx, y0, z + 0.01));
  g.add(at(ret(w, 0.42, COR.madeira), cx, y0 - 0.21, z + 0.6), at(ret(w, 0.05, COR.madeiraEsc), cx, y0 - 0.02, z + 0.61), at(ret(w, 0.03, COR.madeiraEsc), cx, y0 - 0.2, z + 0.61), at(ret(w, 0.06, '#4a3f55'), cx, y0 - 0.44, z + 0.62));
  // janela grande com o pôr do sol
  const jx = R.janelaX ?? cx + w * 0.22, jy = y0 + 1.55;
  g.add(at(ret(1.6, 1.4, COR.petroleoEsc, { r: 0.04 }), jx, jy, z + 0.01));
  g.add(at(retPadrao(1.45, 1.25, (x, cw, ch) => { const gr = x.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, COR.ceu[0]); gr.addColorStop(0.6, COR.ceu[1]); gr.addColorStop(1, COR.ceu[2]); x.fillStyle = gr; x.fillRect(0, 0, cw, ch); x.fillStyle = COR.sol; x.beginPath(); x.arc(cw * 0.3, ch * 0.45, cw * 0.12, 0, 7); x.fill(); x.fillStyle = COR.mar; x.fillRect(0, ch * 0.7, cw, ch * 0.3); x.fillStyle = '#b58fbf'; for (let i = 0; i < 6; i++) x.fillRect(i * cw / 6 + 6, ch * 0.5 + 20 * (i % 3), cw / 8, ch * 0.2); }, { tam: 1.45, tamY: 1.25 }), jx, jy, z + 0.02));
  g.add(at(ret(0.05, 1.25, COR.petroleoEsc), jx, jy, z + 0.03), at(ret(1.75, 0.08, COR.mostarda), jx, jy - 0.74, z + 0.03));
  // porta (opcional): R.porta = x do meio da porta
  if (R.porta !== undefined) { const px = R.porta; g.add(at(retBase(1.0, 2.15, COR.petroleoEsc, { r: 0.03 }), px, y0, z + 0.01), at(retBase(0.86, 2.05, R.corPorta ?? COR.marinho, { r: 0.02 }), px, y0, z + 0.02), at(circ(0.045, COR.mostarda), px + 0.3, y0 + 1.0, z + 0.03), at(ret(0.6, 0.5, tom(R.corPorta ?? COR.marinho, 0.08), { r: 0.02 }), px, y0 + 1.5, z + 0.025)); }
  // quadro e luminária
  g.add(at(ret(0.7, 0.55, COR.mostardaEsc), cx - w * 0.25, y0 + 1.85, z + 0.01), at(ret(0.6, 0.45, '#bfe3e0'), cx - w * 0.25, y0 + 1.85, z + 0.02), at(poli([[-0.3, -0.22], [-0.05, 0.08], [0.1, -0.05], [0.3, -0.22]], COR.verde), cx - w * 0.25, y0 + 1.85, z + 0.03));
  g.add(at(traco([[0, 0], [0, -0.5]], 0.02, '#333333'), cx - w * 0.05, y0 + h, z + 0.05), at(poli([[-0.18, 0], [0.18, 0], [0.1, 0.16], [-0.1, 0.16]], COR.mostarda), cx - w * 0.05, y0 + h - 0.66, z + 0.06), at(circ(0.06, '#fff4c2'), cx - w * 0.05, y0 + h - 0.68, z + 0.055));
  // paredes cortadas (laterais grossas) e laje
  g.add(at(retBase(0.22, h + 0.25, '#4a3f55'), x0 - 0.11, y0 - 0.05, z + 0.7), at(retBase(0.22, h + 0.25, '#4a3f55'), x1 + 0.11, y0 - 0.05, z + 0.7));
  g.add(at(ret(w + 0.44, 0.22, '#4a3f55'), cx, y0 + h + 0.09, z + 0.7));
  return g;
}
