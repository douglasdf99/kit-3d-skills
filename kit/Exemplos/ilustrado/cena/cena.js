/* =====================================================================================
   DEMO DE 10 s: Guarda-chuva   ·   estilo «Ilustrado 2D»   (o começo do vídeo completo: o jornal e o tecido impermeável)
   Rua na chuva no fim da tarde. O boneco tenta o jornal, troca por um pano, e vai montando o guarda-chuva:
   varetas → corrediça → trava → fibra de vidro → acabamento. Cada problema ACONTECE na tela e a fita volta (◀◀),
   com a cena andando de trás pra frente de verdade (o tempo da história "tv" volta, a câmera não).
   Tudo é PLANO (2D): x = direita, y = cima, z = só a ordem de desenho.
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, prog, win, pop, hash } from '../../../sistema/motor/lib.js';
import * as E from '../../../biblioteca/estilos/ilustrado/estilo.js';
import { W, H, T, TL, scene, V, FIM_NARRACAO, fecharCameras, label as label_, chip as chip_, banner, configurarLegendas, som as som_, ambiente as ambiente_, iniciar, ceu, g2, fonte, project } from '../../../sistema/motor/video.js';
import { piscar as piscar_, aplicarPiscadas, efeitosCamera, desenharEfeitos, rebobinar as rebobinar_, emote as emote_, zoomSoco as zoomSoco_, tremor as tremor_, transicao as transicao_, impacto as impacto_, alcancar } from '../../../sistema/motor/edicao.js';
import * as M from './modelos.js';

/* ------------------------------------------------------------------ âncoras da DEMO (só o gancho e o tecido; o resto do vídeo completo fica em NUNCA) */
const N = TL.lines.length, L = (i) => TL.lines[(i + N) % N];
const NUNCA = 1e4;
const A0 = { pego: L(0).s, cobre: T('cobre a cabeca'), jornal: T('com jornal'), funciona: T('na chuva'), encharca: T('encharca'), rasga: T('rasga'),
  troca: T('entao voce usa'), pano: T('um pano'), fechadinho: T('de plastico'), gota: T('a gota nao'), bolinha: T('atravessa'), tecido: T('esse e o tecido') };
A0.escorre0 = A0.rasga + 0.12; A0.pescoco = A0.rasga + 0.3;
const DURATION = Math.max(FIM_NARRACAO + 0.5, A0.tecido + 1.9); A0.end = DURATION;
const A = new Proxy(A0, { get: (o, k) => (k in o ? o[k] : NUNCA) });
// tudo que estava marcado pra depois do fim da demo é ignorado
const _cap = (f, i) => (...a) => (a[i] >= DURATION - 0.05 ? undefined : f(...a));
const label = _cap(label_, 1), chip = _cap(chip_, 1), piscar = _cap(piscar_, 1), emote = _cap(emote_, 1), impacto = _cap(impacto_, 1), ambiente = _cap(ambiente_, 1);
const rebobinar = _cap(rebobinar_, 0), zoomSoco = _cap(zoomSoco_, 0), tremor = _cap(tremor_, 0), transicao = _cap(transicao_, 0);
const som = (n, t, ...r) => (t >= DURATION - 0.05 || n.startsWith('voz_') ? undefined : som_(n, t, ...r));   // o boneco não fala palavras
const tomada = (t, ...r) => (t >= DURATION - 0.05 ? undefined : E.tomada(t, ...r));
const VOLTA = 0.65;
const P0 = { p0: A.funciona, r0: Math.min(L(0).e - 0.2, A.troca - VOLTA - 0.05) };
const P2 = { p0: NUNCA, r0: NUNCA }, P3 = { p0: NUNCA, r0: NUNCA }, P4 = { p0: NUNCA, r0: NUNCA }, P5 = { p0: NUNCA, r0: NUNCA };
const PROBS = [P0];
function warp(t) { for (const P of PROBS) if (t >= P.r0 && t < P.r0 + VOLTA) return lerp(P.r0, P.p0, ease.inOut((t - P.r0) / VOLTA)); return t; }
const A3b = NUNCA, XEND = 1.0;

E.preparar();
ceu(M.C.ceuTopo, M.C.ceuBase, M.C.ceuMeio);

/* ------------------------------------------------------------------ cenário: rua na chuva, casa em corte à esquerda, prédio à direita */
const XP = -1.27;                                   // parede da frente da casa (a porta)
scene.add(M.fundoChuvoso());
scene.add(E.rua({ largura: 30 }));
scene.add(M.casa(XP));
{ // mureta no fundo da calçada + árvores + prédio de dois andares + poste + lixeira
  const mur = new THREE.Group();
  mur.add(E.em(E.retBase(3.6, 0.5, E.COR.creme), 0.45, 0, -0.95), E.em(E.ret(3.7, 0.08, E.COR.petroleo, { r: 0.03 }), 0.45, 0.52, -0.94));
  for (let i = 0; i < 7; i++) mur.add(E.em(E.ret(0.06, 0.36, E.COR.cremeSombra), -1.0 + i * 0.5, 0.25, -0.945));
  scene.add(mur);
  scene.add(E.em(E.arvore({ tam: 0.62 }), 1.3, 0.42, -1.3), E.em(E.arvore({ tam: 0.5 }), -0.75, 0.42, -1.35));
  scene.add(E.em(E.predio({ largura: 4.4, andares: 2, janelas: 2, portaX: 1.0, escada: false, cor: '#efe0c6' }), 4.45, 0, -1.5));
  scene.add(E.em(M.poste(), 3.95, 0, -0.4));
  scene.add(E.em(M.lixeira(), 2.85, 0, -0.3));
}
const POCAS = [[-0.8, 0.55], [1.0, 0.7], [3.4, 0.6]].map(([x, l]) => { const p = M.poca(l); p.position.set(x, 0.0, -0.54); scene.add(p); return p; });

