/**
 * 邮件服务测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EmailService,
  MockMailProvider,
  SendGridProvider,
  SupabaseMailProvider,
  createEmailService,
  createEmailProvider,
} from '../lib/email/email-service';

describe('Email Service', () => {
  let emailService: EmailService;
  let mockProvider: MockMailProvider;

  beforeEach(() => {
    mockProvider = new MockMailProvider();
    emailService = new EmailService(mockProvider);
  });

  describe('send', () => {
    it('应该成功发送邮件', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Hello World</p>',
        text: 'Hello World',
      };

      await emailService.send(options);

      expect(mockProvider.getEmails()).toHaveLength(1);
      expect(mockProvider.getEmails()[0]).toEqual(options);
    });

    it('应该验证邮箱地址格式', async () => {
      const options = {
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      await expect(emailService.send(options)).rejects.toThrow('Invalid email address');
    });

    it('应该验证主题不为空', async () => {
      const options = {
        to: 'test@example.com',
        subject: '',
        html: '<p>Test</p>',
      };

      await expect(emailService.send(options)).rejects.toThrow('subject is required');
    });

    it('应该验证内容不为空', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test',
      };

      await expect(emailService.send(options)).rejects.toThrow('content (html or text) is required');
    });

    it('应该支持仅文本邮件', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test',
        text: 'Plain text email',
      };

      await emailService.send(options);

      expect(mockProvider.getEmails()).toHaveLength(1);
      expect(mockProvider.getEmails()[0].text).toBe('Plain text email');
    });

    it('应该支持仅 HTML 邮件', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>HTML email</p>',
      };

      await emailService.send(options);

      expect(mockProvider.getEmails()).toHaveLength(1);
      expect(mockProvider.getEmails()[0].html).toBe('<p>HTML email</p>');
    });

    it('应该支持自定义发件人地址', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        from: 'custom@example.com',
      };

      await emailService.send(options);

      expect(mockProvider.getEmails()[0].from).toBe('custom@example.com');
    });
  });

  describe('MockMailProvider', () => {
    it('应该存储发送的邮件', async () => {
      const provider = new MockMailProvider();

      await provider.send({
        to: 'test1@example.com',
        subject: 'Email 1',
        html: '<p>Test 1</p>',
      });

      await provider.send({
        to: 'test2@example.com',
        subject: 'Email 2',
        html: '<p>Test 2</p>',
      });

      const emails = provider.getEmails();
      expect(emails).toHaveLength(2);
      expect(emails[0].to).toBe('test1@example.com');
      expect(emails[1].to).toBe('test2@example.com');
    });

    it('应该能清除邮件列表', async () => {
      const provider = new MockMailProvider();

      await provider.send({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(provider.getEmails()).toHaveLength(1);

      provider.clear();

      expect(provider.getEmails()).toHaveLength(0);
    });
  });

  describe('Email validation', () => {
    it('应该验证多种有效的邮箱格式', async () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@example-domain.com',
      ];

      for (const email of validEmails) {
        const options = {
          to: email,
          subject: 'Test',
          html: '<p>Test</p>',
        };

        // 应该不抛出错误
        await expect(emailService.send(options)).resolves.not.toThrow();
      }
    });

    it('应该拒绝无效的邮箱格式', async () => {
      const invalidEmails = [
        'invalid',
        'user@',
        '@example.com',
        'user @example.com',
        'user@example',
      ];

      for (const email of invalidEmails) {
        const options = {
          to: email,
          subject: 'Test',
          html: '<p>Test</p>',
        };

        await expect(emailService.send(options)).rejects.toThrow('Invalid email address');
      }
    });
  });

  describe('Factory functions', () => {
    it('应该创建邮件服务实例', () => {
      const service = createEmailService();
      expect(service).toBeInstanceOf(EmailService);
    });

    it('应该创建邮件提供商实例', () => {
      const provider = createEmailProvider();
      expect(provider).toBeDefined();
    });

    it('应该支持自定义提供商', () => {
      const customProvider = new MockMailProvider();
      const service = createEmailService(customProvider);

      expect(service).toBeInstanceOf(EmailService);
    });
  });

  describe('Batch email sending', () => {
    it('应该能发送多封邮件', async () => {
      const recipients = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ];

      const subject = 'Test Batch';
      const html = '<p>Batch email</p>';

      for (const recipient of recipients) {
        await emailService.send({
          to: recipient,
          subject,
          html,
        });
      }

      expect(mockProvider.getEmails()).toHaveLength(3);
    });
  });
});
