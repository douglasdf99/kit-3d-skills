"""Gera o Estilos.html (galeria dos estilos visuais, com imagens de exemplo) na pasta do kit.

Uso:  python3 sistema/ferramentas/estilos.py
Cada estilo é uma pasta em biblioteca/estilos/<nome>/ com estilo.json, estilo.js (boneco, cenários, peças), GUIA.md,
cena_modelo.js, as imagens personagem.jpg (o boneco modelo) e cena.jpg (uma cena com a edição do estilo) e, se tiver, demo.mp4 (10 s de vídeo no estilo).
(o estilo padrão também tem referencias/ com imagens de vídeos da série).
"""
import glob, html, os, sys
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *


def gerar():
    base = os.path.join(BIBLIOTECA, 'estilos')
    nomes = sorted(d for d in os.listdir(base) if os.path.exists(os.path.join(base, d, 'estilo.json')))
    nomes.sort(key=lambda n: (ler_json(os.path.join(base, n, 'estilo.json')).get('ordem', 99), n))
    c = canal()
    blocos, linhas = [], []
    for i, n in enumerate(nomes, 1):
        e = ler_json(os.path.join(base, n, 'estilo.json'))
        imgs = [p for p in (os.path.join(base, n, 'personagem.jpg'), os.path.join(base, n, 'cena.jpg')) if os.path.exists(p)] or sorted(glob.glob(os.path.join(base, n, 'exemplo_*.*')))
        legendas = ['o boneco modelo', 'uma cena com a edição do estilo']
        refs = sorted(glob.glob(os.path.join(base, n, 'referencias', '*.*')))
        url = lambda p: '/'.join(map(lambda s: s.replace(' ', '%20'), rel(p).replace('\\', '/').split('/')))
        atual = ' <span class="tag">em uso</span>' if n == c.get('estilo') else ''
        cu = e.get('custo') or {}
        if cu:
            dm = os.path.join(base, n, 'demo.mp4'); cj = os.path.join(base, n, 'cena.jpg')
            nota = int(cu.get('nota', 50)); faixa = 'leve' if nota < 45 else 'médio' if nota < 65 else 'pesado'
            linhas.append(f'<tr data-video="{url(dm) if os.path.exists(dm) else ""}" data-nome="{html.escape(e.get("nome", n))}" data-num="{i}" data-obs="{html.escape(cu.get("obs", ""))}">'
                          f'<td><span class="num">{i}</span></td><td class="nm"><a href="#e{i}">{html.escape(e.get("nome", n))}</a>{atual}</td>'
                          + (f'<td><button class="play" title="Ver o vídeo de 10 s"><img src="{url(cj)}" alt="" loading="lazy"><span>▶</span></button></td>' if os.path.exists(dm) else '<td>—</td>')
                          + f'<td><div class="peso"><div class="barra"><i style="width:{nota}%" class="{faixa}"></i></div><b>{nota}</b> <small>{faixa}</small></div></td>'
                          f'<td>{html.escape(cu.get("creditos", ""))}</td><td>{html.escape(cu.get("tempo_claude", ""))}</td><td>{html.escape(cu.get("render_2min", ""))}</td><td>{html.escape(cu.get("correcoes", ""))}</td></tr>')
        b = [f'<section class="est" id="e{i}"><h2><span class="num">{i}</span>{html.escape(e.get("nome", n))}{atual}</h2>',
             f'<p>{html.escape(e.get("descricao", ""))}</p>'
             + (f'<p><b>Como é a edição:</b> {html.escape((e.get("edicao") or {}).get("resumo", ""))}</p>' if (e.get("edicao") or {}).get("resumo") else '')
             + f'<p class="id">nome pra pedir pro Claude: <code>{n}</code></p>',
             '<div class="g dupla' + (' tripla' if os.path.exists(os.path.join(base, n, 'demo.mp4')) else '') + '">'
             + (f'<figure><video src="{url(os.path.join(base, n, "demo.mp4"))}" controls playsinline preload="metadata"' + (f' poster="{url(os.path.join(base, n, "cena.jpg"))}"' if os.path.exists(os.path.join(base, n, 'cena.jpg')) else '') + '></video><figcaption>10 segundos de vídeo neste estilo (aperte o play, tem som)</figcaption></figure>' if os.path.exists(os.path.join(base, n, 'demo.mp4')) else '')
             + ''.join(f'<figure><img src="{url(p)}" alt="{html.escape(legendas[k] if k < 2 else "exemplo")} — estilo {html.escape(e.get("nome", n))}" loading="lazy"><figcaption>{legendas[k] if k < 2 and os.path.basename(p) in ("personagem.jpg", "cena.jpg") else ""}</figcaption></figure>' for k, p in enumerate(imgs)) + '</div>']
        if refs:
            b.append('<details><summary>Ver quadros de outros vídeos da série neste estilo</summary><div class="g ref">' + ''.join(f'<img src="{url(p)}" alt="" loading="lazy">' for p in refs) + '</div></details>')
        blocos.append(''.join(b) + '</section>')
    tabela = ('<section class="est comp"><h2>Compare os estilos</h2>'
              '<p>Clique no ▶ pra ver 10 segundos de cada estilo (com som). O <b>peso</b> junta tudo o que um vídeo custa pra fazer: créditos do Claude, tempo dele montando a cena, tempo de render e quantas rodadas de correção costumam aparecer. Quanto menor, mais leve.</p>'
              '<div class="rolar"><table><thead><tr><th>#</th><th>Estilo</th><th>Vídeo</th><th>Peso (0–100)</th><th>Créditos do Claude</th><th>Claude montando</th><th>Render de 2 min</th><th>Correções previstas</th></tr></thead><tbody>'
              + ''.join(linhas) + '</tbody></table></div>'
              '<p class="nota">Estimativa pra um vídeo de 1min30 a 2min30 com 5 a 7 peças, num computador com placa de vídeo. Num notebook sem placa de vídeo, o render leva 2 a 3 vezes mais. O primeiro vídeo pesa uns 30 a 50% a mais em qualquer estilo. A narração (ElevenLabs) custa o mesmo em todos.</p></section>'
              '<dialog id="dlg"><div class="dlg"><button class="x" aria-label="Fechar">✕</button><video id="dv" controls playsinline></video><div><h3 id="dn"></h3><p id="do"></p><p class="esc">Gostou? Diga pro Claude: <b id="dq"></b></p></div></div></dialog>') if linhas else ''
    doc = f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Estilos visuais</title>