/* ------------------------------------------------------------------ boneco, jornal, guarda-chuva, chuva */
const ze = E.boneco(); scene.add(ze);
const molhado = E.elipse(0.075, 0.13, '#cddbe6'); molhado.position.set(-0.115, 1.2, 0.0025); ze.userData.torso.add(molhado);
const jornal = new M.Jornal(0.036); jornal.metades.forEach((m) => scene.add(m.mesh));
const U = new M.GuardaChuva(0.03); scene.add(U.g);
// grupos por peça (pra piscar cada uma no "Esse é…")
const gPano = E.grupo(...U.gomos.map((m) => m.mesh)); scene.add(gPano);
const gAco = E.grupo(...U.varAco.map((l) => l.g)); scene.add(gAco);
const gFib = E.grupo(...U.varFib.map((l) => l.g)); scene.add(gFib);
const gCorr = E.grupo(U.corr); scene.add(gCorr);
const gTrava = E.grupo(U.pinoG); scene.add(gTrava);
const chuva = new M.Chuva(900, { x0: -5.5, x1: 7.5 }); scene.add(chuva.gotas, chuva.resp);
const AB = new M.Abrigo(-7, 9, 0.02);
// gotinhas extras: bolinhas no pano, água escorrendo (nuca/cara), pingos da borda do guarda-chuva
const gotaM = E.material(M.C.agua), gotaLuz = E.material(M.C.aguaLuz);
const mkGota = (r) => { const g = E.grupo(E.elipse(r, r * 1.15, gotaM), E.em(E.circ(r * 0.35, gotaLuz), -r * 0.3, r * 0.3, 0.0005)); g.visible = false; scene.add(g); return g; };
const bolinhas = Array.from({ length: 9 }, () => mkGota(0.016));
const escorre = Array.from({ length: 7 }, () => mkGota(0.012));
const pingos = Array.from({ length: 10 }, () => mkGota(0.011));

/* ------------------------------------------------------------------ sequências (cada propriedade = valor base + tweens em ordem) */
// k: { t, d, v, ate (some depois do ◀◀), fn }
function seq(tv, base, keys) { let v = base; for (const k of keys) { if (tv < k.t || (k.ate !== undefined && tv > k.ate)) continue; v = lerp(v, k.v, prog(tv, k.t, k.d, k.fn || ease.inOut)); } return v; }
const K_ABRE = [
  { t: A.escorrega - 0.05, d: Math.min(0.7, A.empurrou - A.escorrega - 0.1), v: 0 },
  { t: A.empurrou, d: Math.max(0.35, A.abre + 0.15 - A.empurrou), v: 1 },
  { t: A.puxou, d: Math.max(0.35, A.fecha + 0.1 - A.puxou), v: 0 },
  { t: A.corredica + 0.25, d: 0.7, v: 1 },
  { t: A.escSozinha, d: Math.max(0.4, A.fechaCabeca - A.escSozinha), v: 0.32, ate: P4.r0, fn: ease.in },
  { t: A.pula - 0.7, d: 0.3, v: 0.72 }, { t: A.pula - 0.28, d: 0.26, v: 1, fn: ease.in },
  { t: A.ouSeja, d: 0.4, v: 0.55 }, { t: A.clique - 0.3, d: 0.33, v: 1, fn: ease.in },
  { t: A.tirinha - 0.45, d: 0.45, v: 0 },
  { t: A.empurrar, d: Math.max(0.4, A.clique2 - A.empurrar), v: 1, fn: ease.in },
];
const K_INV = [{ t: A.avesso - 0.45, d: 0.3, v: 1, ate: P5.r0, fn: ease.out }, { t: A.varetaAco - 0.1, d: 0.45, v: 0, ate: P5.r0 },
  { t: A.enverga - 0.25, d: 0.35, v: 0.5 }, { t: A.volta - 0.2, d: 0.5, v: 0, fn: ease.back }];
const K_FLEX = [{ t: A.rajada - 0.1, d: 0.5, v: 0.8, ate: P5.r0 }, { t: A.avesso - 0.45, d: 0.25, v: 0, ate: P5.r0 },
  { t: A.enverga - 0.5, d: 0.25, v: 0.7 }, { t: A.enverga - 0.25, d: 0.3, v: 0 }];
const K_TORTA = [{ t: A.entorta - 0.2, d: 0.35, v: 1, ate: P5.r0, fn: ease.out }];
const K_VENTO = [{ t: A.rajada - 0.3, d: 0.4, v: 1, ate: P5.r0 }, { t: A.varetaAco - 0.2, d: 0.5, v: 0, ate: P5.r0 },
  { t: A.enverga - 0.6, d: 0.35, v: 0.8 }, { t: A.volta - 0.2, d: 0.5, v: 0 }];
const K_BATE3 = [{ t: A3b, d: 0.1, v: 1, ate: P3.r0, fn: ease.out }, { t: A3b + 0.15, d: 0.5, v: 0.35, ate: P3.r0 }];
const K_BATE4 = [{ t: A.fechaCabeca - 0.08, d: 0.14, v: 1, ate: P4.r0, fn: ease.out }];
const K_PANO_CAI = [{ t: A.murcha - 0.35, d: Math.max(0.6, A.gruda + 0.25 - (A.murcha - 0.35)), v: 1, ate: P2.r0 }];
const K_FOLHA_SOBE = [{ t: A.estica - 0.1, d: 0.55, v: 1, fn: ease.out }];
const K_ESTICA = [{ t: A.alto - 0.1, d: Math.max(0.6, A.raios - A.alto + 0.1), v: 1 }];
const K_ANDA3 = [{ t: P3.p0 + 0.15, d: Math.max(0.3, A3b - P3.p0 - 0.15), v: 1, ate: P3.r0 }];
const K_ERGUE = [{ t: P4.r0 + VOLTA - 0.03, d: 0.02, v: 1 }, { t: A.ouSeja - 0.3, d: 0.45, v: 0 }];
const K_FINAL = [{ t: A.sair - 0.05, d: Math.max(1.0, A.parabens + 0.6 - A.sair), v: 1, fn: ease.inOut2 }];

