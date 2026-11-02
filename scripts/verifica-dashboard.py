"""Executa a regressão do dashboard e recusa descoberta sem testes."""

from pathlib import Path
import sys
import unittest


def main():
    scripts = Path(__file__).resolve().parent
    if not (scripts / "test_dashboard.py").is_file():
        print("ERRO: scripts/test_dashboard.py ausente; a publicação exige os testes do dashboard.", file=sys.stderr)
        return 1
    suite = unittest.defaultTestLoader.discover(str(scripts), pattern="test_dashboard.py")
    if suite.countTestCases() == 0:
        print("ERRO: nenhum teste do dashboard foi encontrado; a publicação foi bloqueada.", file=sys.stderr)
        return 1
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(main())
