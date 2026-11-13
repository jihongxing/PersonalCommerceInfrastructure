import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  createOperationsAccount,
  createOperationsAccountId,
  createOperationsCredentialId,
  createOperationsCredentialMetadata,
  createOperationsHumanPrincipal,
  createOperationsHumanPrincipalId,
  createOperationsSession,
  createOperationsSessionId,
} from './operations-identity-contract.js';
import {
  assertOperationsLifecycleLockOrder,
  assertOperationsSessionCreationContract,
  assertOperationsSessionValidationContract,
  classifyOperationsLifecycleFailure,
  planOperationsAccountLifecycleCommand,
  planOperationsCredentialReplacement,
  planOperationsPrincipalLifecycleCommand,
  planOperationsSessionRevocation,
  planOperationsSessionRotation,
  planOperationsSessionTouch,
  type OperationsAccountLifecycleCommand,
  type OperationsPrincipalLifecycleCommand,
  type OperationsCredentialReplacementCommand,
  type OperationsLifecycleApplicationPlan,
  type OperationsIdentitySecuritySnapshot,
} from '../../applications/operations-identity/operations-identity-lifecycle-transactions.js';
import { createEncodedPasswordVerifier } from '../../applications/operations-identity/operations-credential-repositories.js';
import {
  createOperationsSessionCredentialDigest,
  OperationsSessionNotAuthenticatedError,
  OperationsSessionConflictError,
  OperationsSessionPersistenceError,
  createOperationsSessionCredentialVersion,
  createOperationsPrincipalSecurityEpoch,
  createOperationsSessionVersion,
  type OperationsSessionPersistenceRecord,
  type OperationsPrincipalSecurityEpoch,
  type OperationsSessionCredentialVersion,
  type OperationsSessionVersion,
} from '../../applications/operations-identity/operations-session-repositories.js';
import {
  OperationsLifecycleContractError,
  planOperationsSecurityEpochIncrement,
} from './operations-identity-lifecycle-contract.js';

const now = new Date('2030-01-01T00:00:00Z');
function fixture() {
  const principal = {
    ...createOperationsHumanPrincipal({
      id: createOperationsHumanPrincipalId('human-c1'),
      status: 'active',
      securityEpoch: 2,
      createdAt: now,
      updatedAt: now,
    }),
    activationHistory: 'previously_activated' as const,
  };
  const account = {
    ...createOperationsAccount({
      id: createOperationsAccountId('account-c1'),
      principalId: principal.id,
      status: 'active',
      loginIdentifierNormalized: 'operator@example.test',
      createdAt: now,
      updatedAt: now,
    }),
    activationHistory: 'previously_activated' as const,
  };
  const credential = createOperationsCredentialMetadata({
    id: createOperationsCredentialId('password-c1'),
    accountId: account.id,
    kind: 'password',
    status: 'active',
    version: 3,
    createdAt: now,
  });
  const session = {
    ...createOperationsSession({
      id: createOperationsSessionId('session-c1'),
      account,
      status: 'active',
      credentialVersion: 3,
      principalSecurityEpoch: 2,
      createdAt: now,
      lastActivityAt: now,
      idleExpiresAt: new Date(now.getTime() + 60000),
      absoluteExpiresAt: new Date(now.getTime() + 120000),
    }),
    credentialVersion: createOperationsSessionCredentialVersion(3),
    principalSecurityEpoch: createOperationsPrincipalSecurityEpoch(2),
  };
  const credentialDigest = createOperationsSessionCredentialDigest('11'.repeat(32));
  return { principal, account, credential, session, credentialDigest };
}

// Ordered authoritative snapshots only. These tests acquire no locks and prove no SQL scheduling.
describe('Operations lifecycle Application contracts (pure snapshots, no PostgreSQL proof)', () => {
  it('01 Principal disable vs Create: fails closed when disable wins before the creation snapshot', () => {
    const f = fixture();
    expect(() =>
      assertOperationsSessionCreationContract(
        { ...f, principal: { ...f.principal, status: 'disabled', securityEpoch: 3 } },
        { session: f.session, credentialDigest: f.credentialDigest, now },
      ),
    ).toThrow('parent_not_active');
    expect(() =>
      assertOperationsSessionCreationContract(f, {
        session: f.session,
        credentialDigest: f.credentialDigest,
        now,
      }),
    ).not.toThrow();
  });
});

function record(f = fixture()): OperationsSessionPersistenceRecord {
  return {
    session: f.session,
    credentialDigest: f.credentialDigest,
    sessionVersion: createOperationsSessionVersion(1),
  };
}
const audit = {
  operationId: 'lifecycle-contract-1',
  correlationId: 'correlation-contract',
  reasonCode: 'security-maintenance',
  occurredAt: new Date(now.getTime() + 1000),
};
function pCommand(f = fixture()): OperationsPrincipalLifecycleCommand {
  return {
    principalId: f.principal.id,
    expectedStatus: 'active',
    targetStatus: 'disabled',
    expectedEpoch: createOperationsPrincipalSecurityEpoch(2),
    audit,
  };
}
function aCommand(f = fixture()): OperationsAccountLifecycleCommand {
  return {
    principalId: f.principal.id,
    accountId: f.account.id,
    expectedStatus: 'active',
    targetStatus: 'disabled',
    expectedEpoch: createOperationsPrincipalSecurityEpoch(2),
    audit,
  };
}
function create(f = fixture()) {
  return { session: f.session, credentialDigest: f.credentialDigest, now };
}
function lookup(f = fixture()) {
  return { credentialDigest: f.credentialDigest, now };
}
function rotate(r = record()) {
  return {
    sessionId: r.session.id,
    principalId: r.session.principalId,
    accountId: r.session.accountId,
    credentialDigest: r.credentialDigest,
    expectedSessionVersion: r.sessionVersion,
    nextCredentialDigest: createOperationsSessionCredentialDigest('22'.repeat(32)),
    rotatedAt: now,
    nextLastActivityAt: new Date(now.getTime() + 1000),
    nextIdleExpiresAt: new Date(now.getTime() + 90000),
  };
}
function replacement(f = fixture()) {
  return {
    id: createOperationsCredentialId('password-next'),
    accountId: f.account.id,
    principalId: f.principal.id,
    expectedVersion: createOperationsSessionCredentialVersion(3),
    expectedEpoch: createOperationsPrincipalSecurityEpoch(2),
    verifier: createEncodedPasswordVerifier('already-encoded-fixture'),
    replacedAt: audit.occurredAt,
    audit,
  };
}

