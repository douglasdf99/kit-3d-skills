/* =====================================================================================
   DEMO DE 10 s: Ponte   ·   estilo «Cubinhos»
   A tábua jogada por cima do rio enverga e o boneco cai na água (◀◀); então sobem dois pilares de pedra,
   bloco por bloco, e a tábua passa a ter apoio. "Esses são os pilares" → os pilares piscam.
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, prog, win, pop, hash } from '../../../sistema/motor/lib.js';
import * as E from '../../../biblioteca/estilos/cubinhos/estilo.js';
import { W, H, T, TL, scene, V, orb, FIM_NARRACAO, fecharCameras, label, chip, configurarLegendas, som, ambiente, iniciar } from '../../../sistema/motor/video.js';
import { piscar, aplicarPiscadas, efeitosCamera, desenharEfeitos, rebobinar, emote, zoomSoco, tremor, conquista, impacto } from '../../../sistema/motor/edicao.js';

const N = TL.lines.length, L = (i) => TL.lines[(i + N) % N];
const A = { joga: T('joga uma'), tabua: T('tabua'), rio: T('do rio'), enverga: T('enverga'), meio: T('no meio'), cai: T('cai na'), agua: T('agua'),
  entao: T('entao'), colunas: T('colunas'), pedra: T('de pedra'), fundo: T('no fundo'), pilares: T('esses sao'), nome: T('pilares') };
const VOLTA = 0.7, R = Math.min(L(0).e - 0.2, A.entao - VOLTA - 0.05);          // a fita volta na pausa antes do "Então"
const DURATION = Math.max(FIM_NARRACAO + 0.5, A.pilares + 1.9); A.end = DURATION;
const hist = (t) => (t >= R && t < R + VOLTA ? lerp(R, A.joga - 0.1, ease.inOut((t - R) / VOLTA)) : t);   // tempo da história (anda pra trás no ◀◀)
E.preparar();

/* ------------------------------------------------------------------ cenário: rio de 3 m cortando o gramado, cidade ao fundo */
const RIO = 1.5;                                                   // o rio vai de x = -1,5 a x = 1,5
scene.add(E.terreno({ largura: 26, prof: 20, buraco: (x) => x >= -RIO && x < RIO, alturas: (x, z) => (z < -6 ? 1 + (x > 4 ? 1 : 0) : 0) }));
const leito = E.terreno({ largura: 3, prof: 20, cores: ['#7d7468', '#6e665c', '#8a8174', '#776d61'], fundo: 0 }); leito.position.y = -1.0; scene.add(leito);
const rio = E.agua(3, 20, { altura: 0.62 }); rio.position.set(0, -0.69, 0); scene.add(rio);
scene.add(E.cidade({ dist: 22 }));
for (const [x, z, s] of [[-3.6, -2.2, 1], [3.4, -3.0, 1.15], [-6.5, -8, 1.2], [6.2, -7.5, 1]]) scene.add(E.em(E.arvore({ copa: 1.0 * s, altura: 2.1 * s }), x, 0, z));
const folhas = E.folhas({ area: [9, 4.5, 6] }); folhas.position.set(0, 0, -1); scene.add(folhas);

/* ------------------------------------------------------------------ a tábua (8 pedaços, pra poder envergar e quebrar) */
const NS = 8, LT = 3.6, tabua = new THREE.Group(); scene.add(tabua);
const seg = Array.from({ length: NS }, (_, i) => { const b = E.bloco(LT / NS + 0.004, 0.1, 0.62, '#b4834d', { textura: 'tabua' }); tabua.add(b); return b; });
function poeTabua(sag, quebra) {        // sag: quanto o meio afunda · quebra 0→1: as metades caem na água
  seg.forEach((b, i) => {
    const u = (i + 0.5) / NS, x = -LT / 2 + u * LT, esq = u < 0.5;
    const y = 0.05 - sag * Math.sin(Math.PI * u), dy = sag * Math.PI * Math.cos(Math.PI * u) / LT;
    b.position.set(x, y, 0); b.rotation.set(0, 0, -Math.atan(dy));
    if (quebra > 0) { const piv = esq ? -RIO : RIO, a = (esq ? -1 : 1) * quebra * 1.05, dx = x - piv; b.position.set(piv + dx * Math.cos(a), 0.05 + dx * Math.sin(a), 0); b.rotation.z = a; }
  });
}

