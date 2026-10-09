import { createContext, useContext } from 'react';
import type { WinuiLocale } from '@pstrikez/fluent-winui-theme';

// The demo's own labels; the package's components take theirs from WinuiStringsProvider.
const text = {
  en: {
    app: 'Fluent WinUI demo',
    navigation: 'Main navigation',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    skip: 'Skip to content',
    view: 'View options',
    theme: 'Theme',
    language: 'Language',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    'group.monitor': 'Monitor',
    'group.manage': 'Manage',
    'group.library': 'Component library',
    'page.overview': 'Overview',
    'page.keys': 'API keys',
    'page.routing': 'Routing',
    'page.settings': 'Settings',
    'page.content': 'Content',
    'page.controls': 'Controls',
    'page.states': 'States',
  },
  'zh-Hans': {
    app: 'Fluent WinUI 演示',
    navigation: '主导航',
    openNavigation: '打开导航',
    closeNavigation: '关闭导航',
    skip: '跳到内容',
    view: '视图选项',
    theme: '主题',
    language: '语言',
    system: '跟随系统',
    light: '浅色',
    dark: '深色',
    'group.monitor': '监控',
    'group.manage': '管理',
    'group.library': '组件库',
    'page.overview': '概览',
    'page.keys': 'API 密钥',
    'page.routing': '路由',
    'page.settings': '设置',
    'page.content': '内容',
    'page.controls': '控件',
    'page.states': '状态',
  },
} as const;

export type DemoTextKey = keyof (typeof text)['en'];

export const LocaleContext = createContext<WinuiLocale>('en');
export const useDemoText = () => {
  const locale = useContext(LocaleContext);
  return (key: DemoTextKey): string => text[locale][key];
};
export const isLocale = (value: string | null): value is WinuiLocale => value === 'en' || value === 'zh-Hans';
