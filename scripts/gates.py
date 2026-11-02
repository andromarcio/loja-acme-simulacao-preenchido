#!/usr/bin/env python3
"""Esteira de checkpoints (gates) do docqui.

Lê o front-matter YAML dos N3 (funcionalidades) e governa a máquina de estados do ciclo
de vida de cada requisito — da especificação ao código. Cada *gate* é um
checkpoint humano; a próxima etapa só é permitida quando a anterior foi aprovada.

Fonte de verdade: o bloco `gates` no front-matter de cada N3. O campo `estado`
é DERIVADO desses gates (e verificado, não mantido à mão). O `modules/INDEX.md`
é apenas um ESPELHO regenerado a partir dos N3 — mesma filosofia das demais
seções geradas do framework (Pendências, Contagem-PF).

Subcomandos
-----------
  check     valida, num Pull Request, que nenhum gate foi pulado e que a
            transição é legal (uso típico: workflow gate-check.yml). No PR de
            uma branch de entrega (`sprint/<id>`, `historia/<CHAVE>`), confere
            commit a commit: a sprint acumula vários gates por funcionalidade, e a
            regra vira um gate por commit, na ordem (ver `cmd_check`).
  status    imprime a esteira (readiness) de todas as funcionalidades em stdout.
  promote   regenera a seção de gates do INDEX.md a partir dos N3
            (com --write, grava o arquivo; uso típico: promote-estado.yml).

Configuração por instância (opcional): `global/gates-config.yml` redefine os
PAPÉIS de cada checkpoint (chave `papeis`) — ex.: num time de pesquisa, CP2
"DBA/Arquiteto" vira "reprodutibilidade/revisor técnico". Modelo em
`engine/templates/global/gates-config.yml`. A origem (o ticket) exibida na
tabela vem do front-matter `origem: { tipo, chave }` (legado: `servicenow:`).

Perfil de escopo: a linha "**Perfil**: `requisitos`" do `global/MASTER.md`
encurta a esteira ao lado negocial (requisitos → modelo-dados) e o CP2 entrega
`especificado`; nele, o CP1 e o CP2 podem ser aprovados juntos, num PR só (o N3
e o modelo de entidades na mesma revisão). Perfil ausente ou desconhecido usa
`requisitos`; `completo` explícito mantém os quatro checkpoints, um por PR. Ver
`ler_perfil`/`aplicar_perfil`. O estado em que a esteira da instância termina é o
`estado_final()` — é ele que a AIMM confere ao fechar (validate-impact).

Sem dependências além de PyYAML (pré-instalado nos runners; senão
`pip install pyyaml`). Python 3.8+.
"""
from __future__ import annotations

import argparse
import glob
import os
import re
import subprocess
import sys

try:
    import yaml
except ImportError:  # pragma: no cover - orientação amigável
    sys.stderr.write(
        "ERRO: PyYAML não encontrado. Instale com 'pip install pyyaml'.\n"
    )
    sys.exit(2)

# ── Modelo da máquina de estados ────────────────────────────────────────────

# Ordem dos checkpoints. Um gate só pode ser aprovado depois do anterior.
# É a fonte única da esteira: todo o resto do script itera esta lista, então o
# perfil da instância a encurta mutando-a em `aplicar_perfil` (ver adiante).
GATE_ORDER = ["requisitos", "modelo-dados", "testes", "codigo"]

# Perfil de escopo da instância (global/MASTER.md, linha "**Perfil**: `…`").
# `requisitos` (só requisitos + data-model) para a esteira em modelo-dados;
# `completo` explícito mantém os quatro checkpoints. Ausente/ilegível → requisitos.
PERFIS = {"requisitos", "completo"}
ESTEIRA_POR_PERFIL = {
    "requisitos": ["requisitos", "modelo-dados"],
    "completo": ["requisitos", "modelo-dados", "testes", "codigo"],
}