/* ------------------------------------------------------------------ estado do boneco */
function boneco(tv) {
  let x = 0, face = 1, andar = 0, humor = 0.4, pose = null, pk = 0, olhar = 0;
  // L3: vira pra porta, anda e bate
  const noP3 = tv >= P3.p0 + 0.08 && tv <= P3.r0;
  if (noP3) { face = -1; x = -0.45 * seq(tv, 0, K_ANDA3) + 0.1 * seq(tv, 0, K_BATE3); andar = tv < A3b ? win(tv, P3.p0 + 0.15, A3b - 0.05, 0.12, 0.1) : 0; }
  // vento empurra (L5)
  x -= 0.1 * (tv < P5.r0 && tv > P5.p0 ? seq(tv, 0, K_VENTO) : 0);
  // final: sai andando na chuva
  const fin = seq(tv, 0, K_FINAL); x += XEND * fin; if (tv > A.sair - 0.1) andar = Math.max(andar, 0.72 * win(tv, A.sair - 0.05, A.parabens + 0.45, 0.2, 0.25));
  // humor e poses
  if (tv > A.pego - 0.1 && tv < A.cobre - 0.2) { pose = 'susto'; pk = win(tv, A.pego - 0.1, A.cobre - 0.35, 0.15, 0.2); humor = -0.4; olhar = 0.5; }
  if (tv > A.funciona - 0.2 && tv < A.encharca) humor = 0.85;
  if (tv > A.encharca && tv <= P0.r0) humor = -0.4;
  if (tv > A.rasga && tv <= P0.r0) { humor = -0.95; pose = 'susto'; pk = win(tv, A.rasga + 0.1, P0.r0, 0.15, 0.2); }
  if (tv > A.troca && tv < P2.p0) humor = tv > A.bolinha - 0.2 ? 0.95 : 0.6;
  if (tv > P2.p0 && tv <= P2.r0) humor = -0.9;
  if (tv > A.entao2) humor = 0.6;
  if (noP3 && tv > A3b) { humor = -0.85; pose = 'susto'; pk = win(tv, A3b, P3.r0, 0.1, 0.2); }
  if (tv > A.escSozinha && tv <= P4.r0) { humor = tv > A.fechaCabeca - 0.1 ? -0.95 : -0.2; if (tv > A.fechaCabeca - 0.1) { pose = 'susto'; pk = win(tv, A.fechaCabeca - 0.1, P4.r0, 0.1, 0.2); } }
  if (tv > A.pino && tv < A.rajada - 0.3) { olhar = 0.45 * win(tv, A.pino, A.ouSeja, 0.4, 0.4); humor = 0.7; }
  if (tv > A.rajada - 0.3 && tv <= P5.r0) { humor = tv > A.varetaAco ? -1 : -0.6; if (tv < A.varetaAco) { pose = 'susto'; pk = win(tv, A.rajada - 0.1, A.varetaAco, 0.15, 0.25); } if (tv > A.porIsso) olhar = -0.3; }
  if (tv > A.volta - 0.1) humor = 0.85;
  if (tv > A.sair - 0.1) humor = 1;
  if (tv > A.parabens - 0.05) { pose = 'comemora'; pk = prog(tv, A.parabens - 0.05, 0.3); }
  return { x, face, andar, humor, pose, pk, olhar };
}

/* ------------------------------------------------------------------ estado do guarda-chuva (e do pano) */
function guarda(tv, B) {
  const bob = ze.userData.body.position.y;
  const vento = seq(tv, 0, K_VENTO);
  const bate3 = seq(tv, 0, K_BATE3), bate4 = seq(tv, 0, K_BATE4);
  let tilt = 0.12 * B.face + 0.32 * vento + B.face * 0.3 * bate3 + 0.32 * bate4;
  const gx = B.x + 0.27 * B.face, gy = 1.36 + bob - 0.12 * bate4 + 0.26 * seq(tv, 0, K_ERGUE) + (tv > A.parabens - 0.05 ? 0.1 * prog(tv, A.parabens - 0.05, 0.3) : 0);
  const apex = [gx - (-M.Y_PEGA) * Math.sin(tilt), gy + (-M.Y_PEGA) * Math.cos(tilt)];
  // pano
  const hx = B.x + 0.02 * B.face;
  const T_PANO = Math.min(A.pano - 0.35, A.troca + 0.15);
  const chega = ease.out(prog(tv, T_PANO, 0.5));
  const sobe = seq(tv, 0, K_FOLHA_SOBE), est = seq(tv, 0, K_ESTICA), cai = seq(tv, 0, K_PANO_CAI);
  const folha = { cx: lerp(B.x + 1.7, lerp(B.x + 0.05, apex[0], sobe), chega), y: lerp(2.5, lerp(1.88, 2.42, sobe), chega), w: lerp(0.62, 0.74, chega), cai: 0.07 * Math.sin(Math.PI * Math.min(1, cai * 1.6)) };
  let wG = est, wM = (tv > P2.p0 && tv <= P2.r0) ? cai : 0, wF = 1 - wG - wM;
  const xray = Math.max(win(tv, A.varetas - 0.15, A.varetas + 1.7, 0.25, 0.3), win(tv, A.perninha - 0.25, A.escorrega + 0.1, 0.25, 0.3), win(tv, A.trocaAco - 0.35, A.fibra + 1.7, 0.3, 0.35));
  const pano = { vis: tv > Math.min(A.pano - 0.35, A.troca + 0.15), opac: 1 - 0.66 * xray, wF, wM, wG, folha, cabeca: { x: hx, y: 1.53 + bob } };
  const S = {
    apex, tilt, pano,
    k: seq(tv, 1, K_ABRE), inv: seq(tv, 0, K_INV), flex: seq(tv, 0, K_FLEX), torta: seq(tv, 0, K_TORTA),
    cabo: ease.out(prog(tv, A.estica - 0.05, 0.5)), varetas: ease.out(prog(tv, A.varetasFinas - 0.15, 0.85)),
    fibra: prog(tv, A.trocaAco - 0.1, 0.9), pernas: prog(tv, A.perninha - 0.1, 0.6), corr: pop(tv, A.anel - 0.05),
    trava: pop(tv, A.pino - 0.05), mola: win(tv, A.pino - 0.3, A.ouSeja - 0.1, 0.25, 0.3),
    ponteiras: [0, 1, 2, 3, 4].map((i) => pop(tv, A.ponteira - 0.05 + i * 0.11)),
    caboCurvo: pop(tv, A.caboCurvo - 0.1), tiraF: pop(tv, A.tirinha + 0.1, A.agora + 0.05), tiraA: pop(tv, A.agora + 0.25),
  };
  // o pino fica apertado (pra dentro) enquanto o anel passa por cima dele
  const yr = lerp(M.Y_FE, M.Y_AB, clamp(S.k)), yp = M.Y_AB - 0.065;
  S.pinoFora = clamp((Math.abs(yr - yp) - 0.045) / 0.02);
  if (yr > yp) S.pinoFora = Math.max(S.pinoFora, clamp((yr - yp - 0.055) / 0.01));
  return S;
}

