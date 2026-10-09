import {
  AppShell,
  fluentComponents,
  GradientBackground,
  NavigationPane,
  NavigationProgress,
  useWinuiTheme,
  WinuiStringsProvider,
} from '@pstrikez/fluent-winui-theme';
import type { NavigationPaneGroup, ThemeMode, WinuiLocale } from '@pstrikez/fluent-winui-theme';
import {
  AppsListDetailRegular,
  ArrowRouting20Regular,
  BoardRegular,
  DataTrendingRegular,
  KeyRegular,
  LocalLanguageRegular,
  OptionsRegular,
  PaintBrushRegular,
  SettingsRegular,
  SlideSettingsRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular,
  WindowDevToolsRegular,
} from '@fluentui/react-icons';
import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { isLocale, LocaleContext, useDemoText } from './i18n';
import { ContentPage } from './pages/content';
import { ControlsPage } from './pages/controls';
import { KeysPage } from './pages/keys';
import { OverviewPage } from './pages/overview';
import { RoutingPage } from './pages/routing';
import { SettingsPage } from './pages/settings';
import { StatesPage } from './pages/states';
import { DemoRouter, initialQuery, pathOf, useDemoRouter } from './router';
import type { PageId } from './router';

const { FluentProvider, Button, Menu, MenuItemRadio, MenuList, MenuPopover, MenuTrigger, Text, Tooltip } = fluentComponents;

const isMode = (value: string | null): value is ThemeMode => value === 'system' || value === 'light' || value === 'dark';

function Logo() {
  return (
    <span style={{ alignItems: 'center', display: 'inline-flex', gap: 10 }}>
      <svg aria-hidden height="24" viewBox="0 0 24 24" width="24">
        <rect fill="var(--colorBrandBackground)" height="24" rx="6" width="24" />
        <path d="M6 16 11 8l3 5 2-3 2 6z" fill="#fff" />
      </svg>
      <Text size={400} weight="semibold">Floway demo</Text>
    </span>
  );
}

function ViewMenu({ locale, mode, onLocale, onMode }: {
  locale: WinuiLocale;
  mode: ThemeMode;
  onLocale: (locale: WinuiLocale) => void;
  onMode: (mode: ThemeMode) => void;
}) {
  const t = useDemoText();
  return (
    <Menu
      checkedValues={{ theme: [mode], language: [locale] }}
      onCheckedValueChange={(_, data) => {
        const value = data.checkedItems[0];
        if (data.name === 'theme' && value !== undefined && isMode(value)) onMode(value);
        if (data.name === 'language' && value !== undefined && isLocale(value)) onLocale(value);
      }}
    >
      <Tooltip content={t('view')} relationship="label">
        <MenuTrigger disableButtonEnhancement>
          <Button appearance="subtle" aria-label={t('view')} icon={mode === 'dark' ? <WeatherMoonRegular /> : mode === 'light' ? <WeatherSunnyRegular /> : <OptionsRegular />} />
        </MenuTrigger>
      </Tooltip>
      <MenuPopover>
        <MenuList>
          <div style={{ color: 'var(--colorNeutralForeground3)', fontSize: 12, padding: '4px 12px' }}>{t('theme')}</div>
          <MenuItemRadio icon={<SettingsRegular />} name="theme" value="system">{t('system')}</MenuItemRadio>
          <MenuItemRadio icon={<WeatherSunnyRegular />} name="theme" value="light">{t('light')}</MenuItemRadio>
          <MenuItemRadio icon={<WeatherMoonRegular />} name="theme" value="dark">{t('dark')}</MenuItemRadio>
          <div style={{ color: 'var(--colorNeutralForeground3)', fontSize: 12, padding: '4px 12px' }}>{t('language')}</div>
          <MenuItemRadio icon={<LocalLanguageRegular />} name="language" value="en">English</MenuItemRadio>
          <MenuItemRadio icon={<LocalLanguageRegular />} name="language" value="zh-Hans">简体中文</MenuItemRadio>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}

const PAGES: Record<PageId, () => ReactNode> = {
  overview: () => <OverviewPage />,
  keys: () => <KeysPage />,
  routing: () => <RoutingPage />,
  settings: () => <SettingsPage />,
  content: () => <ContentPage />,
  controls: () => <ControlsPage />,
  states: () => <StatesPage />,
};

function Dashboard({ mode, locale, onMode, onLocale }: {
  mode: ThemeMode;
  locale: WinuiLocale;
  onMode: (mode: ThemeMode) => void;
  onLocale: (locale: WinuiLocale) => void;
}) {
  const t = useDemoText();
  const { page, pending } = useDemoRouter();
  const item = (value: PageId, icon: ReactElement) => ({ value, label: t(`page.${value}`), icon, href: pathOf(value) });
  const groups: NavigationPaneGroup[] = [
    { items: [item('overview', <DataTrendingRegular />)] },
    { label: t('group.manage'), items: [item('keys', <KeyRegular />), item('routing', <ArrowRouting20Regular />), item('settings', <SlideSettingsRegular />)] },
    { label: t('group.library'), items: [item('content', <BoardRegular />), item('controls', <AppsListDetailRegular />), item('states', <WindowDevToolsRegular />)] },
  ];
  const viewMenu = <ViewMenu locale={locale} mode={mode} onLocale={onLocale} onMode={onMode} />;
  return (
    <>
      <NavigationProgress active={pending} />
      <AppShell
        labels={{ navigation: t('navigation'), openNavigation: t('openNavigation'), skipToContent: t('skip') }}
        narrowHeader={<Logo />}
        narrowHeaderActions={viewMenu}
        navigation={({ onNavigate }) => (
          <NavigationPane
            closeLabel={t('closeNavigation')}
            footerItems={[{ value: 'theme', label: t('theme'), icon: <PaintBrushRegular />, onSelect: () => onMode(mode === 'dark' ? 'light' : 'dark') }]}
            groups={groups}
            header={<Logo />}
            headerActions={viewMenu}
            label={t('navigation')}
            onNavigate={onNavigate}
            selectedValue={page}
          />
        )}
        pageKey={page}
      >
        {PAGES[page]()}
      </AppShell>
    </>
  );
}

export function App() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const requested = initialQuery().mode;
    return isMode(requested) ? requested : 'system';
  });
  const [locale, setLocale] = useState<WinuiLocale>(() => {
    const requested = initialQuery().locale;
    return isLocale(requested) ? requested : 'en';
  });
  const { theme } = useWinuiTheme(mode);
  return (
    <FluentProvider theme={theme}>
      <GradientBackground>
        <LocaleContext.Provider value={locale}>
          <WinuiStringsProvider locale={locale}>
            <DemoRouter>
              <Dashboard locale={locale} mode={mode} onLocale={setLocale} onMode={setMode} />
            </DemoRouter>
          </WinuiStringsProvider>
        </LocaleContext.Provider>
      </GradientBackground>
    </FluentProvider>
  );
}
