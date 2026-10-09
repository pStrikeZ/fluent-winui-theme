// tsc keeps side-effect imports in the declarations it emits. Prism's
// languages and OverlayScrollbars' stylesheet are bundled into dist/index.js,
// so a host has no copy of them to resolve, and a host that checks side-effect
// imports would fail on the bare specifier. Types never depend on them.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');

for (const entry of readdirSync(dist, { recursive: true, encoding: 'utf8' })) {
  if (!entry.endsWith('.d.ts')) continue;
  const path = join(dist, entry);
  const source = readFileSync(path, 'utf8');
  const stripped = source.replace(/^import\s+["'][^."'][^"']*["'];\n/gm, '');
  if (stripped !== source) writeFileSync(path, stripped);
}
