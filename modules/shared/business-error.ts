import type { Money } from '../../modules/paid-commerce/money-domain.js';

/**
 * Base class for business errors.
 * 
 * Business errors represent expected error conditions in the business domain
 * (e.g., insufficient funds, duplicate resource, invalid state transition).
 * These errors should be handled gracefully and presented to users.
 */
export class BusinessError extends Error {
  public override readonly name = 'BusinessError';

  constructor(
    public readonly code: string,
    message: string,
    public readonly recoverable: boolean = true,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BusinessError);
    }
  }

  /**
   * Returns a JSON representation of the error.
   * Useful for API responses and logging.
   */
  public toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
      context: this.context,
    };
  }
}

/**
 * Thrown when a user attempts an operation with insufficient funds.
 * 
 * @example
 * ```typescript
 * throw new InsufficientFundsError(
 *   { currency: 'CNY', minor: 10000n },
 *   { currency: 'CNY', minor: 5000n }
 * );
 * ```
 */
export class InsufficientFundsError extends BusinessError {
  constructor(
    public readonly required: Money,
    public readonly available: Money,
  ) {
    super(
      'INSUFFICIENT_FUNDS',
      `Insufficient funds: required ${required.minor} ${required.currency}, available ${available.minor} ${available.currency}`,
      true,
      { required, available },
    );
    Object.defineProperty(this, 'name', { value: 'InsufficientFundsError', enumerable: false });
  }
}

/**
 * Thrown when attempting to create a resource that already exists.
 * 
 * @example
 * ```typescript
 * throw new DuplicateResourceError('Commerce Reference', 'ABC123-DEF456-GHI789');
 * ```
 */
export class DuplicateResourceError extends BusinessError {
  constructor(
    public readonly resourceType: string,
    public readonly identifier: string,
  ) {
    super(
      'DUPLICATE_RESOURCE',
      `${resourceType} with identifier ${identifier} already exists`,
      false,
      { resourceType, identifier },
    );
    Object.defineProperty(this, 'name', { value: 'DuplicateResourceError', enumerable: false });
  }
}

/**
 * Thrown when a requested resource is not found.
 * 
 * @example
 * ```typescript
 * throw new ResourceNotFoundError('Order', 'order-123');
 * ```
 */
export class ResourceNotFoundError extends BusinessError {
  constructor(
    public readonly resourceType: string,
    public readonly identifier: string,
  ) {
    super(
      'RESOURCE_NOT_FOUND',
      `${resourceType} with identifier ${identifier} not found`,
      false,
      { resourceType, identifier },
    );
    Object.defineProperty(this, 'name', { value: 'ResourceNotFoundError', enumerable: false });
  }
}

/**
 * Thrown when an invalid state transition is attempted.
 * 
 * @example
 * ```typescript
 * throw new InvalidStateTransitionError('Order', 'cancelled', 'refund');
 * ```
 */
export class InvalidStateTransitionError extends BusinessError {
  constructor(
    public readonly fromState: string,
    public readonly toState: string,
    public readonly reason?: string,
  ) {
    super(
      'INVALID_STATE_TRANSITION',
      `Cannot transition from ${fromState} to ${toState}${reason ? `: ${reason}` : ''}`,
      false,
      { fromState, toState, reason },
    );
    Object.defineProperty(this, 'name', { value: 'InvalidStateTransitionError', enumerable: false });
  }
}

/**
 * Thrown when a business rule is violated.
 * 
 * @example
 * ```typescript
 * throw new BusinessRuleViolationError('Cannot withdraw more than daily limit', {
 *   dailyLimit: 100000,
 *   requested: 150000
 * });
 * ```
 */
export class BusinessRuleViolationError extends BusinessError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super('BUSINESS_RULE_VIOLATION', message, true, context);
    Object.defineProperty(this, 'name', { value: 'BusinessRuleViolationError', enumerable: false });
  }
}