# Papéis padrão por checkpoint (quem aprova). A INSTÂNCIA pode redefini-los em
# `global/gates-config.yml` (chave `papeis`) — ex.: num time de pesquisa/ML,
# CP2 "DBA/Arquiteto" vira "reprodutibilidade/revisor técnico". O papel é
# informativo (aparece no INDEX/status); quem enforça o revisor é o CODEOWNERS.
PAPEIS_PADRAO = {
    "requisitos": "PO/Negócio",
    "modelo-dados": "DBA/Arquiteto",
    "testes": "QA",
    "codigo": "Tech Lead",
}


def carregar_papeis(root: str):
    """Papéis por gate, com override opcional em global/gates-config.yml."""
    papeis = dict(PAPEIS_PADRAO)
    path = os.path.join(root, "global", "gates-config.yml")
    if os.path.exists(path):
        try:
            with open(path, encoding="utf-8") as fh:
                cfg = yaml.safe_load(fh.read()) or {}
            custom = cfg.get("papeis") if isinstance(cfg, dict) else None
            if isinstance(custom, dict):
                for gate in GATE_ORDER:
                    if custom.get(gate):
                        papeis[gate] = str(custom[gate])
        except (OSError, yaml.YAMLError):
            pass  # config ilegível → segue com os padrões
    return papeis


def ler_perfil(root: str) -> str:
    """Perfil de escopo da instância, lido de global/MASTER.md (mesma linha que
    o validate-doc lê para o arquétipo). Ausente/desconhecido → 'requisitos'."""
    path = os.path.join(root, "global", "MASTER.md")
    try:
        with open(path, encoding="utf-8") as fh:
            texto = fh.read()
    except OSError:
        return "requisitos"
    m = re.search(r"\*\*Perfil\*\*\s*:?\s*`?([^`\n|]+?)`?\s*(?:$|\n|—|\|)", texto, re.IGNORECASE | re.MULTILINE)
    val = m.group(1).strip().lower() if m else None
    return val if val in PERFIS else "requisitos"


def aplicar_perfil(root: str) -> str:
    """Encurta a esteira global (GATE_ORDER) conforme o perfil da instância.

    Muta GATE_ORDER no lugar — é a fonte única que todas as funções iteram — de
    modo que a truncagem propaga sem tocar em nenhuma assinatura. Idempotente.
    Devolve o perfil aplicado."""
    perfil = ler_perfil(root)
    GATE_ORDER[:] = ESTEIRA_POR_PERFIL[perfil]
    GATE_TO_ESTADO.clear()
    GATE_TO_ESTADO.update(GATE_TO_ESTADO_PADRAO, **ESTADO_POR_PERFIL[perfil])
    GATES_JUNTOS[:] = JUNTOS_POR_PERFIL[perfil]
    return perfil


def estado_final() -> str:
    """O estado em que a esteira da instância termina — o do último checkpoint."""
    return GATE_TO_ESTADO[GATE_ORDER[-1]]

# Checkpoint → estado alcançado quando ele é aprovado.
GATE_TO_ESTADO_PADRAO = {
    "requisitos": "requisitos-aprovados",
    "modelo-dados": "modelo-validado",
    "testes": "especificado",
    "codigo": "implementado",
}
# O que muda por perfil. No `requisitos` o CP2 é o último checkpoint, e o que ele
# entrega é a spec pronta para quem vai construir: `especificado` (📋 pronto para
# desenvolvimento). Sem isso a esteira negocial terminava em `modelo-validado` —
# "aguardando testes", uma espera que nenhum QA vem encerrar numa instância só de
# requisitos —, e nenhuma funcionalidade aparecia como pronta. Espelhado no
# `lib/instancia.mjs` (ESTADO_FINAL), que os scripts JS usam — a AIMM no fechamento.
ESTADO_POR_PERFIL = {
    "requisitos": {"modelo-dados": "especificado"},
    "completo": {},
}
# Checkpoints que o perfil deixa aprovar juntos, no mesmo PR (decisão do PO,
# 2026-10-21, da proposta da esteira por ticket): no `requisitos`, o N3 e o modelo
# de entidades passam pela mesma revisão. Aprovar um por PR continua valendo.
JUNTOS_POR_PERFIL = {
    "requisitos": ["requisitos", "modelo-dados"],
    "completo": [],
}
GATES_JUNTOS: list = []
GATE_TO_ESTADO = dict(GATE_TO_ESTADO_PADRAO)

