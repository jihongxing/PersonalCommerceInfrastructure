import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  createEncodedPasswordVerifier,
  type EncodedPasswordVerifier,
} from '../../applications/operations-identity/operations-credential-repositories.js';
import {
  createOperationsSessionCredentialDigest,
  createOperationsSessionCredentialVersion,
  createOperationsPrincipalSecurityEpoch,
  createOperationsSessionVersion,
  nextOperationsPrincipalSecurityEpoch,
  nextOperationsSessionVersion,
  OperationsSessionConflictError,
  OperationsPrincipalSecurityEpochConflictError,
  type OperationsSessionCredentialDigest,
  type OperationsSessionCredentialVersion,
  type OperationsSessionVersion,
  type OperationsPrincipalSecurityEpoch,
  type OperationsPrincipalSecurityEpochRepository,
  type OperationsSessionPersistenceRecord,
  type OperationsSessionRepository,
  type OperationsSessionSnapshot,
} from '../../applications/operations-identity/operations-session-repositories.js';
import {
  createOperationsAccount,
  createOperationsAccountId,
  createOperationsHumanPrincipalId,
  createOperationsSession,
  createOperationsSessionId,
} from './operations-identity-contract.js';

const createdAt = new Date('2026-11-13T00:00:00.000Z');

function session(): OperationsSessionSnapshot {
  const account = createOperationsAccount({
    id: createOperationsAccountId('account-session-port'),
    principalId: createOperationsHumanPrincipalId('principal-session-port'),
    loginIdentifierNormalized: 'operator@example.test',
    status: 'active',
    createdAt,
    updatedAt: createdAt,
  });
  const metadata = createOperationsSession({
    id: createOperationsSessionId('session-port'),
    account,
    status: 'active',
    credentialVersion: 1,
    principalSecurityEpoch: 0,
    createdAt,
    lastActivityAt: createdAt,
    idleExpiresAt: new Date('2026-11-13T08:00:00.000Z'),
    absoluteExpiresAt: new Date('2026-11-14T00:00:00.000Z'),
  });
  return {
    ...metadata,
    credentialVersion: createOperationsSessionCredentialVersion(metadata.credentialVersion),
    principalSecurityEpoch: createOperationsPrincipalSecurityEpoch(metadata.principalSecurityEpoch),
  };
}

