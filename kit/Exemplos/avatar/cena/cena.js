/* =====================================================================================
   DEMO DE 10 s: Escada   ·   estilo «Avatar de jogo»
   O avatar tenta subir num muro alto, escorrega e cai de cara no chão (◀◀); então os blocos vão se empilhando,
   cada coluna um degrau mais alta, e ele sobe pulando até o topo. "Essa é a escada" → degraus piscam + círculo vermelho.
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, prog, win, pop, hash } from '../../../sistema/motor/lib.js';
import * as E from '../../../biblioteca/estilos/avatar/estilo.js';
import { W, H, T, TL, scene, V, orb, FIM_NARRACAO, fecharCameras, label, chip, configurarLegendas, som, ambiente, iniciar } from '../../../sistema/motor/video.js';
import { piscar, aplicarPiscadas, efeitosCamera, desenharEfeitos, rebobinar, emote, zoomSoco, tremor, circulo, impacto } from '../../../sistema/motor/edicao.js';

const N = TL.lines.length, L = (i) => TL.lines[(i + N) % N];
const A = { tenta: T('tenta subir'), muro: T('muro alto'), escorrega: T('escorrega'), cai: T('cai de cara'), chao: T('no chao'),
  entao: T('entao'), empilha: T('empilha'), blocos: T('blocos'), cada: T('cada um'), alto: T('mais alto'), outro: T('o outro'), escada: T('essa e'), nome: T('escada') };
const VOLTA = 0.7, R = Math.min(L(0).e - 0.2, A.entao - VOLTA - 0.05);
const DURATION = Math.max(FIM_NARRACAO + 0.5, A.escada + 1.9); A.end = DURATION;
const hist = (t) => (t >= R && t < R + VOLTA ? lerp(R, A.tenta - 0.1, ease.inOut((t - R) / VOLTA)) : t);
E.preparar();

/* ------------------------------------------------------------------ cenário: mapa de jogo (grama lisa, muro de tijolo, bandeira lá em cima) */
scene.add(E.chao({ largura: 50, prof: 50 }));
const HM = 2.25, MX0 = 0.5;                                   // altura do muro e onde ele começa (x)
scene.add(E.em(E.paredeTijolo(2.2, HM, { esp: 1.3 }), MX0 + 1.1, HM / 2, 0));
scene.add(E.em(E.bloco(2.24, 0.1, 1.34, '#4cae4c', { r: 0.02 }), MX0 + 1.1, HM + 0.05, 0));
const bandeira = E.grupo(E.em(E.cilindro(0.03, 1.1, '#e0e0e0'), 0, 0.55, 0), E.em(E.bloco(0.5, 0.32, 0.04, '#e9545a', { r: 0.01 }), 0.26, 0.92, 0));
scene.add(E.em(bandeira, MX0 + 1.6, HM + 0.1, -0.2));
for (const [x, z, s] of [[-3.2, -3.5, 1], [4.4, -3.2, 1.2], [-4.6, 1.5, 0.9], [5.2, 2.2, 0.8]]) scene.add(E.em(E.arvore({ tam: s }), x, 0, z));
for (let i = 0; i < 4; i++) scene.add(E.em(E.plataforma(1.4, 1.4, ['#f2c230', '#5aa0e6', '#e9545a', '#a77be0'][i], { altura: 0.25 + 0.25 * i }), -6 + i * 2.2, 0, -7 - i));

/* ------------------------------------------------------------------ a escada: colunas de blocos, cada uma um bloco mais alta */
const LB = 0.45, NC = 4, CORES = ['#f2c230', '#5aa0e6', '#57b36b', '#e9545a'];
const blocos = [];
for (let c = 0; c < NC; c++) for (let k = 0; k <= c; k++) { const b = E.bloco(LB, LB, 1.1, CORES[c], { r: 0.03 }); b.position.set(MX0 - LB / 2 - (NC - 1 - c) * LB, LB / 2 + k * LB, 0); b.userData.ordem = blocos.length; scene.add(b); blocos.push(b); }
const gEscada = E.grupo(...blocos); scene.add(gEscada);
const XC = (c) => MX0 - LB / 2 - (NC - 1 - c) * LB;          // x do meio de cada degrau

/* ------------------------------------------------------------------ o avatar (dentro de um pivô nos pés, pra poder cair de cara) */
const piv = new THREE.Group(); scene.add(piv);
const ze = E.boneco(); piv.add(ze); piv.scale.setScalar(0.62);   // avatar menor que o normal: o muro tem 2× a altura dele
const X0 = -1.75;
scene.updateMatrixWorld(true);

/* ------------------------------------------------------------------ câmera */
orb(0, V(X0 + 0.6, 0.75, 0.3), 28, 8, 3.6, 40, 0);
orb(A.muro - 0.25, V(-0.05, 1.05, 0.2), 20, 8, 5.0, 40, 0.9);
orb(A.cai - 0.15, V(-0.3, 0.25, 0.4), 12, 30, 2.8, 40, 0.5);
orb(R + VOLTA, V(-0.6, 0.9, 0.3), -18, 10, 5.4, 40, 0);
orb(A.empilha - 0.1, V(-0.4, 0.8, 0.2), -34, 14, 4.6, 40, 1.0);
orb(A.escada - 1.0, V(-0.1, 1.3, 0.2), -24, 12, 5.8, 40, 0.9);
orb(A.escada + 0.2, V(0.3, 1.5, 0.2), -8, 14, 7.2, 42, 1.2);
fecharCameras({ duracao: DURATION });