# Estados manuais (não derivados de gates) que o autor pode declarar.
ESTADOS_MANUAIS = {"em-desenvolvimento", "revisao-necessaria", "deprecado"}

# Artefato-companheiro por gate: o PR que aprova o gate deve incluir o artefato
# da etapa — é ele que torna o dono do checkpoint (CODEOWNERS) revisor
# obrigatório, já que o flip em si vive no front-matter do N3 (dono: PO).
#   CP1 dispensa (o artefato É o próprio N3); CP2 já viaja por convenção
#   (DATA-MODEL.md no PR); CP3/CP4 são exigidos mecanicamente aqui.
ARTEFATO_POR_GATE = {
    "testes": (("qa/",), "o plano de testes em `qa/` (saída do PROMPT_QA / opção 5B)"),
    "codigo": (("repos/",), "o registro da implementação em `repos/`"),
}

# Estado → ícone (legenda do INDEX.md).
ICONES = {
    "rascunho": "✏️",
    "requisitos-aprovados": "📝",
    "modelo-validado": "🧱",
    "especificado": "📋",
    "em-desenvolvimento": "🔄",
    "implementado": "✅",
    "revisao-necessaria": "⚠️",
    "deprecado": "❌",
}

def rel_do_index(rel):
    """Caminho do N3 relativo ao `modules/INDEX.md`, que é onde a seção é gravada."""
    return rel[len("modules/"):] if rel.startswith("modules/") else rel


# Marcadores da seção gerada no INDEX.md.
MARK_INI = "<!-- GATES:INICIO -->"
MARK_FIM = "<!-- GATES:FIM -->"

# A data do espelho ("Reflete o estado em **AAAA-MM-DD**") diz quando o conteúdo
# MUDOU, não quando o comando rodou. Regravada a cada execução, ela fazia o
# `gate-check` acusar "espelho defasado" em todo PR aberto num dia diferente do
# último promote — mesmo sem nenhum N3 alterado.
RE_DATA_ESPELHO = re.compile(r"Reflete o estado em \*\*\d{4}-\d{2}-\d{2}\*\*")


def _sem_data(bloco: str) -> str:
    return RE_DATA_ESPELHO.sub("Reflete o estado em **—**", bloco)


# ── Parsing de front-matter ─────────────────────────────────────────────────


def parse_front_matter(text: str):
    """Devolve (meta: dict | None) do front-matter YAML no topo do texto.

    Tolera, antes do bloco `---`, o carimbo de versão do engine
    (`<!-- docqui: … -->`, gravado por scripts/stamp.sh na
    primeira linha), linhas em branco e o BOM do início do arquivo — o
    mesmo recorte de scripts/lib/front-matter.mjs, que os validadores usam.
    """
    parts = text.lstrip("﻿").split("\n")
    inicio = 0
    while inicio < len(parts):
        s = parts[inicio].strip()
        if s == "" or (s.startswith("<!--") and s.endswith("-->")):
            inicio += 1
            continue
        break
    if inicio >= len(parts) or parts[inicio].strip() != "---":
        return None
    # separa o primeiro bloco --- ... ---
    for i in range(inicio + 1, len(parts)):
        if parts[i].strip() == "---":
            raw = "\n".join(parts[inicio + 1:i])
            try:
                meta = yaml.safe_load(raw)
            except yaml.YAMLError:
                return None
            return meta if isinstance(meta, dict) else None
    return None


def has_gates(meta) -> bool:
    return isinstance(meta, dict) and isinstance(meta.get("gates"), dict)


