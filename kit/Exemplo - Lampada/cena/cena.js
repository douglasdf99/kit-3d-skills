/* =====================================================================================
   GABARITO — o vídeo da lâmpada (vídeo real da série, versão que foi postada)
   Use como referência de TUDO: como o roteiro vira âncoras (A), como cada problema é mostrado
   antes da solução, câmeras que nunca param, letreiros na hora do "Esse é o X", efeitos sonoros
   em cada ação, boneco reagindo (comemora, fica triste, queima a mão), final montando o objeto.
   Não copie a lâmpada: copie o JEITO de fazer.
   ===================================================================================== */
import * as THREE from 'three';
import { clamp, lerp, ease, prog, win, pop, hash, fract, mat, basic, mesh, box, rbox, cyl, sph, at, group, canvasPlane } from '../../sistema/motor/lib.js';
import * as B from '../../sistema/motor/modelos_base.js';
import { W, H, T, words, TL, scene, camera, sky, V, LOOK, FT, orb, fecharCameras, label, chip, banner, wpos, project, g2,
  configurarLegendas, fala, armIK, lerpAng, som, ambiente, iniciar } from '../../sistema/motor/video.js';
import * as M from './modelos.js';

/* ------------------------------------------------------------------ âncoras: o momento de cada fala (T = início da palavra) */
const A = {
  pilha: T('pilha'), palha: T('palha'), esquentam: T('esquentam'), brilham: T('brilham'), iluminam: T('iluminam'), fraquinha: T('fraquinha'), doisSeg: T('dois segundos'), reagem: T('reagem'), oxigenio: T('oxigenio'), queimam: T('queimam'), cinza: T('cinza'),
  poe: T('poe o fio'), bulbo: T('bulbo de vidro'), tira: T('tira todo'), semOx: T('brilha de novo') - 0.15, naoQueima: T('nao queima'), laDentro: T('porque la dentro'), vacuo: T('esse e o vacuo'),
  continuaFraca: T('continua fraca'), brilharForte: T('brilhar forte'), doisMil: T('dois mil'), milW: T('mil'), graus: T('graus'), quase: T('quase'), derreteu: T('derreteu'), temperatura: T('temperatura'),
  metalMais: T('o metal que mais'), tresMil: T('tres mil'), tungstenio: T('esse e o tungstenio'), fioBrilhando: T('esse fio'), filamento: T('e o filamento'),
  evaporando: T('evaporando'), gruda: T('gruda'), escuro: T('escuro'), afina: T('afina'), arrebentar: T('arrebentar'),
  enche: T('enche'), argonio: T('esse e o argonio'), atomos: T('os atomos'), empurram: T('empurram'), duraMais: T('dura muito'),
  abrir: T('abrir'), escapa: T('escapa'), oxEntra: T('oxigenio entra'), jaEra: T('ja era'), comprar: T('tem que comprar'), masGas: T('mas o gas'),
  roubaCalor: T('rouba calor'), brilhaMenos: T('brilha menos'), enrola: T('enrola o fio'), maisUmaVez: T('mais uma vez'), desseJeito: T('desse jeito'), meioMetro: T('meio metro'), doisCm: T('dois centimetros'),
  noventa: T('noventa'), viraCalor: T('vira calor'), cinco: T('so cinco'), viraLuz: T('vira luz'), queimaMao: T('queima a mao'),
  moderno: T('mais moderno'), troca: T('troca o fio'), chip: T('chip de cristal'), led: T('esse e o led'), azul: T('luz azul'), cobre: T('cobre ele'), po: T('um po'), amarelo: T('em amarelo'), gotinha: T('essa e a gotinha'), branco: T('vira branco'),
  rosca: T('rosca'), pino: T('um pino'), leitoso: T('bulbo leitoso'), agora: T('agora e so'), enroscar2: T('so enroscar'), queEsta: T('que esta ligado'), rede: T('rede eletrica'), acender: T('acender'),
  parabens: T('parabens'), construiu: T('construiu'), comente: T('comente'),
  end: words[words.length - 1].e,
};
A.burst = A.graus + 0.1;
A.travel0 = A.fioBrilhando - 0.35; A.travel1 = A.travel0 + 1.05;   // the tungsten block flies into the bulb and becomes the filament
A.oldIn = A.queimaMao - 1.55; A.oldOut = A.moderno - 0.75;          // the old lamp gag
A.touch = A.queimaMao + 0.02;                       // thermometer bursts on “…dois mil graus”
// final sequence timing (puppet screws the lamp in, walks to the switch, presses it)
A.step0 = A.agora - 0.6; A.fly0 = A.agora - 0.25; A.fly1 = A.agora + 0.45; A.raise1 = A.fly1 + 0.5; A.twist1 = A.raise1 + 0.7;
A.walk0 = A.twist1 + 0.2; A.walk1 = A.acender - 0.1; A.press0 = A.walk1 + 0.05; A.press1 = A.press0 + 0.3;
const DURATION = A.end + 0.3;           // corta logo depois da chamada final (loop limpo)

/* ------------------------------------------------------------------ fundo e luzes */
{ const x = sky.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1424'); g.addColorStop(1, '#1a2740'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
const hemi = new THREE.HemisphereLight(0xb9c9e6, 0x5a4a3a, 1.0); scene.add(hemi);
const moon = new THREE.DirectionalLight(0xcfdcff, 1.0); moon.position.set(-3, 5, -2); moon.target.position.set(0, 1, 0);
moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.bias = -0.0004; moon.shadow.normalBias = 0.02;
Object.assign(moon.shadow.camera, { left: -4, right: 4, top: 4, bottom: -3, near: 0.5, far: 20 }); scene.add(moon); scene.add(moon.target);
const fill = new THREE.DirectionalLight(0xffe9c8, 0.45); fill.position.set(3, 3, 4); scene.add(fill);
const filLight = new THREE.PointLight(0xffa040, 0, 4, 1.8); scene.add(filLight);
const roomLight = new THREE.PointLight(0xfff0d0, 0, 10, 1.6); scene.add(roomLight);

/* ------------------------------------------------------------------ world */
const room = M.buildRoom(); scene.add(room.group);
const DESK_Y = room.deskTop, DESK_Z = room.deskZ;
const person = B.buildPerson({ standing: true, look: LOOK }); person.position.set(0.55, 0.04, -1.5); person.rotation.y = -0.35; scene.add(person);
const HEAD_Y0 = person.userData.headP.position.y;
const DEMO = V(-0.25, 1.1, -0.85);           // base of the demo bulb (neck) above the desk
const battery = M.buildBattery(); battery.position.set(0.12, DESK_Y, -0.72); scene.add(battery);
const wool = M.buildSteelWool(); wool.position.set(-0.22, DESK_Y, -0.72); scene.add(wool);
const woolLight = new THREE.PointLight(0xffb060, 0, 6, 1.5); woolLight.position.set(-0.22, DESK_Y + 0.25, -0.72); scene.add(woolLight);
// the lamp parts live in one group so the finished lamp can be carried / flipped / screwed in as a whole
const lampG = new THREE.Group(); scene.add(lampG);
const bulb = M.buildBulb(1); bulb.position.copy(DEMO); lampG.add(bulb);
const FILC = V(DEMO.x, DEMO.y + 0.42, DEMO.z);   // filament centre
const filament = M.buildFilament(); filament.position.copy(FILC); lampG.add(filament);
const pump = M.buildPump(); pump.position.set(DEMO.x - 0.75, DESK_Y, -0.75); pump.visible = false; scene.add(pump);
const hoseCurve = new THREE.CatmullRomCurve3([V(DEMO.x - 0.72, DESK_Y + 0.16, -0.75), V(DEMO.x - 0.55, DESK_Y + 0.25, -0.8), V(DEMO.x - 0.2, DEMO.y - 0.05, -0.85), V(DEMO.x, DEMO.y, DEMO.z)]);
const hose = mesh(new THREE.TubeGeometry(hoseCurve, 40, 0.014, 8, false), pump.userData.hoseM, false, false); hose.visible = false; scene.add(hose);
// tungsten on a steel tray, in a fire
const FIRE_C = V(0.24, DESK_Y + 0.03, -0.5);
const tray = new THREE.Group(); tray.position.set(FIRE_C.x, DESK_Y, FIRE_C.z); tray.visible = false; scene.add(tray);
tray.add(at(cyl(0.17, 0.15, 0.03, 0x2b2d31, 28, { metalness: 0.6, roughness: 0.5 }), 0, 0.015, 0));
const coalM = new THREE.MeshStandardMaterial({ color: 0x2a1a12, emissive: 0xff5a10, emissiveIntensity: 1.2, roughness: 0.9 });
for (let i = 0; i < 26; i++) { const a = hash(i * 1.9) * 6.28, r = 0.04 + 0.1 * hash(i * 2.7); const c = mesh(new THREE.DodecahedronGeometry(0.014 + 0.01 * hash(i * 3.1)), coalM, false, false); c.position.set(Math.cos(a) * r, 0.032, Math.sin(a) * r); c.rotation.set(hash(i) * 3, hash(i * 5) * 3, 0); tray.add(c); }
const tungBlock = M.buildMetalBlock('', 0x80878f, 0.11); tungBlock.position.copy(FIRE_C); tungBlock.visible = false; scene.add(tungBlock);
tungBlock.userData.tag.visible = false;                      // label comes from the overlay (no serif canvas tag)
const flameTex = M.flameTexture();
const flames = [];
for (let i = 0; i < 52; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.visible = false; scene.add(s); flames.push(s); }
const fireLight = new THREE.PointLight(0xff7a2a, 0, 2.5, 1.6); fireLight.position.copy(FIRE_C).add(V(0, 0.18, 0.05)); scene.add(fireLight);
// compression demo: a long glowing wire (50 cm) that coils down to 2 cm
const demoM = new THREE.MeshStandardMaterial({ color: 0xff5a3a, emissive: 0xff4a1a, emissiveIntensity: 1.2, roughness: 0.4, metalness: 0.2 });
const demoWire = mesh(new THREE.TubeGeometry(M.filamentCurve(0, 0, 0.5), 300, 0.004, 8, false), demoM, false, false); demoWire.visible = false; scene.add(demoWire);
const glowTex = M.glowTexture();
const demoGlowM = new THREE.SpriteMaterial({ map: glowTex, color: 0xffc080, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const demoGlow = new THREE.Sprite(demoGlowM); demoGlow.visible = false; scene.add(demoGlow);
const demoLight = new THREE.PointLight(0xff8a50, 0, 3, 1.6); scene.add(demoLight);
const DEMO_W = V(1.6, 1.45, -0.55);               // off to the right, away from the lamp (and the puppet)
// house wiring: conduit from the pendant along the ceiling to the right wall, down to the breaker box, branch to the wall switch
const R = M.R;
const SOCK = room.socket.position.clone();
const condM = mat(0xe9e6df, { roughness: 0.7, flatShading: false });
const conduit = new THREE.Group(); conduit.visible = false; scene.add(conduit);
const CY = R.h - 0.02, BZ = R.z0 + 0.025;                       // ceiling height, back-wall line
const SW = V(1.1, 1.3, R.z0 + 0.02);                           // wall switch on the back wall, near the desk
const BRK = V(2.3, 1.3, R.z0 + 0.06);                          // breaker box (quadro de luz) on the back wall
const tube = (a, b) => { const d = b.clone().sub(a), L = d.length(); const c = cyl(0.014, 0.014, L, condM, 10); c.position.copy(a).add(b).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); conduit.add(c); return c; };
tube(V(SOCK.x, CY, SOCK.z), V(SOCK.x, CY, BZ));               // pendant → back wall (ceiling)
tube(V(SOCK.x, CY, BZ), V(BRK.x, CY, BZ));                     // along the top of the back wall
tube(V(BRK.x, CY, BZ), V(BRK.x, BRK.y + 0.17, BZ));            // down to the breaker box
tube(V(SW.x, SW.y + 0.06, BZ), V(SW.x, CY, BZ));               // switch up to the line
const breaker = new THREE.Group(); breaker.position.copy(BRK); breaker.rotation.y = Math.PI / 2; breaker.add(rbox(0.12, 0.34, 0.5, 0.01, 0xd9d9d3)); breaker.add(at(rbox(0.02, 0.26, 0.4, 0.005, 0x3b3f45), -0.06, 0, 0));
for (let i = 0; i < 4; i++) breaker.add(at(box(0.02, 0.06, 0.035, 0x1d1f23), -0.075, 0.08 - i * 0.055, 0.05)); breaker.visible = false; scene.add(breaker);
const wallSwitch = M.buildSwitch(); wallSwitch.position.copy(SW); wallSwitch.visible = false; scene.add(wallSwitch);
// the current goes THROUGH the wall switch (down the switch drop and back up), then along to the pendant and down its cord
const CPATH = [V(BRK.x, BRK.y + 0.17, BZ), V(BRK.x, CY, BZ), V(SW.x + 0.012, CY, BZ), V(SW.x + 0.012, SW.y + 0.06, BZ), V(SW.x - 0.012, SW.y + 0.06, BZ), V(SW.x - 0.012, CY, BZ), V(SOCK.x, CY, BZ), V(SOCK.x, CY, SOCK.z), V(SOCK.x, SOCK.y + 0.05, SOCK.z)];
const CLEN = []; let CTOT = 0; for (let i = 1; i < CPATH.length; i++) { CLEN.push(CPATH[i].distanceTo(CPATH[i - 1])); CTOT += CLEN[i - 1]; }
let D_SW = 0; for (let i = 0; i < 3; i++) D_SW += CPATH[i + 1].distanceTo(CPATH[i]);      // distance from the breaker to the switch
function onConduit(u, out) { let d = u * CTOT; for (let i = 0; i < CLEN.length; i++) { if (d <= CLEN[i] || i === CLEN.length - 1) return out.copy(CPATH[i]).lerp(CPATH[i + 1], clamp(d / CLEN[i])); d -= CLEN[i]; } }
const current = (() => { const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe14a, toneMapped: false }), 80); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.count = 0; scene.add(m); return m; })();
// a real LED bulb — board with the chips at the bottom of the bulb (on a white body), the driver inside the screw base
const led = M.buildLEDModule(); const LEDP = V(DEMO.x, DEMO.y + M.LED_BOARD_Y, DEMO.z); led.position.copy(LEDP); led.visible = false; lampG.add(led);
const driver = M.buildDriver(); const DRV_P = V(DEMO.x, DEMO.y - 0.075, DEMO.z + 0.004); driver.position.copy(DRV_P); driver.visible = false; lampG.add(driver);
const screw = M.buildScrewBase(1); screw.position.copy(DEMO); screw.visible = false; lampG.add(screw);
const PIN_Y = screw.userData.pin.position.y;
// after the LED swap the glass is only the dome above the white body (the old neck is gone)
const lowerGlass = bulb.userData.shell.children.filter((c) => c.isMesh && bulb.userData.glassMs.includes(c.material));
for (const m of lowerGlass) m.userData.fullGeo = m.geometry;
const domeGlassGeo = (() => {
  const pr = M.bulbProfile(1), y0 = M.LED_BOARD_Y, SPLIT = 7; const pts = [];
  for (let i = 1; i < pr.length; i++) { const a = pr[i - 1], b = pr[i]; if (a.y <= y0 && b.y > y0) pts.push(new THREE.Vector2(lerp(a.x, b.x, (y0 - a.y) / (b.y - a.y)), y0)); if (b.y > y0) pts.push(b.clone()); }
  const nLow = pts.findIndex((v) => Math.abs(v.y - pr[SPLIT].y) < 1e-6) + 1;
  const full = new THREE.LatheGeometry(pts, 48), geo = new THREE.LatheGeometry(pts.slice(0, nLow), 48), fn = full.attributes.normal, nn = geo.attributes.normal;
  for (let i = 0; i <= 48; i++) for (let j = 0; j < nLow; j++) { const a = i * nLow + j, b = i * pts.length + j; nn.setXYZ(a, fn.getX(b), fn.getY(b), fn.getZ(b)); }
  return geo;
})();
// the milky diffuser only covers the dome above the LED board (the body below is white plastic)
{ const pr = M.bulbProfile(1.012), y0 = M.LED_BOARD_Y - 0.006; const pts = []; for (let i = 1; i < pr.length; i++) { const a = pr[i - 1], b = pr[i]; if (a.y <= y0 && b.y > y0) pts.push(new THREE.Vector2(lerp(a.x, b.x, (y0 - a.y) / (b.y - a.y)), y0)); if (b.y > y0) pts.push(b.clone()); }
  bulb.userData.milk.geometry.dispose(); bulb.userData.milk.geometry = new THREE.LatheGeometry(pts.map((v) => new THREE.Vector2(v.x, v.y + 0.006)), 48); }
