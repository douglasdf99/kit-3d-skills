/* =====================================================================================
   DEMO DE 10 s: Trilho de trem   ·   estilo «Brinquedo»
   O trenzinho posto direto na terra afunda as rodas e trava (◀◀); então caem as vigas de madeira, os trilhos
   descem por cima e o trem sai andando. "Esses são os dormentes" → as vigas piscam.
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, prog, win, pop, hash } from '../../../sistema/motor/lib.js';
import * as E from '../../../biblioteca/estilos/brinquedo/estilo.js';
import { W, H, T, TL, scene, V, orb, FIM_NARRACAO, fecharCameras, label, chip, configurarLegendas, som, ambiente, iniciar } from '../../../sistema/motor/video.js';
import { piscar, aplicarPiscadas, efeitosCamera, desenharEfeitos, rebobinar, emote, tremor, impacto, transicao } from '../../../sistema/motor/edicao.js';

const N = TL.lines.length, L = (i) => TL.lines[(i + N) % N];
const A = { poe: T('poe o trem'), terra: T('na terra'), rodas: T('as rodas'), afundam: T('afundam'), trava: T('trava'),
  entao: T('entao'), deita: T('deita'), vigas: T('vigas'), madeira: T('de madeira'), prende: T('prende'), trilhos: T('os trilhos'), cima: T('em cima'),
  dormentes: T('esses sao'), nome: T('dormentes') };
const VOLTA = 0.7, R = Math.min(L(0).e - 0.2, A.entao - VOLTA - 0.05);
const DURATION = Math.max(FIM_NARRACAO + 0.5, A.dormentes + 1.9); A.end = DURATION;
const hist = (t) => (t >= R && t < R + VOLTA ? lerp(R, A.poe - 0.15, ease.inOut((t - R) / VOLTA)) : t);
E.preparar();

/* ------------------------------------------------------------------ cenário: terreiro de terra, morros, cerca, agaves */
scene.add(E.chao({ repetir: 14 }));
scene.add(E.morros({ dist: 26 }));
scene.add(E.cerca(-6, 6, -3.2));
scene.add(E.pedras(40, [-6, 6, -3, 3]));
for (const [x, z, s] of [[-3.6, -2.2, 1], [3.2, -2.6, 0.8], [4.4, 1.8, 0.9], [-4.5, 1.6, 0.7]]) scene.add(E.em(E.agave({ tam: s }), x, 0, z));
scene.add(E.em(E.arvore({ tam: 1.3 }), -5.2, 0, -4.2), E.em(E.arvore({ tam: 1.1 }), 5.5, 0, -4.6));

/* ------------------------------------------------------------------ a via: dormentes (vigas de madeira) e os dois trilhos */
const MAD = E.material('#8a6440', { fosco: true }), ACO = E.material('#9aa1a7', { metal: 0.75, rugosidade: 0.3 });
const DX = 0.45, ND = 17, XI = -3.6;
const dorm = Array.from({ length: ND }, (_, i) => { const d = E.caixa(0.2, 0.07, 1.0, MAD, { r: 0.015 }); d.position.set(XI + i * DX, 0.035, 0); scene.add(d); return d; });
const gDorm = E.grupo(...dorm); scene.add(gDorm);
const trilhos = [-0.3, 0.3].map((z) => { const r = E.caixa(ND * DX, 0.07, 0.06, ACO, { r: 0.012 }); r.position.set(XI + (ND - 1) * DX / 2, 0.105, z); scene.add(r); return r; });

