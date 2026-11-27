// Tira fotos de momentos do vídeo com o Chrome/Edge sem janela (usado pelo fotos.py; não rode direto).
// uso: node quadros.mjs <navegador> <pagina.html> <pasta_saida> <pasta_perfil> <porta> t1 t2 ...
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [, , NAV, PAGINA, SAIDA, PERFIL, PORTA, ...TS] = process.argv;
const ch = spawn(NAV, ['--headless=new', `--remote-debugging-port=${PORTA}`, `--user-data-dir=${PERFIL}`, '--allow-file-access-from-files',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--window-size=1200,1000', pathToFileURL(PAGINA).href], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sair = (msg, cod = 1) => { if (msg) console.error(msg); try { ch.kill(); } catch (e) {} process.exit(cod); };
setTimeout(() => sair('ERRO: demorou demais pra tirar as fotos'), 240000);
if (typeof WebSocket === 'undefined') sair('ERRO: este Node é antigo; as fotos precisam do Node 22 ou mais novo (https://nodejs.org/pt, botão LTS)');
let alvo;
for (let i = 0; i < 60 && !alvo; i++) { await sleep(500); try { alvo = (await (await fetch(`http://127.0.0.1:${PORTA}/json`)).json()).find((x) => x.type === 'page'); } catch (e) {} }
if (!alvo) sair('ERRO: o navegador não abriu a página');
const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const avaliar = (expr) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true, returnByValue: true } })); });
let pronto = false;
for (let i = 0; i < 120 && !pronto; i++) { pronto = (await avaliar('!!(window.__KIT__ && window.OV && window.composeFrame)')).result?.result?.value; if (!pronto) await sleep(500); }
if (!pronto) sair('ERRO: a página do vídeo não carregou (rode o fazer_tudo.py antes)');
await sleep(1500);
for (const t of TS) {
  const r = await avaliar(`(async()=>{ window.__KIT__.quadro(${+t}); window.composeFrame(${+t}); await new Promise(r=>setTimeout(r,200)); window.composeFrame(${+t}); return window.OV.toDataURL('image/jpeg',0.82); })()`);
  const v = r.result?.result?.value;
  if (!v) { console.error('  não consegui a foto do segundo ' + t); continue; }
  writeFileSync(`${SAIDA}/q_${(+t).toFixed(1).padStart(5, '0')}s.jpg`, Buffer.from(v.split(',')[1], 'base64'));
}
ws.close(); sair('', 0);
