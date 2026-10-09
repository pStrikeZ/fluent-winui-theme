import { CaretLeft12Filled, CaretRight12Filled, Dismiss12Regular } from '@fluentui/react-icons';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';

import { TruncationTooltip } from './truncation-tooltip';
import { fluentComponents } from '../../fluent';
import { useTranslation } from '../../i18n/translation';

const { makeStyles, mergeClasses } = fluentComponents;

// A strip of document tabs after WinUI's TabView. The strip has no content
// panel: the host renders the selected document beneath it, on the surface the
// selected tab is painted with (SolidBackgroundFillColorTertiary), which is
// what makes the tab and the page read as one piece.
//
// Departures, all deliberate:
// - The concave 4px arcs where WinUI joins the selected tab to the strip's
//   bottom line are not drawn; the tab meets the line square.
// - Pointer-over and pressed header fills are LayerOnMicaBaseAlt in WinUI,
//   which this library has no token for; the subtle fill ramp stands in.
// - The close button is a sibling of the tab's button rather than inside it,
//   because a button inside a button is invalid HTML. The two are composed
//   visually into one header by the wrapper that carries the fills.
// - Keyboard model is the ARIA tabs pattern with automatic activation (arrows
//   move and select, Home/End jump) rather than WinUI's list navigation, and
//   Delete closes alongside Ctrl+F4.
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView_themeresources.xaml#L239-L269
const useStyles = makeStyles({
  // TabViewHeaderPadding: 8px above the tabs.
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView_themeresources.xaml#L239
  // The strip's bottom line is TabViewBorderBrush (CardStrokeColorDefault),
  // drawn here under the scroller so that the selected tab, which reaches the
  // strip's last pixel row, paints over it and interrupts it.
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView.xaml#L36-L37
  root: {
    alignItems: 'flex-end',
    display: 'flex',
    maxWidth: '100%',
    minWidth: 0,
    paddingTop: '8px',
    position: 'relative',
    '&::after': {
      backgroundColor: 'var(--winui-card-stroke-default)',
      bottom: 0,
      content: '""',
      height: '1px',
      left: 0,
      pointerEvents: 'none',
      position: 'absolute',
      right: 0,
      zIndex: 0,
    },
  },
  scroller: {
    alignSelf: 'stretch',
    display: 'flex',
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
    position: 'relative',
    scrollbarWidth: 'none',
    zIndex: 1,
    '&::-webkit-scrollbar': { display: 'none' },
    '@media (prefers-reduced-motion: no-preference)': { scrollBehavior: 'smooth' },
  },
  tablist: {
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'nowrap',
    minWidth: 'min-content',
  },
  // TabViewItemMinHeight 32, MinWidth 100, MaxWidth 240; the item's own
  // corners are OverlayCornerRadius on top only (TopCornerRadiusFilterConverter).
  // Every item holds a 1px border (TabViewItemBorderThickness) so selecting
  // one, which paints it, moves nothing.
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView_themeresources.xaml#L242-L244
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView.xaml#L296-L297
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView.xaml#L560-L562
  item: {
    alignItems: 'stretch',
    borderBottomWidth: 0,
    borderLeft: '1px solid transparent',
    borderRight: '1px solid transparent',
    borderTop: '1px solid transparent',
    borderTopLeftRadius: 'var(--winui-overlay-corner-radius)',
    borderTopRightRadius: 'var(--winui-overlay-corner-radius)',
    boxSizing: 'border-box',
    display: 'flex',
    flexGrow: 0,
    flexShrink: 1,
    maxWidth: '240px',
    minHeight: '32px',
    minWidth: '100px',
    position: 'relative',
    // TabSeparator: 1px DividerStrokeColorDefault inset 8px top and bottom,
    // gone under the pointer, on the selected tab and on the tab before it.
    // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView.xaml#L553
    // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView_themeresources.xaml#L266
    '&::after': {
      backgroundColor: 'var(--winui-divider-stroke-default)',
      bottom: '8px',
      content: '""',
      pointerEvents: 'none',
      position: 'absolute',
      right: '-1px',
      top: '8px',
      width: '1px',
    },
    '&:last-child::after': { display: 'none' },
    '&:hover::after': { opacity: 0 },
    '&:has(+ [data-selected])::after': { opacity: 0 },
    '&:hover': { backgroundColor: 'var(--winui-subtle-fill-secondary)' },
    '&:active': { backgroundColor: 'var(--winui-subtle-fill-tertiary)' },
    // The selected tab: TabViewItemHeaderBackgroundSelected, a stroke on top
    // and sides in CardStrokeColorDefault, no bottom edge. It holds its fill
    // through the pointer states.
    // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView.xaml#L325-L345
    // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView_themeresources.xaml#L72-L80
    '&[data-selected]': {
      backgroundColor: 'var(--winui-solid-background-fill-tertiary)',
      borderLeftColor: 'var(--winui-card-stroke-default)',
      borderRightColor: 'var(--winui-card-stroke-default)',
      borderTopColor: 'var(--winui-card-stroke-default)',
      zIndex: 1,
    },
    '&[data-selected]::after': { opacity: 0 },
    '&[data-disabled]': { backgroundColor: 'transparent' },
    // WinUI's CloseButtonOverlayMode Auto: the close button shows on the
    // selected tab and under the pointer, or always where there is no hover.
    '&:hover [data-tab-close], &:focus-within [data-tab-close]': { opacity: 1, pointerEvents: 'auto' },
    '@media (hover: none)': { '& [data-tab-close]': { opacity: 1, pointerEvents: 'auto' } },
  },
  // TabViewItemHeaderPaddingWithCloseButton 8,3,4,3 / WithoutCloseButton
  // 8,3,8,3; the close button's 4px margin supplies the right-hand 4.
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView_themeresources.xaml#L253-L254
  tab: {
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: 'transparent',
    borderRadius: 'inherit',
    border: 'none',
    // The foreground ramp: rest and pointer-over TextFillColorSecondary,
    // pressed Tertiary, selected Primary.
    // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView_themeresources.xaml#L12-L21
    color: 'var(--winui-text-fill-secondary)',
    columnGap: '10px',
    cursor: 'pointer',
    display: 'flex',
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    // TabViewItemHeaderFontSize 12.
    fontFamily: 'inherit',
    fontSize: '12px',
    lineHeight: '16px',
    minWidth: 0,
    padding: '3px 8px 3px 8px',
    textAlign: 'start',
    '&:active:not(:disabled)': { color: 'var(--winui-text-fill-tertiary)' },
    '&[aria-selected="true"], &[aria-selected="true"]:active': { color: 'var(--winui-text-fill-primary)' },
    '&:disabled': { color: 'var(--winui-text-fill-disabled)', cursor: 'not-allowed' },
    // The system focus visual, as the library's other selectors draw it.
    '&:focus-visible': {
      boxShadow: 'inset 0 0 0 1px var(--winui-focus-stroke-inner)',
      outline: '2px solid var(--winui-focus-stroke-outer)',
      outlineOffset: '-2px',
    },
  },
  tabWithClose: { paddingRight: 0 },
  // The icon sits in a 16px box with a 10px gap before the label.
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView_themeresources.xaml#L246-L247
  icon: {
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
    fontSize: '16px',
    height: '16px',
    justifyContent: 'center',
    width: '16px',
  },
  label: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // TabViewItemHeaderCloseButtonWidth 32, Height 24, glyph 12, margin 4,0,0,0,
  // ControlCornerRadius; the fills are the subtle ramp, the glyph Primary
  // (Secondary while pressed).
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView_themeresources.xaml#L248-L252
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView.xaml#L172-L187
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView_themeresources.xaml#L47-L60
  close: {
    alignItems: 'center',
    alignSelf: 'center',
    appearance: 'none',
    backgroundColor: 'transparent',
    borderRadius: 'var(--winui-control-corner-radius)',
    border: 'none',
    color: 'var(--winui-text-fill-primary)',
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    fontSize: '12px',
    height: '24px',
    justifyContent: 'center',
    margin: '0 4px',
    opacity: 0,
    padding: 0,
    pointerEvents: 'none',
    width: '32px',
    '&:hover': { backgroundColor: 'var(--winui-subtle-fill-secondary)' },
    '&:active': {
      backgroundColor: 'var(--winui-subtle-fill-tertiary)',
      color: 'var(--winui-text-fill-secondary)',
    },
    '&:focus-visible': {
      boxShadow: 'inset 0 0 0 1px var(--winui-focus-stroke-inner)',
      outline: '2px solid var(--winui-focus-stroke-outer)',
      outlineOffset: '0',
      opacity: 1,
      pointerEvents: 'auto',
    },
    '&:disabled': { color: 'var(--winui-text-fill-disabled)', cursor: 'not-allowed' },
  },
  closeShown: { opacity: 1, pointerEvents: 'auto' },
  // Scroll buttons: 32x24, glyph 8, ControlCornerRadius, the subtle ramp, with
  // 8,0,3,3 / 3,0,8,3 container padding.
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView_themeresources.xaml#L255-L260
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/TabView/TabView_themeresources.xaml#L34-L41
  scrollButtonBox: {
    alignSelf: 'flex-end',
    flexShrink: 0,
    position: 'relative',
    zIndex: 1,
  },
  scrollBoxLeft: { padding: '0 3px 3px 8px' },
  scrollBoxRight: { padding: '0 8px 3px 3px' },
  scrollButton: {
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: 'transparent',
    borderRadius: 'var(--winui-control-corner-radius)',
    border: 'none',
    color: 'var(--winui-text-fill-secondary)',
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: '8px',
    height: '24px',
    justifyContent: 'center',
    padding: '3px 7px',
    width: '32px',
    '&:hover:not(:disabled)': { backgroundColor: 'var(--winui-subtle-fill-secondary)' },
    '&:active:not(:disabled)': { backgroundColor: 'var(--winui-subtle-fill-tertiary)' },
    '&:disabled': { color: 'var(--winui-text-fill-disabled)', cursor: 'default' },
    '&:focus-visible': {
      boxShadow: 'inset 0 0 0 1px var(--winui-focus-stroke-inner)',
      outline: '2px solid var(--winui-focus-stroke-outer)',
      outlineOffset: '0',
    },
  },
  // TabStripFooter: beside the tabs, after them, on the strip's baseline.
  footer: {
    alignItems: 'center',
    alignSelf: 'stretch',
    display: 'flex',
    flexShrink: 0,
    minHeight: '32px',
    paddingBottom: '3px',
    paddingInline: '4px',
    position: 'relative',
    zIndex: 1,
  },
});