describe('Operations session repository contract', () => {
  it('accepts only a canonical SHA-256-sized digest and keeps it separate from password verifiers', () => {
    const digest = createOperationsSessionCredentialDigest('a'.repeat(64));
    expect(digest).toHaveLength(64);
    expect(() => createOperationsSessionCredentialDigest('raw-session-credential')).toThrow(
      '64 lowercase hexadecimal',
    );
    expect(() => createOperationsSessionCredentialDigest('A'.repeat(64))).toThrow(
      '64 lowercase hexadecimal',
    );

    const verifier = createEncodedPasswordVerifier('encoded-password-verifier');
    expect(verifier).not.toBe(digest);
  });

  it('keeps Session Version and Principal Security Epoch as distinct bounded values', () => {
    expect(createOperationsSessionVersion(1)).toBe(1);
    expect(() => createOperationsSessionVersion(0)).toThrow('positive integer');
    expect(createOperationsPrincipalSecurityEpoch(0)).toBe(0);
    expect(() => createOperationsPrincipalSecurityEpoch(-1)).toThrow('non-negative integer');

    const current = createOperationsPrincipalSecurityEpoch(3);
    expect(nextOperationsPrincipalSecurityEpoch(current, current)).toBe(4);
    expect(() =>
      nextOperationsPrincipalSecurityEpoch(current, createOperationsPrincipalSecurityEpoch(2)),
    ).toThrow(OperationsPrincipalSecurityEpochConflictError);
  });

  it('places Session Version and Digest only in the persistence record', () => {
    const record: OperationsSessionPersistenceRecord = {
      session: session(),
      credentialDigest: createOperationsSessionCredentialDigest('b'.repeat(64)),
      sessionVersion: createOperationsSessionVersion(1),
    };

    expect('sessionVersion' in record.session).toBe(false);
    expect(record.sessionVersion).toBe(1);
    expect(record.credentialDigest).toHaveLength(64);
    expect('credentialDigest' in record.session).toBe(false);
    expect('rawCredential' in record.session).toBe(false);
  });

  it('distinguishes all three version fields and the CAS input and return types', () => {
    expect(createOperationsSessionCredentialVersion(1)).toBe(1);
    for (const invalid of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => createOperationsSessionCredentialVersion(invalid)).toThrow('positive integer');
      expect(() => createOperationsSessionVersion(invalid)).toThrow('positive integer');
    }
    expectTypeOf<OperationsSessionVersion>().not.toMatchTypeOf<OperationsSessionCredentialVersion>();
    expectTypeOf<OperationsSessionCredentialVersion>().not.toMatchTypeOf<OperationsSessionVersion>();
    expectTypeOf<OperationsPrincipalSecurityEpoch>().not.toMatchTypeOf<OperationsSessionVersion>();
    expectTypeOf<OperationsSessionVersion>().not.toMatchTypeOf<OperationsPrincipalSecurityEpoch>();
    expectTypeOf<OperationsPrincipalSecurityEpoch>().not.toMatchTypeOf<OperationsSessionCredentialVersion>();
    expectTypeOf<OperationsSessionCredentialVersion>().not.toMatchTypeOf<OperationsPrincipalSecurityEpoch>();
    expectTypeOf<
      Parameters<OperationsSessionRepository['rotateSession']>[0]['expectedSessionVersion']
    >().toEqualTypeOf<OperationsSessionVersion>();
    expectTypeOf<
      Awaited<ReturnType<OperationsSessionRepository['rotateSession']>>['sessionVersion']
    >().toEqualTypeOf<OperationsSessionVersion>();
    expectTypeOf<
      OperationsSessionPersistenceRecord['session']['credentialVersion']
    >().toEqualTypeOf<OperationsSessionCredentialVersion>();
    expectTypeOf<
      OperationsSessionPersistenceRecord['session']['principalSecurityEpoch']
    >().toEqualTypeOf<OperationsPrincipalSecurityEpoch>();
  });

  it('advances Session CAS Version by exactly one and rejects stale expectations and overflow', () => {
    const current = createOperationsSessionVersion(1);
    expect(nextOperationsSessionVersion(current, current)).toBe(2);
    expect(() => nextOperationsSessionVersion(current, createOperationsSessionVersion(2))).toThrow(
      OperationsSessionConflictError,
    );
    const limit = createOperationsSessionVersion(Number.MAX_SAFE_INTEGER);
    expect(() => nextOperationsSessionVersion(limit, limit)).toThrow('positive integer');
  });

  it('restricts Epoch changes to expected-value increments and rejects overflow', () => {
    const zero = createOperationsPrincipalSecurityEpoch(0);
    expect(nextOperationsPrincipalSecurityEpoch(zero, zero)).toBe(1);
    const limit = createOperationsPrincipalSecurityEpoch(Number.MAX_SAFE_INTEGER);
    expect(() => nextOperationsPrincipalSecurityEpoch(limit, limit)).toThrow(
      'non-negative integer',
    );
    expectTypeOf<
      keyof OperationsPrincipalSecurityEpochRepository
    >().toEqualTypeOf<'incrementSecurityEpoch'>();
    expectTypeOf<
      Parameters<OperationsPrincipalSecurityEpochRepository['incrementSecurityEpoch']>[0]
    >().toEqualTypeOf<{
      readonly principalId: ReturnType<typeof createOperationsHumanPrincipalId>;
      readonly expectedEpoch: OperationsPrincipalSecurityEpoch;
      readonly updatedAt: Date;
    }>();
  });

  it('exposes only the seven bounded Session operations and keeps initialization inside persistence', () => {
    expectTypeOf<keyof OperationsSessionRepository>().toEqualTypeOf<
      | 'createSession'
      | 'findActiveSessionByCredentialDigest'
      | 'validateAndTouchSession'
      | 'rotateSession'
      | 'revokeSession'
      | 'revokeAllSessionsForAccount'
      | 'revokeAllSessionsForPrincipal'
    >();
    expectTypeOf<keyof Parameters<OperationsSessionRepository['createSession']>[0]>().toEqualTypeOf<
      'session' | 'credentialDigest' | 'now'
    >();
    expectTypeOf<
      Parameters<OperationsSessionRepository['createSession']>[0]['credentialDigest']
    >().toEqualTypeOf<OperationsSessionCredentialDigest>();
    expectTypeOf<keyof OperationsSessionPersistenceRecord['session']>().toEqualTypeOf<
      keyof ReturnType<typeof createOperationsSession>
    >();
  });
});

// Compile-time contracts: the two credential types must remain incompatible.
const typedDigest: OperationsSessionCredentialDigest = createOperationsSessionCredentialDigest(
  'c'.repeat(64),
);
const typedVerifier: EncodedPasswordVerifier = createEncodedPasswordVerifier('encoded');

// @ts-expect-error A Session Credential Digest cannot be used as a Password Verifier.
const invalidVerifier: EncodedPasswordVerifier = typedDigest;
// @ts-expect-error An Encoded Password Verifier cannot be used as a Session Credential Digest.
const invalidDigest: OperationsSessionCredentialDigest = typedVerifier;

void invalidVerifier;
void invalidDigest;

type SessionRepositoryHasDelete = 'deleteSession' extends keyof OperationsSessionRepository
  ? true
  : false;
const sessionRepositoryHasNoDelete: SessionRepositoryHasDelete = false;
void sessionRepositoryHasNoDelete;

const typedPortSession = session();
const typedPortDigest = createOperationsSessionCredentialDigest('d'.repeat(64));
const typedRotateInput: Parameters<OperationsSessionRepository['rotateSession']>[0] = {
  sessionId: typedPortSession.id,
  principalId: typedPortSession.principalId,
  accountId: typedPortSession.accountId,
  credentialDigest: typedPortDigest,
  expectedSessionVersion: createOperationsSessionVersion(1),
  nextCredentialDigest: createOperationsSessionCredentialDigest('e'.repeat(64)),
  rotatedAt: createdAt,
  nextLastActivityAt: createdAt,
  nextIdleExpiresAt: typedPortSession.idleExpiresAt,
};
void typedRotateInput;
