/* =====================================================================================
   MODELOS DO VÍDEO: Guarda-chuva (estilo Ilustrado 2D)
   Tudo plano (formas chapadas). Peças que mudam de forma (pano, jornal) são malhas cujos vértices
   são recalculados a cada quadro a partir do tempo (nenhuma geometria nova é criada no update).
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, hash } from '../../../sistema/motor/lib.js';
import * as E from '../../../biblioteca/estilos/ilustrado/estilo.js';

export const C = {
  ceuTopo: '#4f5b88', ceuMeio: '#8e8bbd', ceuBase: '#c3b6d4',
  nuvem: '#6f6d9d', nuvem2: '#807eae', cidade: '#8478a9', cidade2: '#73699a', janelaAcesa: '#ffd98a',
  chuva: '#e6f0fb', poca: '#9fb2d6', pocaLuz: '#c9d6ee',
  pano: ['#1d6a67', '#b9862c', '#2a8c88', '#dfa53c'],
  aco: '#a3acb6', fibra: '#f6d77e', cabo: '#33363d', caboLuz: '#4a4f58', corr: '#e9545a', corrEsc: '#c23b42',
  ponteira: '#2b2d33', tira: '#16524f', botao: '#dfa53c', agua: '#8fd0ff', aguaLuz: '#d9f1ff',
  jornal: '#f2efe4', jornalMolhado: '#a39f90', parede: '#f3e6cf', paredeCorte: '#4a3f55', lixeira: '#2f5d8a', lixeiraEsc: '#244a6f',
};

/* ------------------------------------------------------------------ malha flexível (grade na × ns), vértices em coordenadas do mundo */
export class Malha {
  constructor(na, ns, material, z = 0) {
    this.na = na; this.ns = ns;
    const n = (na + 1) * (ns + 1), g = new THREE.BufferGeometry();
    this.pos = new THREE.BufferAttribute(new Float32Array(n * 3), 3); this.pos.setUsage(THREE.DynamicDrawUsage);
    const uv = new Float32Array(n * 2), idx = [];
    for (let j = 0; j <= ns; j++) for (let i = 0; i <= na; i++) { const k = j * (na + 1) + i; uv[2 * k] = i / na; uv[2 * k + 1] = 1 - j / ns; }
    for (let j = 0; j < ns; j++) for (let i = 0; i < na; i++) { const a = j * (na + 1) + i, b = a + 1, c = a + na + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    g.setAttribute('position', this.pos); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, material); this.mesh.position.z = z; this.mesh.frustumCulled = false;
  }
  /** fn(a, s) → [x, y]  (a = 0..1 na largura, s = 0..1 na altura) */
  set(fn) {
    const { na, ns } = this;
    for (let j = 0; j <= ns; j++) for (let i = 0; i <= na; i++) { const p = fn(i / na, j / ns); this.pos.setXY(j * (na + 1) + i, p[0], p[1]); }
    this.pos.needsUpdate = true;
  }
  ponto(i, j) { const k = j * (this.na + 1) + i; return [this.pos.getX(k), this.pos.getY(k)]; }
}

/* ------------------------------------------------------------------ linha grossa que muda de forma (vareta, perninha, mola) */
export class Linha {
  constructor(K, esp, cor, z = 0) {
    this.g = new THREE.Group(); this.esp = esp; this.segs = [];
    const m = typeof cor === 'object' ? cor : E.material(cor);
    for (let k = 0; k < K; k++) { const s = E.ret(1, esp, m, { r: 0 }); s.position.z = z; this.g.add(s); this.segs.push(s); }
  }
  set(pts) {
    this.segs.forEach((s, k) => {
      if (k + 1 >= pts.length) { s.visible = false; return; }
      const [x1, y1] = pts[k], [x2, y2] = pts[k + 1], L = Math.hypot(x2 - x1, y2 - y1);
      s.visible = L > 1e-4; s.position.x = (x1 + x2) / 2; s.position.y = (y1 + y2) / 2; s.rotation.z = Math.atan2(y2 - y1, x2 - x1); s.scale.x = L + this.esp * 0.6;
    });
  }
}