/* ------------------------------------------------------------------ o trenzinho */
const trem = new THREE.Group(); scene.add(trem);
const corpo = new THREE.Group(); trem.add(corpo);
const VERM = E.material('#d63a2f', { brilho: 0.8 }), AZUL = E.material('#2a62b8', { brilho: 0.8 }), PRETO = E.material('#24262b', { brilho: 0.5 }), AMAR = E.material('#f2c230', { brilho: 0.8 });
corpo.add(E.em(E.caixa(1.3, 0.16, 0.6, PRETO), 0, 0.27, 0));
const caldeira = E.cilindro(0.24, 0.8, VERM); caldeira.rotation.z = Math.PI / 2; corpo.add(E.em(caldeira, 0.18, 0.58, 0));
corpo.add(E.em(E.cilindro(0.25, 0.05, AMAR), 0.6, 0.58, 0)); corpo.children.at(-1).rotation.z = Math.PI / 2;
corpo.add(E.em(E.caixa(0.46, 0.56, 0.64, AZUL), -0.44, 0.63, 0), E.em(E.caixa(0.58, 0.07, 0.74, VERM), -0.44, 0.94, 0));
corpo.add(E.em(E.caixa(0.3, 0.2, 0.66, E.material('#bfe3ff', { brilho: 1 })), -0.44, 0.72, 0));
const chamine = E.cilindro(0.08, 0.3, PRETO, { rTopo: 0.12 }); corpo.add(E.em(chamine, 0.42, 0.92, 0));
corpo.add(E.em(E.esfera(0.09, AMAR), 0.3, 0.84, 0));
const rodas = [];
for (const x of [-0.38, 0.38]) for (const z of [-0.3, 0.3]) { const w = E.grupo(E.cilindro(0.15, 0.07, PRETO), E.em(E.cilindro(0.06, 0.09, AMAR), 0, 0, 0), E.em(E.caixa(0.035, 0.1, 0.25, AMAR), 0, 0.001, 0)); w.rotation.x = Math.PI / 2; const piv = E.em(new THREE.Group(), x, 0.15, z); piv.add(w); corpo.add(piv); rodas.push(piv); }
// fumaça (bolinhas brancas) e terra voando
const FUMO = Array.from({ length: 10 }, () => { const s = E.esfera(0.1, E.material('#ffffff', { fosco: true }), { seg: 16 }); scene.add(s); return s; });
const TERRA = Array.from({ length: 16 }, (_, i) => { const s = E.esfera(0.035, E.material(i % 2 ? '#8f6c4a' : '#b08a62', { fosco: true }), { seg: 8 }); scene.add(s); return s; });

/* ------------------------------------------------------------------ o boneco (atrás da via, de frente pra câmera) */
const ze = E.boneco({ capacete: '#f2c230' }); ze.position.set(-0.35, 0, -1.0); ze.rotation.y = -0.85; scene.add(ze);
const X0 = -1.6;
scene.updateMatrixWorld(true);

/* ------------------------------------------------------------------ câmera de cinema: aproxima devagar, baixa no erro, abre no nome */
orb(0, V(-1.0, 0.55, -0.3), 28, 12, 4.4, 40, 0);
orb(A.poe + 0.15, V(-1.1, 0.45, -0.4), 35, 14, 4.7, 40, 1.0);
orb(A.afundam - 0.3, V(-1.35, 0.2, 0.2), 62, 5, 2.9, 40, 0.8);
orb(A.trava - 0.05, V(-1.0, 0.5, -0.4), 22, 12, 4.3, 40, 0.6);
orb(R + VOLTA, V(-0.2, 0.2, 0), 34, 24, 5.6, 40, 0);
orb(A.prende - 0.15, V(-0.9, 0.12, 0.1), 72, 9, 3.4, 40, 1.0);
orb(A.dormentes - 0.2, V(0.4, 0.35, 0), -32, 20, 7.0, 42, 1.0, 0.03, { spin: -0.05 });
fecharCameras({ duracao: DURATION });

/* ------------------------------------------------------------------ letreiros, piscadas e edição */
chip('TERRA FOFA', A.terra, A.afundam - 0.1, () => V(X0, 0.05, 0.4), '#8a6440', { dy: -280, size: 64 });
chip('AFUNDOU', A.afundam + 0.05, R, () => V(X0 + 0.3, 0.1, 0.4), '#ff3b2f', { dy: -60, size: 64 });
emote('suor', A.afundam, R + 0.05, ze);
tremor(A.afundam - 0.05, 0.4, 0.01); impacto('TRAVOU!', A.trava, A.trava + 0.8, () => V(X0 + 0.3, 1.0, 0));
rebobinar(R, VOLTA); som('rewind', R, -8);
label('DORMENTES', A.dormentes, A.dormentes + 1.75, () => V(XI + 9 * DX, 0.05, 0.5), { dy: -200 });
piscar(gDorm, A.dormentes);
emote('ideia', A.dormentes - 0.1, A.dormentes + 1.3, ze);
configurarLegendas({ nomes: ['dormentes'] });

/* ------------------------------------------------------------------ sons */
som('whoosh_suave', A.poe, -15); som('thud', A.terra - 0.05, -12);
som('motorstrain', A.rodas - 0.1, -14, { dur: Math.max(0.6, A.trava - A.rodas + 0.1), fadeOut: 0.2 }); som('mudsink', A.afundam - 0.05, -9);
som('steamhiss', A.trava, -12); som('aah', A.trava + 0.25, -8);
dorm.forEach((d, i) => { if (i % 2 === 0) som('woodslam', tDorm(i), -20 - (i % 4)); });
som('metalfall', A.trilhos - 0.05, -14); [0, 1, 2, 3].forEach((k) => som('click', A.cima - 0.1 + k * 0.09, -16));
som('trem_vapor', A.cima + 0.2, -12, { dur: DURATION - A.cima, fadeOut: 0.4 }); som('buzina_trem', A.dormentes + 0.1, -12);
ambiente('birds', 0, DURATION, -30, { fade: 0.5 });