/* ------------------------------------------------------------------ estado do jornal (gancho) */
function estadoJornal(tv, B) {
  const vis = tv > A.cobre - 0.3 && tv < A.troca + 0.6;
  const sobe = ease.out(prog(tv, A.cobre - 0.3, 0.5));
  const voa = ease.in(prog(tv, A.troca - 0.05, 0.55));
  const noP = tv <= P0.r0;
  return {
    vis, cx: lerp(B.x + 0.32, B.x + 0.05, sobe) - 2.2 * voa, y: lerp(1.0, 1.88, sobe) + 0.9 * voa, w: lerp(0.16, 0.72, sobe),
    molhado: noP ? prog(tv, A.encharca - 0.25, 0.8) : 0, afunda: noP ? 0.75 * prog(tv, A.encharca - 0.1, Math.max(0.4, A.rasga - A.encharca)) : 0,
    rasga: noP ? prog(tv, A.rasga - 0.05, 0.9, ease.lin) : 0, chao: 0.04,
  };
}

/* ------------------------------------------------------------------ câmera 2D: tomada(t, x, y, alturaVisível, dur) */
const XA = 0.17;                                      // onde fica o topo do guarda-chuva (x) com o boneco em x = 0
tomada(0, 0.12, 1.35, 3.3, 0);
tomada(Math.max(0.6, A.cobre - 0.35), 0.05, 1.5, 2.3, 1.0, { lado: -1 });
tomada(A.dez - 0.2, 0.08, 1.45, 2.8, 0.9);
tomada(A.encharca - 0.3, 0.05, 1.72, 1.55, 0.8, { lado: -1 });
tomada(A.rasga + 0.15, 0.04, 1.15, 2.6, 0.7);
tomada(P0.r0 + VOLTA, 0.1, 1.45, 2.8, 0);
tomada(A.pano - 0.1, 0.18, 1.55, 2.6, 0.9, { lado: -1 });
tomada(A.fechadinho - 0.2, 0.08, 1.95, 1.4, 0.9);
tomada(A.bolinha - 0.15, 0.1, 2.0, 1.15, 0.7, { lado: -1 });
tomada(A.tecido - 0.2, 0.1, 1.3, 4.2, 1.0);
tomada(P2.p0 + 0.1, 0.05, 1.5, 2.3, 0.9, { lado: -1 });
tomada(A.gruda - 0.1, 0.06, 1.45, 1.55, 0.8);
tomada(P2.r0 + VOLTA, 0.12, 1.6, 2.9, 0);
tomada(A.varetasFinas - 0.2, XA, 2.0, 1.7, 0.9, { lado: -1 });
tomada(A.alto, XA, 1.72, 2.3, 0.8);
tomada(A.raios - 0.2, XA, 1.6, 3.0, 0.9, { lado: -1 });
tomada(A.varetas - 0.2, 0.12, 1.35, 4.2, 1.0);
tomada(P3.p0 - 0.3, -0.72, 1.5, 3.4, 0.65, { lado: -1 });
tomada(P3.r0 + VOLTA, XA + 0.05, 1.92, 1.6, 0);
tomada(A.anel - 0.1, XA + 0.05, 1.86, 1.8, 0.8, { lado: -1 });
tomada(A.empurrou - 0.3, 0.14, 1.5, 2.6, 0.9);
tomada(A.corredica - 0.2, 0.14, 1.45, 3.4, 1.0, { lado: -1 });
tomada(P4.p0 + 0.05, 0.12, 1.55, 2.6, 0.9);
tomada(A.fechaCabeca - 0.3, 0.08, 1.6, 2.0, 0.6, { lado: -1 });
tomada(P4.r0 + VOLTA, 0.2, 2.04, 0.95, 0);
tomada(A.pula - 0.5, 0.21, 2.03, 0.8, 0.8, { lado: -1 });
tomada(A.trava - 0.2, 0.17, 1.98, 1.5, 0.9);
tomada(A.ouSeja - 0.1, 0.12, 1.55, 2.6, 0.9, { lado: -1 });
tomada(P5.p0 + 0.05, 0.1, 1.55, 3.4, 0.9);
tomada(A.entorta - 0.3, 0.55, 1.98, 1.4, 0.8, { lado: -1 });
tomada(A.porIsso - 0.1, 2.72, 0.95, 2.6, 1.2);
tomada(P5.r0 + VOLTA, XA, 1.85, 1.9, 0);
tomada(A.enverga - 0.3, 0.1, 1.55, 3.3, 0.9, { lado: -1 });
tomada(A.fibra - 0.2, 0.12, 1.35, 4.2, 1.0);
tomada(A.ponteira - 0.2, 0.58, 1.86, 1.3, 0.9, { lado: -1 });
tomada(A.caboCurvo - 0.25, 0.4, 1.12, 1.1, 0.8);
tomada(A.tirinha - 0.3, 0.2, 1.6, 2.2, 0.8, { lado: -1 });
tomada(A.agora - 0.1, 0.12, 1.5, 3.0, 0.9);
tomada(A.sair - 0.05, 0.12 + XEND * 0.6, 1.5, 3.2, 1.4, { lado: -1 });
tomada(A.parabens - 0.25, XEND + 0.12, 1.42, 4.3, 1.0);
fecharCameras({ duracao: DURATION });