/* ------------------------------------------------------------------ abrigo: onde a chuva para (o ponto mais alto de tudo o que cobre, por faixa de x) */
export class Abrigo {
  constructor(x0 = -7, x1 = 9, passo = 0.02) { this.x0 = x0; this.passo = passo; this.n = Math.ceil((x1 - x0) / passo); this.y = new Float32Array(this.n); }
  limpar() { this.y.fill(-99); }
  seg(xa, ya, xb, yb) {
    if (xa > xb) { [xa, xb] = [xb, xa]; [ya, yb] = [yb, ya]; }
    const i0 = Math.max(0, Math.floor((xa - this.x0) / this.passo)), i1 = Math.min(this.n - 1, Math.floor((xb - this.x0) / this.passo));
    for (let i = i0; i <= i1; i++) { const x = this.x0 + (i + 0.5) * this.passo, k = xb - xa > 1e-6 ? clamp((x - xa) / (xb - xa)) : 0, y = lerp(ya, yb, k); if (y > this.y[i]) this.y[i] = y; }
  }
  malha(M) { for (let j = 0; j <= M.ns; j++) for (let i = 0; i < M.na; i++) { const a = M.ponto(i, j), b = M.ponto(i + 1, j); this.seg(a[0], a[1], b[0], b[1]); } }
  topo(x) { const i = Math.floor((x - this.x0) / this.passo); return i < 0 || i >= this.n ? -99 : this.y[i]; }
}

/* ------------------------------------------------------------------ chuva: gotas finas que caem e respingam onde batem */
export class Chuva {
  constructor(n, { x0 = -6, x1 = 8, yTopo = 5.4, yBase = -0.7, z = 0.45 } = {}) {
    Object.assign(this, { n, x0, x1, yTopo, yBase, z });
    const gGota = new THREE.ShapeGeometry(E.formaRet(0.011, 0.12, 0.0055), 4);
    const sp = new THREE.Shape(); [[-0.05, 0], [-0.04, 0.032], [-0.022, 0.01], [0, 0.045], [0.022, 0.01], [0.04, 0.032], [0.05, 0], [0.03, -0.006], [-0.03, -0.006]].forEach(([x, y], i) => (i ? sp.lineTo(x, y) : sp.moveTo(x, y))); sp.closePath();
    const gResp = new THREE.ShapeGeometry(sp);
    this.mat = new THREE.MeshBasicMaterial({ color: C.chuva, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide });
    this.gotas = new THREE.InstancedMesh(gGota, this.mat, n); this.resp = new THREE.InstancedMesh(gResp, this.mat, n);
    for (const im of [this.gotas, this.resp]) { im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.position.z = z; im.count = 0; }
    this.d = []; for (let i = 0; i < n; i++) this.d.push({ x: x0 + (x1 - x0) * hash(i * 1.37 + 0.2), ph: hash(i * 2.71 + 5.1), v: 6.2 + 2.2 * hash(i * 3.31 + 1.7) });
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._p = new THREE.Vector3(); this._e = new THREE.Euler();
  }
  /** t: tempo (pode andar pra trás no ◀◀) · inclina: dx/dy do vento · forca: 0..1 · parada(x) → y onde a gota para */
  update(t, inclina, forca, parada) {
    const span = this.yTopo - this.yBase, nAtivas = Math.floor(this.n * clamp(forca));
    let ng = 0, nr = 0; const rot = Math.atan(inclina);
    for (let i = 0; i < nAtivas; i++) {
      const D = this.d[i], f = ((D.ph + (t * D.v) / span) % 1 + 1) % 1;
      const y = this.yTopo - f * span, x = D.x + inclina * (y - 1.6);
      const yp = parada(x);
      if (y > yp + 0.02) {
        this._s.set(1, 1, 1); this._e.set(0, 0, rot); this._q.setFromEuler(this._e); this._p.set(x, y, 0);
        this._m.compose(this._p, this._q, this._s); this.gotas.setMatrixAt(ng++, this._m);
      } else {
        const idade = (yp - y) / D.v;
        if (idade < 0.16 && yp > this.yBase + 0.05) {
          const k = idade / 0.16, sc = 0.5 + 0.9 * k; this._s.set(sc, sc * (1 - 0.6 * k), 1); this._q.identity(); this._p.set(x - inclina * 0.0, yp + 0.005, 0);
          this._m.compose(this._p, this._q, this._s); this.resp.setMatrixAt(nr++, this._m);
        }
      }
    }
    this.gotas.count = ng; this.resp.count = nr; this.gotas.instanceMatrix.needsUpdate = true; this.resp.instanceMatrix.needsUpdate = true;
  }
}

/* ------------------------------------------------------------------ o guarda-chuva (todas as peças), visto de lado
   Coordenadas locais: (0,0) = topo do cabo, onde as varetas se encontram; o cabo desce até y ≈ -0,86.          */
