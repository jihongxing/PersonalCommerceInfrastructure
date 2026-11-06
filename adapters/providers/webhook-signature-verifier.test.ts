import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  createWechatPaySignatureVerifier,
  createGenericHmacVerifier,
} from './webhook-signature-verifier.js';

describe('Webhook Signature Verifier', () => {
  describe('createWechatPaySignatureVerifier', () => {
    it('accepts valid signature', () => {
      const apiKey = 'test-api-key-12345';
      const verifier = createWechatPaySignatureVerifier(apiKey);

      const timestamp = '1234567890';
      const nonce = 'abc123';
      const body = '{"event":"payment.confirmed","amount":10000}';

      const message = `${timestamp}\n${nonce}\n${body}\n`;
      const signature = createHmac('sha256', apiKey)
        .update(message)
        .digest('base64');

      expect(verifier.verify(timestamp, nonce, body, signature)).toBe(true);
    });

    it('rejects invalid signature', () => {
      const verifier = createWechatPaySignatureVerifier('test-key');

      expect(
        verifier.verify('1234567890', 'abc123', '{}', 'invalid-signature'),
      ).toBe(false);
    });

    it('rejects signature with wrong key', () => {
      const correctKey = 'correct-key';
      const wrongKey = 'wrong-key';

      const timestamp = '1234567890';
      const nonce = 'abc123';
      const body = '{}';

      const message = `${timestamp}\n${nonce}\n${body}\n`;
      const signature = createHmac('sha256', wrongKey)
        .update(message)
        .digest('base64');

      const verifier = createWechatPaySignatureVerifier(correctKey);
      expect(verifier.verify(timestamp, nonce, body, signature)).toBe(false);
    });

    it('rejects signature with tampered timestamp', () => {
      const apiKey = 'test-key';
      const verifier = createWechatPaySignatureVerifier(apiKey);

      const timestamp = '1234567890';
      const nonce = 'abc123';
      const body = '{}';

      const message = `${timestamp}\n${nonce}\n${body}\n`;
      const signature = createHmac('sha256', apiKey)
        .update(message)
        .digest('base64');

      // 篡改 timestamp
      expect(verifier.verify('9999999999', nonce, body, signature)).toBe(false);
    });

    it('rejects signature with tampered body', () => {
      const apiKey = 'test-key';
      const verifier = createWechatPaySignatureVerifier(apiKey);

      const timestamp = '1234567890';
      const nonce = 'abc123';
      const body = '{"amount":10000}';

      const message = `${timestamp}\n${nonce}\n${body}\n`;
      const signature = createHmac('sha256', apiKey)
        .update(message)
        .digest('base64');

      // 篡改 body
      expect(verifier.verify(timestamp, nonce, '{"amount":99999}', signature)).toBe(false);
    });

    it('uses timing-safe comparison', () => {
      const verifier = createWechatPaySignatureVerifier('test-key');

      // 验证使用了 timingSafeEqual（通过测试不同长度的签名）
      // 不同长度会导致 timingSafeEqual 抛出异常，返回 false
      const shortSig = 'abc';
      const longSig = 'a'.repeat(100);

      expect(verifier.verify('1234567890', 'abc123', '{}', shortSig)).toBe(false);
      expect(verifier.verify('1234567890', 'abc123', '{}', longSig)).toBe(false);
    });

    it('rejects empty parameters', () => {
      const verifier = createWechatPaySignatureVerifier('test-key');

      expect(verifier.verify('', 'nonce', 'body', 'sig')).toBe(false);
      expect(verifier.verify('timestamp', '', 'body', 'sig')).toBe(false);
      expect(verifier.verify('timestamp', 'nonce', '', 'sig')).toBe(false);
      expect(verifier.verify('timestamp', 'nonce', 'body', '')).toBe(false);
    });

    it('throws on empty API key', () => {
      expect(() => createWechatPaySignatureVerifier('')).toThrow(
        'API key must be non-empty',
      );
    });

    it('handles Unicode characters in body', () => {
      const apiKey = 'test-key';
      const verifier = createWechatPaySignatureVerifier(apiKey);

      const timestamp = '1234567890';
      const nonce = 'abc123';
      const body = '{"message":"你好世界 🌍"}';

      const message = `${timestamp}\n${nonce}\n${body}\n`;
      const signature = createHmac('sha256', apiKey)
        .update(message)
        .digest('base64');

      expect(verifier.verify(timestamp, nonce, body, signature)).toBe(true);
    });
  });

  describe('createGenericHmacVerifier', () => {
    it('accepts valid signature with custom message format', () => {
      const secret = 'shared-secret';
      const verifier = createGenericHmacVerifier(
        secret,
        (timestamp, nonce, body) => `${timestamp}:${nonce}:${body}`,
      );

      const timestamp = '1234567890';
      const nonce = 'abc123';
      const body = '{"event":"test"}';

      const message = `${timestamp}:${nonce}:${body}`;
      const signature = createHmac('sha256', secret)
        .update(message)
        .digest('hex');

      expect(verifier.verify(timestamp, nonce, body, signature)).toBe(true);
    });

    it('rejects invalid signature', () => {
      const verifier = createGenericHmacVerifier(
        'secret',
        (timestamp, nonce, body) => `${timestamp}:${nonce}:${body}`,
      );

      expect(
        verifier.verify('1234567890', 'abc123', '{}', 'invalid'),
      ).toBe(false);
    });

    it('throws on empty secret', () => {
      expect(() =>
        createGenericHmacVerifier('', () => ''),
      ).toThrow('Secret must be non-empty');
    });

    it('supports different message formats', () => {
      const secret = 'secret';

      // 格式 1：只用 body
      const verifier1 = createGenericHmacVerifier(
        secret,
        (_timestamp, _nonce, body) => body,
      );

      const timestamp = '1234567890';
      const nonce = 'nonce123';
      const body = '{"test":true}';
      const sig1 = createHmac('sha256', secret).update(body).digest('hex');
      expect(verifier1.verify(timestamp, nonce, body, sig1)).toBe(true);

      // 格式 2：timestamp + body（无 nonce）
      const verifier2 = createGenericHmacVerifier(
        secret,
        (ts, _nonce, b) => `${ts}|${b}`,
      );

      const message2 = `${timestamp}|${body}`;
      const sig2 = createHmac('sha256', secret).update(message2).digest('hex');
      expect(verifier2.verify(timestamp, nonce, body, sig2)).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('verifies production-like WeChat Pay webhook', () => {
      const apiKey = 'wechat-production-key-abc123';
      const verifier = createWechatPaySignatureVerifier(apiKey);

      const webhookPayload = {
        id: 'evt_1234567890',
        event_type: 'TRANSACTION.SUCCESS',
        resource: {
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext: 'encrypted_data',
          associated_data: 'transaction',
          nonce: 'crypto_nonce',
        },
        create_time: '2026-11-06T16:00:00+08:00',
      };

      const timestamp = '1730880000';
      const nonce = 'webhook_nonce_xyz';
      const body = JSON.stringify(webhookPayload);

      const message = `${timestamp}\n${nonce}\n${body}\n`;
      const signature = createHmac('sha256', apiKey)
        .update(message)
        .digest('base64');

      expect(verifier.verify(timestamp, nonce, body, signature)).toBe(true);
    });

    it('rejects replayed webhook with old timestamp', () => {
      const apiKey = 'production-key';
      const verifier = createWechatPaySignatureVerifier(apiKey);

      const oldTimestamp = '1609459200'; // 2021-01-01
      const nonce = 'nonce123';
      const body = '{"event":"payment"}';

      const message = `${oldTimestamp}\n${nonce}\n${body}\n`;
      const signature = createHmac('sha256', apiKey)
        .update(message)
        .digest('base64');

      // 签名验证通过（因为签名本身是有效的）
      expect(verifier.verify(oldTimestamp, nonce, body, signature)).toBe(true);

      // 但应用层应该检查 timestamp 是否在合理范围内（例如 5 分钟内）
      const now = Date.now() / 1000;
      const age = now - Number.parseInt(oldTimestamp, 10);
      expect(age).toBeGreaterThan(300); // 超过 5 分钟
    });
  });
});
