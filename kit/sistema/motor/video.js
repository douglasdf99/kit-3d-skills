/* =====================================================================================
   MOTOR DO KIT — video.js
   Tudo o que é igual em todo vídeo: tela 1080x1920, câmera que nunca para, letreiros,
   plaquinhas, legenda palavra por palavra, balão de fala do boneco, assinatura do canal,
   lista de efeitos sonoros e a função que monta cada quadro.

   Um vídeo (Meus Videos/<tema>/cena/cena.js) importa daqui o que precisa:
     import { T, words, scene, camera, orb, label, chip, banner, som, iniciar, ... } from '../../../sistema/motor/video.js';
   (o montar_pagina.py e o conferir.py resolvem esses caminhos sozinhos)

   O estilo visual (fontes, tipo e cores dos letreiros, plaquinhas, legenda, céu, luzes, textura, boneco) vem do
   estilo escolhido (biblioteca/estilos/<estilo>/estilo.json) — não escreva cor/fonte de letreiro na cena.
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, pop, hash } from './lib.js';

const G = globalThis;
export const W = 1080, H = 1920, FPS = 30;
/** true quando a cena roda no conferir.py (sem navegador): nada é desenhado de verdade */
export const DRY = !!G.__DRYRUN__;

/* ------------------------------------------------------------------ estilo + canal */
const ESTILO_PADRAO = {
  nome: 'Padrão',
  letreiro: { tipo: 'contorno', fonte: 'Montserrat', peso: 900, cor: '#FFD21F', contorno: '#111111', espessura: 0.2, sombra: 'rgba(0,0,0,0.35)', sombraY: 7, inclinacao: 1, maiusculas: false, espacamento: 0 },
  plaquinha: { tipo: 'pilula_branca', fonte: 'Montserrat', peso: 800 },
  legenda: { fonte: 'Montserrat', peso: 800, tamanho: 80, y: 1330, cor: '#ffffff', destaque: '#FFD21F', contorno: '#000000', espessura: 15, sombra: 'rgba(0,0,0,0.4)', sombraY: 7, caixa: null, maiusculas: false, pulo: 0.12, animacao: 'pulo', brilho: null, espacamento: 0 },
  fala: { fonte: 'Montserrat', peso: 900, contorno: '#111111', alegre: { fundo: '#fff36b', texto: '#e8590c' }, triste: { fundo: '#dfe7f2', texto: '#3d4a5c' } },
  assinatura: { fonte: 'Montserrat', peso: 800, tamanho: 72, y: 1120, fundo: 'rgba(0,0,0,0.42)', cor: '#ffffff' },
  vinheta: 0.3,
  ceu: null,        // { cores: [topo, meio, base], sempre: true/false, padrao: 'grade'|'pauta'|'pontos'|'linhas'|null, padraoCor, padraoForca }
  luz: null,        // { hemi: [céu, chão, força], sol: [cor, força, [x,y,z]], contra: [cor, força, [x,y,z]] } (usado por luzes())
  filtro3d: null,   // filtro CSS aplicado só na imagem 3D, ex.: 'saturate(1.3) contrast(1.05)'
  textura: null,    // textura por cima do quadro inteiro: 'grao' | 'linhas' | 'meio_tom' | 'papel' | null
  texturaForca: 0.25,
  boneco: { camiseta: '#f6f4ef', cabelo: '#16161a', penteado: 'curto', pele: '#f0b98a', bermuda: '#1f3462', calca: true, tenis: '#2b2f36', faixa: null, oculos: null },   // o boneco modelo do kit
};
function merge(a, b) { const o = Array.isArray(a) ? a.slice() : { ...a }; for (const k in b || {}) o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a && typeof a[k] === 'object') ? merge(a[k], b[k]) : b[k]; return o; }
export const ESTILO = merge(ESTILO_PADRAO, G.__ESTILO__ || {});
export const CANAL = merge({ nome: 'Meu Canal', idioma: 'pt', assinatura: true }, G.__CANAL__ || {});
const fam = (f) => (/\s/.test(f) ? `'${f}'` : f);
/** família da fonte dos letreiros / das plaquinhas, pronta pra usar em g2.font: `900 60px ${FT}` */
export const FT = fam(ESTILO.letreiro.fonte), FP = fam(ESTILO.plaquinha.fonte);
export const fonte = (peso, tam, qual = 'letreiro') => `${peso ?? ESTILO[qual].peso} ${tam}px ${fam(ESTILO[qual].fonte)}`;
const hex = (c) => (typeof c === 'string' ? parseInt(c.replace('#', ''), 16) : c);
/** o boneco no visual do estilo → passe em buildPerson({ standing: true, look: LOOK }) */
export const LOOK = lookDe(ESTILO.boneco || {});
/** traduz um "boneco" (estilo.json / personagem.json, chaves em português) pro look do buildPerson.
 *  Chaves: camiseta, faixa, cabelo, penteado (franja | topete | cachos | rabo | coque | comprido | careca | espetado | curto), cor_elastico,
 *  pele, bermuda, calca (true = calça), tenis, oculos, barba, bigode, chapeu (bone | bone_tras | capacete | chapeu | palha | touca | chef),
 *  cor_chapeu, faixa_chapeu, casaco (jaleco | colete | avental | macacao), cor_casaco, bolso (true), item_bolso (parafuso | caneta | lapis | chave),
 *  gravata, gravata_borboleta. Cores em '#rrggbb'. */
export function lookDe(b) {
  const pent = b.penteado || 'curto';
  const cor = (c) => (c ? hex(c) : undefined);
  return {
    shirt: hex(b.camiseta), hair: hex(b.cabelo), skin: hex(b.pele), shorts: hex(b.bermuda), shoes: hex(b.tenis),
    pants: b.calca ?? true, franja: pent === 'franja', stripe: cor(b.faixa), glasses: cor(b.oculos),
    quiff: pent === 'topete', curls: pent === 'cachos', hairstyle: ['rabo', 'coque', 'comprido', 'careca', 'espetado', 'curto'].includes(pent) ? pent : undefined, hairBand: cor(b.cor_elastico),
    beard: cor(b.barba), mustache: cor(b.bigode),
    hat: b.chapeu || undefined, hatColor: cor(b.cor_chapeu), hatBand: cor(b.faixa_chapeu),
    coat: b.casaco || undefined, coatColor: cor(b.cor_casaco),
    pocket: !!b.bolso, pocketItem: b.item_bolso || undefined, tie: cor(b.gravata), bowtie: cor(b.gravata_borboleta),
  };
}

/* ------------------------------------------------------------------ narração (timeline) + âncoras */
export const TL = G.__TIMELINE__;
if (!TL || !TL.words) throw new Error('Narração não encontrada. Rode primeiro: python3 sistema/ferramentas/narrar.py "Meus Videos/<tema>"');
export const words = TL.words;
export const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
/**
 * Momento (em segundos) em que a narração fala um trecho.  T('esse e o filamento') → início de "esse".
 * occ = qual ocorrência (1ª, 2ª...). end = true → fim da última palavra do trecho.
 * Acentos e pontuação são ignorados. Se o trecho não existir, o erro mostra palavras parecidas.
 */
