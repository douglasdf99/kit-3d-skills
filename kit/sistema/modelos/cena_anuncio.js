/* =====================================================================================
   MODELO DE CRIATIVO (anúncio curto, problema-solução, 25 a 40 s)   ·   estilo «Quadradinhos»
   Copie pra Meus Videos/<x>/cena/cena.js. Ele RODA com qualquer copy de 5 a 8 linhas (as âncoras caem em frações das
   linhas quando a frase não existe), mas fica bom de verdade quando você troca o que está marcado com TROQUE:
     1. PRODUTO e cores da embalagem   2. TEXTOS das plaquinhas   3. FRASES das âncoras (palavras da copy)
     4. a CENA DO PROBLEMA (quarto + potes) e a MAQUETE DA CAUSA (aqui: pele em camadas) pelo que a copy fala.
   5 blocos: GANCHO (o problema na tela) → PROBLEMA (o que já tentou) → CAUSA (maquete) → PRODUTO (herói) → CTA (área segura)
   O estilo da skill é só o «Quadradinhos»: E.caixa / E.cilindro / E.esfera abaixo viram peças de quadradinhos (veja o GUIA.md do quadradinhos).
   Exemplo pronto deste modelo: o criativo "Skin Care · o creme que funcionava aos 40 e parou" (skill criativo-video-reels).
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, prog, win, pop, hash, canvasPlane } from '../../../sistema/motor/lib.js';
import * as EB from '../../../biblioteca/estilos/quadradinhos/estilo.js';
import { W, H, T, TL, scene, V, orb, FIM_NARRACAO, fecharCameras, label, chip, banner, configurarLegendas, som, ambiente, iniciar, g2, FT } from '../../../sistema/motor/video.js';
import { piscar, aplicarPiscadas, efeitosCamera, desenharEfeitos, emote, zoomSoco, transicao, manchete, alcancar, brilho } from '../../../sistema/motor/edicao.js';
// peças "lisas" do modelo → peças de quadradinhos (o estilo Quadradinhos não tem caixa/cilindro/esfera lisos)
const passo = (a) => Math.max(0.012, a);
const E = {
  ...EB,
  caixa: (w, h, d, cor, o = {}) => EB.bloco(w, h, d, cor, { textura: o.textura || 'ruido', pixel: o.pixel ?? passo(Math.min(w, h, d) / 4) }),
  cilindro: (r, h, cor) => EB.cilindroDeCubos(r, Math.max(h, passo(Math.min(r / 5, h))), cor, passo(Math.min(r / 5, h))),
  esfera: (r, cor) => EB.esferaDeCubos(r, [cor], passo(r / 3)),
  // cabelo comprido com coque (personagem mulher). Pra homem, não chame.
  cabeloComprido: (p, cor = '#5a3424') => { const H = p.userData.headP; H.add(EB.em(EB.bloco(0.54, 0.6, 0.1, cor, { textura: 'ruido' }), -0.026, 0.12, -0.31), EB.em(EB.bloco(0.22, 0.22, 0.22, cor, { textura: 'ruido' }), -0.026, 0.56, -0.2)); return p; },
};

/* ------------------------------------------------------------------ o produto (TROQUE) */
const PRODUTO = 'SKIN CARE';                     // nome real, do jeito que vai na embalagem e no letreiro
const COR_POTE = '#f4a6c0', COR_TAMPA = '#d9b36a', COR_TEXTO = '#a3245c';

/* ------------------------------------------------------------------ textos das plaquinhas (TROQUE) */
const TEXTOS = {
  manchete: 'O CREME PAROU?', antes: 'AOS 40: FUNCIONAVA', depois: 'DEPOIS DOS 50: NADA', compra: 'COMPRA OUTRO', continua: 'CONTINUA SECA',
  tempo: '5 ANOS DE MENOPAUSA', perda: '−30% DE COLÁGENO', fraca: 'BARREIRA FRACA', escapa: 'A ÁGUA ESCAPA', porCima: 'SÓ POR CIMA',
  ajuda1: 'AJUDA A REGENERAÇÃO', ajuda2: 'HIDRATA MAIS FUNDO', cta: 'CLIQUE NO LINK ABAIXO',
};