describe('C1 ordered outcomes for the fourteen required scenarios; NOT database concurrency tests', () => {
  it('02 Principal disable vs Validate: a prior valid decision is not retroactively cancelled, later validation fails', () => {
    const f = fixture();
    expect(() => assertOperationsSessionValidationContract(f, record(f), lookup(f))).not.toThrow();
    const disabled = {
      ...f,
      principal: { ...f.principal, status: 'disabled' as const, securityEpoch: 3 },
    };
    expect(() => assertOperationsSessionValidationContract(disabled, record(f), lookup(f))).toThrow(
      'parent_not_active',
    );
  });
  it('03 Principal disable vs Rotation: either a prior rotation is invalidated or rotation fails', () => {
    const f = fixture();
    const r = record(f);
    expect(planOperationsSessionRotation(f, r, rotate(r)).nextSessionVersion).toBe(2);
    const disabled = {
      ...f,
      principal: { ...f.principal, status: 'disabled' as const, securityEpoch: 3 },
    };
    expect(() => planOperationsSessionRotation(disabled, r, rotate(r))).toThrow(
      'parent_not_active',
    );
    expect(() =>
      assertOperationsSessionValidationContract(
        disabled,
        {
          ...r,
          credentialDigest: rotate(r).nextCredentialDigest,
          sessionVersion: createOperationsSessionVersion(2),
        },
        { credentialDigest: rotate(r).nextCredentialDigest, now },
      ),
    ).toThrow('parent_not_active');
  });
  it('04 Principal disable vs recovery: expected status and Epoch reject the stale command in either state', () => {
    const f = fixture();
    const command = pCommand(f);
    expect(planOperationsPrincipalLifecycleCommand(f.principal, command).nextEpoch).toBe(3);
    expect(() =>
      planOperationsPrincipalLifecycleCommand(f.principal, {
        ...command,
        expectedStatus: 'disabled',
        targetStatus: 'active',
      }),
    ).toThrow('expected_status_mismatch');
    const disabled = { ...f.principal, status: 'disabled' as const, securityEpoch: 3 };
    expect(() =>
      planOperationsPrincipalLifecycleCommand(disabled, {
        ...command,
        expectedStatus: 'disabled',
        targetStatus: 'active',
      }),
    ).toThrow('expected_epoch_mismatch');
    expect(
      planOperationsPrincipalLifecycleCommand(disabled, {
        ...command,
        expectedStatus: 'disabled',
        targetStatus: 'active',
        expectedEpoch: createOperationsPrincipalSecurityEpoch(3),
      }).nextEpoch,
    ).toBe(4);
  });
  it('05 Account disable vs Create: the new owning-Principal generation and inactive Account reject old creation', () => {
    const f = fixture();
    expect(() => assertOperationsSessionCreationContract(f, create(f))).not.toThrow();
    expect(planOperationsAccountLifecycleCommand(f, aCommand(f)).nextEpoch).toBe(3);
    expect(() =>
      assertOperationsSessionCreationContract(
        {
          ...f,
          account: { ...f.account, status: 'disabled' },
          principal: { ...f.principal, securityEpoch: 3 },
        },
        create(f),
      ),
    ).toThrow('parent_not_active');
  });
  it('06 Account recovery vs old Validate: recovery never restores a previously bound Epoch', () => {
    const f = fixture();
    const disabled = {
      ...f,
      account: { ...f.account, status: 'disabled' as const },
      principal: { ...f.principal, securityEpoch: 3 },
    };
    expect(() => assertOperationsSessionValidationContract(disabled, record(f), lookup(f))).toThrow(
      'parent_not_active',
    );
    expect(
      planOperationsAccountLifecycleCommand(disabled, {
        ...aCommand(f),
        expectedStatus: 'disabled',
        targetStatus: 'active',
        expectedEpoch: createOperationsPrincipalSecurityEpoch(3),
      }).nextEpoch,
    ).toBe(4);
    const recovered = { ...f, principal: { ...f.principal, securityEpoch: 4 } };
    expect(() =>
      assertOperationsSessionValidationContract(recovered, record(f), lookup(f)),
    ).toThrow('epoch_snapshot_mismatch');
    expect(() =>
      assertOperationsSessionCreationContract(recovered, {
        ...create(f),
        session: {
          ...f.session,
          principalSecurityEpoch: createOperationsPrincipalSecurityEpoch(4),
        },
      }),
    ).not.toThrow();
  });
  it('07 Credential replacement vs Create: version+1 and old-version Session revocation form one plan without an Epoch bump', () => {
    const f = fixture();
    const plan = planOperationsCredentialReplacement(f, replacement(f));
    expect(plan).toMatchObject({
      previousCredential: { status: 'revoked', version: 3 },
      nextCredential: { status: 'active', version: 4 },
      principalEpoch: 2,
      revokeSessionsForCredentialVersion: 3,
    });
    expect(() => assertOperationsSessionCreationContract(f, create(f))).not.toThrow();
    expect(() =>
      assertOperationsSessionCreationContract({ ...f, credential: plan.nextCredential }, create(f)),
    ).toThrow('credential_snapshot_mismatch');
    expect(f.credential).toMatchObject({ status: 'active', version: 3 });
  });
  it('08 Credential replacement vs Rotation: neither a prior rotation nor its old version can outlive replacement', () => {
    const f = fixture();
    const r = record(f);
    expect(planOperationsSessionRotation(f, r, rotate(r)).nextSessionVersion).toBe(2);
    const plan = planOperationsCredentialReplacement(f, replacement(f));
    expect(() =>
      planOperationsSessionRotation({ ...f, credential: plan.nextCredential }, r, rotate(r)),
    ).toThrow('credential_snapshot_mismatch');
  });
  it('09 Revoke vs Touch: terminal revocation wins over all later Touch while a prior Touch may finish', () => {
    const f = fixture();
    const r = record(f);
    const input = {
      ...lookup(f),
      nextLastActivityAt: new Date(now.getTime() + 1000),
      nextIdleExpiresAt: new Date(now.getTime() + 90000),
    };
    expect(planOperationsSessionTouch(f, r, input).idleExpiresAt).toEqual(
      new Date(now.getTime() + 90000),
    );
    const revoke = {
      sessionId: r.session.id,
      principalId: r.session.principalId,
      accountId: r.session.accountId,
      expectedSessionVersion: r.sessionVersion,
      revokedAt: audit.occurredAt,
    };
    const revoked = planOperationsSessionRevocation(r, revoke);
    expect(() => planOperationsSessionTouch(f, { ...r, session: revoked }, input)).toThrow(
      'session_not_active',
    );
    expect(planOperationsSessionRevocation({ ...r, session: revoked }, revoke)).toBe(revoked);
  });
  it('10 same expected Epoch for two logical updates: a second serialized update conflicts', () => {
    expect(planOperationsSecurityEpochIncrement(2, 2)).toBe(3);
    expect(() => planOperationsSecurityEpochIncrement(3, 2)).toThrow('expected_epoch_mismatch');
  });
  it('11 terminal vs recovery: a terminal winner rejects recovery, a recovery winner invalidates stale expected status', () => {
    const f = fixture();
    const disabled = { ...f.principal, status: 'disabled' as const };
    expect(
      planOperationsPrincipalLifecycleCommand(disabled, {
        ...pCommand(f),
        expectedStatus: 'disabled',
        targetStatus: 'tombstoned',
      }).revokeCredentials,
    ).toBe(true);
    expect(() =>
      planOperationsPrincipalLifecycleCommand(
        { ...disabled, status: 'tombstoned', securityEpoch: 3 },
        { ...pCommand(f), expectedStatus: 'disabled', targetStatus: 'active' },
      ),
    ).toThrow('terminal_state');
    expect(
      planOperationsPrincipalLifecycleCommand(disabled, {
        ...pCommand(f),
        expectedStatus: 'disabled',
        targetStatus: 'active',
      }).nextEpoch,
    ).toBe(3);
    expect(() =>
      planOperationsPrincipalLifecycleCommand(
        { ...f.principal, securityEpoch: 3 },
        { ...pCommand(f), expectedStatus: 'disabled', targetStatus: 'tombstoned' },
      ),
    ).toThrow('expected_status_mismatch');
  });
  it('12 terminal vs Create: terminal status and next Epoch are a single required effect and no terminal creation is usable', () => {
    const f = fixture();
    expect(() => assertOperationsSessionCreationContract(f, create(f))).not.toThrow();
    expect(
      planOperationsPrincipalLifecycleCommand(f.principal, {
        ...pCommand(f),
        targetStatus: 'tombstoned',
      }),
    ).toMatchObject({
      targetStatus: 'tombstoned',
      nextEpoch: 3,
      revokeCredentials: true,
      revokeSessions: 'principal',
    });
    expect(() =>
      assertOperationsSessionCreationContract(
        { ...f, principal: { ...f.principal, status: 'tombstoned', securityEpoch: 3 } },
        create(f),
      ),
    ).toThrow('parent_not_active');
  });
  it('13 Epoch change during Create: old snapshots fail, fresh snapshots match the new generation', () => {
    const f = fixture();
    const advanced = { ...f, principal: { ...f.principal, securityEpoch: 3 } };
    expect(() => assertOperationsSessionCreationContract(f, create(f))).not.toThrow();
    expect(() => assertOperationsSessionCreationContract(advanced, create(f))).toThrow(
      'epoch_snapshot_mismatch',
    );
    expect(() =>
      assertOperationsSessionCreationContract(advanced, {
        ...create(f),
        session: {
          ...f.session,
          principalSecurityEpoch: createOperationsPrincipalSecurityEpoch(3),
        },
      }),
    ).not.toThrow();
  });
  it('14 Account vs Principal changes: both consume the same expected Principal Epoch, never independent counters', () => {
    const f = fixture();
    expect(planOperationsAccountLifecycleCommand(f, aCommand(f)).nextEpoch).toBe(3);
    expect(() =>
      planOperationsPrincipalLifecycleCommand({ ...f.principal, securityEpoch: 3 }, pCommand(f)),
    ).toThrow('expected_epoch_mismatch');
    expect(planOperationsPrincipalLifecycleCommand(f.principal, pCommand(f)).nextEpoch).toBe(3);
    expect(() =>
      planOperationsAccountLifecycleCommand(
        { ...f, principal: { ...f.principal, status: 'disabled', securityEpoch: 3 } },
        aCommand(f),
      ),
    ).toThrow('expected_epoch_mismatch');
  });
});

