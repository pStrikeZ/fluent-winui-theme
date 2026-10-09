import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { pageFrameClassName, usePageFrames } from '../../src/shell/page-frames';
import { PAGE_LEAVE_ANIMATION } from '../../src/winui/page-transition.css';

const leaveEnd = (frame: { onAnimationEnd: (event: never) => void }) => {
  const target = {};
  frame.onAnimationEnd({ animationName: PAGE_LEAVE_ANIMATION, target, currentTarget: target } as never);
};

describe('usePageFrames', () => {
  it('shows the first page without a transition', () => {
    const { result } = renderHook(() => usePageFrames('home', 'home'));
    expect(result.current).toHaveLength(1);
    expect(pageFrameClassName(result.current[0]!)).toBe('');
  });

  it('holds the previous page while it leaves and enters the next one', () => {
    const { result, rerender } = renderHook(({ page, key }: { page: ReactNode; key: string }) => usePageFrames(page, key), {
      initialProps: { page: 'home', key: 'home' },
    });
    rerender({ page: 'settings', key: 'settings' });
    expect(result.current.map(frame => [frame.node, frame.leaving, pageFrameClassName(frame)])).toEqual([
      ['home', true, 'fwt-page-leaving'],
      ['settings', false, 'fwt-page-entering'],
    ]);
    act(() => leaveEnd(result.current[0]!));
    expect(result.current.map(frame => frame.node)).toEqual(['settings']);
  });

  it('updates the page in place while its key stays the same', () => {
    const { result, rerender } = renderHook(({ page, key }: { page: ReactNode; key: string }) => usePageFrames(page, key), {
      initialProps: { page: 'list?sort=a', key: 'list' },
    });
    const id = result.current[0]!.id;
    rerender({ page: 'list?sort=b', key: 'list' });
    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({ id, node: 'list?sort=b', leaving: false });
  });

  it('settles when the host builds a fresh page element on every render', () => {
    // AppShell wraps its children anew each render; comparing elements by
    // identity would set state on every render and never settle.
    const { result, rerender } = renderHook(({ key }: { key: string }) => usePageFrames(<div>{key}</div>, key), {
      initialProps: { key: 'home' },
    });
    rerender({ key: 'home' });
    rerender({ key: 'home' });
    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.id).toBe(0);
  });
});
