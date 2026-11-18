import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute, UnauthenticatedRoute } from '@/components/auth/protected-route';
import LoginClient from '@/app/(public)/auth/login/login-client';
import { safeReturnDestination } from './return-destination';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  auth: {
    isLoading: false,
    isAuthenticated: false,
    restoreError: false,
    retryRestore: vi.fn(),
    login: vi.fn().mockResolvedValue(undefined),
    clearError: vi.fn(),
    error: null,
  },
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('@/lib/auth/context', () => ({ useAuth: () => mocks.auth }));

afterEach(() => {
  vi.clearAllMocks();
  mocks.auth.isAuthenticated = false;
  window.history.replaceState({}, '', '/');
});

describe('authentication return destination', () => {
  it('preserves a protected route and query when sending a visitor to login', async () => {
    window.history.replaceState({}, '', '/profile?tab=public');
    render(<ProtectedRoute>profile</ProtectedRoute>);
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith('/auth/login?returnTo=%2Fprofile%3Ftab%3Dpublic'),
    );
  });

  it('returns a restored session to the requested route', async () => {
    window.history.replaceState({}, '', '/auth/login?returnTo=%2Fprofile%3Ftab%3Dpublic');
    mocks.auth.isAuthenticated = true;
    render(<UnauthenticatedRoute>login</UnauthenticatedRoute>);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/profile?tab=public'));
  });

  it('returns to the requested route after submitting login', async () => {
    window.history.replaceState({}, '', '/auth/login?returnTo=%2Fprofile%3Ftab%3Dpublic');
    render(<LoginClient />);
    fireEvent.change(screen.getByLabelText('邮箱地址'), { target: { value: 'user@example.test' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password' } });
    fireEvent.submit(screen.getByRole('button', { name: '登陆' }).closest('form')!);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/profile?tab=public'));
    expect(mocks.auth.login).toHaveBeenCalledWith('user@example.test', 'password');
  });

  it.each([
    null,
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/auth/login',
    '/profile/../../auth/login',
  ])('rejects an invalid destination: %s', (value) =>
    expect(safeReturnDestination(value)).toBe('/dashboard'),
  );

  it('preserves query and fragment for recognized routes', () => {
    expect(safeReturnDestination('/services/123/edit?from=list#details')).toBe(
      '/services/123/edit?from=list#details',
    );
  });

  it('returns to the Membership offering or workspace after login', () => {
    expect(safeReturnDestination('/membership/00000000-0000-0000-0000-000000000001')).toBe(
      '/membership/00000000-0000-0000-0000-000000000001',
    );
    expect(safeReturnDestination('/memberships')).toBe('/memberships');
  });
});