/* ------------------------------------------------------------------ os pilares: colunas de pedra que sobem do fundo do rio, uma fileira de cada vez */
const PX = [-0.65, 0.65], FIL = 8;                                // 8 fileiras de 0,125 m (do leito em -1,0 até 0)
const pilares = PX.map((px) => { const g = new THREE.Group(); g.position.set(px, -1.0, 0);
  for (let f = 0; f < FIL; f++) { const L2 = []; for (let a = 0; a < 4; a++) for (let c = 0; c < 4; c++) if (a % 3 === 0 || c % 3 === 0 || f === FIL - 1) L2.push([a - 2, 0, c - 2, ['#9a9a9f', '#86868c', '#a8a8ad', '#7b7b80'][Math.floor(hash(a * 3 + c * 7 + f * 11 + px) * 4)]]);
    const row = E.cubos(L2, 0.125); row.position.y = f * 0.125; g.add(row); }
  scene.add(g); return g; });
const gPilares = E.grupo(...pilares); scene.add(gPilares);

/* ------------------------------------------------------------------ respingo (cubinhos de água) */
const NR = 40, resp = E.cubos(Array.from({ length: NR }, (_, i) => [0, 0, 0, i % 3 ? '#7fc8f0' : '#e8f6ff']), 0.07, { sombra: false }); scene.add(resp);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
function respingo(t, t0, cx) { const k = (t - t0) / 0.9; for (let i = 0; i < NR; i++) { const a = hash(i * 1.3) * 6.28, v = 0.8 + hash(i * 7.7) * 1.4;
  const on = k > 0 && k < 1; _p.set(cx + Math.cos(a) * v * 0.5 * k, -0.3 + (2.6 + hash(i) * 1.5) * k * 0.9 - 4.9 * k * k * 0.8, Math.sin(a) * v * 0.5 * k); _s.setScalar(on ? 0.07 : 0.0001); _m.compose(_p, _q, _s); resp.setMatrixAt(i, _m); }
  resp.instanceMatrix.needsUpdate = true; }

/* ------------------------------------------------------------------ o boneco */
const ze = E.boneco(); ze.rotation.y = Math.PI / 2; scene.add(ze);
const X0 = -2.35;
scene.updateMatrixWorld(true);

/* ------------------------------------------------------------------ câmera: sempre andando; perto no erro, LONGE no "Esses são" */
orb(0, V(X0 + 0.4, 0.95, 0), 38, 9, 3.9, 40, 0);
orb(A.joga + 0.1, V(-0.6, 0.4, 0), 28, 15, 6.4, 40, 1.1);
orb(A.enverga - 0.3, V(-0.4, 0.5, 0), -22, 6, 3.6, 40, 0.9);
orb(A.cai - 0.1, V(0, -0.2, 0), 12, 22, 4.0, 40, 0.5);
orb(R + VOLTA, V(-0.2, 0.2, 0), 32, 12, 5.6, 40, 0);
orb(A.colunas - 0.15, V(0, -0.25, 0), 22, 9, 5.4, 40, 1.0);
orb(A.pilares - 0.2, V(0, 0.15, 0), -28, 16, 8.0, 42, 1.0);
fecharCameras({ duracao: DURATION });

/* ------------------------------------------------------------------ letreiros, piscadas e edição */
chip('TÁBUA', A.tabua, A.enverga - 0.1, () => V(-0.6, 0.15, 0), '#6b7280', { dy: -120, size: 72 });
chip('ENVERGOU', A.enverga + 0.05, A.cai - 0.1, () => V(0, -0.1, 0), '#ff3b2f', { dy: -330, size: 72 });
emote('!', A.enverga, R + 0.05, ze);
impacto('TCHIBUM!', A.cai + 0.1, A.cai + 0.9, () => V(0, 0.2, 0));
rebobinar(R, VOLTA); som('rewind', R, -8);
label('PILARES', A.pilares, A.pilares + 1.75, () => V(PX[1], -0.2, 0.3), { dy: -230, size: 92 });
piscar(gPilares, A.pilares);
conquista('PILARES', A.pilares + 0.05);
emote('ideia', A.pilares - 0.1, A.pilares + 1.3, ze);
configurarLegendas({ nomes: ['pilares'] });

