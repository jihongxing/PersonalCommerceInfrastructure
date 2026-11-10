import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResendPasswordResetDelivery } from '../../adapters/notifications/resend-password-reset-delivery.js';

afterEach(() => vi.unstubAllGlobals());

describe('password reset mail adapter', () => {
  it('sends a fragment link to the configured HTTPS origin', async () => {
    const fetchMock = vi.fn((_url: string, _options: RequestInit) => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const delivery = new ResendPasswordResetDelivery(
      'test-key',
      'sender@example.test',
      'https://example.test',
    );
    await delivery.send('recipient@example.test', 'test-token');
    const [endpoint, options] = fetchMock.mock.calls[0]!;
    expect(endpoint).toBe('https://api.resend.com/emails');
    expect(new Headers(options.headers).get('Idempotency-Key')).toMatch(
      /^password-reset\/[a-f0-9]{64}$/,
    );
    const body = JSON.parse(String(options.body)) as { text: string; to: string[] };
    expect(body.to).toEqual(['recipient@example.test']);
    expect(body.text).toContain('https://example.test/auth/reset-password#token=test-token');
  });

  it('rejects untrusted origins and provider failures without exposing their content', async () => {
    expect(() => new ResendPasswordResetDelivery('key', 'sender', 'http://example.test')).toThrow();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(
      new ResendPasswordResetDelivery('key', 'sender', 'https://example.test').send(
        'a@example.test',
        'secret',
      ),
    ).rejects.toThrow('Password recovery delivery failed.');
  });
});
