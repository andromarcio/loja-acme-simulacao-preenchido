#!/usr/bin/env python3
"""migra-enumeracao.py — converte a enumeração de ALR e DER da memória de cálculo do N3,
escrita em prosa, para o bloco ```json conferido pelo validador da contagem.

Por quê: a planilha copiava a enumeração em prosa para as colunas Descrição de DER e
ALR, e a prosa misturava campo com comentário — o parêntese de anotação saía como parte
do nome do DER, a explicação do CPM como o primeiro ALR. Agora a enumeração é dado:

    ```json
    {"pe": "<PE>", "alr": ["…"], "der": ["…", "Mensagem", "Ação"]}
    ```

Este script lê a memória antiga com os MESMOS leitores que a planilha usava até a 4.x
— os três dialetos das instâncias, o formato canônico do template e o `<details>` do
PROMPT_3B, com a mesma precedência entre eles —, então o que ele converte é exatamente
o que a planilha mostrava. Um quarto dialeto, que a planilha nunca leu, entra só aqui:
o ALR com travessão do portal-compras, de onde só os nomes em crase são aproveitados. Duas normalizações: o `+1` da capacidade de mensagens vira
`Mensagem` e o da ação que dispara o processo vira `Ação`; e só a observação
"Não contados: …" passa para `nao_contados` (o motivo de cada leitura, que os dialetos
antigos punham em itálico, fica na prosa do N3, que não é tocada).

O que NÃO converte, e lista para decisão humana: processo elementar sem enumeração, lista
de tamanho diferente do da tabela, item repetido, item que é anotação e não nome (as
mesmas regras do `valida-enumeracao-contagem.mjs`) e linha de 0 PF sem o motivo. O bloco
proposto sai no relatório para ser corrigido e colado à mão.

Simulação por padrão; `--write` grava os blocos limpos logo abaixo do cabeçalho de cada
PE na `### Memória de cálculo` e acrescenta uma linha no topo do `## Changelog` do N3.
PE que já tem bloco é pulado — rodar de novo não duplica.

Uso (a partir da raiz da instância):
  python3 scripts/migra-enumeracao.py [N3 ou pasta ...]          # simulação
  python3 scripts/migra-enumeracao.py [N3 ou pasta ...] --write  # grava
  (sem caminho: todo modules/**/f-*.md · --data AAAA-MM-DD para a linha do Changelog)
"""
import argparse, datetime, json, re, sys, unicodedata
from pathlib import Path

def celulas(linha):
    return [c.strip() for c in linha.strip().strip("|").split("|")]

def eh_separador(linha):
    return re.fullmatch(r"\|[\s\-:|]+\|", linha.strip()) is not None

def tabelas(linhas, ini, parar):
    """Todas as tabelas a partir de `ini` até `parar`, como (cabeçalho, linhas)."""
    out, cab, corpo = [], None, []
    for linha in linhas[ini:]:
        if parar(linha):
            break
        if not linha.strip().startswith("|"):
            if cab is not None:
                out.append((cab, corpo)); cab, corpo = None, []
            continue
        if eh_separador(linha):
            continue
        if cab is None:
            cab = celulas(linha)
        else:
            corpo.append(celulas(linha))
    if cab is not None:
        out.append((cab, corpo))
    return out

def col(cab, *nomes):
    for i, campo in enumerate(cab):
        for nome in nomes:
            if re.fullmatch(nome, campo, re.I):
                return i
    return -1

def secao(linhas, titulo):
    for i, linha in enumerate(linhas):
        if re.fullmatch(rf"#{{2}}\s+{titulo}\s*", linha.strip()):
            return i
    return -1

def corpo_da_secao(linhas, titulo):
    i = secao(linhas, titulo)
    if i < 0:
        return []
    fim = next((j for j in range(i + 1, len(linhas)) if re.match(r"##\s", linhas[j])), len(linhas))
    return linhas[i + 1:fim]

