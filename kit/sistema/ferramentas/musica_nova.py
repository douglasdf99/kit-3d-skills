"""Cria uma trilha nova com a ElevenLabs (música instrumental) e coloca na biblioteca, já analisada.

Uso:  python3 sistema/ferramentas/musica_nova.py <id> "descrição EM INGLÊS do clima e dos instrumentos" [segundos] ["descrição em português"]
Ex.:  python3 sistema/ferramentas/musica_nova.py noite_sombria "Dark, tense horror ambient: low drones, music box, distant piano notes, soft heartbeat drum" 150 "Terror: tensa e sombria"
Pra trilhas de fundo de vídeo: o pedido já inclui "começa no primeiro tempo, sem silêncios, sem voz, com uma batida final forte ~10 s antes do fim".
Custa créditos da ElevenLabs (a música é cobrada por minuto): confirme com a pessoa antes de gerar.
Sai em biblioteca/musicas/<id>.mp3 e entra em musicas.json (use no video.json: "musica": "<id>").
"""
import os, sys
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
from analisar_musica import analisar, lufs, REFERENCIA_LUFS

if __name__ == '__main__':
    def main():
        a = sys.argv[1:]
        if len(a) < 2: raise Erro(__doc__)
        mid, desc = slug(a[0]).replace('-', '_'), a[1]
        seg = max(30, min(300, int(float(a[2])))) if len(a) > 2 else 160
        pt = a[3] if len(a) > 3 else ''
        pasta = os.path.join(BIBLIOTECA, 'musicas'); cat_p = os.path.join(pasta, 'musicas.json'); cat = ler_json(cat_p, {'musicas': []})
        if any(x['id'] == mid for x in cat['musicas']): raise Erro(f'já existe uma trilha chamada "{mid}" — escolha outro nome')
        final = seg - 10
        prompt = (f"{desc}. Instrumental background music for a short vertical video with voice-over. "
                  "The music starts right away on the first beat (no quiet intro) and keeps going without breakdowns, gaps or stops, "
                  "uncluttered so a voice sits on top. "
                  f"At {final // 60} minutes {final % 60} seconds there is one big, clear final hit (full chord with a cymbal or impact on the downbeat), "
                  "then the last chord rings out and fades over about eight seconds until the end. No vocals.")
        corpo = {'prompt': prompt, 'model_id': 'music_v1', 'force_instrumental': True, 'music_length_ms': seg * 1000}
        print(f'gerando "{mid}" ({seg} s)… pode levar alguns minutos')
        mp3 = eleven('/v1/music/stream?output_format=mp3_44100_128', corpo, timeout=900, bruto=True)
        if len(mp3) < 20000: raise Erro('a ElevenLabs devolveu um arquivo pequeno demais (a música não veio). Tente de novo em instantes.')
        p = os.path.join(pasta, mid + '.mp3'); open(p, 'wb').write(mp3)
        r = analisar(p); L = lufs(p)
        e = {'id': mid, 'arquivo': mid + '.mp3', 'titulo': mid.replace('_', ' ').title(), 'descricao': pt or desc,
             'ganho': round(REFERENCIA_LUFS - L, 1) if L is not None else 0.0, 'lufs': L, **r}
        cat['musicas'].append(e); salvar_json(cat_p, cat)
        try: pagina_sons()
        except Exception: pass
        print(f'OK — trilha "{mid}" criada: {r["bpm"]} BPM, batida final em {r["batida_final"]} s. Use no video.json: "musica": "{mid}"')
        if r['buracos']: print('  aviso: a trilha tem silêncios no meio (ruim debaixo da narração) — vale gerar de novo')
    principal(main)
