# @pstrikez/fluent-winui-theme

WinUI 3 appearance for [Fluent UI React v9](https://react.fluentui.dev/), extracted from the
dashboard of [Floway](https://github.com/Menci/Floway).

The package has two parts. The first restyles Fluent's own components:

- **Stylesheet:** a CSS layer that re-points Fluent's tokens at WinUI 3 values and
  restyles each control's geometry, fills, strokes, focus visuals and motion.
- **Wrapped components:** a wrapped Fluent namespace that stamps WinUI appearances,
  substitutes WinUI motion, replaces the toaster and adds the Switch drag gesture.
- **Themes:** light and dark Fluent themes with the WinUI type ramp, radii and
  elevation.

The second is the rest of what Floway's dashboard is built from, so a host can
reproduce that dashboard without Floway's source:

- **Components:** settings cards, dialogs, resource lists, reorderable lists,
  badges, code blocks, empty and error states, an OverlayScrollbars scroll area
  and more.
- **Application shell:** `AppShell`, `NavigationPane`, the page transition, the
  gradient backdrop and the navigation progress bar.

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

### A dashboard like Floway's

```tsx
import { AppShell, GradientBackground, NavigationPane, WinuiRouterProvider } from '@pstrikez/fluent-winui-theme';

<FluentProvider theme={theme}>
  <GradientBackground>
    <WinuiRouterProvider router={{ navigate }}>
      <AppShell
        labels={{ skipToContent: 'Skip to content', openNavigation: 'Open navigation', navigation: 'Navigation' }}
        narrowHeader={<Logo />}
        navigation={({ onNavigate }) => <NavigationPane
          label="Navigation"
          header={<Logo />}
          groups={[{ items: [{ value: '/', label: 'Home', href: '/', icon: <HomeRegular /> }] }]}
          onNavigate={onNavigate}
          selectedValue={pathname}
        />}
        pageKey={pathname}
      >
        <Page />
      </AppShell>
    </WinuiRouterProvider>
  </GradientBackground>
</FluentProvider>
```

- **`pageKey`** names the current page. When it changes, the WinUI page
  transition plays. Keep it stable while only the page's query string changes.
- **`WinuiRouterProvider`** connects in-app links to your router. Pass
  react-router's `useNavigate()` result, or any `(to) => void`. Without the
  provider, links are plain anchors that the browser follows.
- **`WinuiStringsProvider locale="zh-Hans"`** switches the components' own
  text, such as Cancel, Copy and On/Off, to Simplified Chinese. Pass `strings`
  to override individual entries.

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

`demo/` is a gallery of every component inside the shell. Build the package
first, then run `pnpm run demo:build` and `pnpm run demo:preview`. The query
parameters `?mode=light|dark|system`, `?page=` and `?locale=en|zh-Hans` pick the
initial state.

[UPSTREAM.md](./UPSTREAM.md) records the Floway revision this package follows
and how to sync from it.

## License

MIT. See [LICENSE](./LICENSE) and [NOTICE.md](./NOTICE.md) for the Floway,
Microsoft and Meslo LG notices.
