"""Instala no kit as trilhas e os efeitos sonoros PRÓPRIOS da skill (e tira os do kit).

Uso (rode de qualquer pasta):
  python3 "<pasta da skill>/modelos/instalar_modelos.py" "<pasta do kit>"          instala trilhas + efeitos
  python3 "<pasta da skill>/modelos/instalar_modelos.py" "<pasta do kit>" gerar    cria na ElevenLabs os efeitos que faltam
                                                                                   (gasta créditos: confirme com a pessoa)
O que faz ao instalar:
  - trilhas: copia modelos/trilhas/*.mp3 pra biblioteca/musicas/, analisa cada uma e deixa no musicas.json SÓ as da skill;
  - efeitos: copia modelos/efeitos/*.mp3 pra biblioteca/efeitos/skill/ e deixa no efeitos.json SÓ os da skill
    (mesmos nomes que o motor e os estilos usam: whoosh, pop2, rewind…); apaga os efeitos baixados do kit;
  - estilo: baixa o estilo do GitHub (lá ele se chama "cubinhos") e renomeia tudo pra "quadradinhos";
  - config/canal.json: trilha padrão = "calma" e estilo padrão = "quadradinhos".
Depois disso NÃO rode `baixar.py video`, `baixar.py efeito:` nem `baixar.py musica:` (trariam de volta os sons do kit).
"""
import json, os, shutil, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
MARCA = 'skill-criativo-video-reels'


def ff(kit):
    sys.path.insert(0, os.path.join(kit, 'sistema', 'ferramentas'))
    import kit as K  # noqa
    return K


