import { describe, expect, it } from 'vitest';

import {
  assertExecutionAttribution,
  assertOperationsSessionRotationAbsoluteExpiry,
  assertOperationsSessionBelongsToAccount,
  assertOperationsSessionTouch,
  assertOperationsSessionTransition,
  createHumanDirectExecutionAttribution,
  createHumanInitiatedSystemExecutionAttribution,
  createOperationsAccount,
  createOperationsAccountId,
  createOperationsCredentialId,
  createOperationsCredentialMetadata,
  createOperationsHumanPrincipal,
  createOperationsHumanPrincipalId,
  createOperationsMfaFactorId,
  createOperationsMfaFactorMetadata,
  createOperationsSession,
  createOperationsSessionId,
  createPlatformSystemId,
  createPlatformSystemPrincipal,
  createPlatformSystemSubject,
  createProviderId,
  createProviderServicePrincipal,
  createProviderServiceSubject,
  createServiceCredentialId,
  createServiceCredentialMetadata,
  createServicePrincipalId,
  OperationsDomainInvariantError,
  normalizeOperationsLoginIdentifier,
  type OperationsAccountId,
  type OperationsHumanPrincipalId,
  type PlatformSystemPrincipal,
  type ProviderServicePrincipal,
} from './operations-identity-contract.js';

const createdAt = new Date('2026-11-12T00:00:00.000Z');
const updatedAt = new Date('2026-11-12T01:00:00.000Z');

function principal(id = 'human-1') {
  return createOperationsHumanPrincipal({
    id: createOperationsHumanPrincipalId(id),
    status: 'active',
    securityEpoch: 0,
    createdAt,
    updatedAt,
  });
}

function account(principalId = principal().id, id = 'account-1') {
  return createOperationsAccount({
    id: createOperationsAccountId(id),
    principalId,
    loginIdentifierNormalized: 'operator@example.test',
    status: 'active',
    createdAt,
    updatedAt,
  });
}

function session(overrides: Partial<Parameters<typeof createOperationsSession>[0]> = {}) {
  return createOperationsSession({
    id: createOperationsSessionId('session-invariants'),
    account: account(),
    status: 'active',
    credentialVersion: 1,
    principalSecurityEpoch: 0,
    createdAt,
    lastActivityAt: updatedAt,
    idleExpiresAt: new Date('2026-11-12T08:00:00.000Z'),
    absoluteExpiresAt: new Date('2026-11-13T00:00:00.000Z'),
    ...overrides,
  });
}

function humanSubject() {
  return {
    kind: 'operations_human' as const,
    principalId: principal().id,
    accountId: account().id,
    sessionId: createOperationsSessionId('session-1'),
  };
}

function systemSubject() {
  return createPlatformSystemSubject({
    servicePrincipalId: createServicePrincipalId('system-principal-1'),
    systemId: createPlatformSystemId('catalog-worker'),
    jobRunId: 'job-run-1',
  });
}

