/* =====================================================================================
   DEMO DE 10 s: Varal   ·   estilo «Padrão»
   A roupa molhada estendida na grama suja de terra e não seca (◀◀); então sobem dois postes, a corda estica
   entre eles e a roupa sobe pra secar no sol, balançando no vento. "Esse é o varal" → postes e corda piscam.
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, prog, win, pop, hash } from '../../../sistema/motor/lib.js';
import * as E from '../../../biblioteca/estilos/padrao/estilo.js';
import { W, H, T, TL, scene, V, orb, FIM_NARRACAO, fecharCameras, label, chip, configurarLegendas, som, ambiente, iniciar } from '../../../sistema/motor/video.js';
import { piscar, aplicarPiscadas, efeitosCamera, desenharEfeitos, rebobinar, emote, zoomSoco } from '../../../sistema/motor/edicao.js';

const N = TL.lines.length, L = (i) => TL.lines[(i + N) % N];
const A = { estende: T('estende'), roupa: T('a roupa'), grama: T('na grama'), suja: T('suja'), seca: T('nao seca'),
  entao: T('entao'), amarra: T('amarra'), corda: T('uma corda'), esticada: T('esticada'), postes: T('dois postes'), sol: T('no sol'), varal: T('esse e'), nome: T('varal') };
const VOLTA = 0.7, R = Math.min(L(0).e - 0.2, A.entao - VOLTA - 0.05);
const DURATION = Math.max(FIM_NARRACAO + 0.5, A.varal + 1.9); A.end = DURATION;
const hist = (t) => (t >= R && t < R + VOLTA ? lerp(R, A.estende - 0.1, ease.inOut((t - R) / VOLTA)) : t);
E.preparar();

/* ------------------------------------------------------------------ cenário: o quintal da série (grama, cerca, árvores, nuvens) */
const mundo = E.mundo(); scene.add(mundo.group);

/* ------------------------------------------------------------------ o varal: dois postes de madeira e a corda */
const ZV = 0.85, XP = 1.15, HV = 1.78;
const postes = [-XP, XP].map((x) => { const g = E.grupo(E.em(E.cilindro(0.045, HV, '#9a6b3f'), 0, HV / 2, 0), E.em(E.caixa(0.32, 0.06, 0.07, '#8a5f37', { r: 0.015 }), 0, HV - 0.05, 0)); g.position.set(x, 0, ZV); scene.add(g); return g; });
const corda = E.cilindro(0.009, 2 * XP, '#f2efe6'); corda.rotation.z = Math.PI / 2; const cordaP = E.em(new THREE.Group(), -XP, HV - 0.02, ZV); corda.position.x = XP; cordaP.add(corda); scene.add(cordaP);
const gVaral = E.grupo(...postes, cordaP); scene.add(gVaral);

/* ------------------------------------------------------------------ as roupas (camiseta, toalha e bermuda), molhadas = cor mais escura */
const ROUPAS = [['camiseta', '#e2574c', -0.62], ['toalha', '#4f9bd9', 0.02], ['bermuda', '#f2c230', 0.62]];
const roupas = ROUPAS.map(([tipo, cor, x], i) => {
  const g = new THREE.Group(), m = E.material(cor), c0 = new THREE.Color(cor);
  const peca = (w, h, px, py) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), m); b.position.set(px, py, 0); b.castShadow = true; g.add(b); return b; };
  if (tipo === 'camiseta') { peca(0.42, 0.46, 0, -0.25); peca(0.16, 0.13, -0.26, -0.08).rotation.z = 0.5; peca(0.16, 0.13, 0.26, -0.08).rotation.z = -0.5; }
  else if (tipo === 'toalha') { peca(0.4, 0.62, 0, -0.32); peca(0.4, 0.04, 0, -0.6).material = E.material('#ffffff'); }
  else { peca(0.4, 0.14, 0, -0.08); peca(0.18, 0.24, -0.11, -0.26); peca(0.18, 0.24, 0.11, -0.26); }
  const sujeira = Array.from({ length: 5 }, (_, k) => { const s = new THREE.Mesh(new THREE.CircleGeometry(0.035 + 0.02 * hash(k + i * 7), 10), E.material('#6b4a2e')); s.position.set((hash(k * 3.1 + i) - 0.5) * 0.3, -0.12 - hash(k * 5.3 + i) * 0.3, 0.012); g.add(s); return s; });
  const prendedor = E.caixa(0.03, 0.07, 0.03, '#7fc35a', { r: 0.008 }); prendedor.position.y = 0.01; g.add(prendedor);
  g.userData = { m, c0, sujeira, prendedor, x, i };
  scene.add(g); return g;
});
// gotas pingando
const GOT = Array.from({ length: 18 }, () => { const s = E.esfera(0.014, '#9fd3f5'); s.visible = false; scene.add(s); return s; });