/* ------------------------------------------------------------------ âncoras (TROQUE as frases pelas palavras da copy)
   Blocos por linha do roteiro: 0 gancho · 1 problema · 2..(n-3) causa · penúltima = produto · última = CTA.
   Se a frase não existir na narração, a âncora cai numa fração da linha (o vídeo roda; depois afine).            */
const N = TL.lines.length, L = (i) => TL.lines[(i + N) % N];
const tenta = (frase) => { try { return T(frase); } catch (e) { return null; } };
const CAUSA0 = Math.min(2, N - 3), CAUSA_N = Math.max(CAUSA0, N - 3);      // primeira e última linha da causa
const em = (i, f) => { const l = L(Math.min(i, N - 2)); return l.s + (l.e - l.s) * f; };
const causa = (f) => { const t0 = L(CAUSA0).s, t1 = L(CAUSA_N).e; return t0 + (t1 - t0) * f; };
const A = {
  quarenta: tenta('funcionava aos quarenta') ?? em(0, 0.3), nada: tenta('nao fazer mais nada') ?? em(0, 0.55), cinquenta: tenta('dos cinquenta') ?? em(0, 0.8),
  muita: tenta('muita mulher') ?? em(1, 0), troca: tenta('troca de creme') ?? em(1, 0.2), compra: tenta('compra outro') ?? em(1, 0.45), seca: tenta('continua seca') ?? em(1, 0.75),
  causa: L(CAUSA0).s, anos: tenta('cinco anos') ?? causa(0.08), trinta: tenta('trinta por cento') ?? causa(0.2), colageno: tenta('do colageno') ?? causa(0.28),
  estrogenio: tenta('menos estrogenio') ?? causa(0.4), barreira: tenta('a barreira') ?? causa(0.46), fraca: tenta('mais fraca') ?? causa(0.55), escapa: tenta('agua escapa') ?? causa(0.65),
  porIsso: tenta('por isso') ?? causa(0.75), maisCreme: tenta('mais creme') ?? causa(0.82), naoResolve: tenta('nao resolve') ?? causa(0.92),
  virada: L(-2).s, rotina: tenta('uma rotina') ?? em(N - 2, 0.15), regeneracao: tenta('regeneracao') ?? em(N - 2, 0.4), fundo: tenta('hidrate mais fundo') ?? em(N - 2, 0.6),
  produto: tenta(PRODUTO.toLowerCase()) ?? em(N - 2, 0.85),
  cta: L(-1).s, link: tenta('link abaixo') ?? em(N - 1, 0.2), end: FIM_NARRACAO,
};
const DURATION = A.end + 0.4;
E.preparar();

/* ------------------------------------------------------------------ CENA DO PROBLEMA (TROQUE): quarto com penteadeira */
scene.add(E.sala({ x0: -3, x1: 3, z0: -2.5, z1: 2.2, piso: '#ead9c2', parede: '#f6dfe4' }));
const TX = -1.25, TZ = -2.08;
scene.add(E.grupo(E.em(E.caixa(1.15, 0.7, 0.42, '#fbf3ea', { r: 0.03 }), TX, 0.35, TZ), E.em(E.caixa(1.22, 0.06, 0.48, '#e8cfae', { r: 0.02 }), TX, 0.73, TZ)));
const espelho = E.grupo(E.em(E.cilindro(0.44, 0.04, '#d9b38c'), 0, 0, 0), E.em(E.cilindro(0.39, 0.05, '#d8f1ff'), 0, 0, 0.005));
espelho.rotation.x = Math.PI / 2; espelho.position.set(TX, 1.55, -2.43); scene.add(espelho);
// mesinha redonda da maquete e do produto
const MX = 1.25, MZ = -0.85, MY = 0.74;
scene.add(E.grupo(E.em(E.cilindro(0.75, 0.05, '#ffffff'), 0, MY - 0.025, 0), E.em(E.cilindro(0.06, MY - 0.08, '#d9b38c'), 0, 0.02, 0), E.em(E.cilindro(0.3, 0.03, '#d9b38c'), 0, 0.015, 0)));
scene.children[scene.children.length - 1].position.set(MX + 0.2, 0, MZ);

