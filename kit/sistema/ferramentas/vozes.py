"""Vozes da ElevenLabs: listar, ouvir amostras e escolher a voz do canal.

Uso:  python3 sistema/ferramentas/vozes.py listar
      python3 sistema/ferramentas/vozes.py amostras            (amostras de vozes no idioma do canal, pra pessoa escutar)
      python3 sistema/ferramentas/vozes.py amostra <voz_id> ["frase"]
      python3 sistema/ferramentas/vozes.py escolher <voz_id>   (também aceita o número da amostra: escolher 2)
As amostras vão pra "config/amostras de voz/" (01 - Nome.mp3, 02 - …). A lista fica em amostras.json, na mesma pasta.
Se a conta não tiver vozes no idioma do canal, busca vozes nativas na biblioteca pública da ElevenLabs
(ex.: sotaque brasileiro) e adiciona na conta da pessoa (em "My Voices"). Dá pra remover depois no site.
"""
import json, os, sys, urllib.request
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

FRASES = {
    'pt': 'Se você liga um fio numa pilha, ele esquenta e brilha. Então você coloca esse fio dentro de um bulbo de vidro. Parabéns! Você construiu uma lâmpada.',
    'en': 'If you connect a wire to a battery, it heats up and glows. So you put that wire inside a glass bulb. Congratulations! You built a light bulb.',
    'es': 'Si conectas un alambre a una pila, se calienta y brilla. Entonces pones ese alambre dentro de una bombilla de vidrio. ¡Felicidades! Construiste una bombilla.',
}
SOTAQUE = {'pt': 'brazilian', 'es': '', 'en': ''}
TIPOS = {'cloned': 'clone (sua voz)', 'professional': 'da biblioteca', 'premade': 'pronta da ElevenLabs', 'generated': 'criada', 'famous': 'famosa'}
PASTA = os.path.join(CONFIG, 'amostras de voz')


def todas():
    return eleven('/v1/voices', timeout=60).get('voices', [])


def idiomas(v):
    lab = v.get('labels') or {}
    ls = {(lab.get('language') or '').lower()} | {(x.get('language') or '').lower() for x in (v.get('verified_languages') or [])}
    return {x for x in ls if x}


def nativa(v, lang):
    """voz feita nesse idioma (não só "também fala"): idioma principal igual, ou sotaque do idioma"""
    lab = v.get('labels') or {}
    if (lab.get('language') or '').lower() == lang: return True
    return bool(SOTAQUE.get(lang)) and SOTAQUE[lang] in (sotaque(v) or '').lower()


def sotaque(v):
    lab = v.get('labels') or {}
    acc = lab.get('accent') or next((x.get('accent') for x in (v.get('verified_languages') or []) if x.get('accent')), '')
    return acc or ''


def descrever(v):
    lab = v.get('labels') or {}
    g = {'male': 'masculina', 'female': 'feminina', 'neutral': 'neutra'}.get(lab.get('gender') or v.get('gender'), '')
    return ', '.join(x for x in [g, sotaque(v) or v.get('accent'), TIPOS.get(v.get('category'), v.get('category'))] if x)


def listar():
    vs = todas()
    if not vs: raise Erro('nenhuma voz na conta. Entre em elevenlabs.io → Voices e adicione uma (ou clone a sua).')
    lang = canal()['idioma'][:2]
    ordem = {'cloned': 0, 'professional': 1, 'generated': 2, 'premade': 3}
    vs.sort(key=lambda v: (not nativa(v, lang), ordem.get(v.get('category'), 9), v.get('name', '')))
    for v in vs:
        print(f"  {v['voice_id']}  {v.get('name')}  [{descrever(v)}]  idiomas: {', '.join(sorted(idiomas(v))) or '?'}")


def amostra(vid, frase=None, arquivo=None):
    c = canal(); lang = c['idioma'][:2]
    corpo = {'text': frase or FRASES.get(lang, FRASES['pt']), 'model_id': c['modelo'],
             'voice_settings': {'stability': c['estabilidade'], 'similarity_boost': c['similaridade']}, 'language_code': lang}
    mp3 = eleven(f'/v1/text-to-speech/{vid}?output_format=mp3_44100_128', corpo, timeout=120, bruto=True)
    os.makedirs(PASTA, exist_ok=True)
    p = os.path.join(PASTA, arquivo or f'{vid}.mp3'); open(p, 'wb').write(mp3)
    return p


