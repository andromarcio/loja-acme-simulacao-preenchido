"""Gera o retrato de gestão do Pages, sem alterar a documentação ou os gates."""

import argparse
from datetime import date, datetime, timezone
import json
from pathlib import Path
import re
import subprocess

import gates


LEVEL = re.compile(r"^>\s*\*\*Nível ([123])\*\*.*?`([A-Z]{3}(?:-[A-Z]{3})?(?:-\d{2})?)`", re.MULTILINE)
# As chaves de ticket que os commits citam: o mesmo formato do STORY_KEY_RE do engine.
STORY_KEY = re.compile(r"\b(?:STRY\d{4,}|ISSUE-\d{1,7}|PDTIC\d+-\d{1,7}|EXP-[A-Za-z0-9][A-Za-z0-9_-]*)\b", re.IGNORECASE)
FEATURE_ID = re.compile(r"\b[A-Z]{3}-[A-Z]{3}-\d{2}\b")
UNIT = re.compile(r"^(sprint|historia)/(.+)$")


def git(root, *arguments):
    return subprocess.check_output(
        ["git", "-C", str(root), *arguments], encoding="utf-8", stderr=subprocess.PIPE
    ).strip()


def repository_snapshot(root, branch=None):
    records = git(root, "for-each-ref", "--format=%(refname)\t%(symref)\t%(objectname)\t%(committerdate:iso-strict)",
                  "refs/heads", "refs/remotes")
    branches = {}
    for record in records.splitlines():
        ref, symbolic, commit, updated = record.split("\t")
        if symbolic:
            continue
        local = ref.startswith("refs/heads/")
        name = ref.removeprefix("refs/heads/") if local else ref.removeprefix("refs/remotes/").split("/", 1)[1]
        item = branches.setdefault(name, {"name": name, "local": False, "remotes": [], "commit": commit[:12], "updated": updated})
        if local:
            item["local"] = True
        else:
            item["remotes"].append(ref.removeprefix("refs/remotes/").split("/", 1)[0])
    return {
        "branch": branch or git(root, "rev-parse", "--abbrev-ref", "HEAD"),
        "commit": git(root, "rev-parse", "--short=12", "HEAD"),
        "dirty": bool(git(root, "status", "--porcelain", "--untracked-files=no")),
        "shallow": git(root, "rev-parse", "--is-shallow-repository") == "true",
        "branches": sorted(branches.values(), key=lambda item: item["name"]),
    }


def feature_governance(meta):
    result = {"state": "sem-governanca", "nextGate": None, "approved": False, "issues": []}
    if not gates.has_gates(meta):
        return result
    issues = result["issues"]
    gates.validar_estrutura(meta, "N3", issues)
    for name in gates.GATE_ORDER:
        gate = meta["gates"].get(name)
        if isinstance(gate, dict) and not isinstance(gate.get("aprovado"), bool):
            issues.append(f"Gate {name}: aprovado deve ser booleano.")
    if issues:
        result["state"] = "governanca-invalida"
        return result
    gates.validar_prefixo(meta, "N3", issues)
    gates.validar_estado(meta, "N3", issues)
    for name in gates.GATE_ORDER:
        if gates.gate_aprovado(meta, name):
            gate = meta["gates"][name]
            responsible = gate.get("por")
            stamp = str(gate.get("em", ""))
            try:
                valid_date = bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}", stamp)) and bool(date.fromisoformat(stamp))
            except ValueError:
                valid_date = False
            if not isinstance(responsible, str) or not responsible.strip() or not valid_date:
                issues.append(f"Gate {name}: aprovação sem responsável ou data.")
    result.update(
        state=gates.estado_de_exibicao(meta),
        nextGate=gates.proximo_checkpoint(meta) or None,
        approved=gates.gate_aprovado(meta, "requisitos"),
    )
    if issues:
        result.update(state="governanca-invalida", approved=False, nextGate=None)
    return result


