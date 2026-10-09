import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { WinuiRouterProvider } from '@pstrikez/fluent-winui-theme';

export type PageId = 'overview' | 'keys' | 'routing' | 'settings' | 'content' | 'controls' | 'states';
export const PAGE_IDS: PageId[] = ['overview', 'keys', 'routing', 'settings', 'content', 'controls', 'states'];

const isPage = (value: string | null): value is PageId => PAGE_IDS.includes(value as PageId);
const pathOf = (page: PageId) => `/${page}`;
const pageOf = (path: string): PageId => {
  const candidate = path.replace(/^\//, '');
  return isPage(candidate) ? candidate : 'overview';
};

interface RouterState {
  page: PageId;
  /** True for a moment after each navigation, to drive NavigationProgress. */
  pending: boolean;
  go: (page: PageId) => void;
}

const Context = createContext<RouterState | null>(null);

export const useDemoRouter = (): RouterState => {
  const value = useContext(Context);
  if (!value) throw new Error('DemoRouter is missing');
  return value;
};

export const initialQuery = () => {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page');
  return { page: isPage(page) ? page : 'overview', mode: params.get('mode'), locale: params.get('locale') };
};

/** A tiny in-memory router: the current page is state, and no navigation reloads. */
export function DemoRouter({ children }: PropsWithChildren) {
  const [page, setPage] = useState<PageId>(() => initialQuery().page);
  const [pending, setPending] = useState(false);
  const go = useCallback((next: PageId) => {
    setPage(next);
    setPending(true);
    window.setTimeout(() => setPending(false), 700);
  }, []);
  const router = useMemo(() => ({ navigate: (to: string) => go(pageOf(to)), href: (to: string) => `#${to}` }), [go]);
  const state = useMemo(() => ({ page, pending, go }), [page, pending, go]);
  return (
    <Context.Provider value={state}>
      <WinuiRouterProvider router={router}>{children}</WinuiRouterProvider>
    </Context.Provider>
  );
}

export { pathOf };
