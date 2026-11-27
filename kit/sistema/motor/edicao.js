/* =====================================================================================
   MOTOR DO KIT — edicao.js
   Efeitos de EDIÇÃO que valem pra qualquer estilo. Cada estilo diz, no GUIA.md dele, quais usar
   e como (o "modelo de edição" do estilo). Tudo é função do tempo, igual ao resto da cena.

   import { piscar, zoomSoco, tremor, emote, rebobinar, transicao, linhas, circulo, conquista, manchete,
            efeitosCamera, aplicarPiscadas, desenharEfeitos, alcancar } from '../../../sistema/motor/edicao.js';

   No update(t) da cena:     efeitosCamera(t); aplicarPiscadas(t); ...
   No iniciar({...}):        desenhar: (t) => desenharEfeitos(t)
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, hash } from './lib.js';
import { W, H, g2, camera, project, V, ESTILO, fonte, TL, words, norm, ceu, scene } from './video.js';
const G_SCENE = () => scene;

const ED = () => ESTILO.edicao || {};
const corCSS = (c) => (typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0') : c);

/* ------------------------------------------------------------------ "Esse é o X": a peça pisca 2× em amarelo
   piscar(objeto, A.helice)   → nos próximos 1,0 s a peça (e tudo dentro dela) acende 2 vezes.
   Chame aplicarPiscadas(t) no update. Funciona em qualquer material (3D, desenho, quadradinhos, 2D).        */
const PISC = [];
function prepMat(obj) {
  const out = [];
  obj.traverse((m) => {
    if (!(m.isMesh || m.isSprite) || !m.material || m.userData.semPiscar) return;
    if (!m.userData.__pm) {
      const arr = Array.isArray(m.material) ? m.material : [m.material];
      const cl = arr.map((x) => x.clone());
      m.material = Array.isArray(m.material) ? cl : cl[0];
      m.userData.__pm = cl.map((x) => ({ m: x, c: x.color ? x.color.clone() : null, e: x.emissive ? x.emissive.clone() : null }));
    }
    out.push(...m.userData.__pm);
  });
  return out;
}
/** IMPORTANTE: piscar() dá à peça CÓPIAS próprias dos materiais (pra não acender outras peças que usavam o mesmo material).
 *  Depois de chamar piscar(), pra mudar a cor/brilho da peça use mesh.material (a cópia), não a variável do material antigo.
 *  Fora da piscada, as mudanças que a cena fizer na cor/brilho valem normalmente. */
export function piscar(obj, t0, o = {}) {
  if (!obj) throw new Error('piscar(): objeto inexistente');
  PISC.push({ mats: prepMat(obj), t0, dur: o.dur ?? 1.0, cor: new THREE.Color(o.cor ?? ED().piscar ?? '#ffd21f'), forca: o.forca ?? ED().piscarForca ?? 0.72 });
}
/** 0..1, duas "lombadas" dentro de dur (o piscar 2×) */
export function valorPiscada(t, t0, dur = 1) { const k = (t - t0) / dur; if (k <= 0 || k >= 1) return 0; const s = Math.sin(Math.PI * ((k * 2) % 1)); return s * s; }
const _pv = new Map();
export function aplicarPiscadas(t) {
  _pv.clear();
  for (const P of PISC) for (const r of P.mats) if (!_pv.has(r)) _pv.set(r, [0, P.cor]);
  for (const P of PISC) { const v = valorPiscada(t, P.t0, P.dur) * P.forca; if (v <= 0) continue; for (const r of P.mats) if (v > _pv.get(r)[0]) _pv.set(r, [v, P.cor]); }
  for (const [r, [v, cor]] of _pv) {
    if (v > 0) {
      if (!r.ativo) { r.ativo = true; if (r.c) r.c.copy(r.m.color); if (r.e) r.e.copy(r.m.emissive); }   // cor de agora = base desta piscada
      if (r.c) r.m.color.copy(r.c).lerp(cor, v);
      if (r.e) r.m.emissive.copy(r.e).lerp(cor, v * 0.8);
    } else if (r.ativo) { r.ativo = false; if (r.c) r.m.color.copy(r.c); if (r.e) r.m.emissive.copy(r.e); }   // acabou: devolve
  }
}

