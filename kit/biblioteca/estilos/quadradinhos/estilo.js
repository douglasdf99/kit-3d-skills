/* =====================================================================================
   ESTILO "QUADRADINHOS" — tudo é feito de quadradinhos (voxels), como um jogo de blocos.
   O boneco, as árvores, o chão e os objetos são montados bloco a bloco. Luz quente de fim de tarde.

   import * as E from '../../../biblioteca/estilos/quadradinhos/estilo.js';
   E.preparar();                               // luz quente, neblina, céu de pôr do sol
   const ze = E.boneco();                      // boneco modelo de quadradinhos (camisa branca, calça azul-escura, cabelo preto)
   E.animar(ze, t, { humor, fala, andar, pose, poseK });
   Peças: E.bloco(w, h, d, cor) (caixa com textura de pixel) · E.cubos(lista, tamanho) (quadradinhos um a um: [[x,y,z,'#cor'], ...])
          E.esferaDeCubos(raio, cores, tamanho) · E.cilindroDeCubos(raio, altura, cor, tamanho)
   Cenários: E.terreno({...}) · E.arvore({...}) · E.agua(w, d) · E.cidade() · E.sala(R) · E.folhas(...) (folhinhas caindo)
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, hash } from '../../../sistema/motor/lib.js';
import { scene, camera, renderer, ceu, luzes, V } from '../../../sistema/motor/video.js';

export const TIPO = '3d';
export const NOME = 'Quadradinhos';
export const COR = {
  pele: '#e9b58c', camisa: '#f3f1ec', calca: '#213668', cabelo: '#141416', sapato: '#2a2a2e', sola: '#e6e6e6', olho: '#17171b', boca: '#7a2a2a', bochecha: '#f29a8e',
  grama: ['#6cb43c', '#5ea536', '#79c046', '#64ad3a'], terra: ['#8a5a36', '#7b4f2f', '#946340'], tronco: ['#6b4628', '#5c3b21'],
  outono: ['#e8762c', '#d9531e', '#f2a23a', '#c9421a', '#f6c04a'], verdes: ['#4f9a34', '#5fae3e', '#3f8a2c'],
  agua: '#3d8fd9', pedra: ['#8b8b8f', '#7a7a7f', '#9a9a9e'], tabua: ['#b4834d', '#a2733f', '#c08f58'], ceu: ['#f4a46a', '#f7c08e', '#fbe0c0'],
};

/* ------------------------------------------------------------------ quadradinhos */
const BOX = new THREE.BoxGeometry(1, 1, 1);
const MAT = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, flatShading: true });
const _m = new THREE.Matrix4(), _c = new THREE.Color(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
const variar = (hex, n, k = 0.06) => { _c.set(hex); const f = 1 + (hash(n) - 0.5) * 2 * k; return _c.setRGB(clamp(_c.r * f), clamp(_c.g * f), clamp(_c.b * f)); };
/** quadradinhos um a um: lista de [x, y, z, cor] em unidades de cubinho (inteiros); tam = tamanho de cada cubinho em metros */
const MAT_BRILHO = new THREE.MeshBasicMaterial({ color: 0xffffff });
/** o.brilho: true = quadradinhos que BRILHAM na própria cor (LED, lâmpada, tela, lava), sem sombra da luz */
export function cubos(lista, tam = 0.052, o = {}) {
  const m = new THREE.InstancedMesh(BOX, o.material || (o.brilho ? MAT_BRILHO : MAT), Math.max(1, lista.length));
  lista.forEach(([x, y, z, cor], i) => {
    _p.set((x + 0.5) * tam, (y + 0.5) * tam, (z + 0.5) * tam); _s.setScalar(tam * (o.encolher ?? 1)); _m.compose(_p, _q, _s); m.setMatrixAt(i, _m);
    m.setColorAt(i, o.semVariar ? _c.set(cor) : variar(cor, x * 13.1 + y * 7.7 + z * 3.3, o.variacao ?? 0.05));
  });
  m.count = lista.length; m.castShadow = o.sombra ?? true; m.receiveShadow = true;
  return m;
}
/** caixa sólida com textura de pixel (bom pra objetos grandes: paredes, mesas, máquinas) */
const TEXS = new Map();
function texPixel(cor, tipo = 'ruido') {
  const k = cor + tipo; if (TEXS.has(k)) return TEXS.get(k);
  const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d');
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    let f = 1 + (hash(i * 31.7 + j * 17.3 + cor.length) - 0.5) * 0.16;
    if (tipo === 'tabua' && j % 4 === 3) f *= 0.78;
    if (tipo === 'tabua' && j % 4 !== 3 && (i + (Math.floor(j / 4) % 2) * 8) % 16 === 0) f *= 0.82;
    if (tipo === 'tijolo') { const row = Math.floor(j / 4), off = row % 2 ? 4 : 0; if (j % 4 === 3 || (i + off) % 8 === 0) f = 0.72; }
    if (tipo === 'pedra' && hash(i * 3.1 + j * 9.7) > 0.86) f *= 0.8;
    _c.set(cor); x.fillStyle = `rgb(${(clamp(_c.r * f) * 255) | 0},${(clamp(_c.g * f) * 255) | 0},${(clamp(_c.b * f) * 255) | 0})`; x.fillRect(i, j, 1, 1);
  }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  TEXS.set(k, t); return t;
}
export function material(cor, o = {}) {
  const t = texPixel(cor, o.textura || 'ruido').clone(); t.needsUpdate = true; t.repeat.set(o.rx ?? 1, o.ry ?? 1);
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, metalness: 0, flatShading: true, transparent: (o.opacity ?? 1) < 1, opacity: o.opacity ?? 1 });
}
export function bloco(w, h, d, cor, o = {}) {
  const tam = o.pixel ?? 0.25;   // tamanho de cada "pixel" da textura (em metros, ≈ 16 pixels por bloco)
  const mats = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]].map(([a, b]) => material(cor, { textura: o.textura, rx: Math.max(1, a / (tam * 4)), ry: Math.max(1, b / (tam * 4)), opacity: o.opacity }));
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats); m.castShadow = o.sombra ?? true; m.receiveShadow = true;
  return m;
}
export const em = (o, x, y, z = 0) => { o.position.set(x, y, z); return o; };
export function grupo(...f) { const g = new THREE.Group(); f.forEach((x) => x && g.add(x)); return g; }
/** bola feita de quadradinhos (copa de árvore, nuvem, cabeça de máquina) */
export function esferaDeCubos(r, cores, tam = 0.25, o = {}) {
  const L = [], n = Math.ceil(r / tam);
  for (let x = -n; x < n; x++) for (let y = -n; y < n; y++) for (let z = -n; z < n; z++) {
    const d = Math.hypot((x + 0.5) * tam / (o.sx ?? 1), (y + 0.5) * tam / (o.sy ?? 1), (z + 0.5) * tam / (o.sz ?? 1));
    if (d > r || (o.oco && d < r - tam * 1.5)) continue;
    if (o.falhas && d > r - tam && hash(x * 7.1 + y * 3.3 + z * 1.7) < o.falhas) continue;
    L.push([x, y, z, cores[Math.floor(hash(x * 5.3 + y * 11.1 + z * 2.9) * cores.length)]]);
  }
  return cubos(L, tam, o);
}
export function cilindroDeCubos(r, h, cor, tam = 0.1, o = {}) {
  const L = [], n = Math.ceil(r / tam), m = Math.round(h / tam);
  for (let x = -n; x < n; x++) for (let z = -n; z < n; z++) if (Math.hypot((x + 0.5) * tam, (z + 0.5) * tam) <= r) for (let y = 0; y < m; y++) L.push([x, y, z, typeof cor === 'function' ? cor(x, y, z) : cor]);
  return cubos(L, tam, o);
}

