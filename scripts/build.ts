import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build, transform, type Plugin } from 'esbuild';
import { createGenerator } from 'unocss';

import unoConfig from '../uno.config';
import { errorShellCss } from '../src/components/ui/error-shell.css';
import { loadingCss } from '../src/components/ui/loading-screen.css';
import { gradientBackgroundCss } from '../src/shell/gradient-background.css';
import { navigationProgressCss } from '../src/shell/navigation-progress.css';

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

// Prism ships its language components as scripts that mutate a global `Prism`
// rather than as modules; Floway prepends the import that supplies the binding.
// https://github.com/Menci/Floway/blob/fee9533cc3ed5cba8028e53e53ca13d2e64d91af/apps/web/vite.config.ts#L96-L112
const prismComponentsEsm: Plugin = {
  name: 'prism-components-esm',
  setup(builder) {
    builder.onLoad({ filter: /[\\/]prismjs[\\/]components[\\/]prism-[^\\/]+\.js$/ }, args => ({
      contents: `import Prism from "prismjs";\n${readFileSync(args.path, 'utf8')}`,
      loader: 'js',
    }));
  },
};

const sourceFiles = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name);
  if (entry.isDirectory()) return sourceFiles(path);
  return /\.(?:ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.css.ts') ? [path] : [];
});

// Floway's global.css expands `@unocss;` in place through @unocss/postcss over
// the same sources and config; this does the same over the package's sources.
const unoCss = async (): Promise<string> => {
  const generator = await createGenerator(unoConfig);
  const code = sourceFiles(join(root, 'src')).map(file => readFileSync(file, 'utf8')).join('\n');
  return (await generator.generate(code, { preflights: true })).css;
};

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
  plugins: [prismComponentsEsm],
});

// Stylesheets imported from the bundled modules (OverlayScrollbars') land beside
// the bundle; they join base.css instead of shipping as a third sheet.
const bundledCss = readFileSync(join(dist, 'index.css'), 'utf8');
rmSync(join(dist, 'index.css'));
rmSync(join(dist, 'index.css.map'), { force: true });

writeFileSync(join(dist, 'winui.css'), await minifyCss(splitDarkScheme(winuiCss)));

// Floway's order: the critical sheet inlined at the head of the document, then
// global.css with the utilities expanded in place, then what components import.
// https://github.com/Menci/Floway/blob/fee9533cc3ed5cba8028e53e53ca13d2e64d91af/apps/web/src/critical.css.ts#L28-L34
const utilities = await unoCss();
const criticalCss = [baseDocumentCss, gradientBackgroundCss, loadingCss, errorShellCss, navigationProgressCss].join('\n');
const globalCss = readFileSync(join(root, 'src/base.css'), 'utf8')
  .replace(/^@unocss;$/m, () => utilities)
  .replaceAll("url('./assets/fonts/", "url('./fonts/");
writeFileSync(join(dist, 'base.css'), await minifyCss(splitDarkScheme([criticalCss, globalCss, bundledCss].join('\n'))));

mkdirSync(join(dist, 'fonts'), { recursive: true });
for (const file of readdirSync(join(root, 'src/fonts'))) {
  copyFileSync(join(root, 'src/fonts', file), join(dist, 'fonts', file));
}
