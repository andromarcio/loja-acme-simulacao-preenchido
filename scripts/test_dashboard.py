import importlib.util
from pathlib import Path
import subprocess
from tempfile import TemporaryDirectory
import unittest


MODULE_PATH = Path(__file__).with_name("gera-dashboard.py")
SPEC = importlib.util.spec_from_file_location("dashboard_generator", MODULE_PATH)
dashboard = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(dashboard)


class DashboardTests(unittest.TestCase):
    def setUp(self):
        self.temporary = TemporaryDirectory(prefix="dashboard-test-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.write("global/MASTER.md", "- **Perfil**: `requisitos`\n")
        self.git("init", "--quiet", "--initial-branch=main")
        self.git("-c", "user.name=Test", "-c", "user.email=test@example.invalid",
                 "commit", "--quiet", "--allow-empty", "-m", "Fixture")

    def git(self, *args):
        return dashboard.git(self.root, *args)

    def write(self, path, content):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")

    def feature(self, identifier, requirements=False, model=False, state=None):
        state = state or ("especificado" if model else "requisitos-aprovados" if requirements else "rascunho")
        truth = lambda value: str(value).lower()
        return f"""<!-- docqui: test -->
---
id: {identifier}
estado: {state}
gates:
  requisitos: {{ aprovado: {truth(requirements)}, por: PO, em: "2026-10-15" }}
  modelo-dados:
    aprovado: {truth(model)}
    por: DBA
    em: "2026-10-15"
contagem:
  pendente: true
---
# Feature de teste
> **Nível 3** - Teste - `{identifier}`
"""

    def test_hierarchy_counts_real_artifacts_not_placeholders(self):
        self.write("modules/teste/README.md", "# Domínio: Teste\n> **Nível 1** - `TST`\n")
        self.write("modules/teste/grupo/README.md", """# Feature Set: Grupo
> **Nível 2** - `TST-GRP`
## Features
| Feature | Descrição |
|---|---|
| [Consultar](f-consultar.md) <small>TST-GRP-01</small> | Consulta |
| [Incluir](f-incluir.md) <small>TST-GRP-02</small> | Inclusão |
""")
        self.write("modules/teste/grupo/f-consultar.md", self.feature("TST-GRP-01", True))
        self.write("modules/_archive/teste/f-antiga.md", self.feature("OLD-GRP-01"))
        self.write("modules/INDEX.md", "# Índice\n| N3 | 999 |\n")
        self.write("prototypes/teste/grupo/flow.html", "<html></html>")
        self.write("prototypes/_biblioteca-caixa/index.html", "<html></html>")
        self.write("prototypes/_biblioteca-ds/index.html", "<html></html>")
        self.write("prototypes/_biblioteca-ds/shell-responsive.html", "<html></html>")
        self.write("global/data-models/teste.md", "# Modelo")
        data = dashboard.build_snapshot(self.root)
        self.assertEqual([item["level"] for item in data["artifacts"]], [1, 2, 3])
        self.assertEqual(data["prototypes"], 1)
        self.assertEqual(data["dataModels"], 1)
        self.assertEqual(len(data["missingFeatures"]), 1)
        self.assertEqual(data["missingFeatures"][0]["featureSet"], "TST-GRP")
        self.assertEqual(data["artifacts"][-1]["nextGate"], "modelo-dados")
        self.assertTrue(data["artifacts"][-1]["approved"])

    def test_gates_distinguish_approved_from_specified(self):
        for number, requirements, model in [(1, False, False), (2, True, False), (3, True, True)]:
            self.write(f"modules/teste/grupo/f-{number}.md", self.feature(f"TST-GRP-0{number}", requirements, model))
        data = dashboard.build_snapshot(self.root)
        self.assertEqual([item["state"] for item in data["artifacts"]],
                         ["rascunho", "requisitos-aprovados", "especificado"])
        self.assertEqual([item["nextGate"] for item in data["artifacts"]],
                         ["requisitos", "modelo-dados", None])
        self.assertEqual(sum(item["approved"] for item in data["artifacts"]), 2)
        self.assertEqual(sum(item["state"] == "especificado" for item in data["artifacts"]), 1)

    def test_missing_and_invalid_governance_never_count_as_approval(self):
        self.write("modules/teste/grupo/f-sem.md", "# Sem metadados\n> **Nível 3** - `TST-GRP-01`")
        self.write("modules/teste/grupo/f-invalida.md", self.feature("TST-GRP-02", False, True))
        data = dashboard.build_snapshot(self.root)
        states = {item["id"]: item["state"] for item in data["artifacts"]}
        self.assertEqual(states["TST-GRP-01"], "sem-governanca")
        self.assertEqual(states["TST-GRP-02"], "governanca-invalida")
        self.assertFalse(any(item["approved"] for item in data["artifacts"]))
        self.assertTrue(next(item for item in data["artifacts"] if item["id"] == "TST-GRP-02")["issues"])

    def test_missing_approval_stamp_and_non_boolean_gate_are_invalid(self):
        raw = self.feature("TST-GRP-01", True).replace("por: PO", 'por: ""')
        self.write("modules/teste/grupo/f-carimbo.md", raw)
        self.write("modules/teste/grupo/f-tipo.md", self.feature("TST-GRP-02").replace("aprovado: false", "aprovado: 0", 1))
        data = dashboard.build_snapshot(self.root)
        self.assertTrue(all(item["state"] == "governanca-invalida" for item in data["artifacts"]))

    def test_complete_profile_uses_original_checkpoint_order(self):
        self.write("global/MASTER.md", "- **Perfil**: `completo`\n")
        raw = self.feature("TST-GRP-01", True, True, "modelo-validado").replace("contagem:", """  testes: { aprovado: false }
  codigo: { aprovado: false }
contagem:""")
        self.write("modules/teste/grupo/f-consultar.md", raw)
        data = dashboard.build_snapshot(self.root)
        self.assertEqual(data["gateOrder"], ["requisitos", "modelo-dados", "testes", "codigo"])
        self.assertEqual(data["artifacts"][0]["nextGate"], "testes")
        self.assertEqual(data["artifacts"][0]["state"], "modelo-validado")

    def test_branches_are_deduplicated_and_symbolic_head_ignored(self):
        commit = self.git("rev-parse", "HEAD")
        self.git("branch", "sprint/42")
        self.git("update-ref", "refs/remotes/origin/main", commit)
        self.git("update-ref", "refs/remotes/origin/sprint/42", commit)
        self.git("update-ref", "refs/remotes/origin/feature/remote", commit)
        self.git("symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/main")
        data = dashboard.build_snapshot(self.root)
        branches = data["repository"]["branches"]
        self.assertEqual(len(branches), 3)
        self.assertEqual([item["name"] for item in branches], ["feature/remote", "main", "sprint/42"])
        self.assertEqual(sum(item["local"] for item in branches), 2)
        self.assertEqual(sum(bool(item["remotes"]) for item in branches), 3)

    def test_site_copy_uses_document_snapshot_and_explicit_git_repository(self):
        copy = self.root / "copy"
        copy.mkdir()
        (copy / "modules").mkdir()
        self.write("copy/modules/teste/grupo/f-nova.md", self.feature("TST-GRP-01"))
        data = dashboard.build_snapshot(copy, self.root, "sprint/42")
        self.assertEqual(data["repository"]["branch"], "sprint/42")
        self.assertEqual(len(data["artifacts"]), 1)
        self.assertEqual(data["repository"]["commit"], self.git("rev-parse", "--short=12", "HEAD"))

    def test_non_git_directory_does_not_silently_report_zero_branches(self):
        with TemporaryDirectory(prefix="dashboard-no-git-") as directory:
            with self.assertRaises(subprocess.CalledProcessError):
                dashboard.repository_snapshot(Path(directory))

    def test_invalid_calendar_date_and_malformed_front_matter_are_visible(self):
        self.write("modules/teste/grupo/f-data.md",
                   self.feature("TST-GRP-01", True).replace("2026-10-15", "2026-99-15"))
        self.write("modules/teste/grupo/f-yaml.md", """---
gates: {
---
# Inválida
> **Nível 3** - `TST-GRP-02`
""")
        data = dashboard.build_snapshot(self.root)
        self.assertEqual(len(data["artifacts"]), 2)
        self.assertTrue(all(item["state"] == "governanca-invalida" and not item["approved"]
                            for item in data["artifacts"]))

    def commit(self, message, *paths):
        self.git("add", "--all", *paths)
        self.git("-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "--quiet", "-m", message)

    def aim(self, key, state, *features, sprint=""):
        rows = "\n".join(f"| `{feature}` | Teste | Alteração | — | ✏️ |" for feature in features)
        return f"""---
tipo: ticket
ticket: {key}
titulo: Ticket {key}
estado: {state}
sprint: "{sprint}"
---
# AIM {key}
## Features
| Feature (N3) | Domínio · Feature Set | Operação | Critérios cobertos | Status |
|---|---|---|---|---|
{rows}
## Changelog
"""

    def test_delivery_shows_what_the_sprint_branch_changed(self):
        # A visão da sprint: o que a branch mudou desde a base — documentos, features com o
        # estado antes e agora, tickets pelas chaves dos commits e pela AIM da sprint.
        self.write("modules/teste/grupo/README.md", "# Feature Set: Grupo\n> **Nível 2** - `TST-GRP`\n")
        self.write("modules/teste/grupo/f-consultar.md", self.feature("TST-GRP-01"))
        self.write("modules/teste/grupo/f-antiga.md", self.feature("TST-GRP-02"))
        self.write("analise-impacto/AIM-STRY0000001.md", self.aim("STRY0000001", "em-análise", "TST-GRP-01"))
        self.write("analise-impacto/AIM-STRY0000001.html", "<p>em-análise</p>")
        self.write("analise-impacto/_TEMPLATE_AIM.md", "---\ntipo: ticket\n---\n# AIM [CHAVE]\n")
        self.write("analise-impacto/AIM-STRY0000004.md", self.aim("STRY0000004", "concluído", "TST-GRP-01"))
        self.write("analise-impacto/AIM-STRY0000004.html", "<p>v1</p>")
        self.commit("Base")
        base = self.git("rev-parse", "HEAD")
        self.git("checkout", "--quiet", "-b", "sprint/SP08")
        self.write("analise-impacto/AIM-SP08.md", """---
tipo: sprint
sprint: SP08
estado: rascunho
---
# AIM SP08
## Tickets da sprint
| Ticket | AIM | Features | Resumo |
|---|---|---|---|
| `STRY0000001` | [AIM](AIM-STRY0000001.md) | `TST-GRP-01` | Consultar |
| `STRY0000003` | — | — | Planejado, ainda sem AIM |
""")
        self.commit("SP08: abre a AIM da sprint")
        self.write("modules/teste/grupo/f-consultar.md", self.feature("TST-GRP-01", requirements=True))
        self.write("analise-impacto/AIM-STRY0000001.md", self.aim("STRY0000001", "escopo-aprovado", "TST-GRP-01"))
        self.write("analise-impacto/AIM-STRY0000001.html", "<p>escopo-aprovado</p>")
        self.write("analise-impacto/_TEMPLATE_AIM.md", "---\ntipo: ticket\n---\n# AIM [CHAVE] (modelo)\n")
        self.commit("STRY0000001: requisitos aprovados")
        self.write("modules/teste/grupo/f-exibir.md", self.feature("TST-GRP-03"))
        (self.root / "modules/teste/grupo/f-antiga.md").unlink()
        self.commit("STRY0000002: inclui Exibir e retira a antiga")
        self.write("modules/teste/grupo/README.md", "# Feature Set: Grupo\n> **Nível 2** - `TST-GRP`\n\nAjuste.\n")
        self.write("analise-impacto/AIM-STRY0000004.html", "<p>v2, regerada</p>")
        self.commit("ajusta o texto do Feature Set")

        data = dashboard.build_snapshot(self.root, base=base)["delivery"]
        self.assertEqual(data["unit"], {"type": "sprint", "id": "SP08"})
        self.assertEqual((data["commits"], data["commitsWithoutKey"]), (4, 1))
        files = {item["path"]: (item["status"], item["category"], item["tickets"]) for item in data["files"]}
        self.assertEqual(files["modules/teste/grupo/f-consultar.md"], ("M", "n3", ["STRY0000001"]))
        # O git vê a antiga e a nova, parecidas, como uma renomeação; a feature, não (abaixo).
        self.assertEqual(files["modules/teste/grupo/f-exibir.md"], ("R", "n3", ["STRY0000002"]))
        self.assertNotIn("modules/teste/grupo/f-antiga.md", files)
        self.assertEqual(files["modules/teste/grupo/README.md"], ("M", "n2", []))
        self.assertEqual(files["analise-impacto/AIM-SP08.md"], ("A", "aim", ["SP08"]))
        features = {item["id"]: item for item in data["features"]}
        self.assertEqual(features["TST-GRP-01"]["change"], "M")
        self.assertEqual((features["TST-GRP-01"]["before"]["state"], features["TST-GRP-01"]["after"]["state"]),
                         ("rascunho", "requisitos-aprovados"))
        self.assertEqual((features["TST-GRP-01"]["before"]["nextGate"], features["TST-GRP-01"]["after"]["nextGate"]),
                         ("requisitos", "modelo-dados"))
        self.assertEqual((features["TST-GRP-03"]["change"], features["TST-GRP-03"]["before"]), ("A", None))
        self.assertEqual((features["TST-GRP-02"]["change"], features["TST-GRP-02"]["after"]), ("D", None))
        self.assertEqual(features["TST-GRP-02"]["before"]["state"], "rascunho")
        # Sem o modelo da AIM e sem a HTML regerada (a do STRY0000004, de outra sprint) como
        # ticket; a AIM da sprint fica à parte.
        tickets = {item["key"]: item for item in data["tickets"]}
        self.assertEqual(sorted(tickets), ["STRY0000001", "STRY0000002", "STRY0000003"])
        self.assertEqual((tickets["STRY0000001"]["before"], tickets["STRY0000001"]["after"]), ("em-análise", "escopo-aprovado"))
        self.assertEqual((tickets["STRY0000001"]["commits"], tickets["STRY0000001"]["features"]), (1, ["TST-GRP-01"]))
        self.assertEqual((tickets["STRY0000002"]["path"], tickets["STRY0000002"]["features"]), (None, ["TST-GRP-02", "TST-GRP-03"]))
        self.assertEqual((tickets["STRY0000003"]["commits"], tickets["STRY0000003"]["after"]), (0, None))
        self.assertEqual(data["sprintAim"], {"path": "analise-impacto/AIM-SP08.md", "before": None, "after": "rascunho", "commits": 1})
        self.assertNotIn("delivery", dashboard.build_snapshot(self.root))

    def test_delivery_of_a_story_branch_keeps_the_story_ticket(self):
        self.write("modules/teste/grupo/f-consultar.md", self.feature("TST-GRP-01"))
        self.commit("Base")
        base = self.git("rev-parse", "HEAD")
        self.git("checkout", "--quiet", "-b", "historia/STRY0000007")
        self.write("analise-impacto/AIM-STRY0000007.md", self.aim("STRY0000007", "rascunho", "TST-GRP-01"))
        self.commit("STRY0000007: abre a AIM")
        # A main anda depois que a história saiu: o que chegou nela não é da história.
        self.git("checkout", "--quiet", "main")
        self.write("modules/teste/grupo/f-consultar.md", self.feature("TST-GRP-01", requirements=True))
        self.commit("STRY0000008: entregue na main")
        self.git("checkout", "--quiet", "historia/STRY0000007")
        data = dashboard.build_snapshot(self.root, base="main")["delivery"]
        self.assertEqual(data["base"], base[:12])
        self.assertEqual(data["unit"], {"type": "historia", "id": "STRY0000007"})
        self.assertEqual([(item["key"], item["before"], item["after"]) for item in data["tickets"]],
                         [("STRY0000007", None, "rascunho")])
        self.assertEqual((data["features"], data["sprintAim"]), ([], None))

    def test_delivery_reads_aimm_renamed_from_aim_and_rejects_duplicates(self):
        old = "analise-impacto/AIM-STRY0000007.md"
        new = "analise-impacto/AIMM-STRY0000007.md"
        self.write(old, self.aim("STRY0000007", "em-análise"))
        self.write("analise-impacto/AIM-STRY0000008.md", self.aim("STRY0000008", "rascunho"))
        self.commit("Base")
        base = self.git("rev-parse", "HEAD")
        self.git("checkout", "--quiet", "-b", "historia/STRY0000007")
        (self.root / old).rename(self.root / new)
        self.write(new, self.aim("STRY0000007", "escopo-aprovado"))
        self.commit("STRY0000007: migra para AIMM e aprova escopo")
        data = dashboard.build_snapshot(self.root, base=base)["delivery"]
        ticket = next(item for item in data["tickets"] if item["key"] == "STRY0000007")
        self.assertEqual((ticket["path"], ticket["before"], ticket["after"]),
                         (new, "em-análise", "escopo-aprovado"))
        self.assertEqual(dashboard.aim_key(old), dashboard.aim_key(new))
        self.assertIsNone(dashboard.aim_key("analise-impacto/_TEMPLATE_AIMM.md"))
        self.assertIsNone(dashboard.aim_key(new.replace(".md", ".html")))
        self.write(old, self.aim("STRY0000007", "em-análise"))
        with self.assertRaisesRegex(ValueError, "AIMM duplicada"):
            dashboard.build_snapshot(self.root, base=base)


if __name__ == "__main__":
    unittest.main()
