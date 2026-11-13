import { describe, expect, it } from 'vitest';

import {
  createOperationsAccountId,
  createOperationsHumanPrincipalId,
  type OperationsAccountStatus,
  type OperationsHumanPrincipalStatus,
} from './operations-identity-contract.js';
import {
  OPERATIONS_LIFECYCLE_COUNTER_MAX,
  initializeOperationsPrincipalLifecycle,
  initializeOperationsAccountLifecycle,
  planOperationsAccountTransition,
  planOperationsPrincipalTransition,
  planOperationsSecurityEpochIncrement,
  type OperationsPrincipalLifecycleState,
  type OperationsAccountLifecycleState,
  type OperationsLifecycleSafetyOperation,
} from './operations-identity-lifecycle-contract.js';

// Founder decision tests prove pure plans only, not authoritative storage or SQL transactions.
describe('FD-C1-01/02 first activation and independent history', () => {
  it('initializes a new Principal at Epoch zero and a new Account with its own never-activated history', () => {
    const untrustedInput = { ...human(), securityEpoch: 99 };
    const principal = initializeOperationsPrincipalLifecycle(untrustedInput);
    const child = initializeOperationsAccountLifecycle(account());
    expect(principal).toMatchObject({
      status: 'pending',
      securityEpoch: 0,
      activationHistory: 'never_activated',
    });
    expect(child).toMatchObject({ status: 'invited', activationHistory: 'never_activated' });
  });
  it.each(['pending', 'disabled'] as const)(
    'first activates %s Principal without changing Epoch',
    (status) => {
      const principal = { ...human(status, 7), activationHistory: 'never_activated' as const };
      expect(
        planOperationsPrincipalTransition(principal, {
          expectedStatus: status,
          targetStatus: 'active',
          expectedEpoch: 7,
        }),
      ).toMatchObject({
        previousEpoch: 7,
        nextEpoch: 7,
        previousActivationHistory: 'never_activated',
        nextActivationHistory: 'previously_activated',
        activationKind: 'first_activation',
        auditOutcome: 'first_activated',
      });
      expect(principal.activationHistory).toBe('never_activated');
    },
  );
  it.each(['invited', 'disabled'] as const)(
    'first activates %s Account without changing its already-active Principal Epoch',
    (status) => {
      const principal = { ...human(), activationHistory: 'previously_activated' as const };
      const child = { ...account(status), activationHistory: 'never_activated' as const };
      expect(
        planOperationsAccountTransition(principal, child, {
          expectedStatus: status,
          targetStatus: 'active',
          expectedEpoch: 4,
        }),
      ).toMatchObject({
        nextEpoch: 4,
        previousActivationHistory: 'never_activated',
        nextActivationHistory: 'previously_activated',
        activationKind: 'first_activation',
      });
      expect(principal.activationHistory).toBe('previously_activated');
      expect(child.activationHistory).toBe('never_activated');
    },
  );
  it.each(['suspended', 'disabled'] as const)(
    'recovers %s Principal with Epoch +1 and irreversible history',
    (status) => {
      expect(
        planOperationsPrincipalTransition(
          { ...human(status), activationHistory: 'previously_activated' },
          { expectedStatus: status, targetStatus: 'active', expectedEpoch: 4 },
        ),
      ).toMatchObject({
        nextEpoch: 5,
        nextActivationHistory: 'previously_activated',
        activationKind: 'recovery',
      });
    },
  );
  it.each(['locked', 'disabled'] as const)(
    'recovers %s Account with owning Principal Epoch +1',
    (status) => {
      expect(
        planOperationsAccountTransition(
          { ...human(), activationHistory: 'previously_activated' },
          { ...account(status), activationHistory: 'previously_activated' },
          { expectedStatus: status, targetStatus: 'active', expectedEpoch: 4 },
        ),
      ).toMatchObject({
        nextEpoch: 5,
        nextActivationHistory: 'previously_activated',
        activationKind: 'recovery',
      });
    },
  );
  it.each(['pending', 'disabled', 'suspended'] as const)(
    'rejects unknown %s Principal activation instead of inferring from Epoch',
    (status) => {
      expect(() =>
        planOperationsPrincipalTransition(
          { ...human(status, 9), activationHistory: 'unknown' },
          { expectedStatus: status, targetStatus: 'active', expectedEpoch: 9 },
        ),
      ).toThrow('activation_history_unknown');
    },
  );
  it.each(['invited', 'disabled', 'locked'] as const)(
    'rejects unknown %s Account activation',
    (status) => {
      expect(() =>
        planOperationsAccountTransition(
          { ...human(), activationHistory: 'previously_activated' },
          { ...account(status), activationHistory: 'unknown' },
          { expectedStatus: status, targetStatus: 'active', expectedEpoch: 4 },
        ),
      ).toThrow('activation_history_unknown');
    },
  );
  it('rejects previously-activated pending/invited states rather than treating them as recovery', () => {
    expect(() =>
      planOperationsPrincipalTransition(
        { ...human('pending'), activationHistory: 'previously_activated' },
        { expectedStatus: 'pending', targetStatus: 'active', expectedEpoch: 4 },
      ),
    ).toThrow('activation_history_inconsistent');
    expect(() =>
      planOperationsAccountTransition(
        { ...human(), activationHistory: 'previously_activated' },
        { ...account('invited'), activationHistory: 'previously_activated' },
        { expectedStatus: 'invited', targetStatus: 'active', expectedEpoch: 4 },
      ),
    ).toThrow('activation_history_inconsistent');
  });
  it('requires an active Principal for first Account activation', () => {
    expect(() =>
      planOperationsAccountTransition(
        { ...human('disabled'), activationHistory: 'previously_activated' },
        { ...account('invited'), activationHistory: 'never_activated' },
        { expectedStatus: 'invited', targetStatus: 'active', expectedEpoch: 4 },
      ),
    ).toThrow('parent_not_active');
  });
});

