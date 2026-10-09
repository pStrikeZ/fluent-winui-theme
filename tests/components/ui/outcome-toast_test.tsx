import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OutcomeToastProvider, useToast } from '../../../src/components/ui/outcome-toast';
import { renderInApp } from '../../render';
import { settle } from '../../settle';

// The toaster's live region repeats each message, so toasts are read off their titles.
const titles = () => [...document.querySelectorAll('.fui-ToastTitle')].map(node => node.textContent);

function Harness() {
  const toast = useToast();
  return <>
    <button onClick={() => toast.success('saved')}>s</button>
    <button onClick={() => toast.error('broken', { timeout: -1 })}>e</button>
    <button onClick={() => toast.warning('careful')}>w</button>
    <button onClick={() => { const close = toast.info('fyi', { timeout: -1 }); setTimeout(close, 0); }}>i</button>
  </>;
}

describe('useToast', () => {
  it('posts a toast per severity', async () => {
    renderInApp(<OutcomeToastProvider><Harness /></OutcomeToastProvider>);
    for (const name of ['s', 'e', 'w']) fireEvent.click(screen.getByText(name));
    await settle();
    expect(titles()).toContain('saved');
    expect(titles()).toContain('broken');
    expect(titles()).toContain('careful');
  });

  it('returns a dismisser', async () => {
    renderInApp(<OutcomeToastProvider><Harness /></OutcomeToastProvider>);
    fireEvent.click(screen.getByText('i'));
    await settle();
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    await settle();
    expect(titles()).not.toContain('fyi');
  });

  it('throws outside the provider', () => {
    const Bare = () => { useToast(); return null; };
    const original = console.error;
    console.error = () => {};
    try {
      expect(() => renderInApp(<Bare />)).toThrow(/OutcomeToastProvider/);
    } finally {
      console.error = original;
    }
  });
});
