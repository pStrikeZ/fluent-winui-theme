# Upstream

The source is extracted from [Menci/Floway](https://github.com/Menci/Floway).

- **Base revision:** `fee9533cc3ed5cba8028e53e53ca13d2e64d91af`
- **Import commit:** the first commit of this repository, which copies the
  files below verbatim.

| Floway path (`apps/web/`) | Here |
|---|---|
| `src/winui/` | `src/winui/` |
| `src/fluent.ts`, `src/theme.ts`, `src/font-stacks.ts` | `src/` |
| `src/global.css` | `src/base.css` |
| `src/critical.css.ts` (document rules only) | `src/document.css.ts` |
| `src/lib/legacy-css-color.ts`, `color.ts`, `reduced-motion.ts` | `src/lib/` |
| `src/components/sidebar/nav-selection-indicator.tsx` | `src/components/` |
| `src/components/ui/` (generic components; see below) | `src/components/ui/` |
| `src/lib/use-media-query.ts` | `src/lib/` |
| `src/components/gradient-background{.css.ts,.tsx}`, `navigation-progress{.css.ts,.tsx}` | `src/shell/` |
| `uno.config.ts` | `uno.config.ts` |
| `patches/overlayscrollbars@2.13.0.patch` (repository root) | `patches/` |
| `src/assets/fonts/` | `src/fonts/` |
| `__tests__/winui/`, `__tests__/{render.tsx,setup.ts,settle.ts,match-media-stub.ts}` | `tests/` |
| `__tests__/components/ui/` (suites of the components taken) | `tests/components/ui/` |

From `src/components/ui/`, these are **not** taken: `body-editor.tsx` and
`monaco-workers.ts` (Monaco), `markdown.tsx` (react-markdown), `route-menu-item.tsx`,
`use-refresh.ts` and `use-poll-while-visible.ts` (data hooks).

## Local adaptations

Keep these as small as possible so a sync stays mechanical.

1. The `floway-` prefix of classes, custom properties and keyframes is `fwt-`.
   `flowayLightTheme` / `flowayDarkTheme` in `src/theme.ts` are
   `baseLightTheme` / `baseDarkTheme`.
2. Dark-scheme blocks stay as written upstream. `scripts/color-scheme.ts`
   rewrites them at build time so `data-fwt-theme` can force either scheme;
   `src/theme-mode.ts` is the matching runtime API.
3. `scripts/build.ts` replaces Floway's Vite virtual stylesheets: it evaluates
   `winuiCss`, strips `@unocss;` from `base.css`, and minifies both with esbuild
   at Floway's `chrome61` CSS target.
4. Comments that pointed at Floway files which do not exist here were
   reworded; comments that describe Floway's dashboard as context were kept.
5. `tests/setup.ts` drops the dashboard's i18n import.
6. `src/i18n/translation.tsx` stands in for Floway's i18n module at the same
   relative path: the same `useTranslation` shape over only the keys the
   components use, with Floway's `en` and `zh-Hans` text. When a synced
   component reads a new key, add it there.
7. `src/components/ui/route-link.tsx` replaces Floway's react-router binding
   with `WinuiRouterProvider`; `useRouteAddress` keeps its signature.
8. `src/components/ui/fluent-form-controls.tsx` annotates its five
   `forwardRef` exports with Fluent's public prop types so the declarations
   stay portable (TS2742). Runtime is unchanged.
9. The build bundles Prism (with Floway's ESM shim) and OverlayScrollbars
   (with Floway's patch, via `pnpm-workspace.yaml`) into `dist/index.js`, and
   expands UnoCSS at `@unocss;` in `base.css` as Floway's PostCSS step does.
10. `components/ui/badge-hue.ts` and `components/ui/settings-card.tsx` state
    their dark-scheme choice in `src/base.css` (`.fwt-badge-hue`,
    `--fwt-elevation-edge-top`/`-bottom`) instead of a Griffel
    `@media (prefers-color-scheme: dark)` key, which is injected at runtime and
    so never yields to `data-fwt-theme`. `tests/scheme-media-queries_test.ts`
    keeps new Griffel scheme queries out.

## Rewritten from Floway

These are not copies, so a sync compares them with their source by reading,
not by diff:

| Here | Rewritten from (`apps/web/`) |
|---|---|
| `src/shell/app-shell.tsx` | `src/routes/dashboard.tsx` (layout only) |
| `src/shell/navigation-pane.tsx` | `src/components/sidebar/nav.tsx` (pane only; pages and sign-out become props) |
| `src/shell/page-frames.tsx` | `src/components/page-frames.tsx` (keyed by `pageKey` instead of the router) |
| `src/shell/navigation-progress.tsx` | `src/components/navigation-progress.tsx` (`active` prop instead of `useNavigation`) |

## Syncing

1. In a Floway checkout, list what changed since the base revision:
   `git diff <base>..<new> -- apps/web/src/winui apps/web/src/global.css ...`
   (every Floway path in the table above).
2. Apply the diff here, then re-apply adaptation 1 with
   `grep -rn floway src tests` returning nothing.
3. `pnpm run typecheck && pnpm test && pnpm run build`, then compare the demo
   with Floway in both schemes.
4. Update the base revision above.
