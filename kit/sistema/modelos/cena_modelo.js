/* =====================================================================================
   CENA DO VÍDEO: __TEMA__
   Ponto de partida que já funciona (casa em corte, boneco, câmera se mexendo, legenda,
   chamada final). O Claude troca este conteúdo pela história do vídeo, seguindo o gabarito
   (Exemplo - Lampada/cena/cena.js) e as instruções em sistema/instrucoes/.
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, prog, win, pop, hash, mat, basic, mesh, box, rbox, cyl, sph, at, group } from '../../../sistema/motor/lib.js';
import * as B from '../../../sistema/motor/modelos_base.js';
import { W, H, T, words, TL, scene, camera, sky, ceu, luzes, V, LOOK, FT, FIM_NARRACAO, orb, fecharCameras, label, chip, banner, wpos, project, g2,
  configurarLegendas, fala, armIK, lerpAng, som, ambiente, iniciar } from '../../../sistema/motor/video.js';

/* ------------------------------------------------------------------ âncoras: o momento de cada fala
   T('trecho da narração') = segundo em que esse trecho começa (acentos/pontuação não importam).
   Use um trecho que aparece UMA vez no roteiro (ou T('trecho', 2) pra 2ª vez).                         */
const L = (i) => TL.lines[(i + TL.lines.length) % TL.lines.length].s;   // início da linha i do roteiro (-1 = última)
const A = {
  inicio: 0,
  parabens: T('parabens'),
  comente: L(-1),
  end: FIM_NARRACAO,
};
const DURATION = A.end + 0.3;   // corta logo depois da chamada final (o vídeo fica em loop limpo)

/* ------------------------------------------------------------------ fundo e luzes (vêm do estilo escolhido; o padrão é dia claro)
   ceu() sem nada = céu do estilo. Cena de noite/outro clima: ceu('#0b1424', '#1a2740') (estilos com céu "sempre" passam por cima).
   luzes() = céu + sol com sombra + contraluz do estilo. Pra mudar algo só aqui: luzes({ sol: ['#ffffff', 1.4, [-4, 9, 6]] }).   */
ceu();
const { hemi, sol: sunL, contra: fill } = luzes();

/* ------------------------------------------------------------------ mundo: quintal + casa em corte */
const world = B.buildWorld(); scene.add(world.group);
const R = { x0: -3.0, x1: 2.0, z0: -2.2, z1: 1.8, h: 2.8, t: 0.18 };
const room = B.buildRoom(R); scene.add(room.group);
const mesa = group(at(box(1.2, 0.06, 0.7, 0x9b6a43), 0, 0.75, 0), ...[[-0.55, -0.3], [0.55, -0.3], [-0.55, 0.3], [0.55, 0.3]].map(([x, z]) => at(box(0.06, 0.75, 0.06, 0x7b5134), x, 0.375, z)));
mesa.position.set(0.2, 0, -0.6); scene.add(mesa);
const MESA = V(0.2, 0.78, -0.6);                    // tampo da mesa (onde o objeto do vídeo é montado)

/* ------------------------------------------------------------------ o boneco (visual vem do estilo escolhido) */
const person = B.buildPerson({ standing: true, look: LOOK });
person.position.set(-0.9, 0.04, -0.7); person.rotation.y = 0.6; scene.add(person);
const HEAD = () => person.userData.headP.localToWorld(V(0, 0.05, 0));

/* ------------------------------------------------------------------ câmera: uma tomada por momento, sempre se mexendo, sem corte seco
   orb(segundo, alvo, giro°, altura°, distância, fov, duraçãoDaPassagem)                               */
orb(0, V(-0.5, 1.3, -0.3), 16, 12, 8.5, 40, 0);                 // abertura: a casa em corte, de fora
orb(L(1) - 0.3, V(-0.4, 0.9, -0.65), 12, 8, 4.3, 40, 1.0);      // mais perto: boneco inteiro e a mesa
orb(A.parabens - 0.3, V(-0.3, 1.0, -0.6), 8, 6, 4.2, 46, 1.0, 0.03, { spin: -0.07, bob: 0.5 });   // final: giro lento em volta
fecharCameras({ duracao: DURATION, aberturaAte: L(1), finalDesde: A.parabens - 1 });

/* ------------------------------------------------------------------ letreiros e legenda */
label('NOME DO OBJETO', A.parabens + 0.5, A.comente - 0.15, () => MESA.clone().add(V(0, 0.4, 0)), { dy: 0, size: 70 });
const palavraCTA = (TL.lines[TL.lines.length - 1].text.match(/[“"]([^”"]+)[”"]/) || [, 'SIM'])[1].toUpperCase();
banner(`COMENTE “${palavraCTA}”`, A.comente + 0.05, DURATION + 1, { screen: [W / 2, 330], size: 92, rot: -0.06, semPop: true });
configurarLegendas({ destaque: ['parabens'], nomes: [], linhas: {} });

/* ------------------------------------------------------------------ animação: tudo em função do tempo t */
function update(t) {
  const celebra = prog(t, A.parabens - 0.05, 0.35);
  B.updatePerson(person, t, { mood: lerp(0.3, 1, celebra), sweat: 0, fan: 0, shiver: 0, remote: 0 });
  const U = person.userData;
  if (celebra > 0.01) {   // comemora: braços pra cima em V e pulinhos
    for (const a of U.arms) { a.sh.rotation.set(lerp(a.sh.rotation.x, -0.2, celebra), 0, lerp(a.sh.rotation.z, a.sx * (2.55 + 0.18 * Math.sin(t * 13 + a.sx)), celebra)); a.el.rotation.x = lerp(a.el.rotation.x, -0.35, celebra); }
    person.position.y = 0.04 + Math.abs(Math.sin(t * 9)) * 0.05 * celebra;
  }
  world.clouds.position.x = t * 0.04;
}

/* ------------------------------------------------------------------ efeitos sonoros (nomes = arquivos de biblioteca/efeitos) */
som('whoosh', L(1) - 0.3, -20);
som('tada', A.parabens - 0.06, -4);
som('pop2', A.comente, -14);
ambiente('birds', 0, DURATION, -30, { pan: -0.3, fade: 0.5 });

/* ------------------------------------------------------------------ liga tudo */
iniciar({ duracao: DURATION, ancoras: A, update });
