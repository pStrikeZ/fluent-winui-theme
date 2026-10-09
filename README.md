# @pstrikez/fluent-winui-theme

WinUI 3 appearance for [Fluent UI React v9](https://react.fluentui.dev/), extracted from the
dashboard of [Floway](https://github.com/Menci/Floway).

The package restyles Fluent's own components rather than shipping new ones. It
includes:

- **Stylesheet:** a CSS layer that re-points Fluent's tokens at WinUI 3 values and
  restyles each control's geometry, fills, strokes, focus visuals and motion.
- **Wrapped components:** a wrapped Fluent namespace that stamps WinUI appearances,
  substitutes WinUI motion, replaces the toaster and adds the Switch drag gesture.
- **Themes:** light and dark Fluent themes with the WinUI type ramp, radii and
  elevation.

> Status: early. The API is unstable before 1.0.

## Install

```sh
npm install @pstrikez/fluent-winui-theme @fluentui/react-components @fluentui/react-toast @fluentui/react-icons react react-dom
```

The peer range of `@fluentui/react-components` is deliberately narrow. The
stylesheet addresses Fluent's DOM and class names, and these can change in a
minor release. Upgrade Fluent together with this package.

## Use

```tsx
import '@pstrikez/fluent-winui-theme/base.css';
import '@pstrikez/fluent-winui-theme/winui.css';

import { fluentComponents, useWinuiTheme } from '@pstrikez/fluent-winui-theme';

const { FluentProvider, Button, Switch } = fluentComponents;

export function App() {
  const { theme } = useWinuiTheme('system'); // or 'light' / 'dark'
  return (
    <FluentProvider theme={theme}>
      <Button appearance="primary">Save</Button>
      <Switch label="Notifications" />
    </FluentProvider>
  );
}
```

- **Render components from `fluentComponents`**, not straight from
  `@fluentui/react-components`. The WinUI behaviour only reaches components that
  come from the wrapped namespace.
- **Load the stylesheets in this order:** `base.css` first, then your own
  utilities, then your own rules, then `winui.css`. Griffel injects its styles
  last at runtime.
- **`base.css`** declares the fonts, the monospace ramp and the document rules.
  Segoe UI Variable loads from Microsoft's hosts. The bundled Meslo LG S faces
  load from the package.

### Colour scheme

Without any configuration, the stylesheets follow `prefers-color-scheme`, as
Floway does. To force a scheme, set `data-fwt-theme="light"` or `"dark"` on
`<html>`. `useWinuiTheme(mode)` and `applyThemeMode(mode)` do this for you, and
`useWinuiTheme` also returns the Fluent theme that matches the resolved scheme.
Always pass that theme to `FluentProvider`. The token stylesheet and the
Fluent theme have to agree on the scheme.

### Server rendering

Keep the Fluent family out of SSR externalization so the server sees Fluent's
ESM entrypoints. In Vite, that is:

```ts
ssr: { noExternal: [/^@fluentui\//, /^@griffel\//, /^tabster(?:$|\/)/, /^@pstrikez\/fluent-winui-theme$/] }
```

## Development

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
```

[UPSTREAM.md](./UPSTREAM.md) records the Floway revision this package follows
and how to sync from it.

## License

MIT. See [LICENSE](./LICENSE) and [NOTICE.md](./NOTICE.md) for the Floway,
Microsoft and Meslo LG notices.
