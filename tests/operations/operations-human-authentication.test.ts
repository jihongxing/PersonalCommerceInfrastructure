import { describe, expect, it } from 'vitest';

import { Argon2idOperationsPasswordVerifier } from '../../adapters/auth/operations/argon2id-password-hasher.js';

describe('Operations Argon2id password verifier', () => {
  it('hashes and verifies a password without accepting short passwords', async () => {
    const verifier = new Argon2idOperationsPasswordVerifier();
    await expect(verifier.hash('short-password')).rejects.toThrow();
    const encoded = await verifier.hash('correct horse battery');
    expect(encoded).toMatch(/^\$argon2id\$/u);
    await expect(verifier.verify('correct horse battery', encoded)).resolves.toBe(true);
    await expect(verifier.verify('incorrect horse battery', encoded)).resolves.toBe(false);
  });
});
import { createActorContext } from '../../applications/core/actor-context.js';
import { createEncodedPasswordVerifier } from '../../applications/operations-identity/operations-credential-repositories.js';
import {
  createOperationsHumanAuthenticationRuntime,
  requireOperationsHumanPermission,
  type OperationsHumanAuthenticationSnapshot,
} from '../../applications/operations-identity/operations-human-authentication.js';
import {
  createOperationsSessionVersion,
  type OperationsSessionPersistenceRecord,
  type OperationsSessionRepository,
} from '../../applications/operations-identity/operations-session-repositories.js';
import {
  createOperationsAccountId,
  createOperationsCredentialId,
  createOperationsHumanPrincipalId,
} from '../../modules/operations-identity/operations-identity-contract.js';
import { vi } from 'vitest';

const date = new Date('2030-01-01T00:00:00Z');
const principalId = createOperationsHumanPrincipalId('test-principal');
const accountId = createOperationsAccountId('test-account');
const activeSnapshot: OperationsHumanAuthenticationSnapshot = {
  principal: {
    id: principalId,
    status: 'active',
    securityEpoch: 0,
    createdAt: date,
    updatedAt: date,
  },
  account: {
    id: accountId,
    principalId,
    status: 'active',
    loginIdentifierNormalized: 'operator@example.test',
    createdAt: date,
    updatedAt: date,
  },
  credential: {
    metadata: {
      id: createOperationsCredentialId('test-credential'),
      accountId,
      kind: 'password',
      status: 'active',
      version: 1,
      createdAt: date,
    },
    verifier: createEncodedPasswordVerifier('encoded-test-value'),
  },
  principalActivationHistory: 'previously_activated',
  accountActivationHistory: 'previously_activated',
};

// Unit mocks prove the eligibility/policy matrix; real PostgreSQL tests separately
// prove persistence, snapshots, rollback and restricted role behavior.
describe('Operations Human eligibility matrix', () => {
  const ineligible: [string, OperationsHumanAuthenticationSnapshot][] = [
    ...(['pending', 'suspended', 'disabled', 'tombstoned'] as const).map(
      (status) =>
        [
          `Principal ${status}`,
          { ...activeSnapshot, principal: { ...activeSnapshot.principal, status } },
        ] as [string, OperationsHumanAuthenticationSnapshot],
    ),
    ...(['invited', 'locked', 'disabled', 'revoked'] as const).map(
      (status) =>
        [
          `Account ${status}`,
          { ...activeSnapshot, account: { ...activeSnapshot.account, status } },
        ] as [string, OperationsHumanAuthenticationSnapshot],
    ),
    ...(['unknown', 'never_activated'] as const).flatMap(
      (history) =>
        [
          [
            `Principal history ${history}`,
            { ...activeSnapshot, principalActivationHistory: history },
          ],
          [`Account history ${history}`, { ...activeSnapshot, accountActivationHistory: history }],
        ] as [string, OperationsHumanAuthenticationSnapshot][],
    ),
    [
      'revoked Credential',
      {
        ...activeSnapshot,
        credential: {
          ...activeSnapshot.credential,
          metadata: { ...activeSnapshot.credential.metadata, status: 'revoked', revokedAt: date },
        },
      },
    ],
  ];
  it.each(ineligible)('rejects %s without creating a Session', async (_name, snapshot) => {
    const createSession = vi.fn<OperationsSessionRepository['createSession']>();
    const sessionRepository: OperationsSessionRepository = {
      createSession,
      findActiveSessionByCredentialDigest: vi.fn(),
      validateAndTouchSession: vi.fn(),
      rotateSession: vi.fn(),
      revokeSession: vi.fn(),
      revokeAllSessionsForAccount: vi.fn(),
      revokeAllSessionsForPrincipal: vi.fn(),
    };
    const runtime = createOperationsHumanAuthenticationRuntime({
      store: {
        findByLoginIdentifier: () => Promise.resolve(snapshot),
        findByIdentity: () => Promise.resolve(snapshot),
        findSessionForLogout: () => Promise.resolve(undefined),
      },
      passwordVerifier: {
        hash: vi.fn(),
        verify: () => Promise.resolve(true),
        verifyDummy: () => Promise.resolve(false),
      },
      sessionRepository,
    });
    await expect(
      runtime.login({
        loginIdentifier: 'operator@example.test',
        password: 'correct password value',
        correlationId: 'eligibility',
      }),
    ).rejects.toThrow('could not be verified');
    expect(createSession).not.toHaveBeenCalled();
  });
});

