import { NavigationRegular } from '@fluentui/react-icons';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { SCROLLPORT_FILL_CLASS } from '../components/ui/layout';
import { OutcomeToastProvider } from '../components/ui/outcome-toast';
import { ScrollArea } from '../components/ui/scroll-area';
import { fluentComponents } from '../fluent';
import { prefersReducedMotion } from '../lib/reduced-motion';
import { PAGE_ENTER_EASING, PAGE_ENTER_MS, PAGE_ENTER_OFFSET_PX } from '../winui/motion';
import { pageFrameClassName, usePageFrames } from './page-frames';

const { Button, DrawerBody, OverlayDrawer } = fluentComponents;

// Floway's dashboard layout without the dashboard: a docked navigation pane
// beside the page, folding at 900px into a header bar whose button opens the
// pane in a light-dismiss drawer; the page scrolls on its own and changes with
// the WinUI page transition.
// https://github.com/Menci/Floway/blob/fee9533cc3ed5cba8028e53e53ca13d2e64d91af/apps/web/src/routes/dashboard.tsx

const MAIN_ID = 'fwt-main';

export interface AppShellLabels {
  /** The skip link that jumps past the navigation. */
  skipToContent: string;
  /** The header button that opens the navigation drawer. */
  openNavigation: string;
  /** Accessible name of the navigation drawer. */
  navigation: string;
}

export interface AppShellProps {
  /**
   * Renders the navigation pane, usually a `NavigationPane`. It is rendered
   * twice: docked, and in the narrow-layout drawer, where `onNavigate` is set so
   * the pane can close the drawer and show its close button.
   */
  navigation: (props: { onNavigate?: () => void }) => ReactNode;
  /** Content of the narrow-layout header bar after the menu button, e.g. the logo. */
  narrowHeader?: ReactNode;
  /** Trailing content of the narrow-layout header bar, e.g. a language picker. */
  narrowHeaderActions?: ReactNode;
  labels: AppShellLabels;
  /** Names the current page. A change plays the page transition; keep it stable across query-string rewrites. */
  pageKey: string;
  /** A workspace page fills the viewport height instead of growing with its content. */
  workspace?: boolean;
  children: ReactNode;
}

export function AppShell({ children, labels, narrowHeader, narrowHeaderActions, navigation, pageKey, workspace = false }: AppShellProps) {
  const [navigationOpen, setNavigationOpen] = useState(false);
  // The entrance is started on the element, not declared in the sheet;
  // ../winui/page-transition.css.ts says why.
  const firstFrameRef = useRef<HTMLDivElement>(null);
  const entranceStarted = useRef(false);
  useLayoutEffect(() => {
    // StrictMode double-invokes layout effects in development; a second
    // animation would start from an offset the first has already left.
    if (entranceStarted.current) return;
    if (prefersReducedMotion()) return;
    const frame = firstFrameRef.current;
    if (!frame) return;
    entranceStarted.current = true;
    // A pending animation applies no fill, so the class holds the frame at its
    // first key frame -- in this same synchronous block, so nothing paints
    // between.
    frame.classList.add('fwt-page-entrance');
    frame.animate(
      [{ translate: `0 ${PAGE_ENTER_OFFSET_PX}px` }, { translate: 'none' }],
      { duration: PAGE_ENTER_MS, easing: PAGE_ENTER_EASING, fill: 'forwards' },
    );
  }, []);

  // The scroller belongs to the page, not the shell, so a held page keeps its
  // own scroll position while it leaves.
  const page = <ScrollArea
    axes="vertical"
    className="h-full min-h-0"
    contentClassName={workspace ? 'h-full' : 'min-h-full'}
    noTabIndex
  >
    <div className={`${workspace ? SCROLLPORT_FILL_CLASS : ''} p-[22px_var(--fwt-page-inset)_var(--fwt-page-inset)] max-[680px]:p-4`}>{children}</div>
  </ScrollArea>;
  const frames = usePageFrames(page, pageKey);

  return (
    <OutcomeToastProvider>
      <a
        className="fixed left-3 top-3 z-[100000] -translate-y-20 rounded-md bg-fui-bg1 px-3 py-2 text-fui-fg1 shadow-lg focus:translate-y-0"
        href={`#${MAIN_ID}`}
      >
        {labels.skipToContent}
      </a>
      <div className="grid grid-cols-[clamp(240px,18vw,290px)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] h-[100dvh] min-h-0 max-[900px]:grid-cols-1 max-[900px]:grid-rows-[58px_minmax(0,1fr)]">
        <div className="min-h-0 max-[900px]:hidden">
          {navigation({})}
        </div>
        <header className="hidden max-[900px]:flex items-center gap-3 border-b border-b-solid border-fui-divider px-4">
          <Button
            appearance="subtle"
            aria-label={labels.openNavigation}
            icon={<NavigationRegular />}
            onClick={() => setNavigationOpen(true)}
          />
          {narrowHeader}
          {narrowHeaderActions !== undefined && <div className="ml-auto flex items-center gap-2">{narrowHeaderActions}</div>}
        </header>
        <div className="grid grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] min-h-0">
          {frames.map(frame => <div
            aria-hidden={frame.leaving || undefined}
            className={`col-start-1 row-start-1 min-h-0 ${pageFrameClassName(frame)}`}
            id={frame.leaving ? undefined : MAIN_ID}
            role={frame.leaving ? undefined : 'main'}
            inert={frame.leaving}
            key={frame.id}
            onAnimationEnd={frame.onAnimationEnd}
            ref={frame.id === 0 && !frame.leaving ? firstFrameRef : undefined}
            tabIndex={frame.leaving ? undefined : -1}
          >{frame.node}</div>)}
        </div>
      </div>
      <OverlayDrawer
        aria-label={labels.navigation}
        backdrop={{ className: 'fwt-drawer-light-dismiss' }}
        onOpenChange={(_, data) => setNavigationOpen(data.open)}
        open={navigationOpen}
        position="start"
      >
        <DrawerBody className="!p-0">
          {navigation({ onNavigate: () => setNavigationOpen(false) })}
        </DrawerBody>
      </OverlayDrawer>
    </OutcomeToastProvider>
  );
}
