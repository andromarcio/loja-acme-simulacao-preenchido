import { existsSync, readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

export const IMPACT_FILE_RE = /^AIMM?-(.+)\.md$/;
export const impactKey = name => name.match(IMPACT_FILE_RE)?.[1] || null;

export function impactFiles(dir) {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter(name => IMPACT_FILE_RE.test(name)).sort();
  const seen = new Map();
  for (const name of files) {
    const key = impactKey(name).toUpperCase();
    if (seen.has(key)) throw new Error(`AIMM duplicada para ${key}: ${seen.get(key)} e ${name}. Concilie os arquivos antes de prosseguir.`);
    seen.set(key, name);
  }
  return files;
}

export function impactPath(root, key) {
  const dir = join(root, 'analise-impacto');
  const names = [`AIMM-${key}.md`, `AIM-${key}.md`].filter(name => existsSync(join(dir, name)));
  if (names.length > 1) throw new Error(`AIMM duplicada para ${key}: ${names.join(' e ')}.`);
  return `analise-impacto/${names[0] || `AIMM-${key}.md`}`;
}

export function resolveImpactFile(file) {
  const key = impactKey(basename(file));
  if (!key) return file;
  const names = [`AIMM-${key}.md`, `AIM-${key}.md`].map(name => join(dirname(file), name)).filter(existsSync);
  if (names.length > 1) throw new Error(`AIMM duplicada para ${key}.`);
  return names[0] || file;
}