/* ------------------------------------------------------------------ a boneca (50+) e as amigas */
const LOOK = { camisa: '#e9545a', cabelo: '#c9c9c9', penteado: 'comprido', calca: '#3b4b7a' };
const ze = E.boneco(LOOK); scene.add(ze);
const POS1 = V(-0.45, 0, -1.45), ROT1 = -0.35, POS2 = V(0.55, 0, -0.45), ROT2 = 0.7;
const amigas = [['#5aa0e6', '#a8a8a8'], ['#f4b63f', '#d8d8d8'], ['#57b36b', '#9a9a9a'], ['#a77be0', '#e2e2e2'], ['#ef7e3a', '#b5b5b5']].map(([c, h], i) => {
  const p = E.boneco({ camisa: c, cabelo: h, penteado: 'comprido', calca: '#2f3a5c' });
  p.position.set(0.2 + i * 0.34, 0, -2.05 + (i % 2) * 0.2); p.rotation.y = -0.2 - i * 0.06; p.scale.setScalar(0.92); scene.add(p); return p;
});
const CAB = ze.userData.headP;

/* ------------------------------------------------------------------ potes: o de antes (na mão), os que ela compra, o creme "por cima" */
function pote(cor, tampa, r = 0.075, h = 0.08) { return E.grupo(E.em(E.cilindro(r, h, cor), 0, h / 2, 0), E.em(E.cilindro(r * 1.06, h * 0.4, tampa), 0, h + h * 0.2, 0)); }
const poteVelho = pote('#ffffff', '#9aa3ab'); scene.add(poteVelho);
const POTES = [['#cfe7ff', '#5aa0e6'], ['#fff1c9', '#f4b63f'], ['#e3f6e3', '#57b36b'], ['#efe3ff', '#a77be0']].map(([c, t], i) => {
  const g = pote(c, t); g.position.set(TX - 0.42 + i * 0.28, 0.76, TZ + 0.05); scene.add(g);
  const x = E.grupo(E.em(E.caixa(0.14, 0.03, 0.03, '#e3262b'), 0, 0, 0), E.em(E.caixa(0.03, 0.14, 0.03, '#e3262b'), 0, 0, 0)); x.rotation.z = Math.PI / 4;
  x.position.set(g.position.x, 1.02, g.position.z + 0.06); scene.add(x); return { g, x };
});

/* ------------------------------------------------------------------ MAQUETE DA CAUSA (TROQUE): a pele: derme, epiderme, barreira (tijolinhos), colágeno, água */
const maq = new THREE.Group(); maq.position.set(MX, MY, MZ); scene.add(maq);
const WP = 0.8, DP = 0.44;
maq.add(E.em(E.caixa(WP, 0.17, DP, '#ee9f93'), 0, 0.085, 0), E.em(E.caixa(WP, 0.06, DP, '#f6c7a6'), 0, 0.2, 0));
const TOP = 0.23;
const tijolos = []; for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { const b = E.caixa(0.088, 0.028, 0.098, '#fff3d6', { r: 0.008 }); b.position.set((i - 3.5) * 0.098, TOP + 0.014, (j - 1.5) * 0.108); b.userData = { x0: b.position.x, z0: b.position.z, k: i * 4 + j }; maq.add(b); tijolos.push(b); }
const FIB0 = new THREE.Color('#fff0c2'), FIB_RUIM = new THREE.Color('#ff3b2f'), FIB_BOA = new THREE.Color('#ffd21f');
const fibras = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.11, 4, 10), E.material('#fff0c2', { unique: true })); f.rotation.z = Math.PI / 2; f.position.set((c - 2) * 0.15, 0.05 + r * 0.07, DP / 2 + 0.012); maq.add(f); fibras.push(f); }
const SOMEM = [1, 3, 7];                                                     // 3 de 10 fibras = os ~30% que somem
const GOTAS = Array.from({ length: 14 }, (_, k) => { const s = E.esfera(0.02, '#4fb3ff'); s.userData = { x: (hash(k * 2.3) - 0.5) * 0.66, z: (hash(k * 5.9) - 0.5) * 0.34 }; maq.add(s); return s; });
const creme = E.esfera(0.11, '#fffaf2'); creme.scale.set(1.3, 0.35, 1.0); maq.add(creme);
const poteCreme = pote('#ffffff', '#9aa3ab'); scene.add(poteCreme);

