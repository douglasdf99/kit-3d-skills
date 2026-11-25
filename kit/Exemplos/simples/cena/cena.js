/* =====================================================================================
   DEMO DE 10 s: Fonte   ·   estilo «Simples»
   "E SE…?": a mangueira apontada pro céu molha a praça inteira e a multidão reage junto (◀◀);
   então sobe uma bacia em volta do jato, a água cai dentro dela e todo mundo comemora. "Essa é a fonte" → a bacia pisca.
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, prog, win, pop, hash } from '../../../sistema/motor/lib.js';
import * as E from '../../../biblioteca/estilos/simples/estilo.js';
import { W, H, T, TL, scene, V, orb, FIM_NARRACAO, fecharCameras, label, chip, configurarLegendas, som, ambiente, iniciar } from '../../../sistema/motor/video.js';
import { piscar, aplicarPiscadas, efeitosCamera, desenharEfeitos, rebobinar, emote, zoomSoco, manchete, transicao } from '../../../sistema/motor/edicao.js';

const N = TL.lines.length, L = (i) => TL.lines[(i + N) % N];
const A = { liga: T('liga'), mangueira: T('mangueira'), ceu: T('pro ceu'), meio: T('no meio'), praca: T('praca'), cai: T('a agua cai'), todo: T('todo mundo'),
  entao: T('entao'), bacia: T('uma bacia'), volta: T('em volta'), segura: T('que segura'), fonte: T('essa e'), nome: T('fonte') };
const VOLTA = 0.7, R = Math.min(L(0).e - 0.2, A.entao - VOLTA - 0.05);
const DURATION = Math.max(FIM_NARRACAO + 0.5, A.fonte + 1.9); A.end = DURATION;
const hist = (t) => (t >= R && t < R + VOLTA ? lerp(R, A.liga - 0.1, ease.inOut((t - R) / VOLTA)) : t);
E.preparar();

/* ------------------------------------------------------------------ cenário: praça redonda com árvores e prédios */
scene.add(E.chao());
scene.add(E.praca({ raio: 6.5 }));
for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.3; scene.add(E.em(E.arvore({ tam: 1 + 0.2 * hash(i) }), Math.cos(a) * 7.6, 0, Math.sin(a) * 7.6)); }
for (let i = 0; i < 7; i++) { const a = Math.PI * (1.05 + i * 0.13); const p = E.predio({ andares: 3 + (i % 3) }); p.position.set(Math.cos(a) * 13, 0, Math.sin(a) * 13); p.rotation.y = -a - Math.PI / 2; scene.add(p); }

/* ------------------------------------------------------------------ a multidão em volta do meio da praça */
const povo = E.multidao(16, { raio: 2.9 }); scene.add(povo);

/* ------------------------------------------------------------------ a fonte: bacia de pedra com água, bico no meio */
const fonte = new THREE.Group(); scene.add(fonte);
const bacia = E.grupo(E.em(E.cilindro(1.1, 0.42, E.COR.pedra, { seg: 48 }), 0, 0.21, 0), E.em(new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.08, 10, 48), E.material('#e9e4da')), 0, 0.42, 0));
bacia.children[1].rotation.x = Math.PI / 2; fonte.add(bacia);
const espelho = E.em(E.cilindro(0.98, 0.03, E.COR.agua, { seg: 48 }), 0, 0.43, 0); fonte.add(espelho);
const bico = E.em(E.cilindro(0.08, 0.5, '#d9d4cc', { rTopo: 0.05 }), 0, 0.6, 0); fonte.add(bico);
const gFonte = E.grupo(bacia, bico); fonte.add(gFonte);
// poça na praça (cresce enquanto molha todo mundo)
const poca = E.em(E.cilindro(1, 0.012, E.COR.agua, { seg: 40 }), 0, 0.07, 0); poca.material = poca.material.clone(); poca.material.transparent = true; poca.material.opacity = 0.75; scene.add(poca);

