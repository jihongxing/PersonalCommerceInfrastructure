import {
  assertOperationsAccount,
  assertOperationsHumanPrincipal,
  type OperationsAccount,
  type OperationsAccountStatus,
  type OperationsHumanPrincipal,
  type OperationsHumanPrincipalStatus,
} from './operations-identity-contract.js';

/** Matches the already accepted persistence counter capacity; counters must never wrap/reset. */
export const OPERATIONS_LIFECYCLE_COUNTER_MAX = 2147483647;

const failureCategories = {
  principal_not_found: 'not_found',
  account_not_found: 'not_found',
  parent_not_active: 'not_authenticated',
  credential_not_active: 'not_authenticated',
  credential_snapshot_mismatch: 'not_authenticated',
  epoch_snapshot_mismatch: 'not_authenticated',
  session_not_active: 'not_authenticated',
  session_expired: 'not_authenticated',
  digest_mismatch: 'not_authenticated',
  not_authorized: 'not_authorized',
  expected_status_mismatch: 'state_conflict',
  ownership_mismatch: 'state_conflict',
  terminal_state: 'state_conflict',
  expected_epoch_mismatch: 'cas_conflict',
  expected_version_mismatch: 'cas_conflict',
  PENDING_FOUNDER_DECISION: 'policy_pending',
  epoch_exhausted: 'contract_failure',
  version_exhausted: 'contract_failure',
  invalid_lifecycle_input: 'contract_failure',
  invalid_lock_order: 'contract_failure',
  database_unavailable: 'infrastructure_failure',
  deadlock: 'infrastructure_failure',
  transaction_conflict: 'infrastructure_failure',
  transaction_failed: 'infrastructure_failure',
  commit_outcome_unknown: 'infrastructure_failure',
} as const;

export type OperationsLifecycleFailureCode = keyof typeof failureCategories;

/** No driver cause, SQL, Digest, Verifier or free-form diagnostic enters this error. No HTTP mapping. */
export class OperationsLifecycleContractError extends Error {
  public readonly category: (typeof failureCategories)[OperationsLifecycleFailureCode];

  public constructor(public readonly code: OperationsLifecycleFailureCode) {
    super(`Operations lifecycle contract failed: ${code}.`);
    this.name = 'OperationsLifecycleContractError';
    this.category = failureCategories[code];
  }
}

/** Authoritative history supplied after locking, never inferred from status, Epoch or client input. */
export type OperationsActivationHistory = 'previously_activated' | 'never_activated' | 'unknown';

export interface OperationsLifecycleExpectation<Status extends string> {
  readonly expectedStatus: Status;
  readonly targetStatus: Status;
  readonly expectedEpoch: number;
  readonly activationHistory?: OperationsActivationHistory;
}

export interface OperationsLifecycleTransitionPlan<Status extends string> {
  readonly previousStatus: Status;
  readonly targetStatus: Status;
  readonly previousEpoch: number;
  readonly nextEpoch: number;
  readonly noOp: boolean;
  readonly revokeSessions: 'none' | 'account' | 'principal';
  readonly revokeCredentials: boolean;
  readonly reauthenticationRequired: boolean;
  readonly auditOutcome: 'no_op' | 'deactivated' | 'recovered' | 'terminal';
}

export function assertOperationsLifecycleCounter(value: number, minimum = 0): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > OPERATIONS_LIFECYCLE_COUNTER_MAX) {
    throw new OperationsLifecycleContractError('invalid_lifecycle_input');
  }
}

/** Pure CAS arithmetic; this neither commits an Epoch nor proves database serialization. */
export function planOperationsSecurityEpochIncrement(current: number, expected: number): number {
  assertOperationsLifecycleCounter(current);
  assertOperationsLifecycleCounter(expected);
  if (current !== expected) throw new OperationsLifecycleContractError('expected_epoch_mismatch');
  if (current === OPERATIONS_LIFECYCLE_COUNTER_MAX) {
    throw new OperationsLifecycleContractError('epoch_exhausted');
  }
  return current + 1;
}

export function planOperationsPrincipalTransition(
  principal: OperationsHumanPrincipal,
  input: OperationsLifecycleExpectation<OperationsHumanPrincipalStatus>,
): OperationsLifecycleTransitionPlan<OperationsHumanPrincipalStatus> {
  assertOperationsHumanPrincipal(principal);
  return planTransition(principal.status, principal.securityEpoch, input, {
    terminal: 'tombstoned',
    initial: 'pending',
    statuses: ['pending', 'active', 'suspended', 'disabled', 'tombstoned'],
    scope: 'principal',
  });
}

export function planOperationsAccountTransition(
  principal: OperationsHumanPrincipal,
  account: OperationsAccount,
  input: OperationsLifecycleExpectation<OperationsAccountStatus>,
): OperationsLifecycleTransitionPlan<OperationsAccountStatus> {
  assertOperationsHumanPrincipal(principal);
  assertOperationsAccount(account);
  if (account.principalId !== principal.id) {
    throw new OperationsLifecycleContractError('ownership_mismatch');
  }
  if (principal.status === 'tombstoned') {
    // An Account operation cannot append an Epoch write to immutable Principal history.
    throw new OperationsLifecycleContractError('terminal_state');
  }
  return planTransition(account.status, principal.securityEpoch, input, {
    terminal: 'revoked',
    initial: 'invited',
    statuses: ['invited', 'active', 'locked', 'disabled', 'revoked'],
    scope: 'account',
  });
}

function planTransition<Status extends string>(
  current: Status,
  epoch: number,
  input: OperationsLifecycleExpectation<Status>,
  policy: {
    readonly terminal: Status;
    readonly initial: Status;
    readonly statuses: readonly Status[];
    readonly scope: 'account' | 'principal';
  },
): OperationsLifecycleTransitionPlan<Status> {
  if (!policy.statuses.includes(input.targetStatus)) {
    throw new OperationsLifecycleContractError('invalid_lifecycle_input');
  }
  if (current === policy.terminal) throw new OperationsLifecycleContractError('terminal_state');
  assertOperationsLifecycleCounter(epoch);
  assertOperationsLifecycleCounter(input.expectedEpoch);
  if (current !== input.expectedStatus) {
    throw new OperationsLifecycleContractError('expected_status_mismatch');
  }
  if (epoch !== input.expectedEpoch) {
    throw new OperationsLifecycleContractError('expected_epoch_mismatch');
  }
  const noOp = current === input.targetStatus;
  const terminal = input.targetStatus === policy.terminal;
  const recovering = !noOp && input.targetStatus === 'active';
  if (!noOp && !terminal) {
    if (recovering) {
      // First activation's Epoch policy and historical proof are deliberately unresolved.
      if (input.activationHistory !== 'previously_activated') {
        throw new OperationsLifecycleContractError('PENDING_FOUNDER_DECISION');
      }
    } else if (current !== 'active' || input.targetStatus === policy.initial) {
      // Existing permissive setters are not product-policy approval for these transitions.
      throw new OperationsLifecycleContractError('PENDING_FOUNDER_DECISION');
    }
  }
  return {
    previousStatus: current,
    targetStatus: input.targetStatus,
    previousEpoch: epoch,
    nextEpoch: noOp ? epoch : planOperationsSecurityEpochIncrement(epoch, input.expectedEpoch),
    noOp,
    revokeSessions: noOp ? 'none' : policy.scope,
    revokeCredentials: terminal,
    reauthenticationRequired: !noOp,
    auditOutcome: noOp ? 'no_op' : terminal ? 'terminal' : recovering ? 'recovered' : 'deactivated',
  };
}