def chave_pe(texto):
    return re.sub(r"\s+", " ", re.sub(r"[`*]", "", texto)).strip(" .;").casefold()

def enumeracao(linhas):
    """Blocos JSON da memória de cálculo, indexados pelo nome do PE."""
    blocos, corpo, na_memoria, dentro = {}, [], False, False
    for linha in linhas:
        texto = linha.strip()
        if re.match(r"###\s+Mem[óo]ria de c[áa]lculo", texto):
            na_memoria = True
        elif na_memoria and not dentro and texto == "```json":
            dentro, corpo = True, []
        elif dentro and texto == "```":
            dentro = False
            try:
                bloco = json.loads("\n".join(corpo))
            except ValueError:
                continue
            if isinstance(bloco, dict) and isinstance(bloco.get("pe"), str):
                blocos[chave_pe(bloco["pe"])] = bloco
        elif dentro:
            corpo.append(linha)
    return blocos

# ── os leitores da memória em prosa, como a planilha os tinha até a 4.x ─────────────
def memoria(linhas):
    """Descrições de ALR e DER, **por processo elementar**, da `### Memória de cálculo`.

    Três dialetos convivem entre instâncias e todos são lidos — ler só um devolve
    a planilha com as colunas Descrição vazias, que é o mesmo resultado de não
    haver memória nenhuma:

      (a) tabela com coluna "Arquivo lógico"/"Entidade" (formato original);
      (b) uma linha por PE:  `- **<PE>** — ALR (7): A · B. DER (18): x · y.`
      (c) um bloco por PE:   `**<PE>** — SE. …`
                             `- **ALR (7)**: A *(por quê)* · B *(por quê)*`
                             `- **DER (17)** — entrada (2): x · y. Saída (13): …`

    Devolve `{nome do PE: (alr, der)}`. A chave `""` guarda o que não pôde ser
    atribuído a um PE — é o que a funcionalidade de um PE só usa, e o que as de dois ou
    mais PE recebem quando o nome não casa.

    Estes são os dialetos que nasceram nas instâncias. O formato que os prompts do
    engine escrevem hoje é lido por `memoria_canonica()`.
    """
    txt = "\n".join(linhas)
    lim = lambda x: re.sub(r"\s+", " ", re.sub(r"[`*]", "", x)).strip(" .;")
    partes = lambda x: [lim(p) for p in re.split(r"\s+·\s+", x) if lim(p)]
    # A coluna Descrição de ALR quer o NOME do arquivo lógico, e só. O porquê da
    # leitura vive na memória do N3, em itálico — aqui ele vira ruído numa célula
    # que a métrica lê para conferir arquivo por arquivo. Tira-se o parêntese em
    # itálico ANTES de limpar os asteriscos: nome de ALI que legitimamente tem
    # parêntese (ex.: "Usuário (vínculo por UF)") não é itálico e sobrevive.
    # Vale para os dois lados: numa enumeração de arquivos lógicos ou de campos,
    # texto em itálico é sempre comentário — "*(por quê)*" ao lado de um ALR,
    # "*Não contada: …*" ao final da linha. Nome de ALI que legitimamente tem
    # parêntese (ex.: "Usuário (vínculo por UF)") não é itálico e sobrevive; o
    # lookaround protege o **negrito** de ser mordido pela metade.
    ITALICO = re.compile(r"\s*(?<!\*)\*([^*\n]+)\*(?!\*)")
    so_nome = lambda x: ITALICO.sub("", x)
    # …e o que sai vira anotação da célula: a justificativa de um PE zerado é o
    # que distingue "descartado com critério" de "linha por preencher".
    notas_pe = {}
    def anota(pe, *textos):
        achado = [m.group(1).strip() for t in textos for m in ITALICO.finditer(t)]
        if achado:
            notas_pe[pe] = " ".join(achado)

    porpe, solto_alr, solto_der = {}, [], []

    # (b) uma linha por PE
    for m in re.finditer(r"^-\s+\*\*(?P<pe>[^*]+)\*\*\s*—\s*ALR\s*\(\d+\):\s*(?P<alr>.*?)\.\s*DER\s*\(\d+\):\s*(?P<der>.*?)\.?\s*$",
                         txt, re.M):
        pe = lim(m.group("pe"))
        anota(pe, m.group("alr"), m.group("der"))
        porpe[pe] = (partes(so_nome(m.group("alr"))), partes(so_nome(m.group("der"))))

    # (c) um bloco por PE
    for bloco in re.split(r"\n(?=\*\*[^*\n]+\*\*\s*—)", txt):
        mpe = re.match(r"\*\*([^*\n]+)\*\*\s*—", bloco)
        if not mpe:
            continue
        malr = re.search(r"^-\s+\*\*ALR\s*\(\d+\)\*\*:\s*(.+)$", bloco, re.M)
        # (d) — o do portal-compras, que a planilha nunca leu: o ALR com travessão, a
        # explicação antes e os nomes em crase (`- **ALR (4)** — arquivos …: `A` · `B``).
        # Só as crases contam; o que sobrar de errado nelas (um caminho, um RLR citado)
        # faz a lista divergir da tabela, e o PE fica para decisão humana.
        malr_d = None if malr else re.search(r"^-\s+\*\*ALR\s*\(\d+\)\*\*\s*—\s*(.+)$", bloco, re.M)
        mder = re.search(r"^-\s+\*\*DER\s*\(\d+\)\*\*\s*—\s*(.+)$", bloco, re.M)
        if not (malr or malr_d or mder):
            continue
        # no dialeto (c) o DER vem agrupado em "entrada (2): a · b. Saída (13): c · d."
        der = []
        if mder:
            for grupo in re.split(r"(?<=\.)\s+(?=[A-ZÀ-Ú])", mder.group(1)):
                der += partes(so_nome(re.sub(r"^[^:]{0,40}:\s*", "", grupo).rstrip(".")))
        pe = lim(mpe.group(1))
        anota(pe, malr.group(1) if malr else "", mder.group(1) if mder else "")
        alr = partes(so_nome(malr.group(1))) if malr else (
            [lim(x) for x in re.findall(r"`([^`]+)`", malr_d.group(1))] if malr_d else [])
        porpe[pe] = (alr, der)

    # (a) tabela
    for i, l in enumerate(linhas):
        alvo = None
        if re.match(r"\*\*ALR\b", l.strip()):
            alvo = ("alr", r"Arquivo l[óo]gico", r"Entidade")
        elif re.match(r"\*\*DER\b", l.strip()):
            alvo = ("der", r"Dados", r"Descri[çc][ãa]o")
        if not alvo:
            continue
        for cab, corpo in tabelas(linhas, i + 1, lambda x: x.strip().startswith("**") or x.startswith("## ")):
            j = col(cab, *alvo[1:])
            if j >= 0:
                for c in corpo:
                    if j < len(c) and c[j]:
                        (solto_alr if alvo[0] == "alr" else solto_der).extend(partes(c[j]))
            break

    if solto_alr or solto_der:
        porpe[""] = ([lim(x) for x in solto_alr], [lim(x) for x in solto_der])
    return porpe, notas_pe

