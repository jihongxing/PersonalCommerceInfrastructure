import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import CreatorLayout from '@/app/(creator)/layout';
import { AuthProvider } from './context';
import { queryClient } from '@/lib/api/query-client';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/dashboard' }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  queryClient.clear();
});

it('keeps the Creator workspace and cache on logout failure, displays a retryable error, then exits only after confirmation', async () => {
  const response = (status: number, body: object) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(
        response(200, { authenticated: true, user: { email: 'test@example.test' } }),
      )
      .mockResolvedValueOnce(
        response(503, {
          error: { code: 'logout_incomplete', message: '注销未完成，服务暂不可用，请重试。' },
        }),
      )
      .mockResolvedValueOnce(response(200, { ok: true, state: 'already_revoked' })),
  );
  queryClient.setQueryData(['logout-preserve-test'], { privateData: 'retained' });
  render(
    <AuthProvider>
      <CreatorLayout>
        <p>private workspace</p>
      </CreatorLayout>
    </AuthProvider>,
  );
  expect(await screen.findByText('private workspace')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '退出登录' }));
  expect((await screen.findByRole('alert')).textContent).toContain('注销未完成');
  expect(screen.getByText('private workspace')).toBeTruthy();
  expect(router.push).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
  expect(queryClient.getQueryData(['logout-preserve-test'])).toEqual({ privateData: 'retained' });
  fireEvent.click(screen.getByRole('button', { name: '退出登录' }));
  await waitFor(() => expect(router.push).toHaveBeenCalledWith('/auth/login'));
  expect(queryClient.getQueryData(['logout-preserve-test'])).toBeUndefined();
});
