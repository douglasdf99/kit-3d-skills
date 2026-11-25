"""Confere a cena de um vídeo SEM abrir o navegador: acha erros de código, âncoras que não existem,
efeitos sonoros com nome errado — e exporta tudo o que o montar_audio.py precisa.

Uso:  python3 sistema/ferramentas/conferir.py "Meus Videos/<tema>"
"""
import json, os, sys, tempfile, shutil
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *


def conferir(pasta, silencioso=False):
    globais, v, est = globais_cena(pasta)
    entrada = os.path.join(pasta, 'cena', 'cena.js')
    if not os.path.exists(entrada): raise Erro(f'não existe {rel(entrada)}')
    ordem, fontes = grafo_modulos(id_de(entrada))
    tmp = tempfile.mkdtemp(prefix='conferir_')
    try:
        with open(os.path.join(tmp, 'package.json'), 'w') as f: f.write('{"type":"module"}')
        url = lambda mid: 'file://' + os.path.join(tmp, 'm', mid).replace('\\', '/').replace(' ', '%20')
        raiz_m = os.path.realpath(os.path.join(tmp, 'm'))
        for mid in ordem:
            src = fontes[mid]
            for d in ordem: src = src.replace('__MOD__(' + d + ')__', url(d))
            p = os.path.realpath(os.path.join(tmp, 'm', mid))
            if not p.startswith(raiz_m + os.sep): raise Erro('o vídeo precisa estar dentro da pasta do kit (em "Meus Videos"). Arquivo fora do kit: ' + mid)
            os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, 'w', encoding='utf-8').write(src)
        with open(os.path.join(tmp, 'globais.json'), 'w', encoding='utf-8') as arquivo_globais:
            json.dump(globais, arquivo_globais, ensure_ascii=False)
        shutil.copy(os.path.join(SISTEMA, 'ferramentas', 'node', 'conferir.mjs'), os.path.join(tmp, 'run.mjs'))
        saida = os.path.join(tmp, 'saida.json')
        r = subprocess.run([node(), os.path.join(tmp, 'run.mjs'), os.path.join(tmp, 'globais.json'), url(id_de(entrada)), saida], capture_output=True, text=True, timeout=600)
        if not os.path.exists(saida):
            raise Erro('o Node não conseguiu rodar a cena:\n' + (r.stderr or r.stdout)[-1500:].replace(os.path.join(tmp, 'm') + '/', '').replace('file://', ''))
        res = json.load(open(saida, encoding='utf-8'))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    if res.get('erro'):
        e = res['erro']; pil = e.get('pilha', '').replace(os.path.join(tmp, 'm') + '/', '').replace('file://', '')
        raise Erro('a cena tem um erro:\n  ' + e['mensagem'] + ('\n  onde:\n    ' + pil.strip().replace('\n', '\n    ') if pil else ''))
    # efeitos sonoros existem?
    idx = indice_efeitos(pasta)
    faltando = sorted({s['nome'] for s in res['sons']} | {a['nome'] for a in res['ambientes']} - set(idx))
    faltando = [n for n in faltando if n not in idx]
    if faltando:
        dicas = '; '.join(f'"{n}" (parecidos: {", ".join(parecidos(n, idx)) or "nenhum"})' for n in faltando)
        raise Erro('a cena usa efeitos sonoros que não existem na biblioteca: ' + dicas + '. Veja biblioteca/efeitos/efeitos.json, ou crie um novo com efeito_novo.py.')
    avisos = list(res.get('avisos', []))
    D = res['duracao']
    if D > 180: avisos.append(f'o vídeo tem {D:.1f} s — passa de 3 minutos (limite dos Shorts). Encurte o roteiro.')
    for s in res['sons']:
        if s['t'] > D + 0.05: avisos.append(f'som "{s["nome"]}" em {s["t"]:.2f}s cai depois do fim do vídeo ({D:.2f}s)')
    if 'parabens' not in res['ancoras'] and not v.get('batida_final'):
        avisos.append('não achei a âncora A.parabens — a batida final da música vai cair no início da penúltima linha do roteiro')
    tom = res['tomadas']
    if len(tom) < max(4, D / 8): avisos.append(f'só {len(tom)} tomadas de câmera pra {D:.0f}s de vídeo — a série costuma ter uma tomada nova a cada 2–4 s')
    salvar_json(os.path.join(pasta, 'audio', 'cena.json'), res)
    if not silencioso:
        print(f'OK — cena sem erros. Duração {D:.2f} s · {len(res["ancoras"])} âncoras · {len(tom)} tomadas · {len(res["letreiros"])} letreiros/plaquinhas · {len(res["sons"])} efeitos + {len(res["ambientes"])} ambientes')
        for a in avisos: print('  aviso: ' + a)
    return res, avisos


if __name__ == '__main__':
    def main():
        if len(sys.argv) < 2: raise Erro('uso: python3 sistema/ferramentas/conferir.py "Meus Videos/<tema>"')
        conferir(pasta_video(sys.argv[1]))
    principal(main)