# ── memória no formato do engine ────────────────────────────────────────────
# O formato que o template do N3 ensina (e o PROMPT_CONTAGEM ensinava até a 7.3.3), e o
# `<details>` que o PROMPT_3B gravava, não casam com nenhum dos dialetos de `memoria()`: a memória
# existia no N3 e a planilha saía com as Descrições vazias e o aviso "sem memória
# de cálculo". Leitor à parte, e não mais um dialeto lá dentro, para que as
# instâncias que usam os dialetos antigos recebam exatamente a mesma planilha.
RE_CAB_PE = re.compile(r"^\*\*(?P<pe>[^*]+?)\*\*\s*—")
RE_CAB_ALR_DER = re.compile(r"^\*\*(?P<rot>ALR|DER)\s*\(\d+\)\*\*")
# O siesa-doc antepõe às vezes a natureza do PE ("— EE (mantém a configuração). ALR = 1 (…)").
RE_DETAILS = re.compile(r"^[-*]\s+\*\*(?P<pe>[^*]+?)\*\*\s*—\s*(?:[^()]*?(?:\([^)]*\))?[^()]*?\.\s+)?ALR\s*=\s*\d+\s*(?P<resto>.*)$")
# No <details> o papel vem colado ao nome ("Pedido mantido"); a coluna quer o nome.
PARTICIPIO = re.compile(r"\s+(?:lid|mantid|gravad|consultad|alterad|inclu[íi]d|exclu[íi]d|referenciad)[oa]s?$", re.I)
# "Não contados: nenhum." é o campo do template respondido, não uma observação —
# como nota, viraria um comentário em toda linha, e a métrica abriria todos à toa.
NAO_CONTADOS_NENHUM = re.compile(r"N[ãa]o contad[oa]s?\s*:\s*nenhuma?\b\.?", re.I)