/* ------------------------------------------------------------------ o produto (herói): pote grande com o nome escrito */
const heroi = new THREE.Group(); scene.add(heroi);
heroi.add(E.em(E.cilindro(0.15, 0.15, COR_POTE), 0, 0.075, 0), E.em(E.cilindro(0.158, 0.06, COR_TAMPA), 0, 0.18, 0), E.em(E.cilindro(0.06, 0.02, '#fff6e0'), 0, 0.22, 0));
const rotulo = canvasPlane(0.27, 0.075, 540, 150); rotulo.position.set(0, 0.075, 0.152); heroi.add(rotulo);
function pintarRotulo() {
  const c = rotulo.userData.ctx; if (!c || !c.fillRect) return;
  c.clearRect(0, 0, 540, 150); c.fillStyle = '#ffffff'; c.beginPath(); c.roundRect?.(8, 18, 524, 114, 40); c.fill?.();
  c.fillStyle = COR_TEXTO; c.textAlign = 'center'; c.textBaseline = 'middle';
  let fs = 84; do { c.font = `900 ${fs}px ${FT}`; fs -= 4; } while (fs > 30 && c.measureText?.(PRODUTO)?.width > 470);   // nome comprido: a letra encolhe pra caber no rótulo
  c.fillText(PRODUTO, 270, 78);
  rotulo.userData.tex.needsUpdate = true;
}
pintarRotulo(); globalThis.document?.fonts?.ready?.then?.(pintarRotulo);
const HEROI = V(MX + 0.55, MY, MZ + 0.05), HEROI2 = V(MX + 0.12, MY, MZ + 0.48);    // ao lado da maquete → na frente, no nome
heroi.position.copy(HEROI); heroi.rotation.y = -0.35;
const luz = brilho('#fff1b0', 0.9); scene.add(luz);
const raios = Array.from({ length: 10 }, (_, k) => { const r = E.caixa(0.012, 0.22, 0.012, '#ffe27a'); scene.add(r); return r; });

scene.updateMatrixWorld(true);
const CAB1 = (() => { ze.position.copy(POS1); ze.rotation.y = ROT1; ze.updateMatrixWorld(true); return CAB.localToWorld(V(0, 0, 0)); })();
const MAQ = V(MX, MY + 0.2, MZ), FRENTE = V(MX, MY + 0.09, MZ + DP / 2), MESA = V(TX, 0.92, TZ + 0.1);
const FINAL = V(1.12, 0.86, -0.42);
const POS_H = V();   // posição do herói no quadro (calculada no update)

/* ------------------------------------------------------------------ câmera: tomada nova a cada 2–3 s (ritmo calmo; as pessoas preferiram assim)
   Distâncias já abertas: objeto ≥ 2 m, boneco ≥ 3 m. Mais perto que isso corta texto e o braço do boneco tapa a cena. */
orb(0, CAB1.clone().add(V(0.05, -0.35, 0)), 16, 6, 3.6, 40, 0, 0.05);
orb(A.quarenta - 0.15, CAB1.clone().add(V(0.1, -0.4, 0.12)), -16, 8, 3, 40, 0.7);
orb(A.cinquenta - 0.2, CAB1.clone().add(V(0, -0.3, 0)), 26, 4, 3.3, 40, 0.6);
orb(A.muita - 0.15, V(0.5, 0.8, -1.6), -6, 8, 4.8, 44, 0.8);
orb(A.compra - 0.25, MESA.clone(), 14, 18, 2.8, 40, 0.7);
orb(A.seca - 0.1, CAB1.clone().add(V(0, -0.3, 0)), -22, 6, 3.3, 40, 0.7);
transicao(A.causa - 0.35, 'circulo', 0.6);
orb(A.causa - 0.05, MAQ.clone(), 16, 18, 2.9, 40, 0);
orb(A.trinta - 0.25, FRENTE.clone(), 6, 6, 2.5, 40, 0.7);
orb(A.barreira - 0.15, MAQ.clone(), -20, 36, 2.5, 40, 0.7);
orb(A.escapa - 0.25, MAQ.clone().add(V(0, 0.25, 0)), 12, 8, 2.9, 40, 0.7);
orb(A.porIsso - 0.1, MAQ.clone().add(V(0, 0.18, 0)), -12, 16, 2.9, 40, 0.7);
transicao(A.virada - 0.35, 'circulo', 0.6);
orb(A.virada - 0.05, HEROI.clone().add(V(0, 0.13, 0)), 18, 8, 2.5, 40, 0);
orb(A.regeneracao - 0.25, FRENTE.clone(), -8, 8, 2.5, 40, 0.7);
orb(A.fundo - 0.25, MAQ.clone(), 14, 26, 2.6, 40, 0.7);
orb(A.produto - 0.3, FINAL.clone(), 16, 10, 3.4, 42, 0.8);
orb(A.cta - 0.1, FINAL.clone().add(V(0, 0.06, 0)), 24, 10, 3.6, 42, 0.8, 0.03, { spin: -0.05, bob: 0.4 });
fecharCameras({ duracao: DURATION, aberturaAte: L(0).e, finalDesde: A.cta - 0.5 });