/* ------------------------------------------------------------------ letreiros, plaquinhas, edição */
const jFolhaTopo = [0, 0];
const ptRib = (u, s) => () => { const p = U.Wd(U.superficie(u, s, 0.5, ULT)); return V(p[0], p[1], 0); };
let ULT = { k: 1, inv: 0 };
const pAnel = () => { const p = U.anel(); return V(p[0], p[1], 0); };
const pPino = () => { const p = U.Wd([0.03, M.Y_AB - 0.06]); return V(p[0], p[1], 0); };
const pJornal = () => V(jornalEst.cx, jornalEst.y + 0.05, 0);
let jornalEst = { cx: 0, y: 0 };
const pCabeca = () => { const h = ze.userData.headP; h.updateMatrixWorld(true); return h.localToWorld(V(0, 0.2, 0)); };
const pLixo = () => V(2.85, 1.25, 0);
const pApex = () => V(U.Wd([0, 0.1])[0], U.Wd([0, 0.1])[1], 0);

// gancho
chip('JORNAL', A.jornal, A.encharca - 0.1, pJornal, '#6b7280', { dy: -90 });
chip('ENCHARCOU', A.encharca + 0.05, A.rasga - 0.05, pJornal, '#ff3b2f', { dy: -110 });
chip('RASGOU', A.rasga + 0.05, Math.max(A.rasga + 0.6, P0.r0), pCabeca, '#ff3b2f', { dy: -230 });
som('aah', A.rasga + 0.2, -6);
// pano
chip('PLÁSTICO', A.pano + 0.15, A.gota - 0.1, () => V(jFolhaTopo[0], jFolhaTopo[1], 0), '#2f8cff', { dy: -120 });
chip('A GOTA NÃO PASSA', A.gota - 0.05, A.tecido - 0.2, () => V(jFolhaTopo[0], jFolhaTopo[1], 0), '#22b35e', { dy: -170 });
label('TECIDO IMPERMEÁVEL', A.tecido, A.tecido + 1.7, () => V(jFolhaTopo[0], jFolhaTopo[1], 0), { dy: -190, size: 58 });
chip('MURCHOU', A.murcha, A.cara - 0.15, pCabeca, '#ff3b2f', { dy: -170 });
chip('ÁGUA NA CARA', Math.min(A.cara - 0.1, P2.r0 - 0.8), P2.r0, () => { const p = pCabeca(); return p.add(V(0.25, -0.35, 0)); }, '#2f8cff', { dy: 40 });
// varetas
chip('CABO', A.alto + 0.1, A.raios - 0.1, () => { const p = U.Wd([0, -0.55]); return V(p[0], p[1], 0); }, '#6b7280', { dy: 0, dx: 0 });
label('VARETAS', A.varetas, A.varetas + 1.7, ptRib(-Math.SQRT1_2, 0.75), { dy: -260 });
// porta
chip('PORTA', P3.p0 + 0.05, A3b - 0.05, () => V(XP - 0.11, 1.6, 0), '#6b7280', { dy: 0 });
chip('NÃO PASSA!', A3b + 0.05, P3.r0, () => V(XP + 0.05, 2.3, 0), '#ff3b2f', { dy: -120 });
// corrediça
chip('PERNINHAS', A.perninha + 0.1, A.anel - 0.1, ptRib(Math.SQRT1_2, 0.3), '#d9a400', { dy: 120 });
chip('ANEL', A.anel + 0.05, A.escorrega + 0.3, pAnel, '#e9545a', { dy: 110 });
chip('ABRE', A.abre - 0.1, A.puxou, pApex, '#22b35e', { dy: -70 });
chip('FECHA', A.fecha - 0.1, A.corredica - 0.05, pApex, '#2f8cff', { dy: -70 });
label('CORREDIÇA', A.corredica, A.corredica + 1.7, pAnel, { dy: -270 });
// trava
chip('ESCORREGOU', A.escSozinha + 0.25, A.fechaCabeca - 0.1, pAnel, '#ff3b2f', { dy: 140 });
chip('PINO + MOLA', A.pino + 0.1, A.trava - 0.1, pPino, '#d9a400', { dy: 190 });
label('TRAVA', A.trava, A.trava + 1.6, pPino, { dy: -440 });
// vento e fibra
chip('RAJADA', A.rajada, A.avesso - 0.1, () => V(0.75, 2.45, 0), '#2f8cff', { dy: 0 });
chip('DO AVESSO', A.avesso, A.varetaAco - 0.1, pApex, '#ff3b2f', { dy: -150 });
chip('ENTORTOU', A.entorta, A.porIsso - 0.15, ptRib(Math.SQRT1_2, 0.95), '#ff3b2f', { dy: -170 });
chip('1ª VENTANIA', A.lixo - 0.1, P5.r0, pLixo, '#ff3b2f', { dy: -60 });
chip('VOLTA PRO LUGAR', A.volta, A.fibra - 0.1, pApex, '#22b35e', { dy: -130 });
label('FIBRA DE VIDRO', A.fibra, A.fibra + 1.7, ptRib(Math.SQRT1_2, 0.7), { dy: -300, size: 60 });
// acabamento
chip('PONTEIRA', A.ponteira + 0.15, A.caboCurvo - 0.3, ptRib(1, 1), '#6b7280', { dy: -130 });
chip('CABO CURVO', A.caboCurvo + 0.1, A.tirinha - 0.3, () => { const p = U.Wd([0.07, -1.1]); return V(p[0], p[1], 0); }, '#d9a400', { dy: 110 });
chip('TIRINHA', A.tirinha + 0.25, A.agora + 0.1, () => { const p = U.Wd([0.05, -0.37]); return V(p[0], p[1], 0); }, '#16524f', { dy: -140 });
label('GUARDA-CHUVA', A.construiu + 0.3, A.comente - 0.15, () => { const p = U.Wd([0, 0.12]); return V(p[0], p[1], 0); }, { dy: -170, size: 70 });
configurarLegendas({ destaque: ['parabens'], nomes: ['tecido', 'varetas', 'corredica', 'trava', 'fibra'], linhas: { guardachuva: -2, chuva: -1 } });

