import { describe, expect, it } from 'vitest';

import { splitDarkScheme } from '../scripts/color-scheme';

const normalize = (css: string) => css.replace(/\s+/g, ' ').trim();

describe('splitDarkScheme', () => {
  it('keeps the system query behind a light override and adds a forced-dark copy', () => {
    const out = splitDarkScheme(`
:root { --a: white; }
@media (prefers-color-scheme: dark) {
  :root { --a: black; }
  .fui-List .item, html.x { color: red; }
}
`);
    expect(normalize(out)).toBe(normalize(`
:root { --a: white; }
@media (prefers-color-scheme: dark) {
  :root:not([data-fwt-theme='light']) { --a: black; }
  :root:not([data-fwt-theme='light']) .fui-List .item, :root:not([data-fwt-theme='light']).x { color: red; }
}
:root[data-fwt-theme='dark'] { --a: black; }
:root[data-fwt-theme='dark'] .fui-List .item, :root[data-fwt-theme='dark'].x { color: red; }
`));
  });

  it('leaves stylesheets without a dark-scheme block untouched', () => {
    const css = '@media (max-width: 680px) { :root { --b: 1px; } }';
    expect(splitDarkScheme(css)).toBe(css);
  });

  it('rejects queries it cannot rewrite faithfully', () => {
    expect(() => splitDarkScheme('@media (prefers-color-scheme: light) { a { color: red; } }')).toThrow();
    expect(() => splitDarkScheme('@supports (color: red) { @media (prefers-color-scheme: dark) { a { color: red; } } }')).toThrow();
  });
});
