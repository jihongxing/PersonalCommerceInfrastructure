import { describe, expect, it, vi } from 'vitest';
import { authService } from './service';
const post = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api/client', () => ({ apiClient: { POST: post } }));
vi.mock('@/lib/auth/session', () => ({ clearSession: vi.fn() }));

describe('BFF logout', () => {
  it('revokes the opaque server session through the BFF', async () => {
    post.mockResolvedValue({ data: { ok: true }, error: null, status: 200 });
    await expect(authService.logout()).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith('/api/v1/auth/logout');
  });
  it('treats an already expired session as logged out', async () => {
    post.mockResolvedValue({ data: null, error: { error: { code: 'invalid_session' } }, status: 401 });
    await expect(authService.logout()).resolves.toBeUndefined();
  });
});