def entre_parenteses(s):
    """`(…)` balanceado no começo de `s` → (conteúdo, resto)."""
    s = s.lstrip()
    if not s.startswith("("):
        return "", s
    nivel = 0
    for i, ch in enumerate(s):
        nivel += (ch == "(") - (ch == ")")
        if nivel == 0:
            return s[1:i], s[i + 1:]
    return s[1:], ""

def divide(s, seps):
    """Quebra nos separadores só FORA de parênteses: "Cupom (vigentes, ativos)" é um item."""
    itens, nivel, atual, i = [], 0, "", 0
    while i < len(s):
        nivel += (s[i] == "(") - (s[i] == ")")
        sep = next((x for x in seps if nivel == 0 and s.startswith(x, i)), None)
        if sep:
            itens.append(atual); atual = ""; i += len(sep)
            continue
        atual += s[i]; i += 1
    itens.append(atual)
    lim = lambda x: re.sub(r"\s+", " ", re.sub(r"[`*]", "", x)).strip(" .;")
    return [lim(x) for x in itens if lim(x)]

# ── o dialeto do siesa-doc, dentro do <details> ─────────────────────────────────────
# Cada ALR traz o tipo e a anotação — "ALI EventoAuditoria — lido", "AIE GitHub —
# instalação verificada", "ALI Perfil e ALI Sistema — contagens do resumo, dado derivado
# → SE" —, e o DER, rótulo de grupo e o lado da fronteira: "filtros: período-de",
# "e na resposta: nome", "resposta usuarioId", "flag habilitada na resposta", "+ 1 ação
# + 1 mensagens", "cursor de paginação não conta — SIZING.md". O nome é o que sobra.
RE_ALI = re.compile(r"(?:ALI|AIE)\s+\S")
RE_NAO_CONTA = re.compile(r"\bn[ãa]o (?:conta|contad)", re.I)

def siesa(alr, der):
    """(alr, der, nota) — os nomes, sem tipo, anotação nem rótulo; o que "não conta" vira nota."""
    nomes = []
    for x in alr:
        for parte in re.split(r"\s+e\s+(?=(?:ALI|AIE)\s)", x):
            if RE_ALI.match(parte):  # o que não começa com ALI/AIE é a anotação que seguiu a vírgula
                nomes.append(re.split(r"\s+[—–]\s+", re.sub(r"^(?:ALI|AIE)\s+", "", parte))[0].strip(" .;"))
    campos, nota = [], []
    for x in der:
        if RE_NAO_CONTA.search(x):
            nota.append(x)
            continue
        x = re.split(r"\s+[—–]\s+", x)[0]
        x = re.sub(r"^.*:\s*", "", x)                       # "filtros: período-de", "e na resposta: nome"
        x = re.sub(r"^(?:e\s+)?(?:na\s+)?resposta\s+", "", x, flags=re.I)
        x = re.sub(r"\s+na resposta$", "", x, flags=re.I)
        x = re.sub(r"^1\s+(a[çc][ãa]o|mensagens?|filtro)$", lambda m: {"a": "Ação", "m": "Mensagem", "f": "Filtro"}[m.group(1)[0].lower()], x, flags=re.I)
        x = x.strip(" .;")
        if x:
            campos.append(x if re.fullmatch(r"[a-z]+[A-Z]\w*", x) else x[0].upper() + x[1:])  # usuarioId fica como está
    return nomes, campos, "Não contados: " + "; ".join(nota) + "." if nota else ""

