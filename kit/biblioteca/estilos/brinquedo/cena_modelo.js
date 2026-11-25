/* =====================================================================================
   CENA DO VÍDEO: __TEMA__   ·   estilo «Brinquedo»
   Ponto de partida que JÁ FUNCIONA com qualquer roteiro no formato da série (roda, renderiza e tem som):
   - linha 0 (gancho): a tentativa tosca dá errado e a fita volta (◀◀)
   - linha com "Mas…" / "Só que…": o problema acontece na tela e a fita volta antes do "Então"
   - "Então você…": a peça nova entra · "Esse é o… / Essa é a…": a peça PISCA 2× em amarelo + letreiro com o nome
   - "Parabéns!": a câmera abre e o boneco comemora · última linha: chamada pra comentar
   Os momentos de cada linha vêm sozinhos da narração (estrutura()). O Claude troca o CENÁRIO, as PEÇAS e as AÇÕES
   pelo conteúdo do vídeo, seguindo biblioteca/estilos/brinquedo/GUIA.md (o modelo de edição deste estilo).
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, prog, win, pop, hash } from '../../../sistema/motor/lib.js';
import * as E from '../../../biblioteca/estilos/brinquedo/estilo.js';
import { W, H, T, TL, scene, V, orb, FIM_NARRACAO, fecharCameras, label, chip, banner, configurarLegendas, som, ambiente, iniciar } from '../../../sistema/motor/video.js';
import { estrutura, passos, tempoHistoria, piscar, aplicarPiscadas, efeitosCamera, desenharEfeitos, rebobinar, emote, zoomSoco, tremor, tempoLentoVarios, linhas, circulo, conquista, manchete, impacto } from '../../../sistema/motor/edicao.js';

const N = TL.lines.length, L = (i) => TL.lines[(i + N) % N].s;
const B = estrutura();                     // momentos de cada linha: { problema, rebobina, entra, nomes }
const tenta = (frase) => { try { return T(frase); } catch (e) { return null; } };   // roteiro sem "Parabéns" (outro formato) também roda
const A = { inicio: 0, parabens: tenta('parabens') ?? L(-2), comente: L(-1), end: FIM_NARRACAO };
const DURATION = A.end + 0.3;
E.preparar();

/* ------------------------------------------------------------------ cenário (TROQUE pelo lugar do vídeo) */
scene.add(E.chao(), E.morros(), E.pedras(40, [-5, 5, -2, 4]), E.trilho(-12, 12, -2.4), E.cerca(-12, 12, -4.4));
for (let i = 0; i < 26; i++) { const a = E.agave({ tam: 0.8 + 0.4 * hash(i) }); a.position.set(-11 + (i % 13) * 1.8 + hash(i * 3) * 0.4, 0, -5.6 - Math.floor(i / 13) * 1.6); scene.add(a); }
for (const [x, z] of [[-6, -9], [4, -11], [9, -8]]) { const a = E.arvore({ tam: 1.3 }); a.position.set(x, 0, z); scene.add(a); }

/* ------------------------------------------------------------------ o objeto do vídeo: uma peça por "Esse é o…"
   TROQUE: NOMES (na ordem do roteiro) e a função peca(k) pelas formas de verdade.                         */
const NOMES = ['BASE', 'CORPO', 'MOTOR', 'TAMPA', 'BOTÃO', 'ANTENA', 'PEÇA 7', 'PEÇA 8', 'PEÇA 9'];
const OBJ = V(0.55, 0, 0.3);                  // onde o objeto é montado
const objeto = new THREE.Group(); objeto.position.copy(OBJ); scene.add(objeto);
const PASSOS = passos(B);                  // um passo por "Esse é…": { linha, entra, nome }
const pecas = PASSOS.map((b, k) => { const p = peca(k); objeto.add(p); p.userData.y0 = p.position.y; return p; });
function peca(k) {   // peças de EXEMPLO, empilhadas — troque pelas peças do objeto do vídeo
  const cores = ['#9aa3ab', '#f2f2f2', '#49b0e0', '#f08a3a', '#e63946', '#ffd21f', '#57b36b', '#b98a57', '#8a6ad8'];
  const F = [[0.6, 0.1, 0.45, 0.05, 0], [0.34, 0.36, 0.3, 0.28, 0], [0.13, 0.2, 0, 0.56, 0], [0.38, 0.07, 0.34, 0.69, 0], [0.05, 0, 0, 0.32, 0.18], [0.025, 0.3, 0, 0.88, 0.1], [0.14, 0.14, 0.14, 0.17, -0.38], [0.14, 0.14, 0.14, 0.17, 0.38], [0.16, 0.05, 0.16, 0.76, 0]][k % 9];
  let m;
  if (k === 2) m = E.cilindro(F[0], F[1], cores[k]); else if (k === 4) m = E.esfera(F[0], cores[k]); else if (k === 5) m = E.cilindro(F[0], F[1], cores[k]); else m = E.caixa(F[0], F[1], F[2], cores[k % 9]);
  m.position.set(F[4], F[3], k === 4 ? 0.16 : 0); return m;
}
const ALTO = OBJ.clone().add(V(0, 0.45, 0));               // meio do objeto montado (alvo da câmera)
const pontoDaPeca = (k) => () => pecas[k].localToWorld(V(0, 0.05, 0));

