import { createHash } from 'node:crypto';
import type { PasswordResetDelivery } from '../../applications/account-identity-membership/local-auth-service.js';

export class ResendPasswordResetDelivery implements PasswordResetDelivery {
  private readonly origin: string;

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    publicOrigin: string,
  ) {
    const url = new URL(publicOrigin);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error('Password recovery requires an HTTPS public origin.');
    }
    if (!apiKey || !from) throw new Error('Password recovery mail configuration is incomplete.');
    this.origin = url.origin;
  }

  async send(email: string, token: string): Promise<void> {
    const link = new URL('/auth/reset-password', this.origin);
    link.hash = new URLSearchParams({ token }).toString();
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `password-reset/${createHash('sha256').update(token).digest('hex')}`,
      },
      body: JSON.stringify({
        from: this.from,
        to: [email],
        subject: '重置您的密码',
        text: `请在一小时内使用以下链接重置密码：\n${link.toString()}\n如果您没有发起此请求，请忽略此邮件。`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error('Password recovery delivery failed.');
  }
}
