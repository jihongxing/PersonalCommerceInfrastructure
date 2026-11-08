import React, { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './context';
import { clearSession, getSession, setSession } from './session';
import { ProtectedRoute, UnauthenticatedRoute } from '@/components/auth/protected-route';
import Home from '@/app/page';

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => navigation }));

const expired = {
  accessToken: 'expired-access',
  refreshToken: 'valid-refresh',
  userEmail: 'user@example.test',
  expiresAt: 1,
};
const response = (status: number, body: object = {}) =>
  ({ status, ok: status < 400, json: async () => body }) as Response;

afterEach(() => {
  clearSession();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('session restoration', () => {
  it('blocks protected content on a server error and retries the preserved session', async () => {
    setSession(expired);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(500))
      .mockResolvedValueOnce(
        response(200, { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 60 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    render(
      <StrictMode>
        <AuthProvider>
          <ProtectedRoute>
            <p>workspace</p>
          </ProtectedRoute>
        </AuthProvider>
      </StrictMode>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('无法验证登录状态');
    expect(screen.queryByText('workspace')).not.toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(getSession()).toEqual(expired);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(await screen.findByText('workspace')).toBeInTheDocument();
    expect(getSession()?.accessToken).toBe('new-access');
  });

  it('clears a rejected refresh and shows the login route', async () => {
    setSession(expired);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(401)));
    render(
      <AuthProvider>
        <UnauthenticatedRoute>
          <p>login form</p>
        </UnauthenticatedRoute>
      </AuthProvider>,
    );
    expect(await screen.findByText('login form')).toBeInTheDocument();
    expect(getSession()).toBeNull();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('sends a restored user directly from home to the dashboard', async () => {
    setSession(expired);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response(200, {
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          expiresIn: 60,
        }),
      ),
    );
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>,
    );
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/dashboard'));
    expect(navigation.replace).not.toHaveBeenCalledWith('/auth/login');
  });
});
