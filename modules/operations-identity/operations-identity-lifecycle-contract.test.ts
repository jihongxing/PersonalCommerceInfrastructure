import { describe, expect, it } from 'vitest';

import {
  createOperationsAccountId,
  createOperationsHumanPrincipalId,
  type OperationsAccountStatus,
  type OperationsHumanPrincipalStatus,
} from './operations-identity-contract.js';
import {
  OPERATIONS_LIFECYCLE_COUNTER_MAX,
  planOperationsAccountTransition,
  planOperationsPrincipalTransition,
  planOperationsSecurityEpochIncrement,
} from './operations-identity-lifecycle-contract.js';

// Pure contract tests only: no locks, persistence, authentication or PostgreSQL proof.
describe('Operations identity lifecycle domain contract', () => {
  it('requires one new security generation and Principal-wide Session revocation on suspension', () => {
    const plan = planOperationsPrincipalTransition(
      {
        id: createOperationsHumanPrincipalId('human-contract'),
        status: 'active',
        securityEpoch: 4,
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
function human(status: OperationsHumanPrincipalStatus = 'active', securityEpoch = 4) {
  return {
    id: createOperationsHumanPrincipalId('human-matrix'),
    status,
    securityEpoch,
    createdAt: at,
    updatedAt: at,
  };
}
function account(status: OperationsAccountStatus = 'active') {
  return {
    id: createOperationsAccountId('account-matrix'),
    principalId: human().id,
    loginIdentifierNormalized: 'matrix@example.test',
    status,
    createdAt: at,
    updatedAt: at,
  };
}

describe('Complete approved-or-pending transition matrices (pure Domain only)', () => {
  const principalStates = ['pending', 'active', 'suspended', 'disabled', 'tombstoned'] as const;
  const accountStates = ['invited', 'active', 'locked', 'disabled', 'revoked'] as const;
  // Independent specification table: N=no-op, E=deactivate, R=proven recovery, T=terminal, P=pending, X=reject.
  const matrix = [
    ['N', 'R', 'P', 'P', 'T'],
    ['P', 'N', 'E', 'E', 'T'],
    ['P', 'R', 'N', 'P', 'T'],
    ['P', 'R', 'P', 'N', 'T'],
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
            activationHistory: 'previously_activated',
          });
        if (outcome === 'P' || outcome === 'X')
          expect(run).toThrow(outcome === 'P' ? 'PENDING_FOUNDER_DECISION' : 'terminal_state');
        else
          expect(run()).toMatchObject({
            nextEpoch: outcome === 'N' ? 4 : 5,
            noOp: outcome === 'N',
            revokeSessions: outcome === 'N' ? 'none' : 'principal',
            revokeCredentials: outcome === 'T',
            reauthenticationRequired: outcome !== 'N',
          });
      });
      it('Account ' + aCurrent + ' -> ' + aTarget + ' = ' + outcome, () => {
        const run = () =>
          planOperationsAccountTransition(human(), account(aCurrent), {
            expectedStatus: aCurrent,
            targetStatus: aTarget,
            expectedEpoch: 4,
            activationHistory: 'previously_activated',
          });
        if (outcome === 'P' || outcome === 'X')
          expect(run).toThrow(outcome === 'P' ? 'PENDING_FOUNDER_DECISION' : 'terminal_state');
        else
          expect(run()).toMatchObject({
            nextEpoch: outcome === 'N' ? 4 : 5,
            noOp: outcome === 'N',
            revokeSessions: outcome === 'N' ? 'none' : 'account',
            revokeCredentials: outcome === 'T',
            reauthenticationRequired: outcome !== 'N',
          });
      });
    }
  }
  it.each(['never_activated', 'unknown', undefined] as const)(
    'blocks first or unproven activation for history %s without any executable plan',
    (activationHistory) => {
      expect(() =>
        planOperationsPrincipalTransition(human('pending'), {
          expectedStatus: 'pending',
          targetStatus: 'active',
          expectedEpoch: 4,
          activationHistory,
        }),
      ).toThrow('PENDING_FOUNDER_DECISION');
      expect(() =>
        planOperationsAccountTransition(human(), account('invited'), {
          expectedStatus: 'invited',
          targetStatus: 'active',
          expectedEpoch: 4,
          activationHistory,
        }),
      ).toThrow('PENDING_FOUNDER_DECISION');
    },
  );
  it('does not infer previous activation from suspended status or a nonzero Epoch', () => {
    expect(() =>
      planOperationsPrincipalTransition(human('suspended', 9), {
        expectedStatus: 'suspended',
        targetStatus: 'active',
        expectedEpoch: 9,
      }),
    ).toThrow('PENDING_FOUNDER_DECISION');
  });
  it('rejects stale status and stale Epoch separately without mutating the supplied Principal', () => {
    const p = human();
    expect(() =>
      planOperationsPrincipalTransition(p, {
        expectedStatus: 'disabled',
        targetStatus: 'active',
        expectedEpoch: 4,
        activationHistory: 'previously_activated',
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
  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, 2147483648])(
    'rejects invalid expected Epoch %s',
    (epoch) => {
      expect(() => planOperationsSecurityEpochIncrement(4, epoch)).toThrow(
        'invalid_lifecycle_input',
      );
    },
  );
});