export function T(phrase, occ = 1, end = false) {
  const p = phrase.split(/\s+/).filter(Boolean).map(norm); let c = 0;
  for (let i = 0; i <= words.length - p.length; i++) {
    let ok = true;
    for (let j = 0; j < p.length; j++) if (words[i + j].n !== p[j]) { ok = false; break; }
    if (ok && ++c === occ) return end ? words[i + p.length - 1].e : words[i].s;
  }
  const near = words.filter((w) => w.n.startsWith(p[0].slice(0, 3))).map((w) => w.w).slice(0, 8);
  throw new Error(`Âncora não encontrada na narração: T('${phrase}'${occ > 1 ? ', ' + occ : ''}). ` + (c ? `Só aparece ${c} vez(es). ` : '') + (near.length ? 'Palavras parecidas: ' + near.join(', ') : 'Confira o roteiro.txt.'));
}
/** fim da narração (última palavra) */
export const FIM_NARRACAO = words[words.length - 1].e;

/* ------------------------------------------------------------------ renderer / cena / câmera */
export const QP = new URLSearchParams(G.location && G.location.search ? G.location.search : '');
function stub() { const f = function () { return p; }; const p = new Proxy(f, { get: (o, k) => (k === Symbol.toPrimitive ? () => 0 : k in o ? o[k] : p), set: () => true, apply: () => p }); return p; }
export const renderer = DRY ? Object.assign(stub(), { domElement: document.createElement('canvas'), shadowMap: {} }) :
  new THREE.WebGLRenderer({ antialias: QP.get('aa') !== '0', preserveDrawingBuffer: true, alpha: true });
let RS = +(QP.get('rs') || 1);
if (!DRY) {
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1); renderer.setSize(Math.round(W * RS), Math.round(H * RS));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const holder = document.getElementById('webgl') || document.body; holder.appendChild(renderer.domElement);
}
/** prévia leve: 0.5 = metade da resolução 3D (os textos continuam nítidos). O render final usa 1. */
export function setEscala(rs) { if (DRY || rs === RS) return; RS = rs; renderer.setSize(Math.round(W * RS), Math.round(H * RS)); }
G.setEscala = setEscala;
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(40, W / H, 0.02, 100);
/** fundo atrás do 3D (o 3D é transparente onde não tem nada). ceu('#0b1424', '#1a2740') pinta um degradê. */
export const sky = document.createElement('canvas'); sky.width = W; sky.height = H;
export function ceu(topo, base, meio) {
  const E = ESTILO.ceu;
  if (E && E.cores && (E.sempre || topo === undefined)) { const c = E.cores; topo = c[0]; meio = c.length > 2 ? c[1] : undefined; base = c[c.length - 1]; }
  if (topo === undefined) { topo = '#5aa2e8'; meio = '#8cc4f2'; base = '#cfe9fb'; }
  const x = sky.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, topo); if (meio) g.addColorStop(0.55, meio); g.addColorStop(1, base); x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (E && E.padrao) padraoNoCeu(x, E.padrao, E.padraoCor || 'rgba(255,255,255,0.5)', E.padraoForca ?? 0.25, E.padraoPasso || 60);
}
/** desenha um padrão por cima do fundo: 'grade' (linhas cruzadas), 'pauta' (linhas de caderno), 'pontos' (bolinhas), 'linhas' (riscos diagonais) */
function padraoNoCeu(x, tipo, cor, forca, passo) {
  x.save(); x.globalAlpha = forca; x.strokeStyle = cor; x.fillStyle = cor; x.lineWidth = 2;
  if (tipo === 'grade') { for (let i = 0; i <= W; i += passo) { x.beginPath(); x.moveTo(i + 0.5, 0); x.lineTo(i + 0.5, H); x.stroke(); } for (let j = 0; j <= H; j += passo) { x.beginPath(); x.moveTo(0, j + 0.5); x.lineTo(W, j + 0.5); x.stroke(); } }
  else if (tipo === 'pauta') { x.lineWidth = 3; for (let j = passo; j <= H; j += passo) { x.beginPath(); x.moveTo(0, j + 0.5); x.lineTo(W, j + 0.5); x.stroke(); } x.strokeStyle = 'rgba(255,90,90,0.9)'; x.lineWidth = 4; x.beginPath(); x.moveTo(110, 0); x.lineTo(110, H); x.stroke(); }
  else if (tipo === 'pontos') { const r = Math.max(2, passo * 0.1); for (let j = passo / 2; j < H; j += passo) for (let i = passo / 2; i < W; i += passo) { x.beginPath(); x.arc(i, j, r, 0, 7); x.fill(); } }
  else if (tipo === 'linhas') { x.lineWidth = 2; for (let i = -H; i < W; i += passo) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + H, H); x.stroke(); } }
  x.restore();
}
ceu();
/** luzes padrão da série (céu + sol com sombra + contraluz), com as cores/forças do estilo escolhido (ESTILO.luz).
 *  const { sol } = luzes();   ou   luzes({ sol: ['#ffffff', 1.4, [-4, 9, 6]] }) pra mudar algo só nesta cena. */
export function luzes(o = {}) {
  const L = merge(merge({ hemi: ['#e3f2ff', '#cfb08a', 1.35], sol: ['#fff1dc', 2.1, [-5, 10, 7]], contra: ['#dbe9ff', 0.45, [6, 4, 8]], alvo: [0.5, 0, -0.5], sombra: { left: -6, right: 7, top: 6, bottom: -5 } }, ESTILO.luz || {}), o);
  const hemi = new THREE.HemisphereLight(new THREE.Color(L.hemi[0]), new THREE.Color(L.hemi[1]), L.hemi[2]); scene.add(hemi);
  const sol = new THREE.DirectionalLight(new THREE.Color(L.sol[0]), L.sol[1]); sol.position.set(...L.sol[2]); sol.target.position.set(...L.alvo);
  sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02;
  Object.assign(sol.shadow.camera, { near: 1, far: 30 }, L.sombra); scene.add(sol); scene.add(sol.target);
  const contra = new THREE.DirectionalLight(new THREE.Color(L.contra[0]), L.contra[1]); contra.position.set(...L.contra[2]); scene.add(contra);
  return { hemi, sol, contra };
}
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ------------------------------------------------------------------ câmera: tomadas (shots)
   Regra da série: a câmera NUNCA fica 100% parada e NÃO tem corte seco — cada tomada gira devagar
   em volta do alvo (spin), chega um pouquinho mais perto (drift) e flutua; a passagem de uma tomada
   pra outra é um movimento suave de `dur` segundos (dur = 0 só em casos raros, ex.: "voltar a fita").
   orb(t, alvo, giroGraus, alturaGraus, distancia, fov, dur, drift, {spin, bob})                       */
export const shots = [];
export function orb(t, tgt, yawD, pitchD, dist, fov = 40, dur = 1.0, drift = 0.07, o = {}) {
  const y = (yawD * Math.PI) / 180, p = (pitchD * Math.PI) / 180;
  const T3 = tgt.isVector3 ? tgt : V(...tgt);
  const pos = T3.clone().add(V(Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p)).multiplyScalar(dist));
  const spin = o.spin ?? (shots.length % 2 ? 0.045 : -0.045);
  shots.push({ t, pos, tgt: T3.clone(), fov, dur, drift, spin, bob: o.bob ?? 1, livre: !!o.livre });
}
/** tomada com posição de câmera exata (em vez de giro/altura/distância) */
export function shotAt(t, pos, tgt, fov = 40, dur = 1.0, drift = 0.05, o = {}) {
  const spin = o.spin ?? (shots.length % 2 ? 0.045 : -0.045);
  shots.push({ t, pos: pos.clone(), tgt: tgt.clone(), fov, dur, drift, spin, bob: o.bob ?? 1, livre: !!o.livre });
}
const spinAround = (pos, tgt, a) => { if (!a) return pos; const d = pos.clone().sub(tgt); const c = Math.cos(a), s = Math.sin(a); return tgt.clone().add(V(d.x * c + d.z * s, d.y, -d.x * s + d.z * c)); };
/**
 * Chame depois de criar todas as tomadas: ordena, dá um pouco mais de movimento na abertura
 * e limita o giro de tomadas longas (~12°), menos no final (`finalDesde`) e nas marcadas {livre:true}.
 */