def origem_chave(meta) -> str:
    """Chave do ticket de origem do N3 (a AIMM é `analise-impacto/AIMM-<chave>.md`).

    Formato 1.6.0: bloco `origem: { tipo, chave }` (plugável — ServiceNow, issue,
    experimento). Legado ≤1.5.x: campo raso `servicenow:`. Placeholders de template
    e valores não-escalares viram "—".
    """
    origem = meta.get("origem")
    chave = None
    if isinstance(origem, dict):
        chave = origem.get("chave")
    if chave is None and meta.get("servicenow") is not None:
        chave = meta.get("servicenow")
    if isinstance(chave, (str, int)) and str(chave).strip():
        texto = str(chave).strip()
        if not texto.startswith("["):  # placeholder de template não preenchido
            return texto
    return "—"


def gate_aprovado(meta, gate: str) -> bool:
    g = meta.get("gates", {}).get(gate)
    return bool(g and g.get("aprovado") is True)


def derivar_estado(meta) -> str:
    """Estado derivado puramente dos gates aprovados, na ordem."""
    estado = "rascunho"
    for gate in GATE_ORDER:
        if gate_aprovado(meta, gate):
            estado = GATE_TO_ESTADO[gate]
        else:
            break
    return estado


def estado_de_exibicao(meta) -> str:
    """Estado mostrado no INDEX: respeita o manual se declarado, senão deriva."""
    declarado = meta.get("estado")
    if declarado in ESTADOS_MANUAIS:
        return declarado
    return derivar_estado(meta)


def proximo_checkpoint(meta) -> str:
    for gate in GATE_ORDER:
        if not gate_aprovado(meta, gate):
            return gate
    return ""  # todos aprovados


# ── Descoberta de arquivos ──────────────────────────────────────────────────


def _ignorar(path: str) -> bool:
    norm = path.replace("\\", "/")
    return "/_template" in norm or os.path.basename(norm).startswith("_template")


def listar_n3(root: str):
    """Todos os .md sob modules/ que tenham um bloco `gates` no front-matter."""
    achados = []
    padrao = os.path.join(root, "modules", "**", "*.md")
    for path in sorted(glob.glob(padrao, recursive=True)):
        if _ignorar(path):
            continue
        try:
            with open(path, encoding="utf-8") as fh:
                meta = parse_front_matter(fh.read())
        except OSError:
            continue
        if has_gates(meta):
            achados.append((path, meta))
    return achados


# ── git helpers (usados pelo check) ─────────────────────────────────────────


def _git(args):
    return subprocess.run(
        ["git", *args], capture_output=True, text=True
    )


def arquivos_alterados(base: str):
    r = _git(["diff", "--name-only", "--diff-filter=d", f"{base}...HEAD"])
    if r.returncode != 0:
        return None  # sem git/base: o chamador decide o fallback
    return [l for l in r.stdout.splitlines() if l.strip()]


def meta_no_ref(ref: str, path: str):
    r = _git(["show", f"{ref}:{path}"])
    if r.returncode != 0:
        return None  # arquivo novo neste PR
    return parse_front_matter(r.stdout)


def meta_no_disco(path: str):
    try:
        with open(path, encoding="utf-8") as fh:
            return parse_front_matter(fh.read())
    except OSError:
        return None


# ── check ───────────────────────────────────────────────────────────────────


def validar_estrutura(meta, rotulo, erros):
    gates = meta.get("gates", {})
    for gate in GATE_ORDER:
        if gate not in gates:
            erros.append(f"{rotulo}: gate '{gate}' ausente no front-matter.")
        elif not isinstance(gates[gate], dict) or "aprovado" not in gates[gate]:
            erros.append(f"{rotulo}: gate '{gate}' sem campo 'aprovado'.")


def validar_prefixo(meta, rotulo, erros):
    """Gates aprovados devem formar um prefixo contíguo (sem pular etapa)."""
    visto_falso = False
    for gate in GATE_ORDER:
        if gate_aprovado(meta, gate):
            if visto_falso:
                erros.append(
                    f"{rotulo}: gate '{gate}' aprovado, mas um anterior não está. "
                    "Os checkpoints devem ser aprovados em ordem."
                )
        else:
            visto_falso = True