/* ------------------------------------------------------------------ sons */
som('whoosh_suave', A.joga, -14); som('woodslam', A.rio - 0.15, -10);
som('passos_madeira', A.rio + 0.15, -14, { dur: Math.max(0.6, A.meio - A.rio), fadeOut: 0.2 });
som('logcreak', A.enverga - 0.1, -9); som('woodsnap', A.cai - 0.12, -8); som('splashbig', A.cai + 0.05, -6); som('gameover_8bit', A.agua, -12);
[0, 1].forEach((k) => som('pulo_8bit', A.colunas + k * 0.35, -14));
som('pedra_quebrando', A.pedra - 0.05, -20); som('levelup_8bit', A.pilares + 0.02, -10);
ambiente('water', 0, DURATION, -30, { fade: 0.5 }); ambiente('birds', 0, DURATION, -32, { fade: 0.5 });

/* ------------------------------------------------------------------ animação */
function update(t) {
  efeitosCamera(t);
  const tt = hist(t), tentativa = t < R + VOLTA;
  // tábua: voa da mão até o outro lado; enverga; quebra
  const voo = prog(tt, A.joga + 0.05, Math.max(0.6, A.rio - A.joga - 0.1), ease.out);
  const xb = tentativa ? X0 + lerp(0, 2.35, clamp((tt - A.rio - 0.1) / Math.max(0.5, A.meio - A.rio - 0.1))) : X0 + (t > A.pilares - 1.1 ? 2.35 * prog(t, A.pilares - 1.1, 1.1) : 0);
  const sag = tentativa ? 0.32 * clamp(1 - Math.abs(xb) / 1.8) * (tt > A.rio ? 1 : 0) : 0.012 * clamp(1 - Math.abs(xb) / 1.8);
  const quebra = tentativa ? prog(tt, A.cai - 0.1, 0.45, ease.in) : 0;
  poeTabua(sag, quebra);
  tabua.position.set(0, 0, 0); tabua.rotation.set(0, 0, 0);
  if (voo < 1) { tabua.position.set(lerp(X0 + 0.15, 0, voo), lerp(0.9, 0, voo) + Math.sin(voo * Math.PI) * 0.8, lerp(-0.55, 0, voo)); tabua.rotation.set(0, 0, lerp(1.35, 0, voo)); tabua.scale.setScalar(lerp(0.45, 1, voo)); }
  else tabua.scale.setScalar(1);
  tabua.visible = tt > A.joga - 0.05 || !tentativa;
  // pilares: fileiras aparecem de baixo pra cima (cada pilar um pouco depois do outro)
  pilares.forEach((g, k) => g.children.forEach((row, f) => { const s = tentativa ? 0 : pop(t, A.colunas + k * 0.35 + f * Math.max(0.06, (A.fundo - A.colunas) / 14), Infinity, 0.25); row.scale.setScalar(Math.max(0.0001, s)); }));
  // boneco: anda pela tábua, afunda junto, cai na água
  let y = xb > -RIO && xb < RIO ? 0.1 - sag * Math.sin(Math.PI * clamp((xb + LT / 2) / LT)) : 0;
  const caiu = tentativa ? prog(tt, A.cai - 0.05, 0.4, ease.in) : 0; y = lerp(y, -1.05, caiu);
  ze.position.set(xb, y, 0); ze.rotation.z = -0.4 * caiu;
  const andando = tentativa ? win(tt, A.rio + 0.1, A.meio, 0.15, 0.15) : win(t, A.pilares - 1.1, A.pilares, 0.15, 0.15);
  let humor = 0.5, pose = null, pk = 0;
  if (tentativa && tt > A.enverga - 0.1) { humor = -0.8; pose = 'susto'; pk = win(tt, A.enverga - 0.1, R, 0.2, 0.15); }
  if (!tentativa && t > A.entao - 0.1 && t < A.colunas + 0.8) { pose = 'aponta'; pk = win(t, A.entao, A.colunas + 0.8, 0.2, 0.25); humor = 0.7; }
  if (!tentativa && t > A.pilares + 0.2) { pose = 'comemora'; pk = prog(t, A.pilares + 0.2, 0.3); humor = 1; }
  E.animar(ze, tt, { humor, pose, poseK: pk, andar: andando, olhar: tentativa ? 0 : -0.15 });
  respingo(tt, tentativa ? A.cai + 0.05 : -9, xb);
  rio.position.y = -0.69 + Math.sin(t * 2) * 0.01;
  folhas.userData.atualizar(t);
  aplicarPiscadas(t);
}
iniciar({ duracao: DURATION, ancoras: A, update, desenhar: (t) => desenharEfeitos(t) });