export function fecharCameras({ duracao, aberturaAte = 0, finalDesde = Infinity, giroMax = 0.21, giroAbertura = 0.075 } = {}) {
  shots.sort((a, b) => a.t - b.t);
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i], len = (i + 1 < shots.length ? shots[i + 1].t : duracao) - s.t;
    if (s.t < aberturaAte) s.spin = Math.sign(s.spin || 1) * giroAbertura;
    if (!s.livre && Math.abs(s.spin) * len > giroMax && s.t < finalDesde) s.spin = Math.sign(s.spin) * giroMax / len;
  }
}
export function cameraAt(t) {
  let i = 0; while (i + 1 < shots.length && shots[i + 1].t <= t) i++;
  const cur = shots[i];
  if (!cur) return { pos: V(0, 1.4, 4), tgt: V(0, 1, 0), fov: 40 };
  const poseOf = (s, tt) => {
    const e = Math.max(0, tt - s.t), k = clamp(e / 8) * s.drift;
    const d = s.pos.distanceTo(s.tgt);
    const tgt = s.tgt.clone().add(V(0, Math.sin(e * 0.9) * 0.012 * d * s.bob, 0));
    const pos = spinAround(s.pos.clone().lerp(s.tgt, k), s.tgt, s.spin * e).add(V(0, Math.sin(e * 0.7 + 1) * 0.01 * d * s.bob, 0));
    return { pos, tgt, fov: s.fov };
  };
  const a = poseOf(cur, t);
  if (i > 0 && cur.dur > 0 && t < cur.t + cur.dur) {
    const prev = poseOf(shots[i - 1], cur.t); const k = ease.inOut(clamp((t - cur.t) / cur.dur));
    a.pos = prev.pos.clone().lerp(a.pos, k); a.pos.y += Math.sin(k * Math.PI) * 0.03;
    a.tgt = prev.tgt.clone().lerp(a.tgt, k); a.fov = lerp(prev.fov, a.fov, k);
  }
  return a;
}
export function aplicarCamera(t) { const c = cameraAt(t); camera.position.copy(c.pos); camera.lookAt(c.tgt); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); return c; }

/* ------------------------------------------------------------------ textos por cima do 3D */
export const ov = document.createElement('canvas'); ov.width = W; ov.height = H;
export const g2 = ov.getContext('2d', DRY ? undefined : { willReadFrequently: true });
export const labels = [];
/** letreiro grande = NOME DA PEÇA, na hora do "Esse é o X" (ex.: label('FILAMENTO', A.filamento, A.filamento + 1.6, () => FIL.clone())).
 *  Opções: { dy (pra cima/baixo, em pixels; padrão -150), dx (pros lados), size, rot, semPop, fill } */
export function label(text, t0, t1, anchor, o = {}) { labels.push(Object.assign({ text, t0, t1, anchor, kind: 'label', dy: -150, size: 66, rot: -0.07 }, o)); }
/** plaquinha = informação curta presa num objeto (temperatura, medida, "NÃO QUEIMA"…). color = cor de destaque */
export function chip(text, t0, t1, anchor, color, o = {}) { labels.push(Object.assign({ text, t0, t1, anchor, kind: 'chip', color, dy: -90, size: 46, rot: 0 }, o)); }
/** faixa no topo da tela, sem objeto (ex.: a chamada final 'COMENTE “LUZ”' — use { semPop: true } nela) */
export function banner(text, t0, t1, o = {}) { labels.push(Object.assign({ text, t0, t1, anchor: null, kind: 'label', screen: [W / 2, 300], size: 72, rot: -0.05 }, o)); }
/** posição (mundo) de um objeto + deslocamento, pra usar como âncora de letreiro */
export const wpos = (o, off = V(0, 0, 0)) => () => { o.updateMatrixWorld(true); return o.getWorldPosition(new THREE.Vector3()).add(off); };
export function project(v) { const p = v.clone().project(camera); return [(p.x * 0.5 + 0.5) * W, (-p.y * 0.5 + 0.5) * H, p.z]; }

/** letreiro grande. tipo (ESTILO.letreiro.tipo): 'contorno' (padrão da série) | 'neon' | 'quadrinho' | 'linha' | 'fita' | 'tecnico'.
 *  ax, ay = ponto do objeto na tela (pros tipos que desenham uma linha até ele). */