def validar_estado(meta, rotulo, erros):
    declarado = meta.get("estado")
    derivado = derivar_estado(meta)
    if declarado in ESTADOS_MANUAIS:
        if declarado == "em-desenvolvimento" and derivado != "especificado":
            erros.append(
                f"{rotulo}: estado 'em-desenvolvimento' exige a funcionalidade especificada "
                f"— os gates {'+'.join(g for g in GATE_ORDER if GATE_TO_ESTADO[g] != 'implementado')} "
                f"aprovados (estado derivado atual: '{derivado}')."
            )
        return
    if declarado != derivado:
        erros.append(
            f"{rotulo}: campo 'estado' é '{declarado}', mas o derivado dos gates "
            f"é '{derivado}'. Ajuste 'estado' para '{derivado}'."
        )


def validar_transicao(after, before, rotulo, erros, unidade="PR", onde="na base"):
    """A transição é legal? (no máximo 1 gate novo, predecessor já aprovado antes;
    no perfil que os junta, CP1 e CP2 contam como um checkpoint só).

    `unidade`/`onde` só mudam a mensagem: no PR comum a unidade é o PR e o "antes" é a
    base; na branch de entrega, o commit e os commits anteriores a ele."""
    novos = [
        g for g in GATE_ORDER
        if gate_aprovado(after, g) and not gate_aprovado(before, g)
    ]
    juntos = len(novos) > 1 and set(novos) <= set(GATES_JUNTOS)
    if len(novos) > 1 and not juntos:
        erros.append(
            f"{rotulo}: {len(novos)} gates aprovados de uma vez ({', '.join(novos)}). "
            f"Cada checkpoint é uma aprovação humana separada — um gate por {unidade}."
        )
    for gate in novos:
        idx = GATE_ORDER.index(gate)
        if idx > 0:
            pred = GATE_ORDER[idx - 1]
            if not gate_aprovado(before, pred) and not (juntos and pred in novos):
                erros.append(
                    f"{rotulo}: gate '{gate}' está sendo aprovado, mas o anterior "
                    f"('{pred}') ainda não foi aprovado {onde}. Não pule etapas."
                )
        info = after.get("gates", {}).get(gate, {})
        if not info.get("por"):
            erros.append(f"{rotulo}: gate '{gate}' aprovado sem preencher 'por'.")
        if not info.get("em"):
            erros.append(f"{rotulo}: gate '{gate}' aprovado sem preencher 'em' (data).")


def validar_artefato_gate(after, before, alterados, rotulo, erros):
    """O PR que aprova o gate carrega o artefato da etapa? (CP3 qa/ · CP4 repos/)"""
    novos = [
        g for g in GATE_ORDER
        if gate_aprovado(after, g) and not gate_aprovado(before, g)
    ]
    for gate in novos:
        regra = ARTEFATO_POR_GATE.get(gate)
        if not regra:
            continue
        prefixos, descricao = regra
        tocados = [p.replace("\\", "/") for p in alterados]
        if not any(t.startswith(prefixos) for t in tocados):
            erros.append(
                f"{rotulo}: gate '{gate}' aprovado, mas o PR não inclui {descricao} "
                f"— nenhum arquivo alterado em {' / '.join(prefixos)}. O artefato da "
                "etapa viaja no mesmo PR: é ele que leva o dono do checkpoint "
                "(CODEOWNERS) ao review."
            )


# Branch de unidade de entrega (Cadência no MASTER): espelha `unidadeDaBranch` de
# scripts/lib/instancia.mjs.
UNIDADE_RE = re.compile(r"^(?:refs/heads/|origin/)?(sprint|historia)/.+$")


