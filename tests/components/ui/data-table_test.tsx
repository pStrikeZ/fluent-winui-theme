import { fireEvent, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DataTable, type DataTableColumn, type DataTableProps } from '../../../src/components/ui/data-table';
import { renderInApp } from '../../render';

interface Item { id: string; name: string; age: number }

const items: Item[] = [
  { id: 'a', name: 'Carol', age: 41 },
  { id: 'b', name: 'Alice', age: 30 },
  { id: 'c', name: 'Bob', age: 25 },
  { id: 'd', name: 'Dave', age: 52 },
  { id: 'e', name: 'Eve', age: 38 },
];

const columns: DataTableColumn<Item>[] = [
  { key: 'name', title: 'Name', dataKey: 'name', sort: (a, b) => a.name.localeCompare(b.name) },
  { key: 'age', title: 'Age', render: row => `${row.age} years`, align: 'end' },
];

// Body rows only: the header row is the first, and a selection or chevron
// column precedes the name, so the name is found by its text.
const names = () => screen.getAllByRole('row').slice(1)
  .map(row => within(row).queryAllByRole('cell').map(cell => cell.textContent ?? '').find(text => /^[A-Z][a-z]+$/.test(text)))
  .filter((name): name is string => name !== undefined);

const table = (props: Partial<DataTableProps<Item>> = {}) =>
  <DataTable ariaLabel="People" columns={columns} rowKey={row => row.id} rows={items} {...props} />;

const rowBoxes = () => screen.getAllByRole('checkbox', { name: 'Select row' }) as HTMLInputElement[];

function Selectable() {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  return table({ selection: { isSelectable: row => row.id !== 'e', onChange: setSelectedKeys, selectedKeys } });
}

describe('data table', () => {
  it('renders cells from dataKey and render', () => {
    renderInApp(table());
    expect(names()).toEqual(['Carol', 'Alice', 'Bob', 'Dave', 'Eve']);
    expect(screen.getByText('41 years')).toBeTruthy();
  });

  it('shows the empty line when there are no rows, and a custom one when given', () => {
    const { unmount } = renderInApp(table({ rows: [] }));
    expect(screen.getByText('No data')).toBeTruthy();
    unmount();
    renderInApp(table({ empty: <span>Nothing here</span>, rows: [] }));
    expect(screen.getByText('Nothing here')).toBeTruthy();
  });

  it('cycles ascending, descending and back to the given order on a sortable header', () => {
    renderInApp(table());
    const header = screen.getByRole('columnheader', { name: 'Name' });
    expect(header.getAttribute('aria-sort')).toBe('none');
    expect(screen.getByRole('columnheader', { name: 'Age' }).getAttribute('aria-sort')).toBeNull();

    fireEvent.click(within(header).getByRole('button'));
    expect(names()).toEqual(['Alice', 'Bob', 'Carol', 'Dave', 'Eve']);
    expect(header.getAttribute('aria-sort')).toBe('ascending');

    fireEvent.click(within(header).getByRole('button'));
    expect(names()).toEqual(['Eve', 'Dave', 'Carol', 'Bob', 'Alice']);
    expect(header.getAttribute('aria-sort')).toBe('descending');

    fireEvent.click(within(header).getByRole('button'));
    expect(names()).toEqual(['Carol', 'Alice', 'Bob', 'Dave', 'Eve']);
  });

  it('sorts the whole data set before slicing it into pages', () => {
    renderInApp(table({ defaultSort: { key: 'name', direction: 'ascending' }, pagination: { pageSize: 2 } }));
    expect(names()).toEqual(['Alice', 'Bob']);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(names()).toEqual(['Carol', 'Dave']);
  });

  it('pages client-side with its own page state', () => {
    renderInApp(table({ pagination: { pageSize: 2 } }));
    expect(names()).toEqual(['Carol', 'Alice']);
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(names()).toEqual(['Eve']);
  });

  it('honours a controlled page and reports changes without moving itself', () => {
    const onPageChange = vi.fn();
    renderInApp(table({ pagination: { onPageChange, page: 2, pageSize: 2 } }));
    expect(names()).toEqual(['Bob', 'Dave']);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(names()).toEqual(['Bob', 'Dave']);
  });

  it('can hide the pager when everything fits on one page', () => {
    renderInApp(table({ pagination: { hideOnSinglePage: true, pageSize: 10 } }));
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('shows select-all as mixed when only some selectable rows are selected', () => {
    renderInApp(<Selectable />);
    const all = screen.getByRole('checkbox', { name: 'Select all rows' }) as HTMLInputElement;
    expect(all.checked).toBe(false);

    fireEvent.click(rowBoxes()[0]);
    expect(all.indeterminate || all.getAttribute('aria-checked') === 'mixed' || all.dataset.indeterminate !== undefined).toBe(true);

    // Every selectable row; the one marked unselectable stays out of the count.
    fireEvent.click(all);
    expect(rowBoxes().map(box => box.checked)).toEqual([true, true, true, true, false]);
    expect(rowBoxes()[4].disabled).toBe(true);
    expect(all.checked).toBe(true);

    fireEvent.click(all);
    expect(rowBoxes().every(box => !box.checked)).toBe(true);
  });

  it('selects one row at a time in single mode, without a select-all', () => {
    const onChange = vi.fn();
    renderInApp(table({ selection: { mode: 'single', onChange, selectedKeys: ['a'] } }));
    expect(screen.queryByRole('checkbox', { name: 'Select all rows' })).toBeNull();
    fireEvent.click(screen.getAllByRole('radio', { name: 'Select row' })[2]);
    expect(onChange).toHaveBeenCalledWith(['c']);
  });

  it('keeps selections made on other pages when select-all acts on this one', () => {
    const onChange = vi.fn();
    renderInApp(table({ pagination: { pageSize: 2 }, selection: { onChange, selectedKeys: ['e'] } }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(onChange).toHaveBeenCalledWith(['e', 'a', 'b']);
  });

  it('toggles expanded content from the chevron, uncontrolled', () => {
    renderInApp(table({ expandable: { isExpandable: row => row.id !== 'b', render: row => <p>Details for {row.name}</p> } }));
    expect(screen.getAllByRole('button', { name: 'Expand row' })).toHaveLength(4);

    fireEvent.click(screen.getAllByRole('button', { name: 'Expand row' })[0]);
    expect(screen.getByText('Details for Carol')).toBeTruthy();
    const collapse = screen.getByRole('button', { name: 'Collapse row' });
    expect(collapse.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(collapse);
    expect(screen.queryByText('Details for Carol')).toBeNull();
  });

  it('reports expansion changes and follows a controlled set', () => {
    const onExpandedChange = vi.fn();
    renderInApp(table({ expandable: { expandedKeys: ['c'], onExpandedChange, render: row => <p>Details for {row.name}</p> } }));
    expect(screen.getByText('Details for Bob')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Expand row' })[0]);
    expect(onExpandedChange).toHaveBeenCalledWith(['c', 'a']);
  });

  it('calls onRowClick but not for the selection or chevron controls', () => {
    const onRowClick = vi.fn();
    renderInApp(table({
      expandable: { render: () => null },
      onRowClick,
      selection: { onChange: () => {}, selectedKeys: [] },
    }));
    fireEvent.click(screen.getByText('Alice'));
    expect(onRowClick).toHaveBeenCalledWith(items[1], 1);
    onRowClick.mockClear();
    fireEvent.click(rowBoxes()[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Expand row' })[0]);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('marks the table busy while loading', () => {
    const { container } = renderInApp(table({ loading: true }));
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(screen.getByText('Loading')).toBeTruthy();
  });
});
