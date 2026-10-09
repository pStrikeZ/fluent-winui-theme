import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WinuiRouterProvider } from '../../src/components/ui/route-link';
import { NavigationPane } from '../../src/shell/navigation-pane';
import { renderInApp } from '../render';

const groups = [
  { items: [{ value: '/home', label: 'Home', href: '/home' }] },
  { label: 'Admin', items: [{ value: '/users', label: 'Users', href: '/users' }] },
];

describe('NavigationPane', () => {
  it('renders groups as links and routes plain clicks through the host router', () => {
    const navigate = vi.fn();
    const onNavigate = vi.fn();
    renderInApp(
      <WinuiRouterProvider router={{ navigate }}>
        <NavigationPane groups={groups} label="Main" onNavigate={onNavigate} selectedValue="/home" />
      </WinuiRouterProvider>,
    );
    expect(screen.getByText('Admin')).toBeTruthy();
    const users = screen.getByRole('link', { name: 'Users' });
    expect(users.getAttribute('href')).toBe('/users');
    fireEvent.click(users, { button: 0 });
    expect(navigate).toHaveBeenCalledWith('/users');
    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it('runs an action item instead of navigating', () => {
    const onSelect = vi.fn();
    renderInApp(<NavigationPane
      footerItems={[{ value: 'sign-out', label: 'Sign out', onSelect }]}
      groups={groups}
      label="Main"
      selectedValue="/home"
    />);
    fireEvent.click(screen.getByText('Sign out'));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