/* ------------------------------------------------------------------ a tentativa tosca do gancho (cai no fim da linha 0) */
const tentativa = new THREE.Group(); tentativa.position.copy(OBJ); scene.add(tentativa);
[[0.5, 0.18, 0.4, 0.09, '#b98a57'], [0.36, 0.3, 0.3, 0.33, '#a8794a'], [0.24, 0.2, 0.24, 0.58, '#c99a68']].forEach(([w, h, d, y, c], i) => {
  const m = E.caixa(w, h, d, E.material(c, { fosco: true }), { r: 0.02 }); m.position.set(0, y, 0); m.userData.p0 = m.position.clone(); m.userData.h0 = h / 2; tentativa.add(m);
});
const gancho = B[0];

/* ------------------------------------------------------------------ o boneco */
const ze = E.boneco(); ze.position.set(OBJ.x - 0.78, 0, OBJ.z + 0.35); ze.rotation.y = 0.55; scene.add(ze);
const CAB = ze.userData.headP;
const MEIO = V(OBJ.x - 0.78 / 2, 0.45 + 0.25, OBJ.z + 0.15);   // entre o boneco e o objeto (alvo das tomadas abertas)

scene.updateMatrixWorld(true);

/* ------------------------------------------------------------------ câmera: sempre andando; perto da peça nova, LONGE no "Esse é" */
orb(0, CAB.localToWorld(V(0, 0, 0)).add(V(0, -0.1, 0)), 18, 6, 2.5, 40, 0, 0.05);                       // abre no boneco
orb(Math.min(1.6, gancho.fim * 0.35), MEIO.clone(), 24, 10, 3.9, 40, 1.0);          // a tentativa
for (const b of B) {
  if (b.problema && b.linha > 0) orb(b.problema[0] + 0.1, MEIO.clone(), -14, 12, 3.9, 40, 0.9);
  if (b.rebobina !== null) orb(b.rebobina + 0.7, MEIO.clone().add(V(0, 0.1, 0)), 22, 9, 3.9 + 0.3, 40, 0);   // depois do ◀◀
}
PASSOS.forEach((p, k) => {   // distâncias pensadas pra um objeto de ~1 m: objeto pequeno → câmera mais perto (o objeto INTEIRO no "Esse é")
  if (p.nome - p.entra > 1.3) orb(p.entra + 0.1, pontoDaPeca(k)(), 14, 14, 1.9, 40, 0.9);
  orb(p.nome - 0.2, MEIO.clone(), k % 2 ? 26 : -8, 13, 5.2, 42, 1.0);
});
orb(A.parabens - 0.25, MEIO.clone().add(V(0, 0.1, 0)), 16, 16, 5.2 * 1.5, 42, 1.0, 0.03, { spin: -0.07, bob: 0.5 });
fecharCameras({ duracao: DURATION, aberturaAte: gancho.fim, finalDesde: A.parabens - 1 });

/* ------------------------------------------------------------------ letreiros, piscadas e edição do estilo */
PASSOS.forEach((b, k) => {
  label(NOMES[k] || 'PEÇA', b.nome, b.nome + 1.6, pontoDaPeca(k), { dy: -190 });
  piscar(pecas[k], b.nome);
  zoomSoco(b.nome + 0.02, 0.06, 0.6);
});
B.forEach((b) => {
  if (!b.problema) return;
  tremor(b.problema[1] - 1.0, 0.5, 0.02); emote('suor', b.problema[1] - 1.2, (b.rebobina ?? b.problema[1]) + 0.1, ze);
  if (b.rebobina !== null) { rebobinar(b.rebobina, 0.7); som('rewind', b.rebobina, -8); }
});