def memoria_canonica(sec):
    """Descrições de ALR e DER por PE, nos formatos que os prompts do engine escrevem.

      canônico (template do N3; o PROMPT_CONTAGEM, até a 7.3.3):
        **<PE>** — EE · ALR n · DER n · <complexidade> · <pf> PF
        **ALR (n)** — …:   1. `<Entidade>` — <motivo>
        **DER (n)** — …:   - **entrada (n)**: a · b
                           - **+1** capacidade de mensagens (…) · **+1** ação que dispara …
        > Não contados: …

      <details> (PROMPT_3B):
        - **<PE>** — ALR = n (A lido + B mantido); DER = n (x, y, z) → tabela …

    `sec` é o corpo de `## Métricas de tamanho` — fora dela, `**X** —` é prosa.
    Os dois +1 do DER entram na enumeração: são DER contados, e sem eles toda
    memória canônica divergiria da quantidade em 2. O blockquote vira nota da
    célula, como o itálico dos dialetos antigos — é ele que diz por que um PE
    saiu com 0 PF. Devolve `({chave_pe: (alr, der)}, {chave_pe: nota})`; quando
    os dois formatos descrevem o mesmo PE (o template traz os dois blocos), vale
    o canônico.
    """
    ITALICO = re.compile(r"\s*(?<!\*)\*([^*\n]+)\*(?!\*)")
    porpe, notas = {}, {}
    def anota(pe, texto):
        if texto.strip():
            notas[pe] = f"{notas.get(pe, '')} {texto.strip()}".strip()

    pe = bloco = None
    for l in sec:
        s = l.strip()
        # fim de bloco: nada depois disto é item do último PE
        if s.startswith(("<details", "</details", "<summary", "#")) or s == "---" \
                or re.match(r"\*\*Total\b", s):
            pe = bloco = None
            continue
        m = RE_CAB_ALR_DER.match(s)
        if m:
            bloco = m.group("rot") if pe is not None else None
            continue
        m = RE_CAB_PE.match(s)
        if m:
            pe, bloco = chave_pe(m.group("pe")), None
            porpe.setdefault(pe, ([], []))
            continue
        if pe is None:
            continue
        if s.startswith(">"):
            bloco = None
            anota(pe, re.sub(r"^>\s?", "", s))
            continue
        m = re.match(r"(?:\d+[.)]|[-*])\s+(?P<t>.+)$", s)
        if not (m and bloco):
            continue
        t = m.group("t")
        for mi in ITALICO.finditer(t):
            anota(pe, mi.group(1))
        t = ITALICO.sub("", t)
        alr, der = porpe[pe]
        if bloco == "ALR":
            # 1. `Pedido` — lê os itens: a coluna quer o nome; o motivo fica no N3
            mc = re.match(r"`([^`]+)`", t)
            nome = re.sub(r"[`*]", "", mc.group(1) if mc else re.split(r"\s+[—–-]\s+", t)[0]).strip(" .;:")
            if nome:
                alr.append(nome)
        elif re.match(r"\*\*\+\d+\*\*", t):
            der += [x for x in (re.sub(r"^\*\*\+\d+\*\*\s*", "", p).strip(" .;")
                                for p in re.split(r"\s+·\s+", t)) if x]
        else:
            # - **entrada (n)**: a · b — o rótulo do grupo não é campo
            der += divide(re.sub(r"^\*\*[^*]+\*\*\s*[:—–-]?\s*", "", t), (" · ",))

    for l in sec:
        m = RE_DETAILS.match(l.strip())
        if not m:
            continue
        pe = chave_pe(m.group("pe"))
        if any(porpe.get(pe, ((), ()))):
            continue
        alr, resto = entre_parenteses(m.group("resto"))
        md = re.match(r"\s*[;.]\s*DER\s*=\s*\d+\s*(?P<r>.*)$", resto)
        der = entre_parenteses(md.group("r"))[0] if md else ""
        seps = (",", " + ", " · ", ";")
        alr_i, der_i = divide(alr, seps), divide(der, seps)
        if any(RE_ALI.match(x) for x in alr_i):
            alr_i, der_i, nota = siesa(alr_i, der_i)
            if nota:
                notas[pe] = f"{notas.get(pe, '')} {nota}".strip()
            porpe[pe] = (alr_i, der_i)
            continue
        porpe[pe] = ([PARTICIPIO.sub("", x) for x in alr_i], der_i)

    notas = {k: re.sub(r"\s+", " ", NAO_CONTADOS_NENHUM.sub("", v)).strip() for k, v in notas.items()}
    return porpe, {k: v for k, v in notas.items() if v}


