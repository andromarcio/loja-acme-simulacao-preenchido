from pathlib import Path
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest


class DashboardGuardTests(unittest.TestCase):
    def check_suite(self, content, expected):
        with TemporaryDirectory(prefix="dashboard-guard-") as temporary:
            root = Path(temporary)
            runner = root / "verifica-dashboard.py"
            shutil.copyfile(Path(__file__).with_name(runner.name), runner)
            if content is not None:
                (root / "test_dashboard.py").write_text(content, encoding="utf-8")
            result = subprocess.run([sys.executable, str(runner)], capture_output=True, text=True, encoding="utf-8")
            self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
            return result.stdout + result.stderr

    def test_missing_file_blocks_publication(self):
        self.assertIn("ausente", self.check_suite(None, 1))

    def test_empty_suite_blocks_publication(self):
        self.assertIn("nenhum teste", self.check_suite("import unittest\n", 1))

    def test_failing_test_blocks_publication(self):
        self.assertIn("FAILED", self.check_suite(
            'import unittest\nclass TestDashboard(unittest.TestCase):\n'
            ' def test_bad(self): self.fail("controle negativo")\n', 1))

    def test_valid_suite_passes(self):
        self.assertIn("OK", self.check_suite(
            'import unittest\nclass TestDashboard(unittest.TestCase):\n'
            ' def test_ok(self): self.assertTrue(True)\n', 0))


if __name__ == "__main__":
    unittest.main()