// FD-UNKNOWN-01 is a pure planning contract, not a database migration or lock proof.
describe('FD-UNKNOWN-01 complete unknown-history matrices', () => {
  const principalStates = ['pending', 'active', 'suspended', 'disabled', 'tombstoned'] as const;
  const accountStates = ['invited', 'active', 'locked', 'disabled', 'revoked'] as const;
  // Independent specification: N=existing no-op, B=inactive restriction, E=active departure,
  // T=terminal, U=unknown activation, I=inconsistent no-op, D=forbidden, X=terminal rejection.
  const expected = [
    ['N', 'U', 'D', 'B', 'T'],
    ['D', 'I', 'E', 'E', 'T'],
    ['D', 'U', 'I', 'B', 'T'],
    ['D', 'U', 'D', 'N', 'T'],
    ['X', 'X', 'X', 'X', 'X'],
  ] as const;

  for (const [row, current] of principalStates.entries()) {
    for (const [column, target] of principalStates.entries()) {
      it(`Principal unknown ${current} -> ${target}`, () => {
        const principal = { ...human(current), activationHistory: 'unknown' as const };
        const before = structuredClone(principal);
        const run = () =>
          planOperationsPrincipalTransition(principal, {
            expectedStatus: current,
            targetStatus: target,
            expectedEpoch: 4,
          });
        const outcome = expected[row]![column]!;
        const errors = {
          U: 'activation_history_unknown',
          I: 'activation_history_inconsistent',
          D: 'transition_not_allowed',
          X: 'terminal_state',
        } as const;
        if (outcome === 'N' || outcome === 'B' || outcome === 'E' || outcome === 'T') {
          const safetyOperation: OperationsLifecycleSafetyOperation =
            outcome === 'N' ? 'standard' : 'restrictive_unknown';
          expect(run()).toMatchObject({
            safetyOperation,
            previousStatus: current,
            targetStatus: target,
            previousEpoch: 4,
            nextEpoch: outcome === 'E' || outcome === 'T' ? 5 : 4,
            previousActivationHistory: 'unknown',
            nextActivationHistory: 'unknown',
            activationKind: 'none',
            noOp: outcome === 'N',
            revokeSessions: outcome === 'N' ? 'none' : 'principal',
            revokeCredentials: outcome === 'T',
            reauthenticationRequired: outcome !== 'N',
            auditOutcome:
              outcome === 'N'
                ? 'no_op'
                : outcome === 'T'
                  ? 'terminal'
                  : outcome === 'E'
                    ? 'deactivated'
                    : 'status_changed',
          });
        } else expect(run).toThrow(errors[outcome]);
        expect(principal).toEqual(before);
      });
    }
  }
  for (const [row, current] of accountStates.entries()) {
    for (const [column, target] of accountStates.entries()) {
      it(`Account unknown ${current} -> ${target}`, () => {
        const principal = human();
        const child = { ...account(current), activationHistory: 'unknown' as const };
        const before = structuredClone({ principal, child });
        const run = () =>
          planOperationsAccountTransition(principal, child, {
            expectedStatus: current,
            targetStatus: target,
            expectedEpoch: 4,
          });
        const outcome = expected[row]![column]!;
        const errors = {
          U: 'activation_history_unknown',
          I: 'activation_history_inconsistent',
          D: 'transition_not_allowed',
          X: 'terminal_state',
        } as const;
        if (outcome === 'N' || outcome === 'B' || outcome === 'E' || outcome === 'T') {
          expect(run()).toMatchObject({
            safetyOperation: outcome === 'N' ? 'standard' : 'restrictive_unknown',
            previousStatus: current,
            targetStatus: target,
            previousEpoch: 4,
            nextEpoch: outcome === 'E' || outcome === 'T' ? 5 : 4,
            previousActivationHistory: 'unknown',
            nextActivationHistory: 'unknown',
            activationKind: 'none',
            noOp: outcome === 'N',
            revokeSessions: outcome === 'N' ? 'none' : 'account',
            revokeCredentials: outcome === 'T',
            reauthenticationRequired: outcome !== 'N',
            auditOutcome:
              outcome === 'N'
                ? 'no_op'
                : outcome === 'T'
                  ? 'terminal'
                  : outcome === 'E'
                    ? 'deactivated'
                    : 'status_changed',
          });
        } else expect(run).toThrow(errors[outcome]);
        expect({ principal, child }).toEqual(before);
      });
    }
  }

  const accountRestrictions = [
    ['invited', 'disabled', 4],
    ['invited', 'revoked', 5],
    ['active', 'locked', 5],
    ['active', 'disabled', 5],
    ['active', 'revoked', 5],
    ['locked', 'disabled', 4],
    ['locked', 'revoked', 5],
    ['disabled', 'revoked', 5],
  ] as const;
  for (const parentStatus of ['pending', 'active', 'suspended', 'disabled'] as const) {
    for (const childHistory of ['known', 'unknown'] as const) {
      it.each(accountRestrictions)(
        `P ${parentStatus}/unknown with ${childHistory} A %s -> %s preserves parent state/history`,
        (current, target, nextEpoch) => {
          const principal = { ...human(parentStatus), activationHistory: 'unknown' as const };
          const child =
            childHistory === 'unknown'
              ? { ...account(current), activationHistory: 'unknown' as const }
              : account(current);
          const before = structuredClone({ principal, child });
          expect(
            planOperationsAccountTransition(principal, child, {
              expectedStatus: current,
              targetStatus: target,
              expectedEpoch: 4,
            }),
          ).toMatchObject({
            safetyOperation: 'restrictive_unknown',
            previousEpoch: 4,
            nextEpoch,
            previousActivationHistory: child.activationHistory,
            nextActivationHistory: child.activationHistory,
            revokeSessions: 'account',
            revokeCredentials: target === 'revoked',
          });
          expect({ principal, child }).toEqual(before);
        },
      );
    }
  }

  it('keeps parent history strict for Account no-op and positive activation', () => {
    const principal = { ...human(), activationHistory: 'unknown' as const };
    expect(() =>
      planOperationsAccountTransition(principal, account(), {
        expectedStatus: 'active',
        targetStatus: 'active',
        expectedEpoch: 4,
      }),
    ).toThrow('activation_history_inconsistent');
    expect(() =>
      planOperationsAccountTransition(principal, account('invited'), {
        expectedStatus: 'invited',
        targetStatus: 'active',
        expectedEpoch: 4,
      }),
    ).toThrow('activation_history_inconsistent');
  });

  it('rejects known-inconsistent parent or child history during restrictions', () => {
    for (const principal of [
      { ...human(), activationHistory: 'never_activated' as const },
      { ...human('pending'), activationHistory: 'previously_activated' as const },
    ])
      expect(() =>
        planOperationsAccountTransition(
          principal,
          {
            ...account(),
            activationHistory: 'unknown',
          },
          { expectedStatus: 'active', targetStatus: 'disabled', expectedEpoch: 4 },
        ),
      ).toThrow('activation_history_inconsistent');
    expect(() =>
      planOperationsAccountTransition(
        { ...human(), activationHistory: 'unknown' },
        {
          ...account(),
          activationHistory: 'never_activated',
        },
        { expectedStatus: 'active', targetStatus: 'disabled', expectedEpoch: 4 },
      ),
    ).toThrow('activation_history_inconsistent');
  });

  it('rejects missing or illegal target and parent history rather than treating it as unknown', () => {
    const { activationHistory: omittedPrincipalHistory, ...missingPrincipal } = human();
    const { activationHistory: omittedAccountHistory, ...missingAccount } = account();
    expect(omittedPrincipalHistory).toBe('previously_activated');
    expect(omittedAccountHistory).toBe('previously_activated');
    const pInput = {
      expectedStatus: 'active',
      targetStatus: 'disabled',
      expectedEpoch: 4,
    } as const;
    // @ts-expect-error Legacy input missing history must be rejected at runtime as well as by types.
    expect(() => planOperationsPrincipalTransition(missingPrincipal, pInput)).toThrow(
      'activation_history_inconsistent',
    );
    // @ts-expect-error Account history cannot be omitted.
    expect(() => planOperationsAccountTransition(human(), missingAccount, pInput)).toThrow(
      'activation_history_inconsistent',
    );
    // @ts-expect-error Parent history cannot be omitted.
    expect(() => planOperationsAccountTransition(missingPrincipal, account(), pInput)).toThrow(
      'activation_history_inconsistent',
    );
    const illegal = { ...human(), activationHistory: 'approved' };
    // @ts-expect-error Arbitrary approval text is not an activation history.
    expect(() => planOperationsPrincipalTransition(illegal, pInput)).toThrow(
      'activation_history_inconsistent',
    );
  });

  it('retains Expected Status/Epoch checks, overflow rejection and non-increment maximum', () => {
    const principal = { ...human(), activationHistory: 'unknown' as const };
    const child = { ...account(), activationHistory: 'unknown' as const };
    const input = { expectedStatus: 'active', targetStatus: 'disabled', expectedEpoch: 4 } as const;
    for (const run of [
      (
        command:
          | typeof input
          | { expectedStatus: 'disabled'; targetStatus: 'disabled'; expectedEpoch: number },
      ) => planOperationsPrincipalTransition(principal, command),
      (
        command:
          | typeof input
          | { expectedStatus: 'disabled'; targetStatus: 'disabled'; expectedEpoch: number },
      ) => planOperationsAccountTransition(principal, child, command),
    ]) {
      expect(() => run({ ...input, expectedStatus: 'disabled' })).toThrow(
        'expected_status_mismatch',
      );
    }
    expect(() =>
      planOperationsPrincipalTransition(principal, { ...input, expectedEpoch: 3 }),
    ).toThrow('expected_epoch_mismatch');
    expect(() =>
      planOperationsAccountTransition(principal, child, { ...input, expectedEpoch: 3 }),
    ).toThrow('expected_epoch_mismatch');
    const maximum = { ...principal, securityEpoch: OPERATIONS_LIFECYCLE_COUNTER_MAX };
    expect(() =>
      planOperationsPrincipalTransition(maximum, {
        ...input,
        expectedEpoch: OPERATIONS_LIFECYCLE_COUNTER_MAX,
        targetStatus: 'tombstoned',
      }),
    ).toThrow('epoch_exhausted');
    expect(() =>
      planOperationsAccountTransition(maximum, child, {
        ...input,
        expectedEpoch: OPERATIONS_LIFECYCLE_COUNTER_MAX,
        targetStatus: 'revoked',
      }),
    ).toThrow('epoch_exhausted');
    expect(
      planOperationsPrincipalTransition(
        { ...maximum, status: 'suspended' },
        {
          expectedStatus: 'suspended',
          targetStatus: 'disabled',
          expectedEpoch: OPERATIONS_LIFECYCLE_COUNTER_MAX,
        },
      ).nextEpoch,
    ).toBe(OPERATIONS_LIFECYCLE_COUNTER_MAX);
    expect(
      planOperationsAccountTransition(
        maximum,
        { ...child, status: 'locked' },
        {
          expectedStatus: 'locked',
          targetStatus: 'disabled',
          expectedEpoch: OPERATIONS_LIFECYCLE_COUNTER_MAX,
        },
      ).nextEpoch,
    ).toBe(OPERATIONS_LIFECYCLE_COUNTER_MAX);
  });
});