const UB = [-1, -Math.SQRT1_2, 0, Math.SQRT1_2, 1];            // posição na tela de cada vareta visível (8 varetas, vistas de lado)
export const R_AB = 0.56, H_AB = 0.27, Y_AB = -0.30, Y_FE = -0.68, Y_PEGA = -0.8;
export class GuardaChuva {
  constructor(z = 0.03) {
    this.z = z;
    this.g = new THREE.Group();
    // pano: 4 gomos (2 tons de verde-petróleo e mostarda)
    this.gomos = C.pano.map((cor) => { const m = new Malha(7, 10, new THREE.MeshBasicMaterial({ color: cor, side: THREE.DoubleSide, transparent: true, opacity: 1 }), z + 0.004); this.g.add(m.mesh); return m; });
    // varetas (aço e fibra), perninhas, cabo, corrediça, trava, ponteiras, cabo curvo, tirinha
    this.varAco = UB.map(() => { const l = new Linha(10, 0.014, C.aco, z + 0.003); this.g.add(l.g); return l; });
    this.varFib = UB.map(() => { const l = new Linha(10, 0.016, C.fibra, z + 0.0031); this.g.add(l.g); return l; });
    this.pernas = [0, 1, 3, 4].map(() => { const l = new Linha(1, 0.011, C.aco, z + 0.0015); this.g.add(l.g); return l; });
    this.cabo = E.ret(0.024, 1, C.cabo); this.cabo.position.z = z + 0.001; this.g.add(this.cabo);
    this.caboLuz = E.ret(0.007, 1, C.caboLuz); this.caboLuz.position.z = z + 0.0012; this.g.add(this.caboLuz);
    this.ponta = E.grupo(E.em(E.ret(0.03, 0.075, C.cabo, { r: 0.013 }), 0, 0.045, 0), E.em(E.circ(0.016, C.caboLuz), 0, 0.085, 0.0005)); this.ponta.position.z = z + 0.0056; this.g.add(this.ponta);
    this.fundo = E.ret(0.03, 0.05, C.cabo, { r: 0.012 }); this.fundo.position.z = z + 0.0013; this.g.add(this.fundo);
    this.corr = E.grupo(E.ret(0.06, 0.085, C.corr, { r: 0.016 }), E.em(E.ret(0.062, 0.016, C.corrEsc, { r: 0.008 }), 0, -0.024, 0.0004), E.em(E.ret(0.016, 0.06, '#f58a8f', { r: 0.008 }), 0.016, 0.004, 0.0004));
    this.corr.position.z = z + 0.0052; this.g.add(this.corr);
    // trava: janelinha em corte no cabo com a mola + o pino triangular que pula pra fora
    this.janela = E.ret(0.02, 0.085, '#16171b', { r: 0.006 }); this.janela.position.z = z + 0.0014; this.g.add(this.janela);
    this.mola = new Linha(7, 0.0045, '#d9dde2', z + 0.0016); this.g.add(this.mola.g);
    this.pino = E.poli([[0, -0.012], [0.04, 0.002], [0.04, 0.012], [0, 0.026]], '#ffd21f'); this.pino.position.z = z + 0.0017;
    this.pinoG = new THREE.Group(); this.pinoG.add(this.pino); this.g.add(this.pinoG);
    this.ponteiras = UB.map(() => { const p = E.ret(0.026, 0.05, C.ponteira, { r: 0.011 }); p.position.z = z + 0.0058; this.g.add(p); return p; });
    const J = [[0, 0.02], [0, -0.13], [0.012, -0.19], [0.05, -0.225], [0.095, -0.215], [0.122, -0.18], [0.125, -0.13]];
    this.caboCurvo = E.grupo(E.traco(J, 0.046, E.COR.madeiraEsc), E.em(E.traco(J.map(([x, y]) => [x + 0.006, y + 0.004]), 0.024, E.COR.madeira), 0, 0, 0.0004));
    this.caboCurvo.position.z = z + 0.0055; this.g.add(this.caboCurvo);
    this.tiraA = new Linha(2, 0.022, C.tira, z + 0.0057); this.g.add(this.tiraA.g);
    this.botaoA = E.circ(0.017, C.botao); this.botaoA.position.z = z + 0.006; this.g.add(this.botaoA);
    this.tiraF = E.grupo(E.ret(0.15, 0.04, C.tira, { r: 0.016 }), E.em(E.circ(0.017, C.botao), 0.035, 0, 0.0004)); this.tiraF.position.z = z + 0.0059; this.g.add(this.tiraF);
    this.ponteiro = { x: 0, y: 0, c: 1, s: 0 };
  }
  /* ponto do pano/vareta (u = posição da vareta na tela -1..1, s = 0 no topo … 1 na borda), em coordenadas LOCAIS */
  superficie(u, s, a, st) {
    const k = st.k, inv = st.inv || 0;
    // aberto (domo), fechado (pendurado), do avesso (copo)
    const ro = Math.hypot(R_AB * s, H_AB * (1 - Math.pow(1 - s * s, 0.55))), ao = Math.atan2(-H_AB * (1 - Math.pow(1 - s * s, 0.55)), R_AB * s || 1e-6);
    const rc = 0.62 * s, ac = -Math.PI / 2 + 0.085;
    const ri = Math.hypot(0.8 * R_AB * s, 0.3 * Math.pow(s, 1.5)), ai = Math.atan2(0.3 * Math.pow(s, 1.5), 0.8 * R_AB * s || 1e-6);
    let r = lerp(rc, ro, k), an = lerp(ac, ao, k);
    r = lerp(r, ri, inv); an = lerp(an, ai, inv);
    let rho = r * Math.cos(an), y = r * Math.sin(an);
    // pano fechado faz dobras entre as varetas; aberto faz a "onda" da borda
    rho += (1 - k) * 0.028 * Math.sin(Math.PI * a) * Math.sin(Math.PI * Math.min(1, s * 1.15));
    y += 0.03 * Math.sin(Math.PI * a) * Math.pow(s, 4) * k * (1 - inv);
    let x = rho * u;
    if (st.flex) { x += st.flex * 0.05 * s * s * u; y += st.flex * 0.06 * s * s; }
    // vareta torta (aço que entortou): gira a ponta perto da vareta u = +0,707
    if (st.torta > 0 && s > 0.5) {
      const w = Math.max(0, 1 - Math.abs(u - Math.SQRT1_2) / 0.36) * st.torta;
      if (w > 0) { const K = this.superficie(u, 0.5, a, { ...st, torta: 0 }), an2 = -0.95 * w, dx = x - K[0], dy = y - K[1]; x = K[0] + dx * Math.cos(an2) - dy * Math.sin(an2); y = K[1] + dx * Math.sin(an2) + dy * Math.cos(an2); }
    }
    return [x, y];
  }
  /** st: { apex:[x,y], tilt, k, inv, flex, torta, pano:{ vis, opac, wF, wM, wG, folha:{cx,y,w}, cabeca:{x,y} }, varetas, fibra (0..1 troca), pernas, cabo, corr, trava, mola, ponteiras:[..], caboCurvo, tiraA, tiraF } */
  pose(st) {
    const [ax, ay] = st.apex, c = Math.cos(st.tilt || 0), s0 = Math.sin(st.tilt || 0);
    const Wd = (p) => [ax + p[0] * c - p[1] * s0, ay + p[0] * s0 + p[1] * c];
    const put = (o, p, extraRot = 0, sx = 1, sy = 1) => { const w = Wd(p); o.position.x = w[0]; o.position.y = w[1]; o.rotation.z = (st.tilt || 0) + extraRot; o.scale.set(sx, sy, 1); };
    this.Wd = Wd;
    // ---- pano (mistura de 3 formas: folha esticada nas mãos, grudado na cabeça, gomos no guarda-chuva)
    const P = st.pano;
    this.gomos.forEach((M, gi) => {
      M.mesh.visible = P.vis; M.mesh.material.opacity = P.opac ?? 1;
      if (!P.vis) return;
      M.set((a, s) => {
        let x = 0, y = 0;
        const q = (gi + a) / 4;
        if (P.wF > 0) { const F = P.folha, qq = 2 * q - 1; x += P.wF * (F.cx + F.w * (q - 0.5)); y += P.wF * (F.y + 0.035 * (1 - qq * qq) - (F.cai || 0) * (1 - qq * qq) - s * 0.075); }
        if (P.wM > 0) { const h = cabecaPano(P.cabeca, q, s); x += P.wM * h[0]; y += P.wM * h[1]; }
        if (P.wG > 0) { const u = lerp(UB[gi], UB[gi + 1], a), p = Wd(this.superficie(u, s, a, st)); x += P.wG * p[0]; y += P.wG * p[1]; }
        return [x, y];
      });
    });
    // ---- varetas (crescem do topo pra fora); aço → fibra
    const cres = st.varetas ?? 0, fib = st.fibra ?? 0;
    UB.forEach((u, i) => {
      const pts = []; const n = 10, smax = cres;
      for (let k = 0; k <= n; k++) pts.push(Wd(this.superficie(u, (k / n) * smax, 0.5, st)));
      const ia = i, mostrarAco = cres > 0.001 && fib < 1, mostrarFib = cres > 0.001 && fib > 0;
      // troca vareta por vareta (da esquerda pra direita)
      const fi = clamp(fib * 1.6 - i * 0.15);
      this.varAco[ia].g.visible = mostrarAco && fi < 1; this.varFib[ia].g.visible = mostrarFib && fi > 0;
      if (this.varAco[ia].g.visible) this.varAco[ia].set(pts.slice(0, Math.max(2, Math.round(pts.length * (1 - fi)) + 1)));
      if (this.varFib[ia].g.visible) this.varFib[ia].set(pts.slice(0, Math.max(2, Math.round(pts.length * fi) + 1)));
    });
    // ---- cabo (o pau do meio) com a ponta de cima
    const cab = st.cabo ?? 0;
    for (const o of [this.cabo, this.caboLuz, this.ponta, this.fundo]) o.visible = cab > 0.001;
    if (cab > 0.001) {
      const L = 0.95 * cab;
      put(this.cabo, [0, 0.06 - L / 2], 0, 1, L); put(this.caboLuz, [0.004, 0.06 - L / 2], 0, 1, L * 0.95);
      put(this.ponta, [0, 0], 0, cab, cab); put(this.fundo, [0, 0.06 - L], 0, 1, 1); this.fundo.visible = cab > 0.001 && (st.caboCurvo ?? 0) < 0.5;
    }
    // ---- corrediça (anel) e perninhas
    const yr = lerp(Y_FE, Y_AB, clamp(st.k)) + (st.yrExtra || 0);
    this.corr.visible = (st.corr ?? 0) > 0.001; if (this.corr.visible) put(this.corr, [0, yr], 0, st.corr, st.corr);
    [0, 1, 3, 4].forEach((ui, j) => {
      const L = this.pernas[j], g = st.pernas ?? 0; L.g.visible = g > 0.001; if (!L.g.visible) return;
      const top = this.superficie(UB[ui], 0.5, 0.5, st), bot = [0, yr];
      L.set([Wd(top), Wd([lerp(top[0], bot[0], g), lerp(top[1], bot[1], g)])]);
    });
    // ---- trava: pino triangular + mola na janelinha do cabo
    const yp = Y_AB - 0.065, pv = st.trava ?? 0;
    this.pinoG.visible = pv > 0.001; this.janela.visible = this.mola.g.visible = (st.mola ?? 0) > 0.001;
    if (pv > 0.001) { put(this.pinoG, [0.008, yp], 0, (0.08 + 0.92 * clamp(st.pinoFora ?? 1)) * pv, pv); }
    if (this.janela.visible) {
      put(this.janela, [0, yp - 0.005], 0, st.mola, st.mola);
      const comp = 0.55 + 0.45 * clamp(st.pinoFora ?? 1), pts = [];
      for (let k = 0; k <= 7; k++) pts.push(Wd([(k % 2 ? 0.006 : -0.006) * st.mola, yp - 0.04 + k * 0.0075 * comp]));
      this.mola.set(pts);
    }
    // ---- ponteiras nas pontas das varetas
    UB.forEach((u, i) => {
      const v = (st.ponteiras && st.ponteiras[i]) || 0, p = this.ponteiras[i]; p.visible = v > 0.001 && cres > 0.99; if (!p.visible) return;
      const a = this.superficie(u, 0.97, 0.5, st), b = this.superficie(u, 1.0, 0.5, st), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      put(p, [b[0] + Math.cos(ang) * 0.012, b[1] + Math.sin(ang) * 0.012], ang - Math.PI / 2, v, v);
    });
    // ---- cabo curvo
    const cc = st.caboCurvo ?? 0; this.caboCurvo.visible = cc > 0.001; if (cc > 0.001) put(this.caboCurvo, [0, 0.06 - 0.95], 0, cc, cc);
    // ---- tirinha: pendurada (aberto) ou abraçando o pano fechado
    const ta = st.tiraA ?? 0, tf = st.tiraF ?? 0;
    this.tiraA.g.visible = this.botaoA.visible = ta > 0.001;
    if (ta > 0.001) { const b = this.superficie(0.42, 1, 0.5, st), p0 = Wd(b), p1 = Wd([b[0] + 0.01, b[1] - 0.06 * ta]), p2 = Wd([b[0] + 0.02, b[1] - 0.115 * ta]); this.tiraA.set([p0, p1, p2]); this.botaoA.position.set(p2[0], p2[1], this.botaoA.position.z); this.botaoA.scale.setScalar(ta); }
    this.tiraF.visible = tf > 0.001; if (tf > 0.001) put(this.tiraF, [0, -0.62 * 0.6], 0, tf, tf);
    this.yr = yr;
  }
  /** pontos úteis no mundo */
  pegada() { return this.Wd([0, Y_PEGA]); }
  anel() { return this.Wd([0, this.yr]); }
  pontaVareta(u, st) { return this.Wd(this.superficie(u, 1, 0.5, st)); }
  /** marca no abrigo da chuva o pano (se estiver visível) */
  abrigar(AB) { if (this.gomos[0].mesh.visible && this.gomos[0].mesh.material.opacity > 0.3) for (const M of this.gomos) AB.malha(M); }
}

