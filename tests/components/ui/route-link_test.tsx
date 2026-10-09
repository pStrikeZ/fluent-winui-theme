import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RouteLink, WinuiRouterProvider } from '../../../src/components/ui/route-link';
import { renderInApp } from '../../render';

describe('RouteLink', () => {
  it('is a plain link the browser follows when the host supplies no router', () => {
    renderInApp(<RouteLink to="/settings">Settings</RouteLink>);
    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link.getAttribute('href')).toBe('/settings');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
  });

  it('routes plain clicks in-app and leaves modified clicks to the browser', () => {
    const navigate = vi.fn();
    renderInApp(
      <WinuiRouterProvider router={{ navigate, href: to => `/app${to}` }}>
        <RouteLink to="/settings">Settings</RouteLink>
      </WinuiRouterProvider>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link.getAttribute('href')).toBe('/app/settings');
    fireEvent.click(link, { button: 0, ctrlKey: true });
    expect(navigate).not.toHaveBeenCalled();
    fireEvent.click(link, { button: 0 });
    expect(navigate).toHaveBeenCalledWith('/settings');
  });
});