export function drawTag(x, y, text, size, rot, s, fillC, ax, ay) {
  const E = ESTILO.letreiro, tipo = E.tipo || 'contorno';
  if (E.maiusculas) text = text.toUpperCase();
  g2.save(); g2.translate(x, y); g2.scale(s, s);
  const lx = ax === undefined ? null : (ax - x) / s, ly = ay === undefined ? null : (ay - y) / s;   // objeto, no sistema local (antes da rotação)
  g2.rotate(rot * (E.inclinacao ?? 1));
  g2.font = fonte(E.peso, size); g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.lineJoin = 'round'; g2.miterLimit = 2;
  g2.fontKerning = 'none';   // algumas fontes juntam letra acentuada com a vizinha ("ÁV") quando o ajuste automático está ligado
  if (E.espacamento) g2.letterSpacing = (size * E.espacamento) + 'px';
  const cor = fillC || E.cor, tw = g2.measureText(text).width;
  if (tipo === 'neon') {               // tubo de neon: brilho colorido em volta, miolo claro
    g2.shadowColor = cor; g2.shadowBlur = size * 0.5; g2.fillStyle = cor; g2.fillText(text, 0, 0); g2.fillText(text, 0, 0);
    g2.shadowBlur = size * 0.18; g2.fillText(text, 0, 0); g2.shadowBlur = 0; g2.shadowColor = 'transparent';
    g2.lineWidth = size * (E.espessura ?? 0.05); g2.strokeStyle = E.contorno || 'rgba(0,0,0,0.6)'; g2.strokeText(text, 0, 0);
    g2.fillStyle = cor; g2.fillText(text, 0, 0); g2.globalAlpha = E.nucleoAlfa ?? 0.5; g2.fillStyle = E.nucleo || '#ffffff'; g2.fillText(text, 0, 0);
  } else if (tipo === 'quadrinho') {   // gibi: contorno preto grosso + sombra dura colorida deslocada
    const dx = E.sombraX ?? size * 0.09, dy = E.sombraY ?? size * 0.09;
    g2.lineWidth = size * (E.espessura ?? 0.22); g2.strokeStyle = E.contorno || '#111111';
    g2.strokeText(text, dx, dy); g2.fillStyle = E.sombraDura || '#d62828'; g2.fillText(text, dx, dy);
    g2.strokeText(text, 0, 0); g2.fillStyle = cor; g2.fillText(text, 0, 0);
  } else if (tipo === 'linha') {       // limpo: pílula clara, texto escuro, linha fina até o objeto com uma bolinha
    const mt = g2.measureText(text), asc = mt.actualBoundingBoxAscent || size * 0.7, desc = mt.actualBoundingBoxDescent || 0;
    const pw = tw + size * 1.1, ph = E.centralizar ? Math.max(size * 1.5, asc + desc + size * 0.6) : size * 1.5, r = ph / 2;
    const ty = E.centralizar ? (asc - desc) / 2 : size * 0.04;   // centralizar: o meio das letras de verdade (com acento/til) no meio da caixa
    if (lx !== null && (Math.abs(lx) > pw / 2 + 10 || Math.abs(ly) > ph / 2 + 10)) {
      g2.strokeStyle = E.linhaCor || E.cor; g2.lineWidth = size * 0.06; g2.beginPath(); g2.moveTo(0, ly < 0 ? -ph / 2 : ph / 2); g2.lineTo(lx, ly); g2.stroke();
      g2.fillStyle = E.ponto || E.linhaCor || E.cor; g2.beginPath(); g2.arc(lx, ly, size * 0.16, 0, 7); g2.fill();
      g2.fillStyle = E.fundo || '#ffffff'; g2.beginPath(); g2.arc(lx, ly, size * 0.08, 0, 7); g2.fill();
    }
    if (E.sombra) { g2.fillStyle = E.sombra; g2.beginPath(); g2.roundRect(-pw / 2, -ph / 2 + (E.sombraY ?? 6), pw, ph, r); g2.fill(); }
    g2.fillStyle = E.fundo || '#ffffff'; g2.beginPath(); g2.roundRect(-pw / 2, -ph / 2, pw, ph, r); g2.fill();
    if (E.borda) { g2.lineWidth = E.borda; g2.strokeStyle = E.bordaCor || E.linhaCor || cor; g2.stroke(); }
    g2.fillStyle = cor; g2.fillText(text, 0, ty);
  } else if (tipo === 'fita') {        // fita adesiva: retângulo translúcido com as pontas rasgadas, texto de canetão
    const pw = tw + size * 1.3, ph = size * 1.45, z = size * 0.12, n = Math.max(3, Math.round(ph / z));
    const forma = () => { g2.beginPath(); g2.moveTo(-pw / 2, -ph / 2); g2.lineTo(pw / 2, -ph / 2); for (let i = 0; i <= n; i++) g2.lineTo(pw / 2 + (i % 2 ? -z * 0.6 : 0), -ph / 2 + ph * i / n); g2.lineTo(-pw / 2, ph / 2); for (let i = n; i >= 0; i--) g2.lineTo(-pw / 2 + (i % 2 ? z * 0.6 : 0), -ph / 2 + ph * i / n); g2.closePath(); };
    if (E.sombra) { g2.save(); g2.translate(0, E.sombraY ?? 6); g2.fillStyle = E.sombra; forma(); g2.fill(); g2.restore(); }
    g2.fillStyle = E.fundo || 'rgba(250,224,120,0.9)'; forma(); g2.fill();
    g2.fillStyle = 'rgba(255,255,255,0.22)'; g2.fillRect(-pw / 2, -ph / 2, pw, ph * 0.18);
    g2.fillStyle = cor; g2.fillText(text, 0, size * 0.05);
  } else if (tipo === 'tecnico') {     // projeto: texto fino branco num quadro de linha, com cotinha até o objeto
    const pw = tw + size * 0.9, ph = size * 1.4, k = size * 0.22, c = E.contorno || cor;
    g2.strokeStyle = c; g2.lineWidth = size * (E.espessura ?? 0.045);
    if (lx !== null && (Math.abs(lx) > pw / 2 + 10 || Math.abs(ly) > ph / 2 + 10)) { g2.beginPath(); g2.moveTo(0, ly < 0 ? -ph / 2 : ph / 2); g2.lineTo(lx, ly); g2.stroke(); g2.beginPath(); g2.arc(lx, ly, size * 0.11, 0, 7); g2.stroke(); }
    if (E.fundo) { g2.fillStyle = E.fundo; g2.fillRect(-pw / 2, -ph / 2, pw, ph); }
    g2.strokeRect(-pw / 2, -ph / 2, pw, ph);
    g2.lineWidth = size * 0.09; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g2.beginPath(); g2.moveTo(sx * pw / 2, sy * ph / 2 - sy * k); g2.lineTo(sx * pw / 2, sy * ph / 2); g2.lineTo(sx * pw / 2 - sx * k, sy * ph / 2); g2.stroke(); }
    g2.fillStyle = cor; g2.fillText(text, 0, size * 0.04);
  } else if (tipo === 'pixel') {       // jogo de bloquinhos: caixa escura translúcida, borda clara de pixel, texto com sombra dura
    const pw = tw + size * 0.95, ph = size * 1.5, b = size * 0.075;
    g2.fillStyle = E.fundo || 'rgba(18,14,24,0.88)'; g2.fillRect(-pw / 2, -ph / 2, pw, ph);
    g2.fillStyle = E.borda1 || '#e8e8e8'; g2.fillRect(-pw / 2, -ph / 2, pw, b); g2.fillRect(-pw / 2, ph / 2 - b, pw, b); g2.fillRect(-pw / 2, -ph / 2, b, ph); g2.fillRect(pw / 2 - b, -ph / 2, b, ph);
    g2.fillStyle = E.borda2 || 'rgba(255,255,255,0.18)'; g2.fillRect(-pw / 2 + b, -ph / 2 + b, pw - 2 * b, b);
    if (lx !== null && (Math.abs(lx) > pw / 2 + 10 || Math.abs(ly) > ph / 2 + 10)) { g2.fillStyle = E.borda1 || '#e8e8e8'; const st = size * 0.18; const n = Math.max(2, Math.floor(Math.hypot(lx, ly) / (st * 1.8))); for (let i = 1; i < n; i++) { const k = i / n; g2.fillRect(lx * k - st / 2, (ly < 0 ? -ph / 2 : ph / 2) * (1 - k) + ly * k - st / 2, st, st); } }
    g2.fillStyle = E.sombra || '#3a3a3a'; g2.fillText(text, size * 0.08, size * 0.12); g2.fillStyle = cor; g2.fillText(text, 0, size * 0.04);
  } else if (tipo === 'jogo') {        // plaquinha de nome em jogo: texto branco com contorno escuro sobre tarja translúcida
    const pw = tw + size * 0.8, ph = size * 1.32;
    g2.fillStyle = E.fundo || 'rgba(0,0,0,0.42)'; g2.beginPath(); g2.roundRect(-pw / 2, -ph / 2, pw, ph, size * 0.22); g2.fill();
    g2.lineWidth = size * (E.espessura ?? 0.14); g2.strokeStyle = E.contorno || '#000'; g2.strokeText(text, 0, size * 0.04); g2.fillStyle = cor; g2.fillText(text, 0, size * 0.04);
  } else {                             // padrão: texto grosso com contorno e sombra
    if (E.sombra) { g2.fillStyle = E.sombra; g2.fillText(text, E.sombraX ?? 0, E.sombraY ?? 7); }
    g2.lineWidth = size * E.espessura; g2.strokeStyle = E.contorno; g2.strokeText(text, 0, 0);
    g2.fillStyle = cor; g2.fillText(text, 0, 0);
  }
  g2.restore();
}
export function drawChip(x, y, text, size, color, s) {
  const E = ESTILO.plaquinha, tipo = E.tipo || 'pilula_branca';
  if (E.cor) color = E.cor;   // estilo com cor fixa de plaquinha (ignora a cor pedida na cena)
  g2.save(); g2.translate(x, y); g2.scale(s, s);
  g2.font = fonte(E.peso, size, 'plaquinha'); g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fontKerning = 'none';
  const tw = g2.measureText(text).width;
  if (tipo === 'escura') {          // etiqueta escura arredondada, faixa colorida na esquerda, texto branco
    const pw = tw + size * 1.7, ph = size * 1.5;
    g2.fillStyle = 'rgba(0,0,0,0.3)'; g2.beginPath(); g2.roundRect(-pw / 2, -ph / 2 + 6, pw, ph, 14); g2.fill();
    g2.fillStyle = E.fundo || '#1f2633'; g2.beginPath(); g2.roundRect(-pw / 2, -ph / 2, pw, ph, 14); g2.fill();
    g2.fillStyle = color; g2.beginPath(); g2.roundRect(-pw / 2, -ph / 2, size * 0.55, ph, [14, 0, 0, 14]); g2.fill();
    g2.fillStyle = E.texto || '#ffffff'; g2.fillText(text, size * 0.28, 2);
  } else if (tipo === 'solida') {   // pílula toda na cor de destaque, texto claro/escuro conforme a cor
    const pw = tw + size * 1.1, ph = size * 1.5;
    const c = new THREE.Color(color), lum = 0.3 * c.r + 0.59 * c.g + 0.11 * c.b;
    g2.fillStyle = 'rgba(0,0,0,0.3)'; g2.beginPath(); g2.roundRect(-pw / 2 + 5, -ph / 2 + 7, pw, ph, ph / 2); g2.fill();
    g2.fillStyle = color; g2.beginPath(); g2.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2); g2.fill();
    g2.fillStyle = lum > 0.62 ? '#1e1e1e' : '#ffffff'; g2.fillText(text, 0, 4);
  } else if (tipo === 'neon') {     // caixinha escura com borda de neon na cor de destaque
    const pw = tw + size * 1.2, ph = size * 1.5;
    g2.fillStyle = E.fundo || 'rgba(8,10,24,0.88)'; g2.beginPath(); g2.roundRect(-pw / 2, -ph / 2, pw, ph, 12); g2.fill();
    g2.shadowColor = color; g2.shadowBlur = size * 0.45; g2.lineWidth = 4; g2.strokeStyle = color; g2.stroke(); g2.stroke(); g2.shadowBlur = 0;
    g2.fillStyle = E.texto || color; g2.fillText(text, 0, 3);
  } else if (tipo === 'caixa') {    // gibi: caixa branca de cantos retos, borda preta grossa, bloco colorido na esquerda
    const pw = tw + size * 1.7, ph = size * 1.5, b = E.borda ?? 6;
    g2.fillStyle = E.contorno || '#111111'; g2.fillRect(-pw / 2 + 8, -ph / 2 + 8, pw, ph);
    g2.fillStyle = E.fundo || '#ffffff'; g2.fillRect(-pw / 2, -ph / 2, pw, ph);
    g2.lineWidth = b; g2.strokeStyle = E.contorno || '#111111'; g2.strokeRect(-pw / 2, -ph / 2, pw, ph);
    g2.fillStyle = color; g2.fillRect(-pw / 2, -ph / 2, size * 0.6, ph); g2.strokeRect(-pw / 2, -ph / 2, size * 0.6, ph);
    g2.fillStyle = E.texto || '#111111'; g2.fillText(text, size * 0.3, 3);
  } else if (tipo === 'papel') {    // papelzinho branco preso com um alfinete colorido
    const pw = tw + size * 1.2, ph = size * 1.55; g2.rotate(hash(tw) * 0.08 - 0.04);
    g2.fillStyle = 'rgba(0,0,0,0.22)'; g2.fillRect(-pw / 2 + 4, -ph / 2 + 8, pw, ph);
    g2.fillStyle = E.fundo || '#fffdf5'; g2.fillRect(-pw / 2, -ph / 2, pw, ph);
    g2.fillStyle = 'rgba(0,0,0,0.25)'; g2.beginPath(); g2.arc(size * 0.04, -ph / 2 + 6, size * 0.27, 0, 7); g2.fill();
    g2.fillStyle = color; g2.beginPath(); g2.arc(0, -ph / 2, size * 0.27, 0, 7); g2.fill();
    g2.fillStyle = 'rgba(255,255,255,0.5)'; g2.beginPath(); g2.arc(-size * 0.09, -ph / 2 - size * 0.09, size * 0.09, 0, 7); g2.fill();
    g2.fillStyle = E.texto || '#2b2b2b'; g2.fillText(text, 0, size * 0.12);
  } else if (tipo === 'pixel') {    // bloquinhos: caixa escura de canto reto, quadradinho colorido, texto claro com sombra dura
    const pw = tw + size * 1.9, ph = size * 1.55, b = size * 0.08;
    g2.fillStyle = E.fundo || 'rgba(18,14,24,0.88)'; g2.fillRect(-pw / 2, -ph / 2, pw, ph);
    g2.strokeStyle = E.borda1 || '#e8e8e8'; g2.lineWidth = b; g2.strokeRect(-pw / 2 + b / 2, -ph / 2 + b / 2, pw - b, ph - b);
    g2.fillStyle = color; g2.fillRect(-pw / 2 + size * 0.35, -size * 0.32, size * 0.64, size * 0.64);
    g2.fillStyle = 'rgba(0,0,0,0.35)'; g2.fillRect(-pw / 2 + size * 0.35, size * 0.16, size * 0.64, size * 0.16);
    g2.fillStyle = '#3a3a3a'; g2.fillText(text, size * 0.45 + size * 0.07, size * 0.11); g2.fillStyle = E.texto || '#ffffff'; g2.fillText(text, size * 0.45, size * 0.04);
  } else if (tipo === 'jogo') {     // jogo: tarja escura translúcida arredondada, texto branco com contorno
    const pw = tw + size * 1.1, ph = size * 1.4;
    g2.fillStyle = E.fundo || 'rgba(0,0,0,0.55)'; g2.beginPath(); g2.roundRect(-pw / 2, -ph / 2, pw, ph, size * 0.3); g2.fill();
    g2.lineWidth = 5; g2.strokeStyle = color; g2.stroke();
    g2.lineJoin = 'round'; g2.lineWidth = size * 0.16; g2.strokeStyle = '#000'; g2.strokeText(text, 0, 3); g2.fillStyle = E.texto || '#ffffff'; g2.fillText(text, 0, 3);
  } else if (tipo === 'contorno') { // projeto: só a borda na cor de destaque, texto na mesma cor
    const pw = tw + size * 1.1, ph = size * 1.45;
    if (E.fundo) { g2.fillStyle = E.fundo; g2.fillRect(-pw / 2, -ph / 2, pw, ph); }
    g2.lineWidth = E.borda ?? 3; g2.strokeStyle = color; g2.strokeRect(-pw / 2, -ph / 2, pw, ph);
    g2.fillStyle = E.texto || color; g2.fillText(text, 0, 3);
  } else {                          // padrão: pílula branca com borda e bolinha na cor de destaque
    const pw = tw + size * 1.6, ph = size * 1.45;
    g2.fillStyle = 'rgba(0,0,0,0.25)'; g2.beginPath(); g2.roundRect(-pw / 2, -ph / 2 + 6, pw, ph, ph / 2); g2.fill();
    g2.fillStyle = E.fundo || '#ffffff'; g2.beginPath(); g2.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2); g2.fill();
    g2.lineWidth = 7; g2.strokeStyle = color; g2.stroke();
    g2.fillStyle = color; g2.beginPath(); g2.arc(-pw / 2 + size * 0.62, 0, size * 0.22, 0, 7); g2.fill();
    g2.fillStyle = E.texto || '#1e1e1e'; g2.fillText(text, size * 0.25, 2);
  }
  g2.restore();
}
const LOG_LETREIROS = DRY ? (G.__LOG_LETREIROS__ = []) : null;   // (conferir.py) onde cada letreiro caiu na tela
export function drawLabels(t) {
  for (let li = 0; li < labels.length; li++) {
    const L = labels[li];
    if (t < L.t0 || t > L.t1 + 0.3) continue;
    const s = pop(t, L.t0, L.t1, 0.4); if (s <= 0.001) continue;
    let x, y;
    if (L.screen) [x, y] = L.screen; else { const p = project(L.anchor(t)); if (p[2] > 1) { if (LOG_LETREIROS) LOG_LETREIROS.push([li, t, 0, 0, 'atras']); continue; } x = p[0] + (L.dx || 0); y = p[1] + L.dy; }
    if (!L.screen && (x < -60 || x > W + 60)) { if (LOG_LETREIROS) LOG_LETREIROS.push([li, t, x, y, 'fora']); continue; }
    const size = L.size * (L.kind === 'chip' ? (ESTILO.plaquinha.escala || 1) : (ESTILO.letreiro.escala || 1));
    g2.save(); g2.font = fonte(null, size, L.kind === 'chip' ? 'plaquinha' : 'letreiro');
    if (L.kind !== 'chip' && ESTILO.letreiro.espacamento) g2.letterSpacing = (size * ESTILO.letreiro.espacamento) + 'px';
    let hw = (g2.measureText(L.kind !== 'chip' && ESTILO.letreiro.maiusculas ? L.text.toUpperCase() : L.text).width + size) / 2 * (L.kind === 'chip' ? 1.25 : 1.05); g2.restore();
    const fit = Math.min(1, (W - 56) / (2 * hw)); hw *= fit;   // texto mais largo que a tela (fonte larga): encolhe pra caber
    const x0 = x, y0 = y; x = clamp(x, hw + 24, W - hw - 24); y = clamp(y, 170, H - 520);
    if (LOG_LETREIROS) LOG_LETREIROS.push([li, t, x, y, (Math.abs(x - x0) > 140 || Math.abs(y - y0) > 140) ? 'empurrado' : 'ok', hw]);
    if (L.kind === 'chip') drawChip(x, y, L.text, size, L.color, s * fit); else drawTag(x, y, L.text, size, L.rot, s * fit, L.fill, L.screen ? undefined : x0, L.screen ? undefined : y0 - L.dy);
  }
}

