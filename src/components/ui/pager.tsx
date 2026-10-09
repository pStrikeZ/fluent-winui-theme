import {
  ChevronLeft12Regular,
  ChevronRight12Regular,
  MoreHorizontal16Regular,
  Next16Regular,
  Previous16Regular,
} from '@fluentui/react-icons';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

import { Dropdown } from './fluent-form-controls';
import { fluentComponents } from '../../fluent';
import { useTranslation } from '../../i18n/translation';

const { Button, Option, Text, Tooltip, makeStyles, mergeClasses } = fluentComponents;

// PagerControl's NumberPanel pattern: with fewer than eight pages every page
// gets a button, otherwise the strip holds seven slots and the ellipses move
// with the selection. The branch thresholds are on the zero-based selected
// index `s`, exactly as the control writes them.
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/PagerControl/PagerControl.cpp#L530-L558
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/PagerControl/PagerControl.cpp#L600-L690
export type PagerItem = number | 'start-ellipsis' | 'end-ellipsis';

export function pagerPageCount(total: number, pageSize: number): number {
  if (!(pageSize > 0) || !(total > 0)) return 1;
  return Math.ceil(total / pageSize);
}

export function pagerPageWindow(page: number, pageCount: number): PagerItem[] {
  if (pageCount < 8) return Array.from({ length: Math.max(pageCount, 0) }, (_, index) => index + 1);
  const selectedIndex = page - 1;
  if (selectedIndex < 4) return [1, 2, 3, 4, 5, 'end-ellipsis', pageCount];
  if (selectedIndex >= pageCount - 4) return [1, 'start-ellipsis', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  return [1, 'start-ellipsis', page - 1, page, page + 1, 'end-ellipsis', pageCount];
}

const clampPage = (page: number, pageCount: number) => Math.min(Math.max(Math.trunc(page) || 1, 1), pageCount);

// `!important` because ../../winui/controls/button.css.ts states a two-class
// `min-width: auto` and a two-class padding for every button, which a single
// Griffel class does not outrank.
//
// Navigation buttons are 40 square and number buttons are at least 32 wide and
// 20 tall with no padding of their own, since the template is a bare content
// presenter.
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/PagerControl/PagerControl_themeresources.xaml#L32-L40
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/PagerControl/PagerControl_themeresources.xaml#L86-L89
//
// The selection mark is a 2px accent bar with a 1px radius that the control
// slides to the chosen button along the bottom of the 40px row. Drawn here as
// a pseudo-element of the selected button's wrapper (Fluent's button clips its
// overflow), dropped by half the row's slack below the 20px button, so it
// needs no measurement; the slide itself
// (RepositionThemeTransition) is not reproduced.
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/PagerControl/PagerControl.xaml#L163-L169
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/PagerControl/PagerControl_themeresources.xaml#L5
const useStyles = makeStyles({
  navButton: {
    height: '40px !important',
    minWidth: '40px !important',
    padding: '0 !important',
    width: '40px !important',
  },
  numberButton: {
    height: '20px !important',
    minHeight: '20px !important',
    minWidth: '32px !important',
    paddingBlock: '0 !important',
    paddingInline: '0 !important',
  },
  selected: {
    position: 'relative',
    '::after': {
      backgroundColor: 'var(--winui-accent-fill-default)',
      borderRadius: '1px',
      bottom: '-10px',
      content: '""',
      height: '2px',
      insetInline: 0,
      position: 'absolute',
      '@media (forced-colors: active)': { backgroundColor: 'Highlight' },
    },
  },
  // The glyphs are mirrored for a right-to-left reading order.
  // https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/PagerControl/PagerControl_themeresources.xaml#L80
  mirrored: {
    ':where([dir="rtl"]) &': { transform: 'scaleX(-1)' },
  },
});

export interface PagerProps {
  /** Current page, 1-based. Clamped into the available pages. */
  page: number;
  onPageChange: (page: number) => void;
  /** Number of pages. Derived from `total` and `pageSize` when omitted. */
  pageCount?: number;
  /** Item count, for deriving `pageCount` and for the total label. */
  total?: number;
  pageSize?: number;
  /** Shows a page-size dropdown when given together with `onPageSizeChange`. */
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
  /** Adds a "Total N items" label; pass a function to render it yourself. Needs `total`. */
  showTotal?: boolean | ((total: number) => ReactNode);
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

function NavigationButton({ className, disabled, icon, label, onClick }: {
  className: string;
  disabled: boolean;
  icon: ReactElement;
  label: string;
  onClick: () => void;
}) {
  return <Tooltip content={label} relationship="label">
    <Button appearance="subtle" className={className} disabled={disabled} icon={icon} onClick={onClick} />
  </Tooltip>;
}

export function Pager({
  ariaLabel,
  className,
  disabled = false,
  onPageChange,
  onPageSizeChange,
  page,
  pageCount: pageCountProp,
  pageSize,
  pageSizeOptions,
  showTotal = false,
  total,
}: PagerProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const pageCount = Math.max(1, Math.trunc(pageCountProp ?? pagerPageCount(total ?? 0, pageSize ?? 1)));
  const current = clampPage(page, pageCount);
  const go = (next: number) => {
    const target = clampPage(next, pageCount);
    if (target !== current) onPageChange(target);
  };
  const atStart = current <= 1;
  const atEnd = current >= pageCount;
  const mirrored = styles.mirrored;
  const sizes = pageSize !== undefined && pageSizeOptions && onPageSizeChange
    ? [...new Set([...pageSizeOptions, pageSize])].sort((a, b) => a - b)
    : null;
  const sizeLabel = (size: number) => t('pager.perPage').replace('{n}', String(size));

  return <nav aria-label={ariaLabel ?? t('pager.label')} className={mergeClasses('flex flex-wrap items-center justify-end gap-x-4 gap-y-1', className)}>
    {showTotal && total !== undefined && (typeof showTotal === 'function'
      ? showTotal(total)
      : <Text className="text-fui-fg2" size={300}>{t('pager.total').replace('{n}', String(total))}</Text>)}
    {sizes && pageSize !== undefined && <Dropdown
      aria-label={t('pager.pageSize')}
      disabled={disabled}
      onOptionSelect={(_, data) => {
        const next = Number(data.optionValue);
        if (next > 0 && next !== pageSize) onPageSizeChange?.(next);
      }}
      selectedOptions={[String(pageSize)]}
      style={{ '--fwt-select-min-width': '112px' } as CSSProperties}
      value={sizeLabel(pageSize)}
    >
      {sizes.map(size => <Option key={size} text={sizeLabel(size)} value={String(size)}>{sizeLabel(size)}</Option>)}
    </Dropdown>}
    <div className="flex items-center">
      <NavigationButton className={styles.navButton} disabled={disabled || atStart} icon={<Previous16Regular className={mirrored} />} label={t('pager.first')} onClick={() => go(1)} />
      <NavigationButton className={styles.navButton} disabled={disabled || atStart} icon={<ChevronLeft12Regular className={mirrored} />} label={t('pager.previous')} onClick={() => go(current - 1)} />
      <div className="flex items-center h-10" style={{ gap: 5 }}>
        {pagerPageWindow(current, pageCount).map(item => typeof item === 'number'
          ? <span className={mergeClasses('inline-flex', item === current && styles.selected)} key={item}>
            <Button
              appearance="subtle"
              aria-current={item === current ? 'page' : undefined}
              aria-label={t('pager.page').replace('{n}', String(item))}
              className={styles.numberButton}
              disabled={disabled}
              onClick={() => go(item)}
            >{item}</Button>
          </span>
          : <span aria-hidden className="grid place-items-center w-5 text-fui-fg2" key={item}><MoreHorizontal16Regular /></span>)}
      </div>
      <NavigationButton className={styles.navButton} disabled={disabled || atEnd} icon={<ChevronRight12Regular className={mirrored} />} label={t('pager.next')} onClick={() => go(current + 1)} />
      <NavigationButton className={styles.navButton} disabled={disabled || atEnd} icon={<Next16Regular className={mirrored} />} label={t('pager.last')} onClick={() => go(pageCount)} />
    </div>
  </nav>;
}
