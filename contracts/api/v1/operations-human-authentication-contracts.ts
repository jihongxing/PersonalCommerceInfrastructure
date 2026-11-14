import { Type } from 'typebox';

// PCI-ENG-018-B/R1 Operations Login, Session and Logout use cases.
// Additive internal API; VS-01 Creator FRs remain unchanged. Permissions are the
// Founder-frozen first-operator allowlist, not a new permission registry.
export const OperationsLoginBodySchema = Type.Object(
  {
    loginIdentifier: Type.String({ minLength: 1, maxLength: 320 }),
    password: Type.String({ minLength: 1, maxLength: 4096 }),
  },
  { additionalProperties: false },
);

const sessionProperties = {
  principalId: Type.String({ minLength: 1 }),
  accountId: Type.String({ minLength: 1 }),
  sessionId: Type.String({ minLength: 1 }),
  permissions: Type.Array(Type.Union([Type.Literal('catalog:read'), Type.Literal('audit:read')])),
};
export const OperationsCurrentSessionResponseSchema = Type.Object(sessionProperties, {
  additionalProperties: false,
});
export const OperationsLoginResponseSchema = Type.Object(
  {
    ...sessionProperties,
    absoluteExpiresAt: Type.String({ minLength: 1 }),
    credential: Type.String({ pattern: '^[A-Za-z0-9_-]{43}$' }),
  },
  { additionalProperties: false },
);