/** pano grudado na cabeça (capuz molhado): q = 0 atrás (nuca) … 1 na frente (cara); s = 0 por fora … 1 por dentro */
const CAP = [[-0.215, -0.33], [-0.2, -0.02], [-0.11, 0.19], [0.05, 0.215], [0.17, 0.09], [0.215, -0.22]];
function cabecaPano(H, q, s) {
  const f = q * (CAP.length - 1), i = Math.min(CAP.length - 2, Math.floor(f)), k = f - i;
  const p0 = CAP[Math.max(0, i - 1)], p1 = CAP[i], p2 = CAP[i + 1], p3 = CAP[Math.min(CAP.length - 1, i + 2)];
  const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * k + (2 * a - 5 * b + 4 * c - d) * k * k + (-a + 3 * b - 3 * c + d) * k * k * k);
  const x = cr(p0[0], p1[0], p2[0], p3[0]), y = cr(p0[1], p1[1], p2[1], p3[1]);
  const L = Math.hypot(x, y) || 1, nx = x / L, ny = y / L, esp = 0.065 * (1 - s);
  const onda = (q < 0.12 || q > 0.88) ? 0.012 * Math.sin(q * 40) : 0;
  return [H.x + x + nx * esp + onda, H.y + y + ny * esp];
}

/* ------------------------------------------------------------------ jornal (2 metades que rasgam), com a página impressa */
function texturaJornal() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 512, 128);
  x.fillStyle = '#3b3f48'; x.fillRect(18, 12, 300, 22); x.fillRect(340, 12, 150, 12);
  x.fillStyle = '#b8b4a8'; x.fillRect(340, 30, 150, 60);
  x.fillStyle = '#8e8a80'; for (let col = 0; col < 4; col++) for (let l = 0; l < 7; l++) x.fillRect(18 + col * 78, 44 + l * 11, 66 - (l === 6 ? 24 : 0), 5);
  for (let l = 0; l < 2; l++) x.fillRect(340, 98 + l * 11, 150, 5);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export class Jornal {
  constructor(z = 0.036) {
    const tex = texturaJornal();
    this.metades = [0, 1].map((i) => {
      const tx = tex.clone(); tx.needsUpdate = true; tx.repeat.set(0.5, 1); tx.offset.set(i * 0.5, 0);
      const M = new Malha(5, 2, new THREE.MeshBasicMaterial({ map: tx, color: C.jornal, side: THREE.DoubleSide }), z + i * 0.0005); return M;
    });
    this.cor = new THREE.Color(C.jornal); this.corM = new THREE.Color(C.jornalMolhado);
  }
  /** st: { vis, cx, y, w, molhado 0..1, afunda 0..1, rasga 0..1 (separa e cai), chao } */
  pose(st) {
    this.metades.forEach((M, i) => {
      M.mesh.visible = st.vis; if (!st.vis) return;
      M.mesh.material.color.copy(this.cor).lerp(this.corM, st.molhado);
      const lado = i ? 1 : -1, rg = clamp(st.rasga), queda = ease.in(clamp((rg - 0.15) / 0.85));
      // centro de giro: a mão de cada lado; depois do rasgo a metade cai girando até o chão
      M.set((a, s) => {
        const q = (i + a) / 2, qq = 2 * q - 1;
        let x = st.cx + st.w * (q - 0.5), y = st.y + 0.03 * (1 - qq * qq) - st.afunda * 0.2 * (1 - qq * qq) - s * 0.095;
        // borda rasgada em zigue-zague
        if ((i === 0 && a > 0.99) || (i === 1 && a < 0.01)) x += (s % 0.5 < 0.25 ? 0.012 : -0.012) * Math.min(1, rg * 4);
        if (rg > 0) {
          // a metade fica pendurada na mão (balança pra baixo), depois cai virando e deita no chão
          const px0 = st.cx + lado * st.w * 0.5, py0 = st.y, sw = ease.out(clamp(rg / 0.3)), fall = ease.in(clamp((rg - 0.3) / 0.7));
          const px = px0 + lado * 0.22 * fall, py = lerp(py0, st.chao, fall);
          const ang = lado * lerp(1.35 * sw, Math.PI, fall), dx = x - px0, dy = (y - py0) * (1 - 0.7 * fall);
          x = px + dx * Math.cos(ang) - dy * Math.sin(ang); y = py + dx * Math.sin(ang) + dy * Math.cos(ang);
        }
        return [x, y];
      });
    });
  }
  abrigar(AB) { if (this.metades[0].mesh.visible) for (const M of this.metades) AB.malha(M); }
}