// piscar 2× + emote de ideia em cada nome
piscar(gPano, A.tecido); piscar(gAco, A.varetas); piscar(gCorr, A.corredica); piscar(gTrava, A.trava); piscar(gFib, A.fibra);
for (const t of [A.tecido, A.varetas, A.corredica, A.trava, A.fibra]) emote('ideia', t - 0.1, t + 1.2, ze, { dx: -0.34 });
// reações
emote('!', A.pego, A.cobre - 0.3, ze);
emote('suor', A.rasga + 0.2, P0.r0 + 0.05, ze);
emote('suor', A.murcha + 0.2, P2.r0 + 0.05, ze);
emote('estrelas', A.fechaCabeca + 0.05, P4.r0 + 0.05, ze);
emote('!', A.avesso - 0.4, A.varetaAco, ze);
emote('suor', A.entorta, P5.r0 + 0.05, ze);
impacto('TUM!', A3b, A3b + 0.75, () => V(XP + 0.1, 2.05, 0), { size: 120 });
impacto('POF!', A.fechaCabeca - 0.02, A.fechaCabeca + 0.7, () => V(0.25, 2.0, 0), { size: 110 });
impacto('CLIC!', A.pula - 0.03, A.pula + 0.6, () => { const p = U.Wd([0.12, M.Y_AB - 0.02]); return V(p[0], p[1], 0); }, { size: 90 });
impacto('CLIC!', A.clique - 0.02, A.clique + 0.7, () => { const p = U.Wd([0.16, M.Y_AB]); return V(p[0], p[1], 0); }, { size: 100 });
impacto('CLIC!', A.clique2 - 0.02, A.clique2 + 0.6, () => { const p = U.Wd([0.16, M.Y_AB]); return V(p[0], p[1], 0); }, { size: 100 });
tremor(A3b, 0.4, 0.0025); tremor(A.fechaCabeca, 0.35, 0.0025); zoomSoco(A.avesso - 0.35, 0.12);   // câmera do 2D fica a 70 m: tremor bem fraquinho
for (const P of PROBS) { rebobinar(P.r0, VOLTA); som('rewind', P.r0, -8); }
transicao(A.parabens - 0.55, 'cortina', 0.6);

/* ------------------------------------------------------------------ sons */
ambiente('rain', 0, DURATION, -24, { fade: 0.6 });
som('voz_eita', A.pego + 0.15, -5);
som('whoosh_suave', A.cobre - 0.3, -16);
som('correct', A.funciona + 0.05, -17);
som('clock', A.dez - 0.05, -19, { dur: 1.3, fadeOut: 0.3 });
som('drip', A.encharca - 0.1, -16, { dur: 1.4, fadeOut: 0.3 });
som('papel_rasgando', A.rasga - 0.05, -8);
som('voz_naao', A.pescoco - 0.15, -4);
som('whoosh', A.troca, -18);
som('whoosh_suave', A.pano - 0.35, -16); som('matflap', A.pano + 0.12, -16);
som('bubbles', A.bolinha, -18);
som('matflap', A.murcha - 0.1, -12); som('aah', A.cara - 0.2, -5);
som('whoosh_suave', A.estica - 0.05, -16); som('cableup', A.varetasFinas - 0.12, -17); som('umbrellaopen', A.raios + 0.3, -12);
som('steps', P3.p0 + 0.15, -16, { dur: 0.6, fadeOut: 0.1 }); som('bonk', A3b, -8); som('voz_opa', A3b + 0.2, -5);
som('assemble', A.perninha - 0.05, -16, { dur: 0.9, fadeOut: 0.2 }); som('click', A.anel, -14); som('pdown', A.escorrega, -16);
som('umbrellaopen', A.abre - 0.25, -13); som('pdown', A.puxou + 0.05, -14); som('umbrellaopen', A.corredica + 0.3, -16);
som('pdown', A.escSozinha + 0.1, -12); som('bonk', A.fechaCabeca, -6); som('voz_eita', A.fechaCabeca + 0.2, -4); som('tweety', A.fechaCabeca + 0.3, -22);
som('pop2', A.pino, -16); som('pinclick', A.pula, -9); som('click', A.clique, -8);
som('gust', A.rajada - 0.3, -10); ambiente('windloop', A.rajada, A.varetaAco, -19, { fade: 0.3 }); som('umbrellaflip', A.avesso - 0.45, -8);
som('wind_stop', A.varetaAco - 0.2, -17); som('metalstrain', A.entorta - 0.2, -12); som('sad', A.lixo - 0.1, -12);
som('sparkle', A.trocaAco - 0.05, -16); som('gust', A.enverga - 0.6, -12); som('springboing', A.volta - 0.15, -12);
[0, 1, 2, 3, 4].forEach((i) => som('pop', A.ponteira - 0.05 + i * 0.11, -17));
som('clunk_soft', A.caboCurvo - 0.05, -11); som('pdown', A.tirinha - 0.4, -15); som('velcro', A.tirinha + 0.15, -12);
som('velcro', A.agora + 0.05, -15); som('umbrellaopen', A.clique2 - 0.3, -11); som('click', A.clique2, -8);
som('passos_pocas', A.sair, -13, { dur: Math.max(1.2, A.parabens + 0.5 - A.sair), fadeOut: 0.3 }); som('voz_oba', A.sair + 0.25, -6);
for (const t of [A.tecido, A.varetas, A.corredica, A.trava, A.fibra]) som('ding', t + 0.05, -16);
som('whoosh_suave', A.parabens - 0.55, -16);
som('tada', A.parabens - 0.06, -4); som('cheer', A.parabens + 0.25, -12);
som('pop2', A.comente, -14);