/* ------------------------------------------------------------------ preparar a cena */
export function preparar(o = {}) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  ceu(...(o.ceu || COR.ceu));
  scene.fog = new THREE.Fog(new THREE.Color(o.neblina || '#f6c49a'), o.neblinaPerto ?? 14, o.neblinaLonge ?? 46);
  return luzes({ hemi: ['#ffe2c2', '#6b4a2e', 1.25], sol: ['#ffb877', 2.7, [-6, 6.5, 5]], contra: ['#a9c0ff', 0.45, [6, 4, -6]], ...(o.luz || {}) });
}

/* ------------------------------------------------------------------ o boneco modelo de quadradinhos
   look: { camisa, calca, cabelo, pele, sapato } (cores '#rrggbb'). Altura ≈ 1,72 m (33 quadradinhos de 5,2 cm). Pés em y = 0. Olha pra +z.   */
const VX = 0.052;
function parte(fn, x0, x1, y0, y1, z0, z1) { const L = []; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { const c = fn(x, y, z); if (c) L.push([x, y, z, c]); } return L; }
export function boneco(look = {}) {
  const C = Object.assign({}, COR, look);
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const sh = (hex, f) => { const c = new THREE.Color(hex); c.multiplyScalar(f); return '#' + c.getHexString(); };
  const legs = [], arms = [];
  // pernas: coxa (7) + canela (6, com tênis)
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -4 : 1, x1 = x0 + 2;
    const hip = new THREE.Group(); hip.position.set(0, 13 * VX, 0); body.add(hip);
    hip.add(cubos(parte((x, y, z) => (x === (sx < 0 ? x0 : x1) ? sh(C.calca, 0.85) : C.calca), x0, x1, -7, -1, -2, 1), VX));
    const knee = new THREE.Group(); knee.position.y = -7 * VX; hip.add(knee);
    knee.add(cubos(parte((x, y, z) => (y <= -6 ? (y === -6 ? C.sola : C.sapato) : y === -5 ? C.sapato : C.calca), x0, x1, -6, -1, -2, 2).filter(([x, y, z]) => z < 2 || y <= -5), VX));
    legs.push({ hip, knee, sx });
  }
  // tronco
  const torso = new THREE.Group(); torso.position.y = 13 * VX; body.add(torso);
  torso.add(cubos(parte((x, y, z) => {
    if (y <= 1) return y === 0 ? C.calca : sh(C.calca, 1.08);
    if (z === 2 && y === 9 && (x === -1 || x === 0)) return C.pele;
    if ((x === -4 || x === 3) && (z === -3 || z === 2) && y >= 2) return null;
    if (x === -4 || x === 3) return sh(C.camisa, 0.9);
    if (z === 2 && x === -3 && (y === 6 || y === 7)) return sh(C.camisa, 0.86);   // bolsinho
    return C.camisa;
  }, -4, 3, 0, 9, -3, 2), VX));
  // braços: ombro (manga 4) + antebraço (pele 6) + mão
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -7 : 4, x1 = x0 + 2;
    const shP = new THREE.Group(); shP.position.set((sx < 0 ? -5.5 : 5.5) * VX, 22.5 * VX, 0); body.add(shP);
    const ox = sx < 0 ? 5.5 : -5.5;   // desloca os cubos pro pivô do ombro
    const up = cubos(parte((x, y) => (y >= -4 ? C.camisa : C.pele), x0, x1, -5, -1, -2, 1), VX); up.position.set(ox * VX, 0.5 * VX, 0); shP.add(up);
    const el = new THREE.Group(); el.position.y = -5 * VX; shP.add(el);
    const lo = cubos(parte((x, y) => (y <= -5 ? sh(C.pele, 0.92) : C.pele), x0, x1, -6, -1, -2, 1), VX); lo.position.set(ox * VX, 0.5 * VX, 0); el.add(lo);
    const handP = new THREE.Group(); handP.position.y = -5.5 * VX; el.add(handP);
    arms.push({ sh: shP, el, handP, sx, L1: 5 * VX, L2: 6 * VX });
  }
  // cabeça 10×10×10
  const headP = new THREE.Group(); headP.position.set(0, 23 * VX, -0.5 * VX); body.add(headP);
  const hairAt = (x, y, z) => y >= 7 || (z <= -3 && y >= 2) || ((x === -5 || x === 4) && y >= 4 && z <= 1) || (z === 4 && y === 7 && (x <= -2 || x >= 2)) || (z === 4 && y >= 8);
  headP.add(cubos(parte((x, y, z) => {
    if (x > -5 && x < 4 && y > 0 && y < 9 && z > -5 && z < 4) return null;   // oco por dentro
    const ex = (x === -5 || x === 4), ez = (z === -5 || z === 4), ey = (y === 9 || y === 0);
    if ((ex && ez) || (ex && ey) || (ez && ey)) return null;                   // cantos arredondados
    if (hairAt(x, y, z)) return (hash(x * 3.7 + y * 1.3 + z * 5.1) > 0.8 ? sh(C.cabelo, 1.6) : C.cabelo);
    if (z === 4 && y === 3 && (x === -4 || x === 3)) return C.bochecha;
    return C.pele;
  }, -5, 4, 0, 9, -5, 4), VX));
  headP.add(cubos([[-6, 4, -1, C.pele], [-6, 5, -1, C.pele], [5, 4, -1, C.pele], [5, 5, -1, C.pele], [-1, 3, 4.06, sh(C.pele, 0.94)], [0, 3, 4.06, sh(C.pele, 0.94)]], VX));
  const eyes = new THREE.Group(); headP.add(eyes); eyes.position.set(0, 5.5 * VX, 0); eyes.userData.y0 = 5.5 * VX;
  for (const ex of [-3, 1]) {
    const e = cubos([[ex, -1, 4.12, C.olho], [ex + 1, -1, 4.12, C.olho], [ex, 0, 4.12, '#ffffff'], [ex + 1, 0, 4.12, C.olho]], VX, { semVariar: true, sombra: false });
    e.position.y = -0.5 * VX; eyes.add(e);
  }
  // sobrancelhas: cada uma gira em volta do próprio meio
  const brows = [-2, 2].map((cx) => { const b = cubos([[-1, 0, 0, C.cabelo], [0, 0, 0, C.cabelo]], VX, { semVariar: true, sombra: false }); b.position.set(cx * VX, 6 * VX, 4.15 * VX); b.userData.y0 = 6 * VX; headP.add(b); return b; });
  const MB = '#4a2420', ML = '#d9776d';   // boca escura + língua
  const mouths = {
    sorriso: cubos([[-2, 2, 4.12, MB], [-1, 1, 4.12, MB], [0, 1, 4.12, MB], [1, 2, 4.12, MB]], VX, { semVariar: true, sombra: false }),
    aberta: cubos([[-1, 2, 4.12, MB], [0, 2, 4.12, MB], [-1, 1, 4.12, ML], [0, 1, 4.12, ML]], VX, { semVariar: true, sombra: false }),
    triste: cubos([[-2, 1, 4.12, MB], [-1, 2, 4.12, MB], [0, 2, 4.12, MB], [1, 1, 4.12, MB]], VX, { semVariar: true, sombra: false }),
    reta: cubos([[-1, 2, 4.12, MB], [0, 2, 4.12, MB]], VX, { semVariar: true, sombra: false }),
  };
  for (const k in mouths) headP.add(mouths[k]);
  g.userData = { body, headP, eyes, brows, mouths, arms, legs, torso };
  return g;
}

