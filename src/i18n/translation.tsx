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
  'numberBox.increment': 'Increase value',
  'numberBox.decrement': 'Decrease value',
  'fileDropZone.browse': 'Browse files',
  'fileDropZone.dropHint': 'Drop files here',
  'fileDropZone.remove': 'Remove file',
  'pager.label': 'Pagination',
  'pager.first': 'First page',
  'pager.previous': 'Previous page',
  'pager.next': 'Next page',
  'pager.last': 'Last page',
  'pager.page': 'Page {n}',
  'pager.pageSize': 'Items per page',
  'pager.perPage': '{n} / page',
  'pager.total': 'Total {n} items',
  'dataTable.empty': 'No data',
  'dataTable.loading': 'Loading',
  'dataTable.selectAll': 'Select all rows',
  'dataTable.selectRow': 'Select row',
  'dataTable.expandRow': 'Expand row',
  'dataTable.collapseRow': 'Collapse row',
  'tabView.close': 'Close tab',
  'tabView.scrollBackward': 'Scroll tabs left',
  'tabView.scrollForward': 'Scroll tabs right',
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
  'numberBox.increment': '增大',
  'numberBox.decrement': '减小',
  'fileDropZone.browse': '浏览文件',
  'fileDropZone.dropHint': '将文件拖放到此处',
  'fileDropZone.remove': '移除文件',
  'pager.label': '分页',
  'pager.first': '第一页',
  'pager.previous': '上一页',
  'pager.next': '下一页',
  'pager.last': '最后一页',
  'pager.page': '第 {n} 页',
  'pager.pageSize': '每页条数',
  'pager.perPage': '{n} 条/页',
  'pager.total': '共 {n} 条',
  'dataTable.empty': '暂无数据',
  'dataTable.loading': '加载中',
  'dataTable.selectAll': '选择全部行',
  'dataTable.selectRow': '选择此行',
  'dataTable.expandRow': '展开此行',
  'dataTable.collapseRow': '收起此行',
  'tabView.close': '关闭标签页',
  'tabView.scrollBackward': '向左滚动标签页',
  'tabView.scrollForward': '向右滚动标签页',
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
