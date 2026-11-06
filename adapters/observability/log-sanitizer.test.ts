import { describe, expect, it } from 'vitest';

import {
  sanitizePath,
  sanitizeBody,
  sanitizeHeaders,
} from './log-sanitizer.js';

describe('Log Sanitizer', () => {
  describe('sanitizePath', () => {
    it('sanitizes sensitive query parameters', () => {
      const path = '/api/auth?token=secret123&email=user@example.com&name=john';
      const sanitized = sanitizePath(path);

      expect(sanitized).toContain('token=***');
      expect(sanitized).toContain('email=***');
      expect(sanitized).toContain('name=john');
      expect(sanitized).not.toContain('secret123');
      expect(sanitized).not.toContain('user@example.com');
    });

    it('handles multiple sensitive parameters', () => {
      const path = '/api?password=pwd123&api_key=key456&access_token=token789';
      const sanitized = sanitizePath(path);

      expect(sanitized).toContain('password=***');
      expect(sanitized).toContain('api_key=***');
      expect(sanitized).toContain('access_token=***');
    });

    it('preserves non-sensitive parameters', () => {
      const path = '/api/users?userId=123&sort=name&limit=10';
      const sanitized = sanitizePath(path);

      expect(sanitized).toBe(path);
    });

    it('handles path without query string', () => {
      const path = '/api/users/123';
      expect(sanitizePath(path)).toBe(path);
    });

    it('handles empty path', () => {
      expect(sanitizePath('')).toBe('');
    });

    it('is case-insensitive for parameter names', () => {
      const path = '/api?Token=secret&EMAIL=user@test.com&Password=pwd';
      const sanitized = sanitizePath(path);

      // 参数名保持原始大小写，但值会被脱敏
      expect(sanitized).toContain('Token=***');
      expect(sanitized).toContain('EMAIL=***');
      expect(sanitized).toContain('Password=***');
    });

    it('handles URL-encoded values', () => {
      const path = '/api?email=user%40example.com&token=abc%3D123';
      const sanitized = sanitizePath(path);

      expect(sanitized).toContain('email=***');
      expect(sanitized).toContain('token=***');
    });
  });

  describe('sanitizeBody', () => {
    it('sanitizes sensitive body fields', () => {
      const body = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com',
      };

      const sanitized = sanitizeBody(body);

      expect(sanitized).toEqual({
        username: 'john',
        password: '***',
        email: 'john@example.com', // email 在 BODY 中不敏感（只在 query 中敏感）
      });
    });

    it('sanitizes nested objects', () => {
      const body = {
        user: {
          username: 'john',
          password: 'secret',
          profile: {
            idNumber: '123456789',
            age: 30,
          },
        },
      };

      const sanitized = sanitizeBody(body);

      expect(sanitized).toEqual({
        user: {
          username: 'john',
          password: '***',
          profile: {
            idNumber: '***',
            age: 30,
          },
        },
      });
    });

    it('sanitizes arrays', () => {
      const body = {
        users: [
          { username: 'alice', password: 'pwd1' },
          { username: 'bob', password: 'pwd2' },
        ],
      };

      const sanitized = sanitizeBody(body);

      expect(sanitized).toEqual({
        users: [
          { username: 'alice', password: '***' },
          { username: 'bob', password: '***' },
        ],
      });
    });

    it('preserves non-sensitive data', () => {
      const body = {
        username: 'john',
        age: 30,
        preferences: { theme: 'dark' },
      };

      expect(sanitizeBody(body)).toEqual(body);
    });

    it('handles null and undefined', () => {
      expect(sanitizeBody(null)).toBeNull();
      expect(sanitizeBody(undefined)).toBeUndefined();
    });

    it('handles primitives', () => {
      expect(sanitizeBody('string')).toBe('string');
      expect(sanitizeBody(123)).toBe(123);
      expect(sanitizeBody(true)).toBe(true);
    });

    it('is case-insensitive for field names', () => {
      const body = {
        Password: 'secret',
        APIKey: 'key123',
        id_number: '123456',
      };

      const sanitized = sanitizeBody(body);

      expect(sanitized).toEqual({
        Password: '***',
        APIKey: '***',
        id_number: '***',
      });
    });

    it('handles snake_case and camelCase field names', () => {
      const body = {
        api_key: 'key1',
        apiKey: 'key2',
        id_number: '123',
        idNumber: '456',
      };

      const sanitized = sanitizeBody(body);

      expect(sanitized).toEqual({
        api_key: '***',
        apiKey: '***',
        id_number: '***',
        idNumber: '***',
      });
    });

    it('sanitizes payment information', () => {
      const body = {
        cardNumber: '4111111111111111',
        cvv: '123',
        pin: '1234',
        expiryDate: '12/25',
      };

      const sanitized = sanitizeBody(body);

      expect(sanitized).toEqual({
        cardNumber: '***',
        cvv: '***',
        pin: '***',
        expiryDate: '12/25',
      });
    });

    it('does not mutate original object', () => {
      const body = {
        username: 'john',
        password: 'secret',
      };

      const original = JSON.parse(JSON.stringify(body));
      sanitizeBody(body);

      expect(body).toEqual(original);
    });
  });

  describe('sanitizeHeaders', () => {
    it('sanitizes authorization header', () => {
      const headers = {
        authorization: 'Bearer token123',
        'content-type': 'application/json',
      };

      const sanitized = sanitizeHeaders(headers);

      expect(sanitized).toEqual({
        authorization: '***',
        'content-type': 'application/json',
      });
    });

    it('sanitizes cookie header', () => {
      const headers = {
        cookie: 'session=abc123; user=john',
        'user-agent': 'Mozilla/5.0',
      };

      const sanitized = sanitizeHeaders(headers);

      expect(sanitized).toEqual({
        cookie: '***',
        'user-agent': 'Mozilla/5.0',
      });
    });

    it('sanitizes API key headers', () => {
      const headers = {
        'x-api-key': 'key123',
        'x-auth-token': 'token456',
        'x-access-token': 'access789',
      };

      const sanitized = sanitizeHeaders(headers);

      expect(sanitized).toEqual({
        'x-api-key': '***',
        'x-auth-token': '***',
        'x-access-token': '***',
      });
    });

    it('preserves non-sensitive headers', () => {
      const headers = {
        'content-type': 'application/json',
        'user-agent': 'test-client',
        'accept': 'application/json',
      };

      expect(sanitizeHeaders(headers)).toEqual(headers);
    });

    it('is case-insensitive for header names', () => {
      const headers = {
        Authorization: 'Bearer token',
        COOKIE: 'session=abc',
        'X-API-Key': 'key123',
      };

      const sanitized = sanitizeHeaders(headers);

      expect(sanitized).toEqual({
        Authorization: '***',
        COOKIE: '***',
        'X-API-Key': '***',
      });
    });
  });

  describe('real-world scenarios', () => {
    it('sanitizes login request', () => {
      const body = {
        email: 'user@example.com',
        password: 'mySecretPassword123',
        rememberMe: true,
      };

      const sanitized = sanitizeBody(body);

      expect(sanitized).toEqual({
        email: 'user@example.com',
        password: '***',
        rememberMe: true,
      });
    });

    it('sanitizes password reset request', () => {
      const path = '/api/auth/reset?token=reset-token-123&email=user@test.com';
      const sanitized = sanitizePath(path);

      expect(sanitized).not.toContain('reset-token-123');
      expect(sanitized).toContain('token=***');
    });

    it('sanitizes payment webhook', () => {
      const body = {
        event: 'payment.completed',
        data: {
          orderId: 'order-123',
          amount: 10000,
          paymentMethod: {
            type: 'card',
            last4: '1234',
            cardNumber: '4111111111111111', // 不应该在 webhook 中出现，但防御性脱敏
          },
        },
      };

      const sanitized = sanitizeBody(body);

      expect(sanitized).toMatchObject({
        event: 'payment.completed',
        data: {
          orderId: 'order-123',
          amount: 10000,
          paymentMethod: {
            type: 'card',
            last4: '1234',
            cardNumber: '***',
          },
        },
      });
    });

    it('sanitizes user profile update with ID card', () => {
      const body = {
        name: 'John Doe',
        age: 30,
        idNumber: '110101199001011234',
        address: 'Beijing',
      };

      const sanitized = sanitizeBody(body);

      expect(sanitized).toEqual({
        name: 'John Doe',
        age: 30,
        idNumber: '***',
        address: 'Beijing',
      });
    });
  });
});
