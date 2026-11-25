/* =====================================================================================
   CENA DO VÍDEO: __TEMA__   ·   estilo «Ilustrado 2D»
   Ponto de partida que JÁ FUNCIONA com qualquer roteiro no formato da série (roda, renderiza e tem som):
   - linha 0 (gancho): a tentativa tosca dá errado e a fita volta (◀◀)
   - linha com "Mas…" / "Só que…": o problema acontece na tela e a fita volta antes do "Então"
   - "Então você…": a peça nova entra · "Esse é o… / Essa é a…": a peça PISCA 2× em amarelo + letreiro com o nome
   - "Parabéns!": a câmera abre e o boneco comemora · última linha: chamada pra comentar
   Tudo aqui é PLANO (2D): x = direita, y = cima, z = só a ordem de desenho (maior = mais na frente, passos de 0,01).
   O Claude troca o CENÁRIO, as PEÇAS e as AÇÕES pelo conteúdo do vídeo, seguindo biblioteca/estilos/ilustrado/GUIA.md.
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, prog, win, pop, hash } from '../../../sistema/motor/lib.js';
import * as E from '../../../biblioteca/estilos/ilustrado/estilo.js';
import { W, H, T, TL, scene, V, FIM_NARRACAO, fecharCameras, label, chip, banner, configurarLegendas, som, ambiente, iniciar } from '../../../sistema/motor/video.js';
import { estrutura, passos, tempoHistoria, piscar, aplicarPiscadas, efeitosCamera, desenharEfeitos, rebobinar, emote, zoomSoco, tremor, transicao } from '../../../sistema/motor/edicao.js';

const N = TL.lines.length, L = (i) => TL.lines[(i + N) % N].s;
const B = estrutura();                     // momentos de cada linha: { problema, rebobina, entra, nomes }
const tenta = (frase) => { try { return T(frase); } catch (e) { return null; } };   // roteiro sem "Parabéns" (outro formato) também roda
const A = { inicio: 0, parabens: tenta('parabens') ?? L(-2), comente: L(-1), end: FIM_NARRACAO };
const DURATION = A.end + 0.3;
E.preparar();

/* ------------------------------------------------------------------ cenário (TROQUE pelo lugar do vídeo)
   Fundo distante (pôr do sol, mar, cidade) + cômodo em corte. Outros: E.rua(), E.predio({...}), E.arvore(), E.planta() */
scene.add(E.em(E.horizonte({ solX: 1.5, solY: 3.4, solR: 0.6, marY: 0.6, marAltura: 0.8, cidadeAltura: 1.2 }), 0, 0, 0));
scene.add(E.sala({ x0: -2.6, x1: 2.6, janelaX: 1.3 }));
scene.add(E.em(E.planta({ tam: 0.8 }), -2.15, 0, -0.4));

/* ------------------------------------------------------------------ o objeto do vídeo: uma peça por "Esse é o…"
   TROQUE: NOMES (na ordem do roteiro) e a função peca(k) pelas formas de verdade (E.ret, E.circ, E.elipse, E.poli, E.anel, E.traco). */
const NOMES = ['BASE', 'CORPO', 'MOTOR', 'TAMPA', 'BOTÃO', 'ANTENA', 'PEÇA 7', 'PEÇA 8', 'PEÇA 9'];
const OBJ = V(0.55, 0, 0.03);               // onde o objeto é montado (no chão, um pouco na frente do boneco)
const objeto = new THREE.Group(); objeto.position.copy(OBJ); scene.add(objeto);
const PASSOS = passos(B);                  // um passo por "Esse é…": { linha, entra, nome }
const pecas = PASSOS.map((b, k) => { const p = peca(k); objeto.add(p); p.userData.y0 = p.position.y; return p; });
function peca(k) {   // peças de EXEMPLO, empilhadas — troque pelas peças do objeto do vídeo
  const C = E.COR, cores = [C.petroleoEsc, '#f7f5f0', C.mostarda, C.petroleo, '#e9545a', C.mostardaEsc, C.verde, C.lilas, C.marinho];
  const F = [['ret', 0.7, 0.12, 0.06, 0], ['ret', 0.42, 0.42, 0.33, 0], ['circ', 0.13, 0, 0.66, 0], ['ret', 0.46, 0.08, 0.81, 0], ['circ', 0.05, 0, 0.36, 0.1], ['ret', 0.03, 0.3, 1.0, 0.12], ['ret', 0.14, 0.14, 0.2, -0.42], ['ret', 0.14, 0.14, 0.2, 0.42], ['ret', 0.2, 0.06, 0.9, 0]][k % 9];
  const m = F[0] === 'circ' ? E.circ(F[1], cores[k % 9]) : E.ret(F[1], F[2], cores[k % 9], { r: Math.min(F[1], F[2]) * 0.25 });
  m.position.set(F[4], F[3], 0.002 * k + (k === 4 ? 0.01 : 0)); return m;
}
const pontoDaPeca = (k) => () => pecas[k].localToWorld(V(0, 0.05, 0));

