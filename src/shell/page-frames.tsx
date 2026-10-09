import { useState } from 'react';
import type { AnimationEventHandler, ReactNode } from 'react';

import { PAGE_LEAVE_ANIMATION } from '../winui/page-transition.css';

// Floway's page frames, without the router. Floway decides what counts as a page
// change from react-router's location and history entry, and freezes the router
// contexts so a leaving page keeps its loader data:
// https://github.com/Menci/Floway/blob/fee9533cc3ed5cba8028e53e53ca13d2e64d91af/apps/web/src/components/page-frames.tsx
// Here the host names the page with `pageKey`, which moves only on a page
// change -- never on a rewrite of the same page's query string -- and, if the
// leaving page reads context that the navigation has already replaced, wraps
// each page with what it needs to keep rendering.

export interface PageFrame {
  /** Stable while the page stays, new on a page change. */
  id: number;
  node: ReactNode;
  leaving: boolean;
  /**
   * Belongs on the element that carries the transition classes: the leaving
   * frame is dropped when its own leave animation ends, so its lifetime is the
   * animation's rather than a second statement of the animation's length.
   */
  onAnimationEnd: AnimationEventHandler<HTMLElement>;
}

/**
 * The frames to draw: the current page, and the page it replaced for as long as
 * that one takes to leave. Render each with `pageFrameClassName(frame)`.
 *
 * The leaving frame keeps the id it already had, so React matches it to the DOM
 * already on screen; held under a new id it would mount afresh, snap back to its
 * initial state and lose its scroll position before it fades.
 */
export const usePageFrames = (page: ReactNode, pageKey: string): PageFrame[] => {
  const [current, setCurrent] = useState({ id: 0, key: pageKey, node: page });
  const [leaving, setLeaving] = useState<{ id: number; node: ReactNode } | null>(null);

  if (current.key !== pageKey) {
    // Derived during render rather than in an effect: an effect lands a frame
    // later, and that frame would already show the new page where the old one
    // is supposed to still be.
    setLeaving({ id: current.id, node: current.node });
    setCurrent({ id: current.id + 1, key: pageKey, node: page });
  }

  // Dropped by the animation that fades it, not by a timer of the same length:
  // a clamped animation -- what reduced motion turns the fade into -- would
  // otherwise leave an invisible copy of the page mounted for the rest of the
  // timer. The page inside the frame animates too, so only this element's own
  // leave animation counts.
  const onAnimationEnd: AnimationEventHandler<HTMLElement> = event => {
    if (event.target !== event.currentTarget || event.animationName !== PAGE_LEAVE_ANIMATION) return;
    setLeaving(null);
  };

  const frames: PageFrame[] = [{ id: current.id, node: page, leaving: false, onAnimationEnd }];
  if (leaving) frames.unshift({ id: leaving.id, node: leaving.node, leaving: true, onAnimationEnd });
  return frames;
};

/** The transition class a frame carries: leaving, entering, or none for the first page. */
export const pageFrameClassName = (frame: PageFrame): string =>
  frame.leaving ? 'fwt-page-leaving' : frame.id > 0 ? 'fwt-page-entering' : '';