// Pure contract tests only: no locks, persistence, authentication or PostgreSQL proof.
describe('Operations identity lifecycle domain contract', () => {
  it('requires one new security generation and Principal-wide Session revocation on suspension', () => {
    const plan = planOperationsPrincipalTransition(
      {
        id: createOperationsHumanPrincipalId('human-contract'),
        status: 'active',
        securityEpoch: 4,
        activationHistory: 'previously_activated',
        createdAt: new Date('2026-11-13T00:00:00Z'),
        updatedAt: new Date('2026-11-13T00:00:00Z'),
      },
      { expectedStatus: 'active', targetStatus: 'suspended', expectedEpoch: 4 },
    );
    expect(plan).toMatchObject({
      previousEpoch: 4,
      nextEpoch: 5,
      revokeSessions: 'principal',
      revokeCredentials: false,
      reauthenticationRequired: true,
      noOp: false,
    });
  });
});

const at = new Date('2030-01-01T00:00:00Z');
function human(
  status: OperationsHumanPrincipalStatus = 'active',
  securityEpoch = 4,
): OperationsPrincipalLifecycleState {
  return {
    id: createOperationsHumanPrincipalId('human-matrix'),
    status,
    securityEpoch,
    activationHistory: status === 'pending' ? 'never_activated' : 'previously_activated',
    createdAt: at,
    updatedAt: at,
  };
}
function account(status: OperationsAccountStatus = 'active'): OperationsAccountLifecycleState {
  return {
    id: createOperationsAccountId('account-matrix'),
    principalId: human().id,
    loginIdentifierNormalized: 'matrix@example.test',
    status,
    activationHistory: status === 'invited' ? 'never_activated' : 'previously_activated',
    createdAt: at,
    updatedAt: at,
  };
}