def branch_da_entrega(args):
    """O nome da branch de entrega em verificação, ou None.

    Ordem: `--branch`; `GITHUB_HEAD_REF` (no pull_request o checkout é o merge sintético,
    com o HEAD destacado); a branch atual do git."""
    nome = args.branch or os.environ.get("GITHUB_HEAD_REF") or ""
    if not nome:
        r = _git(["rev-parse", "--abbrev-ref", "HEAD"])
        nome = r.stdout.strip() if r.returncode == 0 else ""
    return nome if UNIDADE_RE.match(nome) else None


def ponta_da_branch(args):
    """O commit da ponta da branch. No pull_request o HEAD é o merge sintético da base com
    a branch, e a ponta é o segundo pai dele — a menos que `--head` a diga."""
    if args.head:
        return args.head
    if os.environ.get("GITHUB_HEAD_REF"):
        r = _git(["rev-parse", "--verify", "--quiet", "HEAD^2"])
        if r.returncode == 0 and r.stdout.strip():
            return r.stdout.strip()
    return "HEAD"


def _n3_com_gates(paths):
    for path in paths:
        path = path.replace("\\", "/")
        if path.startswith("modules/") and path.endswith(".md") and not _ignorar(path):
            yield path


def _uniao(a, b):
    """Gates aprovados em `a` ou em `b` (o "antes" de um commit da branch de entrega
    inclui o que a base já aprovou — um merge da main na branch não é aprovação nova)."""
    gates = {}
    for g in GATE_ORDER:
        if gate_aprovado(a, g) or gate_aprovado(b, g):
            gates[g] = {"aprovado": True}
    return {"gates": gates}


def cmd_check_entrega(args, branch):
    """Na branch de entrega, a esteira é conferida commit a commit.

    A sprint (ou a história) acumula vários checkpoints por funcionalidade, cada um no seu PR
    para a branch de entrega; comparada de uma vez com a `main`, ela pareceria aprovar
    dois gates juntos. Aqui cada passo da cadeia de primeiro pai — um commit direto ou o
    merge de um PR de checkpoint — aprova no máximo um gate, na ordem, com `por`/`em`.
    O estado final, a estrutura e o artefato de cada etapa (CP3 `qa/`, CP4 `repos/`) são
    conferidos sobre a branch inteira."""
    base, head = args.base, ponta_da_branch(args)
    mb = _git(["merge-base", base, head])
    if mb.returncode != 0:
        return None  # sem git/base: o chamador cai no modo comum
    mb = mb.stdout.strip()
    commits = _git(["rev-list", "--reverse", "--first-parent", f"{mb}..{head}"]).stdout.split()
    total = _git(["diff", "--name-only", "--diff-filter=d", mb, head]).stdout.splitlines()
    erros, finais, anterior = [], [], mb
    for c in commits:
        assunto = _git(["log", "-1", "--format=%s", c]).stdout.strip()
        passo = _git(["diff", "--name-only", "--diff-filter=d", anterior, c]).stdout.splitlines()
        for path in _n3_com_gates(passo):
            after = meta_no_ref(c, path)
            if not has_gates(after):
                continue
            antes = meta_no_ref(anterior, path)
            na_base = meta_no_ref(mb, path)
            before = _uniao(antes if has_gates(antes) else {}, na_base if has_gates(na_base) else {})
            validar_transicao(after, before, f"{path} @ {c[:8]} \"{assunto}\"", erros,
                              unidade="commit", onde="nos commits anteriores")
        anterior = c
    for path in _n3_com_gates(total):
        after = meta_no_ref(head, path)
        if not has_gates(after):
            continue
        na_base = meta_no_ref(mb, path)
        validar_estrutura(after, path, erros)
        validar_prefixo(after, path, erros)
        validar_estado(after, path, erros)
        validar_artefato_gate(after, na_base if has_gates(na_base) else {"gates": {}}, total, path, erros)
        finais.append((path, after))
    return erros, finais, len(commits)


