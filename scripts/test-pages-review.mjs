import assert from 'node:assert/strict';
import { test } from 'node:test';
import { changesPage, previewNav } from './lib/pages-preview.mjs';

const info = {
  branch: 'historia/STRY0013205', base: 'main', commit: '1234567890abcdef',
  mergeBase: 'abcdef1234567890', baseSource: 'fallback-main', data: '2026-10-23',
};

test('links Markdown abrem no Pages da branch; diff e arquivos removidos continuam acessíveis', () => {
  const files = [
    { path: 'global/modelo revisão.md', status: 'M', added: 1, removed: 1,
      patch: 'diff --git a/file b/file\n@@ -1 +1 @@\n-antes\n+<script>window.injected=true</script>' },
    { path: 'global/excluido.md', status: 'D', added: 0, removed: 1, patch: '@@ -1 +0 @@\n-antigo' },
  ];
  const html = changesPage([], info, files, '../../..', '.', 'test');
  assert.ok(html.includes('../index.html#global/modelo%20revis%C3%A3o.md'));
  assert.ok(!html.includes('href="../global/modelo'));
  assert.ok(!html.includes('href="../index.html#global/excluido.md"'));
  assert.ok(html.includes('href="#file-1">Ver diferença'));
  assert.ok(html.includes('&lt;script&gt;window.injected=true&lt;/script&gt;'));
  assert.ok(html.includes("location.replace('../index.html#__changes__'"));
  assert.ok(previewNav([], info, '../..').includes('href="index.html#__changes__"'));
  const docs = changesPage([], info, [{ ...files[0], path: 'docs/content/revisao.md' }], '../../..', 'docs');
  assert.ok(docs.includes('../index.html#content/revisao.md'));
});
