import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DeleteRegular } from '@fluentui/react-icons';

import { ConfirmFlyout } from '../../../src/components/ui/confirm-flyout';
import { TooltipIconButton } from '../../../src/components/ui/tooltip-icon-button';
import { renderInApp } from '../../render';
import { settle } from '../../settle';

const mount = (onConfirm: () => void | Promise<void>, extra: Partial<Parameters<typeof ConfirmFlyout>[0]> = {}) => {
  renderInApp(
    <ConfirmFlyout confirmLabel="Yes, delete" message="Delete it?" onConfirm={onConfirm} title="Sure?" {...extra}>
      <button>Delete</button>
    </ConfirmFlyout>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
};

describe('ConfirmFlyout', () => {
  it('opens from a TooltipIconButton trigger', async () => {
    renderInApp(
      <ConfirmFlyout confirmLabel="Yes, delete" message="Delete it?" onConfirm={() => {}}>
        <TooltipIconButton icon={<DeleteRegular />} label="Remove" onClick={() => {}} />
      </ConfirmFlyout>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Delete it?')).toBeTruthy();
  });

  it('opens from the trigger and confirms, closing afterwards', async () => {
    const onConfirm = vi.fn();
    mount(onConfirm);
    expect(await screen.findByText('Delete it?')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByText('Delete it?')).toBeNull());
  });

  it('closes on the optional cancel button without confirming', async () => {
    const onConfirm = vi.fn();
    mount(onConfirm, { cancelLabel: 'Never mind' });
    fireEvent.click(await screen.findByRole('button', { name: 'Never mind' }));
    await waitFor(() => expect(screen.queryByText('Delete it?')).toBeNull());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('is busy while pending and closes once it resolves', async () => {
    let release: () => void = () => {};
    mount(() => new Promise<void>(resolve => { release = resolve; }), { cancelLabel: 'Never mind' });
    fireEvent.click(await screen.findByRole('button', { name: 'Yes, delete' }));
    await settle();
    expect(screen.getByRole('button', { name: 'Yes, delete' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('button', { name: 'Never mind' }).hasAttribute('disabled')).toBe(true);
    release();
    await waitFor(() => expect(screen.queryByText('Delete it?')).toBeNull());
  });

  it('stays open and shows the error when it rejects', async () => {
    mount(async () => { throw new Error('nope'); });
    fireEvent.click(await screen.findByRole('button', { name: 'Yes, delete' }));
    expect(await screen.findByText('nope')).toBeTruthy();
    expect(screen.getByText('Delete it?')).toBeTruthy();
  });

  it('does not open when disabled', async () => {
    mount(vi.fn(), { disabled: true });
    await settle();
    expect(screen.queryByText('Delete it?')).toBeNull();
  });
});
