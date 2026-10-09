import { baseFontStack } from './font-stacks';

// The document-level rules of Floway's critical stylesheet, without the
// full-viewport application layout (`html, body { height: 100%; overflow:
// hidden }`), which belongs to a host rather than to the appearance.
// https://github.com/Menci/Floway/blob/fee9533cc3ed5cba8028e53e53ca13d2e64d91af/apps/web/src/critical.css.ts#L19-L26
//
// Fluent scopes its tokens to the FluentProvider element, so `<body>` sees no
// `--fontFamilyBase` unless it is published at the document root. The colour
// scheme is declared on the same condition the token stylesheet switches on.
export const baseDocumentCss = `
body { margin: 0; }
@media (prefers-color-scheme: dark) { html { color-scheme: dark; } }
*, *::before, *::after { box-sizing: border-box; }
:root { --fontFamilyBase: ${baseFontStack}; }
body { font-family: var(--fontFamilyBase); }
`;