/* ------------------------------------------------------------------ letreiros e edição de meme */
chip('MURO ALTO', A.muro - 0.05, A.escorrega, () => V(MX0 + 0.3, HM, 0.65), '#6b7280', { dy: -90, size: 64 });
emote('!', A.escorrega - 0.05, A.cai, ze);
emote('estrelas', A.cai + 0.25, R + 0.05, ze, { dy: 0.1 });
tremor(A.cai + 0.2, 0.35, 0.012); zoomSoco(A.cai + 0.2, 0.14); impacto('PLOFT!', A.cai + 0.2, A.cai + 0.9, () => V(X0 + 1.5, 0.3, 0.8));
rebobinar(R, VOLTA); som('rewind', R, -8);
label('ESCADA', A.escada, A.escada + 1.75, () => V(XC(1), 1.1, 0.6), { dy: -300, size: 90 });
piscar(gEscada, A.escada); circulo(A.escada, A.escada + 1.6, () => V(XC(1.5), 0.9, 0.55), { r: 230 }); zoomSoco(A.escada + 0.02, 0.12);
configurarLegendas({ nomes: ['escada'] });

/* ------------------------------------------------------------------ sons */
som('stepsfast', A.tenta + 0.05, -14, { dur: 0.5, fadeOut: 0.1 }); som('pulo_aterrissagem', A.muro - 0.1, -12); som('slide', A.escorrega - 0.05, -10);
som('thud', A.cai + 0.2, -6); som('tweety', A.cai + 0.35, -18);
blocos.forEach((b, i) => som('pop', tBloco(i), -14 - (i % 3)));
[0, 1, 2, 3, 4].forEach((k) => som('pulo_8bit', tPulo(k), -15));
som('coins', A.escada + 0.25, -12); som('cheer', A.escada + 0.4, -16);
ambiente('birds', 0, DURATION, -30, { fade: 0.5 });

/* ------------------------------------------------------------------ animação */
function tBloco(i) { return A.empilha - 0.05 + (i / (blocos.length - 1)) * Math.max(0.8, A.outro + 0.2 - A.empilha); }
function tPulo(k) { return A.escada - 1.0 + k * 0.26; }       // 4 degraus + o topo do muro
function update(t) {
  efeitosCamera(t);
  const tt = hist(t), tentativa = t < R + VOLTA;
  blocos.forEach((b, i) => { const s = tentativa ? 0 : pop(t, tBloco(i), Infinity, 0.3); b.visible = s > 0.001; b.scale.setScalar(Math.max(0.001, s)); });
  let x = X0, y = 0, ry = Math.PI / 2, queda = 0, andar = 0, humor = 0.5, pose = null, pk = 0, boca = null;
  if (tentativa) {
    const corre = prog(tt, A.tenta, Math.max(0.4, A.muro - A.tenta - 0.15)), xp = MX0 - 0.28;
    x = lerp(X0, xp, corre); andar = win(tt, A.tenta, A.muro - 0.1, 0.1, 0.1);
    const sobe = prog(tt, A.muro - 0.15, 0.35, ease.out), desce = prog(tt, A.escorrega - 0.05, Math.max(0.3, A.cai - A.escorrega), ease.in);
    y = 1.0 * sobe * (1 - desce);
    if (tt > A.muro - 0.15) { pose = 'susto'; pk = win(tt, A.muro - 0.15, A.cai, 0.1, 0.1); humor = -0.4; }
    const vira = prog(tt, A.cai - 0.1, 0.25); ry = lerp(Math.PI / 2, 0, vira); x -= 0.35 * vira;
    queda = prog(tt, A.cai, 0.3, ease.in); if (queda > 0) { boca = 'susto'; humor = -1; }
  } else {
    // sobe pulando degrau por degrau
    for (let k = 0; k < 5; k++) {
      const tp = tPulo(k), fim = k < 4 ? XC(k) : MX0 + 0.55, alt = k < 4 ? (k + 1) * LB : HM + 0.1, x0 = k === 0 ? X0 : (k - 1 < 4 ? XC(k - 1) : X0), y0 = k === 0 ? 0 : k * LB;
      if (t >= tp) { const q = clamp((t - tp) / 0.24); x = lerp(x0, fim, q); y = lerp(y0, alt, q) + Math.sin(q * Math.PI) * 0.3; }
    }
    if (t > A.entao && t < A.outro + 0.4) { pose = 'aponta'; pk = win(t, A.entao, A.outro + 0.4, 0.2, 0.25); humor = 0.8; ry = 1.0; }
    if (t > A.escada + 0.35) { pose = 'comemora'; pk = prog(t, A.escada + 0.35, 0.3); humor = 1; ry = lerp(Math.PI / 2, 0.3, prog(t, A.escada + 0.35, 0.3)); }
  }
  piv.position.set(x, y, 0); piv.rotation.set(queda * Math.PI / 2 * 0.95, 0, 0); ze.rotation.y = ry;
  E.animar(ze, tt, { humor, pose, poseK: pk, andar, boca });
  aplicarPiscadas(t);
}
iniciar({ duracao: DURATION, ancoras: A, update, desenhar: (t) => desenharEfeitos(t) });
