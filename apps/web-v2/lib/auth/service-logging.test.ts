import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/api/client', () => ({ apiClient: { POST: vi.fn().mockResolvedValue({ error: { message: 'private-token' }, status: 401 }) } }));
vi.mock('@/lib/auth/session', () => ({ clearSession: vi.fn() }));

describe('authentication error logging', () => {
  it('rethrows errors without printing response credentials', async () => {
    const logging = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { authService } = await import('./service');
      await expect(authService.signup({ email: 'user@example.test', password: 'password', name: 'test' })).rejects.toThrow('private-token');
      await expect(authService.login({ email: 'user@example.test', password: 'password' })).rejects.toThrow('private-token');
      await expect(authService.refresh()).rejects.toThrow('private-token');
      await expect(authService.logout()).resolves.toBeUndefined();
      expect(logging.mock.calls).toEqual([['Signup error'], ['Login error'], ['Refresh error']]);
    } finally { logging.mockRestore(); }
  });
});