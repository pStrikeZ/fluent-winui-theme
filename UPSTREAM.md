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
| `src/assets/fonts/` | `src/fonts/` |
| `__tests__/winui/`, `__tests__/{render.tsx,setup.ts,match-media-stub.ts}` | `tests/` |

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

## Syncing

1. In a Floway checkout, list what changed since the base revision:
   `git diff <base>..<new> -- apps/web/src/winui apps/web/src/global.css ...`
   (every Floway path in the table above).
2. Apply the diff here, then re-apply adaptation 1 with
   `grep -rn floway src tests` returning nothing.
3. `pnpm run typecheck && pnpm test && pnpm run build`, then compare the demo
   with Floway in both schemes.
4. Update the base revision above.