/* ------------------------------------------------------------------ câmera: soco de zoom e tremor
   zoomSoco(t, 0.15)   → a câmera "soca" pra perto por ~0,45 s (ênfase, susto, piada)
   tremor(t, 0.5, 0.03) → a imagem treme (impacto, queda, explosão)
   Chame efeitosCamera(t) no COMEÇO do update(t).                                                       */
const CAM = [];
export function zoomSoco(t0, forca = 0.15, dur = 0.45) { CAM.push({ tipo: 'zoom', t0, forca, dur }); }
export function tremor(t0, dur = 0.45, forca = 0.03) { CAM.push({ tipo: 'tremor', t0, dur, forca }); }
export function efeitosCamera(t) {
  let f = 1, rx = 0, ry = 0;
  for (const c of CAM) {
    const k = (t - c.t0) / c.dur; if (k < 0 || k > 1) continue;
    if (c.tipo === 'zoom') { const env = k < 0.18 ? ease.out(k / 0.18) : 1 - ease.inOut((k - 0.18) / 0.82); f *= 1 - c.forca * env; }
    else { const a = c.forca * (1 - k) * (camera.fov / 40); rx += a * Math.sin(t * 61.3) * 0.6; ry += a * Math.sin(t * 47.9 + 1.3) * 0.6; }
  }
  if (f !== 1) { camera.fov *= f; camera.updateProjectionMatrix(); }
  if (rx || ry) { camera.rotateX(rx); camera.rotateY(ry); camera.updateMatrixWorld(); }
}

/* ------------------------------------------------------------------ efeitos desenhados por cima (2D)       */
const FX = [];
const headPos = (quem, dy = 0.32) => { const h = quem.userData.headP; h.updateMatrixWorld(true); return h.localToWorld(V(0, dy, 0)); };

/** emote(tipo, t0, t1, boneco) — sinal de emoção em cima da cabeça:
 *  '!' (susto/ideia), '?' (dúvida), 'suor' (nervoso), 'raiva', 'estrelas' (deu certo), 'coracao', 'ideia' (lâmpada), 'zzz', 'nojo'.
 *  O desenho segue o estilo (ESTILO.edicao.emote: 'anime' | 'pixel' | 'flat' | 'padrao').
 *  Posição: { dx (pros lados, metros), dy (altura acima do centro da cabeça; padrão 0,42 = em cima da cabeça) }. */
export function emote(tipo, t0, t1, quem, o = {}) { FX.push({ k: 'emote', tipo, t0, t1, quem, dx: o.dx ?? 0.12, dy: o.dy ?? 0.42 }); }
/** linhas de velocidade em volta da tela (impacto, revelação) — típico do estilo Desenho */
export function linhas(t0, t1, o = {}) { FX.push({ k: 'linhas', t0, t1, cor: o.cor ?? '#ffffff', centro: o.centro || null }); }
/** círculo vermelho + seta apontando um objeto (estilo meme/Avatar) */
export function circulo(t0, t1, anchor, o = {}) { FX.push({ k: 'circulo', t0, t1, anchor, r: o.r ?? 130, cor: o.cor ?? '#ff2a2a', seta: o.seta ?? true }); }
/** aviso de "conquista" no topo da tela (estilo Quadradinhos): conquista('NOVIDADE: PRODUTO', t) */
export function conquista(texto, t0, o = {}) { FX.push({ k: 'conquista', texto, t0, t1: t0 + (o.dur ?? 2.2), sub: o.sub ?? ED().conquistaTitulo ?? 'PEÇA NOVA!', icone: o.icone ?? null }); }
/** manchete grande no topo (ex.: 'E SE...?' no estilo Simples) */
export function manchete(texto, t0, t1, o = {}) { FX.push({ k: 'manchete', texto, t0, t1, y: o.y ?? 330, size: o.size ?? 120 }); }
/** "voltar a fita" (◀◀) — por cima da tela durante dur segundos. Use junto com a tomada de câmera dur=0 e o som 'rewind'. */
export function rebobinar(t0, dur = 0.7) { FX.push({ k: 'rebobinar', t0, t1: t0 + dur }); }
/** transição na troca de cena: transicao(t, 'cortina' | 'pixel' | 'circulo' | 'flash' | 'risco', 0.6). O meio da transição (t + dur/2) é a hora do corte. */
export function transicao(t0, tipo = ED().transicao || 'cortina', dur = 0.6, o = {}) { FX.push({ k: 'transicao', tipo, t0, t1: t0 + dur, cor: o.cor ?? ED().corTransicao ?? '#1f2633', dir: o.dir ?? 1 }); }
/** onomatopeia / palavra de impacto desenhada na tela ("TUM!", "CRACK!") */
export function impacto(texto, t0, t1, anchor, o = {}) { FX.push({ k: 'impacto', texto, t0, t1, anchor, size: o.size ?? 110, cor: o.cor ?? ED().corImpacto ?? '#ffd21f', rot: o.rot ?? -0.12 }); }

