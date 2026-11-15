import { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './context';
import { ProtectedRoute, UnauthenticatedRoute } from '@/components/auth/protected-route';

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => navigation }));
const response = (status: number, body: object = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('BFF session restoration', () => {
  it('shows a retryable error when the session endpoint fails', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response(500)).mockResolvedValueOnce(response(200, { authenticated: true, user: { email: 'user@example.test' } }));
    vi.stubGlobal('fetch', fetchMock);
    render(<StrictMode><AuthProvider><ProtectedRoute><p>workspace</p></ProtectedRoute></AuthProvider></StrictMode>);
    expect(await screen.findByRole('alert')).toHaveTextContent('无法验证登录状态');
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(await screen.findByText('workspace')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not render authenticated routes when the BFF reports no session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, { authenticated: false, user: null })));
    render(<AuthProvider><UnauthenticatedRoute><p>login form</p></UnauthenticatedRoute></AuthProvider>);
    expect(await screen.findByText('login form')).toBeInTheDocument();
  });
});