/* ------------------------------------------------------------------ letreiros, plaquinhas e edição (nada fora da área segura do Reels) */
const VERM = '#ff3b2f', VERDE = '#22b35e', AZUL = '#2f8cff', CINZA = '#6b7280', ROXO = '#8b5cf6';
const naMao = () => poteVelho.localToWorld(V(0, 0.12, 0));
manchete(TEXTOS.manchete, 0.05, A.muita - 0.3, { size: 62 });           // maior que 62 corta nas bordas
chip(TEXTOS.antes, A.quarenta + 0.05, A.nada - 0.05, naMao, VERDE, { dy: -110 });
chip(TEXTOS.depois, A.cinquenta, A.muita - 0.2, naMao, VERM, { dy: -110 });
emote('?', A.nada, A.muita, ze);
amigas.forEach((p, i) => emote('?', A.muita + 0.2 + i * 0.08, A.seca + 0.9, p));
chip(TEXTOS.compra, A.compra + 0.05, A.seca - 0.05, () => MESA.clone().add(V(0, 0.15, 0)), CINZA, { dy: -140 });
chip(TEXTOS.continua, A.seca + 0.05, A.causa - 0.4, () => CAB.localToWorld(V(0, 0.2, 0)), VERM, { dy: -120 });
chip(TEXTOS.tempo, A.anos - 0.05, A.trinta - 0.05, () => MAQ.clone().add(V(0, 0.1, 0)), ROXO, { dy: -160, size: 50 });
chip(TEXTOS.perda, A.trinta + 0.1, A.estrogenio - 0.1, () => FRENTE.clone().add(V(0, 0.1, 0)), VERM, { dy: -150 });
chip(TEXTOS.fraca, A.fraca, A.escapa - 0.05, () => MAQ.clone().add(V(0, 0.05, 0)), VERM, { dy: -150 });
chip(TEXTOS.escapa, A.escapa + 0.05, A.porIsso - 0.1, () => MAQ.clone().add(V(0, 0.4, 0)), AZUL, { dy: -60 });
chip(TEXTOS.porCima, A.maisCreme + 0.3, A.virada - 0.4, () => MAQ.clone().add(V(0, 0.08, 0)), VERM, { dy: -150 });
chip(TEXTOS.ajuda1, A.regeneracao + 0.05, A.fundo - 0.1, () => FRENTE.clone().add(V(0, 0.1, 0)), VERDE, { dy: -150, size: 50 });
chip(TEXTOS.ajuda2, A.fundo + 0.1, A.produto - 0.2, () => MAQ.clone().add(V(0, 0.05, 0)), VERDE, { dy: -160, size: 50 });
label(PRODUTO, A.produto, A.cta + 0.2, () => heroi.localToWorld(V(0, 0.32, 0)), { screen: [W / 2, 640], size: 92 });
piscar(heroi, A.produto); zoomSoco(A.produto + 0.05, 0.12); zoomSoco(A.cinquenta + 0.05, 0.1);
amigas.forEach((p, i) => emote(i % 2 ? 'coracao' : 'estrelas', A.produto + 0.1 + i * 0.07, A.cta + 0.6, p));
banner(TEXTOS.cta, A.cta + 0.05, DURATION + 1, { screen: [W / 2, 330], size: 74, semPop: true });
configurarLegendas({ destaque: PRODUTO.toLowerCase().split(/\s+/), nomes: [] });
function desenhar(t) {
  desenharEfeitos(t);
  const k = pop(t, A.link - 0.1, Infinity, 0.35); if (k <= 0.01) return;      // seta pra baixo, acima da legenda (área segura)
  const y = 1150 + Math.sin(t * 7) * 18, s = 70 * k;
  g2.save(); g2.translate(W / 2, y); g2.fillStyle = '#ffd21f'; g2.strokeStyle = '#1a1a1a'; g2.lineWidth = 10; g2.lineJoin = 'round';
  g2.beginPath(); g2.moveTo(-s * 0.45, -s); g2.lineTo(s * 0.45, -s); g2.lineTo(s * 0.45, -s * 0.1); g2.lineTo(s, -s * 0.1); g2.lineTo(0, s); g2.lineTo(-s, -s * 0.1); g2.lineTo(-s * 0.45, -s * 0.1); g2.closePath();
  g2.stroke(); g2.fill(); g2.restore();
}

