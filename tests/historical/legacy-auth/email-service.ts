/**
 * 邮件服务
 * 
 * 支持多种邮件提供商 (Supabase Mail, SendGrid, NodeMailer 等)
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<void>;
}

/**
 * Supabase Mail 提供商
 */
export class SupabaseMailProvider implements EmailProvider {
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/send_email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey,
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          from: options.from || 'noreply@personal-commerce.com',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase Mail error: ${error}`);
      }
    } catch (error) {
      console.error('Failed to send email via Supabase:', error);
      throw error;
    }
  }
}

/**
 * SendGrid 提供商
 */
export class SendGridProvider implements EmailProvider {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('SendGrid API key not configured');
    }
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
            },
          ],
          from: {
            email: options.from || 'noreply@personal-commerce.com',
            name: 'Personal Commerce',
          },
          subject: options.subject,
          content: [
            {
              type: 'text/html',
              value: options.html || options.text || '',
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid error: ${error}`);
      }
    } catch (error) {
      console.error('Failed to send email via SendGrid:', error);
      throw error;
    }
  }
}

/**
 * 模拟邮件提供商 (用于测试和开发)
 */
export class MockMailProvider implements EmailProvider {
  private emails: EmailOptions[] = [];

  async send(options: EmailOptions): Promise<void> {
    this.emails.push(options);
    console.log(`[MOCK EMAIL] Sent to ${options.to}: ${options.subject}`);
  }

  getEmails(): EmailOptions[] {
    return this.emails;
  }

  clear(): void {
    this.emails = [];
  }
}

/**
 * 邮件服务工厂
 */
export function createEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'mock';

  switch (provider) {
    case 'sendgrid':
      return new SendGridProvider();
    case 'supabase':
      return new SupabaseMailProvider();
    case 'mock':
    default:
      return new MockMailProvider();
  }
}

/**
 * 全局邮件服务实例
 */
let emailProvider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!emailProvider) {
    emailProvider = createEmailProvider();
  }
  return emailProvider;
}

/**
 * 邮件服务
 */
export class EmailService {
  private provider: EmailProvider;

  constructor(provider?: EmailProvider) {
    this.provider = provider || getEmailProvider();
  }

  /**
   * 发送邮件
   */
  async send(options: EmailOptions): Promise<void> {
    // 验证邮箱地址
    if (!this.isValidEmail(options.to)) {
      throw new Error(`Invalid email address: ${options.to}`);
    }

    // 验证主题
    if (!options.subject || options.subject.trim().length === 0) {
      throw new Error('Email subject is required');
    }

    // 验证内容
    if ((!options.html || options.html.trim().length === 0) &&
        (!options.text || options.text.trim().length === 0)) {
      throw new Error('Email content (html or text) is required');
    }

    return this.provider.send(options);
  }

  /**
   * 验证邮箱地址
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * 创建邮件服务实例
 */
export function createEmailService(provider?: EmailProvider): EmailService {
  return new EmailService(provider);
}

/**
 * 全局邮件服务实例
 */
export const emailService = createEmailService();
