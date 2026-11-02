"""Monta o LEIA-ME.html do pacote: injeta no template os textos dos arquivos do pacote e o diagrama.

Uso, a partir de engine/copilot-studio: python3 fonte/monta.py
"""
import html
import re
import sys
from pathlib import Path

AQUI = Path(__file__).parent
PACOTE = Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI.parent
CS = PACOTE / "agentes"


def blocos(arquivo):
    return re.findall(r"```text\n(.*?)```", (CS / arquivo).read_text(), re.S)


def esc(s):
    return html.escape(s.rstrip("\n"), quote=False)


# ── diagrama ────────────────────────────────────────────────────────────────
W, H = 150, 56
COL = [10, 230, 450, 670, 890]
LIN = [50, 200, 350]
CORES = {  # (fundo, borda)
    "pessoa": ("#E6F0F9", "#005CA9"),
    "copilot": ("#EDE7F6", "#5B3FA6"),
    "github": ("#FFF1D6", "#8F5600"),
    "arquivo": ("#E5F3EC", "#1E7F5C"),
    "check": ("#FBEAE5", "#BE4B33"),
}
NOS = {
    "analista": (0, 1, "Analista", "Teams ou navegador", "pessoa"),
    "data": (1, 0, "Data de hoje", "tópico", "copilot"),
    "agente": (1, 1, "Agente Docqui Caixa", "instruções + skill", "copilot"),
    "retro": (1, 2, "Retro", "agente filho", "copilot"),
    "mcp": (2, 1, "GitHub MCP", "login do analista", "github"),
    "app": (2, 2, "GitHub App", "docqui-bot", "github"),
    "engine": (3, 0, "Repositório do engine", "método na main · issues", "arquivo"),
    "spec": (3, 1, "Especificação", "historia/<CHAVE>", "arquivo"),
    "regen": (3, 2, "regenera-gerados", "workflow", "github"),
    "revisor": (4, 0, "Revisor", "e code owner", "pessoa"),
    "pr": (4, 1, "Pull request", "draft → revisão", "github"),
    "checks": (4, 2, "Checks do PR", "spec-guard · gate-check", "check"),
}


def caixa(c, l):
    return COL[c], LIN[l]


def no(chave):
    c, l, rot, sub, tipo = NOS[chave]
    x, y = caixa(c, l)
    f, b = CORES[tipo]
    return (f'<g><rect x="{x}" y="{y}" width="{W}" height="{H}" rx="8" fill="{f}" stroke="{b}" stroke-width="1.5"/>'
            f'<text x="{x + W / 2}" y="{y + 24}" text-anchor="middle" font-size="13" font-weight="600" fill="#1B2B4B">{html.escape(rot)}</text>'
            f'<text x="{x + W / 2}" y="{y + 42}" text-anchor="middle" font-size="11" fill="#4A5873">{html.escape(sub)}</text></g>')


def seta(pontos, rotulo="", lx=0, ly=0, ancora="middle", tracejada=False, cor="#1B2B4B"):
    d = "M" + " L".join(f"{x},{y}" for x, y in pontos)
    tr = ' stroke-dasharray="5 4"' if tracejada else ""
    s = f'<path d="{d}" fill="none" stroke="{cor}" stroke-width="1.6"{tr} marker-end="url(#ponta)"/>'
    if rotulo:
        s += (f'<text x="{lx}" y="{ly}" text-anchor="{ancora}" font-size="11" fill="#1B2B4B" '
              f'paint-order="stroke" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round">{html.escape(rotulo)}</text>')
    return s


def regiao(x, y, w, h, rotulo, cor, dx=10):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="none" stroke="{cor}" stroke-width="1.2" stroke-dasharray="6 4"/>'
            f'<text x="{x + dx}" y="{y + 15}" font-size="11" font-weight="600" fill="{cor}">{html.escape(rotulo)}</text>')


meio_y = lambda l: LIN[l] + H / 2
dir_x = lambda c: COL[c] + W
cen_x = lambda c: COL[c] + W / 2