/** anima o boneco. st: { humor -1..1, fala 0..1, andar 0..1, passo, pose, poseK, olhar -1..1 }
 *  poses: 'comemora' | 'aponta' | 'pensa' | 'susto' | 'tchau' | 'segura'                                      */
export function animar(p, t, st = {}) {
  const u = p.userData, humor = st.humor ?? 0.3, andar = st.andar ?? 0, fala = st.fala ?? 0;
  u.body.position.y = Math.sin(t * 2.2) * 0.006;
  const falando = fala > 0.05 && Math.sin(t * 20) > 0;
  for (const k in u.mouths) u.mouths[k].visible = false;
  (st.boca && u.mouths[st.boca]) ? (u.mouths[st.boca].visible = true) : ((falando ? u.mouths.aberta : humor > 0.15 ? u.mouths.sorriso : humor < -0.15 ? u.mouths.triste : u.mouths.reta).visible = true);
  for (const b of u.brows) b.position.y = b.userData.y0 + (humor > 0.6 ? 0.4 : 0) * VX;
  u.brows[0].rotation.z = humor < -0.2 ? 0.3 : 0; u.brows[1].rotation.z = humor < -0.2 ? -0.3 : 0;   // triste: pontas de dentro sobem
  const bl = (t * 0.37 + 0.13) % 1; u.eyes.scale.y = bl < 0.03 ? 0.2 : 1;
  const ph = t * (st.passo ?? 7);
  u.legs.forEach((L, i) => { L.hip.rotation.x = Math.sin(ph + i * Math.PI) * 0.6 * andar; L.knee.rotation.x = Math.max(0, Math.sin(ph + i * Math.PI)) * 0.6 * andar; });
  u.body.position.y += Math.abs(Math.sin(ph)) * 0.03 * andar;
  u.arms.forEach((A, i) => { A.sh.rotation.set(-Math.sin(ph + i * Math.PI) * 0.55 * andar, 0, A.sx * 0.06); A.el.rotation.set(-0.1 - 0.2 * andar, 0, 0); });
  u.headP.rotation.set(humor < -0.3 ? 0.12 : 0, (st.olhar ?? 0) * 0.5, 0);
  pose(p, t, st.pose, st.poseK ?? 1);
}
export function pose(p, t, nome, k = 1) {
  if (!nome || k <= 0.001) return;
  const u = p.userData, [Lf, Rt] = u.arms;
  const set = (A, x, z, el) => { A.sh.rotation.x = lerp(A.sh.rotation.x, x, k); A.sh.rotation.z = lerp(A.sh.rotation.z, A.sx * z, k); A.el.rotation.x = lerp(A.el.rotation.x, el, k); };
  const boca = (n) => { for (const m in u.mouths) u.mouths[m].visible = false; u.mouths[n].visible = true; };
  if (nome === 'comemora') { set(Lf, 0, 2.6 + 0.15 * Math.sin(t * 13), -0.2); set(Rt, 0, 2.6 + 0.15 * Math.sin(t * 13 + 1), -0.2); u.body.position.y += Math.abs(Math.sin(t * 9)) * 0.08 * k; boca('aberta'); }
  else if (nome === 'aponta') set(Rt, -1.5, 0.15, -0.05);
  else if (nome === 'segura') { set(Rt, -1.15, 0.05, -0.5); set(Lf, -1.15, 0.05, -0.5); }
  else if (nome === 'pensa') { set(Rt, -0.7, 0.2, -2.2); u.headP.rotation.z = lerp(u.headP.rotation.z, 0.1, k); }
  else if (nome === 'susto') { set(Lf, -0.4, 2.3, -0.9); set(Rt, -0.4, 2.3, -0.9); boca('aberta'); }
  else if (nome === 'tchau') set(Rt, 0, 2.5, -0.4 - 0.45 * (0.5 + 0.5 * Math.sin(t * 10)));
}