def cmd_check(args):
    aplicar_perfil(args.root)
    base = args.base
    branch = branch_da_entrega(args)
    if branch:
        r = cmd_check_entrega(args, branch)
        if r is not None:
            erros, finais, n = r
            if not finais and not erros:
                print(f"Nenhum N3 com gates alterado em `{branch}` — nada a validar. ✔")
                return 0
            if erros:
                return _relatar_erros(args, erros)
            print(f"✔ Esteira de gates: todas as transições são válidas — commit a commit em `{branch}` ({n} commit(s)).")
            for path, after in finais:
                print(f"  • {path}: estado → {estado_de_exibicao(after)}")
            return 0
    alterados = arquivos_alterados(base)
    erros = []

    if alterados is None:
        # Sem git/base acessível: valida consistência interna de todos os N3.
        sys.stderr.write(
            f"aviso: não consegui comparar com a base '{base}'; "
            "validando apenas a consistência interna de todos os N3.\n"
        )
        # before=None ⇒ sem validação de transição/artefato (não há diff).
        alvos = [(p, m, None) for p, m in listar_n3(args.root)]
    else:
        alvos = []
        for path in alterados:
            if not path.replace("\\", "/").startswith("modules/"):
                continue
            if not path.endswith(".md") or _ignorar(path):
                continue
            after = meta_no_disco(os.path.join(args.root, path))
            if not has_gates(after):
                continue
            before = meta_no_ref(base, path)
            before = before if has_gates(before) else {"gates": {}}
            alvos.append((path, after, before))

    if not alvos:
        print("Nenhum N3 com gates alterado — nada a validar. ✔")
        return 0

    for path, after, before in alvos:
        rotulo = path
        validar_estrutura(after, rotulo, erros)
        validar_prefixo(after, rotulo, erros)
        validar_estado(after, rotulo, erros)
        if before is not None:
            validar_transicao(after, before, rotulo, erros)
            validar_artefato_gate(after, before, alterados, rotulo, erros)

    if erros:
        return _relatar_erros(args, erros)

    print("✔ Esteira de gates: todas as transições são válidas.")
    for path, after, _ in alvos:
        print(f"  • {path}: estado → {estado_de_exibicao(after)}")
    return 0


def _relatar_erros(args, erros):
    papeis = carregar_papeis(args.root)
    esteira = " → ".join(f"{g} ({papeis.get(g, '?')})" for g in GATE_ORDER)
    print("❌ Esteira de gates: transição inválida\n")
    for e in erros:
        print(f"  • {e}")
    print(
        "\nRegra: a próxima etapa só ocorre após a aprovação da anterior.\n"
        f"Ordem dos checkpoints: {esteira}."
    )
    return 1


# ── status / promote ────────────────────────────────────────────────────────


def montar_linhas(root: str, papeis=None):
    papeis = papeis or PAPEIS_PADRAO
    linhas = []
    for path, meta in listar_n3(root):
        rel = os.path.relpath(path, root).replace("\\", "/")
        estado = estado_de_exibicao(meta)
        icone = ICONES.get(estado, "•")
        prox = proximo_checkpoint(meta)
        if estado == "deprecado":
            pronto = "❌ deprecado"
        elif estado == "implementado":
            pronto = "✅ implementado"
        elif estado == "especificado":
            pronto = "📋 pronto para desenvolvimento"
        elif estado == "em-desenvolvimento":
            pronto = "🔄 em desenvolvimento"
        else:
            pronto = f"aguardando **{prox}** ({papeis.get(prox, '?')})" if prox else "—"
        linhas.append(
            {
                "id": str(meta.get("id", "—")),
                "origem": origem_chave(meta),
                "rel": rel,
                "icone": icone,
                "estado": estado,
                "pronto": pronto,
            }
        )
    linhas.sort(key=lambda x: (x["origem"], x["id"]))
    return linhas