def antiga(linhas, corpo, iPE, iPF):
    """{nome do PE: (alr, der, nota)} — a precedência entre os leitores que a planilha usava."""
    mem, notas = memoria(linhas)
    can, notas_can = memoria_canonica(corpo_da_secao(linhas, "Métricas de tamanho"))
    contadas = [c for c in corpo if iPF < len(c) and re.fullmatch(r"\d+", c[iPF])]
    com_lista = [k for k, v in can.items() if any(v)]
    out = {}
    for c in contadas:
        nome = re.sub(r"[`*]", "", c[iPE]).strip()
        alr_d, der_d = mem.get(nome) or (mem.get("") if len(corpo) == 1 else None) or ([], [])
        if not alr_d and not der_d and len(mem) == 1:
            alr_d, der_d = next(iter(mem.values()))
        nota = notas.get(nome, "")
        k = chave_pe(nome)
        if not any(can.get(k, ((), ()))) and len(contadas) == 1 and len(com_lista) == 1:
            k = com_lista[0]
        if not any(can.get(k, ((), ()))):  # a memória abreviou o nome da linha da tabela
            prefixos = [x for x in com_lista if k.startswith(x) and k[len(x):len(x) + 1] in (" ", "(")]
            if len(prefixos) == 1:
                k = prefixos[0]
        if any(can.get(k, ((), ()))):
            (alr_d, der_d), nota = can[k], notas_can.get(k, "")
        elif not (alr_d or der_d) and notas_can.get(k):
            nota = notas_can[k]
        out[nome] = (list(alr_d), list(der_d), nota)
    return out

# ── as regras do bloco — as mesmas do valida-enumeracao-contagem.mjs ─────────────────
def norm(s):
    s = unicodedata.normalize("NFD", re.sub(r"[`*]", "", str(s)))
    return re.sub(r"\s+", " ", "".join(ch for ch in s if unicodedata.category(ch) != "Mn")).strip().casefold()

def problema_do_item(s):
    if not isinstance(s, str) or not s.strip():
        return "vazio"
    if len(s) > 60:
        return "longo demais — é nome, não explicação"
    if re.search(r"[:;—–→+*#?!`\n]", s):
        return "tem anotação (`: ; — → + * # ? !` ou crase)"
    if re.fullmatch(r"\s*\(.*\)\s*", s):
        return "só parêntese — é comentário, não campo"
    if re.search(r"\([^)]*,[^)]*\)", s):
        return "parêntese com vírgula — é anotação"
    return None

def item_canonico(x):
    if re.match(r"capacidade de mensage", x, re.I) or norm(x) == "mensagem":
        return "Mensagem"
    if re.match(r"a[çc][ãa]o que dispara", x, re.I) or norm(x) == "acao":
        return "Ação"
    return x