describe('Fixed first-operator permission policy', () => {
  it.each([true, false, undefined])(
    'restricts runtime grants to server-proven initial admin (%s)',
    async (isInitialAdmin) => {
      const snapshot = {
        ...activeSnapshot,
        ...(isInitialAdmin === undefined ? {} : { isInitialAdmin }),
      };
      let record: OperationsSessionPersistenceRecord;
      const runtime = createOperationsHumanAuthenticationRuntime({
        store: {
          findByLoginIdentifier: () => Promise.resolve(snapshot),
          findByIdentity: () => Promise.resolve(snapshot),
          findSessionForLogout: () => Promise.resolve(undefined),
        },
        passwordVerifier: {
          hash: vi.fn(),
          verify: () => Promise.resolve(true),
          verifyDummy: () => Promise.resolve(false),
        },
        sessionRepository: {
          createSession: (input) => {
            record = { ...input, sessionVersion: createOperationsSessionVersion(1) };
            return Promise.resolve(record);
          },
          findActiveSessionByCredentialDigest: () => Promise.resolve(record),
          validateAndTouchSession: () => Promise.resolve(record),
          rotateSession: vi.fn(),
          revokeSession: vi.fn(),
          revokeAllSessionsForAccount: vi.fn(),
          revokeAllSessionsForPrincipal: vi.fn(),
        },
        now: () => date,
      });
      const result = await runtime.login({
        loginIdentifier: 'operator@example.test',
        password: 'correct password value',
        correlationId: 'policy',
      });
      const expected =
        isInitialAdmin === true
          ? [
              'catalog:read',
              'audit:read',
              'offering:read',
              'request:read',
              'catalog:draft:create',
              'catalog:draft:update',
              'catalog:policy:activate',
            ]
          : [];
      expect(result.permissions).toEqual(expected);
      const context = await runtime.resolveActorContext({
        accessToken: result.credential,
        correlationId: 'policy',
      });
      expect(context.actor).toMatchObject({ kind: 'operations_human', permissions: expected });
    },
  );
  const human = createActorContext({
    actor: {
      kind: 'operations_human',
      principalId,
      accountId,
      sessionId: 'test-session',
      permissions: [
        'catalog:read',
        'audit:read',
        'offering:read',
        'request:read',
        'catalog:draft:create',
        'catalog:draft:update',
        'catalog:policy:activate',
      ],
    },
    correlationId: 'policy',
  });
  it.each([
    'catalog:read',
    'audit:read',
    'offering:read',
    'request:read',
    'catalog:draft:create',
    'catalog:draft:update',
    'catalog:policy:activate',
  ])('allows %s', (permission) => {
    expect(() => requireOperationsHumanPermission(human, permission)).not.toThrow();
  });
  it.each(['catalog:write', 'audit:write', 'accounts:create', 'unknown'])(
    'denies %s with authorization semantics',
    (permission) => {
      expect(() => requireOperationsHumanPermission(human, permission)).toThrow(
        expect.objectContaining({ category: 'authorization' }),
      );
    },
  );
  it.each([
    { kind: 'platform' } as const,
    { kind: 'pilot_operations', operatorId: 'static-operator' } as const,
    { kind: 'creator', creatorId: 'creator' } as const,
  ])('refuses non-Human actor $kind with authentication semantics', (actor) => {
    expect(() =>
      requireOperationsHumanPermission(
        createActorContext({ actor, correlationId: 'policy' }),
        'catalog:read',
      ),
    ).toThrow(expect.objectContaining({ category: 'authentication' }));
  });
});
