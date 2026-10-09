import { createContext, useContext } from 'react';
import type { MouseEvent, PropsWithChildren, ReactNode } from 'react';

import { fluentComponents } from '../../fluent';

const { Link } = fluentComponents;

// Floway's version of this module binds react-router's useHref and
// useLinkClickHandler. Components imported unchanged from Floway reach routing
// through `useRouteAddress` only, so this module keeps that signature and lets
// the host supply its router through `WinuiRouterProvider`; without one, an
// address is a plain link the browser follows.
// https://github.com/Menci/Floway/blob/fee9533cc3ed5cba8028e53e53ca13d2e64d91af/apps/web/src/components/ui/route-link.tsx

export interface WinuiRouter {
  /** Navigates within the application, e.g. react-router's `useNavigate()` result. */
  navigate: (to: string) => void;
  /** Maps a route to the href an anchor carries. Defaults to the route itself. */
  href?: (to: string) => string;
}

const RouterContext = createContext<WinuiRouter | null>(null);

export function WinuiRouterProvider({ router, children }: PropsWithChildren<{ router: WinuiRouter }>) {
  return <RouterContext.Provider value={router}>{children}</RouterContext.Provider>;
}

export interface RouteAddress {
  href: string;
  onClick: (event: MouseEvent<HTMLElement>) => void;
}

// The address a control carries so that every click the browser handles itself
// -- middle, modified, and "open in new tab" from the context menu -- lands on
// a real anchor and opens a second tab. Only the plain left click is taken
// here, and only when the host routes in-app or the caller owns the transition.
export function useRouteAddress(to: string, onActivate?: () => void): RouteAddress {
  const router = useContext(RouterContext);
  const href = router?.href?.(to) ?? to;
  return {
    href,
    onClick: event => {
      const activate = onActivate ?? (router === null ? undefined : () => router.navigate(to));
      if (activate === undefined) return;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      activate();
    },
  };
}

// A link to another route, spelled as the Fluent Link the WinUI layer paints.
export function RouteLink({ children, to }: { children?: ReactNode; to: string }) {
  const address = useRouteAddress(to);
  return <Link {...address}>{children}</Link>;
}
