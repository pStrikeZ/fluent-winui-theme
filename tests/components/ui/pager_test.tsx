import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Pager, pagerPageCount, pagerPageWindow } from '../../../src/components/ui/pager';
import { renderInApp } from '../../render';

const isDisabled = (name: string) => (screen.getByRole('button', { name }) as HTMLButtonElement).disabled;

describe('pager paging math', () => {
  it('rounds the page count up and never drops below one page', () => {
    expect(pagerPageCount(0, 10)).toBe(1);
    expect(pagerPageCount(10, 10)).toBe(1);
    expect(pagerPageCount(11, 10)).toBe(2);
    expect(pagerPageCount(95, 10)).toBe(10);
    expect(pagerPageCount(5, 0)).toBe(1);
  });

  it('lists every page below eight', () => {
    expect(pagerPageWindow(1, 1)).toEqual([1]);
    expect(pagerPageWindow(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('follows the PagerControl ellipsis templates from eight pages up', () => {
    const n = 20;
    expect(pagerPageWindow(1, n)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', n]);
    expect(pagerPageWindow(4, n)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', n]);
    expect(pagerPageWindow(5, n)).toEqual([1, 'start-ellipsis', 4, 5, 6, 'end-ellipsis', n]);
    expect(pagerPageWindow(10, n)).toEqual([1, 'start-ellipsis', 9, 10, 11, 'end-ellipsis', n]);
    expect(pagerPageWindow(15, n)).toEqual([1, 'start-ellipsis', 14, 15, 16, 'end-ellipsis', n]);
    expect(pagerPageWindow(16, n)).toEqual([1, 'start-ellipsis', 15, 16, 17, 'end-ellipsis', n]);
    expect(pagerPageWindow(17, n)).toEqual([1, 'start-ellipsis', 16, 17, 18, 19, 20]);
    expect(pagerPageWindow(20, n)).toEqual([1, 'start-ellipsis', 16, 17, 18, 19, 20]);
    expect(pagerPageWindow(1, 8)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 8]);
    expect(pagerPageWindow(8, 8)).toEqual([1, 'start-ellipsis', 4, 5, 6, 7, 8]);
  });
});

describe('pager', () => {
  it('marks the current page and moves with the navigation buttons', () => {
    const onPageChange = vi.fn();
    renderInApp(<Pager onPageChange={onPageChange} page={5} pageCount={20} />);

    expect(screen.getByRole('button', { name: 'Page 5' }).getAttribute('aria-current')).toBe('page');
    expect(screen.queryByRole('button', { name: 'Page 7' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(6);
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
    fireEvent.click(screen.getByRole('button', { name: 'First page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Last page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(20);
    fireEvent.click(screen.getByRole('button', { name: 'Page 6' }));
    expect(onPageChange).toHaveBeenLastCalledWith(6);
  });

  it('disables the backward buttons on the first page and the forward ones on the last', () => {
    const { rerender } = renderInApp(<Pager onPageChange={() => {}} page={1} pageSize={10} total={30} />);
    expect(isDisabled('First page')).toBe(true);
    expect(isDisabled('Previous page')).toBe(true);
    expect(isDisabled('Next page')).toBe(false);

    rerender(<Pager onPageChange={() => {}} page={3} pageSize={10} total={30} />);
    expect(isDisabled('Next page')).toBe(true);
    expect(isDisabled('Last page')).toBe(true);
  });

  it('derives the page count from total and page size and shows the total label', () => {
    renderInApp(<Pager onPageChange={() => {}} page={1} pageSize={10} showTotal total={31} />);
    expect(screen.getByRole('button', { name: 'Page 4' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Page 5' })).toBeNull();
    expect(screen.getByText('Total 31 items')).toBeTruthy();
  });

  it('disables everything when disabled', () => {
    renderInApp(<Pager disabled onPageChange={() => {}} page={2} pageCount={5} />);
    for (const button of screen.getAllByRole('button')) expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('offers a page-size dropdown when it is given options and a handler', () => {
    const onPageSizeChange = vi.fn();
    renderInApp(<Pager onPageChange={() => {}} onPageSizeChange={onPageSizeChange} page={1} pageSize={10} pageSizeOptions={[10, 20, 50]} total={100} />);
    fireEvent.click(screen.getByRole('combobox', { name: 'Items per page' }));
    fireEvent.click(screen.getByRole('option', { name: '20 / page' }));
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });
});
