/* =====================================================================================
   OBJETOS 3D DA TRILHA NAS MONTANHAS (esculpidos por IA)
   const M = await carregarMontanha();   →   M.pilar(altura) · M.bau(largura)
   Cada chamada devolve uma CÓPIA (dividem malha e textura). Base em y = 0 (o pilar tem o TOPO em y = 0: pendure ele
   embaixo da plataforma), centrado em x/z.
   ===================================================================================== */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import PILAR from './pilar_glb.js';
import BAU from './bau_glb.js';

async function carregar(b64) {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
  const gltf = await new Promise((ok, erro) => new GLTFLoader().parse(bin, '', ok, erro));
  const m = gltf.scene;
  m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material) { o.material.metalness = 0; o.material.roughness = Math.max(0.5, o.material.roughness ?? 0.8); } } });
  const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3());
  const raiz = new THREE.Group(); raiz.add(m); m.position.set(-c.x, -box.min.y, -c.z);
  raiz.userData.tamanho = box.getSize(new THREE.Vector3());
  return raiz;
}
const falso = () => { const g = new THREE.Group(); g.userData.tamanho = new THREE.Vector3(1, 1, 1); return g; };

export async function carregarMontanha() {
  const [pil, bau] = globalThis.__DRYRUN__ ? [falso(), falso()] : await Promise.all([carregar(PILAR), carregar(BAU)]);
  const copia = (proto, medida, eixo = 'y') => { const g = proto.clone(true); g.scale.setScalar(medida / Math.max(0.001, proto.userData.tamanho[eixo])); return g; };
  return {
    /** pilar com o topo em y = 0 (a parte de baixo desce) */
    pilar: (altura = 8) => { const p = copia(pil, altura); const g = new THREE.Group(); p.position.y = -altura; g.add(p); g.userData.larguraTopo = pil.userData.tamanho.x * altura / Math.max(0.001, pil.userData.tamanho.y); return g; },
    bau: (largura = 1.0) => copia(bau, largura, 'x'),
  };
}
