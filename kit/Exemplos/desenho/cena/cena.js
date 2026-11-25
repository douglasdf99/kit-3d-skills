/* =====================================================================================
   DEMO DE 10 s: Cesta de basquete   ·   estilo «Desenho»
   A bola jogada numa caixa no chão quica pra fora (◀◀); então desce um aro lá do alto, a rede aparece embaixo
   e a bola entra direto. "Essa é a cesta" → aro e rede piscam, com linhas de velocidade e VUSH!
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, prog, win, pop, hash } from '../../../sistema/motor/lib.js';
import * as E from '../../../biblioteca/estilos/desenho/estilo.js';
import { W, H, T, TL, scene, V, orb, FIM_NARRACAO, fecharCameras, label, chip, configurarLegendas, som, ambiente, iniciar } from '../../../sistema/motor/video.js';
import { piscar, aplicarPiscadas, efeitosCamera, desenharEfeitos, rebobinar, emote, zoomSoco, linhas, impacto } from '../../../sistema/motor/edicao.js';

const N = TL.lines.length, L = (i) => TL.lines[(i + N) % N];
const A = { joga: T('joga a bola'), caixa: T('numa caixa'), chao: T('no chao'), quica: T('quica'), fora: T('pra fora'),
  entao: T('entao'), pendura: T('pendura'), aro: T('um aro'), alto: T('no alto'), rede: T('uma rede'), embaixo: T('embaixo'), cesta: T('essa e'), nome: T('cesta') };
const VOLTA = 0.7, R = Math.min(L(0).e - 0.2, A.entao - VOLTA - 0.05);
const DURATION = Math.max(FIM_NARRACAO + 0.5, A.cesta + 1.9); A.end = DURATION;
const hist = (t) => (t >= R && t < R + VOLTA ? lerp(R, A.joga - 0.1, ease.inOut((t - R) / VOLTA)) : t);
E.preparar();

/* ------------------------------------------------------------------ cenário: ginásio da escola */
scene.add(E.ginasio({ circuloX: 0.2, circuloZ: 0.2 }));

/* ------------------------------------------------------------------ a caixa no chão (fica embaixo da cesta) */
const CX = V(0.6, 0, -0.5), MAD = '#e0a458';
const caixa = new THREE.Group(); caixa.position.copy(CX); scene.add(caixa);
caixa.add(E.contorno(E.em(E.caixa(0.72, 0.05, 0.72, MAD), 0, 0.025, 0), 0.01));
for (const [x, z, w, d] of [[0, 0.34, 0.72, 0.05], [0, -0.34, 0.72, 0.05], [0.34, 0, 0.05, 0.72], [-0.34, 0, 0.05, 0.72]]) caixa.add(E.contorno(E.em(E.caixa(w, 0.42, d, MAD), x, 0.21, z), 0.01));

/* ------------------------------------------------------------------ a cesta: haste do teto, tabela, aro e rede */
const AROY = 2.6, AROZ = CX.z - 0.02;
const cesta = new THREE.Group(); scene.add(cesta);
cesta.add(E.contorno(E.em(E.cilindro(0.04, 3, '#7a7f88'), CX.x, AROY + 1.95, CX.z - 0.45), 0.01));
const tabela = E.contorno(E.em(E.caixa(1.1, 0.72, 0.05, '#ffffff', { r: 0.02 }), CX.x, AROY + 0.3, CX.z - 0.45), 0.014); cesta.add(tabela);
cesta.add(E.em(E.caixa(0.42, 0.3, 0.06, '#e63946', { r: 0.01 }), CX.x, AROY + 0.18, CX.z - 0.43), E.em(E.caixa(0.34, 0.22, 0.07, '#ffffff', { r: 0.01 }), CX.x, AROY + 0.18, CX.z - 0.43));
const aro = E.toro(0.23, 0.022, '#ff7a1a'); aro.rotation.x = Math.PI / 2; E.em(aro, CX.x, AROY, AROZ); E.contorno(aro, 0.008); cesta.add(aro);
cesta.add(E.em(E.caixa(0.06, 0.04, 0.2, '#ff7a1a'), CX.x, AROY, CX.z - 0.33));
// rede: 14 fios cruzados + 2 anéis (fios finos de verdade, pra aparecer no vídeo)
const rede = new THREE.Group(), FIO = E.material('#ffffff');
const fio = (a, b) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, a.distanceTo(b), 5), FIO); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); rede.add(m); };
for (let i = 0; i < 14; i++) for (const s of [1, -1]) { const a = i / 14 * Math.PI * 2, b = a + s * 0.45; fio(V(Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22), V(Math.cos(b) * 0.14, -0.42, Math.sin(b) * 0.14)); }
for (const [r, y] of [[0.185, -0.2], [0.14, -0.42]]) { const an = E.toro(r, 0.006, '#ffffff'); an.rotation.x = Math.PI / 2; an.position.y = y; rede.add(an); }
const redeP = E.em(new THREE.Group(), CX.x, AROY, AROZ); redeP.add(rede);
const gCesta = new THREE.Group(); gCesta.add(aro, redeP); cesta.add(gCesta);