/* ------------------------------------------------------------------ chuva: inclinação, força e onde para */
const VENTO_CHUVA = (tv) => 0.07 + 0.5 * seq(tv, 0, K_VENTO);
const FORCA = (tv) => 0.45 + 0.55 * prog(tv, A.pego - 0.3, 0.6);
const telhado = (x) => (x > XP - 3.7 && x < XP + 0.4 ? 3.03 : -99);
const marquise = (x) => (x > XP - 0.11 && x < XP + 0.51 ? 2.34 : -99);
let BX = 0;
function corpo(x) {
  const hx = BX + 0.02 * ze.scale.x, dx = (x - hx) / 0.165;
  let y = -99;
  if (Math.abs(dx) < 1) y = 1.53 + 0.18 * Math.sqrt(1 - dx * dx);
  if (Math.abs(x - BX) < 0.19) y = Math.max(y, 1.38);
  return y;
}
const parada = (x) => Math.max(0.03, telhado(x), marquise(x), AB.topo(x), corpo(x));

/* ------------------------------------------------------------------ desenhos 2D por cima: inserto "visto de baixo" e rajadas de vento */
function desenharInserto(t) {
  const t0 = A.raios - 0.25, t1 = A.varetas - 0.25; const s = pop(t, t0, t1, 0.35); if (s <= 0.001) return;
  const sB = pop(t, A.bicicleta - 0.2, t1, 0.35);
  g2.save(); g2.translate(W / 2, 360); g2.scale(s, s);
  g2.fillStyle = 'rgba(0,0,0,0.18)'; g2.beginPath(); g2.roundRect(-430, -180 + 8, 860, 360, 48); g2.fill();
  g2.fillStyle = '#ffffff'; g2.beginPath(); g2.roundRect(-430, -180, 860, 360, 48); g2.fill();
  g2.font = fonte(700, 46, 'plaquinha'); g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillStyle = '#1d6a67';
  g2.fillText('VISTO DE BAIXO', -205, -132);
  // guarda-chuva visto de baixo: gomos + 8 varetas = raios
  const cx = -205, cy = 22, r = 118, cores = M.C.pano;
  for (let i = 0; i < 8; i++) { g2.fillStyle = cores[i % 2 ? 3 : 2]; g2.beginPath(); g2.moveTo(cx, cy); g2.arc(cx, cy, r, i * Math.PI / 4 + t * 0.4, (i + 1) * Math.PI / 4 + t * 0.4); g2.closePath(); g2.fill(); }
  g2.strokeStyle = M.C.aco; g2.lineWidth = 7; g2.lineCap = 'round';
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 0.4; g2.beginPath(); g2.moveTo(cx, cy); g2.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g2.stroke(); }
  g2.fillStyle = M.C.cabo; g2.beginPath(); g2.arc(cx, cy, 15, 0, 7); g2.fill();
  if (sB > 0.001) {
    g2.save(); g2.translate(205, 22); g2.scale(sB, sB);
    g2.font = fonte(700, 46, 'plaquinha'); g2.fillStyle = '#1d6a67'; g2.fillText('RODA DE BICICLETA', 0, -154);
    g2.strokeStyle = '#2b2d33'; g2.lineWidth = 22; g2.beginPath(); g2.arc(0, 0, 108, 0, 7); g2.stroke();
    g2.strokeStyle = '#9aa3ad'; g2.lineWidth = 4; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 + t * 0.4; g2.beginPath(); g2.moveTo(0, 0); g2.lineTo(Math.cos(a) * 96, Math.sin(a) * 96); g2.stroke(); }
    g2.fillStyle = '#9aa3ad'; g2.beginPath(); g2.arc(0, 0, 16, 0, 7); g2.fill();
    g2.restore();
    g2.font = fonte(700, 80, 'plaquinha'); g2.fillStyle = M.C.pano[1]; g2.fillText('=', 0, 22);
  }
  g2.restore();
}
function desenharVento(t) {
  const tv = warp(t), v = seq(tv, 0, K_VENTO); if (v < 0.02) return;
  g2.save(); g2.lineCap = 'round'; g2.strokeStyle = '#ffffff';
  for (let i = 0; i < 12; i++) {
    const ph = (t * (1.3 + 0.6 * hash(i)) + hash(i * 3.1)) % 1, y = 500 + 900 * hash(i * 7.7) - ph * 260, x = W * 1.2 - ph * W * 1.5, len = 160 + 160 * hash(i * 1.3);
    g2.globalAlpha = 0.55 * v * Math.sin(Math.PI * ph); g2.lineWidth = 9;
    g2.beginPath(); g2.moveTo(x, y); g2.quadraticCurveTo(x - len * 0.5, y - 30, x - len, y - 10); g2.stroke();
  }
  g2.restore();
}

