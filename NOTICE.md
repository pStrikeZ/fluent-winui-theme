# Notices

## Floway

This package is extracted from the dashboard of [Floway](https://github.com/Menci/Floway)
(`apps/web`), Copyright (c) 2025 Menci, distributed under the MIT License.
The full license text is in [LICENSE](./LICENSE). [UPSTREAM.md](./UPSTREAM.md)
records the exact revision and the paths it was taken from.

## WinUI and Fluent UI

Values and behaviours in `src/winui/` are transcribed from
[microsoft/microsoft-ui-xaml](https://github.com/microsoft/microsoft-ui-xaml)
(MIT License, Copyright (c) Microsoft Corporation) and restyle
[microsoft/fluentui](https://github.com/microsoft/fluentui) (MIT License,
Copyright (c) Microsoft Corporation). Each transcribed value carries a permalink
to its source beside it. No Microsoft source file is redistributed.

"WinUI" and "Fluent" are trademarks of Microsoft Corporation. This package is not
affiliated with or endorsed by Microsoft.

## Bundled libraries

`dist/index.js` bundles:

- [Prism](https://github.com/PrismJS/prism) (MIT License, Copyright (c) 2012 Lea Verou),
  for syntax highlighting in `CodeBlock`;
- [OverlayScrollbars](https://github.com/KingSora/OverlayScrollbars) 2.13.0
  (MIT License, Copyright (c) Rene Haas | KingSora), **modified** by Floway's patch in
  `patches/overlayscrollbars@2.13.0.patch`, for `ScrollArea`.

## Meslo LG

`dist/fonts/meslo-lg-s-*.woff2` are **modified** versions of the Meslo LG S
v1.2.1 faces from [andreberg/Meslo-Font](https://github.com/andreberg/Meslo-Font),
distributed under the Apache License 2.0. Floway generated them by widening each
face's advance from 1233 to 1264 units and centring the glyphs in the added
space; the rationale is in `src/base.css`. The license text ships beside the
fonts as `dist/fonts/LICENSE-Meslo-LG.txt`.

## Segoe UI Variable

Segoe UI Variable is **not** included. `base.css` declares it with `@font-face`
sources on Microsoft's own hosts (docs.azure.cn and learn.microsoft.com), the
same files Microsoft Learn serves, so the browser fetches it from Microsoft at
runtime. Its use is governed by Microsoft's terms.