describe('Application fail-closed, immutable contracts and declared lock traces', () => {
  it('keeps a Rotation Digest mismatch with matching Version a CAS conflict, while lookup mismatch is unauthenticated', () => {
    const f = fixture();
    const r = record(f);
    const mismatching = createOperationsSessionCredentialDigest('33'.repeat(32));
    let failure: unknown;
    try {
      planOperationsSessionRotation(f, r, { ...rotate(r), credentialDigest: mismatching });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(OperationsSessionConflictError);
    expect(failure).toMatchObject({ reason: 'credential_digest' });
    expect(classifyOperationsLifecycleFailure(failure)).toBe('cas_conflict');
    expect(() =>
      assertOperationsSessionValidationContract(f, r, { credentialDigest: mismatching, now }),
    ).toThrow('digest_mismatch');
  });
  it('retains distinct accepted branded Epoch, Credential Version and Session Version at the new Port', () => {
    expectTypeOf<'activationHistory'>().not.toMatchTypeOf<
      keyof OperationsPrincipalLifecycleCommand
    >();
    expectTypeOf<'activationHistory'>().not.toMatchTypeOf<
      keyof OperationsAccountLifecycleCommand
    >();
    expectTypeOf<'activationHistory'>().not.toMatchTypeOf<
      keyof OperationsCredentialReplacementCommand
    >();
    expectTypeOf<
      OperationsPrincipalLifecycleCommand['expectedEpoch']
    >().toEqualTypeOf<OperationsPrincipalSecurityEpoch>();
    expectTypeOf<
      OperationsAccountLifecycleCommand['expectedEpoch']
    >().toEqualTypeOf<OperationsPrincipalSecurityEpoch>();
    expectTypeOf<
      OperationsCredentialReplacementCommand['expectedVersion']
    >().toEqualTypeOf<OperationsSessionCredentialVersion>();
    expectTypeOf<
      OperationsLifecycleApplicationPlan<'active'>['nextEpoch']
    >().toEqualTypeOf<OperationsPrincipalSecurityEpoch>();
    expectTypeOf<OperationsPrincipalSecurityEpoch>().not.toMatchTypeOf<OperationsSessionCredentialVersion>();
    expectTypeOf<OperationsPrincipalSecurityEpoch>().not.toMatchTypeOf<OperationsSessionVersion>();
  });
  it('preserves accepted Session error categories rather than treating old Port failures as infrastructure', () => {
    expect(classifyOperationsLifecycleFailure(new OperationsSessionNotAuthenticatedError())).toBe(
      'not_authenticated',
    );
    expect(
      classifyOperationsLifecycleFailure(new OperationsSessionConflictError('session_version')),
    ).toBe('cas_conflict');
    expect(
      classifyOperationsLifecycleFailure(new OperationsSessionConflictError('ownership')),
    ).toBe('state_conflict');
    expect(classifyOperationsLifecycleFailure(new OperationsSessionPersistenceError('40001'))).toBe(
      'infrastructure_failure',
    );
  });
  it('first activates independent Principal/Account history without changing Epoch or making inactive snapshots eligible', () => {
    const f = fixture();
    expect(
      planOperationsPrincipalLifecycleCommand(
        { ...f.principal, status: 'pending', activationHistory: 'never_activated' },
        { ...pCommand(f), expectedStatus: 'pending', targetStatus: 'active' },
      ),
    ).toMatchObject({
      nextEpoch: 2,
      nextActivationHistory: 'previously_activated',
      activationKind: 'first_activation',
    });
    expect(
      planOperationsAccountLifecycleCommand(
        {
          ...f,
          account: { ...f.account, status: 'invited', activationHistory: 'never_activated' },
        },
        { ...aCommand(f), expectedStatus: 'invited', targetStatus: 'active' },
      ),
    ).toMatchObject({
      nextEpoch: 2,
      nextActivationHistory: 'previously_activated',
      activationKind: 'first_activation',
    });
    expect(() =>
      assertOperationsSessionCreationContract(
        { ...f, account: { ...f.account, status: 'invited' } },
        create(f),
      ),
    ).toThrow('parent_not_active');
  });
  it('requires known owners and a current active Credential rather than trusting session fields', () => {
    const f = fixture();
    expect(() =>
      assertOperationsSessionCreationContract({ ...f, principal: undefined }, create(f)),
    ).toThrow('principal_not_found');
    expect(() =>
      assertOperationsSessionCreationContract({ ...f, account: undefined }, create(f)),
    ).toThrow('account_not_found');
    expect(() =>
      assertOperationsSessionCreationContract({ ...f, credential: undefined }, create(f)),
    ).toThrow('credential_not_active');
    expect(() =>
      assertOperationsSessionCreationContract(
        { ...f, credential: { ...f.credential, status: 'revoked', revokedAt: now } },
        create(f),
      ),
    ).toThrow('credential_not_active');
    expect(() =>
      assertOperationsSessionCreationContract(
        {
          ...f,
          credential: { ...f.credential, accountId: createOperationsAccountId('other-account') },
        },
        create(f),
      ),
    ).toThrow('ownership_mismatch');
  });
  it('ignores forged activation approval in commands and uses each authoritative entity history', () => {
    const f = fixture();
    const forgedPrincipalCommand = {
      ...pCommand(f),
      expectedStatus: 'disabled' as const,
      targetStatus: 'active' as const,
      activationHistory: 'never_activated',
      principal: { ...f.principal, activationHistory: 'never_activated' },
    };
    expect(() =>
      planOperationsPrincipalLifecycleCommand(
        { ...f.principal, status: 'disabled', activationHistory: 'unknown' },
        forgedPrincipalCommand,
      ),
    ).toThrow('activation_history_unknown');
    const forgedAccountCommand = {
      ...aCommand(f),
      expectedStatus: 'disabled' as const,
      targetStatus: 'active' as const,
      activationHistory: 'previously_activated',
      account: { ...f.account, activationHistory: 'previously_activated' },
    };
    expect(() =>
      planOperationsAccountLifecycleCommand(
        { ...f, account: { ...f.account, status: 'disabled', activationHistory: 'unknown' } },
        forgedAccountCommand,
      ),
    ).toThrow('activation_history_unknown');
    expect(
      planOperationsAccountLifecycleCommand(
        {
          ...f,
          account: { ...f.account, status: 'disabled', activationHistory: 'never_activated' },
        },
        forgedAccountCommand,
      ),
    ).toMatchObject({ nextEpoch: 2, activationKind: 'first_activation' });
  });
  it.each(['pending', 'suspended', 'disabled', 'tombstoned'] as const)(
    'refuses ordinary or allegedly privileged Credential replacement with %s Principal',
    (status) => {
      const f = fixture();
      const command = { ...replacement(f), privileged: true, role: 'administrator' };
      expect(() =>
        planOperationsCredentialReplacement(
          { ...f, principal: { ...f.principal, status } },
          command,
        ),
      ).toThrow('parent_not_active');
    },
  );
  it.each(['invited', 'locked', 'disabled', 'revoked'] as const)(
    'refuses ordinary or allegedly privileged Credential replacement with %s Account',
    (status) => {
      const f = fixture();
      const command = { ...replacement(f), privileged: true, role: 'administrator' };
      expect(() =>
        planOperationsCredentialReplacement({ ...f, account: { ...f.account, status } }, command),
      ).toThrow('parent_not_active');
    },
  );
  it('does not rewrite either activation history during Credential replacement or carry history writes in its plan', () => {
    const f = fixture();
    const original = structuredClone(f);
    const command = {
      ...replacement(f),
      activationHistory: 'never_activated',
      principalActivationHistory: 'unknown',
      accountActivationHistory: 'unknown',
    };
    const plan = planOperationsCredentialReplacement(f, command);
    expect(f).toEqual(original);
    expect(plan).not.toHaveProperty('nextActivationHistory');
    expect(plan).not.toHaveProperty('principalActivationHistory');
    expect(plan).not.toHaveProperty('accountActivationHistory');
    expect(plan).toMatchObject({
      principalEpoch: 2,
      nextCredential: { version: 4 },
      revokeSessionsForCredentialVersion: 3,
    });
  });
  it('requires active parent history consistency for Session eligibility and normal Credential replacement', () => {
    const f = fixture();
    expect(() =>
      assertOperationsSessionCreationContract(
        { ...f, principal: { ...f.principal, activationHistory: 'unknown' } },
        create(f),
      ),
    ).toThrow('activation_history_inconsistent');
    expect(() =>
      planOperationsCredentialReplacement(
        { ...f, account: { ...f.account, activationHistory: 'never_activated' } },
        replacement(f),
      ),
    ).toThrow('activation_history_inconsistent');
  });
  it.each(['pending', 'suspended', 'disabled', 'tombstoned'] as const)(
    'requires an active Principal for Account activation when Principal is %s',
    (status) => {
      const f = fixture();
      const principal = {
        ...f.principal,
        status,
        activationHistory:
          status === 'pending' ? ('never_activated' as const) : ('previously_activated' as const),
      };
      expect(() =>
        planOperationsAccountLifecycleCommand(
          {
            ...f,
            principal,
            account: { ...f.account, status: 'invited', activationHistory: 'never_activated' },
          },
          { ...aCommand(f), expectedStatus: 'invited', targetStatus: 'active' },
        ),
      ).toThrow(status === 'tombstoned' ? 'terminal_state' : 'parent_not_active');
    },
  );
  it('rejects both expiry boundaries and preserves absolute expiry on Rotation and stale Touch', () => {
    const f = fixture();
    const r = record(f);
    for (const boundary of [f.session.idleExpiresAt, f.session.absoluteExpiresAt])
      expect(() =>
        assertOperationsSessionValidationContract(f, r, { ...lookup(f), now: boundary }),
      ).toThrow('session_expired');
    const plan = planOperationsSessionRotation(f, r, rotate(r));
    expect(plan.absoluteExpiresAt).toEqual(new Date(now.getTime() + 120000));
    expect(() =>
      planOperationsSessionRotation(f, r, {
        ...rotate(r),
        nextIdleExpiresAt: new Date(now.getTime() + 120001),
      }),
    ).toThrow('invalid_lifecycle_input');
    const touched = {
      ...r,
      session: {
        ...r.session,
        lastActivityAt: new Date(now.getTime() + 2000),
        idleExpiresAt: new Date(now.getTime() + 90000),
      },
    };
    expect(
      planOperationsSessionTouch(f, touched, {
        ...lookup(f),
        nextLastActivityAt: new Date(now.getTime() + 1000),
        nextIdleExpiresAt: new Date(now.getTime() + 80000),
      }),
    ).toEqual({
      lastActivityAt: new Date(now.getTime() + 2000),
      idleExpiresAt: new Date(now.getTime() + 90000),
    });
  });
  it('keeps Digest CAS and Session Version separate from Credential Version and Epoch, with no old-Digest grace', () => {
    const f = fixture();
    const r = record(f);
    const request = rotate(r);
    const rotated = {
      ...r,
      credentialDigest: request.nextCredentialDigest,
      sessionVersion: createOperationsSessionVersion(2),
    };
    expect(() => planOperationsSessionRotation(f, rotated, request)).toThrow(
      'expected_version_mismatch',
    );
    expect(() => assertOperationsSessionValidationContract(f, rotated, lookup(f))).toThrow(
      'digest_mismatch',
    );
    expect(() =>
      assertOperationsSessionValidationContract(f, rotated, {
        credentialDigest: request.nextCredentialDigest,
        now,
      }),
    ).not.toThrow();
    expect(rotated.session).toMatchObject({ credentialVersion: 3, principalSecurityEpoch: 2 });
  });
  it('refuses stale Credential replacement and all counter overflow before returning a plan', () => {
    const f = fixture();
    const original = structuredClone(f);
    expect(() =>
      planOperationsCredentialReplacement(f, {
        ...replacement(f),
        expectedVersion: createOperationsSessionCredentialVersion(2),
      }),
    ).toThrow('expected_version_mismatch');
    expect(() =>
      planOperationsCredentialReplacement(f, {
        ...replacement(f),
        expectedEpoch: createOperationsPrincipalSecurityEpoch(1),
      }),
    ).toThrow('expected_epoch_mismatch');
    expect(() =>
      planOperationsCredentialReplacement(
        { ...f, credential: { ...f.credential, version: 2147483647 } },
        {
          ...replacement(f),
          expectedVersion: createOperationsSessionCredentialVersion(2147483647),
        },
      ),
    ).toThrow('version_exhausted');
    const max = { ...record(f), sessionVersion: createOperationsSessionVersion(2147483647) };
    expect(() => planOperationsSessionRotation(f, max, rotate(max))).toThrow('version_exhausted');
    expect(f).toEqual(original); // Pure validation rollback scope only, not a database rollback test.
  });
  it('requires audit attribution, exact ownership and matching operation timestamps', () => {
    const f = fixture();
    expect(() => planOperationsPrincipalLifecycleCommand(undefined, pCommand(f))).toThrow(
      'principal_not_found',
    );
    expect(() =>
      planOperationsPrincipalLifecycleCommand(f.principal, {
        ...pCommand(f),
        principalId: createOperationsHumanPrincipalId('other-human'),
      }),
    ).toThrow('ownership_mismatch');
    expect(() =>
      planOperationsPrincipalLifecycleCommand(f.principal, {
        ...pCommand(f),
        audit: { ...audit, reasonCode: '' },
      }),
    ).toThrow('invalid_lifecycle_input');
    expect(() =>
      planOperationsCredentialReplacement(f, { ...replacement(f), replacedAt: now }),
    ).toThrow('invalid_lifecycle_input');
  });
  it('accepts a declared parent-first trace and rejects child-first, reversed sets and blank IDs', () => {
    expect(() =>
      assertOperationsLifecycleLockOrder([
        { kind: 'principal', id: 'p' },
        { kind: 'account', id: 'a' },
        { kind: 'credential', id: 'c1' },
        { kind: 'credential', id: 'c2' },
        { kind: 'session', id: 's' },
      ]),
    ).not.toThrow();
    expect(() =>
      assertOperationsLifecycleLockOrder([
        { kind: 'account', id: 'a' },
        { kind: 'principal', id: 'p' },
      ]),
    ).toThrow('invalid_lock_order');
    expect(() =>
      assertOperationsLifecycleLockOrder([
        { kind: 'session', id: 's2' },
        { kind: 'session', id: 's1' },
      ]),
    ).toThrow('invalid_lock_order');
    expect(() => assertOperationsLifecycleLockOrder([{ kind: 'principal', id: ' ' }])).toThrow(
      'invalid_lock_order',
    );
  });
  it('does not turn permission denial, CAS, history conflicts or infrastructure failures into authentication errors', () => {
    expect(
      classifyOperationsLifecycleFailure(new OperationsLifecycleContractError('parent_not_active')),
    ).toBe('not_authenticated');
    expect(
      classifyOperationsLifecycleFailure(new OperationsLifecycleContractError('not_authorized')),
    ).toBe('not_authorized');
    expect(
      classifyOperationsLifecycleFailure(
        new OperationsLifecycleContractError('expected_status_mismatch'),
      ),
    ).toBe('state_conflict');
    expect(
      classifyOperationsLifecycleFailure(
        new OperationsLifecycleContractError('expected_epoch_mismatch'),
      ),
    ).toBe('cas_conflict');
    expect(
      classifyOperationsLifecycleFailure(
        new OperationsLifecycleContractError('activation_history_unknown'),
      ),
    ).toBe('state_conflict');
    expect(
      classifyOperationsLifecycleFailure(
        new OperationsLifecycleContractError('principal_not_found'),
      ),
    ).toBe('not_found');
    for (const code of [
      'database_unavailable',
      'deadlock',
      'transaction_conflict',
      'transaction_failed',
      'commit_outcome_unknown',
    ] as const) {
      const error = new OperationsLifecycleContractError(code);
      expect(classifyOperationsLifecycleFailure(error)).toBe('infrastructure_failure');
      expect(error).not.toHaveProperty('cause');
      expect(error.message).not.toContain(replacement().verifier);
    }
    expect(classifyOperationsLifecycleFailure(new Error('untrusted driver detail'))).toBe(
      'infrastructure_failure',
    );
  });
});

describe('FD-UNKNOWN-01 Application plans (no database or concurrency proof)', () => {
  const principalRestrictions = [
    ['pending', 'disabled', 2],
    ['pending', 'tombstoned', 3],
    ['active', 'suspended', 3],
    ['active', 'disabled', 3],
    ['active', 'tombstoned', 3],
    ['suspended', 'disabled', 2],
    ['suspended', 'tombstoned', 3],
    ['disabled', 'tombstoned', 3],
  ] as const;
  const accountRestrictions = [
    ['invited', 'disabled', 2],
    ['invited', 'revoked', 3],
    ['active', 'locked', 3],
    ['active', 'disabled', 3],
    ['active', 'revoked', 3],
    ['locked', 'disabled', 2],
    ['locked', 'revoked', 3],
    ['disabled', 'revoked', 3],
  ] as const;

  it.each(principalRestrictions)(
    'plans P unknown %s -> %s with complete scoped effects',
    (current, target, epoch) => {
      const f = fixture();
      const principal = { ...f.principal, status: current, activationHistory: 'unknown' as const };
      const original = structuredClone(principal);
      const command = { ...pCommand(f), expectedStatus: current, targetStatus: target };
      expect(planOperationsPrincipalLifecycleCommand(principal, command)).toMatchObject({
        safetyOperation: 'restrictive_unknown',
        previousStatus: current,
        targetStatus: target,
        previousEpoch: 2,
        nextEpoch: epoch,
        previousActivationHistory: 'unknown',
        nextActivationHistory: 'unknown',
        activationKind: 'none',
        noOp: false,
        revokeSessions: 'principal',
        revokeCredentials: target === 'tombstoned',
        reauthenticationRequired: true,
      });
      expect(principal).toEqual(original);
      expect(command.audit).toEqual(audit);
    },
  );

  it.each(accountRestrictions)(
    'plans A unknown %s -> %s against an unknown active P',
    (current, target, epoch) => {
      const f = fixture();
      const snapshot = {
        ...f,
        principal: { ...f.principal, activationHistory: 'unknown' as const },
        account: { ...f.account, status: current, activationHistory: 'unknown' as const },
      };
      const original = structuredClone(snapshot);
      expect(
        planOperationsAccountLifecycleCommand(snapshot, {
          ...aCommand(f),
          expectedStatus: current,
          targetStatus: target,
        }),
      ).toMatchObject({
        safetyOperation: 'restrictive_unknown',
        previousEpoch: 2,
        nextEpoch: epoch,
        previousActivationHistory: 'unknown',
        nextActivationHistory: 'unknown',
        activationKind: 'none',
        revokeSessions: 'account',
        revokeCredentials: target === 'revoked',
      });
      expect(snapshot).toEqual(original);
    },
  );

  it.each(['pending', 'active', 'suspended', 'disabled'] as const)(
    'restricts a known Account with %s/unknown P without granting parent eligibility',
    (status) => {
      const f = fixture();
      const snapshot = {
        ...f,
        principal: { ...f.principal, status, activationHistory: 'unknown' as const },
      };
      const before = structuredClone(snapshot);
      expect(planOperationsAccountLifecycleCommand(snapshot, aCommand(f))).toMatchObject({
        safetyOperation: 'restrictive_unknown',
        nextEpoch: 3,
        revokeSessions: 'account',
        previousActivationHistory: 'previously_activated',
        nextActivationHistory: 'previously_activated',
      });
      expect(snapshot).toEqual(before);
      expect(() => assertOperationsSessionCreationContract(snapshot, create(f))).toThrow();
    },
  );

  it('requires authoritative owners, histories, status and Epoch during restrictions', () => {
    const f = fixture();
    const unknown = {
      ...f,
      principal: { ...f.principal, activationHistory: 'unknown' as const },
      account: { ...f.account, activationHistory: 'unknown' as const },
    };
    expect(() =>
      planOperationsAccountLifecycleCommand({ ...unknown, principal: undefined }, aCommand(f)),
    ).toThrow('principal_not_found');
    expect(() =>
      planOperationsAccountLifecycleCommand({ ...unknown, account: undefined }, aCommand(f)),
    ).toThrow('account_not_found');
    expect(() =>
      planOperationsAccountLifecycleCommand(
        {
          ...unknown,
          account: { ...unknown.account, principalId: createOperationsHumanPrincipalId('other') },
        },
        aCommand(f),
      ),
    ).toThrow('ownership_mismatch');
    expect(() =>
      planOperationsAccountLifecycleCommand(
        { ...unknown, principal: { ...unknown.principal, status: 'tombstoned' } },
        aCommand(f),
      ),
    ).toThrow('terminal_state');
    expect(() =>
      planOperationsAccountLifecycleCommand(unknown, {
        ...aCommand(f),
        expectedStatus: 'disabled',
      }),
    ).toThrow('expected_status_mismatch');
    expect(() =>
      planOperationsAccountLifecycleCommand(unknown, {
        ...aCommand(f),
        expectedEpoch: createOperationsPrincipalSecurityEpoch(1),
      }),
    ).toThrow('expected_epoch_mismatch');
    expect(() =>
      planOperationsAccountLifecycleCommand(unknown, {
        ...aCommand(f),
        audit: { ...audit, correlationId: '' },
      }),
    ).toThrow('invalid_lifecycle_input');
    for (const key of ['principal', 'account'] as const) {
      if (key === 'principal') {
        const missingPrincipal = { ...unknown.principal };
        Reflect.deleteProperty(missingPrincipal, 'activationHistory');
        expect(() =>
          planOperationsAccountLifecycleCommand(
            { ...unknown, principal: missingPrincipal },
            aCommand(f),
          ),
        ).toThrow('activation_history_inconsistent');
      } else {
        const missingAccount = { ...unknown.account };
        Reflect.deleteProperty(missingAccount, 'activationHistory');
        expect(() =>
          planOperationsAccountLifecycleCommand(
            { ...unknown, account: missingAccount },
            aCommand(f),
          ),
        ).toThrow('activation_history_inconsistent');
      }
      expect(() =>
        planOperationsAccountLifecycleCommand(
          { ...unknown, [key]: { ...unknown[key], activationHistory: 'never_activated' } },
          aCommand(f),
        ),
      ).toThrow('activation_history_inconsistent');
    }
  });

  for (const owner of ['principal', 'account'] as const) {
    for (const history of ['unknown', 'never_activated'] as const) {
      for (const operation of ['replacement', 'create', 'validate', 'touch', 'rotation'] as const) {
        it(`rejects ${operation} with active ${owner}/${history} despite forged approval`, () => {
          const f = fixture();
          const snapshot: OperationsIdentitySecuritySnapshot = {
            ...f,
            [owner]: { ...f[owner], activationHistory: history },
          };
          const commands = {
            replacement: () =>
              planOperationsCredentialReplacement(snapshot, {
                ...replacement(f),
                ...{
                  force: true,
                  approved: true,
                  privileged: true,
                  activationHistory: 'previously_activated',
                },
              }),
            create: () => assertOperationsSessionCreationContract(snapshot, create(f)),
            validate: () =>
              assertOperationsSessionValidationContract(snapshot, record(f), lookup(f)),
            touch: () =>
              planOperationsSessionTouch(snapshot, record(f), {
                ...lookup(f),
                nextLastActivityAt: now,
                nextIdleExpiresAt: f.session.idleExpiresAt,
              }),
            rotation: () => planOperationsSessionRotation(snapshot, record(f), rotate(record(f))),
          };
          expect(commands[operation]).toThrow('activation_history_inconsistent');
        });
      }
    }
  }

  it.each(['pending', 'suspended', 'disabled'] as const)(
    'rejects unknown Principal %s first/recovery activation without trusting request fields',
    (status) => {
      const f = fixture();
      const command = {
        ...pCommand(f),
        expectedStatus: status,
        targetStatus: 'active' as const,
        force: true,
        approved: true,
        safetyOperation: 'restrictive_unknown',
        activationHistory: 'never_activated',
      };
      expect(() =>
        planOperationsPrincipalLifecycleCommand(
          { ...f.principal, status, activationHistory: 'unknown' },
          command,
        ),
      ).toThrow('activation_history_unknown');
    },
  );
  it.each(['invited', 'locked', 'disabled'] as const)(
    'rejects unknown Account %s first/recovery activation',
    (status) => {
      const f = fixture();
      expect(() =>
        planOperationsAccountLifecycleCommand(
          { ...f, account: { ...f.account, status, activationHistory: 'unknown' } },
          { ...aCommand(f), expectedStatus: status, targetStatus: 'active' },
        ),
      ).toThrow('activation_history_unknown');
    },
  );

  it('preserves terminal and unknown no-op rejection while allowing independent Session cleanup', () => {
    const f = fixture();
    const snapshot = {
      ...f,
      principal: {
        ...f.principal,
        status: 'tombstoned' as const,
        activationHistory: 'unknown' as const,
      },
      account: { ...f.account, status: 'revoked' as const, activationHistory: 'unknown' as const },
    };
    expect(() =>
      planOperationsPrincipalLifecycleCommand(snapshot.principal, {
        ...pCommand(f),
        expectedStatus: 'tombstoned',
        targetStatus: 'tombstoned',
      }),
    ).toThrow('terminal_state');
    expect(() =>
      planOperationsAccountLifecycleCommand(snapshot, {
        ...aCommand(f),
        expectedStatus: 'revoked',
        targetStatus: 'revoked',
      }),
    ).toThrow('terminal_state');
    const unknown = { ...f.principal, activationHistory: 'unknown' as const };
    expect(() =>
      planOperationsPrincipalLifecycleCommand(unknown, { ...pCommand(f), targetStatus: 'active' }),
    ).toThrow('activation_history_inconsistent');
    const request = {
      sessionId: f.session.id,
      principalId: f.principal.id,
      accountId: f.account.id,
      expectedSessionVersion: createOperationsSessionVersion(1),
      revokedAt: audit.occurredAt,
    };
    const revoked = planOperationsSessionRevocation(record(f), request);
    expect(revoked).toMatchObject({ status: 'revoked', revokedAt: audit.occurredAt });
    expect(
      planOperationsSessionRevocation(
        { ...record(f), session: revoked },
        {
          ...request,
          revokedAt: new Date(audit.occurredAt.getTime() + 1000),
        },
      ),
    ).toEqual(revoked);
    expect(snapshot.principal).toMatchObject({
      status: 'tombstoned',
      securityEpoch: 2,
      activationHistory: 'unknown',
    });
    expect(snapshot.account).toMatchObject({ status: 'revoked', activationHistory: 'unknown' });
  });

  it('keeps restrictive operation types closed and command history-free', () => {
    expectTypeOf<OperationsLifecycleApplicationPlan<'disabled'>['safetyOperation']>().toEqualTypeOf<
      'standard' | 'restrictive_unknown'
    >();
    expectTypeOf<
      Extract<keyof OperationsPrincipalLifecycleCommand, 'activationHistory' | 'approved' | 'force'>
    >().toEqualTypeOf<never>();
    expectTypeOf<
      Extract<
        keyof OperationsAccountLifecycleCommand,
        'activationHistory' | 'privileged' | 'isAdmin'
      >
    >().toEqualTypeOf<never>();
  });

  it.each(['operationId', 'correlationId', 'reasonCode'] as const)(
    'requires %s audit attribution for both unknown restriction scopes',
    (key) => {
      const f = fixture();
      const snapshot = {
        ...f,
        principal: { ...f.principal, activationHistory: 'unknown' as const },
        account: { ...f.account, activationHistory: 'unknown' as const },
      };
      const invalidAudit = { ...audit, [key]: '' };
      expect(() =>
        planOperationsPrincipalLifecycleCommand(snapshot.principal, {
          ...pCommand(f),
          audit: invalidAudit,
        }),
      ).toThrow('invalid_lifecycle_input');
      expect(() =>
        planOperationsAccountLifecycleCommand(snapshot, {
          ...aCommand(f),
          audit: invalidAudit,
        }),
      ).toThrow('invalid_lifecycle_input');
    },
  );
});