/* ------------------------------------------------------------------ legenda palavra por palavra
   configurarLegendas({ destaque: ['parabens', ...], nomes: ['filamento', ...], linhas: { lampada: -2, luz: -1 } })
   - destaque: palavras que ficam na cor de destaque
   - nomes: nomes de peça — só ficam em destaque quando estão sendo NOMEADOS ("é o filamento", "that's the…", "es el…")
   - linhas: palavra só em destaque numa linha do roteiro (-1 = última linha, -2 = penúltima)            */
const LEG = { destaque: new Set(), nomes: new Set(), linhas: {} };
export function configurarLegendas(o = {}) {
  if (o.destaque) LEG.destaque = new Set(o.destaque.map(norm));
  if (o.nomes) { LEG.nomes = new Set(o.nomes.map(norm)); for (const n of LEG.nomes) LEG.destaque.add(n); }
  if (o.linhas) { LEG.linhas = {}; for (const k in o.linhas) { LEG.linhas[norm(k)] = o.linhas[k]; LEG.destaque.add(norm(k)); } }
}
function nomeando(i) {
  const lang = (CANAL.idioma || 'pt').slice(0, 2), p1 = words[i - 1]?.n || '', p2 = words[i - 2]?.n || '';
  if (lang === 'en') { for (let k = i - 1; k >= Math.max(0, i - 5); k--) { if (/[.!?]$/.test(words[k].w)) return false; if (words[k].n === 'thats') return true; if (words[k].n === 'the' && words[k - 1]?.n === 'is') return true; } return false; }
  if (lang === 'es') return ['el', 'la', 'los', 'las'].includes(p1) && ['es', 'son'].includes(p2);
  return ['o', 'a', 'os', 'as'].includes(p1) && ['e', 'sao'].includes(p2);
}
export function captionAt(t) {
  let i = -1;
  for (let k = 0; k < words.length; k++) { if (words[k].s <= t + 0.02) i = k; else break; }
  if (i < 0) return null;
  const w = words[i], nx = words[i + 1];
  if (nx && nx.s - w.e > 0.5 && t > w.e + 0.35) return null;
  if (!nx && t > w.e + 0.9) return null;
  let txt = w.w.replace(/[.,:;!?¡¿"“”…]/g, ''); txt = txt.charAt(0).toUpperCase() + txt.slice(1);
  let yellow = LEG.destaque.has(w.n);
  const nl = TL.lines.length;
  if (w.n in LEG.linhas && w.line !== nl + LEG.linhas[w.n]) yellow = false;
  if (LEG.nomes.has(w.n) && !nomeando(i)) yellow = false;
  return { txt, yellow, age: t - w.s };
}
export function drawCaption(t) {
  const c = captionAt(t); if (!c) return;
  const E = ESTILO.legenda, anim = E.animacao || 'pulo', k = ease.out(clamp(c.age / 0.09));
  const s = anim === 'pulo' ? 1 + (E.pulo ?? 0.12) * (1 - k) : 1;
  const txtAll = E.maiusculas ? c.txt.toUpperCase() : c.txt;
  const txt = anim === 'maquina' ? txtAll.slice(0, Math.ceil(txtAll.length * clamp(c.age / 0.16))) : txtAll;
  g2.save(); g2.translate(W / 2, E.y + (anim === 'sobe' ? (1 - k) * 26 : 0)); g2.scale(s, s);
  if (anim === 'fade' || anim === 'sobe') g2.globalAlpha = k;
  g2.font = fonte(E.peso, E.tamanho, 'legenda'); g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.lineJoin = 'round';
  if (E.espacamento) g2.letterSpacing = (E.tamanho * E.espacamento) + 'px';
  const cor = c.yellow ? E.destaque : E.cor;
  if (E.caixa || (c.yellow && E.caixaDestaque)) {
    const bw = g2.measureText(txtAll).width + (E.caixaPad ?? 56), bh = E.caixaAltura ?? 104, r = E.caixaRaio ?? 26;
    g2.save(); if (E.caixaInclinacao) g2.transform(1, 0, -E.caixaInclinacao, 1, 0, 0);
    g2.fillStyle = (c.yellow && E.caixaDestaque) || E.caixa; g2.beginPath(); g2.roundRect(-bw / 2, -bh / 2, bw, bh, r); g2.fill();
    if (E.caixaBorda) { g2.lineWidth = E.caixaBorda; g2.strokeStyle = E.caixaBordaCor || E.contorno || '#000'; g2.stroke(); }
    g2.restore();
  }
  if (E.brilho) { g2.shadowColor = c.yellow ? E.destaque : E.brilho; g2.shadowBlur = E.brilhoTamanho ?? 28; g2.fillStyle = cor; g2.fillText(txt, 0, 0); g2.fillText(txt, 0, 0); g2.shadowBlur = 0; g2.shadowColor = 'transparent'; }
  if (E.espessura && E.sombraComContorno) { g2.lineWidth = E.espessura; g2.strokeStyle = E.sombra; g2.strokeText(txt, E.sombraX ?? 0, E.sombraY ?? 7); }
  if (E.sombra) { g2.fillStyle = E.sombra; g2.fillText(txt, E.sombraX ?? 0, E.sombraY ?? 7); }
  if (E.espessura) { g2.lineWidth = E.espessura; g2.strokeStyle = E.contorno; g2.strokeText(txt, 0, 0); }
  g2.fillStyle = cor; g2.fillText(txt, 0, E.caixa ? 3 : 0); g2.restore();
}

/* ------------------------------------------------------------------ balão de fala do boneco ("UHUL!", "Aaah...")
   fala('UHUL!', t0, t1, person)   ou   fala('Aaah...', t0, t1, person, { triste: true })
   A VOZ do balão é um efeito sonoro de voz de boneco (som('uhul', t0) …), nunca a voz do narrador.   */
const FALAS = [];
export function fala(text, t0, t1, quem, o = {}) { FALAS.push({ text, t0, t1, quem, triste: !!o.triste, dx: o.dx ?? 150, dy: o.dy ?? -170 }); }
export function drawFalas(t) {
  const E = ESTILO.fala;
  for (const F of FALAS) {
    if (t < F.t0 || t > F.t1 + 0.3) continue;
    const s = pop(t, F.t0, F.t1, 0.3); if (s <= 0.001) continue;
    const head = F.quem.userData.headP; head.updateMatrixWorld(true);
    const p = project(head.localToWorld(V(0.1, 0.28, 0))); if (p[2] > 1) continue;
    const sad = F.triste, C = sad ? E.triste : E.alegre;
    const x = clamp(p[0] + F.dx, 230, W - 230), y = clamp(p[1] + F.dy, 220, H - 700);
    g2.save(); g2.translate(x, y); g2.rotate(sad ? 0.05 : -0.08 + 0.04 * Math.sin(t * 12)); g2.scale(s, s);
    const bw = sad ? 300 : 360, bh = sad ? 140 : 160;
    g2.lineJoin = 'round'; g2.lineWidth = 9; g2.strokeStyle = E.contorno;
    g2.fillStyle = 'rgba(0,0,0,0.25)'; g2.beginPath(); g2.ellipse(0, 10, bw / 2, bh / 2, 0, 0, 7); g2.fill();
    g2.fillStyle = C.fundo; g2.beginPath(); g2.ellipse(0, 0, bw / 2, bh / 2, 0, 0, 7);
    const tx = clamp((p[0] - x) / s, -bw, bw) * 0.55, ty = (p[1] - y) / s * 0.55;
    g2.moveTo(-30, bh / 2 - 8); g2.lineTo(tx, ty); g2.lineTo(18, bh / 2 - 6);
    g2.fill(); g2.stroke();
    g2.fillStyle = C.fundo; g2.beginPath(); g2.ellipse(0, 0, bw / 2 - 6, bh / 2 - 6, 0, 0, 7); g2.fill();
    g2.fillStyle = C.texto; g2.font = fonte(E.peso, sad ? 66 : 84, 'fala'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText(F.text, 0, 4);
    g2.restore();
  }
}

/* ------------------------------------------------------------------ assinatura do canal (último segundo) */
let END_T0 = Infinity;
export function drawEndCard(t) {
  if (!CANAL.assinatura || t < END_T0) return;
  const E = ESTILO.assinatura, text = CANAL.nome;
  const k = ease.out(clamp((t - END_T0) / 0.5));
  g2.save(); g2.globalAlpha = k; g2.translate(W / 2, E.y + (1 - k) * 24);
  g2.font = fonte(E.peso, E.tamanho, 'assinatura'); g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.lineJoin = 'round';
  const tw = g2.measureText(text).width, pw = tw + 90, ph = 120;
  g2.fillStyle = E.fundo; g2.beginPath(); g2.roundRect(-pw / 2, -ph / 2, pw, ph, 30); g2.fill();
  g2.fillStyle = E.cor; g2.fillText(text, 0, 2);
  g2.restore();
}

/* ------------------------------------------------------------------ boneco: braço que alcança um ponto, ângulos */
const _m4 = new THREE.Matrix4(), _q1 = new THREE.Quaternion();
/** aponta o braço pra mão chegar em targetW (mundo). k mistura com a pose atual (0..1). pole = pra onde o cotovelo aponta */
export function armIK(person, arm, targetW, k = 1, pole = null) {
  if (k <= 0.001) return;
  const body = arm.sh.parent; person.updateMatrixWorld(true);
  const tL = body.worldToLocal(targetW.clone()), sL = arm.sh.position.clone();
  const d = tL.sub(sL); const L1 = 0.27, L2 = 0.26; const dist = clamp(d.length(), 0.08, L1 + L2 - 0.003); const dn = d.normalize();
  const a = Math.acos(clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
  const bend = Math.PI - Math.acos(clamp((L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2), -1, 1));
  const pv = (pole || V(arm.sx * 0.7, -1, -0.5)).clone();
  const w = pv.sub(dn.clone().multiplyScalar(pv.dot(dn))).normalize();
  const p = dn.clone().multiplyScalar(Math.cos(a)).add(w.multiplyScalar(Math.sin(a)));
  const elbow = p.clone().multiplyScalar(L1), tgt = dn.clone().multiplyScalar(dist);
  const f = tgt.sub(elbow).normalize();
  const Y = p.clone().negate(); const Z = f.clone().sub(p.clone().multiplyScalar(f.dot(p))); if (Z.lengthSq() < 1e-8) Z.set(0, 0, 1); Z.normalize();
  const X = new THREE.Vector3().crossVectors(Y, Z);
  _m4.makeBasis(X, Y, Z); _q1.setFromRotationMatrix(_m4);
  arm.sh.quaternion.slerp(_q1, k);
  arm.el.rotation.x = lerp(arm.el.rotation.x, -bend, k);
}
export const lerpAng = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * k; };

/* ------------------------------------------------------------------ efeitos sonoros (o montar_audio.py mixa)
   som('whoosh', A.poe - 0.05, -18)          efeito único: nome do arquivo em biblioteca/efeitos (sem .mp3), segundo, volume em dB
   som('pop', t, -15, { pan: 0.3 })          pan: -1 esquerda … 1 direita
   som('rise', t, -4, { dur: 2.1, fadeIn: 0.05, fadeOut: 0.04 })   dur: corta o efeito nesse tamanho
   ambiente('fogo', t0, t1, -15, { fade: 0.3, env: (t) => 0..1 })   som contínuo em loop entre t0 e t1 (env = volume ao longo do tempo)
   Os volumes seguem o padrão da série: whoosh -18..-22, pops -14..-17, impactos -6..-12, vozes de boneco -1..-3.     */
export const SONS = [], AMBIENTES = [];
export function som(nome, t, ganho = 0, o = {}) { if (typeof o === 'number') o = { pan: o }; SONS.push({ nome, t: +t, ganho, pan: o.pan || 0, dur: o.dur ?? null, fadeIn: o.fadeIn || 0, fadeOut: o.fadeOut || 0 }); }
export function ambiente(nome, t0, t1, ganho = -18, o = {}) { AMBIENTES.push({ nome, t0: +t0, t1: +t1, ganho, pan: o.pan || 0, fade: o.fade ?? 0.4, env: o.env || null }); }

/* ------------------------------------------------------------------ montar cada quadro */
export function vinheta(forca = ESTILO.vinheta ?? 0.3) {
  if (!forca) return;
  const vg = g2.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.5, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${forca})`); g2.fillStyle = vg; g2.fillRect(0, 0, W, H);
}
/* textura por cima do quadro (ESTILO.textura): 'grao' (granulado de filme), 'linhas' (linhas de TV), 'meio_tom' (bolinhas de gibi), 'papel' (fibra de papel) */
const TEX = {};
function texturaCanvas(tipo) {
  if (TEX[tipo]) return TEX[tipo];
  const n = tipo === 'papel' ? 512 : tipo === 'grao' ? 256 : tipo === 'meio_tom' ? 14 : 4;
  const c = document.createElement('canvas'); c.width = n; c.height = tipo === 'linhas' ? 4 : n; const x = c.getContext('2d');
  if (tipo === 'grao' || tipo === 'papel') {
    const img = x.createImageData(c.width, c.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = tipo === 'papel' ? 215 + 40 * hash(i * 0.37) : 128 + 110 * (hash(i * 0.73) - 0.5); d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    if (tipo === 'papel') { x.strokeStyle = 'rgba(120,100,70,0.18)'; x.lineWidth = 1; for (let i = 0; i < 900; i++) { const px = hash(i * 1.3) * n, py = hash(i * 2.7) * n, a = hash(i * 5.1) * 6.3, l = 6 + 18 * hash(i * 7.7); x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); } }
  } else if (tipo === 'meio_tom') { x.fillStyle = '#ffffff'; x.fillRect(0, 0, n, n); x.fillStyle = '#000000'; x.beginPath(); x.arc(n / 2, n / 2, n * 0.19, 0, 7); x.fill(); x.beginPath(); x.arc(0, 0, n * 0.19, 0, 7); x.arc(n, 0, n * 0.19, 0, 7); x.arc(0, n, n * 0.19, 0, 7); x.arc(n, n, n * 0.19, 0, 7); x.fill(); }
  else { x.fillStyle = '#ffffff'; x.fillRect(0, 0, 4, 4); x.fillStyle = '#000000'; x.fillRect(0, 2, 4, 2); }
  return (TEX[tipo] = { canvas: c, pattern: g2.createPattern(c, 'repeat') });
}
export function textura(t = 0, tipo = ESTILO.textura, forca = ESTILO.texturaForca ?? 0.25) {
  if (!tipo || !forca || DRY) return;
  const T = texturaCanvas(tipo);
  g2.save(); g2.globalAlpha = forca; g2.globalCompositeOperation = tipo === 'grao' ? 'overlay' : 'multiply';
  if (tipo === 'grao') g2.translate(Math.floor(hash(Math.floor(t * 30)) * 256), Math.floor(hash(Math.floor(t * 30) + 7) * 256));
  g2.fillStyle = T.pattern; g2.fillRect(-256, -256, W + 512, H + 512); g2.restore();
}
export function clarao(k, cor = '255,240,210') { if (k > 0.01) { g2.fillStyle = `rgba(${cor},${k})`; g2.fillRect(0, 0, W, H); } }
function fontesDoEstilo() {
  const set = new Set();
  for (const q of ['letreiro', 'plaquinha', 'legenda', 'fala', 'assinatura']) if (ESTILO[q] && ESTILO[q].fonte) set.add(`${ESTILO[q].peso} 60px ${fam(ESTILO[q].fonte)}`);
  return [...set];
}
/**
 * Liga tudo. Chame no FIM da cena:
 *   iniciar({ duracao: DURATION, ancoras: A, update, desenhar, flash: () => flashK })
 * update(t)   → posiciona tudo no tempo t (a câmera já vem aplicada se você não mexer nela)
 * desenhar(t) → desenhos extras por cima do 3D (termômetro, gráficos, balões especiais…)
 * popsNosLetreiros: true = "pop" automático quando cada letreiro grande aparece (padrão da série)
 */
export function iniciar({ duracao, ancoras = {}, update, desenhar = null, flash = null, camera: camAuto = true, popsNosLetreiros = true, somDoPop = 'pop2', volumeDoPop = -19 }) {
  if (!(duracao > 0)) throw new Error('iniciar(): informe duracao (em segundos)');
  END_T0 = (CANAL.fimAssinatura ?? FIM_NARRACAO) - 1.0;
  for (let i = 1; i < shots.length; i++) if (shots[i].t < shots[i - 1].t) throw new Error('Tomadas de câmera fora de ordem: ' + shots[i - 1].t.toFixed(2) + ' > ' + shots[i].t.toFixed(2));
  if (popsNosLetreiros) for (const L of labels) if (L.kind === 'label' && !L.semPop) som(somDoPop, L.t0 - 0.02, volumeDoPop);
  function compose(t) {
    if (camAuto) aplicarCamera(t);
    update(t);
    if (DRY) { scene.updateMatrixWorld(); camera.updateMatrixWorld(); }
    if (!DRY) renderer.render(scene, camera);
    g2.clearRect(0, 0, W, H);
    g2.drawImage(sky, 0, 0);
    if (!DRY) { if (ESTILO.filtro3d) g2.filter = ESTILO.filtro3d; g2.drawImage(renderer.domElement, 0, 0, W, H); g2.filter = 'none'; }
    vinheta();
    textura(t);
    clarao(flash ? flash(t) : 0);
    drawLabels(t);
    drawFalas(t);
    if (desenhar) desenhar(t);
    drawCaption(t);
    drawEndCard(t);
  }
  if (DRY) { G.__THREE__ = THREE; G.__CENA__ = { scene, camera, cameraAt }; }
  G.composeFrame = compose; G.OV = ov; G.DURATION = duracao; G.ANCHORS = ancoras;
  G.renderFrame = (t, q = 0.93) => { compose(t); return ov.toDataURL('image/jpeg', q); };
  G.__VIDEO__ = {
    duracao, ancoras, compose,
    sons: SONS, ambientes: AMBIENTES,
    letreiros: labels.map((l) => ({ texto: l.text, t0: l.t0, t1: l.t1, tipo: l.kind })),
    tomadas: shots.map((s) => ({ t: s.t, dur: s.dur, alvo: [s.tgt.x, s.tgt.y, s.tgt.z], fov: s.fov })),
    legendaY: ESTILO.legenda.y,
  };
  const fontes = DRY ? [] : fontesDoEstilo();
  G.__VIDEO_PRONTO__ = (async () => { for (const f of fontes) { try { await document.fonts.load(f); } catch (e) { /* segue com a fonte do sistema */ } } G.ready = true; })();
  return compose;
}
