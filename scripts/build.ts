import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build, transform } from 'esbuild';

import { baseDocumentCss } from '../src/document.css';
import { winuiCss } from '../src/winui/index';

import { splitDarkScheme } from './color-scheme';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

// Floway ships its CSS through esbuild at a Chrome 61 target so colour
// serializes as legacy rgba() rather than alpha hex; the same policy applies to
// every stylesheet this package emits.
// https://github.com/Menci/Floway/blob/fee9533cc3ed5cba8028e53e53ca13d2e64d91af/apps/web/vite.config.ts#L142-L150
const minifyCss = async (css: string): Promise<string> =>
  (await transform(css, { loader: 'css', minify: true, target: 'chrome61' })).code;

const external = [...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.peerDependencies ?? {})]
  .flatMap(name => [name, `${name}/*`]);

mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [join(root, 'src/index.ts')],
  outfile: join(dist, 'index.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  external,
  sourcemap: true,
  legalComments: 'inline',
});

writeFileSync(join(dist, 'winui.css'), await minifyCss(splitDarkScheme(winuiCss)));

const baseSource = readFileSync(join(root, 'src/base.css'), 'utf8')
  .replace(/^@unocss;\n/m, '')
  .replaceAll("url('./assets/fonts/", "url('./fonts/");
writeFileSync(join(dist, 'base.css'), await minifyCss(splitDarkScheme(`${baseDocumentCss}\n${baseSource}`)));

mkdirSync(join(dist, 'fonts'), { recursive: true });
for (const file of readdirSync(join(root, 'src/fonts'))) {
  copyFileSync(join(root, 'src/fonts', file), join(dist, 'fonts', file));
}
