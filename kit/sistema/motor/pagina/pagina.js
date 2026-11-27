/* Página de prévia + render (vai embutida no "ABRIR NO CHROME - ….html" de cada vídeo).
   Carrega a cena, mostra a prévia com som, renderiza o MP4 final (imagem H.264 + áudio AAC) e gera imagens de revisão. */
(() => {
  const $ = (id) => document.getElementById(id);
  const INFO = window.__INFO__ || {};
  const APP = document.querySelector('.app');
  const etapa = (n) => { if (APP) APP.dataset.etapa = String(n); };   // funil do topo: 1 assistir · 2 gerar · 3 ajustar
  const pôr = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
  const W = 1080, H = 1920, FPS = 30;
  const log = (s) => { const el = $('log'); if (el) el.textContent = s + '\n' + el.textContent.slice(0, 8000); console.log('[kit] ' + s); };
  const URLS = {};
  const nomeDe = (txt) => { let s = String(txt || ''); for (const [id, u] of Object.entries(URLS)) s = s.split(u).join(id); return s; };
  let parado = false;
  function mostrarErro(titulo, det) {
    parado = true; pausar();
    $('erro').hidden = false; $('erro-t').textContent = titulo; $('erro-d').textContent = nomeDe(det);
    $('status').textContent = 'Parou por causa de um erro (veja a caixa vermelha lá em cima).'; $('status').className = '';
    window.__KIT_ERRO__ = titulo + '\n' + nomeDe(det);
  }
  window.addEventListener('error', (e) => mostrarErro('Deu um erro na cena', (e.error && e.error.stack) || (e.message + ' (' + e.filename + ':' + e.lineno + ')')));
  window.addEventListener('unhandledrejection', (e) => mostrarErro('Deu um erro na cena', (e.reason && e.reason.stack) || String(e.reason)));
  $('erro-copiar').onclick = () => { const t = $('erro-t').textContent + '\n' + $('erro-d').textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { $('erro-copiar').textContent = 'Copiado ✓'; }).catch(() => { const r = document.createRange(); r.selectNodeContents($('erro-d')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }); };

  const b64 = (s) => { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
  const fmt = (t) => { t = Math.max(0, t); const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); };
  const baixar = (blob, nome) => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- carregar a cena (os módulos vão embutidos neste arquivo) */
  async function carregarModulos() {
    const M = window.__MODS__, ORD = window.__ORDEM__;
    for (const id of ORD) {
      const src = M[id].replace(/__MOD__\(([^)]+)\)__/g, (m, dep) => { if (!URLS[dep]) throw new Error('módulo não carregado: ' + dep); return URLS[dep]; });
      URLS[id] = URL.createObjectURL(new Blob([src + '\n//# sourceURL=' + id.replace(/ /g, '_')], { type: 'text/javascript' }));
    }
    await import(URLS[window.__ENTRADA__]);
    await window.__VIDEO_PRONTO__;
  }

  /* ---------- áudio: MP3 pra prévia, AAC (ADTS) pra colocar dentro do MP4 sem recodificar */
  let audioEl = null;
  function lerADTS(bytes) {
    const frames = []; let i = 0, cfg = null;
    while (i + 7 <= bytes.length) {
      if (bytes[i] !== 0xFF || (bytes[i + 1] & 0xF0) !== 0xF0) { i++; continue; }
      const semCRC = bytes[i + 1] & 1, perfil = (bytes[i + 2] >> 6) & 3, sf = (bytes[i + 2] >> 2) & 0xF;
      const ch = ((bytes[i + 2] & 1) << 2) | ((bytes[i + 3] >> 6) & 3);
      const len = ((bytes[i + 3] & 3) << 11) | (bytes[i + 4] << 3) | ((bytes[i + 5] >> 5) & 7);
      if (len < 7 || i + len > bytes.length) break;
      const hdr = semCRC ? 7 : 9;
      if (!cfg) cfg = { obj: perfil + 1, sf, ch };
      frames.push(bytes.subarray(i + hdr, i + len)); i += len;
    }
    if (!cfg) return null;
    const rates = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
    const asc = new Uint8Array([(cfg.obj << 3) | (cfg.sf >> 1), ((cfg.sf & 1) << 7) | (cfg.ch << 3)]);
    return { frames, sampleRate: rates[cfg.sf], channels: cfg.ch, asc };
  }
  let AAC = null;
  function prepararAudio() {
    if (window.__AUDIO_MP3__) { audioEl = new Audio(URL.createObjectURL(new Blob([b64(window.__AUDIO_MP3__)], { type: 'audio/mpeg' }))); audioEl.preload = 'auto'; }
    if (window.__AUDIO_AAC__) { AAC = lerADTS(b64(window.__AUDIO_AAC__)); if (!AAC) log('aviso: não consegui ler o áudio AAC'); }
    if (!audioEl) log('aviso: este vídeo ainda não tem áudio montado (rode montar_audio.py)');
  }

  /* ---------- prévia */
  const prev = $('prev'), pctx = prev.getContext('2d');
  let D = 1, tNow = 0, tocando = false, raf = 0, perf0 = 0, t0Play = 0, ocupado = false;
  function quadro(t) { window.composeFrame(t); pctx.drawImage(window.OV, 0, 0, prev.width, prev.height); $('tempo').textContent = fmt(t) + ' / ' + fmt(D); if (!arrastando) $('pos').value = String(Math.round(1000 * t / D)); }
  function loop() {
    if (!tocando || parado) return;
    const t = audioEl && !audioEl.paused ? audioEl.currentTime : t0Play + (performance.now() - perf0) / 1000;
    if (t >= D) { pausar(); tNow = 0; quadro(0); return; }
    tNow = t; quadro(t); raf = requestAnimationFrame(loop);
  }
  function tocar() {
    if (ocupado || parado) return;
    if (tNow >= D - 0.05) tNow = 0;
    tocando = true; $('play').textContent = '❚❚'; $('play').setAttribute('aria-label', 'Pausar');
    t0Play = tNow; perf0 = performance.now();
    if (audioEl) { audioEl.currentTime = tNow; audioEl.play().catch((e) => log('áudio: ' + e.message)); }
    loop();
  }
  function pausar() { tocando = false; $('play').textContent = '▶'; $('play').setAttribute('aria-label', 'Assistir'); if (audioEl) audioEl.pause(); cancelAnimationFrame(raf); }
  let arrastando = false;
  $('play').onclick = () => (tocando ? pausar() : tocar());
  $('pos').addEventListener('input', () => { arrastando = true; pausar(); tNow = D * (+$('pos').value) / 1000; quadro(tNow); });
  $('pos').addEventListener('change', () => { arrastando = false; });
  $('leve').addEventListener('change', () => { window.setEscala($('leve').checked ? 0.5 : 1); quadro(tNow); });
  document.addEventListener('keydown', (e) => { if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') { e.preventDefault(); tocando ? pausar() : tocar(); } });

  /* ---------- render final */
  let blobOut = null, nomeOut = '';
  function fila() { try { return decodeURIComponent(location.hash.slice(1)).split('|'); } catch (e) { return []; } }
  function proximoDaFila() {
    const f = fila(); if (f[0] !== 'auto' || f.length < 2) return;
    $('status').textContent += ' Abrindo o próximo vídeo da fila…';
    setTimeout(() => { location.href = encodeURI(f[1]) + '#' + encodeURIComponent(['auto', ...f.slice(2)].join('|')); }, 2500);
  }
  async function renderizar() {
    if (ocupado || parado) return;
    pausar(); ocupado = true; blobOut = null; $('save').hidden = true; $('go').disabled = true; $('status').className = ''; etapa(2);
    const wasLeve = $('leve').checked; window.setEscala(1);
    try {
      if (!('VideoEncoder' in window)) throw new Error('Este navegador não consegue gerar vídeo. Abra este arquivo no Google Chrome (ou no Microsoft Edge).');
      const t0 = Math.max(0, +$('t0').value || 0), t1 = Math.min(D, +$('t1').value || D);
      const bitrate = (+$('mbps').value || 16) * 1e6;
      const n = Math.max(1, Math.round((t1 - t0) * FPS));
      let vcfg = { codec: 'avc1.640033', width: W, height: H, bitrate, framerate: FPS, hardwareAcceleration: 'prefer-hardware', latencyMode: 'quality', avc: { format: 'avc' } }, vcodec = 'avc';
      if (!(await VideoEncoder.isConfigSupported(vcfg)).supported) {
        vcfg.hardwareAcceleration = 'no-preference';
        if (!(await VideoEncoder.isConfigSupported(vcfg)).supported) {
          vcfg = { codec: 'vp09.00.10.08', width: W, height: H, bitrate, framerate: FPS }; vcodec = 'vp9';
          if (!(await VideoEncoder.isConfigSupported(vcfg)).supported) throw new Error('Este navegador não tem codificador de vídeo. Use o Google Chrome atualizado.');
          log('aviso: sem H.264 neste navegador — gerando em VP9 (funciona no YouTube; prefira o Google Chrome).');
        } else log('Sem codificador por hardware; usando o do processador (fica mais lento, mas funciona).');
      }
      const { Muxer, ArrayBufferTarget } = await import(URLS['sistema/motor/vendor/mp4-muxer.mjs']);
      const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: vcodec, width: W, height: H, frameRate: FPS },
        audio: AAC ? { codec: 'aac', numberOfChannels: AAC.channels, sampleRate: AAC.sampleRate } : undefined, fastStart: 'in-memory', firstTimestampBehavior: 'offset' });
      if (AAC) {
        const fd = 1024 / AAC.sampleRate, k0 = Math.floor(t0 / fd + 1e-6), k1 = Math.min(AAC.frames.length, Math.ceil(t1 / fd));
        for (let k = k0; k < k1; k++) muxer.addAudioChunkRaw(AAC.frames[k], 'key', Math.round((k - k0) * fd * 1e6), Math.round(fd * 1e6),
          k === k0 ? { decoderConfig: { codec: 'mp4a.40.2', numberOfChannels: AAC.channels, sampleRate: AAC.sampleRate, description: AAC.asc } } : undefined);
      } else log('aviso: renderizando SEM SOM (este vídeo ainda não tem áudio montado).');
      let encErr = null;
      const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { encErr = e; } });
      enc.configure(vcfg);
      const start = performance.now();
      for (let i = 0; i < n; i++) {
        if (encErr) throw encErr;
        if (parado) throw new Error('render interrompido por um erro na cena');
        const t = t0 + i / FPS;
        window.composeFrame(t);
        const f = new VideoFrame(window.OV, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
        enc.encode(f, { keyFrame: i % (FPS * 2) === 0 }); f.close();
        while (enc.encodeQueueSize > 4) await sleep(1);
        if (i % 15 === 0) {
          const el = (performance.now() - start) / 1000, v = (i + 1) / el;
          $('bar').style.width = (100 * (i + 1) / n).toFixed(1) + '%';
          $('status').textContent = `Renderizando… ${Math.round(100 * (i + 1) / n)}% · faltam uns ${Math.max(1, Math.round((n - i - 1) / Math.max(v, 0.1)))} s`;
          pctx.drawImage(window.OV, 0, 0, prev.width, prev.height);
          await sleep(0);
        }
      }
      await enc.flush(); enc.close(); muxer.finalize();
      blobOut = new Blob([muxer.target.buffer], { type: 'video/mp4' });
      const el = (performance.now() - start) / 1000;
      $('bar').style.width = '100%';
      const parcial = t0 > 0.01 || t1 < D - 0.01;
      nomeOut = parcial ? (INFO.arquivo || 'video.mp4').replace(/\.mp4$/, ` (trecho ${Math.round(t0)}-${Math.round(t1)}s).mp4`) : (INFO.arquivo || 'video.mp4');
      baixar(blobOut, nomeOut);
      $('status').textContent = `Pronto! “${nomeOut}” foi pra sua pasta Downloads (${(blobOut.size / 1e6).toFixed(0)} MB, ${Math.round(el)} s pra renderizar).` + (AAC ? '' : ' Atenção: sem som.');
      $('status').className = 'ok'; $('save').hidden = false; etapa(3);
      log(`render ok: ${n} quadros em ${el.toFixed(1)} s (${(n / el).toFixed(1)} q/s), vídeo ${vcodec}, áudio ${AAC ? 'aac' : 'nenhum'}`);
      proximoDaFila();
      window.__KIT_RENDER__ = { ok: true, bytes: blobOut.size, segundos: el, vcodec };
    } catch (e) {
      if (!parado) { $('status').textContent = 'Erro no render: ' + (e && e.message || e); log('ERRO: ' + nomeDe((e && e.stack) || e)); }
      window.__KIT_RENDER__ = { ok: false, erro: String(e && e.message || e) };
    }
    if (wasLeve) window.setEscala(0.5);
    ocupado = false; $('go').disabled = false; quadro(tNow);
  }
  $('go').onclick = renderizar;
  $('save').onclick = () => blobOut && baixar(blobOut, nomeOut || INFO.arquivo || 'video.mp4');

  /* ---------- imagens pra mandar pro Claude */
  function temposFolha(N) {
    const tom = (window.__VIDEO__ && window.__VIDEO__.tomadas) || [];
    let ts = tom.map((s) => s.t + Math.min(s.dur || 0, 1.2) + 0.5).filter((t) => t > 0.2 && t < D - 0.2);
    if (ts.length > N) { const o = []; for (let i = 0; i < N; i++) o.push(ts[Math.round(i * (ts.length - 1) / (N - 1))]); ts = o; }
    while (ts.length < N) ts.push((D * (ts.length + 0.5)) / N);
    return ts.sort((a, b) => a - b);
  }
  async function folha() {
    if (ocupado || parado) return; pausar(); ocupado = true;
    try {
      const N = 16, cols = 4, cw = 270, chh = 480, top = 70;
      const c = document.createElement('canvas'); c.width = cw * cols; c.height = top + chh * Math.ceil(N / cols); const x = c.getContext('2d');
      x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = '#fff'; x.font = '700 30px system-ui, sans-serif'; x.textBaseline = 'middle'; x.fillText(`${INFO.titulo || ''} v${INFO.versao || 1} — folha de revisão`, 16, top / 2);
      const ts = temposFolha(N);
      for (let i = 0; i < ts.length; i++) {
        window.composeFrame(ts[i]); const cx = (i % cols) * cw, cy = top + Math.floor(i / cols) * chh;
        x.drawImage(window.OV, cx, cy, cw, chh);
        x.fillStyle = 'rgba(0,0,0,0.7)'; x.fillRect(cx + 6, cy + 6, 96, 34); x.fillStyle = '#ffd21f'; x.font = '700 22px ui-monospace, monospace'; x.fillText(fmt(ts[i]), cx + 12, cy + 24);
        x.strokeStyle = '#111'; x.lineWidth = 2; x.strokeRect(cx, cy, cw, chh);
        if (i % 4 === 3) await sleep(0);
      }
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86));
      baixar(blob, `revisao - ${INFO.titulo || 'video'} v${INFO.versao || 1}.jpg`);
      $('status').textContent = 'A folha de revisão foi pra pasta Downloads — arraste ela pro chat do Claude.'; $('status').className = 'ok';
    } finally { ocupado = false; quadro(tNow); }
  }
  async function fotoQuadro() {
    if (ocupado || parado) return; pausar();
    window.composeFrame(tNow);
    const blob = await new Promise((r) => window.OV.toBlob(r, 'image/jpeg', 0.9));
    const s = tNow.toFixed(1).replace('.', ',');
    baixar(blob, `quadro ${s}s - ${INFO.titulo || 'video'} v${INFO.versao || 1}.jpg`);
    $('status').textContent = `A foto do segundo ${fmt(tNow)} foi pra pasta Downloads — arraste ela pro chat do Claude.`; $('status').className = 'ok';
  }
  $('folha').onclick = folha; $('quadro').onclick = fotoQuadro;

  /* ---------- começar */
  (async () => {
    document.title = `${INFO.titulo || 'Vídeo'} v${INFO.versao || 1}`;
    $('titulo').textContent = INFO.tema || INFO.titulo || 'Vídeo';
    pôr('titulo2', `versão ${INFO.versao || 1} · carregando a cena…`);
    const vs = $('ver-seguro'); if (vs && APP) vs.onchange = () => APP.classList.toggle('com-seguro', vs.checked);
    if (!window.WebGLRenderingContext) { mostrarErro('Este navegador não mostra 3D', 'Abra este arquivo no Google Chrome (ou no Microsoft Edge).'); return; }
    prepararAudio();
    try { await carregarModulos(); } catch (e) { mostrarErro('Não consegui carregar a cena', (e && e.stack) || String(e)); return; }
    D = window.DURATION;
    $('t1').value = D.toFixed(2);
    $('info').textContent = [INFO.canal, INFO.gerado && ('montado em ' + INFO.gerado)].filter(Boolean).join(' · ');
    pôr('titulo2', `versão ${INFO.versao || 1} · pronta pra virar MP4`);
    pôr('k-dur', fmt(D).replace(/\.\d$/, '')); pôr('k-estilo', INFO.estilo || '–'); pôr('k-musica', INFO.musica && INFO.musica !== 'nenhuma' ? INFO.musica : 'sem trilha');
    etapa(1);
    quadro(0);
    $('go').disabled = false; $('folha').disabled = false; $('quadro').disabled = false;
    $('status').textContent = 'Tudo pronto. Assista à prévia ou clique em Gerar vídeo final.';
    window.__KIT__ = { renderizar, folha, fotoQuadro, quadro: (t) => { tNow = t; quadro(t); } };
    // #auto = renderiza sozinho ao abrir · #auto|outra.html|mais.html = depois do download abre a próxima da fila (uma de cada vez)
    if (fila()[0] === 'auto') { await sleep(800); renderizar(); }
  })();
})();