/* ------------------------------------------------------------------ sons */
som('whoosh', 0.02, -16); som('pop2', 0.1, -12);
som('correct', A.quarenta + 0.1, -12); som('failtrombone', A.cinquenta + 0.1, -12);
som('gasp', A.muita + 0.15, -12);
POTES.forEach((p, i) => { som('pop', A.troca + i * 0.35, -13); som('nope', A.troca + 0.25 + i * 0.35, -18); });
som('sad', A.seca + 0.1, -12);
som('whoosh', A.causa - 0.4, -14);
som('crack', A.trinta + 0.15, -12); som('plim', A.anos, -16);
som('crack', A.fraca + 0.05, -14); som('steam', A.escapa, -10);
som('splash', A.maisCreme + 0.2, -14); som('sad', A.naoResolve, -12);
som('whoosh', A.virada - 0.4, -14); som('magic', A.virada + 0.05, -8);
som('sparkle', A.regeneracao, -12); som('bubbles', A.fundo + 0.1, -12);
som('crowd_wow', A.produto + 0.1, -10); som('applause_short', A.produto + 0.6, -14);
som('pop2', A.cta + 0.05, -12); som('ding', A.link, -14);

/* ------------------------------------------------------------------ animação */
const _v = new THREE.Vector3();
function update(t) {
  efeitosCamera(t);
  const final = t >= A.virada - 0.05;                                  // depois da transição: boneca ao lado da mesinha
  ze.position.copy(final ? POS2 : POS1); ze.rotation.y = final ? ROT2 : ROT1;
  let humor = 0.2, pose = null, pk = 0;
  if (t < A.muita) humor = t > A.cinquenta ? -0.8 : 0.1;
  else if (t < A.causa) { humor = -0.7; if (t > A.seca) { pose = 'pensa'; pk = win(t, A.seca, A.causa, 0.25, 0.2); } }
  if (final) { humor = 1; pose = t > A.produto ? 'aponta' : 'segura'; pk = t > A.produto ? win(t, A.produto, DURATION + 1, 0.25, 0.2) : win(t, A.virada, A.produto, 0.3, 0.2); }
  E.animar(ze, t, { humor, pose, poseK: pk, olhar: final ? 0.4 : 0.15 });
  // pote velho na mão (gancho)
  const arm = ze.userData.arms[1];
  if (t < A.muita + 0.3) alcancar(ze, arm, CAB.localToWorld(V(0.08, -0.42, 0.32)), win(t, 0, A.muita + 0.3, 0.2, 0.3));
  ze.updateMatrixWorld(true);
  arm.handP.getWorldPosition(_v); poteVelho.position.copy(_v).add(V(0, -0.02, 0)); poteVelho.visible = t < A.muita + 0.3;
  poteVelho.rotation.z = t > A.nada && t < A.muita ? Math.sin(t * 18) * 0.12 : 0;
  // amigas: aparecem em "muita mulher", somem na causa e voltam comemorando no produto
  amigas.forEach((p, i) => {
    const a = pop(t, A.muita + i * 0.08, A.causa - 0.35, 0.3), b = pop(t, A.produto + i * 0.06, Infinity, 0.3), s = Math.max(a, b);
    p.visible = s > 0.01; p.scale.setScalar(0.92 * Math.max(0.001, s));
    E.animar(p, t + i, { humor: b > 0.01 ? 1 : -0.5, pose: b > 0.01 ? 'comemora' : 'pensa', poseK: 1 });
  });
  // potes comprados: entram um por um e ganham um X
  POTES.forEach(({ g, x }, i) => {
    const s = pop(t, A.troca - 0.1 + i * 0.35, A.causa - 0.35, 0.3); g.visible = s > 0.01; g.scale.setScalar(Math.max(0.001, s));
    const xs = pop(t, A.troca + 0.25 + i * 0.35, A.causa - 0.35, 0.25); x.visible = xs > 0.01; x.scale.setScalar(Math.max(0.001, xs));
  });
  // maquete: aparece na causa
  const mk = pop(t, A.causa - 0.1, Infinity, 0.4); maq.visible = mk > 0.01; maq.scale.setScalar(Math.max(0.001, mk));
  const regen = prog(t, A.regeneracao, 0.8, ease.out);
  fibras.forEach((f, k) => {
    const some = SOMEM.includes(k) ? prog(t, A.trinta + 0.1 + SOMEM.indexOf(k) * 0.15, 0.5) : 0;
    const s = Math.max(0.001, 1 - some + some * regen); f.scale.set(s, s, s);
    const ruim = SOMEM.includes(k) ? win(t, A.trinta - 0.1, A.regeneracao, 0.3, 0.3) : 0, boa = SOMEM.includes(k) ? win(t, A.regeneracao, A.produto, 0.3, 0.6) : 0;
    f.material.color.copy(FIB0).lerp(FIB_RUIM, ruim).lerp(FIB_BOA, boa);
  });
  const fraca = prog(t, A.fraca - 0.1, 0.6) * (1 - prog(t, A.fundo, 0.8));
  tijolos.forEach((b) => { const gap = fraca * (hash(b.userData.k) > 0.45 ? 1 : 0.3); b.scale.set(1 - 0.45 * gap, 1, 1 - 0.45 * gap); b.position.y = TOP + 0.014 - gap * 0.008; });
  const escapando = t > A.escapa - 0.2 && t < A.virada - 0.1, entra = prog(t, A.fundo, 1.0, ease.inOut);
  GOTAS.forEach((s, k) => {
    const u = s.userData; let x = u.x, y = TOP + 0.04, z = u.z, sc = 1;
    if (escapando) { const f = (t * 0.6 + hash(k * 1.7)) % 1; y += f * 0.6; sc = 1 - f; }
    else if (t >= A.virada - 0.1) { y = lerp(TOP + 0.04, 0.06 + (k % 3) * 0.04, entra); z = lerp(u.z, DP / 2 + 0.03, entra); }
    s.position.set(x, y, z); s.scale.setScalar(Math.max(0.001, sc)); s.visible = t > A.causa;
  });
  // "só passar mais creme por cima": o pote vira e o creme fica em cima
  const vira = win(t, A.porIsso, A.naoResolve + 0.6, 0.4, 0.4);
  poteCreme.visible = vira > 0.01; poteCreme.position.set(MX + 0.15, MY + 0.55, MZ); poteCreme.rotation.z = 2.2 * vira; poteCreme.scale.setScalar(Math.max(0.001, Math.min(1, vira * 2)));
  const cr = prog(t, A.maisCreme, 0.5, ease.out) * (1 - prog(t, A.virada - 0.2, 0.3));
  creme.visible = cr > 0.01; creme.position.set(0.05, TOP + 0.04 + (1 - cr) * 0.35, 0); creme.scale.set(1.3 * cr, 0.35 * cr, 1.0 * cr);
  // produto herói: entra girando com brilho e raios
  const hk = pop(t, A.virada + 0.05, Infinity, 0.5); heroi.visible = hk > 0.01; heroi.scale.setScalar(Math.max(0.001, hk));
  POS_H.lerpVectors(HEROI, HEROI2, prog(t, A.produto - 0.4, 0.5, ease.inOut));
  heroi.position.copy(POS_H); heroi.position.y += (1 - Math.min(1, hk)) * 0.3; heroi.rotation.y = -0.35 + (1 - Math.min(1, hk)) * 3;
  const brilhoK = win(t, A.virada, DURATION + 1, 0.4, 0.4) * (0.75 + 0.25 * Math.sin(t * 5));
  luz.visible = hk > 0.01; luz.position.copy(POS_H).add(V(0, 0.12, -0.05)); luz.scale.setScalar(0.9 * brilhoK);
  raios.forEach((r, k) => { const a = (k / raios.length) * Math.PI * 2 + t * 0.6; r.visible = hk > 0.5; r.position.copy(POS_H).add(V(Math.cos(a) * 0.32, 0.12 + Math.sin(a) * 0.32, -0.08)); r.rotation.set(0, 0, a - Math.PI / 2); r.scale.setScalar(brilhoK); });
  aplicarPiscadas(t);
}
iniciar({ duracao: DURATION, ancoras: A, update, desenhar });