<style>
:root {{ --bg: #f3f1ec; --card: #fffdf9; --ink: #1f2328; --muted: #6a6f76; --line: #dcd8cf; --accent: #d9481c; color-scheme: light; }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg: #15171a; --card: #1e2125; --ink: #ecebe7; --muted: #a2a7ad; --line: #30343a; --accent: #ff7a4d; color-scheme: dark; }} }}
:root[data-theme="dark"] {{ --bg: #15171a; --card: #1e2125; --ink: #ecebe7; --muted: #a2a7ad; --line: #30343a; --accent: #ff7a4d; color-scheme: dark; }}
* {{ box-sizing: border-box; }} html, body {{ margin: 0; }}
body {{ background: var(--bg); color: var(--ink); font: 15px/1.5 "Segoe UI", system-ui, sans-serif; padding: 28px 16px 48px; }}
main {{ max-width: 1100px; margin: 0 auto; display: grid; gap: 22px; }}
h1 {{ margin: 0; font: 800 34px/1.1 "Segoe UI", system-ui, sans-serif; }}
.sub {{ color: var(--muted); margin: 6px 0 0; }}
.est {{ background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 18px 20px; display: grid; gap: 10px; }}
.est h2 {{ margin: 0; font: 800 22px/1.2 "Segoe UI", system-ui, sans-serif; display: flex; align-items: center; gap: 10px; }}
.num {{ display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 15px; }}
.tag {{ font: 600 12px "Segoe UI", sans-serif; background: var(--accent); color: #fff; border-radius: 999px; padding: 2px 10px; }}
.est p {{ margin: 0; color: var(--muted); }} .id code {{ color: var(--ink); font-weight: 600; }}
.g {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }}
.g img {{ width: 100%; aspect-ratio: 9 / 16; object-fit: cover; border-radius: 10px; border: 1px solid var(--line); background: #111; }}
.g.ref {{ grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); margin-top: 10px; }}
.g.dupla {{ grid-template-columns: repeat(2, minmax(0, 260px)); }}
.g.tripla {{ grid-template-columns: repeat(auto-fit, minmax(150px, 230px)); }}
.g video {{ width: 100%; aspect-ratio: 9 / 16; border-radius: 10px; border: 1px solid var(--line); background: #111; }}
figure {{ margin: 0; display: grid; gap: 4px; }} figcaption {{ color: var(--muted); font-size: 13px; text-align: center; }}
details summary {{ cursor: pointer; color: var(--accent); font-weight: 600; }}
.novo {{ border-style: dashed; }}
.rolar {{ overflow-x: auto; }} table {{ width: 100%; border-collapse: collapse; min-width: 760px; }}
th {{ text-align: left; font: 600 12px "Segoe UI", sans-serif; color: var(--muted); text-transform: uppercase; letter-spacing: .03em; padding: 6px 8px; border-bottom: 1px solid var(--line); }}
td {{ padding: 8px; border-bottom: 1px solid var(--line); vertical-align: middle; }} tbody tr {{ cursor: pointer; }} tbody tr:hover {{ background: color-mix(in srgb, var(--accent) 7%, transparent); }}
td.nm a {{ color: var(--ink); font-weight: 700; text-decoration: none; }} td.nm .tag {{ margin-left: 6px; }}
.play {{ position: relative; width: 46px; height: 82px; padding: 0; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: #111; cursor: pointer; }}
.play img {{ width: 100%; height: 100%; object-fit: cover; display: block; }} .play span {{ position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-size: 20px; text-shadow: 0 1px 4px #000; }}
.peso {{ display: flex; align-items: center; gap: 8px; }} .barra {{ width: 90px; height: 8px; border-radius: 4px; background: var(--line); overflow: hidden; }}
.barra i {{ display: block; height: 100%; }} .barra i.leve {{ background: #2f9e5b; }} .barra i.médio {{ background: #d9a400; }} .barra i.pesado {{ background: #d9481c; }}
.peso small {{ color: var(--muted); }} .nota {{ font-size: 13px; }}
dialog {{ border: 0; border-radius: 16px; padding: 0; background: var(--card); color: var(--ink); max-width: min(92vw, 640px); }} dialog::backdrop {{ background: rgba(0,0,0,.6); }}
.dlg {{ display: grid; grid-template-columns: minmax(0, 300px) 1fr; gap: 16px; padding: 16px; position: relative; }} .dlg video {{ width: 100%; aspect-ratio: 9 / 16; border-radius: 10px; background: #000; }}
.dlg h3 {{ margin: 4px 0 6px; font: 800 20px "Segoe UI", sans-serif; }} .dlg p {{ margin: 0 0 10px; color: var(--muted); }} .dlg .esc {{ color: var(--ink); }}
.x {{ position: absolute; top: 8px; right: 10px; border: 0; background: none; color: var(--muted); font-size: 18px; cursor: pointer; }}
@media (max-width: 560px) {{ .dlg {{ grid-template-columns: 1fr; }} }}
</style></head><body><main>
<header><h1>Estilos visuais</h1><p class="sub">Cada estilo é um jeito diferente de vídeo: o boneco, o cenário e a edição mudam juntos. Escolha um e diga o número (ou o nome) pro Claude — ele faz o vídeo inteiro nesse estilo. O boneco modelo é sempre de camisa branca, calça azul-escura e cabelo preto; dá pra pedir outro visual.</p></header>
{tabela}
{''.join(blocos)}
<section class="est novo"><h2><span class="num">+</span>Criar o meu estilo</h2><p>Peça pro Claude: “quero criar um estilo meu” — mande uma imagem de referência (print de um vídeo que você gosta, sua marca, suas cores) ou descreva. Ele parte do estilo mais parecido, ajusta boneco, cenário, letreiros e edição, mostra as duas imagens e você ajusta até gostar. O estilo novo aparece aqui.</p></section>
</main>
<script>
const dlg = document.getElementById('dlg'), dv = document.getElementById('dv');
document.querySelectorAll('tr[data-video]').forEach((tr) => tr.addEventListener('click', (ev) => {{
  if (ev.target.closest('a')) return; const v = tr.dataset.video; if (!v) return;
  dv.src = v; document.getElementById('dn').textContent = tr.dataset.num + ' · ' + tr.dataset.nome;
  document.getElementById('do').textContent = tr.dataset.obs; document.getElementById('dq').textContent = '“quero o estilo ' + tr.dataset.num + '”';
  dlg.showModal(); dv.play().catch(() => {{}});
}}));
const fechar = () => {{ dv.pause(); dlg.close(); }};
dlg.querySelector('.x').onclick = fechar; dlg.addEventListener('click', (e) => {{ if (e.target === dlg) fechar(); }}); dlg.addEventListener('close', () => dv.pause());
</script></body></html>
'''
    open(os.path.join(KIT, 'Estilos.html'), 'w', encoding='utf-8').write(doc)
    print(f'OK — Estilos.html atualizado ({len(nomes)} estilos).')


if __name__ == '__main__':
    principal(gerar)