/* ------------------------------------------------------------------ cenário de chuva */
/** fundo distante: nuvens pesadas, cidade lilás com janelas acesas, mar escuro (fica bem atrás: parallax) */
export function fundoChuvoso() {
  const g = new THREE.Group(), z = -30;
  g.add(E.em(E.retBase(80, 1.0, '#6d6aa6'), 0, 0.4, z));
  for (let i = 0; i < 16; i++) g.add(E.em(E.ret(0.5 + 1.4 * hash(i), 0.045, '#8784bf', { r: 0.02 }), -9 + 18 * hash(i * 3.7), 0.6 + 0.6 * hash(i * 1.9), z + 0.01));
  for (let i = 0; i < 26; i++) {
    const bw = 0.8 + 1.3 * hash(i * 5.1), bh = 1.2 + 2.6 * hash(i * 2.3), x = -14 + i * 1.12 + hash(i) * 0.5;
    g.add(E.em(E.retBase(bw, bh, i % 3 ? C.cidade : C.cidade2), x, 1.3, z - 0.5));
    for (let j = 0; j < 6; j++) if (hash(i * 11 + j) > 0.55) g.add(E.em(E.ret(0.12, 0.16, C.janelaAcesa, { r: 0.02 }), x - bw * 0.3 + bw * 0.6 * hash(i * 7 + j * 3), 1.6 + (bh - 0.5) * hash(i * 3 + j * 5), z - 0.49));
  }
  for (let i = 0; i < 9; i++) {
    const nx = -9 + 18 * hash(i * 4.3 + 1), ny = 5.6 + 1.6 * hash(i * 2.9), k = 1.1 + 0.9 * hash(i), cor = i % 2 ? C.nuvem : C.nuvem2;
    g.add(E.em(E.ret(3.2 * k, 0.7 * k, cor, { r: 0.35 * k }), nx, ny, z - 0.2 - i * 0.01), E.em(E.circ(0.75 * k, cor), nx - 0.6 * k, ny + 0.35 * k, z - 0.205 - i * 0.01), E.em(E.circ(0.95 * k, cor), nx + 0.45 * k, ny + 0.45 * k, z - 0.205 - i * 0.01));
  }
  return g;
}
/** casa em corte com a porta (a parede da frente fica em x = xp; a casa é pra esquerda) */
export function casa(xp) {
  const g = new THREE.Group(), x1 = xp - 0.22, x0 = x1 - 3.4, h = 2.8;
  g.add(E.em(E.retBase(x1 - x0, h, C.parede), (x0 + x1) / 2, 0, -1.2));
  g.add(E.em(E.retBase(x1 - x0, 0.12, E.COR.rodape), (x0 + x1) / 2, 0, -1.19));
  g.add(E.em(E.ret(x1 - x0 + 0.3, 0.42, E.COR.madeira), (x0 + x1) / 2, -0.21, -0.6), E.em(E.ret(x1 - x0 + 0.3, 0.05, E.COR.madeiraEsc), (x0 + x1) / 2, -0.02, -0.59));
  // quadro e luminária acesa lá dentro
  g.add(E.em(E.ret(0.7, 0.55, E.COR.mostardaEsc), x1 - 1.2, 1.7, -1.19), E.em(E.ret(0.6, 0.45, '#bfe3e0'), x1 - 1.2, 1.7, -1.18), E.em(E.poli([[-0.3, -0.22], [-0.05, 0.08], [0.1, -0.05], [0.3, -0.22]], E.COR.verde), x1 - 1.2, 1.7, -1.17));
  g.add(E.em(E.traco([[0, 0], [0, -0.45]], 0.02, '#333333'), x1 - 0.55, h, -1.15), E.em(E.poli([[-0.17, 0], [0.17, 0], [0.1, 0.15], [-0.1, 0.15]], E.COR.mostarda), x1 - 0.55, h - 0.6, -1.14), E.em(E.circ(0.06, '#fff4c2'), x1 - 0.55, h - 0.62, -1.145));
  g.add(E.em(E.planta({ tam: 0.75 }), x1 - 2.4, 0, -1.0));
  // porta aberta (folha encostada lá dentro)
  g.add(E.em(E.retBase(0.12, 1.8, E.COR.petroleoEsc), x1 - 0.12, 0, -1.1), E.em(E.circ(0.022, E.COR.mostarda), x1 - 0.1, 0.95, -1.09));
  g.add(E.em(E.ret(0.5, 0.025, '#8a5a3c', { r: 0.01 }), xp - 0.45, 0.012, 0.05));   // tapete na entrada
  // parede da frente cortada: só a verga em cima da porta (vão de 1,80 m) + laje + marquise
  g.add(E.em(E.retBase(0.22, h + 0.2 - 1.8, C.paredeCorte), xp - 0.11, 1.8, 0.2));
  g.add(E.em(E.ret(0.24, 0.05, '#3a3145'), xp - 0.11, 1.8, 0.201));
  g.add(E.em(E.ret(x1 - x0 + 0.66, 0.22, C.paredeCorte), (x0 + xp) / 2 + 0.18, h + 0.11, 0.2));
  g.add(E.em(E.retBase(0.22, h + 0.2, C.paredeCorte), x0 - 0.11, -0.02, 0.2));
  g.add(E.em(E.ret(0.62, 0.07, E.COR.petroleo), xp + 0.2, 2.3, 0.19), E.em(E.ret(0.62, 0.025, E.COR.petroleoEsc), xp + 0.2, 2.255, 0.191));
  return g;
}
/** poste de luz da rua (acende no fim da tarde chuvosa) */
export function poste() {
  const g = new THREE.Group();
  g.add(E.retBase(0.07, 3.0, '#3b3f48'), E.em(E.ret(0.5, 0.06, '#3b3f48', { r: 0.03 }), -0.2, 3.0, 0.001));
  g.add(E.em(E.poli([[-0.18, 0], [0.18, 0], [0.11, 0.12], [-0.11, 0.12]], E.COR.petroleoEsc), -0.42, 2.86, 0.002));
  g.add(E.em(E.circ(0.075, '#fff1b8'), -0.42, 2.84, 0.001), E.em(E.circ(0.32, '#ffe9a8', { opacity: 0.22 }), -0.42, 2.8, -0.01));
  return g;
}
/** lixeira da calçada com guarda-chuvas quebrados saindo (a "primeira ventania") */
export function lixeira() {
  const g = new THREE.Group();
  g.add(E.em(E.poli([[-0.27, 0.9], [0.27, 0.9], [0.23, 0], [-0.23, 0]], C.lixeira), 0, 0, 0.02));
  g.add(E.em(E.poli([[-0.27, 0.9], [-0.12, 0.9], [-0.1, 0], [-0.23, 0]], C.lixeiraEsc), 0, 0, 0.021));
  for (let i = 0; i < 3; i++) g.add(E.em(E.ret(0.5 - i * 0.03, 0.035, '#e6eef7', { opacity: 0.5 }), 0, 0.25 + i * 0.22, 0.022));
  g.add(E.em(E.ret(0.62, 0.07, C.lixeiraEsc, { r: 0.03 }), 0, 0.92, 0.023));
  // guarda-chuvas quebrados: cabo torto + pano do avesso
  const quebrado = (x, ang, cor, cor2) => {
    const q = new THREE.Group();
    q.add(E.traco([[0, 0], [0, 0.42], [0.06, 0.62]], 0.022, C.cabo));
    q.add(E.em(E.poli([[0.06, 0.62], [-0.2, 0.86], [-0.08, 0.8], [0.02, 0.92], [0.1, 0.8], [0.26, 0.84]], cor), 0, 0, 0.001));
    q.add(E.em(E.poli([[0.06, 0.62], [0.02, 0.92], [0.1, 0.8]], cor2), 0, 0, 0.002));
    q.add(E.traco([[0.06, 0.62], [-0.24, 0.92]], 0.01, C.aco), E.traco([[0.06, 0.62], [0.3, 0.9], [0.36, 0.78]], 0.01, C.aco));
    q.position.set(x, 0.55, 0.0195); q.rotation.z = ang; return q;
  };
  g.add(quebrado(-0.08, 0.35, '#e9545a', '#c23b42'), quebrado(0.1, -0.3, '#7a78bf', '#5d5b9a'), quebrado(0.0, 0.05, E.COR.mostarda, E.COR.mostardaEsc));
  return g;
}
/** poça d'água com anéis que se abrem (os anéis são animados na cena) */
export function poca(larg) {
  const g = new THREE.Group();
  g.add(E.elipse(larg / 2, larg * 0.09, C.poca), E.em(E.elipse(larg * 0.3, larg * 0.035, C.pocaLuz), -larg * 0.08, 0.008, 0.001));
  g.userData.aneis = [0, 1, 2].map((i) => { const a = E.anel(0.8, 1, '#e6f0fb', { opacity: 0.8, unico: true }); a.scale.set(0.001, 0.001, 1); a.position.z = 0.002; g.add(a); return a; });
  return g;
}
