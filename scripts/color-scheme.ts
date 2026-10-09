import postcss, { type AtRule, type Container, type Rule } from 'postcss';

// The source stylesheets keep Floway's convention, so a sync from upstream
// carries no edits here: every dark-scheme value lives in a top-level
// `@media (prefers-color-scheme: dark)` block. A host that lets its user pick a
// scheme needs those values reachable without the query, and on demand
// unreachable with it, so each block is rewritten into two:
//
//   - the original query, its selectors scoped to a document that has not
//     forced the light scheme; and
//   - an unconditional copy scoped to a document that has forced the dark one.
//
// A document with no `data-fwt-theme` attribute therefore renders exactly as
// Floway does.
const ATTRIBUTE = 'data-fwt-theme';
const followsSystem = `:root:not([${ATTRIBUTE}='light'])`;
const forcedDark = `:root[${ATTRIBUTE}='dark']`;

const DARK_QUERY = /^\(\s*prefers-color-scheme\s*:\s*dark\s*\)$/;

// `:root` and `html` name the element the attribute sits on, so they take the
// scope as a compound; anything else is a descendant of it.
const scopeSelector = (selector: string, scope: string): string => {
  const trimmed = selector.trim();
  const root = /^(?::root|html)(?=$|[\s.:[>+~#])/.exec(trimmed);
  if (root) return `${scope}${trimmed.slice(root[0].length)}`;
  return `${scope} ${trimmed}`;
};

const scopeRules = (container: Container, scope: string) => {
  container.walk(node => {
    if (node.type === 'atrule' && /keyframes$/i.test((node as AtRule).name)) {
      throw new Error('color-scheme: @keyframes inside a dark-scheme block is not supported');
    }
    if (node.type !== 'rule') return;
    const rule = node as Rule;
    if (rule.parent?.type === 'atrule' && /keyframes$/i.test((rule.parent as AtRule).name)) return;
    rule.selectors = rule.selectors.map(selector => scopeSelector(selector, scope));
  });
};

export const splitDarkScheme = (css: string): string => {
  const root = postcss.parse(css);
  let blocks = 0;
  root.walkAtRules('media', media => {
    if (!DARK_QUERY.test(media.params.trim())) {
      if (/prefers-color-scheme/.test(media.params)) {
        throw new Error(`color-scheme: unsupported query "${media.params}"`);
      }
      return;
    }
    if (media.parent?.type !== 'root') {
      throw new Error('color-scheme: a nested dark-scheme block is not supported');
    }
    blocks += 1;
    const forced = media.clone();
    scopeRules(media, followsSystem);
    scopeRules(forced, forcedDark);
    media.after(forced.nodes ?? []);
  });
  if (blocks === 0) return css;
  return root.toString();
};