def bloco_json(b):
    partes = [f'"{k}": {json.dumps(v, ensure_ascii=False)}' for k, v in b.items()]
    return "```json\n{" + ",\n ".join(partes) + "}\n```"

# ── por N3 ──────────────────────────────────────────────────────────────────────────
def propostas(caminho):
    """[(nome do PE, bloco, [problemas])] dos PE medidos ainda sem bloco."""
    linhas = caminho.read_text(encoding="utf-8").splitlines()
    i = secao(linhas, "Métricas de tamanho")
    if i < 0:
        return []
    tabs = tabelas(linhas, i + 1, lambda l: re.match(r"#{2,3}\s", l) is not None)
    if not tabs:
        return []
    cab, corpo = tabs[0]
    iPE = col(cab, r"Fun[çc][ãa]o de Transa[çc][ãa]o", r"Processo elementar")
    iTipo, iALR, iDER, iPF = col(cab, r"Tipo"), col(cab, r"ALR"), col(cab, r"DER"), col(cab, r"PF")
    if iPE < 0 or iPF < 0:
        return []
    ja = enumeracao(corpo_da_secao(linhas, "Métricas de tamanho"))
    lidas = antiga(linhas, corpo, iPE, iPF)
    nomes = [chave_pe(c[iPE]) for c in corpo if iPE < len(c) and iPF < len(c) and re.fullmatch(r"\d+", c[iPF])]
    out = []
    for c in corpo:
        pega = lambda k: c[k] if 0 <= k < len(c) else ""
        if not re.fullmatch(r"\d+", pega(iPF)) or "↪" in pega(iTipo):
            continue
        nome = re.sub(r"[`*]", "", pega(iPE)).strip()
        if chave_pe(nome) in ja:
            continue
        alr, der, nota = lidas.get(nome, ([], [], ""))
        nota = re.sub(r"\s+", " ", nota or "").strip()
        problemas = []
        if nomes.count(chave_pe(nome)) > 1:
            problemas.append("o mesmo nome em mais de uma linha da tabela — o bloco não sabe de qual é")
        if pega(iPF) == "0":
            motivo = re.sub(r"^n[ãa]o contad[oa]s?\s*[:—–-]\s*", "", nota, flags=re.I).strip()
            if not motivo:
                problemas.append("linha de 0 PF sem o motivo na memória")
            out.append((nome, {"pe": nome, "motivo": motivo}, problemas))
            continue
        b = {"pe": nome, "alr": alr, "der": [item_canonico(x) for x in der]}
        m = re.match(r"n[ãa]o contad[oa]s?\s*:\s*(.+)$", nota, re.I)
        if m:
            b["nao_contados"] = m.group(1).strip()
        if not alr and not der:
            problemas.append("sem enumeração de ALR e DER na memória")
        for lado, qtd in (("ALR", pega(iALR)), ("DER", pega(iDER))):
            if not qtd.isdigit():
                problemas.append(f"a tabela diz {lado} {qtd or '—'}, que não é número")
        for lado, qtd in (("alr", pega(iALR)), ("der", pega(iDER))):
            lista = b[lado]
            if qtd.isdigit() and (alr or der) and len(lista) != int(qtd):
                problemas.append(f"a tabela diz {lado.upper()} {qtd}, a memória enumera {len(lista)}")
            vistos = set()
            for x in lista:
                p = problema_do_item(x)
                if p:
                    problemas.append(f'{lado.upper()} "{x[:70]}" — {p}')
                elif norm(x) in vistos:
                    problemas.append(f'{lado.upper()} "{x}" repetido')
                vistos.add(norm(x))
        out.append((nome, b, problemas))
    return out

