import type { NavItemProps } from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import { useRef } from 'react';
import type { MouseEventHandler, ReactNode } from 'react';

import { NavSelectionIndicator } from '../components/nav-selection-indicator';
import { useRouteAddress } from '../components/ui/route-link';
import { ScrollArea } from '../components/ui/scroll-area';
import { fluentComponents } from '../fluent';

const {
  Button,
  NavDrawer,
  NavDrawerBody,
  NavDrawerFooter,
  NavDrawerHeader,
  NavItem,
  NavSectionHeader,
  makeStyles,
} = fluentComponents;

// Floway's dashboard sidebar with the dashboard taken out: the pages, the
// account entry and the sign-out flow arrive as data from the host.
// https://github.com/Menci/Floway/blob/fee9533cc3ed5cba8028e53e53ca13d2e64d91af/apps/web/src/components/sidebar/nav.tsx

const useStyles = makeStyles({
  // 36px is a floor rather than a fixed height, so a two-line label lengthens
  // the row instead of being cut. The left-pane template's 40px icon column
  // plus the presenter's 4 puts the label at 44; Fluent's icon slot is 20px
  // wide, so the gap carrying the label to that 44 is 12 rather than 16.
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NavigationView/NavigationView_themeresources.xaml#L208
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NavigationView/NavigationView_themeresources.xaml#L217
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NavigationView/NavigationView_themeresources.xaml#L219
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NavigationView/NavigationView_themeresources.xaml#L251
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NavigationView/NavigationView_themeresources.xaml#L604-L616
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NavigationView/NavigationViewItemPresenter.cpp#L286-L290
  item: {
    gap: '12px',
    minHeight: '36px',
    paddingBottom: '8px',
    paddingLeft: '12px',
    paddingRight: '14px',
    paddingTop: '8px',
  },
});

// WinUI hangs the pill off the leading edge of the presenter's content root
// with no margin of its own.
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NavigationView/NavigationView_themeresources.xaml#L220-L222
const NAV_INDICATOR_INSET = 0;

export interface NavigationPaneItem {
  /** Identifies the item for selection. Usually the route it leads to. */
  value: string;
  label: ReactNode;
  icon?: NavItemProps['icon'];
  /**
   * A route to link to. Followed through `WinuiRouterProvider` when one is
   * mounted, otherwise by the browser. Omit it for an action such as signing
   * out, and handle `onSelect` instead.
   */
  href?: string;
  onSelect?: () => void;
}

export interface NavigationPaneGroup {
  /** Section header. Omit for an unlabelled first group. */
  label?: ReactNode;
  items: NavigationPaneItem[];
}

export interface NavigationPaneProps {
  /** Accessible name of the navigation landmark. */
  label: string;
  /** Leading header content, e.g. the product logo. */
  header?: ReactNode;
  /** Trailing header content shown when docked (not in the drawer), e.g. a language picker. */
  headerActions?: ReactNode;
  groups: NavigationPaneGroup[];
  /** Items pinned to the bottom of the pane, e.g. the account and sign-out. */
  footerItems?: NavigationPaneItem[];
  selectedValue: string;
  /** The item a navigation in flight is heading to. */
  pendingValue?: string;
  /**
   * Set when the pane sits in the narrow-layout drawer: called after an in-view
   * navigation so the drawer can close, and it shows a close button.
   */
  onNavigate?: () => void;
  /** Accessible name of the drawer's close button. */
  closeLabel?: string;
}

function PaneLink({ item, onNavigate, pending, href }: { item: NavigationPaneItem; onNavigate?: () => void; pending: boolean; href: string }) {
  const styles = useStyles();
  const address = useRouteAddress(href);
  const handleClick: MouseEventHandler<HTMLAnchorElement> = event => {
    const followsInThisView = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    address.onClick(event);
    if (followsInThisView) onNavigate?.();
  };
  return <NavItem
    as="a"
    className={styles.item}
    data-nav-pending={pending || undefined}
    data-nav-value={item.value}
    href={address.href}
    icon={item.icon}
    onClick={handleClick}
    value={item.value}
  >{item.label}</NavItem>;
}

function PaneItem({ item, onNavigate, pendingValue }: { item: NavigationPaneItem; onNavigate?: () => void; pendingValue?: string }) {
  const styles = useStyles();
  if (item.href !== undefined) {
    return <PaneLink href={item.href} item={item} onNavigate={onNavigate} pending={pendingValue === item.value} />;
  }
  return <NavItem className={styles.item} data-nav-value={item.value} icon={item.icon} value={item.value}>{item.label}</NavItem>;
}

export function NavigationPane({
  closeLabel = 'Close navigation',
  footerItems = [],
  groups,
  header,
  headerActions,
  label,
  onNavigate,
  pendingValue,
  selectedValue,
}: NavigationPaneProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const allItems = [...groups.flatMap(group => group.items), ...footerItems];

  return <NavDrawer
    aria-label={label}
    className="!bg-transparent !h-full !max-w-none !w-full"
    density="medium"
    onNavItemSelect={(_, data) => {
      const item = allItems.find(candidate => candidate.value === data.value);
      if (item?.href === undefined) item?.onSelect?.();
    }}
    open
    selectedValue={selectedValue}
    surfaceMotion={null}
    type="inline"
  >
    <NavDrawerHeader className="!bg-transparent !px-5 !py-4">
      <div className="flex items-center min-h-10">
        {header}
        {!onNavigate && headerActions !== undefined && <div className="ml-auto flex items-center gap-2">{headerActions}</div>}
        {onNavigate && <Button appearance="subtle" aria-label={closeLabel} className="!ml-auto" icon={<DismissRegular />} onClick={onNavigate} />}
      </div>
    </NavDrawerHeader>
    <NavDrawerBody className="!bg-transparent overflow-hidden !p-0">
      <ScrollArea axes="vertical" className="h-full min-h-0" contentClassName="px-[10px]" noTabIndex>
        <div className="relative" ref={bodyRef}>
          <NavSelectionIndicator containerRef={bodyRef} inset={NAV_INDICATOR_INSET} otherListIs="below" selectedValue={selectedValue} />
          {groups.map((group, groupIndex) => group.items.length === 0 ? null : <div key={groupIndex}>
            {group.label !== undefined && <NavSectionHeader>{group.label}</NavSectionHeader>}
            <div className="grid gap-1">
              {group.items.map(item => <PaneItem item={item} key={item.value} onNavigate={onNavigate} pendingValue={pendingValue} />)}
            </div>
          </div>)}
        </div>
      </ScrollArea>
    </NavDrawerBody>
    {/* No rule above these. NavigationView's separator for this seam is
        authored collapsed and revealed only when the menu and the footer
        compete for the pane's height, which is an overflow affordance rather
        than a grouping rule.
        https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NavigationView/NavigationView.xaml#L375 */}
    {footerItems.length > 0 && <NavDrawerFooter className="!bg-transparent !gap-y-1 !px-[10px] !py-3">
      <div className="grid gap-y-1 relative w-full" ref={footerRef}>
        <NavSelectionIndicator containerRef={footerRef} inset={NAV_INDICATOR_INSET} otherListIs="above" selectedValue={selectedValue} />
        {footerItems.map(item => <PaneItem item={item} key={item.value} onNavigate={onNavigate} pendingValue={pendingValue} />)}
      </div>
    </NavDrawerFooter>}
  </NavDrawer>;
}