/* ------------------------------------------------------------------ a tentativa tosca do gancho (cai no fim da linha 0) */
const tentativa = new THREE.Group(); tentativa.position.copy(OBJ); scene.add(tentativa);
[[0.5, 0.18, 0.09, E.COR.madeiraEsc], [0.36, 0.3, 0.33, E.COR.madeira], [0.24, 0.2, 0.58, E.COR.mostardaEsc]].forEach(([w, h, y, c], i) => {
  const m = E.ret(w, h, c, { r: 0.03 }); m.position.set(0, y, 0.001 * i); m.userData.p0 = m.position.clone(); m.userData.h0 = h / 2; tentativa.add(m);
});
const gancho = B[0];

/* ------------------------------------------------------------------ o boneco (virado pra direita, olhando o objeto) */
const ze = E.boneco(); ze.position.set(OBJ.x - 1.15, 0, 0); scene.add(ze);

/* ------------------------------------------------------------------ câmera 2D: E.tomada(t, x, y, alturaVisível, dur)
   Sempre deslizando; PERTO da peça nova, LONGE no "Esse é" (zoom-out forte).                                          */
const XM = OBJ.x - 0.55;                    // meio entre o boneco e o objeto
E.tomada(0, ze.position.x + 0.1, 1.2, 2.5, 0);                                          // abre no boneco
E.tomada(Math.min(1.6, gancho.fim * 0.35), XM, 1.0, 3.3, 1.0, { lado: -1 });            // a tentativa
for (const b of B) {
  if (b.problema && b.linha > 0) E.tomada(b.problema[0] + 0.1, XM + 0.1, 1.0, 3.0, 0.9);
  if (b.rebobina !== null) E.tomada(b.rebobina + 0.7, XM, 1.05, 3.4, 0);
}
PASSOS.forEach((p, k) => {   // alturas pensadas pra um objeto de ~1 m: objeto pequeno → alturas menores (o objeto INTEIRO no "Esse é")
  if (p.nome - p.entra > 1.3) E.tomada(p.entra + 0.1, OBJ.x + 0.05, 0.3 + Math.min(0.8, pecas[k].userData.y0), 1.7, 0.9);
  E.tomada(p.nome - 0.2, XM, 1.25, 4.2, 1.0, { lado: k % 2 ? 1 : -1 });
});
E.tomada(A.parabens - 0.25, XM, 1.6, 5.4, 1.0);
fecharCameras({ duracao: DURATION });