export interface TabViewItem {
  /** Identity of the tab, unique within `items`. */
  value: string;
  header: ReactNode;
  icon?: ReactNode;
  /** Whether the tab shows a close button and answers Ctrl+F4, Delete and a middle click. */
  closable?: boolean;
  /** Accessible name of this tab's close button; defaults to the localised "Close tab". */
  closeLabel?: string;
  disabled?: boolean;
}

export interface TabViewProps {
  items: readonly TabViewItem[];
  /** The selected tab's value, or null while none is. */
  selectedValue: string | null;
  onSelect: (value: string) => void;
  /** Called when the operator closes a closable tab. The host owns the list and removes it. */
  onClose?: (value: string) => void;
  ariaLabel: string;
  /** Content after the last tab (WinUI's TabStripFooter). */
  footer?: ReactNode;
  className?: string;
}

const SCROLL_STEP_PX = 200;

export function TabView({ ariaLabel, className, footer, items, onClose, onSelect, selectedValue }: TabViewProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ backward: false, forward: false, scrollable: false });

  const enabledValues = items.filter(item => item.disabled !== true).map(item => item.value);
  // The single tab stop: the selected tab, or the first enabled one while the
  // selection is empty or points at a tab that cannot take focus.
  const tabStop = selectedValue !== null && enabledValues.includes(selectedValue) ? selectedValue : enabledValues[0];

  const measure = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const scrollable = scroller.scrollWidth - scroller.clientWidth > 1;
    const backward = scrollable && scroller.scrollLeft > 0;
    const forward = scrollable && scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;
    setOverflow(previous => previous.scrollable === scrollable && previous.backward === backward && previous.forward === forward
      ? previous
      : { backward, forward, scrollable });
  }, []);

  useLayoutEffect(() => {
    measure();
    const scroller = scrollerRef.current;
    if (!scroller || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    const list = scroller.firstElementChild;
    if (list) observer.observe(list);
    return () => observer.disconnect();
  }, [measure, items]);

  // A selection made by keyboard, or from outside, may be off screen.
  useEffect(() => {
    const selected = scrollerRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    selected?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [selectedValue]);

  const scrollBy = (direction: 1 | -1) => scrollerRef.current?.scrollBy?.({ left: direction * SCROLL_STEP_PX });

  const closeIfClosable = (value: string) => {
    const item = items.find(candidate => candidate.value === value);
    if (item?.closable !== true || item.disabled === true) return false;
    onClose?.(value);
    return true;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const owner = target.closest<HTMLElement>('[data-tab-value]');
    if (!owner) return;
    const value = owner.dataset.tabValue as string;
    if ((event.key === 'F4' && event.ctrlKey) || event.key === 'Delete') {
      if (closeIfClosable(value)) event.preventDefault();
      return;
    }
    if (!target.matches('[role="tab"]') || enabledValues.length === 0) return;
    const current = enabledValues.indexOf(value);
    let next: string | undefined;
    switch (event.key) {
      case 'ArrowRight':
        next = enabledValues[(current + 1) % enabledValues.length];
        break;
      case 'ArrowLeft':
        next = enabledValues[(current - 1 + enabledValues.length) % enabledValues.length];
        break;
      case 'Home':
        next = enabledValues[0];
        break;
      case 'End':
        next = enabledValues[enabledValues.length - 1];
        break;
      default:
        return;
    }
    event.preventDefault();
    const nextTab = event.currentTarget.querySelector<HTMLElement>(`[data-tab-value="${CSS.escape(next)}"] [role="tab"]`);
    nextTab?.focus();
    if (next !== selectedValue) onSelect(next);
  };

  return <div className={mergeClasses(styles.root, className)}>
    {overflow.scrollable
      ? <div className={mergeClasses(styles.scrollButtonBox, styles.scrollBoxLeft)}>
          <button
            aria-label={t('tabView.scrollBackward')}
            className={styles.scrollButton}
            disabled={!overflow.backward}
            onClick={() => scrollBy(-1)}
            tabIndex={-1}
            type="button"
          ><CaretLeft12Filled fontSize={8} /></button>
        </div>
      : null}
    <div className={styles.scroller} onScroll={measure} ref={scrollerRef}>
      <div aria-label={ariaLabel} aria-orientation="horizontal" className={styles.tablist} onKeyDown={handleKeyDown} role="tablist">
        {items.map(item => {
          const selected = item.value === selectedValue;
          const disabled = item.disabled === true;
          const closable = item.closable === true;
          const closeLabel = item.closeLabel ?? t('tabView.close');
          return <div
            className={styles.item}
            data-disabled={disabled ? '' : undefined}
            data-selected={selected ? '' : undefined}
            data-tab-value={item.value}
            key={item.value}
            // The middle button closes, and is kept from starting the
            // browser's autoscroll on mouse-down.
            onAuxClick={event => {
              if (event.button !== 1 || !closable) return;
              event.preventDefault();
              closeIfClosable(item.value);
            }}
            onMouseDown={(event: MouseEvent) => { if (event.button === 1) event.preventDefault(); }}
            role="presentation"
          >
            <button
              aria-selected={selected}
              className={mergeClasses(styles.tab, closable && styles.tabWithClose)}
              disabled={disabled}
              onClick={() => { if (!selected) onSelect(item.value); }}
              role="tab"
              tabIndex={item.value === tabStop ? 0 : -1}
              type="button"
            >
              {item.icon === undefined ? null : <span aria-hidden="true" className={styles.icon}>{item.icon}</span>}
              {typeof item.header === 'string'
                ? <TruncationTooltip content={item.header} relationship="description">
                    {measureRef => <span className={styles.label} ref={measureRef}>{item.header}</span>}
                  </TruncationTooltip>
                : <span className={styles.label}>{item.header}</span>}
            </button>
            {closable
              ? <button
                  aria-label={closeLabel}
                  className={mergeClasses(styles.close, selected && styles.closeShown)}
                  data-tab-close=""
                  disabled={disabled}
                  onClick={() => closeIfClosable(item.value)}
                  tabIndex={-1}
                  type="button"
                ><Dismiss12Regular fontSize={12} /></button>
              : null}
          </div>;
        })}
      </div>
    </div>
    {overflow.scrollable
      ? <div className={mergeClasses(styles.scrollButtonBox, styles.scrollBoxRight)}>
          <button
            aria-label={t('tabView.scrollForward')}
            className={styles.scrollButton}
            disabled={!overflow.forward}
            onClick={() => scrollBy(1)}
            tabIndex={-1}
            type="button"
          ><CaretRight12Filled fontSize={8} /></button>
        </div>
      : null}
    {footer === undefined ? null : <div className={styles.footer}>{footer}</div>}
  </div>;
}