function emoteDraw(F, t, x, y, s) {
  const st = ED().emote || 'padrao';
  g2.save(); g2.translate(x, y); g2.scale(s, s); g2.lineJoin = 'round'; g2.lineCap = 'round';
  const out = st === 'pixel' ? '#1b1b1b' : st === 'flat' ? 'rgba(0,0,0,0)' : '#111';
  const lw = st === 'flat' ? 0 : 9;
  const stroke = () => { if (lw) { g2.lineWidth = lw; g2.strokeStyle = out; g2.stroke(); } };
  const wob = Math.sin(t * 14) * 0.06;
  if (st === 'pixel') g2.imageSmoothingEnabled = false;
  switch (F.tipo) {
    case '!': case '?': {
      g2.rotate(wob); g2.font = `900 150px ${st === 'pixel' ? "'Pixelify Sans'" : 'Montserrat'}`; g2.textAlign = 'center'; g2.textBaseline = 'middle';
      if (lw) { g2.lineWidth = 18; g2.strokeStyle = out; g2.strokeText(F.tipo, 0, 0); }
      g2.fillStyle = F.tipo === '!' ? '#ff3b30' : '#2f8cff'; g2.fillText(F.tipo, 0, 0); break; }
    case 'suor': {
      const yy = ((t - F.t0) * 60) % 50;
      g2.beginPath(); g2.moveTo(0, -40 + yy); g2.bezierCurveTo(30, 0 + yy, 26, 30 + yy, 0, 30 + yy); g2.bezierCurveTo(-26, 30 + yy, -30, 0 + yy, 0, -40 + yy);
      g2.fillStyle = '#7cc8ff'; g2.fill(); stroke(); g2.fillStyle = 'rgba(255,255,255,0.8)'; g2.beginPath(); g2.ellipse(-8, 8 + yy, 6, 11, 0.3, 0, 7); g2.fill(); break; }
    case 'raiva': {
      g2.rotate(wob * 2); g2.fillStyle = '#ff3b30';
      for (let i = 0; i < 4; i++) { g2.save(); g2.rotate(i * Math.PI / 2 + Math.PI / 4); g2.beginPath(); g2.moveTo(10, 10); g2.quadraticCurveTo(40, 10, 46, 46); g2.quadraticCurveTo(10, 40, 10, 10); g2.fill(); if (lw) { g2.lineWidth = 6; g2.strokeStyle = out; g2.stroke(); } g2.restore(); }
      break; }
    case 'estrelas': case 'coracao': {
      for (let i = 0; i < 3; i++) {
        const a = t * 2 + i * 2.1, px = Math.cos(a) * 70, py = Math.sin(a * 1.3) * 26 - 10 * i, sc = 0.7 + 0.3 * Math.sin(t * 9 + i);
        g2.save(); g2.translate(px, py); g2.scale(sc, sc); g2.beginPath();
        if (F.tipo === 'estrelas') { for (let j = 0; j < 10; j++) { const r = j % 2 ? 14 : 34, b = j * Math.PI / 5 - Math.PI / 2; g2.lineTo(Math.cos(b) * r, Math.sin(b) * r); } g2.closePath(); g2.fillStyle = '#ffd21f'; }
        else { g2.moveTo(0, 18); g2.bezierCurveTo(-40, -10, -18, -38, 0, -18); g2.bezierCurveTo(18, -38, 40, -10, 0, 18); g2.fillStyle = '#ff4d6d'; }
        g2.fill(); if (lw) { g2.lineWidth = 6; g2.strokeStyle = out; g2.stroke(); } g2.restore();
      }
      break; }
    case 'ideia': {
      g2.rotate(wob); g2.beginPath(); g2.arc(0, -10, 42, 0.75 * Math.PI, 2.25 * Math.PI); g2.lineTo(20, 40); g2.lineTo(-20, 40); g2.closePath(); g2.fillStyle = '#fff36b'; g2.fill(); stroke();
      g2.fillStyle = '#9aa3ad'; g2.fillRect(-20, 42, 40, 22); if (lw) { g2.lineWidth = 6; g2.strokeStyle = out; g2.strokeRect(-20, 42, 40, 22); }
      g2.strokeStyle = '#ffd21f'; g2.lineWidth = 8; for (let i = 0; i < 5; i++) { const b = -Math.PI * (0.15 + 0.175 * i); g2.beginPath(); g2.moveTo(Math.cos(b) * 60, -10 + Math.sin(b) * 60); g2.lineTo(Math.cos(b) * 80, -10 + Math.sin(b) * 80); g2.stroke(); }
      break; }
    case 'zzz': { g2.font = '900 70px Montserrat'; g2.fillStyle = '#ffffff'; g2.textAlign = 'center'; for (let i = 0; i < 3; i++) { const yy = -((t * 30 + i * 40) % 120); g2.globalAlpha = 1 - (-yy / 120); if (lw) { g2.lineWidth = 10; g2.strokeStyle = out; g2.strokeText('z', i * 26, yy); } g2.fillText('z', i * 26, yy); } break; }
    case 'nojo': { g2.strokeStyle = '#7bc043'; g2.lineWidth = 10; for (let i = 0; i < 3; i++) { g2.beginPath(); const yy = -i * 26; g2.moveTo(-40, yy); g2.bezierCurveTo(-15, yy - 22, 15, yy + 22, 40, yy); g2.stroke(); } break; }
    default: break;
  }
  g2.restore();
}
function rebobinarDraw(t, F) {
  const k = (t - F.t0) / (F.t1 - F.t0), a = Math.sin(Math.PI * clamp(k)) * 0.9 + 0.1;
  const st = ED().rebobinar || 'vhs';
  g2.save();
  if (st === 'pixel') {
    g2.globalAlpha = 0.35 * a; g2.fillStyle = '#000'; for (let y = 0; y < H; y += 16) g2.fillRect(0, y, W, 8);
  } else if (st === 'risco') {
    g2.globalAlpha = 0.5 * a; g2.strokeStyle = '#ffffff'; g2.lineWidth = 6; for (let i = 0; i < 18; i++) { const y = hash(i + Math.floor(t * 30)) * H; g2.beginPath(); g2.moveTo(0, y); g2.lineTo(W, y + 20 * (hash(i * 3.1) - 0.5)); g2.stroke(); }
  } else {
    g2.globalAlpha = 0.18 * a; g2.fillStyle = '#4060ff'; g2.fillRect(0, 0, W, H);
    g2.globalAlpha = 0.22 * a; g2.fillStyle = '#000'; for (let y = 0; y < H; y += 6) g2.fillRect(0, y, W, 2);
    g2.globalAlpha = 0.5 * a; const by = (t * 2600) % H; g2.fillStyle = '#ffffff'; g2.fillRect(0, by, W, 10 + 30 * hash(Math.floor(t * 30)));
  }
  g2.globalAlpha = a; g2.translate(140, 190);
  const fnt = st === 'pixel' ? "'Pixelify Sans'" : 'Montserrat';
  g2.font = `900 64px ${fnt}`; g2.textBaseline = 'middle';
  g2.fillStyle = 'rgba(0,0,0,0.45)';
  for (const dx of [0, 46]) { g2.beginPath(); g2.moveTo(dx + 46 + 4, -36 + 5); g2.lineTo(dx + 4, 5); g2.lineTo(dx + 46 + 4, 36 + 5); g2.fill(); }
  g2.fillStyle = '#ffffff';
  for (const dx of [0, 46]) { g2.beginPath(); g2.moveTo(dx + 46, -36); g2.lineTo(dx, 0); g2.lineTo(dx + 46, 36); g2.fill(); }
  g2.restore();
}
function transicaoDraw(t, F) {
  const k = clamp((t - F.t0) / (F.t1 - F.t0)), cob = k < 0.5 ? ease.inOut(k * 2) : 1 - ease.inOut((k - 0.5) * 2);
  g2.save(); g2.fillStyle = F.cor;
  if (F.tipo === 'pixel') {
    const n = 12, cw = W / n, chh = cw;
    for (let j = 0; j * chh < H; j++) for (let i = 0; i < n; i++) if (hash(i * 17.3 + j * 3.1) < cob) g2.fillRect(i * cw, j * chh, cw + 1, chh + 1);
  } else if (F.tipo === 'circulo') {
    g2.beginPath(); g2.rect(0, 0, W, H); g2.arc(W / 2, H / 2, (1 - cob) * H * 0.62, 0, 7, true); g2.fill('evenodd');
  } else if (F.tipo === 'flash') {
    g2.globalAlpha = cob; g2.fillStyle = '#ffffff'; g2.fillRect(0, 0, W, H);
  } else if (F.tipo === 'risco') {
    g2.translate(W / 2, H / 2); g2.rotate(-0.35); const ww = W * 2.4, x = (k < 0.5 ? -1 + ease.inOut(k * 2) : ease.inOut((k - 0.5) * 2)) * ww;
    g2.fillRect(x - ww / 2, -H, ww, H * 2);
  } else {   // cortina: uma faixa varre a tela de lado
    const x = k < 0.5 ? (-1 + ease.inOut(k * 2)) * W : ease.inOut((k - 0.5) * 2) * W;
    g2.fillRect(F.dir > 0 ? x : -x, 0, W, H);
  }
  g2.restore();
}
export function desenharEfeitos(t) {
  for (const F of FX) {
    if (t < F.t0 || t > F.t1 + 0.3) continue;
    const s = clamp(Math.min((t - F.t0) / 0.18, (F.t1 + 0.25 - t) / 0.25));
    if (s <= 0) continue;
    if (F.k === 'emote') { const p = project(headPos(F.quem, F.dy).add(V(F.dx, 0, 0))); if (p[2] > 1) continue; emoteDraw(F, t, p[0], p[1], ease.back(s)); }
    else if (F.k === 'linhas') {
      g2.save(); g2.globalAlpha = 0.85 * s; g2.fillStyle = F.cor; const cx = F.centro ? F.centro[0] : W / 2, cy = F.centro ? F.centro[1] : H * 0.45;
      for (let i = 0; i < 70; i++) { const a = hash(i * 7.7 + Math.floor(t * 12)) * Math.PI * 2, r0 = 380 + 260 * hash(i * 3.3 + Math.floor(t * 12)), w = 0.006 + 0.01 * hash(i); g2.beginPath(); g2.moveTo(cx + Math.cos(a - w) * 2000, cy + Math.sin(a - w) * 2000); g2.lineTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g2.lineTo(cx + Math.cos(a + w) * 2000, cy + Math.sin(a + w) * 2000); g2.fill(); }
      g2.restore();
    } else if (F.k === 'circulo') {
      const p = project(F.anchor(t)); if (p[2] > 1) continue;
      g2.save(); g2.strokeStyle = F.cor; g2.lineWidth = 14; g2.lineCap = 'round';
      g2.beginPath(); g2.ellipse(p[0], p[1], F.r * 1.15, F.r, -0.15, 0, Math.PI * 2 * ease.out(clamp((t - F.t0) / 0.3))); g2.stroke();
      if (F.seta && t > F.t0 + 0.2) { const ax = p[0] + F.r * 2.1, ay = p[1] - F.r * 1.9, bx = p[0] + F.r * 1.05, by = p[1] - F.r * 0.95; g2.beginPath(); g2.moveTo(ax, ay); g2.lineTo(bx, by); g2.stroke(); g2.beginPath(); g2.moveTo(bx, by); g2.lineTo(bx + 60, by - 8); g2.moveTo(bx, by); g2.lineTo(bx + 8, by - 60); g2.stroke(); }
      g2.restore();
    } else if (F.k === 'conquista') {
      const k = ease.out(clamp((t - F.t0) / 0.3)) * (1 - ease.in(clamp((t - F.t1 + 0.3) / 0.3)));
      g2.save(); g2.translate(W / 2, 150 - (1 - k) * 260); g2.imageSmoothingEnabled = false;
      const pw = 760, ph = 150; g2.fillStyle = 'rgba(20,20,24,0.92)'; g2.fillRect(-pw / 2, -ph / 2, pw, ph);
      g2.strokeStyle = '#d9d9d9'; g2.lineWidth = 6; g2.strokeRect(-pw / 2 + 6, -ph / 2 + 6, pw - 12, ph - 12);
      g2.fillStyle = '#ffd21f'; g2.fillRect(-pw / 2 + 30, -45, 90, 90); g2.fillStyle = '#7a5a00'; g2.fillRect(-pw / 2 + 30, 25, 90, 20);
      const maxW = pw - 190; g2.textAlign = 'left'; g2.textBaseline = 'middle';
      let fs = 34; g2.font = fonte(null, fs, 'plaquinha'); while (g2.measureText(F.sub).width > maxW && fs > 16) g2.font = fonte(null, --fs, 'plaquinha');
      g2.fillStyle = '#ffd21f'; g2.fillText(F.sub, -pw / 2 + 150, -30);
      fs = 48; g2.font = fonte(null, fs, 'plaquinha'); while (g2.measureText(F.texto).width > maxW && fs > 18) g2.font = fonte(null, --fs, 'plaquinha');
      g2.fillStyle = '#ffffff'; g2.fillText(F.texto, -pw / 2 + 150, 28);
      g2.restore();
    } else if (F.k === 'manchete') {
      g2.save(); g2.translate(W / 2, F.y); const sc = ease.back(s); g2.scale(sc, sc); g2.rotate(-0.04);
      g2.font = fonte(null, F.size, 'letreiro'); g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.lineJoin = 'round';
      const E = ESTILO.letreiro; g2.lineWidth = F.size * (E.espessura ?? 0.2); g2.strokeStyle = E.contorno || '#111'; g2.strokeText(F.texto, 0, 0);
      g2.fillStyle = E.cor; g2.fillText(F.texto, 0, 0); g2.restore();
    } else if (F.k === 'impacto') {
      const p = project(F.anchor(t)); if (p[2] > 1) continue;
      g2.save(); g2.translate(clamp(p[0], 220, W - 220), clamp(p[1], 260, H - 600)); g2.rotate(F.rot); const sc = ease.back(s) * (1 + 0.05 * Math.sin(t * 30)); g2.scale(sc, sc);
      g2.font = fonte(null, F.size, 'letreiro'); g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.lineJoin = 'round';
      g2.lineWidth = F.size * 0.22; g2.strokeStyle = '#111'; g2.strokeText(F.texto, 0, 0); g2.fillStyle = F.cor; g2.fillText(F.texto, 0, 0); g2.restore();
    } else if (F.k === 'rebobinar') rebobinarDraw(t, F);
    else if (F.k === 'transicao') transicaoDraw(t, F);
  }
}