describe('Operations identity domain contract', () => {
  it('canonicalizes Operations login identifiers without changing case semantics', () => {
    expect(normalizeOperationsLoginIdentifier('  Operator@Example.test  ')).toBe(
      'Operator@Example.test',
    );
    expect(normalizeOperationsLoginIdentifier('e\u0301xample')).toBe('éxample');
    expect(normalizeOperationsLoginIdentifier('Example')).not.toBe(
      normalizeOperationsLoginIdentifier('example'),
    );
    expect(
      createOperationsAccount({
        ...account(),
        loginIdentifierNormalized: '  e\u0301xample  ',
      }).loginIdentifierNormalized,
    ).toBe('éxample');
  });

  it('rejects empty, whitespace-only, and over-length Operations login identifiers', () => {
    expect(() => normalizeOperationsLoginIdentifier('')).toThrow(OperationsDomainInvariantError);
    expect(() => normalizeOperationsLoginIdentifier(' \t ')).toThrow(
      OperationsDomainInvariantError,
    );
    expect(normalizeOperationsLoginIdentifier('a'.repeat(320))).toHaveLength(320);
    expect(() => normalizeOperationsLoginIdentifier('a'.repeat(321))).toThrow(
      OperationsDomainInvariantError,
    );
  });

  it('creates independent branded IDs and does not expose credential secrets', () => {
    const credential = createOperationsCredentialMetadata({
      id: createOperationsCredentialId('credential-1'),
      accountId: account().id,
      kind: 'password',
      status: 'active',
      version: 1,
      createdAt,
    });

    expect(credential).toEqual({
      id: 'credential-1',
      accountId: 'account-1',
      kind: 'password',
      status: 'active',
      version: 1,
      createdAt,
    });
    expect('passwordHash' in credential).toBe(false);
    expect('accessToken' in credential).toBe(false);
    expect('refreshToken' in credential).toBe(false);
  });

  it('requires positive credential versions and consistent terminal metadata', () => {
    expect(() =>
      createOperationsCredentialMetadata({
        id: createOperationsCredentialId('credential-zero'),
        accountId: account().id,
        kind: 'password',
        status: 'active',
        version: 0,
        createdAt,
      }),
    ).toThrow('positive integer');
    expect(() =>
      createOperationsCredentialMetadata({
        id: createOperationsCredentialId('credential-active-revoked-at'),
        accountId: account().id,
        kind: 'password',
        status: 'active',
        version: 1,
        createdAt,
        revokedAt: updatedAt,
      }),
    ).toThrow('cannot have revokedAt');
    expect(() =>
      createOperationsCredentialMetadata({
        id: createOperationsCredentialId('credential-revoked'),
        accountId: account().id,
        kind: 'password',
        status: 'revoked',
        version: 1,
        createdAt,
      }),
    ).toThrow('requires revokedAt');
  });

  it('keeps principal and account status independent', () => {
    const human = principal();
    const invited = createOperationsAccount({
      ...account(human.id),
      status: 'invited',
    });

    expect(human.status).toBe('active');
    expect(invited.status).toBe('invited');
  });

  it('creates a Human-only Session from one account and preserves the owner relationship', () => {
    const owner = account();
    const session = createOperationsSession({
      id: createOperationsSessionId('session-1'),
      account: owner,
      status: 'active',
      credentialVersion: 1,
      principalSecurityEpoch: 0,
      createdAt,
      lastActivityAt: updatedAt,
      idleExpiresAt: new Date('2026-11-12T08:00:00.000Z'),
      absoluteExpiresAt: new Date('2026-11-13T00:00:00.000Z'),
      mfaVerifiedAt: updatedAt,
    });

    expect(session.principalId).toBe(owner.principalId);
    expect(session.accountId).toBe(owner.id);
    expect(session.credentialVersion).toBe(1);
    expect(() => assertOperationsSessionBelongsToAccount(session, owner)).not.toThrow();
  });

  it('rejects a Session whose account and principal references disagree', () => {
    const session = createOperationsSession({
      id: createOperationsSessionId('session-1'),
      account: account(),
      status: 'active',
      credentialVersion: 1,
      principalSecurityEpoch: 0,
      createdAt,
      lastActivityAt: updatedAt,
      idleExpiresAt: new Date('2026-11-12T08:00:00.000Z'),
      absoluteExpiresAt: new Date('2026-11-13T00:00:00.000Z'),
    });

    const otherAccount = account(createOperationsHumanPrincipalId('human-2'), 'account-2');
    expect(() => assertOperationsSessionBelongsToAccount(session, otherAccount)).toThrow(
      OperationsDomainInvariantError,
    );
  });

  it('rejects invalid Session expiry ordering and revoked state without a timestamp', () => {
    expect(() =>
      createOperationsSession({
        id: createOperationsSessionId('session-invalid'),
        account: account(),
        status: 'active',
        credentialVersion: 1,
        principalSecurityEpoch: 0,
        createdAt,
        lastActivityAt: updatedAt,
        idleExpiresAt: new Date('2026-11-13T00:00:00.000Z'),
        absoluteExpiresAt: new Date('2026-11-12T08:00:00.000Z'),
      }),
    ).toThrow('expiry dates are out of order');

    expect(() =>
      createOperationsSession({
        id: createOperationsSessionId('session-zero-credential-version'),
        account: account(),
        status: 'active',
        credentialVersion: 0,
        principalSecurityEpoch: 0,
        createdAt,
        lastActivityAt: updatedAt,
        idleExpiresAt: new Date('2026-11-13T00:00:00.000Z'),
        absoluteExpiresAt: new Date('2026-11-13T00:00:00.000Z'),
      }),
    ).toThrow('positive integer');

    expect(() =>
      createOperationsSession({
        id: createOperationsSessionId('session-equal-absolute-expiry'),
        account: account(),
        status: 'active',
        credentialVersion: 1,
        principalSecurityEpoch: 0,
        createdAt,
        lastActivityAt: createdAt,
        idleExpiresAt: createdAt,
        absoluteExpiresAt: createdAt,
      }),
    ).toThrow('must be after creation');

    expect(() =>
      createOperationsSession({
        id: createOperationsSessionId('session-revoked'),
        account: account(),
        status: 'revoked',
        credentialVersion: 1,
        principalSecurityEpoch: 0,
        createdAt,
        lastActivityAt: updatedAt,
        idleExpiresAt: new Date('2026-11-12T08:00:00.000Z'),
        absoluteExpiresAt: new Date('2026-11-13T00:00:00.000Z'),
      }),
    ).toThrow('revokedAt');
  });

  it('keeps Touch and Rotation inside the immutable absolute expiry and preserves terminal state', () => {
    const current = createOperationsSession({
      id: createOperationsSessionId('session-time-contract'),
      account: account(),
      status: 'active',
      credentialVersion: 1,
      principalSecurityEpoch: 0,
      createdAt,
      lastActivityAt: updatedAt,
      idleExpiresAt: new Date('2026-11-12T08:00:00.000Z'),
      absoluteExpiresAt: new Date('2026-11-13T00:00:00.000Z'),
    });

    expect(() =>
      assertOperationsSessionTouch(current, {
        lastActivityAt: new Date('2026-11-12T02:00:00.000Z'),
        idleExpiresAt: new Date('2026-11-12T10:00:00.000Z'),
      }),
    ).not.toThrow();
    expect(() =>
      assertOperationsSessionTouch(current, {
        lastActivityAt: new Date('2026-11-12T02:00:00.000Z'),
        idleExpiresAt: new Date('2026-11-13T00:00:01.000Z'),
      }),
    ).toThrow('beyond absolute expiry');
    expect(() =>
      assertOperationsSessionRotationAbsoluteExpiry(current, new Date('2026-11-13T00:00:01.000Z')),
    ).toThrow('cannot change absolute expiry');

    const revoked = {
      ...current,
      status: 'revoked' as const,
      revokedAt: new Date('2026-11-12T02:00:00.000Z'),
    };
    expect(() => assertOperationsSessionTransition(current, revoked)).not.toThrow();
    expect(() => assertOperationsSessionTransition(revoked, revoked)).toThrow('terminal');
  });

  it('rejects non-positive Credential snapshots and negative or fractional Security Epochs', () => {
    for (const credentialVersion of [0, -1, 1.5]) {
      expect(() => session({ credentialVersion })).toThrow('positive integer');
    }
    for (const principalSecurityEpoch of [-1, 0.5]) {
      expect(() => session({ principalSecurityEpoch })).toThrow('non-negative integer');
    }
    expect(session({ principalSecurityEpoch: 0 }).principalSecurityEpoch).toBe(0);
  });

  it('enforces every time-window boundary while accepting the permitted equalities', () => {
    expect(() => session({ lastActivityAt: new Date('2026-11-11T23:59:59.000Z') })).toThrow(
      'activity dates are out of order',
    );
    expect(() => session({ idleExpiresAt: createdAt })).toThrow('idle dates are out of order');
    expect(() => session({ idleExpiresAt: new Date('2026-11-14T00:00:00.000Z') })).toThrow(
      'expiry dates are out of order',
    );
    expect(() =>
      session({
        lastActivityAt: createdAt,
        idleExpiresAt: new Date('2026-11-13T00:00:00.000Z'),
      }),
    ).not.toThrow();
  });

  it('rejects stale Touch timestamps and every attempt to change absolute expiry on Rotation', () => {
    const current = session();
    expect(() =>
      assertOperationsSessionTouch(current, {
        lastActivityAt: createdAt,
        idleExpiresAt: current.idleExpiresAt,
      }),
    ).toThrow('activity date cannot move backwards');
    expect(() =>
      assertOperationsSessionTouch(current, {
        lastActivityAt: current.lastActivityAt,
        idleExpiresAt: new Date('2026-11-12T07:00:00.000Z'),
      }),
    ).toThrow('idle expiry cannot move backwards');
    expect(() =>
      assertOperationsSessionTouch(current, {
        lastActivityAt: new Date('2026-11-12T10:00:00.000Z'),
        idleExpiresAt: new Date('2026-11-12T09:00:00.000Z'),
      }),
    ).toThrow('cannot precede activity');
    expect(() =>
      assertOperationsSessionRotationAbsoluteExpiry(current, current.absoluteExpiresAt),
    ).not.toThrow();
    expect(() =>
      assertOperationsSessionRotationAbsoluteExpiry(current, current.idleExpiresAt),
    ).toThrow('cannot change absolute expiry');
  });

  it('rejects reactivation, Touch and Rotation of a revoked Session', () => {
    const active = session();
    const revoked = session({ status: 'revoked', revokedAt: updatedAt });
    expect(() => assertOperationsSessionTransition(revoked, active)).toThrow('terminal');
    expect(() => assertOperationsSessionTransition(revoked, revoked)).toThrow('terminal');
    expect(() => assertOperationsSessionTouch(revoked, revoked)).toThrow('terminal');
    expect(() =>
      assertOperationsSessionRotationAbsoluteExpiry(revoked, revoked.absoluteExpiresAt),
    ).toThrow('terminal');
  });

  it('preserves Session identity and security snapshots across transitions', () => {
    const current = session();
    const forbiddenChanges = [
      { id: createOperationsSessionId('other-session') },
      { principalId: createOperationsHumanPrincipalId('other-principal') },
      { accountId: createOperationsAccountId('other-account') },
      { credentialVersion: 2 },
      { principalSecurityEpoch: 1 },
      { createdAt: new Date('2026-11-11T00:00:00.000Z') },
      { absoluteExpiresAt: new Date('2026-11-14T00:00:00.000Z') },
    ];
    for (const change of forbiddenChanges) {
      expect(() => assertOperationsSessionTransition(current, { ...current, ...change })).toThrow(
        'identity and snapshot fields cannot change',
      );
    }
    expect(() =>
      assertOperationsSessionTransition(current, { ...current, lastActivityAt: createdAt }),
    ).toThrow('activity date cannot move backwards');
  });

  it('validates the supplied Human Account and rejects either ownership mismatch independently', () => {
    const owner = account();
    const current = session({ account: owner });
    expect(() =>
      assertOperationsSessionBelongsToAccount(
        { ...current, principalId: createOperationsHumanPrincipalId('other-human') },
        owner,
      ),
    ).toThrow('same Human Principal');
    expect(() =>
      assertOperationsSessionBelongsToAccount(
        { ...current, accountId: createOperationsAccountId('other-account') },
        owner,
      ),
    ).toThrow('same Human Principal');
    expect(() =>
      session({ account: { ...owner, loginIdentifierNormalized: ' Not-Normalized ' } }),
    ).toThrow('must already be normalized');
  });

  it('requires enrollment and revocation timestamps for MFA metadata', () => {
    expect(() =>
      createOperationsMfaFactorMetadata({
        id: createOperationsMfaFactorId('mfa-1'),
        principalId: principal().id,
        kind: 'webauthn',
        status: 'active',
      }),
    ).toThrow('enrolledAt');
  });

  it('separates Provider and Platform System principals', () => {
    const provider = createProviderServicePrincipal({
      id: createServicePrincipalId('provider-principal-1'),
      providerId: createProviderId('provider-1'),
      status: 'active',
      createdAt,
    });
    const system = createPlatformSystemPrincipal({
      id: createServicePrincipalId('system-principal-1'),
      systemId: createPlatformSystemId('system-1'),
      status: 'active',
      createdAt,
    });

    expect(provider.kind).toBe('provider_service');
    expect(system.kind).toBe('platform_system');
    expect('providerId' in system).toBe(false);
    expect('systemId' in provider).toBe(false);
  });

  it('keeps Service Credentials outside Human Account and Session contracts', () => {
    const credential = createServiceCredentialMetadata({
      id: createServiceCredentialId('service-credential-1'),
      servicePrincipalId: createServicePrincipalId('provider-principal-1'),
      kind: 'provider_signature',
      status: 'active',
      createdAt,
    });

    expect(credential.servicePrincipalId).toBe('provider-principal-1');
    expect('accountId' in credential).toBe(false);
    expect('sessionId' in credential).toBe(false);
  });

  it('represents direct human, human-initiated system, provider-fact system, and autonomous system execution', () => {
    const human = humanSubject();
    const provider = createProviderServiceSubject({
      servicePrincipalId: createServicePrincipalId('provider-principal-1'),
      providerId: createProviderId('provider-1'),
    });
    const system = systemSubject();

    const direct = createHumanDirectExecutionAttribution({
      initiatingSubject: human,
      executingSubject: human,
      operationId: 'operation-1',
      correlationId: 'correlation-1',
    });
    const humanInitiated = createHumanInitiatedSystemExecutionAttribution({
      initiatingSubject: human,
      executingSubject: system,
      operationId: 'operation-2',
      correlationId: 'correlation-2',
    });
    const providerFact = {
      kind: 'provider_fact_system' as const,
      initiatingSubject: provider,
      executingSubject: system,
      operationId: 'operation-3',
      correlationId: 'correlation-3',
    };
    const autonomous = {
      kind: 'system_autonomous' as const,
      executingSubject: system,
      operationId: 'operation-4',
      correlationId: 'correlation-4',
    };

    expect(() => assertExecutionAttribution(direct)).not.toThrow();
    expect(() => assertExecutionAttribution(humanInitiated)).not.toThrow();
    expect(() => assertExecutionAttribution(providerFact)).not.toThrow();
    expect(() => assertExecutionAttribution(autonomous)).not.toThrow();
  });

  it('rejects empty execution identifiers', () => {
    expect(() =>
      createHumanDirectExecutionAttribution({
        initiatingSubject: humanSubject(),
        executingSubject: humanSubject(),
        operationId: ' ',
        correlationId: 'correlation-1',
      }),
    ).toThrow('Operation ID cannot be empty.');
  });

  it('keeps Creator and Operations IDs statically distinct', () => {
    const operationsPrincipalId = createOperationsHumanPrincipalId('human-1');
    const operationsAccountId = createOperationsAccountId('account-1');
    const servicePrincipalId = createServicePrincipalId('service-1');

    expect(operationsPrincipalId).toBe('human-1');
    expect(operationsAccountId).toBe('account-1');
    expect(servicePrincipalId).toBe('service-1');
  });
});