const palavraCTA = (TL.lines[N - 1].text.match(/[“"]([^”"]+)[”"]/) || [, 'SIM'])[1].toUpperCase();
banner(`COMENTE “${palavraCTA}”`, A.comente + 0.05, DURATION + 1, { screen: [W / 2, 330], size: 92, semPop: true });
configurarLegendas({ destaque: ['parabens'], nomes: NOMES.flatMap((n) => n.toLowerCase().split(/\s+/)) });

/* ------------------------------------------------------------------ sons (nomes = biblioteca/efeitos) */
PASSOS.forEach((b) => som('whoosh_suave', b.entra + 0.12, -18));
B.forEach((b) => { if (b.problema) som('orquestra_impacto', b.problema[1] - 1.1, -12); });
som('boom', gancho.problema[1] - 1.0, -8);
som('tada', A.parabens - 0.06, -4); som('sparkle', A.parabens + 0.25, -10);
som('pop2', A.comente, -14);
ambiente('birds', 0, DURATION, -30, { pan: 0.3, fade: 0.5 });

/* ------------------------------------------------------------------ animação: tudo em função do tempo t */
function noProblema(t) { for (const b of B) if (b.problema && t >= b.problema[0] && t < (b.rebobina ?? b.problema[1]) + 0.05) return (t - b.problema[0]) / Math.max(0.5, (b.rebobina ?? b.problema[1]) - b.problema[0]); return -1; }
function update(t) {
  efeitosCamera(t);
  const tt = tempoLentoVarios(tempoHistoria(t, B), B.filter((b) => b.problema).map((b) => [b.problema[1] - 1.1, b.problema[1] - 0.2]), 0.4);
  // peças entrando (crescem com um pulinho) e tremendo nos problemas
  const p = noProblema(tt);
  PASSOS.forEach((b, k) => { const s = pop(tt, b.entra + 0.12, Infinity, 0.45); pecas[k].scale.setScalar(Math.max(0.0001, s)); pecas[k].position.y = pecas[k].userData.y0 + (1 - Math.min(1, s)) * 0.25; });
  objeto.rotation.z = p >= 0 ? Math.sin(tt * 26) * 0.05 * Math.min(1, p * 2) : 0;
  // tentativa do gancho: balança e desmonta no fim da linha 0; some depois da volta da fita
  const qk = clamp((tt - (gancho.problema[1] - 1.1)) / 0.9);
  tentativa.visible = t < gancho.rebobina + 0.7;
  tentativa.children.forEach((c, i) => {
    c.position.copy(c.userData.p0); c.rotation.set(0, 0, 0);
    if (tt < gancho.problema[1] - 1.1) { c.rotation.z = Math.sin(tt * 9 + i) * 0.04 * clamp(tt / 2); return; }
    const sx = (i % 2 ? 1 : -1) * (0.6 + 0.3 * i); c.position.x += sx * qk; c.position.y = Math.max(c.userData.h0, c.userData.p0.y + qk * 0.6 - qk * qk * 2.8); c.rotation.z = -sx * qk * 2.2;
  });
  // boneco: reage a cada momento
  let pose = null, pk = 0, humor = 0.4;
  for (const b of B) if (b.problema && tt >= b.problema[1] - 1.2 && tt < (b.rebobina ?? b.problema[1]) + 0.1) { pose = 'susto'; pk = win(tt, b.problema[1] - 1.2, b.rebobina ?? b.problema[1], 0.2, 0.15); humor = -0.8; }
  for (const q of PASSOS) {
    if (tt >= q.entra && tt < q.entra + 0.9) { pose = 'segura'; pk = win(tt, q.entra, q.entra + 0.8, 0.2, 0.25); }
    if (tt >= q.nome && tt < q.nome + 1.5) { pose = 'aponta'; pk = win(tt, q.nome, q.nome + 1.4, 0.2, 0.3); humor = 0.9; }
  }
  if (t >= A.parabens - 0.05) { pose = 'comemora'; pk = prog(t, A.parabens - 0.05, 0.3); humor = 1; }
  E.animar(ze, tt, { humor, pose, poseK: pk, olhar: 0.25 });

  aplicarPiscadas(t);
}
iniciar({ duracao: DURATION, ancoras: A, update, desenhar: (t) => desenharEfeitos(t) });
