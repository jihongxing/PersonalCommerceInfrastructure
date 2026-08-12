import { ApplicationError } from '../../../applications/core/application-error.js';
import { Value } from 'typebox/value';

import { AuthorizationHeaderSchema } from '../../../contracts/api/v1/auth-contracts.js';

export function extractBearerToken(authorizationHeader: string | undefined): string {
  if (authorizationHeader === undefined) {
    throw new ApplicationError({
      category: 'authentication',
      code: 'missing_authorization',
      message: 'Authentication is required.',
    });
  }

  const normalizedHeader = authorizationHeader.trim();
  const match = /^Bearer\s+(\S+)$/iu.exec(normalizedHeader);

  if (match?.[1] === undefined) {
    throw new ApplicationError({
      category: 'authentication',
      code: 'invalid_authorization',
      message: 'Authentication could not be verified.',
    });
  }

  const canonicalHeader = `Bearer ${match[1]}`;

  if (!Value.Check(AuthorizationHeaderSchema, canonicalHeader)) {
    throw new ApplicationError({
      category: 'authentication',
      code: 'invalid_authorization',
      message: 'Authentication could not be verified.',
    });
  }

  return match[1];
}