/* ------------------------------------------------------------------ o boneco modelo (camisa branca, calça azul-escura, cabelo preto curtinho) */
const ze = E.boneco(); ze.position.set(-1.45, 0, 1.35); ze.rotation.y = 1.1; scene.add(ze);
scene.updateMatrixWorld(true);

/* ------------------------------------------------------------------ câmera: sempre andando; perto no erro, longe no "Esse é" */
orb(0, V(-1.0, 0.85, 1.1), 28, 8, 3.9, 40, 0);
orb(A.estende + 0.1, V(-0.6, 0.45, 1.05), 20, 26, 4.2, 40, 1.0);
orb(A.suja - 0.15, V(0, 0.08, 0.95), 22, 55, 2.4, 40, 0.7);
orb(R + VOLTA, V(-0.5, 0.95, 1.0), 24, 10, 5.2, 40, 0);
orb(A.amarra - 0.1, V(-0.15, 1.0, ZV), 48, 8, 5.0, 40, 0.9);
orb(A.corda + 0.1, V(0.05, 1.5, ZV), 42, 6, 3.9, 40, 0.8);
orb(A.sol - 0.1, V(0.05, 1.3, ZV), 14, 6, 3.9, 40, 0.8);
orb(A.varal - 0.2, V(-0.35, 1.05, ZV + 0.1), -10, 12, 6.4, 42, 1.0, 0.03, { spin: -0.05 });
fecharCameras({ duracao: DURATION });

/* ------------------------------------------------------------------ letreiros e piscadas */
chip('SUJOU', A.suja + 0.05, A.seca - 0.05, () => V(0, 0.05, 0.95), '#8a5a3c', { dy: -120, size: 64 });
chip('NÃO SECA', A.seca + 0.05, R, () => V(0.2, 0.05, 0.95), '#2f8cff', { dy: -230, size: 64 });
emote('suor', A.suja, R + 0.05, ze);
rebobinar(R, VOLTA); som('rewind', R, -8);
label('VARAL', A.varal, A.varal + 1.75, () => V(-0.3, HV, ZV), { dy: -190, size: 84 });
piscar(gVaral, A.varal); zoomSoco(A.varal + 0.02, 0.1);
emote('ideia', A.varal - 0.1, A.varal + 1.3, ze);
configurarLegendas({ nomes: ['varal'] });

/* ------------------------------------------------------------------ sons */
som('matflap', A.estende + 0.1, -12); som('matflap', A.grama - 0.05, -14); som('drip', A.seca - 0.2, -14, { dur: Math.max(0.8, R - A.seca + 0.2), fadeOut: 0.2 });
som('aah', A.seca + 0.15, -9);
som('pop', A.amarra - 0.05, -14); som('pop', A.amarra + 0.12, -15); som('cableup', A.corda, -12);
som('whoosh_suave', A.sol - 0.2, -14); [0, 1, 2].forEach((k) => som('click', A.sol + 0.1 + k * 0.12, -14)); som('sparkle', A.sol + 0.5, -16);
som('ding', A.varal + 0.05, -14);
ambiente('birds', 0, DURATION, -26, { fade: 0.5 }); ambiente('windloop', A.sol, DURATION, -30, { fade: 0.6 });