def describe(text, path):
    """O artefato N1/N2/N3 de um texto, como o dashboard o mostra; None se não é um."""
    level = LEVEL.search(text)
    if not level:
        return None
    number, identifier = level.groups()
    meta = gates.parse_front_matter(text)
    title = re.search(r"^#\s+(.+)", text, re.MULTILINE)
    item = {
        "level": int(number), "id": identifier,
        "title": re.sub(r"^(?:Agrupamento Funcional|Feature Set|Domínio|Major Feature Set):\s*", "", title[1]) if title else identifier,
        "path": path, "domain": identifier.split("-")[0],
    }
    if number == "3":
        item.update(feature_governance(meta))
        first_content = next((line.strip() for line in text.lstrip("\ufeff").splitlines()
                              if line.strip() and not line.strip().startswith("<!--")), "")
        if meta is None and first_content == "---":
            item.update(state="governanca-invalida", issues=["Front-matter ausente ou ilegível."])
        counting = (meta or {}).get("contagem")
        pending = counting.get("pendente") if isinstance(counting, dict) else None
        item["countPending"] = pending if isinstance(pending, bool) else None
    return item


def category(path):
    """Em que parte da documentação o arquivo está, para agrupar o que a branch mudou."""
    if path.startswith("modules/"):
        name, depth = path.rsplit("/", 1)[-1], path.count("/")
        if name.startswith("f-") and depth == 3:
            return "n3"
        return {2: "n1", 3: "n2"}.get(depth, "modulos") if name == "README.md" else "modulos"
    if path.startswith("analise-impacto/"):
        return "aim"
    if path.startswith("global/data-models/") or path in ("global/DATA-MODEL.md", "global/DIAGRAMA-ER.md"):
        return "modelo"
    if re.fullmatch(r"global/[A-Z-]+-DICTIONARY\.md", path):
        return "dicionario"
    for prefix, name in (("global/", "global"), ("prototypes/", "prototipo"), ("qa/", "qa")):
        if path.startswith(prefix):
            return name
    return "site"


def changed_files(git_root, base):
    """O que a branch muda desde a base: o mesmo `git diff` do Ver alterações dos previews."""
    tokens = git(git_root, "diff", "--name-status", "-z", "--find-renames", base, "HEAD", "--").split("\0")
    files, i = [], 0
    while i < len(tokens) and tokens[i]:
        status = tokens[i][0]
        old = tokens[i + 1]
        path = tokens[i + 2] if status in "RC" else old
        i += 3 if status in "RC" else 2
        files.append({"path": path, "oldPath": old, "status": status, "added": None, "removed": None,
                      "category": category(path)})
    numbers = git(git_root, "diff", "--numstat", "-z", "--find-renames", base, "HEAD", "--").split("\0")
    stats, i = {}, 0
    while i < len(numbers) and numbers[i]:
        added, removed, path = numbers[i].split("\t", 2)
        if not path:  # renomeado: "a\tr\t" e depois a origem e o destino
            path, i = numbers[i + 2], i + 3
        else:
            i += 1
        stats[path] = (int(added), int(removed)) if added != "-" else (None, None)
    for file in files:
        file["added"], file["removed"] = stats.get(file["path"], (None, None))
    return files


def aim_key(path):
    """Chave da AIMM (ou AIM legada); None para modelo, HTML e outros arquivos."""
    match = re.fullmatch(r"analise-impacto/AIMM?-([^/]+)\.md", path or "")
    return match[1].upper() if match else None


def aim_item(text, path):
    meta = gates.parse_front_matter(text)
    meta = meta if isinstance(meta, dict) else {}
    kind = str(meta.get("tipo") or "ticket")
    section = re.search(rf"^## {'Tickets da sprint' if kind == 'sprint' else '(?:Funcionalidades|Features)'}[ \t]*\n([\s\S]*?)(?=\n## |\Z)",
                        text, re.MULTILINE)
    body = section[1] if section else ""
    return {
        "key": aim_key(path), "path": path, "kind": kind,
        "title": str(meta.get("titulo") or ""), "state": str(meta.get("estado") or ""),
        "sprint": str(meta.get("sprint") or ""),
        "refs": sorted({key.upper() for key in STORY_KEY.findall(body)} if kind == "sprint" else set(FEATURE_ID.findall(body))),
    }


