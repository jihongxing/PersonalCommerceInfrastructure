import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  apiClient: { POST: vi.fn().mockResolvedValue({ error: { message: 'private-token' } }) },
}));
vi.mock('@/lib/auth/session', () => ({ setSession: vi.fn(), clearSession: vi.fn() }));

describe('authentication error logging', () => {
  it('rethrows errors without printing their contents', async () => {
    const logging = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { authService } = await import('./service');
      await expect(
        authService.signup({ email: 'user@example.test', password: 'password', name: 'test' }),
      ).rejects.toThrow('private-token');
      await expect(
        authService.login({ email: 'user@example.test', password: 'password' }),
      ).rejects.toThrow('private-token');
      await expect(authService.refresh('refresh-token')).rejects.toThrow('private-token');
      await expect(authService.logout()).rejects.toThrow('private-token');
      expect(logging.mock.calls).toEqual([
        ['Signup error'],
        ['Login error'],
        ['Refresh error'],
        ['Logout error'],
      ]);
    } finally {
      logging.mockRestore();
    }
  });
});
