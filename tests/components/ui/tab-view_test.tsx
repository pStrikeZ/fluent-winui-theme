import { fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { TabView, type TabViewItem } from '../../../src/components/ui/tab-view';
import { WinuiStringsProvider } from '../../../src/i18n/translation';
import { renderInApp } from '../../render';

const items: TabViewItem[] = [
  { value: 'a', header: 'Alpha', closable: true },
  { value: 'b', header: 'Beta', closable: true, closeLabel: 'Close Beta' },
  { value: 'c', header: 'Gamma', disabled: true },
  { value: 'd', header: 'Delta' },
];

function Harness({ onClose, onSelect }: { onClose?: (value: string) => void; onSelect?: (value: string) => void }) {
  const [selected, setSelected] = useState<string | null>('a');
  return <TabView
    ariaLabel="Workspaces"
    items={items}
    onClose={onClose}
    onSelect={value => { setSelected(value); onSelect?.(value); }}
    selectedValue={selected}
  />;
}

describe('TabView', () => {
  it('exposes a tablist of tabs with one tab stop on the selected tab', () => {
    renderInApp(<Harness />);
    expect(screen.getByRole('tablist', { name: 'Workspaces' })).toBeTruthy();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(tab => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false', 'false']);
    expect(tabs.map(tab => tab.tabIndex)).toEqual([0, -1, -1, -1]);
  });

  it('selects on click', () => {
    const onSelect = vi.fn();
    renderInApp(<Harness onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(onSelect).toHaveBeenCalledWith('b');
    expect(screen.getByRole('tab', { name: 'Beta' }).getAttribute('aria-selected')).toBe('true');
  });

  it('moves and selects with arrows, skipping disabled tabs and wrapping, and with Home and End', () => {
    const onSelect = vi.fn();
    renderInApp(<Harness onSelect={onSelect} />);
    const alpha = screen.getByRole('tab', { name: 'Alpha' });
    alpha.focus();
    fireEvent.keyDown(alpha, { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenLastCalledWith('b');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Beta' }));
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenLastCalledWith('d');
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenLastCalledWith('a');
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowLeft' });
    expect(onSelect).toHaveBeenLastCalledWith('d');
    fireEvent.keyDown(document.activeElement as Element, { key: 'Home' });
    expect(onSelect).toHaveBeenLastCalledWith('a');
    fireEvent.keyDown(document.activeElement as Element, { key: 'End' });
    expect(onSelect).toHaveBeenLastCalledWith('d');
  });

  it('closes by the close button without selecting the tab', () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();
    renderInApp(<Harness onClose={onClose} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close Beta' }));
    expect(onClose).toHaveBeenCalledWith('b');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('labels the close button from the strings table by default', () => {
    renderInApp(<WinuiStringsProvider locale="zh-Hans"><Harness /></WinuiStringsProvider>);
    expect(screen.getAllByRole('button', { name: '关闭标签页' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Close Beta' })).toBeTruthy();
  });

  it('closes a closable tab on middle click and not an unclosable one', () => {
    const onClose = vi.fn();
    renderInApp(<Harness onClose={onClose} />);
    fireEvent(screen.getByRole('tab', { name: 'Beta' }), new MouseEvent('auxclick', { bubbles: true, button: 1, cancelable: true }));
    expect(onClose).toHaveBeenCalledWith('b');
    onClose.mockClear();
    fireEvent(screen.getByRole('tab', { name: 'Delta' }), new MouseEvent('auxclick', { bubbles: true, button: 1, cancelable: true }));
    fireEvent(screen.getByRole('tab', { name: 'Alpha' }), new MouseEvent('auxclick', { bubbles: true, button: 0, cancelable: true }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes the focused closable tab on Ctrl+F4 and Delete', () => {
    const onClose = vi.fn();
    renderInApp(<Harness onClose={onClose} />);
    const alpha = screen.getByRole('tab', { name: 'Alpha' });
    fireEvent.keyDown(alpha, { ctrlKey: true, key: 'F4' });
    expect(onClose).toHaveBeenLastCalledWith('a');
    fireEvent.keyDown(screen.getByRole('button', { name: 'Close Beta' }), { key: 'Delete' });
    expect(onClose).toHaveBeenLastCalledWith('b');
    onClose.mockClear();
    fireEvent.keyDown(alpha, { key: 'F4' });
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Delta' }), { key: 'Delete' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('nests no button inside a button and keeps the close button out of the tab', () => {
    const { container } = renderInApp(<Harness />);
    expect(container.querySelectorAll('button button')).toHaveLength(0);
    for (const tab of screen.getAllByRole('tab')) expect(tab.querySelector('button')).toBeNull();
    const close = screen.getByRole('button', { name: 'Close Beta' });
    expect(close.closest('[role="tab"]')).toBeNull();
  });

  it('renders a footer after the tabs', () => {
    renderInApp(<TabView ariaLabel="x" footer={<span>footer</span>} items={items} onSelect={() => undefined} selectedValue={null} />);
    expect(screen.getByText('footer')).toBeTruthy();
    // With nothing selected the first enabled tab takes the tab stop.
    expect(screen.getByRole('tab', { name: 'Alpha' }).tabIndex).toBe(0);
  });
});
