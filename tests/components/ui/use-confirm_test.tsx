import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConfirmDialogProvider, useConfirm } from '../../../src/components/ui/use-confirm';
import type { ConfirmOptions } from '../../../src/components/ui/use-confirm';
import { renderInApp } from '../../render';
import { settle } from '../../settle';

const BASE: ConfirmOptions = { title: 'Delete key', message: 'Really?', actionLabel: 'Delete' };

function Harness({ options, onResult }: { options: ConfirmOptions[]; onResult: (index: number, ok: boolean) => void }) {
  const confirm = useConfirm();
  return <button onClick={() => options.forEach((o, i) => { void confirm(o).then(ok => onResult(i, ok)); })}>ask</button>;
}

const mount = (options: ConfirmOptions[]) => {
  const results: Record<number, boolean> = {};
  renderInApp(<ConfirmDialogProvider><Harness onResult={(i, ok) => { results[i] = ok; }} options={options} /></ConfirmDialogProvider>);
  fireEvent.click(screen.getByText('ask'));
  return results;
};

describe('useConfirm', () => {
  it('resolves true on the action', async () => {
    const results = mount([BASE]);
    expect(await screen.findByText('Really?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(results[0]).toBe(true));
  });

  it('resolves false on cancel', async () => {
    const results = mount([{ ...BASE, cancelLabel: 'Keep' }]);
    fireEvent.click(await screen.findByRole('button', { name: 'Keep' }));
    await waitFor(() => expect(results[0]).toBe(false));
  });

  it('holds the dialog busy until onConfirm resolves', async () => {
    let release: () => void = () => {};
    const results = mount([{ ...BASE, onConfirm: () => new Promise<void>(resolve => { release = resolve; }) }]);
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await settle();
    expect(results[0]).toBeUndefined();
    expect(screen.getByRole('button', { name: 'Cancel' }).hasAttribute('disabled')).toBe(true);
    release();
    await waitFor(() => expect(results[0]).toBe(true));
  });

  it('keeps the dialog open and shows the error when onConfirm rejects', async () => {
    let attempts = 0;
    const results = mount([{ ...BASE, onConfirm: async () => { if (attempts++ === 0) throw new Error('server said no'); } }]);
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('server said no')).toBeTruthy();
    expect(results[0]).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(results[0]).toBe(true));
  });

  it('queues concurrent calls', async () => {
    const results = mount([BASE, { ...BASE, message: 'Second?' }]);
    expect(await screen.findByText('Really?')).toBeTruthy();
    expect(screen.queryByText('Second?')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Second?')).toBeTruthy();
    await waitFor(() => expect(results[0]).toBe(true));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(results[1]).toBe(false));
  });

  it('throws outside the provider', () => {
    const Bare = () => { useConfirm(); return null; };
    const original = console.error;
    console.error = () => {};
    try {
      expect(() => renderInApp(<Bare />)).toThrow(/ConfirmDialogProvider/);
    } finally {
      console.error = original;
    }
  });
});
