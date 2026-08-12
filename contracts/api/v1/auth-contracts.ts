import { Type } from 'typebox';

export const AuthorizationHeaderSchema = Type.String({
  pattern: '^Bearer\\s+\\S+$',
  minLength: 8,
});

export const AuthenticationErrorCodes = [
  'missing_authorization',
  'invalid_authorization',
  'missing_access_token',
  'invalid_access_token',
  'creator_actor_not_mapped',
] as const;

export type AuthenticationErrorCode = (typeof AuthenticationErrorCodes)[number];