/* ------------------------------------------------------------------ a bola */
const bola = new THREE.Group(); scene.add(bola);
bola.add(E.contorno(E.esfera(0.13, '#ff8a2a'), 0.01));
for (const r of [[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0]]) { const l = E.toro(0.131, 0.006, '#3a1d0d'); l.rotation.set(...r); bola.add(l); }

/* ------------------------------------------------------------------ o boneco */
const ze = E.boneco(); ze.position.set(-0.65, 0, 0.4); ze.rotation.y = 2.0; scene.add(ze);
const MAO = V(-0.42, 0.88, 0.32);
scene.updateMatrixWorld(true);

/* ------------------------------------------------------------------ câmera */
orb(0, V(-0.15, 0.85, 0), 55, 10, 4.4, 40, 0);
orb(A.joga + 0.1, V(0.1, 1.0, -0.1), 48, 12, 5.0, 40, 1.0);
orb(A.quica - 0.15, V(0.8, 0.5, -0.2), 40, 12, 3.7, 40, 0.6);
orb(R + VOLTA, V(0.1, 1.2, -0.1), 50, 10, 5.4, 40, 0);
orb(A.pendura - 0.1, V(CX.x, AROY - 0.35, CX.z), 26, 2, 3.4, 40, 1.0);
orb(A.rede - 0.1, V(CX.x, AROY - 0.2, CX.z), 34, 0, 2.3, 40, 0.7);
orb(A.cesta - 1.0, V(0.05, 1.5, -0.1), 46, 8, 6.6, 42, 0.9);
orb(A.cesta + 0.2, V(0.1, 1.45, -0.2), 12, 12, 7.4, 42, 1.2);
fecharCameras({ duracao: DURATION });

/* ------------------------------------------------------------------ letreiros, piscadas e edição do estilo */
chip('CAIXA', A.caixa - 0.05, A.quica - 0.1, () => CX.clone().add(V(0, 0.45, 0)), '#6b7280', { dy: -80, size: 58 });
impacto('PÓIN!', A.quica, A.quica + 0.75, () => CX.clone().add(V(0.2, 0.7, 0)));
emote('suor', A.quica + 0.1, R + 0.05, ze);
rebobinar(R, VOLTA); som('rewind', R, -8);
linhas(A.cesta - 0.15, A.cesta + 0.6); impacto('VUSH!', A.cesta - 0.2, A.cesta + 0.35, () => V(CX.x - 0.6, AROY - 0.45, AROZ)); zoomSoco(A.cesta - 0.1, 0.12);
label('CESTA', A.cesta + 0.1, A.cesta + 1.85, () => V(CX.x, AROY - 0.2, AROZ + 0.2), { dy: -260, size: 90 });
piscar(gCesta, A.cesta);
emote('ideia', A.cesta + 0.05, A.cesta + 1.4, ze);
configurarLegendas({ nomes: ['cesta'] });

/* ------------------------------------------------------------------ sons */
som('whoosh', A.joga + 0.1, -14); som('thud', A.caixa + 0.3, -10); som('bola_quicando', A.quica - 0.05, -8); som('bounce', A.fora + 0.2, -14);
som('cableup', A.pendura - 0.05, -14); som('clunk_soft', A.alto + 0.1, -12); som('pop', A.rede + 0.1, -14);
som('whoosh', A.cesta - 0.75, -14); som('cesta_rede', A.cesta - 0.12, -6); som('estadio_torcida', A.cesta + 0.2, -16, { dur: 1.8, fadeOut: 0.6 });
ambiente('birds', 0, DURATION, -36, { fade: 0.5 });