/* ------------------------------------------------------------------ animação: tudo em função do tempo */
const tmpV = new THREE.Vector3();
function update(t) {
  efeitosCamera(t);
  const tv = warp(t);
  const B = boneco(tv);
  ze.position.x = B.x; ze.scale.x = B.face; BX = B.x;
  E.animar(ze, tv, { humor: B.humor, andar: B.andar, pose: B.pose, poseK: B.pk, olhar: B.olhar, passo: 8 });
  if (tv > A.parabens - 0.05) ze.userData.body.position.y += Math.abs(Math.sin(tv * 7)) * 0.05;
  // jornal
  const J = estadoJornal(tv, B); jornal.pose(J); jornalEst = J;
  // guarda-chuva + pano
  const S = guarda(tv, B); U.pose(S); ULT = S;
  { const F = S.pano.folha; jFolhaTopo[0] = S.pano.wG > 0.5 ? S.apex[0] : F.cx; jFolhaTopo[1] = S.pano.wG > 0.5 ? S.apex[1] : F.y + 0.03; }
  // braços: segurando o jornal / o pano / o cabo; mão de trás empurra o anel; aponta no "Esse é"
  const [bT, bF] = ze.userData.arms;
  const segurandoJornal = J.vis && J.rasga < 0.05 && tv < A.troca;
  if (segurandoJornal) {
    const kk = prog(tv, A.cobre - 0.3, 0.3);
    alcancar(ze, bF, V(J.cx + 0.2 * (J.w / 0.72), J.y - 0.07, 0), 1);
    alcancar(ze, bT, V(J.cx - 0.2 * (J.w / 0.72), J.y - 0.07, 0), kk);
  } else if (tv >= A.troca - 0.05 && S.cabo < 0.5 && !(tv > P2.p0 && tv <= P2.r0 && S.pano.wM > 0.3)) {
    // mãos pra cima esperando o pano chegar; depois seguem o pano (e soltam quando ele murcha ou sobe pro cabo)
    const F = S.pano.folha, sol = 1 - clamp(S.pano.wM / 0.3), cx = tv < A.estica - 0.1 ? B.x + 0.05 * B.face : F.cx, cy = tv < A.estica - 0.1 ? 1.88 : F.y;
    alcancar(ze, bF, V(cx + 0.21, cy - 0.07, 0), sol); alcancar(ze, bT, V(cx - 0.21, cy - 0.07, 0), sol);
  }
  if (S.cabo > 0.3) {
    const g = U.pegada(); alcancar(ze, bF, V(g[0], g[1], 0), 1);
    // mão de trás no anel (corrediça) quando é a pessoa que mexe nele
    const naMao = Math.max(win(tv, A.escorrega - 0.2, A.corredica + 1.0, 0.25, 0.3), win(tv, A.ouSeja - 0.25, A.clique + 0.45, 0.2, 0.3), win(tv, A.empurrar - 0.3, A.clique2 + 0.35, 0.2, 0.3));
    if (naMao > 0.001) { const a = U.anel(); alcancar(ze, bT, V(a[0] - 0.01 * B.face, a[1] - 0.03, 0), naMao); }
    // "Esse é o…": o braço de trás aponta pra peça
    const ap = Math.max(win(tv, A.varetas, A.varetas + 1.4, 0.2, 0.3), win(tv, A.fibra, A.fibra + 1.4, 0.2, 0.3));
    if (ap > 0.001) alcancar(ze, bT, V(B.x - 0.35, 2.1, 0), ap);
  }
  if (tv > A.parabens - 0.05) { bT.sh.rotation.z = lerp(bT.sh.rotation.z, 2.7 + 0.2 * Math.sin(tv * 12), prog(tv, A.parabens - 0.05, 0.3)); bT.el.rotation.z = 0.25; }
  // camisa molhada (gancho)
  const mk = tv <= P0.r0 ? prog(tv, A.escorre0 - 0.1, 0.9) : 0; molhado.visible = mk > 0.01; molhado.scale.setScalar(Math.max(0.001, mk));
  // bolinhas rolando no pano (L1)
  const bW = win(tv, A.bolinha - 0.3, A.tecido + 1.3, 0.2, 0.3);
  bolinhas.forEach((b, i) => {
    b.visible = bW > 0.01 && S.pano.wF > 0.9; if (!b.visible) return;
    const F = S.pano.folha, f = ((tv - A.bolinha) * (0.55 + 0.3 * hash(i)) + hash(i * 5.3)) % 1, lado = i % 2 ? 1 : -1, x0 = (hash(i * 2.2) - 0.5) * 0.3;
    const qx = x0 + lado * f * 0.5, sobre = Math.abs(qx) < F.w / 2, u = qx / (F.w / 2);
    const y = sobre ? F.y + 0.035 * (1 - u * u) + 0.016 : F.y - (Math.abs(qx) - F.w / 2) * 6;
    b.position.set(F.cx + qx, y, 0.06); b.scale.setScalar(bW * (sobre ? 1 : 0.8));
  });
  // água escorrendo: nuca (gancho) e cara (pano grudado)
  const eN = tv <= P0.r0 ? win(tv, A.escorre0 - 0.2, P0.r0, 0.2, 0.2) : 0, eC = tv <= P2.r0 && tv > P2.p0 ? win(tv, A.gruda, P2.r0, 0.2, 0.2) : 0;
  escorre.forEach((g, i) => {
    const f = ((tv * 1.3 + i / escorre.length) % 1);
    if (eN > 0.01 && i < 4) { const hx = B.x - 0.13 * B.face; g.visible = true; g.position.set(hx - 0.03 * f * B.face, 1.62 - f * 0.42, 0.03); g.scale.setScalar(eN); return; }
    if (eC > 0.01) { const hx = B.x + 0.24 * B.face; g.visible = true; g.position.set(hx + 0.01 * Math.sin(i), 1.3 - f * 0.55, 0.05); g.scale.setScalar(eC); return; }
    g.visible = false;
  });
  // pingos caindo das pontas das varetas (guarda-chuva aberto na chuva)
  const pW = S.pano.wG > 0.95 && S.k > 0.9 && S.inv < 0.2 ? 1 : 0;
  pingos.forEach((g, i) => {
    g.visible = pW > 0; if (!g.visible) return;
    const u = [-1, -Math.SQRT1_2, Math.SQRT1_2, 1][i % 4], tip = U.pontaVareta(u, S), f = ((tv * (1.1 + 0.3 * hash(i))) + hash(i * 9.1)) % 1;
    g.position.set(tip[0], tip[1] - 0.02 - f * f * (tip[1] - 0.05), 0.05); g.scale.setScalar(f < 0.05 ? f / 0.05 : 1);
  });
  // poças: anéis
  POCAS.forEach((p, j) => p.userData.aneis.forEach((a, i) => { const f = ((tv * 0.9 + i / 3 + j * 0.37) % 1); const sx = 0.06 + 0.22 * f; a.scale.set(sx, sx * 0.25, 1); a.material.opacity = 0.8 * (1 - f); }));
  // chuva
  AB.limpar();
  if (S.pano.vis) U.abrigar(AB);
  if (J.vis && J.rasga < 0.1) jornal.abrigar(AB);
  chuva.update(tv, VENTO_CHUVA(tv), FORCA(tv), parada);
  aplicarPiscadas(t);
}
iniciar({ duracao: DURATION, ancoras: A, update, desenhar: (t) => { desenharVento(t); desenharInserto(t); desenharEfeitos(t); } });