// LED light: beams that start narrow at the chip and open up away from it
const beamTex = M.beamTexture();
const beamMat = (c) => new THREE.MeshBasicMaterial({ color: c, map: beamTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
const rayMatB = beamMat(0x3f8cff), rayMatY = beamMat(0xffd34a), rayMatW = beamMat(0xfff6e6), coneMatW = beamMat(0xfff3dc);
const rayGeo = new THREE.CylinderGeometry(0.035, 0.004, 1, 14, 1, true); rayGeo.translate(0, 0.5, 0);
const wRayGeo = new THREE.CylinderGeometry(0.075, 0.006, 1, 16, 1, true); wRayGeo.translate(0, 0.5, 0);
const coneGeo = new THREE.CylinderGeometry(0.3, 0.012, 1, 32, 1, true); coneGeo.translate(0, 0.5, 0);
const rays = [], wRays = [];
for (let i = 0; i < 7; i++) { const r = mesh(rayGeo, i % 2 ? rayMatY : rayMatB, false, false); r.visible = false; scene.add(r); rays.push(r); }
for (let i = 0; i < 9; i++) { const r = mesh(wRayGeo, rayMatW, false, false); r.visible = false; scene.add(r); wRays.push(r); }
const whiteCone = mesh(coneGeo, coneMatW, false, false); whiteCone.visible = false; scene.add(whiteCone);
const ledGlowM = new THREE.SpriteMaterial({ map: glowTex, color: 0x4f8dff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const ledGlow = new THREE.Sprite(ledGlowM); scene.add(ledGlow);
// vacuum: a softly pulsing coloured fill inside the bulb
const vacM = new THREE.ShaderMaterial({
  uniforms: { uA: { value: 0 }, uC: { value: new THREE.Color(0x4fd8ff) } },
  vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform float uA; uniform vec3 uC; varying vec3 vN; varying vec3 vW; void main(){ vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW); float fr = pow(1.0 - abs(dot(n, v)), 1.6); gl_FragColor = vec4(uC * (0.75 + 0.6 * fr), uA * (0.35 + 0.65 * fr));
#include <colorspace_fragment>
  }`,
  transparent: true, depthWrite: false, side: THREE.FrontSide,
});
const vacFill = mesh(new THREE.LatheGeometry(M.bulbProfile(0.955).map((v) => new THREE.Vector2(v.x, v.y + 0.012)), 48), vacM, false, false);
vacFill.renderOrder = 5; vacFill.visible = false; bulb.userData.shell.add(vacFill);
// the old incandescent lamp that appears only for "lâmpada velha queima a mão"
const OLD = V(1.0, 1.6, -1.3);                                  // bulb centre
const oldLamp = new THREE.Group(); oldLamp.visible = false; scene.add(oldLamp);
const oldHang = new THREE.Group(); oldLamp.add(oldHang);        // drops from the ceiling
const OLD_S = 0.3, OLD_SOCK_Y = OLD.y + 0.12;
const oldCord = cyl(0.006, 0.006, 1, 0x1e1e1e, 6); oldLamp.add(oldCord);
oldHang.add(at(cyl(0.032, 0.036, 0.06, 0x1d1f23, 16), 0, OLD_SOCK_Y + 0.03, 0));
oldHang.add(at(cyl(0.022, 0.022, 0.045, mat(0xc9a43a, { metalness: 0.8, roughness: 0.35, flatShading: false }), 16), 0, OLD_SOCK_Y - 0.02, 0));
const oldGlassM = new THREE.MeshStandardMaterial({ color: 0xfff3d2, emissive: 0xffc35a, emissiveIntensity: 1.5, roughness: 0.35, transparent: true, opacity: 0.96 });
const oldGlass = mesh(new THREE.LatheGeometry(M.bulbProfile(OLD_S), 32), oldGlassM, false, false); oldGlass.rotation.x = Math.PI; oldGlass.position.y = OLD_SOCK_Y - 0.035; oldHang.add(oldGlass);
const oldGlowM = new THREE.SpriteMaterial({ map: glowTex, color: 0xffd28a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const oldGlow = new THREE.Sprite(oldGlowM); oldHang.add(oldGlow);
const oldLight = new THREE.PointLight(0xffc070, 0, 2.6, 1.6); oldHang.add(oldLight);
// 'modern' glasses: a glowing visor that snaps onto the puppet's face
const visor = new THREE.Group(); visor.visible = false;
const visorM = new THREE.MeshStandardMaterial({ color: 0x2ad4ff, emissive: 0x18b8ff, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.2, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
const rimM = new THREE.MeshStandardMaterial({ color: 0xff3dd6, emissive: 0xff2ac8, emissiveIntensity: 1.0, metalness: 0.4, roughness: 0.3, side: THREE.DoubleSide });
visor.add(mesh(new THREE.CylinderGeometry(0.189, 0.189, 0.07, 36, 1, true, -1.3, 2.6), visorM, false, false));
for (const y of [-0.036, 0.036]) visor.add(at(mesh(new THREE.CylinderGeometry(0.193, 0.193, 0.009, 36, 1, true, -1.32, 2.64), rimM, false, false), 0, y, 0));
person.userData.headP.add(visor); visor.position.set(0, 0.025, 0);

/* ------------------------------------------------------------------ particles */
// partículas: muitas cópias da mesma bolinha/peça (InstancedMesh). Cor por partícula em setInst (sem cor = branco = cor do material)
function inst(n, material, geo) { const m = new THREE.InstancedMesh(geo, material, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); const w = new THREE.Color(1, 1, 1); for (let i = 0; i < n; i++) m.setColorAt(i, w); m.frustumCulled = false; m.count = 0; scene.add(m); return m; }
const sphGeo = new THREE.SphereGeometry(1, 10, 8);
const o2 = inst(120, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), sphGeo);
const flecks = inst(60, new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }), new THREE.BoxGeometry(1, 1, 1));
const watoms = inst(90, new THREE.MeshStandardMaterial({ color: 0xbfc4c9, roughness: 0.5, metalness: 0.3 }), sphGeo);
const argon = inst(70, new THREE.MeshStandardMaterial({ color: 0xb48cff, roughness: 0.4, transparent: true, opacity: 0.85 }), sphGeo);
const sparks = inst(90, new THREE.MeshBasicMaterial({ color: 0xffd080, toneMapped: false }), sphGeo);
const stuck = inst(90, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.2 }), sphGeo);
const heatTok = inst(50, new THREE.MeshStandardMaterial({ color: 0xff7a2f, transparent: true, opacity: 0.6, emissive: 0xff5a00, emissiveIntensity: 0.4, depthWrite: false }), new THREE.IcosahedronGeometry(1, 1));
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3(), tmpC = new THREE.Color();
function setInst(im, i, p, s, color) { tmpS.set(s, s, s); tmpM.compose(p, tmpQ.identity(), tmpS); im.setMatrixAt(i, tmpM); if (color) im.setColorAt(i, color); }
function finishInst(im, n) { im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }

/* ------------------------------------------------------------------ state helpers */
function filamentState(t) {
  // glow 0..1 (brightness), radius, gap, k1, k2, visible
  let glow = 0, radius = 0.0035, gap = 0, vis = t > A.poe - 0.05, burnt = false;
  if (t > A.semOx) glow = 0.55 * prog(t, A.semOx + 0.2, 0.5);                    // weak light in the vacuum bulb
  if (t > A.brilharForte - 0.2) glow = 0.55 + 0.75 * prog(t, A.brilharForte - 0.1, 1.2);  // pushed hotter
  if (t > A.doisMil && t < A.tungstenio - 0.4) glow = 1.3 - 0.9 * prog(t, A.derreteu - 0.2, 0.6);      // wire melts away
  if (t > A.derreteu + 0.2 && t < A.travel1) vis = false;                     // (molten) until the tungsten block arrives
  if (t >= A.travel1) glow = 1.3 * prog(t, A.travel1, 0.35);
  const thin = prog(t, A.afina - 0.2, 1.2, ease.inOut);
  if (t > A.evaporando - 0.3 && t < A.enche - 0.2) { radius = lerp(0.0035, 0.0012, thin); }
  const broke = t > A.arrebentar + 0.1 && t < A.enche + 0.3;
  if (broke) { gap = 0.012; glow = 0; burnt = true; }
  // opened lamp: air gets in, the filament flares and burns out
  if (t > A.oxEntra + 0.25 && t < A.masGas) {
    glow = 1.3 + 1.5 * prog(t, A.oxEntra + 0.25, 0.35);
    if (t > A.jaEra - 0.25) { gap = 0.016; glow = 0; burnt = true; }
  }
  if (t > A.roubaCalor && t < A.enrola) glow = 1 - 0.4 * prog(t, A.brilhaMenos - 0.2, 0.8);
  if (t > A.enrola) glow = 0.6 + 0.6 * prog(t, A.desseJeito + 0.6, 1.2);
  const k1 = prog(t, A.enrola + 0.1, 1.3, ease.inOut), k2 = prog(t, A.maisUmaVez + 0.05, 1.3, ease.inOut);
  const toLed = prog(t, A.troca + 0.15, 0.6);
  if (toLed > 0) { glow *= 1 - toLed; vis = toLed < 0.98; }
  return { glow, radius, gap, k1, k2, vis, burnt };
}


/* ------------------------------------------------------------------ câmera: uma tomada por momento (sempre se mexendo) */
const BULB = V(DEMO.x, DEMO.y + 0.33, DEMO.z);
const WOOL = V(-0.22, DESK_Y + 0.08, -0.72);
const GLASS_EDGE = V(DEMO.x + 0.168, DEMO.y + 0.42, DEMO.z);   // the bulb's right-hand glass wall at filament height
const PROF = M.bulbProfile(1);
function profR(y) { for (let i = 1; i < PROF.length; i++) if (y <= PROF[i].y) { const a = PROF[i - 1], b = PROF[i]; return lerp(a.x, b.x, (y - a.y) / (b.y - a.y)); } return 0; }
orb(0, V(0.1, 1.15, -0.9), 8, 10, 3.6, 50, 0, 0.05);
orb(A.pilha - 0.3, V(-0.1, DESK_Y + 0.12, -0.72), -4, 20, 1.5, 40, 1.0);         // battery + steel wool, both in frame
orb(A.iluminam - 0.2, V(0.165, 1.15, -1.11), -5, 8, 2.7, 46, 1.1);                   // the room, lit by the wool — puppet celebrates
orb(A.fraquinha - 0.1, V(0.18, 1.2, -1.15), -5, -2, 2.3, 44, 0.9);                   // light fades — puppet is sad
orb(A.reagem - 0.2, WOOL.clone().add(V(0, 0.04, 0)), 14, 24, 0.6, 40, 0.9);        // oxygen hitting the wires
orb(A.poe - 0.55, FILC.clone().add(V(0, -0.06, 0)), 14, 8, 0.8, 40, 0.9);              // the filament flies onto its posts
orb(A.bulbo - 0.25, BULB, 14, 10, 1.3, 40, 0.6);                                      // the glass comes down over it
orb(A.tira - 0.3, V(-0.66, 1.16, -0.8), -50, 12, 2.0, 40, 0.9);                       // pump + hose + bulb: the pump pulls the air out
orb(A.semOx - 0.45, FILC.clone().add(V(0, -0.02, 0)), 16, 10, 0.75, 40, 0.9);    // the filament glows again and doesn't burn
orb(A.vacuo - 0.2, BULB, 18, 12, 1.0, 40, 0.9);
orb(A.continuaFraca - 0.5, V(0.15, 1.28, -1.1), -4, 6, 2.75, 46, 0.8);            // wide: the room barely lit, puppet sad
orb(A.brilharForte - 0.05, V(0.0, 1.38, -0.85), 4, 6, 1.9, 40, 0.9);                 // bulb on the left, thermometer overlay on the right
orb(A.metalMais - 0.3, FIRE_C.clone().add(V(0, 0.16, 0)), 25, 16, 1.05, 40, 0.9);  // tungsten in the fire (speech balloon above)
orb(A.fioBrilhando - 0.55, V(0.0, 1.22, -0.7), 18, 12, 1.75, 40, 0.8);             // zoom out: the block flies into the bulb
orb(A.filamento - 0.35, FILC, 16, 8, 0.45, 40, 0.9);                                // zoom in: it became the filament
orb(A.evaporando - 1.2, FILC, 34, 14, 0.75, 40, 2.4);                               // slow pull-back while it evaporates
orb(A.gruda - 0.35, GLASS_EDGE.clone().add(V(-0.06, 0, 0)), 4, 5, 0.45, 40, 0.8);  // close on the glass wall: atoms stick to it
orb(A.escuro - 0.2, GLASS_EDGE.clone().add(V(-0.05, 0.02, 0)), 18, 8, 0.62, 40, 0.7);
orb(A.afina - 0.3, FILC, 20, 6, 0.4, 40, 0.9);
orb(A.enche - 0.3, BULB, 14, 10, 1.15, 40, 1.0);
orb(A.argonio - 0.3, BULB, -12, 14, 1.0, 40, 1.6);
orb(A.empurram - 0.65, FILC.clone().add(V(0.012, 0, 0)), 24, 8, 0.24, 40, 0.9);   // very close: argon bounces the tungsten back
orb(A.duraMais - 0.35, BULB, 16, 10, 1.25, 40, 1.0);
orb(A.abrir - 0.3, BULB.clone().add(V(0, 0.12, 0)), 10, 12, 1.5, 40, 0.8);           // the lamp is opened: argon escapes
orb(A.masGas, FILC, 18, 8, 0.5, 40, 0);                                              // hard cut back to an intact lamp
orb(A.maisUmaVez - 0.2, FILC, 22, 10, 0.3, 40, 0.9);
orb(A.desseJeito - 0.3, DEMO_W, -8, 8, 1.75, 40, 1.1, 0.06, { spin: 0.012 });         // the 50 cm wire demo: the whole wire fits, margins on both sides
orb(A.doisCm + 0.3, DEMO_W, -8, 12, 0.6, 40, 0.6, 0.07, { spin: 0.03 });
orb(A.noventa - 0.3, BULB, 12, 8, 1.4, 40, 1.1);
orb(A.cinco - 0.8, BULB, -16, 14, 1.25, 40, 1.8);
orb(A.oldIn - 0.35, V(0.8, 1.5, -1.4), -15, 4, 2.25, 44, 0.9);                    // camera goes right: an old lamp appears, puppet burns his hand
orb(A.moderno - 1.0, V(0.0, 1.5, -1.0), -8, 6, 2.0, 50, 1.0);                       // back to our lamp; puppet puts on 'modern' glasses
orb(A.troca - 0.3, DEMO.clone().add(V(0, 0.56, 0)), 18, 10, 1.75, 40, 1.0);           // the glass lifts, the old filament goes, the LED board comes in
orb(A.chip + 0.85, LEDP.clone().add(V(0, 0.07, 0)), 16, 26, 0.8, 40, 1.4);          // closer: the board at the bottom of the bulb
orb(A.led - 0.2, LEDP.clone().add(V(0, 0.012, 0)), 22, 40, 0.34, 40, 0.9);          // the chip, seen from above
orb(A.azul - 0.3, LEDP.clone().add(V(0, 0.07, 0)), 16, 16, 0.85, 40, 1.0);
orb(A.branco + 0.1, LEDP.clone().add(V(0, 0.1, 0)), 24, 34, 0.75, 40, 1.1);        // white light; the rest of the chips light up on the board
orb(A.rosca - 0.3, DEMO.clone().add(V(0, -0.03, 0)), 14, 6, 0.75, 40, 1.0);         // the screw base goes on
orb(A.pino - 0.25, DEMO.clone().add(V(0, -0.11, 0)), 18, -16, 0.62, 40, 0.8);       // the pin goes on the tip
orb(A.leitoso - 0.3, BULB, 14, 8, 1.45, 40, 0.9);
orb(A.agora - 0.45, V(-0.02, 1.52, -1.3), 40, 2, 1.95, 46, 1.0);                     // puppet screws the lamp into the socket
orb(A.queEsta - 0.15, V(0.95, 1.55, -2.0), -4, 3, 4.6, 56, 1.2);                     // conduit → breaker; puppet walks to the switch
orb(A.acender - 0.55, V(1.1, 1.32, -2.33), 62, 3, 1.85, 44, 0.9);                  // presses the switch
orb(A.parabens - 0.25, V(0.45, 1.4, -1.5), 8, 6, 3.4, 50, 1.0, 0.03, { spin: -0.07, bob: 0.5 });   // slow 3D orbit around the lit lamp
fecharCameras({ duracao: DURATION, aberturaAte: A.reagem, finalDesde: A.parabens - 1 });   // abertura mexe um pouco mais; tomadas longas giram no máximo ~12°

/* ------------------------------------------------------------------ letreiros (nome da peça) e plaquinhas (informação) */
chip('PILHA 9 V', A.pilha, A.esquentam + 0.3, () => battery.position.clone().add(V(0.12, 0.1, 0)), '#2f8cff', { dy: 40 });
chip('PALHA DE AÇO', A.palha, A.esquentam + 0.3, () => wool.position.clone().add(V(0, 0.22, 0)), '#6b7280', { dy: -50 });
chip('FRAQUINHA', A.fraquinha, A.reagem - 0.2, () => WOOL.clone().add(V(0, 0.15, 0)), '#6b7280', { dy: -50 });
chip('OXIGÊNIO', A.oxigenio - 0.1, A.cinza + 0.8, () => WOOL.clone().add(V(0.06, 0.12, 0)), '#ff3b2f', { dy: -60 });
chip('FIO', A.poe, A.bulbo + 0.2, wpos(filament, V(0, 0.03, 0)), '#e0782a', { dy: -60 });
chip('BULBO DE VIDRO', A.bulbo, A.tira - 0.2, () => BULB.clone().add(V(0, 0.2, 0)), '#2f8cff', { dy: -70 });
chip('NÃO QUEIMA', A.naoQueima - 0.05, A.vacuo - 0.3, () => FILC.clone().add(V(0, 0.04, 0)), '#22b35e', { dy: -80 });
chip('SEM OXIGÊNIO', A.laDentro, A.vacuo - 0.3, () => FILC.clone().add(V(0, -0.04, 0)), '#6b7280', { dy: 80 });
label('VÁCUO', A.vacuo, A.vacuo + 1.6, () => BULB.clone().add(V(0, 0.2, 0)), { dy: -80 });
chip('3400 °C', A.tresMil - 0.05, A.tungstenio - 0.1, () => FIRE_C.clone().add(V(0, 0.36, 0)), '#ff3b2f', { dy: -60 });
label('TUNGSTÊNIO', A.tungstenio, A.tungstenio + 1.5, () => FIRE_C.clone().add(V(0, 0.33, 0)), { dy: -80, size: 60 });
label('FILAMENTO', A.filamento, A.filamento + 1.6, () => FILC.clone().add(V(0, 0.04, 0)), { dy: -90 });
chip('EVAPORA', A.evaporando, A.gruda - 0.4, () => FILC.clone().add(V(0.06, 0.05, 0)), '#6b7280', { dy: -60 });
chip('GRUDA NO VIDRO', A.gruda + 0.1, A.escuro - 0.15, () => GLASS_EDGE.clone().add(V(-0.02, 0.07, 0)), '#6b7280', { dy: -60 });
chip('VIDRO ESCURO', A.escuro - 0.05, A.afina - 0.2, () => BULB.clone().add(V(0.1, 0.15, 0)), '#1e1e1e', { dy: -70 });
chip('FIO FINO', A.afina + 0.3, A.arrebentar + 1.0, () => FILC.clone().add(V(0, 0.03, 0)), '#ff3b2f', { dy: -60 });
label('ARGÔNIO', A.argonio, A.argonio + 1.5, () => BULB.clone().add(V(0, 0.2, 0)), { dy: -80 });
chip('EMPURRA DE VOLTA', A.empurram + 0.1, A.duraMais - 0.4, () => FILC.clone().add(V(0.0, 0.045, 0)), '#8b5cf6', { dy: -60 });
chip('DURA MUITO MAIS', A.duraMais - 0.05, A.abrir - 0.4, () => BULB.clone().add(V(0, 0.28, 0)), '#22b35e', { dy: -60 });
chip('ARGÔNIO ESCAPA', A.escapa - 0.1, A.oxEntra - 0.1, () => BULB.clone().add(V(0.05, 0.42, 0)), '#8b5cf6', { dy: -40 });
chip('OXIGÊNIO ENTRA', A.oxEntra - 0.05, A.jaEra + 0.1, () => BULB.clone().add(V(0.05, 0.42, 0)), '#ff3b2f', { dy: -40 });
chip('TEM QUE COMPRAR OUTRA', A.comprar - 0.1, A.masGas - 0.15, null, '#ff3b2f', { screen: [W / 2, 420], size: 50 });
chip('MOLINHA', A.enrola + 0.5, A.maisUmaVez + 0.3, () => FILC.clone().add(V(0, 0.03, 0)), '#d9a400', { dy: -70 });
chip('MOLINHA DA MOLINHA', A.maisUmaVez + 0.5, A.desseJeito - 0.2, () => FILC.clone().add(V(0, 0.02, 0)), '#d9a400', { dy: -70 });
chip('50 cm DE FIO', A.desseJeito + 0.2, A.doisCm - 0.05, () => DEMO_W.clone().add(V(0, 0.08, 0)), '#ff3b2f', { dy: -70 });
chip('CABE EM 2 cm', A.doisCm, A.noventa - 0.3, () => DEMO_W.clone().add(V(0, 0.06, 0)), '#2f8cff', { dy: -80 });
chip('AI!', A.touch + 0.08, A.oldOut - 0.1, () => OLD.clone().add(V(0.02, 0.05, 0)), '#ff3b2f', { dy: -40, size: 60 });
label('LED', A.led, A.led + 1.5, () => LEDP.clone().add(V(0, 0.02, 0)), { dy: -330 });
chip('SÓ AZUL', A.azul, A.cobre - 0.2, () => LEDP.clone().add(V(0.06, 0.25, 0)), '#2f8cff', { dy: -50 });
chip('PÓ AMARELO', A.po - 0.05, A.gotinha - 0.1, () => LEDP.clone().add(V(0.05, 0.02, 0)), '#d9a400', { dy: -150 });
label('GOTINHA AMARELA', A.gotinha, A.gotinha + 1.7, () => LEDP.clone().add(V(0.0, 0.02, 0)), { dy: -190, size: 56 });
chip('CIRCUITO', A.rosca - 0.3, A.rosca + 0.4, () => DRV_P.clone().add(V(-0.13, 0.0, 0)), '#16a34a', { dy: 0, size: 40 });
banner('AZUL + AMARELO = BRANCO', A.branco - 0.1, A.rosca - 0.2, { size: 58 });
chip('ROSCA', A.rosca + 0.1, A.pino - 0.1, () => DEMO.clone().add(V(0.08, -0.07, 0)), '#d9a400', { dy: 60 });
chip('PINO', A.pino + 0.1, A.leitoso - 0.1, () => DEMO.clone().add(V(0.12, -0.17, 0)), '#6b7280', { dy: -110 });
chip('BULBO LEITOSO', A.leitoso + 0.1, A.agora - 0.3, () => BULB.clone().add(V(0.1, 0.1, 0)), '#e5e7eb', { dy: -60 });
chip('REDE ELÉTRICA DA CASA', A.rede - 0.05, A.acender - 0.4, () => breaker.position.clone().add(V(0, 0.3, 0)), '#ffd21f', { dy: -60 });
chip('QUADRO DE LUZ', A.rede + 0.9, A.acender - 0.4, () => breaker.position.clone().add(V(0, -0.1, 0)), '#6b7280', { dy: 70 });
chip('INTERRUPTOR', A.acender - 0.1, A.parabens - 0.3, () => SW.clone().add(V(0, 0.12, 0)), '#2f8cff', { dy: -60 });
label('LÂMPADA', A.construiu + 0.3, A.comente - 0.15, () => SOCK.clone().add(V(0, -0.35, 0)), { dy: 0, size: 70 });
banner('COMENTE “LUZ”', A.comente + 0.05, DURATION + 1, { screen: [W / 2, 330], size: 92, rot: -0.06, semPop: true });
// legenda: estas palavras ficam na cor de destaque; nomes de peça só quando estão sendo nomeados ("é o filamento")
configurarLegendas({ destaque: ['parabens'], nomes: ['tungstenio', 'filamento', 'argonio', 'led', 'vacuo', 'gotinha'], linhas: { lampada: -2, luz: -1 } });

function drawEnergyBar(t) {
  // v5 sequence: the empty bar appears → it fills (95%) → "95% CALOR" pops in on "calor" → the 5% light slice forms → "5% LUZ" on "luz"
  const s = pop(t, A.noventa + 0.45, A.oldIn - 0.15, 0.4); if (s <= 0.001) return;      // pops once the camera is back on the bulb
  const k = prog(t, A.noventa + 0.75, A.viraCalor - A.noventa - 0.8, ease.inOut);
  const tCal = pop(t, A.viraCalor + 0.25, Infinity, 0.3);
  const kL = prog(t, A.cinco + 0.05, 0.55, ease.out);                         // the yellow slice grows
  const tLuz = pop(t, A.viraLuz + 0.25, Infinity, 0.3);
  g2.save(); g2.translate(W / 2, 520); g2.scale(s, s);
  const bw = 760, bh = 110;
  g2.fillStyle = 'rgba(255,255,255,0.94)'; g2.beginPath(); g2.roundRect(-bw / 2 - 40, -bh / 2 - 60, bw + 80, bh + 160, 30); g2.fill();
  g2.fillStyle = '#e9e9e9'; g2.beginPath(); g2.roundRect(-bw / 2, -bh / 2, bw, bh, 22); g2.fill();
  g2.save(); g2.beginPath(); g2.roundRect(-bw / 2, -bh / 2, bw, bh, 22); g2.clip();
  g2.fillStyle = '#ef4444'; g2.fillRect(-bw / 2, -bh / 2, bw * 0.95 * k, bh);
  if (k > 0.02 && k < 0.999) { g2.fillStyle = 'rgba(255,255,255,0.35)'; g2.fillRect(-bw / 2 + bw * 0.95 * k - 10, -bh / 2, 10, bh); }
  if (kL > 0) {
    const x0 = -bw / 2 + bw * 0.95, sw = bw * 0.05 * kL;
    g2.fillStyle = '#ffd21f'; g2.fillRect(x0, -bh / 2, sw, bh);
    const glow = win(t, A.cinco + 0.05, A.viraLuz + 0.6, 0.15, 0.5) * (0.6 + 0.4 * Math.sin(t * 14));
    g2.fillStyle = `rgba(255,255,255,${0.5 * glow})`; g2.fillRect(x0, -bh / 2, sw, bh);
  }
  g2.restore();
  // little sparkles while the 5% slice forms
  if (kL > 0 && kL < 1) { g2.fillStyle = '#ffd21f'; for (let i = 0; i < 6; i++) { const a = i * 1.05 + t * 4, r = 40 + 30 * kL; g2.beginPath(); g2.arc(bw / 2 - bw * 0.025 + Math.cos(a) * r, Math.sin(a) * r * 0.7, 7 * (1 - kL) + 2, 0, 7); g2.fill(); } }
  g2.fillStyle = '#1e1e1e'; g2.font = `800 36px ${FT}`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText('ENERGIA DA LÂMPADA', 0, -bh / 2 - 30);
  if (tCal > 0.001) { g2.save(); g2.translate(-bw * 0.05, 0); g2.scale(tCal, tCal); g2.font = `900 54px ${FT}`; g2.fillStyle = '#fff'; g2.lineWidth = 8; g2.strokeStyle = 'rgba(120,0,0,0.35)'; g2.strokeText('95% CALOR', 0, 2); g2.fillText('95% CALOR', 0, 2); g2.restore(); }
  if (tLuz > 0.001) { g2.save(); g2.translate(bw / 2 - 70, bh / 2 + 52); g2.scale(tLuz, tLuz); g2.fillStyle = '#b8860b'; g2.font = `900 40px ${FT}`; g2.fillText('5% LUZ', 0, 0); g2.restore();
    g2.strokeStyle = '#b8860b'; g2.lineWidth = 6; g2.globalAlpha = clamp(tLuz); g2.beginPath(); g2.moveTo(bw / 2 - 20, bh / 2 + 24); g2.lineTo(bw / 2 - 20, bh / 2 - 6); g2.stroke(); g2.globalAlpha = 1; }
  g2.restore();
}
const fmtC = (v) => `${Math.round(v).toLocaleString('pt-BR')} °C`;

/* ---------- thermometer: rises with the filament and bursts at 2000 °C */
const TH = { x: 800, top: 330, bot: 1050, w: 84, r: 64 };
const thY = (v) => TH.bot - (TH.bot - TH.top - 40) * (v / 2000);
function thermoTemp(t) { return 20 + 1980 * prog(t, A.brilharForte + 0.1, A.milW - (A.brilharForte + 0.1), ease.inOut2) + 170 * prog(t, A.milW, A.burst - A.milW, ease.in); }
function drawThermo(t) {
  const t0 = A.brilharForte - 0.15; if (t < t0 || t > A.burst + 1.1) return;
  if (t < A.burst) {
    const s = pop(t, t0, Infinity, 0.45), temp = thermoTemp(t);
    const shake = clamp((temp - 1400) / 700) * 7;
    const cx = TH.x + Math.sin(t * 61) * shake, cy = (TH.top + TH.bot) / 2 + Math.cos(t * 47) * shake;
    g2.save(); g2.translate(cx, cy); g2.scale(s, s); g2.translate(-TH.x, -(TH.top + TH.bot) / 2);
    // backing card
    g2.fillStyle = 'rgba(8,12,20,0.62)'; g2.beginPath(); g2.roundRect(TH.x - 170, TH.top - 150, 340, TH.bot - TH.top + 290, 44); g2.fill();
    // readout
    const hot = clamp(temp / 2000);
    g2.font = `900 66px ${FT}`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.lineJoin = 'round';
    g2.lineWidth = 12; g2.strokeStyle = '#111'; g2.strokeText(fmtC(Math.min(temp, 2000)), TH.x, TH.top - 82);
    g2.fillStyle = `rgb(255,${Math.round(lerp(255, 80, hot))},${Math.round(lerp(255, 50, hot))})`; g2.fillText(fmtC(Math.min(temp, 2000)), TH.x, TH.top - 82);
    // ticks + labels
    g2.strokeStyle = 'rgba(255,255,255,0.85)'; g2.fillStyle = '#fff'; g2.font = `800 30px ${FT}`; g2.textAlign = 'right';
    for (let v = 0; v <= 2000; v += 100) {
      const y = thY(v), major = v % 500 === 0;
      g2.lineWidth = major ? 5 : 3; g2.beginPath(); g2.moveTo(TH.x - TH.w / 2 - 8, y); g2.lineTo(TH.x - TH.w / 2 - (major ? 34 : 18), y); g2.stroke();
      if (major) g2.fillText(v.toLocaleString('pt-BR'), TH.x - TH.w / 2 - 44, y + 2);
    }
    // glass tube (back)
    g2.fillStyle = 'rgba(210,235,255,0.16)'; g2.beginPath(); g2.roundRect(TH.x - TH.w / 2, TH.top, TH.w, TH.bot - TH.top, TH.w / 2); g2.fill();
    g2.beginPath(); g2.arc(TH.x, TH.bot + TH.r * 0.6, TH.r, 0, 7); g2.fill();
    // red column + bulb
    const colTop = Math.max(TH.top + 14, thY(temp));
    const gr = g2.createLinearGradient(0, TH.bot, 0, TH.top); gr.addColorStop(0, '#d81e1e'); gr.addColorStop(1, '#ff6a3a');
    g2.fillStyle = gr; g2.beginPath(); g2.roundRect(TH.x - TH.w / 2 + 16, colTop, TH.w - 32, TH.bot + TH.r * 0.6 - colTop, (TH.w - 32) / 2); g2.fill();
    const rg = g2.createRadialGradient(TH.x - 18, TH.bot + TH.r * 0.6 - 18, 6, TH.x, TH.bot + TH.r * 0.6, TH.r - 12);
    rg.addColorStop(0, '#ff8a6a'); rg.addColorStop(1, '#c81414'); g2.fillStyle = rg; g2.beginPath(); g2.arc(TH.x, TH.bot + TH.r * 0.6, TH.r - 12, 0, 7); g2.fill();
    // glass outline + highlight
    g2.lineWidth = 7; g2.strokeStyle = 'rgba(255,255,255,0.92)';
    g2.beginPath(); g2.moveTo(TH.x - TH.w / 2, TH.bot + 6); g2.lineTo(TH.x - TH.w / 2, TH.top + TH.w / 2); g2.arc(TH.x, TH.top + TH.w / 2, TH.w / 2, Math.PI, 0); g2.lineTo(TH.x + TH.w / 2, TH.bot + 6);
    g2.arc(TH.x, TH.bot + TH.r * 0.6, TH.r, -Math.PI / 2 + Math.asin((TH.w / 2) / TH.r), Math.PI * 1.5 - Math.asin((TH.w / 2) / TH.r)); g2.closePath(); g2.stroke();
    g2.strokeStyle = 'rgba(255,255,255,0.55)'; g2.lineWidth = 6; g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(TH.x - TH.w / 2 + 14, TH.top + 50); g2.lineTo(TH.x - TH.w / 2 + 14, TH.bot - 40); g2.stroke();
    // cracks just before it bursts
    const ck = prog(t, A.burst - 0.22, 0.2, ease.lin);
    if (ck > 0) {
      g2.strokeStyle = 'rgba(255,255,255,0.95)'; g2.lineWidth = 4; g2.lineCap = 'round';
      for (let c = 0; c < 5; c++) {
        let x = TH.x + (hash(c * 3.1) - 0.5) * TH.w * 0.6, y = TH.top + 40 + hash(c * 5.3) * 260; g2.beginPath(); g2.moveTo(x, y);
        const n = Math.ceil(6 * ck); for (let k = 0; k < n; k++) { x += (hash(c * 11 + k) - 0.5) * 50; y += (hash(c * 13 + k) - 0.3) * 60; g2.lineTo(x, y); }
        g2.stroke();
      }
    }
    g2.restore();
  } else {
    const dt = t - A.burst;
    // flash
    if (dt < 0.3) { const fr = g2.createRadialGradient(TH.x, TH.top + 160, 10, TH.x, TH.top + 160, 120 + 1000 * dt); fr.addColorStop(0, `rgba(255,240,220,${0.85 * (1 - dt / 0.3)})`); fr.addColorStop(1, 'rgba(255,200,150,0)'); g2.fillStyle = fr; g2.fillRect(0, 0, W, H); }
    const fade = 1 - prog(dt, 0.6, 0.5, ease.lin);
    // shards of glass
    for (let i = 0; i < 20; i++) {
      const x0 = TH.x + (hash(i * 1.3) - 0.5) * TH.w, y0 = lerp(TH.top, TH.bot + 40, hash(i * 2.3));
      const vx = (hash(i * 3.7) - 0.5) * 1700, vy = -250 - hash(i * 4.1) * 1200;
      const x = x0 + vx * dt, y = y0 + vy * dt + 1400 * dt * dt, rot = (hash(i * 5.9) - 0.5) * 22 * dt, sz = 18 + 30 * hash(i * 6.1);
      g2.save(); g2.translate(x, y); g2.rotate(rot); g2.globalAlpha = fade;
      g2.fillStyle = 'rgba(215,238,255,0.55)'; g2.strokeStyle = '#fff'; g2.lineWidth = 3;
      g2.beginPath(); g2.moveTo(-sz * 0.5, sz * 0.4); g2.lineTo(sz * (0.1 + 0.3 * hash(i)), -sz * 0.6); g2.lineTo(sz * 0.55, sz * 0.3); g2.closePath(); g2.fill(); g2.stroke(); g2.restore();
    }
    // red droplets
    for (let i = 0; i < 30; i++) {
      const x0 = TH.x + (hash(i * 7.3) - 0.5) * 40, y0 = TH.top + 30 + hash(i * 8.9) * 500;
      const vx = (hash(i * 9.1) - 0.5) * 1400, vy = -500 - hash(i * 10.7) * 1100;
      const x = x0 + vx * dt, y = y0 + vy * dt + 1600 * dt * dt, r = 7 + 11 * hash(i * 12.1);
      g2.globalAlpha = fade; g2.fillStyle = '#ff2a1f'; g2.beginPath(); g2.ellipse(x, y, r, r * (1 + 0.6 * clamp(Math.abs(vy) / 1500)), Math.atan2(vy + 3200 * dt, vx) + Math.PI / 2, 0, 7); g2.fill();
    }
    g2.globalAlpha = 1;
  }
}

/* ---------- melting metals: full screen, fire grows with the temperature, reddish corners */
const METALS = [['ESTANHO', 232, '#c9ccd1'], ['CHUMBO', 327, '#6b6f78'], ['ZINCO', 420, '#b9c2cc'], ['ALUMÍNIO', 660, '#d6dde3'], ['PRATA', 962, '#e8eaee'], ['OURO', 1064, '#e9c46a'], ['COBRE', 1085, '#c97b4a'], ['FERRO', 1538, '#8a8f96'], ['TITÂNIO', 1668, '#a8adb5']];
const GRID_T0 = A.quase - 0.25, GRID_T1 = A.metalMais - 0.35;
function gridTempAt(t) { return 20 + 1980 * prog(t, A.quase - 0.1, A.temperatura + 0.2 - (A.quase - 0.1), ease.inOut2); }
function drawFlames(t, height, layer) {
  const N = layer === 0 ? 9 : layer === 1 ? 12 : 15;
  const cols = [
    ['rgba(255,120,40,0.75)', 'rgba(210,40,15,0.55)', 'rgba(120,10,5,0)'],
    ['rgba(255,200,90,0.85)', 'rgba(255,110,25,0.6)', 'rgba(200,40,10,0)'],
    ['rgba(255,250,210,0.9)', 'rgba(255,190,70,0.6)', 'rgba(255,110,20,0)'],
  ][layer];
  const hMul = [1.0, 0.72, 0.42][layer];
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5 + (layer === 1 ? 0.5 : 0)) * W / N + Math.sin(t * 2.1 + i * 1.7 + layer) * 18;
    const nz = 0.5 + 0.5 * Math.sin(t * (6.3 + layer) + i * 2.1) * Math.sin(t * 3.7 + i * 1.3 + layer * 2);
    const h = height * hMul * (0.62 + 0.38 * nz), w = (W / N) * 1.7, sway = Math.sin(t * 5.1 + i * 0.9) * w * 0.18;
    const gr = g2.createLinearGradient(0, H, 0, H - h); gr.addColorStop(0, cols[0]); gr.addColorStop(0.5, cols[1]); gr.addColorStop(1, cols[2]);
    g2.fillStyle = gr; g2.beginPath(); g2.moveTo(x - w / 2, H + 10);
    g2.quadraticCurveTo(x - w * 0.5, H - h * 0.5, x + sway, H - h); g2.quadraticCurveTo(x + w * 0.5, H - h * 0.5, x + w / 2, H + 10); g2.closePath(); g2.fill();
  }
}
function drawMetalsGrid(t) {
  if (t < GRID_T0 - 0.01 || t > GRID_T1 + 0.35) return;
  const aIn = prog(t, GRID_T0, 0.22, ease.out) * (1 - prog(t, GRID_T1, 0.3, ease.in));
  if (aIn <= 0.001) return;
  const temp = gridTempAt(t), k = clamp(temp / 2000);
  g2.save(); g2.globalAlpha = aIn;
  // opaque background over the 3D scene
  const bg = g2.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#120a08'); bg.addColorStop(1, '#2a0c06'); g2.fillStyle = bg; g2.fillRect(0, 0, W, H);
  // reddish corners that grow with the heat
  for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) {
    const cg = g2.createRadialGradient(cx, cy, 0, cx, cy, 820); cg.addColorStop(0, `rgba(255,40,10,${0.22 + 0.68 * k})`); cg.addColorStop(1, 'rgba(255,40,10,0)');
    g2.fillStyle = cg; g2.fillRect(0, 0, W, H);
  }
  // fire at the bottom
  const fh = 160 + 820 * Math.pow(k, 1.15);
  g2.globalCompositeOperation = 'lighter';
  drawFlames(t, fh, 0); drawFlames(t, fh, 1); drawFlames(t, fh, 2);
  for (let i = 0; i < 40; i++) { const u = fract(t * (0.35 + 0.3 * hash(i)) + hash(i * 2.2)); const x = hash(i * 3.3) * W + Math.sin(t * 3 + i) * 30; const y = H - u * (fh + 300); g2.fillStyle = `rgba(255,${180 + Math.round(60 * hash(i))},90,${0.9 * (1 - u) * k})`; g2.beginPath(); g2.arc(x, y, 3 + 4 * hash(i * 4.4), 0, 7); g2.fill(); }
  g2.globalCompositeOperation = 'source-over';
  // header
  const sIn = 0.85 + 0.15 * prog(t, GRID_T0, 0.35, ease.back);
  g2.translate(W / 2, 760); g2.scale(sIn, sIn); g2.translate(-W / 2, -760);
  g2.font = `900 92px ${FT}`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.lineJoin = 'round';
  g2.lineWidth = 16; g2.strokeStyle = '#111'; g2.strokeText(fmtC(temp), W / 2, 150);
  g2.fillStyle = `rgb(255,${Math.round(lerp(230, 90, k))},${Math.round(lerp(60, 40, k))})`; g2.fillText(fmtC(temp), W / 2, 150);
  // 3x3 cells
  const x0 = 26, y0 = 236, gap = 14, cw = (W - 2 * x0 - 2 * gap) / 3, ch = 330;
  METALS.forEach(([name, mp, col], i) => {
    const cx = x0 + (i % 3) * (cw + gap), cy = y0 + Math.floor(i / 3) * (ch + gap);
    const m = prog(temp, mp - 60, 200, ease.inOut);             // 0 solid … 1 puddle
    g2.fillStyle = 'rgba(16,10,8,0.84)'; g2.beginPath(); g2.roundRect(cx, cy, cw, ch, 22); g2.fill();
    g2.lineWidth = 4; g2.strokeStyle = m > 0.98 ? 'rgba(255,90,40,0.9)' : 'rgba(255,255,255,0.14)'; g2.stroke();
    g2.fillStyle = '#fff'; g2.font = `800 36px ${FT}`; g2.textAlign = 'center'; g2.fillText(name, cx + cw / 2, cy + 40);
    g2.fillStyle = m > 0.5 ? '#ff6a3a' : '#cfd6e0'; g2.font = `800 32px ${FT}`; g2.fillText(fmtC(mp), cx + cw / 2, cy + ch - 34);
    const mx = cx + cw / 2, my = cy + ch / 2 + 52; const a = 78 * (1 + 0.7 * m), h = 120 * (1 - 0.93 * m);
    const heat = clamp((temp - (mp - 300)) / 300); const c = new THREE.Color(col).lerp(new THREE.Color(0xff5a1a), 0.85 * heat);
    const hex = '#' + c.getHexString();
    g2.fillStyle = 'rgba(0,0,0,0.4)'; g2.beginPath(); g2.ellipse(mx, my + 8, a * 1.15, a * 0.42 + 6, 0, 0, 7); g2.fill();
    if (m < 0.995) {
      const top = my - h, d = a * 0.5;
      g2.fillStyle = hex; g2.beginPath(); g2.moveTo(mx - a, my - d * 0.5); g2.lineTo(mx - a, top - d * 0.5); g2.lineTo(mx, top); g2.lineTo(mx, my); g2.closePath(); g2.fill();
      g2.fillStyle = '#' + c.clone().multiplyScalar(0.75).getHexString(); g2.beginPath(); g2.moveTo(mx, my); g2.lineTo(mx, top); g2.lineTo(mx + a, top - d * 0.5); g2.lineTo(mx + a, my - d * 0.5); g2.closePath(); g2.fill();
      g2.fillStyle = '#' + c.clone().multiplyScalar(1.15).getHexString(); g2.beginPath(); g2.moveTo(mx, top); g2.lineTo(mx - a, top - d * 0.5); g2.lineTo(mx, top - d); g2.lineTo(mx + a, top - d * 0.5); g2.closePath(); g2.fill();
    }
    if (m > 0.02) { g2.fillStyle = hex; g2.beginPath(); g2.ellipse(mx, my + 4, a * (0.6 + 0.6 * m), a * (0.25 + 0.2 * m), 0, 0, 7); g2.fill(); }
    if (m > 0.3) { g2.fillStyle = `rgba(255,170,80,${0.5 * m})`; for (let j = 0; j < 4; j++) { const u = fract(t * 0.6 + j * 0.25 + i * 0.1); g2.beginPath(); g2.arc(mx + (j - 1.5) * 24, my - 12 - u * 80, 6 * (1 - u) + 1, 0, 7); g2.fill(); } }
  });
  g2.restore();
}
/* ---------- speech balloon: the tungsten in the fire mocks the heat */
function drawBalloon(t) {
  const t0 = A.metalMais + 0.45, t1 = A.tresMil - 0.15; if (t < t0 || t > t1 + 0.3) return;
  const s = pop(t, t0, t1, 0.35); if (s <= 0.001) return;
  const p = project(FIRE_C.clone().add(V(0, 0.14, 0))); if (p[2] > 1) return;
  const tx = clamp(p[0], 300, W - 300), ty = p[1] - 30;            // tail tip (just above the block)
  const bx = clamp(p[0] + 60, 330, W - 330), by = clamp(ty - 300, 230, H - 700);
  const wob = Math.sin(t * 5.5) * 0.02;
  g2.save(); g2.translate(bx, by); g2.rotate(-0.03 + wob); g2.scale(s, s);
  const bw = 600, bh = 230;
  g2.fillStyle = 'rgba(0,0,0,0.28)'; g2.beginPath(); g2.roundRect(-bw / 2, -bh / 2 + 10, bw, bh, 60); g2.fill();
  g2.fillStyle = '#ffffff'; g2.strokeStyle = '#111'; g2.lineWidth = 9; g2.lineJoin = 'round';
  g2.beginPath(); g2.roundRect(-bw / 2, -bh / 2, bw, bh, 60);
  // tail towards the block
  const lx = (tx - bx) / s, ly = (ty - by) / s;
  g2.moveTo(-40, bh / 2 - 4); g2.lineTo(lx, ly); g2.lineTo(40, bh / 2 - 4);
  g2.fill(); g2.stroke();
  g2.fillStyle = '#ffffff'; g2.fillRect(-36, bh / 2 - 12, 72, 19);
  g2.fillStyle = '#1e1e1e'; g2.font = `900 54px ${FT}`; g2.textAlign = 'center'; g2.textBaseline = 'middle';
  g2.fillText('Você chama isso', 0, -36); g2.fillText('de esquentar?', 0, 36);
  g2.restore();
}
/* ---------- a voz do boneco: "UHUL!" quando a sala acende, um "Aaah..." triste quando a luz enfraquece (o som vem de som("uhul") / som("aah")) */
A.uhul = A.iluminam + 0.55; A.aah = A.fraquinha + 0.35;
fala('UHUL!', A.uhul - 0.05, A.uhul + 1.2, person);
fala('Aaah...', A.aah - 0.05, A.aah + 1.3, person, { triste: true });
/* ---------- desenhos extras por cima do 3D (o motor já desenha letreiros, falas, legenda e assinatura) */
function desenhar(t) {
  drawBalloon(t);
  drawEnergyBar(t);
  drawThermo(t);
  drawMetalsGrid(t);
}

/* ------------------------------------------------------------------ boneco: andar, a lâmpada final */
const HOME = V(0.55, 0.04, -1.5), HOME_ROT = -0.35;
const SPOT = V(0, 0.04, -1.42);                              // behind the desk, right under the socket
const PRESS_AT = V(SW.x, 0.04, -2.15);
const walkCurve = new THREE.CatmullRomCurve3([SPOT.clone(), V(0.62, 0.04, -1.75), PRESS_AT.clone()]);
const WALK_LEN = walkCurve.getLength();
const CAM_FINAL = V(0.55, 1.35, -1.55).add(V(Math.sin(8 * Math.PI / 180), 0, Math.cos(8 * Math.PI / 180)).multiplyScalar(3.4));
const FACE_CAM = Math.atan2(CAM_FINAL.x - PRESS_AT.x, CAM_FINAL.z - PRESS_AT.z);
function personPose(t) {
  let pos = HOME.clone(), rot = HOME_ROT, walk = 0, phase = 0;
  const s0 = prog(t, A.step0, 0.55, ease.inOut2);
  if (s0 > 0) { pos.lerp(SPOT, s0); rot = lerp(HOME_ROT, 0, s0); walk = win(t, A.step0, A.step0 + 0.55, 0.12, 0.15) * 0.7; phase = s0 * Math.PI * 2; }
  if (t > A.walk0 - 0.15) {
    const u = prog(t, A.walk0, A.walk1 - A.walk0, ease.inOut2);
    walkCurve.getPointAt(u, pos);
    const tg = walkCurve.getTangentAt(Math.max(0.001, Math.min(0.999, u)));
    rot = lerpAng(0, Math.atan2(tg.x, tg.z), prog(t, A.walk0 - 0.15, 0.3));
    walk = win(t, A.walk0, A.walk1, 0.15, 0.15); phase = (u * WALK_LEN / 0.62) * Math.PI;
  }
  if (t > A.walk1 - 0.1) rot = lerpAng(rot, Math.PI, prog(t, A.walk1 - 0.1, 0.25));
  if (t > A.parabens - 0.25) rot = lerpAng(Math.PI, FACE_CAM, prog(t, A.parabens - 0.25, 0.45));
  return { pos, rot, walk, phase };
}
// the finished lamp: carried to the puppet's hands, flipped neck-up, screwed into the socket
const SCALE_F = 0.33, NECK_IN = SOCK.clone().add(V(0, -0.045, 0));
const NECK_HOLD = V(SPOT.x, 1.47, -1.17), NECK_UNDER = SOCK.clone().add(V(0, -0.085, 0));
function lampTransform(t) {
  const out = { pos: DEMO.clone(), flip: 0, spin: 0, s: 1 };
  if (t < A.fly0) return out;
  const f = prog(t, A.fly0, A.fly1 - A.fly0, ease.inOut);
  out.pos.lerp(NECK_HOLD, f); out.pos.y += Math.sin(f * Math.PI) * 0.12; out.flip = f; out.s = lerp(1, SCALE_F, f);
  const r = prog(t, A.fly1, A.raise1 - A.fly1, ease.inOut); if (r > 0) out.pos.lerp(NECK_UNDER, r);
  const w = clamp((t - A.raise1) / (A.twist1 - A.raise1));
  if (w > 0) { out.pos.copy(NECK_UNDER).lerp(NECK_IN, w); const cyc = w * 3, ci = Math.floor(Math.min(cyc, 2.999)), cf = cyc - ci; out.spin = (ci + Math.min(1, cf / 0.78)) * 1.25; }
  return out;
}
function gripOffset(t) {          // hands rotate with the lamp during each twist, then re-grip
  const w = clamp((t - A.raise1) / (A.twist1 - A.raise1)); if (w <= 0 || w >= 1) return 0;
  const cf = fract(w * 3); return cf < 0.78 ? (cf / 0.78) * 1.25 : (1 - (cf - 0.78) / 0.22) * 1.25;
}

/* ------------------------------------------------------------------ update */
let flashK = 0;
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function update(t) {
  flashK = 0;
  const fs = filamentState(t);
  // ---------- lamp group transform (identity until the final)
  const LT = lampTransform(t);
  lampG.quaternion.setFromEuler(new THREE.Euler(Math.PI * LT.flip, LT.spin, 0, 'YXZ'));
  lampG.scale.setScalar(LT.s);
  lampG.position.copy(LT.pos).sub(DEMO.clone().multiplyScalar(LT.s).applyQuaternion(lampG.quaternion));
  lampG.updateMatrixWorld(true);
  // ---------- person
  const P = personPose(t);
  person.position.copy(P.pos); person.rotation.y = P.rot;
  const celebrate = Math.max(win(t, A.brilham - 0.1, A.fraquinha + 0.05, 0.3, 0.35), prog(t, A.parabens - 0.05, 0.35));
  const sad = Math.max(win(t, A.fraquinha + 0.1, A.poe - 0.3, 0.35, 0.5), win(t, A.continuaFraca - 0.35, A.brilharForte + 0.3, 0.35, 0.4));
  const ouch = win(t, A.touch, A.oldOut - 0.2, 0.1, 0.4);
  const modK = win(t, A.moderno - 0.6, A.troca + 0.6, 0.3, 0.4);
  let mood = 0.25; mood = lerp(mood, 1, celebrate); if (sad > 0.2) mood = lerp(mood, -1, clamp(sad * 1.4)); if (ouch > 0.3) mood = -0.9; mood = lerp(mood, 0.95, modK);
  if (t > A.agora - 0.6 && t < A.parabens) mood = 0.55;
  B.updatePerson(person, t, { mood, sweat: ouch, fan: 0, shiver: 0, remote: 0 });
  const U = person.userData;
  U.headP.rotation.y = t > A.agora - 0.6 ? 0 : lerp(0.25, 1.05, win(t, A.oldIn + 0.1, A.oldOut - 0.1, 0.35, 0.35) * (1 - 0.6 * ouch));
  const arms = U.arms;
  // walking legs / arm swing / bob
  for (const L of U.legs) L.hip.rotation.x = Math.sin(P.phase + (L.sx > 0 ? 0 : Math.PI)) * 0.55 * P.walk;
  if (P.walk > 0.01) for (const a of arms) a.sh.rotation.x += -Math.sin(P.phase + (a.sx > 0 ? 0 : Math.PI)) * 0.45 * P.walk;
  person.position.y += Math.abs(Math.sin(P.phase)) * 0.025 * P.walk;
  // celebrate: arms up in a V, little hops
  if (celebrate > 0.01) {
    for (const a of arms) { a.sh.rotation.set(lerp(a.sh.rotation.x, -0.2, celebrate), 0, lerp(a.sh.rotation.z, a.sx * (2.55 + 0.18 * Math.sin(t * 13 + a.sx)), celebrate)); a.el.rotation.x = lerp(a.el.rotation.x, -0.35, celebrate); }
    person.position.y += Math.abs(Math.sin(t * 9)) * 0.05 * celebrate;
  }
  // sad (v5): head stays up (it used to sink into the shoulders) — a small tilt to the side, frown, arms hanging
  if (sad > 0.01) {
    U.headP.rotation.x = lerp(U.headP.rotation.x, 0.08, sad); U.headP.rotation.z += (0.12 + Math.sin(t * 1.6) * 0.05) * sad;
    U.headP.position.y = HEAD_Y0 + 0.012 * sad;
    U.torso.rotation.x = 0.05 * sad;
    for (const a of arms) { a.sh.rotation.set(lerp(a.sh.rotation.x, 0.18, sad), 0, lerp(a.sh.rotation.z, a.sx * 0.03, sad)); a.el.rotation.x = lerp(a.el.rotation.x, -0.05, sad); }
  } else { U.torso.rotation.x = 0; U.headP.position.y = HEAD_Y0; }
  // old lamp gag: he reaches out, touches the hot bulb, jerks the hand back
  const reach = win(t, A.touch - 0.75, A.touch + 0.02, 0.5, 0.06);
  if (reach > 0.001) { const tgt = OLD.clone().add(V(-0.06, -0.035, -0.035)); armIK(person, arms[1], tgt, reach, V(0.8, -1, -0.3)); }
  const recoil = win(t, A.touch + 0.02, A.oldOut - 0.15, 0.1, 0.45);
  if (recoil > 0) { arms[1].sh.rotation.set(lerp(0.05, -1.2, recoil), 0, lerp(0.1, 0.9, recoil) + Math.sin(t * 30) * 0.15 * recoil); arms[1].el.rotation.set(lerp(-0.25, -2.2, recoil), 0, 0); }
  // (the 'modern' glasses were removed — he just smiles)
  visor.visible = false;
  // hands on the lamp while it is carried, raised and screwed in
  const holdK = win(t, A.agora - 0.4, A.twist1 + 0.02, 0.35, 0.22);
  if (holdK > 0.001) {
    const cen = lampG.localToWorld(DEMO.clone().add(V(0, 0.42, 0)));
    const g = gripOffset(t), side = V(1, 0, 0);
    for (const a of arms) {
      const ang = (a.sx > 0 ? 0 : Math.PI) + g;
      _v.set(Math.cos(ang) * 0.085, 0, -Math.sin(ang) * 0.085 * 0.6).add(cen); _v.z -= 0.02;
      if (t < A.fly1 - 0.05) _v.lerp(V(SPOT.x + a.sx * 0.11, 1.2, -1.2), 1 - prog(t, A.fly0 + 0.25, A.fly1 - A.fly0 - 0.3));
      armIK(person, a, _v, holdK, V(a.sx * 0.8, -1, -0.2));
    }
  }
  // press the wall switch
  const pressK = win(t, A.press0, A.press1 + 0.12, 0.25, 0.35);
  if (pressK > 0.001) { _v.copy(SW).add(V(0, -0.02 * prog(t, A.press1 - 0.05, 0.08), 0.065)); armIK(person, arms[0], _v, pressK, V(0, -1, 0.4)); }
  // ---------- steel wool + battery; the room lit by the wool for a moment
  const touch = prog(t, A.pilha + 0.4, 0.8, ease.inOut);
  battery.position.set(lerp(0.12, -0.09, touch), DESK_Y, -0.72); battery.rotation.z = 0.6 * touch;
  const glowW = prog(t, A.esquentam - 0.1, 1.3, ease.lin) * (1 - 0.55 * prog(t, A.fraquinha + 0.3, 1.6));
  const burnt = prog(t, A.queimam - 0.2, 1.4);
  M.updateSteelWool(wool, glowW, burnt);
  wool.visible = battery.visible = t < A.poe - 0.6;
  woolLight.intensity = 9 * win(t, A.iluminam - 0.3, A.fraquinha + 0.2, 0.4, 1.4) + 1.6 * win(t, A.reagem - 0.4, A.poe - 0.6, 0.3, 0.3) * (1 - 0.6 * burnt);
  let nsp = 0;
  const sparkK = win(t, A.brilham - 0.1, A.queimam + 0.6, 0.2, 0.4);
  if (sparkK > 0.01) for (let i = 0; i < 40; i++) { const k = fract(t * 1.6 + hash(i * 2.1)); tmpP.copy(wool.position).add(V((hash(i) - 0.5) * 0.25 + (hash(i * 3) - 0.5) * 0.3 * k, 0.1 + k * 0.35 - k * k * 0.25, (hash(i * 5) - 0.5) * 0.2)); setInst(sparks, nsp++, tmpP, 0.004 * sparkK * (1 - k), tmpC.setHex(0xffd080)); }
  // ---------- filament: flies in and lands on its two posts; the glass comes down over it
  const baseIn = pop(t, A.poe - 0.45, Infinity, 0.4);
  bulb.userData.base.visible = baseIn > 0.001; bulb.userData.base.scale.setScalar(Math.max(0.001, baseIn));
  const flyF = prog(t, A.poe - 0.05, 0.8, ease.out);
  const fStart = FILC.clone().add(V(0.55, 0.3, 0.3));
  filament.position.copy(fStart).lerp(FILC, flyF); filament.position.y += Math.sin(flyF * Math.PI) * 0.1;
  filament.rotation.set(0, (1 - flyF) * 1.2, (1 - flyF) * 1.6);
  const outK = prog(t, A.troca + 0.05, 0.6, ease.in), OUTV = V(0.62, 0.05, 0.18);
  filament.position.addScaledVector(OUTV, outK); filament.rotation.z += 2 * outK; filament.scale.setScalar(Math.max(0.001, 1 - 0.6 * outK));
  bulb.userData.base.position.copy(OUTV).multiplyScalar(outK); bulb.userData.base.rotation.z = -0.8 * outK;
  if (outK >= 0.999) bulb.userData.base.visible = false;
  filament.visible = fs.vis && outK < 0.999;
  M.setFilament(filament, fs.k1, fs.k2, fs.radius, fs.gap);
  const g = clamp(fs.glow / 1.3);
  filament.userData.m.emissiveIntensity = 4.5 * fs.glow;
  filament.userData.m.color.setHex(fs.burnt ? 0x2e2e2e : fs.glow > 0.05 ? 0xffc27a : 0xe0782a);
  filament.userData.m.emissive.setHex(fs.glow > 1.35 ? 0xffd9a0 : 0xff8c1a);
  filament.userData.glowM.opacity = 0.9 * clamp(fs.glow / 1.3);
  filament.userData.glowM.color.setHex(fs.glow > 0.9 ? 0xffe2b8 : 0xffb070);
  { const s = 0.1 + 0.24 * Math.min(1.6, fs.glow / 1.3); filament.userData.glow.scale.set(s * 1.25, s, 1); }
  filLight.position.copy(FILC); filLight.intensity = 1.6 * fs.glow * (t > A.agora - 0.3 ? 0 : 1);
  filLight.color.setHex(fs.glow > 1.2 ? 0xfff0d0 : 0xffa040);
  if (t > A.arrebentar - 0.05 && t < A.arrebentar + 0.25) flashK = 0.5 * (1 - (t - A.arrebentar + 0.05) / 0.3);
  if (t > A.jaEra - 0.3 && t < A.jaEra) flashK = 0.45 * (1 - (t - A.jaEra + 0.3) / 0.3);
  // glass
  const shellK = prog(t, A.bulbo - 0.1, 0.55, ease.out);
  const shell = bulb.userData.shell; shell.visible = shellK > 0.001; shell.position.y = (1 - shellK) * 0.55 + 0.5 * win(t, A.travel0 - 0.25, A.travel1 + 0.3, 0.3, 0.35) + 0.56 * win(t, A.troca - 0.15, A.chip + 0.35, 0.35, 0.4);
  { const dOnly = t > A.troca + 0.45; for (const m of lowerGlass) { const gg = dOnly ? domeGlassGeo : m.userData.fullGeo; if (m.geometry !== gg) m.geometry = gg; } }
  const vacK = win(t, A.vacuo - 0.15, A.continuaFraca - 0.25, 0.35, 0.4); vacFill.visible = vacK > 0.001; vacM.uniforms.uA.value = vacK * (0.34 + 0.2 * Math.sin(t * 7));
  const camD = camera.position.distanceTo(lampG.localToWorld(BULB.clone()));
  const kD = lerp(0.5, 1.15, clamp((camD - 0.4) / 1.2));
  for (const gm of bulb.userData.glassMs) { gm.uniforms.uS.value = lerp(0.12, 1, clamp((camD - 0.5) / 0.9)); gm.uniforms.uK.value = kD * shellK; gm.uniforms.uWarm.value = 0.32 * g * shellK * (t < A.troca + 0.5 ? 1 : 0); }
  const soot = win(t, A.gruda - 0.1, A.enche - 0.2, 1.6, 0.4);
  bulb.userData.soot.opacity = 0.75 * soot;
  // the opened lamp: top pops off (only between “abrir” and the hard cut)
  const opened = t > A.abrir && t < A.masGas;
  const topK = opened ? prog(t, A.abrir + 0.15, 0.55, ease.out) : 0;
  const top = bulb.userData.top; top.position.set(topK * 0.22, 0.54 + topK * 0.55, 0); top.rotation.set(0, 0, -topK * 1.1);
  // pump + hose
  const pumpIn = pop(t, A.tira - 0.35, A.continuaFraca - 0.4, 0.4);
  pump.visible = hose.visible = pumpIn > 0.001; pump.scale.setScalar(Math.max(0.001, pumpIn));
  pump.userData.pist.position.y = 0.3 + 0.07 * Math.sin((t - A.tira) * 8.5) * win(t, A.tira, A.semOx + 0.5, 0.2, 0.3);
  // oxygen molecules hitting the hot wool (reagem) → ash flecks; later the air is pumped out of the bulb through the hose
  let no2 = 0, nfl = 0;
  const airW = win(t, A.reagem - 0.3, A.poe - 0.6, 0.3, 0.3);
  if (airW > 0.01) for (let i = 0; i < 30; i++) {
    const ph = hash(i * 1.3); const spd = 0.6 + 0.5 * hash(i * 2.7);
    let p = V(WOOL.x + (hash(i * 3.1) - 0.5) * 0.3, WOOL.y + 0.02 + (hash(i * 4.1) - 0.5) * 0.22, WOOL.z + (hash(i * 5.1) - 0.5) * 0.3);
    const k = fract(t * spd * 0.5 + ph); const toward = Math.sin(k * Math.PI);
    p.lerp(V(WOOL.x + (hash(i) - 0.5) * 0.12, WOOL.y + 0.02, WOOL.z + (hash(i * 7) - 0.5) * 0.12), 0.6 * toward);
    const s = 0.0045 * airW;
    setInst(o2, no2++, p, s, tmpC.setHex(0xff4040)); setInst(o2, no2++, p.clone().add(V(0.008, 0.004, 0)), s * 0.95, tmpC.setHex(0xff6060));
    if (toward > 0.9 && t > A.queimam - 0.2) { const kk = fract(t * 2 + hash(i * 9)); tmpP.copy(p).add(V((hash(i * 11) - 0.5) * 0.08 * kk, -kk * 0.06, (hash(i * 13) - 0.5) * 0.08 * kk)); setInst(flecks, nfl++, tmpP, 0.003, tmpC.setHex(0x9c9890)); }
  }
  const airK = win(t, A.bulbo + 0.2, A.semOx + 1.0, 0.3, 0.3);
  if (airK > 0.01) for (let i = 0; i < 24; i++) {
    const ph = hash(i * 1.3); const spd = 0.6 + 0.5 * hash(i * 2.7);
    let p = V(FILC.x + (hash(i * 3.1) - 0.5) * 0.24, FILC.y + (hash(i * 4.1) - 0.5) * 0.22, FILC.z + (hash(i * 5.1) - 0.5) * 0.22);
    const kk = fract(t * spd * 0.5 + ph); p.lerp(V(FILC.x + (hash(i) - 0.5) * 0.1, FILC.y, FILC.z), 0.3 * Math.sin(kk * Math.PI));
    const k = clamp((t - (A.tira + 0.15 + hash(i * 7) * 1.1)) / 1.1);            // 0 inside … 0.35 at the neck … 1 in the pump
    if (k >= 1) continue;
    if (k > 0) { if (k < 0.35) p.lerp(DEMO, k / 0.35); else hoseCurve.getPointAt(1 - (k - 0.35) / 0.65, p); }
    const s = (k > 0.35 ? 0.0075 : 0.0045) * airK * (k > 0.9 ? (1 - k) / 0.1 : 1);
    setInst(o2, no2++, p, s, tmpC.setHex(0xff4040)); setInst(o2, no2++, p.clone().add(V(0.008, 0.004, 0)), s * 0.95, tmpC.setHex(0xff6060));
  }
  // exhaust puffs out of the pump
  const puffK = win(t, A.tira + 0.5, A.semOx + 0.6, 0.2, 0.3);
  if (puffK > 0.01) for (let i = 0; i < 10; i++) { const u = fract(t * 1.1 + i / 10); tmpP.copy(pump.position).add(V(0.12 + u * 0.12, 0.1 + u * 0.18, (hash(i) - 0.5) * 0.08)); setInst(o2, no2++, tmpP, 0.01 * (0.4 + u) * (1 - u) * puffK, tmpC.setHex(0xe8ecf0)); }
  // opened lamp: air rushes in
  if (opened) {
    const X = lampG.localToWorld(DEMO.clone().add(V(0, 0.56, 0)));
    for (let i = 0; i < 26; i++) {
      const k = clamp((t - (A.oxEntra - 0.2 + hash(i * 3.3) * 0.8)) / 0.9); if (k <= 0) continue;
      const dir = V(hash(i * 1.7) - 0.5, 0.8, hash(i * 2.9) - 0.5).normalize();
      const inside = V(FILC.x + (hash(i * 4.3) - 0.5) * 0.2, FILC.y + (hash(i * 5.3) - 0.5) * 0.2, FILC.z + (hash(i * 6.3) - 0.5) * 0.2);
      const p = k < 0.5 ? X.clone().addScaledVector(dir, 0.45 * (1 - k * 2)) : X.clone().lerp(inside, (k - 0.5) * 2);
      setInst(o2, no2++, p, 0.0045, tmpC.setHex(0xff4040)); setInst(o2, no2++, p.clone().add(V(0.008, 0.004, 0)), 0.0043, tmpC.setHex(0xff6060));
    }
    // the filament burns out: sparks
    const bk = win(t, A.jaEra - 0.3, A.jaEra + 0.2, 0.05, 0.3);
    if (bk > 0.01) for (let i = 0; i < 30; i++) { const k = fract(t * 2.2 + hash(i * 3.7)); const dir = V(hash(i) - 0.5, hash(i * 2) - 0.3, hash(i * 3) - 0.5).normalize(); tmpP.copy(FILC).addScaledVector(dir, 0.02 + k * 0.12); tmpP.y -= k * k * 0.05; setInst(sparks, nsp++, tmpP, 0.0035 * bk * (1 - k), tmpC.setHex(0xffd080)); }
  }
  finishInst(o2, no2); finishInst(flecks, nfl);
  // ---------- tungsten on fire (stays solid), then it flies into the bulb and becomes the filament
  const trayIn = pop(t, A.metalMais + 0.1, A.travel1 + 0.25, 0.45);
  tray.visible = trayIn > 0.001; tray.scale.setScalar(Math.max(0.001, trayIn));
  const blkIn = pop(t, A.metalMais + 0.1, Infinity, 0.45);
  tungBlock.visible = blkIn > 0.001 && t < A.travel1; tungBlock.scale.setScalar(Math.max(0.001, blkIn));
  M.meltBlock(tungBlock, 0);
  const tk = prog(t, A.travel0, A.travel1 - A.travel0, ease.inOut);
  if (tk > 0) {
    const w = tungBlock.userData.w, cube = tungBlock.userData.cube;
    cube.scale.set(lerp(1, 0.9, tk), lerp(1, 0.09, tk), lerp(1, 0.09, tk)); cube.position.y = 0;
    const pth = FIRE_C.clone().add(V(0, w / 2, 0)).lerp(FILC, tk); pth.y += Math.sin(tk * Math.PI) * 0.28;
    tungBlock.position.copy(pth); tungBlock.rotation.set(0, 0, Math.sin(tk * Math.PI) * 0.5);
  } else { tungBlock.position.copy(FIRE_C); tungBlock.rotation.set(0, 0, 0); }
  const fireK = win(t, A.metalMais + 0.25, A.travel0 + 0.4, 0.45, 0.35);
  tungBlock.userData.m.emissive.setHex(tk > 0.3 ? 0xff8a2a : 0xff4a00); tungBlock.userData.m.emissiveIntensity = (0.08 + 0.27 * prog(t, A.metalMais + 0.4, 1.6)) * (0.85 + 0.15 * Math.sin(t * 9)) * fireK + 1.4 * tk;
  if (t > A.travel1 - 0.02 && t < A.travel1 + 0.2) flashK = Math.max(flashK, 0.18 * (1 - (t - A.travel1 + 0.02) / 0.22));
  coalM.emissiveIntensity = 1.2 + 0.4 * Math.sin(t * 7);
  fireLight.intensity = 5 * fireK * (0.8 + 0.12 * Math.sin(t * 23) + 0.08 * Math.sin(t * 7.3));
  flames.forEach((s, i) => {
    if (fireK < 0.01) { s.visible = false; return; }
    const L = 0.5 + 0.35 * hash(i * 1.7), ph = fract(t / L + hash(i * 2.9));
    const ang = hash(i * 3.3) * 6.28 + t * 0.5, r = (0.05 + 0.11 * hash(i * 4.4)) * (1 - 0.45 * ph);
    const front = Math.sin(ang) > 0.35 ? 0.6 : 1;
    s.visible = true; s.position.set(FIRE_C.x + Math.cos(ang) * r, FIRE_C.y + 0.01 + ph * (0.2 + 0.14 * hash(i * 5.5)), FIRE_C.z + Math.sin(ang) * r);
    const sz = (0.06 + 0.06 * hash(i * 6.6)) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.15 + ph)), 0.6) * front;
    s.scale.set(sz, sz * 1.8, 1);
    s.material.color.setHex(0xfff0c0).lerp(tmpC.setHex(0xff7a1a), clamp(ph * 1.6)).lerp(tmpC.setHex(0xc8280c), clamp(ph * 2 - 1));
    s.material.opacity = 0.9 * fireK * Math.pow(1 - ph, 0.6);
  });
  if (fireK > 0.01) for (let i = 0; i < 20; i++) { const u = fract(t * (0.6 + 0.4 * hash(i)) + hash(i * 2.3)); tmpP.set(FIRE_C.x + (hash(i * 3.3) - 0.5) * 0.25 + Math.sin(t * 4 + i) * 0.02, FIRE_C.y + u * 0.45, FIRE_C.z + (hash(i * 4.3) - 0.5) * 0.2); setInst(sparks, nsp++, tmpP, 0.0025 * fireK * (1 - u), tmpC.setHex(0xffb050)); }
  const arrK = win(t, A.travel1 - 0.03, A.travel1 + 0.55, 0.03, 0.4);
  if (arrK > 0.01) for (let i = 0; i < 22; i++) { const k = clamp((t - A.travel1) / 0.55); const dir = V(hash(i * 1.9) - 0.5, hash(i * 2.7) - 0.35, hash(i * 3.5) - 0.5).normalize(); tmpP.copy(FILC).addScaledVector(dir, 0.015 + 0.11 * Math.sqrt(k)); setInst(sparks, nsp++, tmpP, 0.004 * arrK * (1 - 0.6 * k), tmpC.setHex(0xffe0a0)); }
  const magK = Math.max(win(t, A.oldIn, A.oldIn + 0.75, 0.05, 0.5), win(t, A.oldOut, A.oldOut + 0.5, 0.05, 0.35));
  if (magK > 0.01) { const t0m = t < A.oldOut ? A.oldIn : A.oldOut; for (let i = 0; i < 26; i++) { const k = clamp((t - t0m) / 0.75); const a = hash(i * 1.3) * 6.28 + k * 3, r = 0.06 + 0.2 * hash(i * 2.1) * (0.4 + k); tmpP.set(OLD.x + Math.cos(a) * r, OLD.y + (hash(i * 3.1) - 0.3) * 0.3 + (t < A.oldOut ? 0.25 * (1 - k) : 0.3 * k), OLD.z + Math.sin(a) * r); setInst(sparks, nsp++, tmpP, 0.006 * magK * (0.5 + 0.5 * Math.sin(t * 20 + i)), tmpC.setHex(0xfff3a0)); } }
  finishInst(sparks, nsp);
  // ---------- evaporating tungsten atoms, argon
  let nw = 0, na = 0;
  const pushK = win(t, A.empurram - 0.4, A.duraMais + 0.1, 0.25, 0.3);
  const pair = (j) => { const per = 0.95 + 0.35 * hash(j * 3.1), u = fract((t - A.empurram) / per + hash(j * 4.1)); const phi = hash(j * 2.3) * 6.28, d = V(0, Math.cos(phi), Math.sin(phi)); const x0 = FILC.x + (hash(j * 5.7) - 0.5) * 0.085; const e = Math.pow(1 - Math.abs(2 * u - 1), 0.75); return { u, d, x0, rW: 0.0045 + 0.03 * e, rA: 0.0425 + 0.03 * (1 - e) }; };
  if (pushK > 0.001) for (let j = 0; j < 14; j++) { const q = pair(j); tmpP.set(q.x0, FILC.y, FILC.z).addScaledVector(q.d, q.rW); setInst(watoms, nw++, tmpP, 0.0036 * pushK, tmpC.setHex(0xc8ccd2).lerp(new THREE.Color(0xffffff), clamp(1 - Math.abs(q.u - 0.5) / 0.08))); }
  const evapK = win(t, A.evaporando - 0.1, A.enche - 0.3, 0.5, 0.4);
  const arK = prog(t, A.enche + 0.1, 1.2);
  if (evapK > 0.01) for (let i = 0; i < 60; i++) {
    const k = fract(t * 0.35 * (0.7 + 0.6 * hash(i * 1.7)) + hash(i * 2.3));
    const dir = V(hash(i * 3.1) - 0.5, hash(i * 4.1) - 0.3, hash(i * 5.1) - 0.5).normalize();
    let dist = k * 0.15;
    if (arK > 0.5 && t > A.empurram - 0.2) dist = 0.02 + 0.03 * Math.abs(Math.sin(t * 6 + i)); // pushed back
    tmpP.copy(FILC).add(V((hash(i) - 0.5) * 0.1, 0, 0)).addScaledVector(dir, dist);
    setInst(watoms, nw++, tmpP, 0.0035 * evapK, tmpC.setHex(0xbfc4c9));
  }
  finishInst(watoms, nw);
  // atoms that reach the glass stick to it and darken it
  let nst = 0;
  const stK = win(t, A.gruda - 0.3, A.enche - 0.2, 0.2, 0.4);
  if (stK > 0.001) for (let i = 0; i < 80; i++) {
    const ts = A.gruda - 0.25 + (i / 80) * 1.9, k = (t - ts) / 0.32; if (k <= 0) continue;
    const yy = 0.3 + 0.27 * hash(i * 1.3), th = -0.55 + 1.5 * hash(i * 2.9), r = profR(yy) * 0.965;
    const Pg = V(DEMO.x + r * Math.cos(th), DEMO.y + yy, DEMO.z + r * Math.sin(th));
    if (k < 1) tmpP.set(FILC.x + (hash(i * 3.7) - 0.5) * 0.09, FILC.y, FILC.z).lerp(Pg, ease.out(k)); else tmpP.copy(Pg);
    setInst(stuck, nst++, tmpP, 0.0042 * stK, tmpC.setHex(0xbfc4c9).lerp(new THREE.Color(0x262626), 0.85 * clamp((k - 1) / 2)));
  }
  finishInst(stuck, nst);
  const arFade = 1 - prog(t, A.troca - 0.2, 0.6);
  if (arK * arFade > 0.01) for (let i = 0; i < 44; i++) {
    const a = hash(i * 1.1) * 6.28, b = hash(i * 2.2) * 3.14, r = 0.13 * Math.cbrt(hash(i * 3.3));
    tmpP.set(FILC.x + r * Math.sin(b) * Math.cos(a) + 0.02 * Math.sin(t * 4 + i), FILC.y + r * Math.cos(b) * 1.1 + 0.02 * Math.cos(t * 3.5 + i * 2), FILC.z + r * Math.sin(b) * Math.sin(a) + 0.02 * Math.sin(t * 5 + i * 3));
    if (opened) {     // escapes through the open top and flies away
      const e = clamp((t - (A.escapa - 0.3 + hash(i * 7.7) * 0.8)) / 0.9);
      const X = DEMO.clone().add(V(0, 0.58, 0)), dir = V(hash(i * 8.1) - 0.5, 0.9, hash(i * 9.1) - 0.5).normalize();
      if (e > 0) { if (e < 0.4) tmpP.lerp(X, e / 0.4); else tmpP.copy(X).addScaledVector(dir, (e - 0.4) / 0.6 * 0.6); }
    }
    const heatC = t > A.roubaCalor && t < A.enrola ? clamp(0.6 - r * 4) : 0;
    setInst(argon, na++, tmpP, 0.005 * arK * arFade * (1 - 0.85 * pushK) * pop(t, A.enche + 0.1 + hash(i * 7) * 0.8, Infinity, 0.3), tmpC.setHex(0xb48cff).lerp(new THREE.Color(0xff7a40), heatC * 0.8));
  }
  if (pushK > 0.001) for (let j = 0; j < 14; j++) { const q = pair(j); tmpP.set(q.x0 + 0.004, FILC.y, FILC.z).addScaledVector(q.d, q.rA); setInst(argon, na++, tmpP, 0.0052 * pushK, tmpC.setHex(0xb48cff)); }
  finishInst(argon, na);
  // ---------- heat tokens (95%)
  let nh = 0;
  const heatK = win(t, A.noventa - 0.1, A.troca - 0.3, 0.5, 0.5);
  if (heatK > 0.01) for (let i = 0; i < 30; i++) { const k = fract(t * 0.5 + hash(i * 2.7)); const a = hash(i) * 6.28; tmpP.copy(BULB).add(V(Math.cos(a) * (0.2 + k * 0.3), -0.1 + k * 0.5 + hash(i * 3) * 0.2, Math.sin(a) * (0.2 + k * 0.3))); setInst(heatTok, nh++, tmpP, 0.02 * heatK * (k > 0.8 ? (1 - k) / 0.2 : 1), tmpC.setHex(0xff7a2f)); }
  const oIn = prog(t, A.oldIn, 0.5, ease.back), oOut = prog(t, A.oldOut, 0.35, ease.in);
  oldLamp.visible = t > A.oldIn - 0.01 && oOut < 0.999;
  if (oldLamp.visible) {
    oldLamp.position.set(OLD.x, 0, OLD.z);
    const off = (1 - clamp(oIn)) * 1.3 + oOut * 1.3; oldHang.position.y = off;
    const topY = OLD_SOCK_Y + 0.06 + off, L = Math.max(0.001, R.h - topY);
    oldCord.scale.set(1, L, 1); oldCord.position.y = topY + L / 2; oldCord.visible = L > 0.002;
    const on = clamp(oIn) * (1 - oOut);
    oldGlow.position.set(0, OLD_SOCK_Y - 0.135, 0); oldGlow.scale.setScalar(0.42); oldGlowM.opacity = 0.5 * on;
    oldLight.position.copy(oldGlow.position); oldLight.intensity = 2.5 * on;
    oldGlassM.emissiveIntensity = 1.5 + 0.2 * Math.sin(t * 13);
    for (let i = 0; i < 14; i++) { const k = fract(t * 0.7 + hash(i * 2.3)); const a = hash(i * 4.1) * 6.28; tmpP.set(OLD.x + Math.cos(a) * (0.06 + k * 0.05), OLD.y + off - 0.05 + k * 0.32, OLD.z + Math.sin(a) * (0.06 + k * 0.05)); setInst(heatTok, nh++, tmpP, 0.011 * on * (k > 0.75 ? (1 - k) / 0.25 : 1), tmpC.setHex(0xff7a2f)); }
  }
  finishInst(heatTok, nh);
  // ---------- compression demo: 50 cm of glowing wire coils down to 2 cm and gets much brighter
  const dwIn = pop(t, A.desseJeito - 0.2, A.noventa + 0.7, 0.4);          // stays until the camera has left it
  demoWire.visible = demoGlow.visible = dwIn > 0.001;
  if (demoWire.visible) {
    const kc = prog(t, A.meioMetro + 0.9, 1.5, ease.inOut);              // compression
    const len = lerp(0.5, 0.02, kc), k1 = clamp(kc * 1.6), k2 = clamp(kc * 2 - 0.8);
    const key = +kc.toFixed(3);
    if (demoWire.userData.key !== key) { demoWire.userData.key = key; demoWire.geometry.dispose(); demoWire.geometry = new THREE.TubeGeometry(M.filamentCurve(k1, k2, len, 0.012, 0.004, 9, 60), 400, 0.0035, 8, false); }
    demoWire.position.copy(DEMO_W); demoWire.scale.setScalar(Math.max(0.001, dwIn)); demoWire.rotation.z = 0.1;
    const bright = 1 + 5 * kc;
    demoM.emissiveIntensity = 1.0 * bright; demoM.color.setHex(kc > 0.6 ? 0xffd27a : 0xff5a3a);
    demoGlow.position.copy(DEMO_W); { const s = (0.18 + 0.42 * kc) * Math.max(0.001, dwIn); demoGlow.scale.set(s * (1.6 - 0.6 * kc), s, 1); } demoGlowM.opacity = 0.25 + 0.6 * kc;
    demoLight.position.copy(DEMO_W); demoLight.intensity = 0.4 + 5 * kc;
  } else demoLight.intensity = 0;
  // ---------- house wiring: conduit + breaker box appear, current flows to the pendant, the wall switch turns it on
  const wIn = pop(t, A.rede - 0.1, Infinity, 0.5); conduit.visible = breaker.visible = wIn > 0.001;
  wallSwitch.visible = t > A.agora - 1.0;
  breaker.scale.setScalar(Math.max(0.001, wIn)); conduit.scale.setScalar(1); conduit.children.forEach((cm) => cm.scale.set(1, Math.max(0.001, wIn), 1));
  // the wire is full of current, but it only MOVES after the switch is pressed. Before that, the part up to the switch
  // is live (bright, trembling in place) and the part after it is dead (small, still).
  const flow = win(t, A.rede + 0.1, A.parabens + 2.5, 0.3, 0.5);
  const run = Math.max(0, t - A.press1 - 0.03), go = prog(t, A.press1, 0.2);
  let nc = 0;
  if (flow > 0.01) for (let i = 0; i < 72; i++) {
    let d = (i + 0.5) / 72 * CTOT + 1.9 * run;
    const live = d < D_SW;
    if (!run) d += 0.01 * Math.sin(t * 19 + i * 1.7) * (live ? 1 : 0);
    onConduit(fract(d / CTOT), tmpP);
    setInst(current, nc++, tmpP, flow * (live ? 0.022 : lerp(0.011, 0.022, go)), null);
  }
  current.count = nc; current.instanceMatrix.needsUpdate = true;
  wallSwitch.userData.lever.position.y = t > A.press1 ? 0.02 : -0.02;
  const lit = prog(t, A.press1 + 0.02, 0.25);
  // ---------- LED
  const ledK = prog(t, A.troca + 0.4, 0.75, ease.out); led.visible = ledK > 0.001;
  led.position.copy(LEDP).add(V(-0.62, 0.1, 0.2).multiplyScalar(1 - ledK)); led.position.y += Math.sin(ledK * Math.PI) * 0.12;
  led.rotation.set(0, -1.4 * (1 - ledK), -0.5 * (1 - ledK));
  // the other chips on the board pop in once the light turns white, and stay lit with it
  led.userData.ring.forEach((c, i) => { const k = pop(t, A.branco + 0.35 + i * 0.07, Infinity, 0.3); c.visible = k > 0.001; c.scale.setScalar(Math.max(0.001, k)); });
  led.userData.smdM.emissiveIntensity = 1.6 * clamp(prog(t, A.branco + 0.4, 0.5) * (1 - prog(t, A.rosca - 0.3, 0.4)) + lit);
  // the driver (a small circuit board) rises into the neck just before the screw base closes over it
  const dK = prog(t, A.rosca - 0.3, 0.55, ease.out); driver.visible = t > A.rosca - 0.3;
  driver.position.copy(DRV_P).add(V(0, -0.35 * (1 - dK), 0)); driver.rotation.set(0, 1.2 * (1 - dK), 0);
  const ledOn = prog(t, A.chip + 0.3, 0.5) * (1 - prog(t, A.rosca - 0.3, 0.4)) + lit;
  led.userData.chipM.emissiveIntensity = 2.5 * ledOn;
  const domeIn = pop(t, A.cobre + 0.1, Infinity, 0.4); led.userData.dome.visible = domeIn > 0.001; led.userData.dome.scale.set(1.3 * domeIn, 0.9 * domeIn, 1.3 * domeIn);
  led.userData.domeM.emissiveIntensity = 0.8 * prog(t, A.po, 0.8) * Math.min(1, ledOn);
  const LEDW = LEDP.clone().add(V(0, 0.012, 0));
  const rayK = win(t, A.azul - 0.2, A.rosca - 0.3, 0.4, 0.5);
  const byFade = 1 - prog(t, A.branco - 0.15, 0.45, ease.inOut);          // blue + yellow give way to white
  rays.forEach((r, i) => {
    const yellow = i % 2 === 1;
    const on = yellow ? prog(t, A.amarelo - 0.2 + i * 0.05, 0.5) : 1;
    const grow = prog(t, A.azul - 0.25 + i * 0.03, 0.45, ease.out);
    r.visible = rayK > 0.01 && on > 0.01 && byFade > 0.01 && grow > 0.01;
    const ang = (i - 3) * 0.22;
    r.position.copy(LEDW); r.rotation.set(0, 0, -ang); r.scale.set(1, 0.34 * grow, 1);
    r.material.opacity = 0.8 * rayK * on * byFade;
  });
  const wK = prog(t, A.branco - 0.1, 0.55, ease.out) * (1 - prog(t, A.rosca - 0.3, 0.5));
  wRays.forEach((r, i) => { const ang = (i - 4) * 0.2; r.visible = wK > 0.01; r.position.copy(LEDW); r.rotation.set(0, 0, -ang); r.scale.set(1, 0.42 * wK, 1); });
  rayMatW.opacity = 0.5 * wK;
  whiteCone.visible = wK > 0.01; whiteCone.position.copy(LEDW); whiteCone.scale.set(1, 0.4 * wK, 1); coneMatW.opacity = 0.28 * wK;
  ledGlow.position.copy(LEDW); ledGlowM.color.setHex(t > A.branco - 0.1 ? 0xfff4e0 : 0x4f8dff);
  { const gk = led.visible ? clamp(prog(t, A.chip + 0.3, 0.5) * (1 - prog(t, A.rosca - 0.3, 0.4))) : 0; const s = 0.08 + 0.14 * wK; ledGlow.scale.set(s, s, 1); ledGlowM.opacity = 0.75 * gk; }
  // ---------- assembly: the screw base screws onto the neck, the pin goes on the tip
  const scK = prog(t, A.rosca - 0.05, 0.95, ease.out);
  screw.visible = t > A.rosca - 0.1;
  screw.position.copy(DEMO).add(V(0, -(1 - scK) * 0.32, 0)); screw.rotation.set(0, -(1 - scK) * Math.PI * 4, 0);
  const pinK = prog(t, A.pino - 0.05, 0.55, ease.out);
  const pin = screw.userData.pin; pin.visible = t > A.pino - 0.1; pin.position.set((1 - pinK) * 0.1, PIN_Y - (1 - pinK) * 0.3, 0); pin.scale.setScalar(Math.max(0.001, 0.4 + 0.6 * pinK));
  if (t > A.pino + 0.48 && t < A.pino + 0.6) flashK = Math.max(flashK, 0.12);
  bulb.userData.milkM.opacity = 0.8 * prog(t, A.leitoso + 0.1, 0.7);
  bulb.userData.milkM.emissiveIntensity = 2.4 * lit;
  roomLight.position.copy(SOCK).add(V(0, -0.25, 0)); roomLight.intensity = 12 * lit;
  const dim = win(t, A.continuaFraca - 0.45, A.brilharForte + 0.1, 0.4, 0.4);
  hemi.intensity = 1.0 - 0.45 * dim + 0.8 * lit; moon.intensity = 1.0 - 0.5 * dim;
}

/* ------------------------------------------------------------------ efeitos sonoros: cada ação tem o seu som (nomes = arquivos de biblioteca/efeitos) */
ambiente('crickets', 0.0, DURATION, -30, { pan: -0.3, fade: 0.5 });
ambiente('pump', A.tira - 0.1, A.semOx + 0.5, -17, { pan: -0.3, fade: 0.3 });
ambiente('fire', A.quase - 0.25, A.metalMais - 0.3, -15, { pan: 0.0, fade: 0.3, env: (t) => 0.35 + 0.65 * clamp((t - A.quase) / 2.2) });
ambiente('fire', A.metalMais + 0.2, A.travel0 + 0.7, -17, { pan: 0.1, fade: 0.4 });
// ---------------- efeitos únicos
som('slide', A.pilha + 0.45, -12);   // battery slides to the wool
som('click', A.pilha + 1.0, -16);
som('sparks', A.pilha + 1.15, -11);   // first contact: sparks
som('fizz', A.esquentam - 0.1, -10);
som('sparks', A.brilham - 0.05, -13, 0.2);
som('whoosh', A.iluminam - 0.2, -20);
som('lighton', A.iluminam + 0.0, -16);
som('uhul', A.uhul, -1);   // the puppet cheers
som('powerdown', A.fraquinha + 0.05, -12);   // the light fades…
som('aah', A.aah, -2);   // …and he goes "aaah"
som('sizzle', A.reagem + 0.1, -18);
som('zap', A.oxigenio + 0.3, -21);
som('bubbles', A.reagem + 0.05, -15);   // oxygen bumping into the hot wires
som('ash', A.cinza - 0.05, -10);   // crumbling into ash
som('sizzle', A.queimam - 0.1, -14);
som('whoosh', A.poe - 0.05, -18);
som('click', A.poe + 0.72, -15);
som('glass', A.bulbo + 0.3, -13);
som('whoosh', A.tira - 0.3, -21);
som('pop2', A.naoQueima - 0.1, -17);
som('sparkle', A.vacuo - 0.1, -21);
som('whoosh', A.continuaFraca - 0.3, -21);
som('whoosh', A.brilharForte - 0.3, -21);
som('pop2', A.brilharForte - 0.15, -16);
som('rise', A.brilharForte + 0.1, -4, { pan: 0.15, dur: A.burst - (A.brilharForte + 0.1), fadeIn: 0.05, fadeOut: 0.04 });   // termômetro subindo (cortado até estourar)
som('boom', A.burst - 0.03, 0);   // ...and bursting
som('shatter', A.burst - 0.01, -6);
som('whoosh', A.quase - 0.3, -19);
som('melt', A.quase + 0.45, -15, -0.2);
som('melt', A.quase + 1.0, -15, 0.0);
som('melt', A.derreteu - 0.2, -14, 0.2);
som('melt', A.derreteu + 0.5, -16, -0.1);
som('whoosh', A.metalMais - 0.3, -21);
som('pop', A.metalMais + 0.2, -16);
som('ping', A.tungstenio - 0.05, -12);
som('pop', A.metalMais + 0.45, -14);   // speech balloon
som('whoosh', A.travel0 + 0.05, -15);   // tungsten flies into the bulb
som('sparkle', A.travel1 - 0.05, -12);
som('tinkle', A.evaporando + 0.2, -18);
som('tinkle', A.gruda + 0.1, -15);
som('tinkle', A.escuro - 0.2, -18);
som('snap', A.arrebentar + 0.02, -8);
som('whoosh', A.enche - 0.3, -21);
som('gas', A.enche + 0.1, -13);
som('bounce', A.empurram - 0.25, -6);
som('bounce', A.empurram + 1.2, -8);
som('pop2', A.duraMais - 0.1, -17);
som('popoff', A.abrir + 0.12, -11);
som('gas', A.escapa - 0.15, -12);
som('bubbles', A.oxEntra - 0.05, -14);   // oxygen rushes in…
som('fizz', A.oxEntra + 0.3, -15);   // …and the filament flares up
som('burnout', A.jaEra - 0.32, -10);
som('pop2', A.comprar - 0.12, -16);
som('whoosh', A.masGas - 0.12, -22);
som('whoosh', A.roubaCalor - 0.3, -21);
som('spring', A.enrola + 0.1, -13);
som('spring', A.maisUmaVez + 0.05, -12);
som('whoosh', A.desseJeito - 0.3, -21);
som('pop', A.desseJeito - 0.1, -15);
som('spring', A.meioMetro + 0.9, -11);
som('sparkle', A.doisCm + 0.3, -13);
som('whoosh', A.noventa - 0.3, -21);
som('pop', A.noventa + 0.45, -15);   // the energy bar pops in…
som('barfill', A.noventa + 0.75, -14);   // …fills to 95 %…
som('pop2', A.viraCalor + 0.25, -13);   // …"95% CALOR"
som('sparkle', A.cinco + 0.05, -13);   // the 5 % light slice forms
som('pop2', A.viraLuz + 0.25, -13);   // "5% LUZ"
som('sizzle', A.noventa + 0.2, -18);
som('magic', A.oldIn - 0.05, -4);
som('sizzle', A.touch - 0.02, -15);
som('ouch', A.touch + 0.02, -9);
som('magic', A.oldOut - 0.02, -8);
som('whoosh', A.troca - 0.3, -21);
som('slide', A.troca - 0.12, -17);   // the glass lifts…
som('whoosh', A.troca + 0.1, -17);   // …the old filament and its posts go out…
som('whoosh', A.troca + 0.42, -16);   // …the LED board flies in…
som('click', A.troca + 1.1, -12);   // …and lands
som('glass', A.chip + 0.6, -15);   // the glass dome comes back down
som('ledon', A.chip + 0.3, -12);
som('zap', A.azul + 0.1, -19);
som('pop', A.cobre + 0.1, -15);
som('sparkle', A.amarelo - 0.1, -18);
som('sparkle', A.branco - 0.05, -14);
for (let i = 0; i < 7; i++) som('pop', A.branco + 0.35 + i * 0.07, -23, (i - 3) * 0.08);   // the other chips pop onto the board
som('slide', A.rosca - 0.3, -18);   // the driver slides into the neck
som('click', A.rosca + 0.22, -17);
som('screw', A.rosca + 0.05, -13);
som('click', A.rosca + 0.88, -13);
som('whoosh', A.pino - 0.05, -22);
som('click', A.pino + 0.48, -13);
som('pop', A.leitoso + 0.15, -15);
som('steps', A.step0 - 0.05, -20);
som('whoosh', A.fly0, -17);
som('twist', A.raise1 + 0.02, -12);
som('twist', A.raise1 + 0.26, -13);
som('twist', A.raise1 + 0.49, -12);
som('click', A.twist1 - 0.03, -13);
som('steps', A.walk0 + 0.05, -15);
som('whoosh', A.rede - 0.3, -21);
som('relay', A.rede + 0.3, -14);
som('switch', A.press1 - 0.02, -10);
som('lighton', A.press1 + 0.04, -8);
som('tada', A.parabens - 0.06, -4);
som('pop2', A.comente, -14);

/* ------------------------------------------------------------------ liga tudo */
iniciar({ duracao: DURATION, ancoras: A, update, desenhar, flash: () => flashK });
