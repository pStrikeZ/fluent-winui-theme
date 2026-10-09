import { ChevronDown16Regular, ChevronRight16Regular } from '@fluentui/react-icons';
import { useMemo, useState } from 'react';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

import { EmptyStateLine } from './empty-state';
import { Pager } from './pager';
import { ScrollArea } from './scroll-area';
import { stopRowSelection, TableCentredCell, TableCentredHeader, TableTrailingCell, TableTrailingHeader } from './table-actions';
import { TableColumns } from './table-columns';
import { fluentComponents } from '../../fluent';
import { useTranslation } from '../../i18n/translation';

const {
  Button, Spinner, Table, TableBody, TableCell, TableCellLayout, TableHeader, TableHeaderCell, TableRow, TableSelectionCell,
  mergeClasses,
} = fluentComponents;

export interface DataTableColumn<Row> {
  key: string;
  title: ReactNode;
  /** Any CSS length. A column without one shares what the sized columns leave. */
  width?: string;
  align?: 'start' | 'center' | 'end';
  /** `index` is the row's position on the page being shown, as antd passes it. */
  render?: (row: Row, index: number) => ReactNode;
  /** The cell's text when there is no `render`. */
  dataKey?: keyof Row;
  /** Makes the header sortable. Sorts the whole data set, before it is paged. */
  sort?: (a: Row, b: Row) => number;
  /** Trims an overlong cell to one line rather than wrapping it. */
  ellipsis?: boolean;
}

export interface DataTableSelection<Row> {
  selectedKeys: readonly string[];
  onChange: (keys: string[]) => void;
  /** `single` draws radio buttons and has no select-all. Defaults to `multiple`. */
  mode?: 'multiple' | 'single';
  isSelectable?: (row: Row) => boolean;
}

export interface DataTableExpandable<Row> {
  render: (row: Row) => ReactNode;
  isExpandable?: (row: Row) => boolean;
  /** Controlled when given; otherwise the table keeps the set itself. */
  expandedKeys?: readonly string[];
  onExpandedChange?: (keys: string[]) => void;
}

/**
 * `page` makes the current page controlled and `pageSize` is controlled as
 * soon as `onPageSizeChange` is given; without them the table keeps its own and
 * only reports changes.
 */
export interface DataTablePagination {
  pageSize: number;
  page?: number;
  onPageChange?: (page: number) => void;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
  showTotal?: boolean | ((total: number) => ReactNode);
  hideOnSinglePage?: boolean;
}

export type DataTableSortDirection = 'ascending' | 'descending';

export interface DataTableProps<Row> {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  selection?: DataTableSelection<Row>;
  expandable?: DataTableExpandable<Row>;
  pagination?: DataTablePagination | false;
  /** Initial sort for the uncontrolled header state. */
  defaultSort?: { key: string; direction: DataTableSortDirection };
  onSortChange?: (sort: { key: string; direction: DataTableSortDirection } | null) => void;
  empty?: ReactNode;
  loading?: boolean;
  size?: 'small' | 'medium';
  onRowClick?: (row: Row, index: number) => void;
  rowClassName?: (row: Row, index: number) => string | undefined;
  /** Below this the table stops shrinking and the region scrolls sideways. */
  minWidth?: number | string;
  ariaLabel?: string;
  className?: string;
}

// Fluent fixes the selection column at 44px, and the chevron column takes the
// same measure so the two lead columns read as one gutter.
// https://github.com/microsoft/fluentui/blob/c771f587c6634a356605e6d7d4658681f15d689b/packages/react-components/react-table/library/src/components/TableSelectionCell/useTableSelectionCellStyles.styles.ts
const LEADING_COLUMN_WIDTH = '44px';

const HEADER_BY_ALIGN = { center: TableCentredHeader, end: TableTrailingHeader, start: TableHeaderCell } as const;
const CELL_BY_ALIGN = { center: TableCentredCell, end: TableTrailingCell, start: TableCell } as const;

const toggle = (keys: readonly string[], key: string): string[] =>
  keys.includes(key) ? keys.filter(candidate => candidate !== key) : [...keys, key];