def grava(caminho, limpos, data):
    """Insere cada bloco logo abaixo do cabeçalho do PE na memória e registra no Changelog."""
    linhas = caminho.read_text(encoding="utf-8").split("\n")
    i = secao(linhas, "Métricas de tamanho")
    fim = next((j for j in range(i + 1, len(linhas)) if re.match(r"##\s", linhas[j])), len(linhas))
    iMem = next((j for j in range(i + 1, fim) if re.match(r"###\s+Mem[óo]ria de c[áa]lculo", linhas[j].strip())), None)
    if iMem is None:  # memória só em <details> ou solta: a seção nasce antes do Total
        iMem = next((j for j in range(i + 1, fim) if re.match(r"\*\*Total\b", linhas[j].strip())), fim)
        linhas[iMem:iMem] = ["### Memória de cálculo", ""]
        fim += 2
    for nome, b in reversed(limpos):
        alvo = next((j for j in range(iMem + 1, fim)
                     if (m := re.match(r"^(?:[-*]\s+)?\*\*([^*]+?)\*\*\s*—", linhas[j].strip())) and chave_pe(m.group(1)) == chave_pe(nome)),
                    None)
        if alvo is None:  # sem cabeçalho do PE: o bloco vai logo abaixo do título da memória
            alvo = iMem
        linhas[alvo + 1:alvo + 1] = [""] + bloco_json(b).split("\n")
        fim += 1 + bloco_json(b).count("\n") + 1
    # Changelog: linha nova no topo da tabela (ordem decrescente por data)
    ic = secao(linhas, "Changelog")
    if ic >= 0:
        k = next((j for j in range(ic + 1, len(linhas)) if linhas[j].strip().startswith("|")), None)
        if k is not None and k + 1 < len(linhas) and eh_separador(linhas[k + 1]):
            cab = celulas(linhas[k])
            desc = (f"Enumeração de ALR e DER da memória de cálculo em bloco JSON ({len(limpos)} PE) — "
                    f"migra-enumeracao, engine 5.0.0; sem mudança de número")
            valor = lambda h: (data if re.match(r"data", h, re.I) else "migra-enumeracao" if re.match(r"autor", h, re.I)
                               else "Contagem" if re.match(r"tipo", h, re.I) else desc if re.match(r"descri|mudan|o qu", h, re.I) else "—")
            linhas.insert(k + 2, "| " + " | ".join(valor(h) for h in cab) + " |")
    caminho.write_text("\n".join(linhas), encoding="utf-8")

def main():
    ap = argparse.ArgumentParser(description="Converte a enumeração de ALR e DER da memória de cálculo para o bloco JSON.")
    ap.add_argument("caminhos", nargs="*", help="N3 ou pastas (padrão: modules/)")
    ap.add_argument("--write", action="store_true", help="grava (sem ele, só simula)")
    ap.add_argument("--data", default=datetime.date.today().isoformat(), help="data da linha do Changelog")
    a = ap.parse_args()
    alvos = [Path(p) for p in (a.caminhos or ["modules"])]
    n3s = sorted({f for p in alvos for f in ([p] if p.is_file() else p.rglob("f-*.md"))})
    convertidos = pendentes = 0
    for f in n3s:
        props = propostas(f)
        if not props:
            continue
        limpos = [(n, b) for n, b, pr in props if not pr]
        print(f"{'✎' if a.write and limpos else '·'} {f}")
        for n, b, pr in props:
            if pr:
                pendentes += 1
                print(f"    ✗ {n} — fica sem bloco: {'; '.join(pr)}")
                print("      proposto: " + json.dumps(b, ensure_ascii=False))
            else:
                convertidos += 1
                print(f"    ✓ {n} — ALR {len(b.get('alr', []))} · DER {len(b.get('der', []))}" if "motivo" not in b else f"    ✓ {n} — 0 PF")
        if a.write and limpos:
            grava(f, limpos, a.data)
    acao = "gravado(s)" if a.write else "a converter (simulação — rode com --write)"
    print(f"\n{convertidos} processo(s) elementar(es) {acao} · {pendentes} pendente(s) de decisão humana, "
          f"com o bloco proposto acima para corrigir e colar à mão.")
    print("Depois: node scripts/valida-enumeracao-contagem.mjs")

if __name__ == "__main__":
    main()