/* ------------------------------------------------------------------ braço que alcança um ponto (qualquer estilo)
   alcancar(boneco, braco, pontoNoMundo, k)  — braco = boneco.userData.arms[0 | 1]
   Os estilos guardam o tamanho dos braços em arm.L1 / arm.L2. Nos estilos 2D (plano2d) o braço gira só no plano da tela. */
const _m4 = new THREE.Matrix4(), _q1 = new THREE.Quaternion();
export function alcancar(person, arm, alvo, k = 1, pole = null) {
  if (k <= 0.001) return;
  const L1 = arm.L1 ?? 0.27, L2 = arm.L2 ?? 0.26;
  const body = arm.sh.parent; person.updateMatrixWorld(true);
  const tL = body.worldToLocal(alvo.clone()), sL = arm.sh.position.clone();
  const d = tL.sub(sL);
  if (person.userData.plano2d) {   // 2D: dois ângulos no plano xy
    d.z = 0; const dist = clamp(d.length(), 0.05, L1 + L2 - 0.002);
    const base = Math.atan2(d.y, d.x) + Math.PI / 2;
    const a = Math.acos(clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
    const bend = Math.PI - Math.acos(clamp((L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2), -1, 1));
    const sgn = arm.dobra ?? 1;
    arm.sh.rotation.z = lerp(arm.sh.rotation.z, base + sgn * a, k); arm.el.rotation.z = lerp(arm.el.rotation.z, -sgn * bend, k);
    return;
  }
  const dist = clamp(d.length(), 0.06, L1 + L2 - 0.003); const dn = d.normalize();
  const a = Math.acos(clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
  const bend = Math.PI - Math.acos(clamp((L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2), -1, 1));
  const pv = (pole || V(arm.sx * 0.7, -1, -0.5)).clone();
  const w = pv.sub(dn.clone().multiplyScalar(pv.dot(dn))).normalize();
  const p = dn.clone().multiplyScalar(Math.cos(a)).add(w.multiplyScalar(Math.sin(a)));
  const elbow = p.clone().multiplyScalar(L1), tgt = dn.clone().multiplyScalar(dist);
  const f = tgt.sub(elbow).normalize();
  const Y = p.clone().negate(); const Z = f.clone().sub(p.clone().multiplyScalar(f.dot(p))); if (Z.lengthSq() < 1e-8) Z.set(0, 0, 1); Z.normalize();
  const X = new THREE.Vector3().crossVectors(Y, Z);
  _m4.makeBasis(X, Y, Z); _q1.setFromRotationMatrix(_m4);
  arm.sh.quaternion.slerp(_q1, k);
  arm.el.rotation.x = lerp(arm.el.rotation.x, -bend, k);
}
export { corCSS };

/* ------------------------------------------------------------------ tempo e estrutura do roteiro                         */
/** câmera lenta na animação: use tt = tempoLento(t, t0, t1, 0.3) no lugar de t nas coisas que devem ficar lentas */
export function tempoLento(t, t0, t1, fator = 0.35) {
  if (t <= t0) return t;
  if (t <= t1) return t0 + (t - t0) * fator;
  return t0 + (t1 - t0) * fator + (t - t1);
}
/**
 * Os "momentos" de cada linha do roteiro (menos o Parabéns e a chamada final), achados sozinhos na narração:
 *   { linha, ini, fim, problema: [t0, t1] | null, rebobina: t | null, entra: t | null, nome: t | null }
 * - linha 0 (gancho): tudo é "problema" e volta a fita no fim
 * - linha com "Mas…"/"Só que…": problema do começo até o "Então" (ou até o fim) e volta a fita antes do "Então"
 * - "Então você…": a peça nova ENTRA nessa hora · "Esse é o…/Essa é a…": hora do NOME (piscar + letreiro)
 */
export function estrutura() {
  const N = TL.lines.length, out = [];
  const iParabens = TL.lines.findIndex((l) => norm(l.text).startsWith('parabens'));
  const ultima = iParabens > 0 ? iParabens : N - 2;
  for (let i = 0; i < ultima; i++) {
    const ln = TL.lines[i], ws = words.filter((w) => w.line === i);
    const kMeio = ws.findIndex((w, k) => w.n === 'entao' && k > 0);
    const tEntao = kMeio > 0 ? ws[kMeio].s : (ws[0] && ws[0].n === 'entao' ? ws[0].s : null);
    const nomes = [];
    for (let k = 0; k + 1 < ws.length; k++) if (['esse', 'essa', 'esses', 'essas', 'este', 'esta'].includes(ws[k].n) && ['e', 'sao'].includes(ws[k + 1].n)) nomes.push(ws[k].s);
    const comecaProblema = i === 0 || (ws[0] && ['mas', 'so', 'porem', 'porque'].includes(ws[0].n));
    const b = { linha: i, ini: ln.s, fim: ln.e, problema: null, rebobina: null, entra: null, nome: nomes[0] ?? null, nomes };
    if (comecaProblema) {
      const temEntao = kMeio > 0 && tEntao > ln.s + 0.8;
      const fimP = temEntao ? tEntao : ln.e;
      b.problema = [ln.s, fimP];
      b.rebobina = temEntao ? Math.max(ws[kMeio - 1].e - 0.05, tEntao - 0.45) : ln.e - 0.2;   // na pausa antes do "Então"
    }
    if (nomes.length) b.entra = tEntao !== null && tEntao < nomes[0] ? tEntao : Math.max(ln.s, nomes[0] - 2.0);
    out.push(b);
  }
  return out;
}
/** um passo por "Esse é…" (linha com dois nomes vira dois passos): [{ linha, entra, nome }] */
export function passos(B = estrutura()) {
  return B.flatMap((b) => b.nomes.map((tn, j) => ({ linha: b.linha, entra: j === 0 ? b.entra : Math.max(b.nomes[j - 1] + 0.5, tn - 1.6), nome: tn })));
}
/** tempo da HISTÓRIA: igual a t, menos durante a volta da fita, quando anda pra trás até o começo do problema.
 *  Use tt = tempoHistoria(t, B) nas animações (objetos, boneco): no ◀◀ tudo desfaz de verdade. A câmera e as piscadas usam t. */
export function tempoHistoria(t, B, dur = 0.7) {
  for (const b of B) {
    if (b.rebobina === null || !b.problema) continue;
    if (t >= b.rebobina && t < b.rebobina + dur) return b.rebobina - ((t - b.rebobina) / dur) * (b.rebobina - b.problema[0]);
  }
  return t;
}

/* ------------------------------------------------------------------ clima, noite, brilho e feixe de luz (3D e 2D) */
/** chuva: riscos caindo numa caixa [x0, x1, y0, y1, z0, z1]. const ch = chuva({...}); scene.add(ch); no update: ch.userData.atualizar(t, forca0a1) */
export function chuva(o = {}) {
  const n = o.qtd ?? 600, [x0, x1, y0, y1, z0, z1] = o.area ?? [-4, 4, 0, 5, -3, 3], L = o.tamanho ?? 0.22, v = o.velocidade ?? 7, vento = o.vento ?? 0.12;
  const pos = new Float32Array(n * 6), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: new THREE.Color(o.cor ?? '#cfe3ff'), transparent: true, opacity: o.opacidade ?? 0.55, depthWrite: false }));
  m.frustumCulled = false; m.userData.semPiscar = true;
  m.userData.atualizar = (t, forca = 1) => {
    const ativos = Math.floor(n * clamp(forca));
    for (let i = 0; i < n; i++) {
      const f = (hash(i * 1.37) + t * v / (y1 - y0) * (0.8 + 0.4 * hash(i * 3.1))) % 1, x = x0 + (x1 - x0) * hash(i * 7.3), z = z0 + (z1 - z0) * hash(i * 5.9), y = y1 - f * (y1 - y0);
      const k = i * 6, on = i < ativos ? 1 : 0;
      pos[k] = x + vento * f; pos[k + 1] = y * on + (1 - on) * -99; pos[k + 2] = z; pos[k + 3] = x + vento * f - vento * 0.3; pos[k + 4] = (y + L) * on + (1 - on) * -99; pos[k + 5] = z;
    }
    geo.attributes.position.needsUpdate = true;
  };
  return m;
}
const _texBrilho = {};
function texBrilho(tipo) {
  if (_texBrilho[tipo]) return _texBrilho[tipo];
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  if (tipo === 'feixe') { const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }
  else { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (_texBrilho[tipo] = t);
}
/** brilho redondo (lâmpada acesa, LED, faísca): const b = brilho('#fff3b0', 0.6); b.position…; b.material.opacity = 0..1 */
export function brilho(cor = '#fff3b0', tamanho = 0.5) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho('bola'), color: new THREE.Color(cor), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(tamanho); s.userData.semPiscar = true; return s;
}
/** feixe de luz (lanterna, farol, holofote): cone que sai do ponto (0,0,0) pra +z. f.material.opacity = força */
export function feixe(comprimento = 3, abertura = 0.6, cor = '#fff6d0') {
  const g = new THREE.ConeGeometry(abertura, comprimento, 32, 1, true); g.translate(0, -comprimento / 2, 0); g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: texBrilho('feixe'), color: new THREE.Color(cor), transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  m.userData.semPiscar = true; m.userData.semContorno = true; return m;
}
/** noite (0 = dia como o estilo, 1 = noite): escurece as luzes que o E.preparar() devolveu, muda o céu e a neblina.
 *  const L = E.preparar(); ... no update: noite(k, L)   (no 2D, passe só k: muda o céu) */
