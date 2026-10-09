import type { Theme } from '@fluentui/react-components';
import { useEffect, useSyncExternalStore } from 'react';

import { winuiDarkTheme, winuiLightTheme } from './winui/theme';

// Floway follows the system colour scheme and nothing else. The stylesheets in
// this package keep that default and add an explicit override: the build turns
// every `prefers-color-scheme: dark` block into one that yields to
// `data-fwt-theme="light"` on the document element, plus a copy that applies
// under `data-fwt-theme="dark"` whatever the system says. See
// scripts/color-scheme.ts.
export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedThemeMode = 'light' | 'dark';

export const THEME_MODE_ATTRIBUTE = 'data-fwt-theme';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

const subscribeToSystemScheme = (onChange: () => void) => {
  const query = window.matchMedia(DARK_SCHEME_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const systemPrefersDark = () => window.matchMedia(DARK_SCHEME_QUERY).matches;

/** The scheme the stylesheets resolve to for a mode, given the system preference. */
export const resolveThemeMode = (mode: ThemeMode, prefersDark: boolean): ResolvedThemeMode =>
  mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;

/** Stamps `mode` on `root` so the stylesheets follow it; `system` removes the override. */
export const applyThemeMode = (mode: ThemeMode, root: HTMLElement = document.documentElement): void => {
  if (mode === 'system') root.removeAttribute(THEME_MODE_ATTRIBUTE);
  else root.setAttribute(THEME_MODE_ATTRIBUTE, mode);
};

/**
 * Applies `mode` to the document and returns the matching Fluent theme for
 * `FluentProvider`. The token stylesheet and the Fluent theme must agree, so the
 * provider's theme is derived from the same resolved scheme the CSS uses.
 */
export const useWinuiTheme = (mode: ThemeMode = 'system'): { theme: Theme; resolved: ResolvedThemeMode } => {
  const prefersDark = useSyncExternalStore(subscribeToSystemScheme, systemPrefersDark, () => false);
  useEffect(() => applyThemeMode(mode), [mode]);
  const resolved = resolveThemeMode(mode, prefersDark);
  return { theme: resolved === 'dark' ? winuiDarkTheme : winuiLightTheme, resolved };
};
