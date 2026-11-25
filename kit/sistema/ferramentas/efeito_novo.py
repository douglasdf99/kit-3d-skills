"""Cria um efeito sonoro novo com a ElevenLabs e coloca na biblioteca.

Uso:  python3 sistema/ferramentas/efeito_novo.py <nome> "descrição EM INGLÊS do som" [segundos]
Ex.:  python3 sistema/ferramentas/efeito_novo.py zipper "A zipper being pulled closed quickly. No music, no voice." 1.2
Vozes de boneco: "A cute little cartoon toy character saying 'oba!' happily, high pitched, playful. No music."
Sai em biblioteca/efeitos/novos/<nome>.mp3 e entra no catálogo (efeitos.json).
"""
import os, sys
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

if __name__ == '__main__':
    def main():
        a = sys.argv[1:]
        if len(a) < 2: raise Erro(__doc__)
        nome, desc = slug(a[0]).replace('-', '_'), a[1]
        dur = float(a[2]) if len(a) > 2 else None
        if nome in indice_efeitos(): raise Erro(f'já existe um efeito chamado "{nome}" — escolha outro nome')
        corpo = {'text': desc, 'model_id': 'eleven_text_to_sound_v2', 'prompt_influence': 0.6}
        if dur: corpo['duration_seconds'] = max(0.5, min(22, dur))
        mp3 = eleven('/v1/sound-generation?output_format=mp3_44100_128', corpo, timeout=180, bruto=True)
        pasta = os.path.join(BIBLIOTECA, 'efeitos', 'novos'); os.makedirs(pasta, exist_ok=True)
        p = os.path.join(pasta, nome + '.mp3'); open(p, 'wb').write(mp3)
        cat_p = os.path.join(BIBLIOTECA, 'efeitos', 'efeitos.json'); cat = ler_json(cat_p, {'efeitos': []})
        import subprocess as _sp
        try: dur = float(_sp.run([ffmpeg().replace('ffmpeg', 'ffprobe') if shutil.which('ffprobe') else 'ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout.strip())
        except Exception: dur = corpo.get('duration_seconds', 0) or 0
        cat['efeitos'].append({'nome': nome, 'arquivo': f'novos/{nome}.mp3', 'categoria': 'novos', 'descricao': desc, 'duracao': round(dur, 2), 'volume': -14})
        salvar_json(cat_p, cat); catalogo_efeitos_md()
        try: pagina_sons()
        except Exception: pass
        print(f'OK — efeito "{nome}" criado ({rel(p)}). Use na cena com: som(\'{nome}\', A.algumaCoisa, -14)')
    principal(main)
