import { describe, expect, it } from 'vitest';

import {
  BusinessError,
  InsufficientFundsError,
  DuplicateResourceError,
  ResourceNotFoundError,
  InvalidStateTransitionError,
  BusinessRuleViolationError,
  PaymentFailedError,
  ExternalServiceError,
  ValidationError,
  AuthorizationError,
  RateLimitExceededError,
  isBusinessError,
  getHttpStatusForBusinessError,
} from './business-error.js';

describe('Business Error', () => {
  describe('BusinessError', () => {
    it('creates error with code and message', () => {
      const error = new BusinessError('TEST_ERROR', 'Test error message');

      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.recoverable).toBe(true);
      expect(error.context).toBeUndefined();
    });

    it('creates error with context', () => {
      const error = new BusinessError(
        'TEST_ERROR',
        'Test error',
        true,
        { field: 'email', value: 'invalid' },
      );

      expect(error.context).toEqual({ field: 'email', value: 'invalid' });
    });

    it('has proper error name', () => {
      const error = new BusinessError('TEST_ERROR', 'Test');
      expect(error.name).toBe('BusinessError');
      expect(error instanceof Error).toBe(true);
    });

    it('serializes to JSON', () => {
      const error = new BusinessError(
        'TEST_ERROR',
        'Test error',
        false,
        { key: 'value' },
      );

      expect(error.toJSON()).toEqual({
        code: 'TEST_ERROR',
        message: 'Test error',
        recoverable: false,
        context: { key: 'value' },
      });
    });
  });

  describe('InsufficientFundsError', () => {
    it('creates error with requested and available amounts', () => {
      const error = new InsufficientFundsError(
        { currency: 'CNY', minor: 10000n },
        { currency: 'CNY', minor: 5000n },
      );

      expect(error.code).toBe('INSUFFICIENT_FUNDS');
      expect(error.message).toContain('10000');
      expect(error.message).toContain('5000');
      expect(error.required).toEqual({ currency: 'CNY', minor: 10000n });
      expect(error.available).toEqual({ currency: 'CNY', minor: 5000n });
      expect(error.recoverable).toBe(true);
    });
  });

  describe('DuplicateResourceError', () => {
    it('creates error with resource type and ID', () => {
      const error = new DuplicateResourceError('Order', 'order-123');

      expect(error.code).toBe('DUPLICATE_RESOURCE');
      expect(error.message).toBe('Order with identifier order-123 already exists');
      expect(error.resourceType).toBe('Order');
      expect(error.identifier).toBe('order-123');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('ResourceNotFoundError', () => {
    it('creates error with resource type and ID', () => {
      const error = new ResourceNotFoundError('User', 'user-456');

      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.message).toBe('User with identifier user-456 not found');
      expect(error.resourceType).toBe('User');
      expect(error.identifier).toBe('user-456');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('InvalidStateTransitionError', () => {
    it('creates error with aggregate, state, and action', () => {
      const error = new InvalidStateTransitionError('cancelled', 'shipped');

      expect(error.code).toBe('INVALID_STATE_TRANSITION');
      expect(error.message).toBe('Cannot transition from cancelled to shipped');
      expect(error.fromState).toBe('cancelled');
      expect(error.toState).toBe('shipped');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('BusinessRuleViolationError', () => {
    it('creates error with custom message and context', () => {
      const error = new BusinessRuleViolationError(
        'Cannot withdraw more than daily limit',
        { dailyLimit: 100000, requested: 150000 },
      );

      expect(error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(error.message).toBe('Cannot withdraw more than daily limit');
      expect(error.context).toEqual({ dailyLimit: 100000, requested: 150000 });
      expect(error.recoverable).toBe(true);
    });
  });

  describe('PaymentFailedError', () => {
    it('creates error with provider code and message', () => {
      const error = new PaymentFailedError(
        'CARD_DECLINED',
        'Insufficient funds on card',
      );

      expect(error.code).toBe('PAYMENT_FAILED');
      expect(error.message).toBe('Payment failed: Insufficient funds on card (CARD_DECLINED)');
      expect(error.providerCode).toBe('CARD_DECLINED');
      expect(error.providerMessage).toBe('Insufficient funds on card');
      expect(error.recoverable).toBe(true);
    });

    it('includes additional context', () => {
      const error = new PaymentFailedError(
        'FRAUD_DETECTED',
        'Transaction blocked',
        { transactionId: 'tx-789' },
      );

      expect(error.context).toMatchObject({
        providerCode: 'FRAUD_DETECTED',
        providerMessage: 'Transaction blocked',
        transactionId: 'tx-789',
      });
    });
  });

  describe('ExternalServiceError', () => {
    it('creates error with service details', () => {
      const error = new ExternalServiceError(
        'WeChat Pay',
        'SERVICE_UNAVAILABLE',
        'Payment provider is temporarily unavailable',
      );

      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.message).toContain('WeChat Pay');
      expect(error.message).toContain('SERVICE_UNAVAILABLE');
      expect(error.serviceName).toBe('WeChat Pay');
      expect(error.serviceCode).toBe('SERVICE_UNAVAILABLE');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('creates error with validation message', () => {
      const error = new ValidationError('Invalid email format', {
        field: 'email',
        value: 'invalid',
      });

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid email format');
      expect(error.context).toEqual({ field: 'email', value: 'invalid' });
      expect(error.recoverable).toBe(true);
    });
  });

  describe('AuthorizationError', () => {
    it('creates error with authorization message', () => {
      const error = new AuthorizationError('User does not have permission');

      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.message).toBe('User does not have permission');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('RateLimitExceededError', () => {
    it('creates error with rate limit details', () => {
      const error = new RateLimitExceededError(100, 60);

      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.recoverable).toBe(true);
      expect(error.limit).toBe(100);
      expect(error.windowSeconds).toBe(60);
      expect(error.recoverable).toBe(true);
    });
  });

  describe('isBusinessError', () => {
    it('returns true for BusinessError instances', () => {
      expect(isBusinessError(new BusinessError('TEST', 'test'))).toBe(true);
      expect(isBusinessError(new InsufficientFundsError(
        { currency: 'CNY', minor: 100n },
        { currency: 'CNY', minor: 50n },
      ))).toBe(true);
      expect(isBusinessError(new ResourceNotFoundError('User', '123'))).toBe(true);
    });

    it('returns false for non-BusinessError values', () => {
      expect(isBusinessError(new Error('regular error'))).toBe(false);
      expect(isBusinessError('string')).toBe(false);
      expect(isBusinessError(null)).toBe(false);
      expect(isBusinessError(undefined)).toBe(false);
      expect(isBusinessError({})).toBe(false);
    });
  });

  describe('getHttpStatusForBusinessError', () => {
    it('maps ResourceNotFoundError to 404', () => {
      const error = new ResourceNotFoundError('User', '123');
      expect(getHttpStatusForBusinessError(error)).toBe(404);
    });

    it('maps DuplicateResourceError to 409', () => {
      const error = new DuplicateResourceError('Order', '456');
      expect(getHttpStatusForBusinessError(error)).toBe(409);
    });

    it('maps InvalidStateTransitionError to 409', () => {
      const error = new InvalidStateTransitionError('Order', 'cancelled', 'refund');
      expect(getHttpStatusForBusinessError(error)).toBe(409);
    });

    it('maps AuthorizationError to 403', () => {
      const error = new AuthorizationError('No permission');
      expect(getHttpStatusForBusinessError(error)).toBe(403);
    });

    it('maps ValidationError to 400', () => {
      const error = new ValidationError('Invalid input');
      expect(getHttpStatusForBusinessError(error)).toBe(400);
    });

    it('maps InsufficientFundsError to 400', () => {
      const error = new InsufficientFundsError(
        { currency: 'CNY', minor: 100n },
        { currency: 'CNY', minor: 50n },
      );
      expect(getHttpStatusForBusinessError(error)).toBe(400);
    });

    it('maps PaymentFailedError to 402', () => {
      const error = new PaymentFailedError('DECLINED', 'Card declined');
      expect(getHttpStatusForBusinessError(error)).toBe(402);
    });

    it('maps RateLimitExceededError to 429', () => {
      const error = new RateLimitExceededError(100, 60);
      expect(getHttpStatusForBusinessError(error)).toBe(429);
    });

    it('maps ExternalServiceError to 502', () => {
      const error = new ExternalServiceError('Provider', 'ERROR', 'Failed');
      expect(getHttpStatusForBusinessError(error)).toBe(502);
    });

    it('defaults to 400 for recoverable errors', () => {
      const error = new BusinessError('CUSTOM_ERROR', 'Custom', true);
      expect(getHttpStatusForBusinessError(error)).toBe(400);
    });

    it('defaults to 500 for non-recoverable errors', () => {
      const error = new BusinessError('CUSTOM_ERROR', 'Custom', false);
      expect(getHttpStatusForBusinessError(error)).toBe(500);
    });
  });

  describe('error inheritance', () => {
    it('all error types extend BusinessError', () => {
      const errors = [
        new InsufficientFundsError({ currency: 'CNY', minor: 100n }, { currency: 'CNY', minor: 50n }),
        new DuplicateResourceError('Order', '123'),
        new ResourceNotFoundError('User', '456'),
        new InvalidStateTransitionError('Order', 'cancelled', 'refund'),
        new BusinessRuleViolationError('Rule violated'),
        new PaymentFailedError('DECLINED', 'Card declined'),
        new ExternalServiceError('Service', 'ERROR', 'Failed'),
        new ValidationError('Invalid'),
        new AuthorizationError('No permission'),
        new RateLimitExceededError(100, 60),
      ];

      for (const error of errors) {
        expect(error instanceof BusinessError).toBe(true);
        expect(error instanceof Error).toBe(true);
      }
    });
  });
});
