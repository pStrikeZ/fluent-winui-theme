// Packs the package the way npm would publish it and checks what a host would
// receive: the files, the modules the bundle and its declarations import, and
// the fonts the stylesheets point at. Run after `pnpm run build`.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';

const root = join(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const failures: string[] = [];
const fail = (message: string) => failures.push(message);

// Unpacked inside the repository, so the consumer check below resolves react
// and Fluent from this package's node_modules the way a host resolves its own.
mkdirSync(join(root, '.pack-check'), { recursive: true });
const work = mkdtempSync(join(root, '.pack-check', 'run-'));
try {
  execFileSync('pnpm', ['pack', '--pack-destination', work], { cwd: root, stdio: 'ignore' });
  const tarball = readdirSync(work).find(name => name.endsWith('.tgz'));
  if (!tarball) throw new Error('pnpm pack produced no tarball');
  execFileSync('tar', ['-xzf', tarball], { cwd: work });
  const unpacked = join(work, 'package');

  const files = execFileSync('find', ['.', '-type', 'f'], { cwd: unpacked, encoding: 'utf8' })
    .split('\n').filter(Boolean).map(path => path.replace(/^\.\//, '')).sort();

  for (const required of ['package.json', 'LICENSE', 'NOTICE.md', 'README.md', 'dist/index.js', 'dist/index.d.ts', 'dist/winui.css', 'dist/base.css']) {
    if (!files.includes(required)) fail(`missing from the tarball: ${required}`);
  }
  for (const path of files) {
    if (!/^(?:package\.json|LICENSE|NOTICE\.md|README\.md|dist\/.+)$/.test(path)) fail(`unexpected file in the tarball: ${path}`);
  }

  // Every bare import must be something the host installs alongside.
  const installed = new Set([...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.peerDependencies ?? {})]);
  const packageOf = (specifier: string) => specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]!;
  const importsOf = (source: string) => [...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g)].map(match => match[1]!);

  for (const specifier of new Set(importsOf(readFileSync(join(unpacked, 'dist/index.js'), 'utf8')))) {
    if (specifier.startsWith('.')) fail(`dist/index.js imports a relative module: ${specifier}`);
    else if (!installed.has(packageOf(specifier))) fail(`dist/index.js imports ${specifier}, which is neither a dependency nor a peer`);
  }

  // Declarations may reach only the packages a host types against.
  for (const path of files.filter(path => path.endsWith('.d.ts'))) {
    for (const specifier of importsOf(readFileSync(join(unpacked, path), 'utf8'))) {
      if (specifier.startsWith('.')) {
        const target = posix.join(posix.dirname(path), specifier).replace(/\.js$/, '');
        if (!files.includes(`${target}.d.ts`) && !files.includes(`${target}/index.d.ts`)) fail(`${path} imports ${specifier}, which is not in the tarball`);
      } else if (!['react', '@fluentui/react-components'].includes(packageOf(specifier))) {
        fail(`${path} imports ${specifier}; declarations may reference only react and @fluentui/react-components`);
      }
    }
  }

  // Relative urls in the stylesheets must land on packed files.
  for (const sheet of ['dist/base.css', 'dist/winui.css']) {
    for (const [, url] of readFileSync(join(unpacked, sheet), 'utf8').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
      if (/^(?:[a-z]+:|#|\/\/)/i.test(url!)) continue;
      const target = posix.join(posix.dirname(sheet), url!.replace(/[?#].*$/, ''));
      if (!files.includes(target)) fail(`${sheet} points at ${url}, which is not in the tarball`);
    }
  }

  // A strict host that also checks library declarations must compile against them.
  writeFileSync(join(work, 'consumer.tsx'), [
    "import '@pstrikez/fluent-winui-theme/base.css';",
    "import { AppShell, fluentComponents, useWinuiTheme } from '@pstrikez/fluent-winui-theme';",
    'export const App = () => {',
    "  const { theme } = useWinuiTheme('system');",
    '  return <fluentComponents.FluentProvider theme={theme}><AppShell labels={{ skipToContent: "s", openNavigation: "o", navigation: "n" }} navigation={() => null} pageKey="home">x</AppShell></fluentComponents.FluentProvider>;',
    '};',
    '',
  ].join('\n'));
  writeFileSync(join(work, 'css.d.ts'), "declare module '*.css';\n");
  writeFileSync(join(work, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022', lib: ['ES2023', 'DOM', 'DOM.Iterable'], module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx',
      strict: true, exactOptionalPropertyTypes: true, noUncheckedSideEffectImports: true, skipLibCheck: false, noEmit: true, types: [],
      paths: { '@pstrikez/fluent-winui-theme': ['./package/dist/index.d.ts'], '@pstrikez/fluent-winui-theme/*': ['./package/dist/*'] },
    },
    files: ['consumer.tsx', 'css.d.ts'],
  }));
  let diagnostics = '';
  try {
    execFileSync(join(root, 'node_modules/.bin/tsc'), ['-p', work, '--pretty', 'false'], { cwd: work, encoding: 'utf8' });
  } catch (error) {
    diagnostics = (error as { stdout?: string }).stdout ?? String(error);
  }
  // Fluent's own declarations do not survive exactOptionalPropertyTypes; that
  // is every Fluent host's problem, so only this package and the consumer count.
  const ours = diagnostics.split(/\n(?=\S)/).filter(entry => /^(?:consumer\.tsx|css\.d\.ts|package\/)/.test(entry));
  if (ours.length > 0) fail(`a strict consumer does not compile against the declarations:\n${ours.join('\n')}`);

  if (failures.length > 0) {
    console.error(failures.map(message => `- ${message}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`${tarball}: ${files.length} files, imports and font urls resolve`);
  }
} finally {
  rmSync(join(root, '.pack-check'), { recursive: true, force: true });
}