export function noite(k, L = null, o = {}) {
  k = clamp(k);
  const dia = ED().ceuDia || (ESTILO.ceu && ESTILO.ceu.cores) || ['#5aa2e8', '#8cc4f2', '#cfe9fb'], esc = o.ceu || ['#070b1c', '#14204a', '#2a3561'];
  const mix = (a, b) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
  if (k !== (noite._k ?? -1)) { ceu(mix(dia[0], esc[0]), mix(dia[dia.length - 1], esc[2]), mix(dia[1] || dia[0], esc[1])); noite._k = k; }
  if (L) {
    for (const nome of ['hemi', 'sol', 'contra']) { const l = L[nome]; if (!l) continue; if (l.userData.i0 === undefined) l.userData.i0 = l.intensity; l.intensity = l.userData.i0 * lerp(1, nome === 'hemi' ? 0.25 : 0.08, k); }
  }
  const f = G_SCENE().fog; if (f) { if (!f.c0) f.c0 = f.color.clone(); f.color.copy(f.c0).lerp(new THREE.Color(esc[1]), k); }
}
/** câmera lenta em várias janelas ao mesmo tempo: tempoLentoVarios(t, [[t0, t1], [t2, t3]], 0.35) */
export function tempoLentoVarios(t, janelas, fator = 0.35) {
  let x = t; for (const [a, b] of janelas) if (t > a) x -= (1 - fator) * (Math.min(t, b) - a); return x;
}