describe('Founder-approved complete whitelist matrices (pure Domain only)', () => {
  const principalStates = ['pending', 'active', 'suspended', 'disabled', 'tombstoned'] as const;
  const accountStates = ['invited', 'active', 'locked', 'disabled', 'revoked'] as const;
  // Independent spec table: N=no-op, F=first activation, E=departure, R=recovery, T=terminal, B=inactive change, D=denied, X=terminal.
  const matrix = [
    ['N', 'F', 'D', 'B', 'T'],
    ['D', 'N', 'E', 'E', 'T'],
    ['D', 'R', 'N', 'B', 'T'],
    ['D', 'R', 'D', 'N', 'T'],
    ['X', 'X', 'X', 'X', 'X'],
  ] as const;
  for (const [row, outcomes] of matrix.entries()) {
    for (const [column, outcome] of outcomes.entries()) {
      const pCurrent = principalStates[row]!;
      const pTarget = principalStates[column]!;
      const aCurrent = accountStates[row]!;
      const aTarget = accountStates[column]!;
      it('Principal ' + pCurrent + ' -> ' + pTarget + ' = ' + outcome, () => {
        const run = () =>
          planOperationsPrincipalTransition(human(pCurrent), {
            expectedStatus: pCurrent,
            targetStatus: pTarget,
            expectedEpoch: 4,
          });
        if (outcome === 'D' || outcome === 'X')
          expect(run).toThrow(outcome === 'D' ? 'transition_not_allowed' : 'terminal_state');
        else
          expect(run()).toMatchObject({
            nextEpoch: ['N', 'F', 'B'].includes(outcome) ? 4 : 5,
            noOp: outcome === 'N',
            revokeSessions: outcome === 'N' ? 'none' : 'principal',
            revokeCredentials: outcome === 'T',
            reauthenticationRequired: outcome !== 'N',
            previousActivationHistory:
              pCurrent === 'pending' ? 'never_activated' : 'previously_activated',
            nextActivationHistory:
              pCurrent === 'pending' && outcome !== 'F'
                ? 'never_activated'
                : 'previously_activated',
            activationKind:
              outcome === 'F' ? 'first_activation' : outcome === 'R' ? 'recovery' : 'none',
          });
      });
      it('Account ' + aCurrent + ' -> ' + aTarget + ' = ' + outcome, () => {
        const run = () =>
          planOperationsAccountTransition(human(), account(aCurrent), {
            expectedStatus: aCurrent,
            targetStatus: aTarget,
            expectedEpoch: 4,
          });
        if (outcome === 'D' || outcome === 'X')
          expect(run).toThrow(outcome === 'D' ? 'transition_not_allowed' : 'terminal_state');
        else
          expect(run()).toMatchObject({
            nextEpoch: ['N', 'F', 'B'].includes(outcome) ? 4 : 5,
            noOp: outcome === 'N',
            revokeSessions: outcome === 'N' ? 'none' : 'account',
            revokeCredentials: outcome === 'T',
            reauthenticationRequired: outcome !== 'N',
            previousActivationHistory:
              aCurrent === 'invited' ? 'never_activated' : 'previously_activated',
            nextActivationHistory:
              aCurrent === 'invited' && outcome !== 'F'
                ? 'never_activated'
                : 'previously_activated',
            activationKind:
              outcome === 'F' ? 'first_activation' : outcome === 'R' ? 'recovery' : 'none',
          });
      });
    }
  }
  it('rejects inconsistent active/limited history and never restores previously-activated history to never', () => {
    for (const status of ['active', 'suspended'] as const)
      expect(() =>
        planOperationsPrincipalTransition(
          { ...human(status), activationHistory: 'never_activated' },
          { expectedStatus: status, targetStatus: 'disabled', expectedEpoch: 4 },
        ),
      ).toThrow('activation_history_inconsistent');
    for (const status of ['active', 'locked'] as const)
      expect(() =>
        planOperationsAccountTransition(
          human(),
          { ...account(status), activationHistory: 'never_activated' },
          { expectedStatus: status, targetStatus: 'disabled', expectedEpoch: 4 },
        ),
      ).toThrow('activation_history_inconsistent');
    const disabled = planOperationsPrincipalTransition(human('suspended'), {
      expectedStatus: 'suspended',
      targetStatus: 'disabled',
      expectedEpoch: 4,
    });
    expect(disabled).toMatchObject({
      previousActivationHistory: 'previously_activated',
      nextActivationHistory: 'previously_activated',
      nextEpoch: 4,
    });
    expect(() =>
      planOperationsPrincipalTransition(human('disabled'), {
        expectedStatus: 'disabled',
        targetStatus: 'pending',
        expectedEpoch: 4,
      }),
    ).toThrow('transition_not_allowed');
    expect(() =>
      planOperationsAccountTransition(human(), account('disabled'), {
        expectedStatus: 'disabled',
        targetStatus: 'invited',
        expectedEpoch: 4,
      }),
    ).toThrow('transition_not_allowed');
  });
  it('rejects stale status and stale Epoch separately without mutating the supplied Principal', () => {
    const p = human();
    expect(() =>
      planOperationsPrincipalTransition(p, {
        expectedStatus: 'disabled',
        targetStatus: 'active',
        expectedEpoch: 4,
      }),
    ).toThrow('expected_status_mismatch');
    expect(() =>
      planOperationsPrincipalTransition(p, {
        expectedStatus: 'active',
        targetStatus: 'disabled',
        expectedEpoch: 3,
      }),
    ).toThrow('expected_epoch_mismatch');
    expect(p).toMatchObject({ status: 'active', securityEpoch: 4 });
  });
  it('checks Account ownership and refuses a later Epoch mutation on a terminal Principal', () => {
    expect(() =>
      planOperationsAccountTransition(
        human(),
        { ...account(), principalId: createOperationsHumanPrincipalId('other-human') },
        { expectedStatus: 'active', targetStatus: 'disabled', expectedEpoch: 4 },
      ),
    ).toThrow('ownership_mismatch');
    expect(() =>
      planOperationsAccountTransition(human('tombstoned'), account(), {
        expectedStatus: 'active',
        targetStatus: 'revoked',
        expectedEpoch: 4,
      }),
    ).toThrow('terminal_state');
  });
  it('advances only an expected Epoch and rejects overflow without resetting the counter', () => {
    expect(planOperationsSecurityEpochIncrement(4, 4)).toBe(5);
    expect(() => planOperationsSecurityEpochIncrement(5, 4)).toThrow('expected_epoch_mismatch');
    expect(() =>
      planOperationsSecurityEpochIncrement(
        OPERATIONS_LIFECYCLE_COUNTER_MAX,
        OPERATIONS_LIFECYCLE_COUNTER_MAX,
      ),
    ).toThrow('epoch_exhausted');
    expect(() =>
      planOperationsPrincipalTransition(human('active', OPERATIONS_LIFECYCLE_COUNTER_MAX), {
        expectedStatus: 'active',
        targetStatus: 'tombstoned',
        expectedEpoch: OPERATIONS_LIFECYCLE_COUNTER_MAX,
      }),
    ).toThrow('epoch_exhausted');
    expect(
      planOperationsPrincipalTransition(human('active', OPERATIONS_LIFECYCLE_COUNTER_MAX), {
        expectedStatus: 'active',
        targetStatus: 'active',
        expectedEpoch: OPERATIONS_LIFECYCLE_COUNTER_MAX,
      }).nextEpoch,
    ).toBe(OPERATIONS_LIFECYCLE_COUNTER_MAX);
  });
  it.each(['pending', 'active', 'suspended', 'disabled'] as const)(
    'checks Expected Status and Epoch even for Principal %s no-op',
    (status) => {
      expect(() =>
        planOperationsPrincipalTransition(human(status), {
          expectedStatus: status,
          targetStatus: status,
          expectedEpoch: 3,
        }),
      ).toThrow('expected_epoch_mismatch');
      expect(() =>
        planOperationsPrincipalTransition(human(status), {
          expectedStatus: 'tombstoned',
          targetStatus: status,
          expectedEpoch: 4,
        }),
      ).toThrow('expected_status_mismatch');
    },
  );
  it.each(['invited', 'active', 'locked', 'disabled'] as const)(
    'checks Expected Status and Epoch even for Account %s no-op',
    (status) => {
      expect(() =>
        planOperationsAccountTransition(human(), account(status), {
          expectedStatus: status,
          targetStatus: status,
          expectedEpoch: 3,
        }),
      ).toThrow('expected_epoch_mismatch');
      expect(() =>
        planOperationsAccountTransition(human(), account(status), {
          expectedStatus: 'revoked',
          targetStatus: status,
          expectedEpoch: 4,
        }),
      ).toThrow('expected_status_mismatch');
    },
  );
  it('checks stale first-activation expectations and permits Epoch maximum only when no increment is required', () => {
    const first = {
      ...human('disabled', OPERATIONS_LIFECYCLE_COUNTER_MAX),
      activationHistory: 'never_activated' as const,
    };
    const input = {
      expectedStatus: 'disabled' as const,
      targetStatus: 'active' as const,
      expectedEpoch: OPERATIONS_LIFECYCLE_COUNTER_MAX,
    };
    expect(planOperationsPrincipalTransition(first, input).nextEpoch).toBe(
      OPERATIONS_LIFECYCLE_COUNTER_MAX,
    );
    expect(() => planOperationsPrincipalTransition(first, { ...input, expectedEpoch: 0 })).toThrow(
      'expected_epoch_mismatch',
    );
    expect(() =>
      planOperationsPrincipalTransition(
        { ...first, activationHistory: 'previously_activated' },
        input,
      ),
    ).toThrow('epoch_exhausted');
  });
  it('does not manufacture activation history for never-activated or unknown disabled subjects during no-op or disable', () => {
    for (const activationHistory of ['never_activated', 'unknown'] as const) {
      expect(
        planOperationsPrincipalTransition(
          { ...human('disabled'), activationHistory },
          { expectedStatus: 'disabled', targetStatus: 'disabled', expectedEpoch: 4 },
        ),
      ).toMatchObject({
        nextEpoch: 4,
        nextActivationHistory: activationHistory,
        activationKind: 'none',
      });
      expect(
        planOperationsAccountTransition(
          human(),
          { ...account('disabled'), activationHistory },
          { expectedStatus: 'disabled', targetStatus: 'disabled', expectedEpoch: 4 },
        ),
      ).toMatchObject({ nextEpoch: 4, nextActivationHistory: activationHistory });
    }
    expect(
      planOperationsPrincipalTransition(human('pending'), {
        expectedStatus: 'pending',
        targetStatus: 'disabled',
        expectedEpoch: 4,
      }),
    ).toMatchObject({
      nextEpoch: 4,
      nextActivationHistory: 'never_activated',
      auditOutcome: 'status_changed',
    });
  });
  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, 2147483648])(
    'rejects invalid expected Epoch %s',
    (epoch) => {
      expect(() => planOperationsSecurityEpochIncrement(4, epoch)).toThrow(
        'invalid_lifecycle_input',
      );
    },
  );
});
