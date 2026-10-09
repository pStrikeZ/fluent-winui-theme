import type { CSSProperties, ReactNode } from 'react';

import { fluentComponents } from '../../fluent';

const { makeStyles, mergeClasses } = fluentComponents;

export type MetricTone = 'default' | 'accent' | 'success' | 'warning' | 'danger';
export type MetricSize = 'subtitle' | 'title';

// The label is WinUI's Caption (12) in the secondary text fill; the value is the
// type ramp's Title (28) or Subtitle (20), both SemiBold. WinUI states those
// sizes but no line heights of its own, so the leading is Fluent's step of the
// same size, which is what the rest of the ramp here already uses.
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/TextBlock_themeresources.xaml#L3-L9
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/TextBlock_themeresources.xaml#L20
//
// A tone is the severity's own fill, the brush the validation text and message
// bars read, so a metric and a message bar of one severity agree.
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/Common_themeresources_any.xaml#L76-L78
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/Common_themeresources_any.xaml#L280-L282
const useStyles = makeStyles({
  root: {
    display: 'grid',
    minWidth: 0,
    rowGap: '4px',
  },
  label: {
    color: 'var(--winui-text-fill-secondary)',
    fontSize: 'var(--fontSizeBase200)',
    lineHeight: 'var(--lineHeightBase200)',
  },
  value: {
    alignItems: 'baseline',
    color: 'var(--winui-text-fill-primary)',
    columnGap: '4px',
    display: 'flex',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 'var(--fontWeightSemibold)',
    minWidth: 0,
  },
  title: {
    fontSize: 'var(--fontSizeHero700)',
    lineHeight: 'var(--lineHeightHero700)',
  },
  subtitle: {
    fontSize: 'var(--fontSizeBase500)',
    lineHeight: 'var(--lineHeightBase500)',
  },
  // A prefix or suffix is a unit or a sign, not part of the figure: one step
  // down the ramp and the secondary fill, so the figure stays the loudest thing.
  affix: {
    color: 'var(--winui-text-fill-secondary)',
    fontSize: 'var(--fontSizeBase300)',
    fontWeight: 'var(--fontWeightRegular)',
    lineHeight: 'var(--lineHeightBase300)',
  },
  accent: { color: 'var(--winui-accent-text-fill-tertiary)' },
  success: { color: 'var(--winui-system-fill-success)' },
  warning: { color: 'var(--winui-system-fill-caution)' },
  danger: { color: 'var(--winui-system-fill-critical)' },
  grid: {
    display: 'grid',
    gap: 'var(--fwt-metric-gap, 16px)',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(var(--fwt-metric-min-width, 160px), 100%), 1fr))',
  },
});

/** A number in the viewer's locale; a string passes through untouched. */
export const formatMetricValue = (value: number | string, precision?: number, locale?: string | string[]) =>
  typeof value === 'number'
    ? new Intl.NumberFormat(locale, precision === undefined ? undefined : { minimumFractionDigits: precision, maximumFractionDigits: precision }).format(value)
    : value;

export interface MetricProps {
  label: ReactNode;
  /** `null` or `undefined` draws an em dash. */
  value: number | string | null | undefined;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Replaces the default locale formatting. Called with the value only when there is one. */
  formatter?: (value: number | string) => ReactNode;
  /** Fraction digits the default formatter pins; ignored with `formatter`. */
  precision?: number;
  /** BCP 47 locale for the default formatter. Defaults to the viewer's. */
  locale?: string | string[];
  tone?: MetricTone;
  /** `title` is 28px, `subtitle` 20px. */
  size?: MetricSize;
  className?: string;
}

/** A labelled figure: the stand-in for a statistic tile. */
export function Metric({
  className, formatter, label, locale, precision, prefix, size = 'title', suffix, tone = 'default', value,
}: MetricProps) {
  const styles = useStyles();
  const hasValue = value !== null && value !== undefined;
  const text = hasValue ? (formatter ? formatter(value) : formatMetricValue(value, precision, locale)) : '—';

  return <div className={mergeClasses(styles.root, className)}>
    <span className={styles.label}>{label}</span>
    <div className={mergeClasses(styles.value, styles[size], tone !== 'default' && styles[tone])}>
      {prefix !== undefined && <span className={styles.affix}>{prefix}</span>}
      <span>{text}</span>
      {suffix !== undefined && <span className={styles.affix}>{suffix}</span>}
    </div>
  </div>;
}

export interface MetricGridProps {
  children: ReactNode;
  /** The narrowest a metric may get before the grid drops a column, in px or any CSS length. Defaults to 160. */
  minItemWidth?: number | string;
  /** Gap between metrics, in px or any CSS length. Defaults to 16. */
  gap?: number | string;
  className?: string;
}

/** A responsive grid of metrics: as many columns as fit at `minItemWidth`, each sharing the row. */
export function MetricGrid({ children, className, gap, minItemWidth }: MetricGridProps) {
  const styles = useStyles();
  const style = {
    ...(minItemWidth !== undefined && { '--fwt-metric-min-width': typeof minItemWidth === 'number' ? `${minItemWidth}px` : minItemWidth }),
    ...(gap !== undefined && { '--fwt-metric-gap': typeof gap === 'number' ? `${gap}px` : gap }),
  } as CSSProperties;

  return <div className={mergeClasses(styles.grid, className)} style={style}>{children}</div>;
}