/* ------------------------------------------------------------------ o boneco com a mangueira */
const ze = E.boneco(); scene.add(ze);
const mang = E.cilindro(0.035, 0.5, '#3fae4f'); mang.rotation.x = 0.2; scene.add(mang);

/* ------------------------------------------------------------------ o jato: gotas (uma malha só, 160 gotas) */
const NG = 160, gotas = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), E.material(E.COR.agua), NG); gotas.castShadow = false; scene.add(gotas);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
function jato(t, forca, ox, oy, oz, alcance, alto) {
  const vy = Math.sqrt(2 * 9.8 * alto), Tv = (vy + Math.sqrt(vy * vy + 2 * 9.8 * oy)) / 9.8;
  for (let i = 0; i < NG; i++) {
    const f = (t * 0.75 + hash(i * 1.7)) % 1, a = hash(i * 3.1) * Math.PI * 2, r = alcance[0] + hash(i * 5.3) * (alcance[1] - alcance[0]), tau = f * Tv;
    _p.set(ox + Math.cos(a) * r * f, oy + vy * tau - 4.9 * tau * tau, oz + Math.sin(a) * r * f);
    _s.setScalar(forca > 0.01 && hash(i * 9.9) < forca ? 0.035 + 0.025 * hash(i) : 0.0001); _m.compose(_p, _q, _s); gotas.setMatrixAt(i, _m);
  }
  gotas.instanceMatrix.needsUpdate = true;
}
scene.updateMatrixWorld(true);

/* ------------------------------------------------------------------ câmera: rápida; manchete no topo, soco de zoom na revelação */
orb(0, V(0, 1.05, 0), 18, 24, 5.4, 40, 0);
orb(A.ceu - 0.2, V(0, 2.4, 0), 12, -6, 5.2, 42, 0.9);
orb(A.praca - 0.3, V(0, 0.6, 0), 32, 38, 10.5, 42, 1.0);
orb(A.cai + 0.2, V(1.4, 0.9, 1.4), 44, 26, 5.2, 40, 0.8);
orb(R + VOLTA, V(0, 0.7, 0), 24, 26, 7.5, 42, 0);
orb(A.bacia - 0.1, V(-0.3, 0.45, 0), 48, 14, 4.2, 40, 0.9);
orb(A.fonte - 0.2, V(0, 1.0, 0), -22, 22, 10.0, 42, 1.0, 0.03, { spin: -0.06 });
fecharCameras({ duracao: DURATION });

/* ------------------------------------------------------------------ letreiros, manchete e reações da multidão */
manchete('E SE…?', 0.05, A.ceu + 0.2);
chip('MOLHOU GERAL', A.todo - 0.1, R, () => V(1.9, 1.6, 1.9), '#2f8cff', { dy: -60, size: 58 });
[0, 4, 8, 12].forEach((k, j) => emote(j % 2 ? 'suor' : '!', A.cai + 0.1 + j * 0.08, R + 0.05, povo.pessoas[k]));
emote('suor', A.todo, R + 0.05, ze);
rebobinar(R, VOLTA); som('rewind', R, -8);
label('FONTE', A.fonte, A.fonte + 1.75, () => V(0, 0.45, 1.1), { dy: -230, size: 92 });
piscar(gFonte, A.fonte); zoomSoco(A.fonte + 0.02, 0.12);
emote('ideia', A.fonte - 0.1, A.fonte + 1.3, ze);
configurarLegendas({ nomes: ['fonte'] });

/* ------------------------------------------------------------------ sons */
som('hose', A.liga, -14, { dur: Math.max(1, R - A.liga), fadeOut: 0.3 }); som('waterup', A.ceu - 0.1, -12);
som('multidao_murmurio', 0, -24, { dur: A.cai, fadeOut: 0.4 }); som('crowdpanic', A.cai + 0.1, -12, { dur: Math.max(0.8, R - A.cai), fadeOut: 0.3 });
som('splash', A.cai + 0.3, -16); som('spray', A.segura - 0.2, -18, { dur: DURATION - A.segura, fadeOut: 0.5 });
som('rockslide', A.bacia - 0.05, -14); som('multidao_oooh', A.segura + 0.2, -16);
som('aplausos_grandes', A.fonte + 0.25, -12);
ambiente('birds', 0, DURATION, -30, { fade: 0.5 });