def volume(K, p):
    r = subprocess.run([K.ffmpeg(), '-v', 'info', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = [l for l in r.splitlines() if l.strip().startswith('I:')]
    P = [l for l in r.splitlines() if l.strip().startswith('Peak:')]
    return (float(I[-1].split()[1]) if I else None), (float(P[-1].split()[1]) if P else 0.0)


def nivelar(K, p, alvo=-16.0, teto=-1.0):
    """deixa o efeito no volume padrão (-16 LUFS) sem passar de -1 dBFS de pico"""
    I, pk = volume(K, p)
    if I is None or I < -60: return
    g = min(alvo - I, teto - pk)
    tmp = p + '.tmp.mp3'
    subprocess.run([K.ffmpeg(), '-v', 'error', '-y', '-i', p, '-af', f'volume={g:.2f}dB', '-ar', '44100', '-b:a', '160k', tmp], check=True)
    os.replace(tmp, p)


def duracao(K, p):
    r = subprocess.run([K.ffmpeg(), '-i', p, '-f', 'null', '-'], capture_output=True, text=True).stderr
    for l in r.splitlines():
        if 'Duration:' in l:
            h, m, s = l.split('Duration:')[1].split(',')[0].strip().split(':'); return round(int(h) * 3600 + int(m) * 60 + float(s), 2)
    return 0


def estilo_quadradinhos(kit):
    """baixa o estilo de blocos (no GitHub: cubinhos) e deixa ele com o nome da skill: quadradinhos"""
    est = os.path.join(kit, 'biblioteca', 'estilos'); src = os.path.join(est, 'cubinhos'); dst = os.path.join(est, 'quadradinhos')
    if not os.path.isdir(src) and not os.path.isdir(dst):
        bp = os.path.join(kit, 'sistema', 'ferramentas', 'baixar.py')
        if subprocess.run([sys.executable, bp, 'estilo:quadradinhos'], cwd=kit).returncode != 0:
            subprocess.run([sys.executable, bp, 'estilo:cubinhos'], cwd=kit, check=True)   # repositório antigo
    if os.path.isdir(src):
        if os.path.isdir(dst): shutil.rmtree(dst)
        shutil.move(src, dst)
    if not os.path.isdir(dst): raise SystemExit('não consegui baixar o estilo (confira a internet e rode de novo)')
    for f in ('demo.mp4',):
        if os.path.exists(os.path.join(dst, f)): os.remove(os.path.join(dst, f))
    print_skill = os.path.join(AQUI, 'estilos', 'quadradinhos.jpg')
    if os.path.exists(print_skill): shutil.copyfile(print_skill, os.path.join(dst, 'cena.jpg'))
    for f in os.listdir(dst):
        if not f.endswith(('.js', '.json', '.md')): continue
        p = os.path.join(dst, f); t = open(p, encoding='utf-8').read()
        t2 = t.replace('CUBINHOS', 'QUADRADINHOS').replace('Cubinhos', 'Quadradinhos').replace('cubinhos', 'quadradinhos')
        if t2 != t: open(p, 'w', encoding='utf-8').write(t2)
    # textos do kit que citam o estilo pelo nome antigo (comentários e instruções; não mexe nos caminhos do GitHub)
    docs = [os.path.join(kit, 'CLAUDE.md'), os.path.join(kit, 'sistema', 'motor', 'edicao.js')]
    pi = os.path.join(kit, 'sistema', 'instrucoes')
    if os.path.isdir(pi): docs += [os.path.join(pi, f) for f in os.listdir(pi) if f.endswith('.md')]
    for p in docs:
        if not os.path.exists(p): continue
        t = open(p, encoding='utf-8').read()
        t2 = t.replace("PEÇA NOVA: HÉLICE", "NOVIDADE: PRODUTO").replace('Cubinhos', 'Quadradinhos').replace('cubinhos', 'quadradinhos')
        if t2 != t: open(p, 'w', encoding='utf-8').write(t2)
    pj = os.path.join(dst, 'estilo.json'); d = json.load(open(pj, encoding='utf-8')); d['nome'] = 'Quadradinhos'
    json.dump(d, open(pj, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def gerar(kit):
    K = ff(kit)
    lista = json.load(open(os.path.join(AQUI, 'efeitos', 'efeitos.json'), encoding='utf-8'))['efeitos']
    for e in lista:
        p = os.path.join(AQUI, 'efeitos', e['nome'] + '.mp3')
        if os.path.exists(p): continue
        corpo = {'text': e['en'], 'model_id': 'eleven_text_to_sound_v2', 'prompt_influence': 0.7, 'duration_seconds': max(0.5, min(22, e['seg']))}
        mp3 = K.eleven('/v1/sound-generation?output_format=mp3_44100_128', corpo, timeout=180, bruto=True)
        open(p, 'wb').write(mp3); nivelar(K, p)
        print('ok', e['nome'], flush=True)


def instalar(kit):
    K = ff(kit)
    bib = os.path.join(kit, 'biblioteca')
    # ---- trilhas
    from analisar_musica import analisar, lufs, REFERENCIA_LUFS
    tr = json.load(open(os.path.join(AQUI, 'trilhas', 'trilhas.json'), encoding='utf-8'))['trilhas']
    pm = os.path.join(bib, 'musicas'); os.makedirs(pm, exist_ok=True)
    nossos = {t['id'] for t in tr}
    for f in os.listdir(pm):
        if f.endswith(('.mp3', '.wav', '.ogg')) and f.rsplit('.', 1)[0] not in nossos: os.remove(os.path.join(pm, f))
    cat_p = os.path.join(pm, 'musicas.json'); antigos = {m['id']: m for m in K.ler_json(cat_p, {'musicas': []})['musicas']}
    musicas = []
    for t in tr:
        destino = os.path.join(pm, t['id'] + '.mp3')
        shutil.copyfile(os.path.join(AQUI, 'trilhas', t['id'] + '.mp3'), destino)
        a = antigos.get(t['id'])
        if a is None or a.get('origem') != MARCA:
            r = analisar(destino); L = lufs(destino)
            a = {'ganho': round(REFERENCIA_LUFS - L, 1) if L is not None else 0.0, 'lufs': L, **r}
        musicas.append({**a, 'id': t['id'], 'arquivo': t['id'] + '.mp3', 'titulo': t['nome'], 'descricao': t['portugues'], 'origem': MARCA})
    K.salvar_json(cat_p, {'musicas': musicas})
    # ---- efeitos
    pe = os.path.join(bib, 'efeitos'); ps = os.path.join(pe, 'skill')
    for d in os.listdir(pe) if os.path.isdir(pe) else []:
        x = os.path.join(pe, d)
        if os.path.isdir(x) and d != 'skill': shutil.rmtree(x)
    os.makedirs(ps, exist_ok=True)
    lista = json.load(open(os.path.join(AQUI, 'efeitos', 'efeitos.json'), encoding='utf-8'))['efeitos']
    efeitos = []
    for e in lista:
        src = os.path.join(AQUI, 'efeitos', e['nome'] + '.mp3')
        if not os.path.exists(src): print('falta o arquivo do efeito', e['nome'], '(rode com "gerar")'); continue
        shutil.copyfile(src, os.path.join(ps, e['nome'] + '.mp3'))
        efeitos.append({'nome': e['nome'], 'arquivo': 'skill/' + e['nome'] + '.mp3', 'categoria': 'skill', 'momento': e['momento'],
                        'descricao': e['pt'], 'duracao': duracao(K, src), 'volume': -14, 'origem': MARCA})
    K.salvar_json(os.path.join(pe, 'efeitos.json'), {'efeitos': efeitos})
    try: K.catalogo_efeitos_md(); K.pagina_sons()
    except Exception: pass
    # ---- estilo
    estilo_quadradinhos(kit)
    # ---- trilha e estilo padrão
    cp = os.path.join(kit, 'config', 'canal.json')
    if os.path.exists(cp):
        c = json.load(open(cp, encoding='utf-8')); c['musica_padrao'] = 'calma'; c['estilo'] = 'quadradinhos'; K.salvar_json(cp, c)
    print(f'OK — estilo Quadradinhos, {len(musicas)} trilhas e {len(efeitos)} efeitos da skill instalados no kit.')


if __name__ == '__main__':
    if len(sys.argv) < 2 or not os.path.exists(os.path.join(sys.argv[1], 'CLAUDE.md')):
        sys.exit(__doc__)
    kit = os.path.abspath(sys.argv[1])
    (gerar if sys.argv[2:3] == ['gerar'] else instalar)(kit)