partes = [
    '<svg viewBox="0 0 1090 430" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif" aria-hidden="true">',
    '<defs><marker id="ponta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#1B2B4B"/></marker></defs>',
    regiao(218, 22, 174, 398, "Copilot Studio", "#5B3FA6"),
    regiao(658, 172, 174, 98, "Repositório <sistema>-doc", "#1E7F5C"),
    regiao(658, 322, 394, 98, "GitHub Actions", "#8F5600", dx=122),
]
partes += [
    seta([(dir_x(0), meio_y(1)), (COL[1], meio_y(1))], "conversa", (dir_x(0) + COL[1]) / 2, meio_y(1) - 8),
    seta([(dir_x(1), meio_y(1)), (COL[2], meio_y(1))], "lê e grava", (dir_x(1) + COL[2]) / 2, meio_y(1) - 8),
    seta([(dir_x(2), meio_y(1)), (COL[3], meio_y(1))], "commit", (dir_x(2) + COL[3]) / 2, meio_y(1) - 8),
    seta([(dir_x(3), meio_y(1)), (COL[4], meio_y(1))], "PR", (dir_x(3) + COL[4]) / 2, meio_y(1) - 8),
    seta([(cen_x(1), LIN[1]), (cen_x(1), LIN[0] + H)], "data", cen_x(1) + 8, (LIN[0] + H + LIN[1]) / 2 + 4, "start"),
    seta([(cen_x(1), LIN[1] + H), (cen_x(1), LIN[2])], "retro no fim", cen_x(1) + 8, (LIN[1] + H + LIN[2]) / 2 + 4, "start"),
    seta([(cen_x(2), LIN[1]), (cen_x(2), meio_y(0)), (COL[3], meio_y(0))], "lê o método · issue", (cen_x(2) + COL[3]) / 2 + 6, meio_y(0) - 8),
    seta([(cen_x(4), LIN[0] + H), (cen_x(4), LIN[1])], "revisa e mescla", cen_x(4) + 8, (LIN[0] + H + LIN[1]) / 2 + 4, "start"),
    seta([(cen_x(3) - 22, LIN[1] + H), (cen_x(3) - 22, LIN[2])], "push", cen_x(3) - 30, (LIN[1] + H + LIN[2]) / 2 + 4, "end", True),
    seta([(cen_x(3) + 22, LIN[2]), (cen_x(3) + 22, LIN[1] + H)], "[gerado]", cen_x(3) + 30, (LIN[1] + H + LIN[2]) / 2 + 4, "start"),
    seta([(dir_x(2), meio_y(2)), (COL[3], meio_y(2))], "token", (dir_x(2) + COL[3]) / 2, meio_y(2) - 8, cor="#1B2B4B"),
    seta([(cen_x(4), LIN[1] + H), (cen_x(4), LIN[2])], "dispara", cen_x(4) + 8, (LIN[1] + H + LIN[2]) / 2 + 4, "start", True),
    seta([(dir_x(3), meio_y(2)), (COL[4], meio_y(2))], "re-dispara", (dir_x(3) + COL[4]) / 2, meio_y(2) - 8, tracejada=True),
]
partes += [no(k) for k in NOS]
partes.append("</svg>")
svg = "\n".join(partes)

# ── textos ──────────────────────────────────────────────────────────────────
ag = blocos("1-agente-docqui-caixa.md")
rt = blocos("3-agente-retro.md")
rv = blocos("4-agente-revisao.md")
tp = blocos("2-topico-data-de-hoje.md")
wf = (PACOTE / "github/.github/workflows/regenera-gerados.yml").read_text()

valores = {
    "SVG": svg,
    "WORKFLOW": esc(wf),
    "NOME_AGENTE": esc(ag[0]), "DESC_AGENTE": esc(ag[1]), "INSTR_AGENTE": esc(ag[2]),
    "TAM_AGENTE": f"{len(ag[2]):,}".replace(",", "."),
    "NOME_RETRO": esc(rt[0]), "DESC_RETRO": esc(rt[1]), "INSTR_RETRO": esc(rt[2]),
    "TAM_RETRO": f"{len(rt[2]):,}".replace(",", "."),
    "DESC_TOPICO": esc(tp[0]), "FORMULA": esc(tp[1]),
    "NOME_REVISAO": esc(rv[0]), "DESC_REVISAO": esc(rv[1]), "INSTR_REVISAO": esc(rv[2]),
    "TAM_REVISAO": f"{len(rv[2]):,}".replace(",", "."),
}
saida = (AQUI / "guia.template.html").read_text()
for k, v in valores.items():
    assert "{{" + k + "}}" in saida, k
    saida = saida.replace("{{" + k + "}}", v)
assert not re.findall(r"\{\{[A-Z_]+\}\}", saida), re.findall(r"\{\{[A-Z_]+\}\}", saida)
(PACOTE / "LEIA-ME.html").write_text(saida)
print("LEIA-ME.html:", len(saida), "bytes")