/**
 * Thrown when a payment operation fails.
 * 
 * @example
 * ```typescript
 * throw new PaymentFailedError('CARD_DECLINED', 'Insufficient funds on card');
 * ```
 */
export class PaymentFailedError extends BusinessError {
  constructor(
    public readonly providerCode: string,
    public readonly providerMessage: string,
    context?: Record<string, unknown>,
  ) {
    super(
      'PAYMENT_FAILED',
      `Payment failed: ${providerMessage} (${providerCode})`,
      true,
      { providerCode, providerMessage, ...context },
    );
    Object.defineProperty(this, 'name', { value: 'PaymentFailedError', enumerable: false });
  }
}

/**
 * Thrown when external service integration fails.
 * 
 * @example
 * ```typescript
 * throw new ExternalServiceError('WeChat Pay', 'SERVICE_UNAVAILABLE', 'Payment provider is temporarily unavailable');
 * ```
 */
export class ExternalServiceError extends BusinessError {
  constructor(
    public readonly serviceName: string,
    public readonly serviceCode: string,
    public readonly serviceMessage: string,
  ) {
    super(
      'EXTERNAL_SERVICE_ERROR',
      `${serviceName} error: ${serviceMessage} (${serviceCode})`,
      true,
      { serviceName, serviceCode, serviceMessage },
    );
    Object.defineProperty(this, 'name', { value: 'ExternalServiceError', enumerable: false });
  }
}

/**
 * Thrown when a validation error occurs.
 * 
 * @example
 * ```typescript
 * throw new ValidationError('Invalid email format', { field: 'email', value: 'invalid' });
 * ```
 */
export class ValidationError extends BusinessError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super('VALIDATION_ERROR', message, true, context);
    Object.defineProperty(this, 'name', { value: 'ValidationError', enumerable: false });
  }
}

/**
 * Thrown when an authorization check fails.
 * 
 * @example
 * ```typescript
 * throw new AuthorizationError('User does not have permission to access this resource');
 * ```
 */
export class AuthorizationError extends BusinessError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super('AUTHORIZATION_ERROR', message, false, context);
    Object.defineProperty(this, 'name', { value: 'AuthorizationError', enumerable: false });
  }
}

/**
 * Thrown when rate limit is exceeded.
 * 
 * @example
 * ```typescript
 * throw new RateLimitExceededError('API', 100, 60);
 * ```
 */
export class RateLimitExceededError extends BusinessError {
  constructor(
    public readonly limit: number,
    public readonly windowSeconds: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(
      'RATE_LIMIT_EXCEEDED',
      `Rate limit exceeded: ${limit} requests per ${windowSeconds} seconds${retryAfterSeconds ? `. Retry after ${retryAfterSeconds}s` : ''}`,
      true,
      { limit, windowSeconds, retryAfterSeconds },
    );
    Object.defineProperty(this, 'name', { value: 'RateLimitExceededError', enumerable: false });
  }
}

/**
 * Type guard to check if an error is a BusinessError.
 */
export function isBusinessError(error: unknown): error is BusinessError {
  return error instanceof BusinessError;
}

/**
 * Maps HTTP status codes to business error types.
 */
export function getHttpStatusForBusinessError(error: BusinessError): number {
  if (error instanceof ResourceNotFoundError) {
    return 404;
  }
  if (error instanceof DuplicateResourceError) {
    return 409;
  }
  if (error instanceof InvalidStateTransitionError) {
    return 409;
  }
  if (error instanceof AuthorizationError) {
    return 403;
  }
  if (error instanceof ValidationError) {
    return 400;
  }
  if (error instanceof InsufficientFundsError) {
    return 400;
  }
  if (error instanceof BusinessRuleViolationError) {
    return 400;
  }
  if (error instanceof PaymentFailedError) {
    return 402;
  }
  if (error instanceof RateLimitExceededError) {
    return 429;
  }
  if (error instanceof ExternalServiceError) {
    return 502;
  }
  
  // Default for unknown business errors
  return error.recoverable ? 400 : 500;
}