def da_biblioteca(lang, ja_tem, n_por_genero=2):
    """vozes nativas da biblioteca pública (com sotaque do idioma), boas pra narração"""
    achadas = []
    for genero in ('male', 'female'):
        q = f'/v1/shared-voices?language={lang}&page_size=30&sort=trending&gender={genero}'
        if SOTAQUE.get(lang): q += f'&accent={SOTAQUE[lang]}'
        try: vs = eleven(q, timeout=60).get('voices', [])
        except Erro: continue
        boas = [v for v in vs if v.get('voice_id') not in ja_tem and v.get('free_users_allowed', True) is not False]
        boas.sort(key=lambda v: (v.get('use_case') not in ('narrative_story', 'social_media', 'informative_educational', 'conversational'), -(v.get('usage_character_count_1y') or 0)))
        achadas += boas[:n_por_genero]
    return achadas


def adicionar(v):
    r = eleven(f"/v1/voices/add/{v['public_owner_id']}/{v['voice_id']}", {'new_name': v.get('name', 'Voz')[:60]}, timeout=60)
    return r.get('voice_id') or v['voice_id']


def amostras():
    lang = canal()['idioma'][:2]
    conta = todas(); ids = {v['voice_id'] for v in conta}
    ordem = {'cloned': 0, 'professional': 1, 'generated': 2, 'premade': 3}
    no_idioma = sorted([v for v in conta if nativa(v, lang)], key=lambda v: (ordem.get(v.get('category'), 9), v.get('name', '')))
    escolhidas = [{'voice_id': v['voice_id'], 'nome': v.get('name'), 'tipo': descrever(v), 'na_conta': True} for v in no_idioma[:4]]
    if len(escolhidas) < 4 and lang != 'en':
        for v in da_biblioteca(lang, ids):
            if len(escolhidas) >= 6: break
            try: novo = adicionar(v)
            except Erro as e: print('  (não deu pra adicionar a voz', v.get('name'), '—', str(e)[:120], ')'); continue
            escolhidas.append({'voice_id': novo, 'nome': v.get('name'), 'tipo': descrever(v) + ', adicionada agora na sua conta', 'na_conta': True})
    if len(escolhidas) < 4:
        prontas = [v for v in conta if v.get('category') == 'premade' and v['voice_id'] not in {e['voice_id'] for e in escolhidas}]
        for g in ('male', 'female'):
            for v in [x for x in prontas if (x.get('labels') or {}).get('gender') == g][:2]:
                escolhidas.append({'voice_id': v['voice_id'], 'nome': v.get('name'), 'tipo': descrever(v), 'na_conta': True})
    if not escolhidas: raise Erro('não achei nenhuma voz pra testar. Adicione uma voz no site da ElevenLabs (Voices) e rode de novo.')
    os.makedirs(PASTA, exist_ok=True)
    lista = []
    for i, e in enumerate(escolhidas[:6], 1):
        nome_arq = f"{i:02d} - {slug(e['nome'] or 'voz')[:40]}.mp3"
        try: amostra(e['voice_id'], arquivo=nome_arq)
        except Erro as er: print(f"  (amostra {i} falhou: {str(er)[:120]})"); continue
        lista.append({**e, 'numero': i, 'arquivo': nome_arq})
        print(f"  {i:02d}  {e['nome']}  [{e['tipo']}]  voz_id {e['voice_id']}")
    salvar_json(os.path.join(PASTA, 'amostras.json'), {'idioma': lang, 'amostras': lista})
    print('Abra a pasta "config/amostras de voz", escute os arquivos e diga o número da voz que gostou.')
    print('Depois: python3 sistema/ferramentas/vozes.py escolher <número ou voz_id>')


def escolher(arg):
    vid = arg
    if arg.isdigit():
        am = ler_json(os.path.join(PASTA, 'amostras.json'), {'amostras': []})['amostras']
        e = next((x for x in am if x['numero'] == int(arg)), None)
        if not e: raise Erro(f'não tem amostra número {arg} (rode: vozes.py amostras)')
        vid = e['voice_id']
    v = next((x for x in todas() if x['voice_id'] == vid), None)
    if not v: raise Erro('essa voz não está na sua conta da ElevenLabs (confira o id com: vozes.py listar)')
    cp = os.path.join(CONFIG, 'canal.json'); c = ler_json(cp, dict(CANAL_PADRAO))
    c['voz_id'] = vid; c['voz_nome'] = v.get('name'); salvar_json(cp, c)
    print(f'OK — voz do canal: {v.get("name")} ({vid})')


if __name__ == '__main__':
    def main():
        a = sys.argv[1:]
        if not a or a[0] == 'listar': listar()
        elif a[0] == 'amostras': amostras()
        elif a[0] == 'amostra' and len(a) > 1: print('  amostra: ' + rel(amostra(a[1], a[2] if len(a) > 2 else None)))
        elif a[0] == 'escolher' and len(a) > 1: escolher(a[1])
        else: raise Erro(__doc__)
    principal(main)