def render_tabela(linhas, data: str, papeis=None) -> str:
    papeis = papeis or PAPEIS_PADRAO
    esteira = " → ".join(
        f"CP{i + 1} {gate} ({papeis.get(gate, '?')})" for i, gate in enumerate(GATE_ORDER)
    )
    out = []
    out.append(MARK_INI)
    out.append("## Esteira de checkpoints (gates)")
    out.append("")
    out.append(
        "> ⚙️ **Seção gerada por `scripts/gates.py` — não editar à mão.** "
        f"Espelha o estado de cada funcionalidade na esteira ({esteira}). "
        f"Reflete o estado em **{data}**."
    )
    out.append("")
    if not linhas:
        out.append("_Nenhuma funcionalidade com esteira de gates ainda._")
    else:
        out.append("| Funcionalidade | Origem | Estado | Situação |")
        out.append("|---|---|---|---|")
        for l in linhas:
            out.append(
                f"| `{l['id']}` ([spec](./{rel_do_index(l['rel'])})) | {l['origem']} "
                f"| {l['icone']} {l['estado']} | {l['pronto']} |"
            )
        prontas = sum(1 for l in linhas if l["estado"] == "especificado")
        out.append("")
        out.append(
            f"**{prontas}** de **{len(linhas)}** funcionalidade(s) prontas para desenvolvimento."
        )
    out.append(MARK_FIM)
    return "\n".join(out)


def cmd_status(args):
    aplicar_perfil(args.root)
    papeis = carregar_papeis(args.root)
    linhas = montar_linhas(args.root, papeis)
    data = hoje()
    print(render_tabela(linhas, data, papeis))
    return 0


def cmd_promote(args):
    aplicar_perfil(args.root)
    index_path = os.path.join(args.root, "modules", "INDEX.md")
    if not os.path.exists(index_path):
        sys.stderr.write(f"aviso: {index_path} não encontrado; nada a fazer.\n")
        return 0
    papeis = carregar_papeis(args.root)
    linhas = montar_linhas(args.root, papeis)
    bloco = render_tabela(linhas, hoje(), papeis)

    with open(index_path, encoding="utf-8") as fh:
        conteudo = fh.read()

    if MARK_INI in conteudo and MARK_FIM in conteudo:
        ini = conteudo.index(MARK_INI)
        fim = conteudo.index(MARK_FIM) + len(MARK_FIM)
        atual = conteudo[ini:fim]
        if _sem_data(atual) == _sem_data(bloco):
            bloco = atual  # só a data difere: o espelho está em dia
        novo = conteudo[:ini] + bloco + conteudo[fim:]
    else:
        sep = "" if conteudo.endswith("\n") else "\n"
        novo = conteudo + sep + "\n---\n\n" + bloco + "\n"

    if novo == conteudo:
        print("INDEX.md já está atualizado — nada a regravar.")
        return 0

    if args.write:
        with open(index_path, "w", encoding="utf-8") as fh:
            fh.write(novo)
        print(f"INDEX.md atualizado: {index_path}")
    else:
        print("INDEX.md desatualizado (rode com --write para gravar).")
        print(bloco)
    return 0


def hoje() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).date().isoformat()


# ── CLI ──────────────────────────────────────────────────────────────────────


def main(argv=None):
    p = argparse.ArgumentParser(description="Esteira de checkpoints (gates) do docqui.")
    p.add_argument("--root", default=".", help="raiz do repositório de docs (default: .)")
    sub = p.add_subparsers(dest="cmd", required=True)

    pc = sub.add_parser("check", help="valida transições de gate num PR")
    pc.add_argument("--base", default="origin/main", help="ref base de comparação")
    pc.add_argument("--head", default=None,
                    help="ponta da branch do PR (no pull_request: o head.sha; default: HEAD, ou HEAD^2 no merge sintético)")
    pc.add_argument("--branch", default=None,
                    help="nome da branch do PR (default: GITHUB_HEAD_REF ou a branch atual); sprint/… e historia/… conferem commit a commit")
    pc.set_defaults(func=cmd_check)

    ps = sub.add_parser("status", help="imprime a esteira (readiness)")
    ps.set_defaults(func=cmd_status)

    pp = sub.add_parser("promote", help="regenera a seção de gates do INDEX.md")
    pp.add_argument("--write", action="store_true", help="grava o INDEX.md")
    pp.set_defaults(func=cmd_promote)

    args = p.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