// Compile-time contracts: these assignments must remain invalid.
const typedHumanId = createOperationsHumanPrincipalId('human-typed');
const typedAccountId = createOperationsAccountId('account-typed');
const typedServiceId = createServicePrincipalId('service-typed');

// @ts-expect-error Operations Human Principal IDs cannot be Account IDs.
const invalidAccountId: OperationsAccountId = typedHumanId;
// @ts-expect-error Operations Account IDs cannot be Human Principal IDs.
const invalidHumanId: OperationsHumanPrincipalId = typedAccountId;
// @ts-expect-error Service Principal IDs cannot be Human Principal IDs.
const invalidServiceAsHuman: OperationsHumanPrincipalId = typedServiceId;

void invalidAccountId;
void invalidHumanId;
void invalidServiceAsHuman;

const typedProviderPrincipal: ProviderServicePrincipal = {
  id: typedServiceId,
  kind: 'provider_service',
  providerId: createProviderId('provider-typed'),
  status: 'active',
  createdAt,
};

// @ts-expect-error Provider Service Principals do not expose Human Account fields.
void typedProviderPrincipal.accountId;

// @ts-expect-error Provider Service Principals cannot own a Human Operations Session.
const invalidSessionOwner: Parameters<typeof createOperationsSession>[0]['account'] =
  typedProviderPrincipal;
void invalidSessionOwner;

const typedSystemPrincipal: PlatformSystemPrincipal = {
  id: typedServiceId,
  kind: 'platform_system',
  systemId: createPlatformSystemId('system-typed'),
  status: 'active',
  createdAt,
};

// @ts-expect-error Platform System Principals cannot own a Human Operations Session.
const invalidSystemSessionOwner: Parameters<typeof createOperationsSession>[0]['account'] =
  typedSystemPrincipal;
void invalidSystemSessionOwner;