/* ------------------------------------------------------------------ animação */
function update(t) {
  efeitosCamera(t);
  const tt = hist(t), tentativa = t < R + VOLTA;
  // varal só existe depois do ◀◀: postes sobem do chão, a corda estica de um poste até o outro
  postes.forEach((p, k) => { const s = tentativa ? 0 : pop(t, A.amarra - 0.1 + k * 0.15, Infinity, 0.35); p.visible = s > 0.001; p.scale.set(1, Math.max(0.001, s), 1); });
  const est = tentativa ? 0 : prog(t, A.corda - 0.05, Math.max(0.4, A.esticada - A.corda + 0.3), ease.out);
  cordaP.visible = est > 0.001; cordaP.scale.set(Math.max(0.001, est), 1, 1);
  roupas.forEach((g, i) => {
    const u = g.userData, wet = tentativa ? 1 : 1 - prog(t, A.sol + 0.5, 1.8);
    u.m.color.copy(u.c0).multiplyScalar(lerp(1, 0.62, wet));
    u.sujeira.forEach((s, k) => (s.visible = tentativa && tt > A.suja - 0.1 + k * 0.06));
    if (tentativa) {   // jogada na grama, deitada
      const cai = prog(tt, A.estende + i * 0.15, 0.45, ease.out);
      g.visible = tt > A.estende - 0.1;
      g.position.set(lerp(-1.4, u.x, cai), lerp(1.0, 0.03, cai) + Math.sin(cai * Math.PI) * 0.25, lerp(1.2, 0.95 + i * 0.03, cai));
      g.rotation.set(lerp(0, -Math.PI / 2, cai), 0, (i - 1) * 0.3 * cai); u.prendedor.visible = false;
      g.position.y += 0.0;
    } else {           // sobe pra corda e balança no vento
      const sobe = prog(t, A.sol + i * 0.12, 0.4, ease.out);
      g.visible = t > A.sol - 0.05; u.prendedor.visible = sobe > 0.9;
      g.position.set(lerp(-1.3, u.x, sobe), lerp(0.9, HV - 0.02, sobe), ZV);
      g.rotation.set(Math.sin(t * 2.6 + i * 1.3) * 0.18 * sobe, Math.sin(t * 1.7 + i) * 0.08, 0);
    }
  });
  // gotas: pingam da roupa no chão (na tentativa) e da roupa no varal até secar
  GOT.forEach((s, k) => { const g = roupas[k % 3], f = (t * 1.3 + hash(k)) % 1, on = tentativa ? tt > A.seca - 0.3 : (t > A.sol + 0.3 && t < A.sol + 1.6);
    s.visible = on && g.visible; if (!s.visible) return;
    if (tentativa) s.position.set(g.position.x + (hash(k * 3) - 0.5) * 0.35, 0.03 + Math.abs(Math.sin(f * Math.PI)) * 0.06, g.position.z + (hash(k * 7) - 0.5) * 0.3);
    else s.position.set(g.position.x + (hash(k * 3) - 0.5) * 0.3, HV - 0.5 - f * (HV - 0.5), ZV); });
  // boneco
  let humor = 0.5, pose = null, pk = 0;
  if (tentativa && tt > A.estende - 0.15 && tt < A.grama + 0.3) { pose = 'segura'; pk = win(tt, A.estende - 0.15, A.grama + 0.3, 0.15, 0.2); }
  if (tentativa && tt > A.suja) { humor = -0.8; pose = 'susto'; pk = win(tt, A.suja, R, 0.2, 0.15); }
  if (!tentativa && t > A.entao && t < A.postes + 0.5) { pose = 'aponta'; pk = win(t, A.entao, A.postes + 0.5, 0.2, 0.25); humor = 0.7; }
  if (!tentativa && t > A.varal + 0.3) { pose = 'comemora'; pk = prog(t, A.varal + 0.3, 0.3); humor = 1; }
  E.animar(ze, tt, { humor, pose, poseK: pk, suor: tentativa && tt > A.suja ? 0.7 : 0 });
  if (mundo.clouds) mundo.clouds.forEach?.((c, i) => (c.position.x += 0));
  aplicarPiscadas(t);
}
iniciar({ duracao: DURATION, ancoras: A, update, desenhar: (t) => desenharEfeitos(t) });
