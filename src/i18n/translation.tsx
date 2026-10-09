import { createContext, useCallback, useContext, useMemo } from 'react';
import type { PropsWithChildren } from 'react';

// The components under ../components/ui are imported from Floway unchanged, and
// there they read their few strings through the dashboard's i18n module at this
// same relative path. This module stands in for it: the same `useTranslation`
// shape over only the keys those components use, with Floway's English and
// Simplified Chinese text, so a sync from upstream needs no edit to them.
const en = {
  'common.on': 'On',
  'common.off': 'Off',
  'common.cancel': 'Cancel',
  'common.dismiss': 'Dismiss',
  'common.noOptions': 'No options',
  'common.noSuggestions': 'No suggestions',
  'common.discard.title': 'Discard unsaved changes?',
  'common.discard.message': 'This form has changes that have not been saved.',
  'common.discard.keep': 'Keep editing',
  'common.discard.discard': 'Discard',
  'common.copy.action': 'Copy',
  'common.copy.copied': 'Copied',
  'common.copy.failed': 'Copy failed',
} as const;

export type WinuiStringKey = keyof typeof en;
export type WinuiStrings = Record<WinuiStringKey, string>;

const zhHans: WinuiStrings = {
  'common.on': '开',
  'common.off': '关',
  'common.cancel': '取消',
  'common.dismiss': '关闭',
  'common.noOptions': '无可选项',
  'common.noSuggestions': '无建议',
  'common.discard.title': '放弃未保存的更改？',
  'common.discard.message': '该表单仍有尚未保存的修改。',
  'common.discard.keep': '继续编辑',
  'common.discard.discard': '放弃',
  'common.copy.action': '复制',
  'common.copy.copied': '已复制',
  'common.copy.failed': '复制失败',
};

export const winuiStringsByLocale = { en, 'zh-Hans': zhHans } as const satisfies Record<string, WinuiStrings>;
export type WinuiLocale = keyof typeof winuiStringsByLocale;

const StringsContext = createContext<WinuiStrings>(en);

export interface WinuiStringsProviderProps {
  /** Built-in string table to start from. Defaults to English. */
  locale?: WinuiLocale;
  /** Per-key overrides applied on top of the locale's table. */
  strings?: Partial<WinuiStrings>;
}

/** Supplies the text the components render for their own controls (Cancel, Copy, On/Off, ...). */
export function WinuiStringsProvider({ locale = 'en', strings, children }: PropsWithChildren<WinuiStringsProviderProps>) {
  const value = useMemo(() => ({ ...winuiStringsByLocale[locale], ...strings }), [locale, strings]);
  return <StringsContext.Provider value={value}>{children}</StringsContext.Provider>;
}

export const useTranslation = (): { t: (key: WinuiStringKey) => string } => {
  const strings = useContext(StringsContext);
  const t = useCallback((key: WinuiStringKey) => strings[key], [strings]);
  return { t };
};