/* ------------------------------------------------------------------ letreiros, piscadas e edição do estilo */
PASSOS.forEach((b, k) => {
  label(NOMES[k] || 'PEÇA', b.nome, b.nome + 1.6, pontoDaPeca(k), { dy: -200 });
  piscar(pecas[k], b.nome);
  emote('ideia', b.nome - 0.1, b.nome + 1.2, ze);
});
B.forEach((b) => {
  if (!b.problema) return;
  emote('suor', b.problema[1] - 1.2, (b.rebobina ?? b.problema[1]) + 0.1, ze);
  if (b.rebobina !== null) { rebobinar(b.rebobina, 0.7); som('rewind', b.rebobina, -8); }
});
transicao(A.parabens - 0.55, 'cortina', 0.6);
const palavraCTA = (TL.lines[N - 1].text.match(/[“"]([^”"]+)[”"]/) || [, 'SIM'])[1].toUpperCase();
banner(`COMENTE “${palavraCTA}”`, A.comente + 0.05, DURATION + 1, { screen: [W / 2, 330], size: 92, semPop: true });
configurarLegendas({ destaque: ['parabens'], nomes: NOMES.flatMap((n) => n.toLowerCase().split(/\s+/)) });

/* ------------------------------------------------------------------ sons (nomes = biblioteca/efeitos) */
PASSOS.forEach((b) => som('whoosh_suave', b.entra + 0.12, -18));
PASSOS.forEach((b) => som('ding', b.nome + 0.05, -16));
B.forEach((b) => { if (b.problema) som('confused', b.problema[1] - 1.1, -10); });
som('boom', gancho.problema[1] - 1.0, -10);
som('whoosh_suave', A.parabens - 0.55, -16);
som('tada', A.parabens - 0.06, -4); som('cheer', A.parabens + 0.25, -12);
som('pop2', A.comente, -14);
ambiente('birds', 0, DURATION, -32, { fade: 0.5 });

/* ------------------------------------------------------------------ animação: tudo em função do tempo t */
function noProblema(t) { for (const b of B) if (b.problema && t >= b.problema[0] && t < (b.rebobina ?? b.problema[1]) + 0.05) return (t - b.problema[0]) / Math.max(0.5, (b.rebobina ?? b.problema[1]) - b.problema[0]); return -1; }
function update(t) {
  efeitosCamera(t);
  const tt = tempoHistoria(t, B);           // tempo da história: no ◀◀ anda pra trás
  const p = noProblema(tt);
  PASSOS.forEach((b, k) => { const s = pop(tt, b.entra + 0.12, Infinity, 0.45); pecas[k].scale.setScalar(Math.max(0.0001, s)); pecas[k].position.y = pecas[k].userData.y0 + (1 - Math.min(1, s)) * 0.3; });
  objeto.rotation.z = p >= 0 ? Math.sin(tt * 26) * 0.05 * Math.min(1, p * 2) : 0;
  // tentativa do gancho: balança e desmonta no fim da linha 0; some depois da volta da fita
  const qk = clamp((tt - (gancho.problema[1] - 1.1)) / 0.9);
  tentativa.visible = t < gancho.rebobina + 0.7;
  tentativa.children.forEach((c, i) => {
    c.position.copy(c.userData.p0); c.rotation.set(0, 0, 0);
    if (tt < gancho.problema[1] - 1.1) { c.rotation.z = Math.sin(tt * 9 + i) * 0.04 * clamp(tt / 2); return; }
    const sx = (i % 2 ? 1 : -1) * (0.5 + 0.3 * i); c.position.x += sx * qk; c.position.y = Math.max(c.userData.h0, c.userData.p0.y + qk * 0.6 - qk * qk * 2.8); c.rotation.z = -sx * qk * 2.2;
  });
  let pose = null, pk = 0, humor = 0.4;
  for (const b of B) if (b.problema && tt >= b.problema[1] - 1.2 && tt < (b.rebobina ?? b.problema[1]) + 0.1) { pose = 'susto'; pk = win(tt, b.problema[1] - 1.2, b.rebobina ?? b.problema[1], 0.2, 0.15); humor = -0.8; }
  for (const q of PASSOS) {
    if (tt >= q.entra && tt < q.entra + 0.9) { pose = 'segura'; pk = win(tt, q.entra, q.entra + 0.8, 0.2, 0.25); }
    if (tt >= q.nome && tt < q.nome + 1.5) { pose = 'aponta'; pk = win(tt, q.nome, q.nome + 1.4, 0.2, 0.3); humor = 0.9; }
  }
  if (t >= A.parabens - 0.05) { pose = 'comemora'; pk = prog(t, A.parabens - 0.05, 0.3); humor = 1; }
  E.animar(ze, tt, { humor, pose, poseK: pk });
  aplicarPiscadas(t);
}
iniciar({ duracao: DURATION, ancoras: A, update, desenhar: (t) => desenharEfeitos(t) });