/* ------------------------------------------------------------------ animação */
const arco = (a, b, h, k) => V(lerp(a.x, b.x, k), lerp(a.y, b.y, k) + Math.sin(k * Math.PI) * h, lerp(a.z, b.z, k));
function update(t) {
  efeitosCamera(t);
  const tt = hist(t), tentativa = t < R + VOLTA;
  // bola
  let p = MAO.clone(), giro = 0;
  if (tentativa) {
    const tc = A.caixa + 0.3, voo = prog(tt, A.joga + 0.1, tc - A.joga - 0.1, (k) => k);
    const fundo = CX.clone().add(V(0, 0.18, 0)), fora = CX.clone().add(V(1.0, 0.13, 1.2));
    if (tt < tc) p = arco(MAO, fundo, 1.2, voo);
    else if (tt < A.quica) p = fundo.clone().add(V(0, Math.abs(Math.sin((tt - tc) * 9)) * 0.08 * Math.max(0, 1 - (tt - tc) * 2), 0));
    else { const k = prog(tt, A.quica, 0.9, (x) => x); p = arco(fundo, fora, 1.0, Math.min(1, k)); if (k >= 1) p = fora.clone().add(V((tt - A.quica - 0.9) * 0.4, 0, (tt - A.quica - 0.9) * 0.3)); }
    giro = tt * 8;
  } else {
    const t0 = A.cesta - 0.85, alvo = V(CX.x, AROY + 0.05, AROZ), noFundo = CX.clone().add(V(0, 0.18, 0));
    if (t < t0) p = MAO.clone(); else if (t < A.cesta - 0.15) p = arco(MAO, alvo, 1.0, prog(t, t0, A.cesta - 0.15 - t0, (k) => k));
    else p = V(alvo.x, Math.max(noFundo.y, alvo.y - 4.9 * (t - A.cesta + 0.15) ** 2 * 1.6), alvo.z);
    giro = t * 8;
  }
  bola.position.copy(p); bola.rotation.set(giro, giro * 0.6, 0);
  // cesta: desce do teto e a rede cresce embaixo do aro (só depois do ◀◀)
  const desce = tentativa ? 0 : prog(t, A.pendura - 0.05, Math.max(0.5, A.alto - A.pendura + 0.25), ease.back);
  cesta.visible = desce > 0; cesta.position.y = (1 - desce) * 3.2;
  const r = tentativa ? 0 : prog(t, A.rede - 0.05, 0.45, ease.back); redeP.scale.set(1, Math.max(0.01, r), 1);
  const balanca = t > A.cesta - 0.15 ? Math.sin((t - A.cesta) * 22) * 0.12 * Math.max(0, 1 - (t - A.cesta) * 1.5) : 0; rede.scale.set(1 - balanca, 1 + balanca, 1 - balanca); rede.visible = r > 0.01;
  // boneco
  let humor = 0.6, pose = null, pk = 0;
  if (tentativa && tt > A.joga - 0.2 && tt < A.joga + 0.4) { pose = 'segura'; pk = win(tt, A.joga - 0.2, A.joga + 0.4, 0.15, 0.15); }
  if (tentativa && tt > A.quica) { humor = -0.8; pose = 'susto'; pk = win(tt, A.quica, R, 0.15, 0.15); }
  if (!tentativa && t > A.entao && t < A.embaixo + 0.6) { pose = 'aponta'; pk = win(t, A.entao, A.embaixo + 0.6, 0.2, 0.25); humor = 0.7; }
  if (!tentativa && t > A.cesta - 1.1 && t < A.cesta - 0.6) { pose = 'segura'; pk = win(t, A.cesta - 1.1, A.cesta - 0.6, 0.12, 0.1); }
  if (!tentativa && t > A.cesta + 0.1) { pose = 'comemora'; pk = prog(t, A.cesta + 0.1, 0.3); humor = 1; }
  E.animar(ze, tt, { humor, pose, poseK: pk });
  aplicarPiscadas(t);
}
iniciar({ duracao: DURATION, ancoras: A, update, desenhar: (t) => desenharEfeitos(t) });