/* ------------------------------------------------------------------ animação */
function tDorm(i) { return A.deita + (i / (ND - 1)) * Math.max(0.6, A.madeira + 0.35 - A.deita); }
function update(t) {
  efeitosCamera(t);
  const tt = hist(t), tentativa = t < R + VOLTA;
  // a via só existe depois do ◀◀: dormentes caem um a um, trilhos descem por cima
  dorm.forEach((d, i) => { const k = tentativa ? 0 : prog(t, tDorm(i), 0.28, ease.in); d.visible = k > 0; d.position.y = 0.035 + (1 - k) * 0.9; d.rotation.y = (1 - k) * 0.5; });
  trilhos.forEach((r, j) => { const k = tentativa ? 0 : prog(t, A.trilhos + j * 0.12, Math.max(0.3, A.cima - A.trilhos - 0.05), ease.in); r.visible = k > 0; r.position.y = 0.105 + (1 - k) * 1.2; });
  // trem: na tentativa cai na terra, anda um pouquinho, afunda e trava; depois do ◀◀ desce nos trilhos e sai andando
  let x, y, inc = 0, giro = 0, vis = true;
  if (tentativa) {
    const desce = prog(tt, A.poe, 0.45, ease.in), anda = prog(tt, A.terra, Math.max(0.4, A.afundam - A.terra), ease.out), af = prog(tt, A.afundam - 0.15, 0.5, ease.out);
    vis = tt > A.poe - 0.05; x = X0 + 0.35 * anda; y = (1 - desce) * 1.4 - 0.13 * af; inc = 0.07 * af;
    giro = tt * (tt < A.trava ? 14 : 0) * (tt > A.terra ? 1 : 0);
  } else {
    const desce = prog(t, A.cima + 0.1, 0.4, ease.in), v = t > A.cima + 0.5 ? (t - A.cima - 0.5) : 0;
    vis = t > A.cima; x = -2.6 + 0.9 * v + 0.25 * v * v * 0.5; y = 0.14 + (1 - desce) * 1.2; giro = v * 9;
  }
  trem.visible = vis; trem.position.set(x, y, 0); trem.rotation.z = inc;
  rodas.forEach((r) => (r.rotation.z = -giro));
  // fumaça sai da chaminé; terra voa das rodas quando atolam
  const fumando = tentativa ? (tt > A.terra && tt < A.trava + 0.3) : t > A.cima + 0.3;
  FUMO.forEach((s, i) => { const f = ((t * 0.9 + i / FUMO.length) % 1); s.visible = vis && fumando; s.position.set(x + 0.42 - f * 0.9, y + 1.05 + f * 1.1, Math.sin(i * 2.1) * 0.15 * f); s.scale.setScalar(0.5 + f * 1.6); });
  TERRA.forEach((s, i) => { const f = ((t * 1.6 + hash(i)) % 1); const on = tentativa && tt > A.rodas && tt < A.trava; s.visible = on; s.position.set(x - 0.4 - f * 0.7, Math.max(0.03, 0.05 + f * 0.9 - f * f * 1.2), (i % 2 ? 0.35 : -0.35) + (hash(i * 3) - 0.5) * 0.2); });
  // boneco
  let humor = 0.5, pose = null, pk = 0;
  if (tentativa && tt > A.afundam - 0.1) { humor = -0.8; pose = 'susto'; pk = win(tt, A.afundam - 0.1, R, 0.2, 0.15); }
  if (!tentativa && t > A.entao - 0.05 && t < A.madeira + 0.6) { pose = 'aponta'; pk = win(t, A.entao, A.madeira + 0.6, 0.2, 0.25); humor = 0.7; }
  if (!tentativa && t > A.dormentes + 0.3) { pose = 'comemora'; pk = prog(t, A.dormentes + 0.3, 0.3); humor = 1; }
  E.animar(ze, tt, { humor, pose, poseK: pk, olhar: tentativa ? -0.3 : 0 });
  aplicarPiscadas(t);
}
iniciar({ duracao: DURATION, ancoras: A, update, desenhar: (t) => desenharEfeitos(t) });
