import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Griffel injects its rules at runtime, past scripts/color-scheme.ts, so a
// `prefers-color-scheme` key in a makeStyles object never yields to
// `data-fwt-theme`. Scheme choices belong in the static stylesheets instead.
const GRIFFEL_SCHEME_QUERY = /['"`]@media[^'"`]*prefers-color-scheme/;

const sources = (dir: string): string[] => readdirSync(dir, { recursive: true, encoding: 'utf8' })
  .filter(path => /\.tsx?$/.test(path))
  .map(path => join(dir, path));

describe('scheme media queries', () => {
  it('stay out of Griffel styles', () => {
    const offenders = sources(join(import.meta.dirname, '..', 'src'))
      .filter(path => GRIFFEL_SCHEME_QUERY.test(readFileSync(path, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