def delivery_snapshot(root, git_root, branch, base, artifacts):
    """O que a branch de entrega mudou desde a base: documentos, features (antes e agora) e tickets.

    A base é a do Ver alterações dos previews — o ancestral comum com a base do PR —, então o
    que chegou à base depois que a branch saiu não conta como mudança da sprint.
    """
    match = UNIT.match(branch or "")
    unit = {"type": match[1], "id": match[2]} if match else None
    base = git(git_root, "merge-base", base, "HEAD")  # aceita também o nome da base: origin/main
    files = changed_files(git_root, base)
    previous = lambda path: git(git_root, "show", f"{base}:{path}")
    now = {item["path"]: item for item in artifacts}
    aims = {}
    for file in sorted((root / "analise-impacto").glob("*.md")):
        path = f"analise-impacto/{file.name}"
        key = aim_key(path)
        if not key:
            continue
        if key in aims:
            raise ValueError(f"AIMM duplicada para {key}: {aims[key]['path']} e {path}.")
        aims[key] = aim_item(file.read_text(encoding="utf-8"), path)
    aims_before = {}
    for file in files:
        if file["status"] != "A" and aim_key(file["oldPath"]):
            aims_before[aim_key(file["oldPath"])] = aim_item(previous(file["oldPath"]), file["oldPath"])
    aims_changed = {aim_key(file["path"]) for file in files} - {None}

    # Os commits da branch, cada um com as chaves que o assunto cita e os arquivos que tocou: é
    # por eles que um documento se liga ao ticket da sprint (na cadência sprint, todo commit
    # de spec cita uma chave). A origem do N3 não serve: ela guarda o ticket que criou a feature.
    known = sorted(aims)
    commits, touched, without_key = {}, {}, 0
    log = git(git_root, "log", "--no-merges", "--format=%x1e%s", "--name-only", f"{base}..HEAD")
    entries = [block.strip().split("\n") for block in log.split("\x1e") if block.strip()]
    for subject, *paths in entries:
        keys = {key.upper() for key in STORY_KEY.findall(subject)}
        keys |= {key for key in known if re.search(rf"(^|[^\w-]){re.escape(key)}($|[^\w-])", subject, re.IGNORECASE)}
        for key in keys:
            commits[key] = commits.get(key, 0) + 1
        without_key += not keys
        for path in filter(None, paths):
            touched.setdefault(path, set()).update(keys)
    for file in files:
        file["tickets"] = sorted(touched.get(file["path"], set()) | touched.get(file["oldPath"], set()))

    view = lambda item: {"state": item["state"], "nextGate": item["nextGate"], "approved": item["approved"]} if item else None
    features = []
    for file in files:
        if "n3" not in (file["category"], category(file["oldPath"])):
            continue
        after = now.get(file["path"]) if file["status"] != "D" else None
        # Cópia não muda a origem, que continua lá: o N3 copiado é um N3 novo.
        before = describe(previous(file["oldPath"]), file["oldPath"]) if file["status"] not in "AC" else None
        # O git junta a exclusão de um N3 e a inclusão de outro parecido como renomeação; com IDs
        # diferentes são duas features, uma que sai e outra que entra.
        if before and after and before["id"] != after["id"]:
            changes = [("D", before, None), ("A", None, after)]
        else:
            changes = [("A" if file["status"] == "C" else file["status"], before, after)]
        for change, earlier, later in changes:
            current = later or earlier
            if not current or current["level"] != 3:
                continue
            features.append({
                "id": current["id"], "title": current["title"], "path": current["path"], "change": change,
                "before": view(earlier), "after": view(later), "tickets": file["tickets"],
            })

    unit_key = unit["id"].upper() if unit else ""
    keys = set(commits)
    keys |= {key for key, aim in aims.items() if aim["kind"] == "ticket" and unit and aim["sprint"].upper() == unit_key}
    keys |= set(aims_before) | aims_changed
    if unit and unit["type"] == "historia":
        keys.add(unit_key)
    sprint_aim = aims.get(unit_key) if unit and unit["type"] == "sprint" else None
    if sprint_aim and sprint_aim["kind"] == "sprint":
        keys |= set(sprint_aim["refs"])
    tickets = []
    for key in sorted(keys - ({unit_key} if unit and unit["type"] == "sprint" else set())):
        aim, earlier = aims.get(key), aims_before.get(key)
        if aim and aim["kind"] == "sprint":
            continue
        changed = key in aims_changed
        tickets.append({
            "key": key, "title": (aim or earlier or {}).get("title", ""), "path": aim["path"] if aim else None,
            "before": (earlier["state"] if earlier else None) if changed else (aim["state"] if aim else None),
            "after": aim["state"] if aim else None,
            "features": sorted(set((aim or {}).get("refs", [])) | {f["id"] for f in features if key in f["tickets"]}),
            "commits": commits.get(key, 0),
        })
    sprint_view = None
    if sprint_aim and sprint_aim["kind"] == "sprint":
        earlier = aims_before.get(unit_key)
        sprint_view = {"path": sprint_aim["path"], "before": earlier["state"] if earlier else None,
                       "after": sprint_aim["state"], "commits": commits.get(unit_key, 0)}
    return {
        "unit": unit, "branch": branch, "base": git(git_root, "rev-parse", "--short=12", base),
        "commits": len(entries), "commitsWithoutKey": without_key,
        "files": files, "features": features, "tickets": tickets, "sprintAim": sprint_view,
    }


