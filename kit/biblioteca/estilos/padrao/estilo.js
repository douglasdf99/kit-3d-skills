/* =====================================================================================
   ESTILO "PADRÃO" — o visual da série original (Desmontando o Mundo): 3D low-poly colorido, casa em corte,
   quintal com grama, boneco de cápsula. Mesmas funções dos outros estilos (boneco, animar, peças, cenários),
   por cima do motor antigo (sistema/motor/modelos_base.js).

   import * as E from '../../../biblioteca/estilos/padrao/estilo.js';
   E.preparar();
   const ze = E.boneco();             // boneco modelo (camisa branca, calça azul-escura, cabelo preto). Altura ≈ 1,6 m
   E.animar(ze, t, { humor, fala, andar, pose, poseK });
   Peças: E.caixa(w,h,d,cor,{r}) · E.cilindro(r,h,cor) · E.esfera(r,cor) · E.capsula(r,h,cor) · E.material(cor)
   Cenários: E.mundo() (quintal + céu + nuvens) · E.sala(R) (casa em corte) · E.B (todos os modelos prontos: ventilador, balde, termômetro…)
   ===================================================================================== */
import * as THREE from 'three';
import { mat, mesh, box, rbox, cyl, sph, cap, lerp, clamp } from '../../../sistema/motor/lib.js';
import * as MB from '../../../sistema/motor/modelos_base.js';
import { ceu, luzes, lookDe, ESTILO, V } from '../../../sistema/motor/video.js';

export const B = MB;
export const TIPO = '3d';
export const NOME = 'Padrão';
export const COR = { camisa: '#f6f4ef', calca: '#1f3462', cabelo: '#16161a', pele: '#f0b98a', sapato: '#2b2f36' };
export const material = (cor, o = {}) => mat(new THREE.Color(cor).getHex(), o);
const hex = (c) => new THREE.Color(c).getHex();
export const caixa = (w, h, d, cor, o = {}) => (o.r ? rbox(w, h, d, o.r, hex(cor)) : box(w, h, d, hex(cor)));
export const cilindro = (r, h, cor, o = {}) => cyl(o.rTopo ?? r, r, h, hex(cor), o.seg ?? 20);
export const esfera = (r, cor, o = {}) => sph(r, hex(cor), o.detalhe ?? 2);
export const capsula = (r, h, cor) => cap(r, h, hex(cor));
export const em = (o, x, y, z = 0) => { o.position.set(x, y, z); return o; };
export function grupo(...f) { const g = new THREE.Group(); f.forEach((x) => x && g.add(x)); return g; }

export function preparar() { ceu(); return luzes(); }
/** quintal com grama, terra na frente, cerca, árvores e nuvens (devolve { group, clouds, ... }) */
export function mundo() { return MB.buildWorld(); }
/** casa em corte: R = { x0, x1, z0, z1, h, t } (devolve { group, ... }) */
export function sala(R = {}) { return MB.buildRoom(Object.assign({ x0: -3.0, x1: 2.0, z0: -2.2, z1: 1.8, h: 2.8, t: 0.18 }, R)); }

/* ------------------------------------------------------------------ boneco modelo
   look (mesmas chaves dos outros estilos): { camisa, calca, cabelo, pele, sapato, oculos, bone, capacete }      */
export function boneco(look = {}) {
  const b = Object.assign({}, ESTILO.boneco || {});
  if (look.camisa) b.camiseta = look.camisa; if (look.calca) { b.bermuda = look.calca; b.calca = true; } if (look.cabelo) b.cabelo = look.cabelo;
  if (look.pele) b.pele = look.pele; if (look.sapato) b.tenis = look.sapato; if (look.oculos) b.oculos = look.oculos;
  if (look.bone) { b.chapeu = 'bone'; b.cor_chapeu = look.bone; } if (look.capacete) { b.chapeu = 'capacete'; b.cor_chapeu = look.capacete; }
  return MB.buildPerson({ standing: true, look: lookDe(b) });
}
export function animar(p, t, st = {}) {
  const u = p.userData, humor = st.humor ?? 0.3, andar = st.andar ?? 0;
  MB.updatePerson(p, t, { mood: st.boca === 'triste' ? -0.8 : st.boca === 'sorriso' ? 1 : humor, sweat: st.suor ?? 0 });
  if ((st.fala ?? 0) > 0.05 && Math.sin(t * 20) > 0) u.mouthP.scale.set(1, 1.6, 1);
  const ph = t * (st.passo ?? 7);
  u.legs.forEach((L, i) => { L.hip.rotation.x = Math.sin(ph + i * Math.PI) * 0.55 * andar; });
  if (andar > 0) u.arms.forEach((A, i) => { A.sh.rotation.x = -Math.sin(ph + i * Math.PI) * 0.5 * andar; });
  u.body.position.y += Math.abs(Math.sin(ph)) * 0.025 * andar;
  u.headP.rotation.y = (st.olhar ?? 0) * 0.5;
  pose(p, t, st.pose, st.poseK ?? 1);
}
export function pose(p, t, nome, k = 1) {
  if (!nome || k <= 0.001) return;
  const u = p.userData, [Lf, Rt] = u.arms;
  const set = (A, x, z, el) => { A.sh.rotation.x = lerp(A.sh.rotation.x, x, k); A.sh.rotation.z = lerp(A.sh.rotation.z, A.sx * z, k); A.el.rotation.x = lerp(A.el.rotation.x, el, k); };
  if (nome === 'comemora') { set(Lf, -0.2, 2.55 + 0.15 * Math.sin(t * 13), -0.35); set(Rt, -0.2, 2.55 + 0.15 * Math.sin(t * 13 + 1), -0.35); u.body.position.y += Math.abs(Math.sin(t * 9)) * 0.07 * k; }
  else if (nome === 'aponta') set(Rt, -1.45, 0.25, -0.05);
  else if (nome === 'segura') { set(Rt, -1.1, 0.1, -0.6); set(Lf, -1.1, 0.1, -0.6); }
  else if (nome === 'pensa') { set(Rt, -0.8, 0.3, -2.1); u.headP.rotation.z = lerp(u.headP.rotation.z, 0.12, k); }
  else if (nome === 'susto') { set(Lf, -0.5, 2.2, -1.0); set(Rt, -0.5, 2.2, -1.0); u.mouthP.scale.set(1, lerp(u.mouthP.scale.y, 1.8, k), 1); }
  else if (nome === 'tchau') set(Rt, 0, 2.45, -0.35 - 0.5 * (0.5 + 0.5 * Math.sin(t * 10)));
}