/* ------------------------------------------------------------------ animação */
function update(t) {
  efeitosCamera(t);
  const tt = hist(t), tentativa = t < R + VOLTA;
  // fonte só existe depois do ◀◀: a bacia cresce do chão em volta do jato
  const sobe = tentativa ? 0 : prog(t, A.bacia - 0.05, Math.max(0.5, A.volta - A.bacia + 0.2), ease.back);
  fonte.visible = sobe > 0.001; fonte.scale.set(Math.max(0.001, sobe), Math.max(0.001, sobe), Math.max(0.001, sobe));
  espelho.scale.set(1, 1, 1); espelho.position.y = lerp(0.2, 0.43, prog(t, A.segura, 0.8));
  // boneco: no meio com a mangueira; depois do ◀◀ vai pro lado
  const lado = tentativa ? 0 : prog(t, A.entao - 0.05, 0.7);
  ze.position.set(lerp(0, -1.7, lado), 0, lerp(0.15, 0.9, lado)); ze.rotation.y = lerp(0.35, 1.1, lado);
  mang.visible = tentativa && tt > A.mangueira - 0.15; mang.position.set(ze.position.x + 0.12, 1.05, ze.position.z + 0.18);
  // jato: na tentativa sobe alto e cai na multidão; na fonte sobe pouco e cai dentro da bacia
  if (tentativa) jato(tt, prog(tt, A.ceu - 0.25, 0.4) * (tt < R ? 1 : 0), 0.12, 1.25, 0.33, [2.0, 3.4], 3.0);
  else jato(t, prog(t, A.segura - 0.25, 0.5), 0, 0.85, 0, [0.15, 0.8], 1.1);
  const molha = tentativa ? prog(tt, A.cai + 0.2, 1.0) : 0;
  poca.visible = molha > 0.01; poca.scale.set(0.5 + 3.4 * molha, 1, 0.5 + 3.4 * molha);
  // multidão: olha pro jato, leva a água na cabeça, depois comemora
  povo.pessoas.forEach((p, i) => {
    let humor = 0.4, pose = null, pk = 0;
    if (tentativa && tt > A.cai + 0.1 + 0.03 * (i % 5)) { humor = -0.9; pose = 'susto'; pk = win(tt, A.cai + 0.1 + 0.03 * (i % 5), R, 0.15, 0.15); }
    if (!tentativa && t > A.fonte + 0.15 + 0.04 * (i % 6)) { humor = 1; pose = 'comemora'; pk = prog(t, A.fonte + 0.15 + 0.04 * (i % 6), 0.3); }
    E.animar(p, tt + i * 0.37, { humor, pose, poseK: pk });
  });
  let humor = 0.6, pose = tentativa && tt > A.mangueira - 0.1 ? 'segura' : null, pk = tentativa ? win(tt, A.mangueira - 0.1, R, 0.2, 0.2) : 0;
  if (tentativa && tt > A.todo - 0.1) humor = -0.8;
  if (!tentativa && t > A.bacia - 0.1 && t < A.segura + 0.7) { pose = 'aponta'; pk = win(t, A.bacia - 0.1, A.segura + 0.7, 0.2, 0.25); humor = 0.8; }
  if (!tentativa && t > A.fonte + 0.3) { pose = 'comemora'; pk = prog(t, A.fonte + 0.3, 0.3); humor = 1; }
  E.animar(ze, tt, { humor, pose, poseK: pk, andar: tentativa ? 0 : win(t, A.entao - 0.05, A.entao + 0.65, 0.15, 0.15) });
  aplicarPiscadas(t);
}
iniciar({ duracao: DURATION, ancoras: A, update, desenhar: (t) => desenharEfeitos(t) });