def build_snapshot(root, git_root=None, branch=None, base=None):
    root = Path(root).resolve()
    profile = gates.aplicar_perfil(str(root))
    artifacts = []
    missing = []
    for file in sorted((root / "modules").rglob("*.md")):
        relative = file.relative_to(root)
        if any(part.startswith("_") for part in relative.parts):
            continue
        text = file.read_text(encoding="utf-8")
        item = describe(text, relative.as_posix())
        if not item:
            continue
        number, identifier = str(item["level"]), item["id"]
        artifacts.append(item)
        if number == "2":
            section = re.search(r"^## (?:Funcionalidades|Features)[ \t]*\n([\s\S]*?)(?=\n## |\Z)", text, re.MULTILINE)
            if section:
                for link in re.finditer(r"\[([^\n]+?)\]\((?:<)?(\.?/?f-[^)\s>]+\.md)(?:>)?\)", section[1]):
                    target = file.parent / link[2]
                    if not target.exists():
                        missing.append({"domain": item["domain"], "title": link[1].replace("*", ""),
                                        "featureSet": identifier, "path": item["path"]})
    repository = repository_snapshot(Path(git_root or root), branch)
    snapshot = {
        "schema": 1, "generatedAt": datetime.now(timezone.utc).isoformat(),
        "profile": profile, "gateOrder": list(gates.GATE_ORDER),
        "repository": repository,
        "artifacts": sorted(artifacts, key=lambda item: (item["id"], item["path"])), "missingFeatures": missing,
        "prototypes": len([file for file in (root / "prototypes").rglob("*.html")
                           if not any(part.startswith("_biblioteca-") for part in file.parts)
                           and not any(part.lower().startswith("_template") for part in file.parts)]),
        "dataModels": len([file for file in (root / "global" / "data-models").glob("*.md")
                           if file.name != "INDEX.md"]),
    }
    if base:
        snapshot["delivery"] = delivery_snapshot(root, Path(git_root or root), repository["branch"], base, artifacts)
    return snapshot


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".")
    parser.add_argument("--git-root")
    parser.add_argument("--branch")
    parser.add_argument("--base", help="base da branch de entrega (a do PR, ex.: origin/main); vale o ancestral comum com ela")
    args = parser.parse_args()
    snapshot = build_snapshot(args.root, args.git_root, args.branch, args.base)
    destination = Path(args.root) / "assets" / "dashboard-data.js"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        "// Gerado por scripts/gera-dashboard.py; não editar.\n"
        + "window.DASHBOARD_DATA = " + json.dumps(snapshot, ensure_ascii=True) + ";\n",
        encoding="utf-8",
    )
    print(f"Dashboard gerado: {len(snapshot['artifacts'])} artefatos; "
          f"{len(snapshot['repository']['branches'])} branches conhecidas.")


if __name__ == "__main__":
    main()
