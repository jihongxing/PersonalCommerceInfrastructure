import {
  assertOperationsAccount,
  assertOperationsHumanPrincipal,
  createOperationsAccount,
  createOperationsHumanPrincipal,
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
  transition_not_allowed: 'state_conflict',
  activation_history_unknown: 'state_conflict',
  activation_history_inconsistent: 'state_conflict',
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

/** Independent per entity; read from persistence after locking, never inferred from status/Epoch. */
export type OperationsActivationHistory = 'previously_activated' | 'never_activated' | 'unknown';

/** Refines the existing entities; these are not new Principal/Account identities or DB schemas. */
export type OperationsPrincipalLifecycleState = OperationsHumanPrincipal & {
  readonly activationHistory: OperationsActivationHistory;
};
export type OperationsAccountLifecycleState = OperationsAccount & {
  readonly activationHistory: OperationsActivationHistory;
};

/** New-subject contracts only. Existing history must never be reconstructed through initialization. */
export function initializeOperationsPrincipalLifecycle(
  input: Omit<OperationsHumanPrincipal, 'status' | 'securityEpoch'>,
): OperationsPrincipalLifecycleState {
  return {
    ...createOperationsHumanPrincipal({ ...input, status: 'pending', securityEpoch: 0 }),
    activationHistory: 'never_activated',
  };
}

export function initializeOperationsAccountLifecycle(
  input: Omit<OperationsAccount, 'status'>,
): OperationsAccountLifecycleState {
  return {
    ...createOperationsAccount({ ...input, status: 'invited' }),
    activationHistory: 'never_activated',
  };
}

export function assertOperationsPrincipalLifecycleState(
  value: OperationsPrincipalLifecycleState,
): void {
  assertOperationsHumanPrincipal(value);
  assertOperationsLifecycleCounter(value.securityEpoch);
  assertActivationHistory(value.status, value.activationHistory, 'pending', 'suspended');
}

export function assertOperationsAccountLifecycleState(
  value: OperationsAccountLifecycleState,
): void {
  assertOperationsAccount(value);
  assertActivationHistory(value.status, value.activationHistory, 'invited', 'locked');
}

export interface OperationsLifecycleExpectation<Status extends string> {
  readonly expectedStatus: Status;
  readonly targetStatus: Status;
  readonly expectedEpoch: number;
}

export interface OperationsLifecycleTransitionPlan<Status extends string> {
  readonly previousStatus: Status;
  readonly targetStatus: Status;
  readonly previousEpoch: number;
  readonly nextEpoch: number;
  readonly previousActivationHistory: OperationsActivationHistory;
  readonly nextActivationHistory: OperationsActivationHistory;
  readonly activationKind: 'none' | 'first_activation' | 'recovery';
  readonly noOp: boolean;
  readonly revokeSessions: 'none' | 'account' | 'principal';
  readonly revokeCredentials: boolean;
  readonly reauthenticationRequired: boolean;
  readonly auditOutcome:
    'no_op' | 'first_activated' | 'deactivated' | 'recovered' | 'status_changed' | 'terminal';
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
  principal: OperationsPrincipalLifecycleState,
  input: OperationsLifecycleExpectation<OperationsHumanPrincipalStatus>,
): OperationsLifecycleTransitionPlan<OperationsHumanPrincipalStatus> {
  assertOperationsHumanPrincipal(principal);
  return planTransition(
    principal.status,
    principal.securityEpoch,
    principal.activationHistory,
    input,
    {
      terminal: 'tombstoned',
      initial: 'pending',
      limited: 'suspended',
      transitions: {
        pending: ['active', 'disabled', 'tombstoned'],
        active: ['suspended', 'disabled', 'tombstoned'],
        suspended: ['active', 'disabled', 'tombstoned'],
        disabled: ['active', 'tombstoned'],
        tombstoned: [],
      },
      statuses: ['pending', 'active', 'suspended', 'disabled', 'tombstoned'],
      scope: 'principal',
    },
  );
}

export function planOperationsAccountTransition(
  principal: OperationsPrincipalLifecycleState,
  account: OperationsAccountLifecycleState,
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
  assertOperationsPrincipalLifecycleState(principal);
  const plan = planTransition(
    account.status,
    principal.securityEpoch,
    account.activationHistory,
    input,
    {
      terminal: 'revoked',
      initial: 'invited',
      limited: 'locked',
      transitions: {
        invited: ['active', 'disabled', 'revoked'],
        active: ['locked', 'disabled', 'revoked'],
        locked: ['active', 'disabled', 'revoked'],
        disabled: ['active', 'revoked'],
        revoked: [],
      },
      statuses: ['invited', 'active', 'locked', 'disabled', 'revoked'],
      scope: 'account',
    },
  );
  if (!plan.noOp && input.targetStatus === 'active' && principal.status !== 'active') {
    throw new OperationsLifecycleContractError('parent_not_active');
  }
  return plan;
}

function planTransition<Status extends string>(
  current: Status,
  epoch: number,
  history: OperationsActivationHistory,
  input: OperationsLifecycleExpectation<Status>,
  policy: {
    readonly terminal: Status;
    readonly initial: Status;
    readonly limited: Status;
    readonly transitions: Readonly<Record<Status, readonly Status[]>>;
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
  if (!noOp && !policy.transitions[current].includes(input.targetStatus)) {
    throw new OperationsLifecycleContractError('transition_not_allowed');
  }
  const activating = !noOp && input.targetStatus === 'active';
  if (activating && history === 'unknown')
    throw new OperationsLifecycleContractError('activation_history_unknown');
  assertActivationHistory(current, history, policy.initial, policy.limited);
  const recovering = activating && history === 'previously_activated';
  const firstActivation = activating && history === 'never_activated';
  const incrementEpoch = !noOp && (terminal || current === 'active' || recovering);
  return {
    previousStatus: current,
    targetStatus: input.targetStatus,
    previousEpoch: epoch,
    nextEpoch: incrementEpoch
      ? planOperationsSecurityEpochIncrement(epoch, input.expectedEpoch)
      : epoch,
    previousActivationHistory: history,
    nextActivationHistory: firstActivation ? 'previously_activated' : history,
    activationKind: firstActivation ? 'first_activation' : recovering ? 'recovery' : 'none',
    noOp,
    revokeSessions: noOp ? 'none' : policy.scope,
    revokeCredentials: terminal,
    reauthenticationRequired: !noOp,
    auditOutcome: noOp
      ? 'no_op'
      : terminal
        ? 'terminal'
        : firstActivation
          ? 'first_activated'
          : recovering
            ? 'recovered'
            : current === 'active'
              ? 'deactivated'
              : 'status_changed',
  };
}

function assertActivationHistory(
  status: string,
  history: OperationsActivationHistory,
  initial: string,
  limited: string,
): void {
  if (!['never_activated', 'previously_activated', 'unknown'].includes(history)) {
    throw new OperationsLifecycleContractError('activation_history_inconsistent');
  }
  if (
    ((status === 'active' || status === limited) && history !== 'previously_activated') ||
    (status === initial && history === 'previously_activated')
  ) {
    throw new OperationsLifecycleContractError('activation_history_inconsistent');
  }
}
