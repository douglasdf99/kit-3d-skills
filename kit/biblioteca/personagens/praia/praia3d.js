/* =====================================================================================
   OBJETOS 3D DA PRAIA (esculpidos por IA)
   const P = await carregarPraia();   →   P.coqueiro(altura) · P.quiosque(altura) · P.guardaSol(altura) · P.deque(largura)
   Cada chamada devolve uma CÓPIA (as cópias dividem a malha e a textura, então dá pra espalhar dezenas).
   Base no chão (y = 0), centrado em x/z, frente pra +z.
   ===================================================================================== */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import COQUEIRO from './coqueiro_glb.js';
import QUIOSQUE from './quiosque_glb.js';
import GUARDASOL from './guardasol_glb.js';
import DEQUE from './deque_glb.js';

async function carregar(b64) {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
  const gltf = await new Promise((ok, erro) => new GLTFLoader().parse(bin, '', ok, erro));
  const m = gltf.scene;
  m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material) { o.material.metalness = 0; o.material.roughness = Math.max(0.55, o.material.roughness ?? 0.8); } } });
  // normaliza: base no chão, centrado
  const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3());
  const raiz = new THREE.Group(); raiz.add(m); m.position.set(-c.x, -box.min.y, -c.z);
  raiz.userData.tamanho = box.getSize(new THREE.Vector3());
  return raiz;
}
const caixaFalsa = () => { const g = new THREE.Group(); g.userData.tamanho = new THREE.Vector3(1, 1, 1); return g; };

export async function carregarPraia() {
  const seco = !!globalThis.__DRYRUN__;
  const [coq, qui, gua, deq] = seco ? [caixaFalsa(), caixaFalsa(), caixaFalsa(), caixaFalsa()]
    : await Promise.all([carregar(COQUEIRO), carregar(QUIOSQUE), carregar(GUARDASOL), carregar(DEQUE)]);
  const copia = (proto, medida, eixo = 'y') => { const g = proto.clone(true); const s = medida / Math.max(0.001, proto.userData.tamanho[eixo]); g.scale.setScalar(s); return g; };
  return {
    coqueiro: (altura = 3.2) => copia(coq, altura),
    quiosque: (altura = 2.6) => copia(qui, altura),
    guardaSol: (altura = 2.0) => copia(gua, altura),
    /** deque sextavado: largura total (de ponta a ponta) */
    deque: (largura = 2.7) => copia(deq, largura, 'x'),
    alturaDeque: (largura = 2.7) => deq.userData.tamanho.y * largura / Math.max(0.001, deq.userData.tamanho.x),
  };
}