export function DataTable<Row>({
  ariaLabel,
  className,
  columns,
  defaultSort,
  empty,
  expandable,
  loading = false,
  minWidth,
  onRowClick,
  onSortChange,
  pagination,
  rowClassName,
  rowKey,
  rows,
  selection,
  size = 'medium',
}: DataTableProps<Row>) {
  const { t } = useTranslation();
  const [sort, setSort] = useState<{ key: string; direction: DataTableSortDirection } | null>(defaultSort ?? null);
  const [ownPage, setOwnPage] = useState(1);
  const [ownPageSize, setOwnPageSize] = useState<number | null>(null);
  const [ownExpanded, setOwnExpanded] = useState<readonly string[]>([]);

  const sortedRows = useMemo(() => {
    const column = sort && columns.find(candidate => candidate.key === sort.key);
    if (!sort || !column?.sort) return rows;
    const direction = sort.direction === 'ascending' ? 1 : -1;
    const compare = column.sort;
    // Array.prototype.sort is stable, so rows the comparator ties keep the
    // order they were given in.
    return [...rows].sort((a, b) => direction * compare(a, b));
  }, [columns, rows, sort]);

  const paged = pagination !== undefined && pagination !== false;
  const pageSize = !paged ? 0 : pagination.onPageSizeChange ? pagination.pageSize : ownPageSize ?? pagination.pageSize;
  const pageCount = paged ? Math.max(1, Math.ceil(sortedRows.length / Math.max(pageSize, 1))) : 1;
  const requestedPage = paged ? pagination.page ?? ownPage : 1;
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const visibleRows = paged ? sortedRows.slice((page - 1) * pageSize, page * pageSize) : sortedRows;

  const changePage = (next: number) => {
    setOwnPage(next);
    if (paged) pagination.onPageChange?.(next);
  };
  const changePageSize = (next: number) => {
    setOwnPageSize(next);
    setOwnPage(1);
    if (paged) {
      pagination.onPageSizeChange?.(next);
      pagination.onPageChange?.(1);
    }
  };

  const cycleSort = (column: DataTableColumn<Row>) => {
    // Ascending, then descending, then back to the given order -- antd's cycle.
    const next = sort?.key !== column.key ? { key: column.key, direction: 'ascending' as const }
      : sort.direction === 'ascending' ? { key: column.key, direction: 'descending' as const }
        : null;
    setSort(next);
    onSortChange?.(next);
    setOwnPage(1);
  };

  const selectedKeys = selection?.selectedKeys ?? [];
  const selectionMode = selection?.mode ?? 'multiple';
  const isSelectable = (row: Row) => selection?.isSelectable?.(row) ?? true;
  const selectableVisible = visibleRows.filter(isSelectable).map(rowKey);
  const selectedVisible = selectableVisible.filter(key => selectedKeys.includes(key));
  // Select-all speaks for the page on screen, the way a ListView's does for the
  // items it has realised, and leaves selections made on other pages alone.
  const allChecked: boolean | 'mixed' = selectedVisible.length === 0 ? false
    : selectedVisible.length === selectableVisible.length ? true : 'mixed';
  const toggleAll = () => {
    if (!selection) return;
    selection.onChange(allChecked === true
      ? selectedKeys.filter(key => !selectableVisible.includes(key))
      : [...selectedKeys, ...selectableVisible.filter(key => !selectedKeys.includes(key))]);
  };
  const selectRow = (key: string) => {
    if (!selection) return;
    selection.onChange(selectionMode === 'single' ? [key] : toggle(selectedKeys, key));
  };
  const stop = (event: MouseEvent) => event.stopPropagation();

  const expandedKeys = expandable?.expandedKeys ?? ownExpanded;
  const toggleExpanded = (key: string) => {
    const next = toggle(expandedKeys, key);
    setOwnExpanded(next);
    expandable?.onExpandedChange?.(next);
  };

  const columnCount = columns.length + (selection ? 1 : 0) + (expandable ? 1 : 0);
  const widths = [
    ...(selection ? [LEADING_COLUMN_WIDTH] : []),
    ...(expandable ? [LEADING_COLUMN_WIDTH] : []),
    ...columns.map(column => column.width ?? null),
  ];

  const tableStyle: CSSProperties | undefined = minWidth === undefined ? undefined : { minWidth };

  return <div className={mergeClasses('min-w-0', className)}>
    <div aria-busy={loading || undefined} className="relative min-w-0">
      <ScrollArea axes="horizontal" className="min-w-0">
        <Table aria-label={ariaLabel} size={size} style={tableStyle}>
          <TableColumns widths={widths} />
          <TableHeader>
            <TableRow>
              {selection && (selectionMode === 'multiple'
                ? <TableSelectionCell
                  checkboxIndicator={{ 'aria-label': t('dataTable.selectAll'), disabled: selectableVisible.length === 0 }}
                  checked={allChecked}
                  onClick={selectableVisible.length === 0 ? undefined : toggleAll}
                />
                : <TableHeaderCell />)}
              {expandable && <TableHeaderCell />}
              {columns.map(column => {
                const Header = HEADER_BY_ALIGN[column.align ?? 'start'];
                const sorted = sort?.key === column.key ? sort.direction : undefined;
                return <Header
                  key={column.key}
                  onClick={column.sort ? () => cycleSort(column) : undefined}
                  sortable={column.sort !== undefined}
                  sortDirection={sorted}
                >{column.title}</Header>;
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.length === 0 && <TableRow>
              <TableCell colSpan={columnCount}>
                {empty ?? <EmptyStateLine className="py-6 text-center">{t('dataTable.empty')}</EmptyStateLine>}
              </TableCell>
            </TableRow>}
            {visibleRows.flatMap((row, index) => {
              const key = rowKey(row);
              const selected = selectedKeys.includes(key);
              const expanded = expandable !== undefined && expandedKeys.includes(key);
              const canExpand = expandable !== undefined && (expandable.isExpandable?.(row) ?? true);
              const items: ReactNode[] = [<TableRow
                aria-selected={selection ? selected : undefined}
                className={mergeClasses(onRowClick && 'cursor-pointer', rowClassName?.(row, index))}
                key={key}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}
              >
                {selection && <TableSelectionCell
                  checkboxIndicator={{ 'aria-label': t('dataTable.selectRow'), disabled: !isSelectable(row) }}
                  checked={selected}
                  onClick={event => {
                    // A selection cell is a control, not a row-click target.
                    stop(event);
                    if (isSelectable(row)) selectRow(key);
                  }}
                  radioIndicator={{ 'aria-label': t('dataTable.selectRow'), disabled: !isSelectable(row) }}
                  type={selectionMode === 'single' ? 'radio' : 'checkbox'}
                />}
                {expandable && <TableCell {...stopRowSelection}>
                  {canExpand && <Button
                    appearance="subtle"
                    aria-expanded={expanded}
                    aria-label={t(expanded ? 'dataTable.collapseRow' : 'dataTable.expandRow')}
                    icon={expanded ? <ChevronDown16Regular /> : <ChevronRight16Regular />}
                    onClick={() => toggleExpanded(key)}
                    size="small"
                  />}
                </TableCell>}
                {columns.map(column => {
                  const Cell = CELL_BY_ALIGN[column.align ?? 'start'];
                  const content = column.render
                    ? column.render(row, index)
                    : column.dataKey === undefined ? null : (row[column.dataKey] as ReactNode);
                  return <Cell className={column.ellipsis ? 'overflow-hidden' : undefined} key={column.key}>
                    {column.ellipsis
                      ? <TableCellLayout title={typeof content === 'string' || typeof content === 'number' ? String(content) : undefined} truncate>{content}</TableCellLayout>
                      : content}
                  </Cell>;
                })}
              </TableRow>];
              if (expanded && canExpand) {
                items.push(<TableRow key={`${key}:expanded`}>
                  <TableCell colSpan={columnCount}>{expandable.render(row)}</TableCell>
                </TableRow>);
              }
              return items;
            })}
          </TableBody>
        </Table>
      </ScrollArea>
      {loading && <div
        className="absolute inset-0 grid place-items-center"
        style={{ background: 'color-mix(in srgb, var(--colorNeutralBackground1) 60%, transparent)' }}
      >
        <Spinner label={t('dataTable.loading')} size="small" />
      </div>}
    </div>
    {paged && !(pagination.hideOnSinglePage && pageCount <= 1) && <div className="flex justify-end px-3 py-1" style={{ borderTop: '1px solid var(--colorNeutralStroke3)' }}>
      <Pager
        onPageChange={changePage}
        onPageSizeChange={changePageSize}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        pageSizeOptions={pagination.pageSizeOptions}
        showTotal={pagination.showTotal}
        total={sortedRows.length}
      />
    </div>}
  </div>;
}
