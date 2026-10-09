import type { CSSProperties, ReactNode } from 'react';

import { fluentComponents } from '../../fluent';

const { makeStyles, mergeClasses, shorthands } = fluentComponents;

// WinUI has no description-list control, so this is composed from the text and
// surface vocabulary the library already carries: the label is Caption in the
// secondary text fill over the value in Body, and the bordered form draws its
// cell lines with the divider stroke -- the line between two pieces of content
// -- on a card fill, labels on the card's secondary fill, inside the control
// corner radius.
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/TextBlock_themeresources.xaml#L3-L9
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/Common_themeresources_any.xaml#L254-L257
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/Common_themeresources_any.xaml#L250-L265

// A container query rather than a viewport one: a list in a side panel narrows
// with its panel, not with the window. 480 is where two columns of values stop
// fitting a sentence each, and 720 the same for three; both are ours.
// https://drafts.csswg.org/css-contain-3/#size-container
const NARROW = '@container fwt-property-list (width < 480px)';
const MEDIUM = '@container fwt-property-list (480px <= width < 720px)';

const useStyles = makeStyles({
  container: {
    containerName: 'fwt-property-list',
    containerType: 'inline-size',
    minWidth: 0,
  },
  // Cell lines are each cell's own right and bottom edge. The list is pulled
  // 1px past the frame on those two sides so the last column's and last row's
  // lines fall under the frame's clip and the frame's own border stands in.
  frame: {
    ...shorthands.border('1px', 'solid', 'var(--winui-divider-stroke-default)'),
    borderRadius: 'var(--winui-control-corner-radius)',
    overflow: 'hidden',
  },
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(var(--fwt-property-columns, 2), minmax(0, 1fr))',
    margin: 0,
    columnGap: '24px',
    rowGap: '12px',
    [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
  listWrapsToTwo: {
    [MEDIUM]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  },
  listBordered: {
    columnGap: 0,
    rowGap: 0,
    marginRight: '-1px',
    marginBottom: '-1px',
  },
  item: {
    display: 'grid',
    gridColumn: 'span var(--fwt-span, 1)',
    minWidth: 0,
    rowGap: '2px',
    [NARROW]: { '&[data-wide]': { gridColumn: '1 / -1' } },
  },
  itemWrapsToTwo: {
    [MEDIUM]: { '&[data-wide]': { gridColumn: '1 / -1' } },
  },
  itemBordered: {
    borderBottom: '1px solid var(--winui-divider-stroke-default)',
    borderRight: '1px solid var(--winui-divider-stroke-default)',
    gridTemplateColumns: 'var(--fwt-property-label-width, 120px) minmax(0, 1fr)',
    rowGap: 0,
  },
  label: {
    color: 'var(--winui-text-fill-secondary)',
    fontSize: 'var(--fontSizeBase200)',
    lineHeight: 'var(--lineHeightBase200)',
    margin: 0,
    minWidth: 0,
  },
  value: {
    color: 'var(--winui-text-fill-primary)',
    fontSize: 'var(--fontSizeBase300)',
    lineHeight: 'var(--lineHeightBase300)',
    margin: 0,
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
  labelBordered: {
    backgroundColor: 'var(--winui-card-background-fill-secondary)',
    borderRight: '1px solid var(--winui-divider-stroke-default)',
    fontSize: 'var(--fontSizeBase300)',
    lineHeight: 'var(--lineHeightBase300)',
    padding: '8px 12px',
  },
  valueBordered: {
    backgroundColor: 'var(--winui-card-background-fill-default)',
    padding: '8px 12px',
  },
});

export interface PropertyListItem {
  label: ReactNode;
  value: ReactNode;
  /** How many columns the item takes, clamped to `columns`. Defaults to 1. */
  span?: number;
  /** React key, for items whose label is not text. Defaults to the index. */
  key?: string;
}

export interface PropertyListProps {
  items: readonly PropertyListItem[];
  /** Columns at full width. At under 720px a list of three or more steps down to two, and at under 480px to one. Defaults to 2. */
  columns?: number;
  /** Draws every pair as a cell of a ruled grid, labels on a tinted ground. */
  bordered?: boolean;
  className?: string;
}

/** Label and value pairs in a grid: the stand-in for a descriptions table. */
export function PropertyList({ bordered, className, columns = 2, items }: PropertyListProps) {
  const styles = useStyles();
  const columnCount = Math.max(1, Math.floor(columns));
  const stepsDown = columnCount > 2;

  const list = <dl
    className={mergeClasses(styles.list, stepsDown && styles.listWrapsToTwo, bordered && styles.listBordered)}
  >
    {items.map((item, index) => {
      const span = Math.min(Math.max(1, Math.floor(item.span ?? 1)), columnCount);
      return <div
        className={mergeClasses(styles.item, stepsDown && styles.itemWrapsToTwo, bordered && styles.itemBordered)}
        data-wide={span > 1 ? '' : undefined}
        key={item.key ?? index}
        style={{ '--fwt-span': span } as CSSProperties}
      >
        <dt className={mergeClasses(styles.label, bordered && styles.labelBordered)}>{item.label}</dt>
        <dd className={mergeClasses(styles.value, bordered && styles.valueBordered)}>{item.value}</dd>
      </div>;
    })}
  </dl>;

  return <div
    className={mergeClasses(styles.container, bordered && styles.frame, className)}
    style={{ '--fwt-property-columns': columnCount } as CSSProperties}
  >{list}</div>;
}
