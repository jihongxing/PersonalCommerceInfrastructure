import { describe, expect, it, vi } from 'vitest';
import { authService } from './service';
import { clearSession } from './session';
const post = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api/client', () => ({ apiClient: { POST: post } }));
vi.mock('@/lib/auth/session', () => ({ clearSession: vi.fn() }));

describe('BFF logout', () => {
  it('revokes the opaque server session through the BFF', async () => {
    post.mockResolvedValue({ data: { ok: true, state: 'revoked' }, error: null, status: 200 });
    await expect(authService.logout()).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith('/api/v1/auth/logout');
  });
  it('does not discard local authentication on an ambiguous 401', async () => {
    vi.mocked(clearSession).mockClear();
    post.mockResolvedValue({
      data: null,
      error: { error: { code: 'invalid_session' } },
      status: 401,
    });
    await expect(authService.logout()).rejects.toThrow('注销未完成');
    expect(clearSession).not.toHaveBeenCalled();
  });

  it.each([503, 409, 0])('keeps authentication retryable on failure %s', async (status) => {
    vi.mocked(clearSession).mockClear();
    post.mockResolvedValue({ data: null, error: { message: '注销未完成，请重试。' }, status });
    await expect(authService.logout()).rejects.toThrow('注销未完成');
    expect(clearSession).not.toHaveBeenCalled();
  });

  it('requires explicit upstream confirmation even on HTTP 200', async () => {
    vi.mocked(clearSession).mockClear();
    post.mockResolvedValue({ data: { ok: true }, error: null, status: 200 });
    await expect(authService.logout()).rejects.toThrow('无法确认注销结果');
    expect(clearSession).not.toHaveBeenCalled();
  });
});