/* ------------------------------------------------------------------ cenários */
/** chão de blocos com grama: larg × prof (em metros), blocos de `tam`; alturas: (x, z) => número de blocos a mais */
export function terreno(o = {}) {
  const w = o.largura ?? 16, d = o.prof ?? 12, tam = o.tam ?? 0.5, nx = Math.round(w / tam), nz = Math.round(d / tam);
  const top = [], dirt = [];
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
    const x = i - nx / 2, z = k - nz / 2, hgt = o.alturas ? Math.max(0, Math.round(o.alturas(x * tam, z * tam))) : 0;
    if (o.buraco && o.buraco(x * tam, z * tam)) continue;
    top.push([x, hgt - 1, z, o.cores ? o.cores[Math.floor(hash(i * 3.1 + k * 7.3) * o.cores.length)] : COR.grama[Math.floor(hash(i * 3.1 + k * 7.3) * 4)]]);
    for (let y = hgt - 2; y >= hgt - 2 - (o.fundo ?? 1); y--) dirt.push([x, y, z, COR.terra[Math.floor(hash(i * 5.7 + k * 1.3 + y) * 3)]]);
  }
  return grupo(cubos(top, tam, { sombra: false }), cubos(dirt, tam, { sombra: false }));
}
export function agua(w, d, o = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, o.altura ?? 0.4, d), new THREE.MeshStandardMaterial({ color: COR.agua, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.82, flatShading: true }));
  m.receiveShadow = true; return m;
}
/** árvore de quadradinhos. o.folhas: 'outono' (laranja, padrão) | 'verde' */
export function arvore(o = {}) {
  const g = new THREE.Group(), tam = o.tam ?? 0.2, h = o.altura ?? 2.2, r = o.copa ?? 1.1;
  const L = []; const n = Math.round(h / tam);
  for (let y = 0; y < n; y++) for (const [x, z] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) L.push([x, y, z, COR.tronco[(y + x) & 1]]);
  g.add(cubos(L, tam));
  const copa = esferaDeCubos(r, o.folhas === 'verde' ? COR.verdes : COR.outono, tam, { falhas: 0.35, sy: 0.85 }); copa.position.y = h + r * 0.55; g.add(copa);
  return g;
}
/** silhueta de cidade ao longe (prédios de blocos com janelas acesas) */
export function cidade(o = {}) {
  const g = new THREE.Group(), n = o.predios ?? 16;
  for (let i = 0; i < n; i++) {
    const w = 1.2 + 1.6 * hash(i * 2.1), h = 4 + 9 * hash(i * 5.3), b = bloco(w, h, w, i % 3 ? '#8e7aa8' : '#7c6c98', { pixel: 0.5 });
    b.position.set(-n * 1.1 + i * 2.2 + hash(i) * 0.5, h / 2, -(o.dist ?? 26) - hash(i * 9.1) * 6); g.add(b);
  }
  return g;
}
/** folhinhas caindo (quadradinhos laranja que descem girando). Chame folhas.atualizar(t) no update. */
export function folhas(o = {}) {
  const n = o.qtd ?? 40, L = []; for (let i = 0; i < n; i++) L.push([0, 0, 0, COR.outono[i % 5]]);
  const m = cubos(L, o.tam ?? 0.07, { sombra: false });
  const area = o.area ?? [6, 4, 4];
  m.userData.atualizar = (t) => { for (let i = 0; i < n; i++) { const f = ((t * (0.12 + 0.08 * hash(i)) + hash(i * 3.3)) % 1); _p.set((hash(i * 1.7) - 0.5) * area[0] + Math.sin(t * 1.3 + i) * 0.3, area[1] * (1 - f), (hash(i * 7.1) - 0.5) * area[2]); _q.setFromAxisAngle(_s.set(0.3, 1, 0.2).normalize(), t * 3 + i); _m.compose(_p, _q, _s.setScalar(o.tam ?? 0.07)); m.setMatrixAt(i, _m); } m.instanceMatrix.needsUpdate = true; };
  return m;
}
/** cômodo de blocos (piso de tábua, parede de tijolinho, janela). R = { x0, x1, z0, z1, h } — a parede da frente fica aberta */
export function sala(R = {}) {
  const x0 = R.x0 ?? -3, x1 = R.x1 ?? 3, z0 = R.z0 ?? -2.5, z1 = R.z1 ?? 2, h = R.h ?? 2.75, t = 0.25, w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const g = new THREE.Group();
  g.add(em(bloco(w + 2 * t, t, d + t, R.piso ?? COR.tabua[0], { textura: 'tabua' }), cx, -t / 2, cz + t / 2));
  g.add(em(bloco(w + 2 * t, h, t, R.parede ?? '#b9b2a6', { textura: 'tijolo' }), cx, h / 2, z0 - t / 2));
  g.add(em(bloco(t, h, d + t, R.parede ?? '#b9b2a6', { textura: 'tijolo' }), x0 - t / 2, h / 2, cz - t / 2));
  // janela na parede do fundo (vidro azulado + moldura de tábua)
  const jx = R.janelaX ?? cx + w * 0.22;
  g.add(em(bloco(1.5, 1.2, 0.08, '#9fd3ff', { opacity: 0.55 }), jx, 1.55, z0 - 0.05));
  for (const [ww, hh, xx, yy] of [[1.7, 0.12, 0, 0.66], [1.7, 0.12, 0, -0.66], [0.12, 1.4, -0.8, 0], [0.12, 1.4, 0.8, 0], [0.08, 1.2, 0, 0]]) g.add(em(bloco(ww, hh, 0.14, COR.tabua[1], { textura: 'tabua' }), jx + xx, 1.55 + yy, z0 + 0.02));
  // estante com livros
  const ex = R.estanteX ?? cx - w * 0.3;
  g.add(em(bloco(1.0, 1.6, 0.35, COR.tabua[2], { textura: 'tabua' }), ex, 0.8, z0 + 0.2));
  for (let i = 0; i < 9; i++) g.add(em(bloco(0.09, 0.3, 0.25, ['#c0392b', '#2e86de', '#27ae60', '#f39c12'][i % 4]), ex - 0.38 + i * 0.095, 1.25 + (i > 4 ? -0.5 : 0), z0 + 0.25));
  return g;
}
