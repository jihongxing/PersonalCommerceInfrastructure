import { ApplicationError } from './application-error.js';

export interface AccountContext {
  readonly accountId: string;
  readonly correlationId: string;
}

export function createAccountContext(context: AccountContext): AccountContext {
  if (context.accountId.trim().length === 0) {
    throw new ApplicationError({
      category: 'authentication',
      code: 'account_not_found',
      message: 'An authenticated Account is required.',
    });
  }
  if (context.correlationId.trim().length === 0) {
    throw new ApplicationError({
      category: 'validation',
      code: 'missing_correlation_id',
      message: 'Account context requires a correlation id.',
    });
  }

  return Object.freeze({ ...context });
}
