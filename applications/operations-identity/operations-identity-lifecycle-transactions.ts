import {
  assertOperationsAccount,
  assertOperationsCredentialMetadata,
  assertOperationsHumanPrincipal,
  assertOperationsSession,
  assertOperationsSessionTouch,
  createOperationsCredentialMetadata,
  OperationsDomainInvariantError,
  type OperationsAccountId,
  type OperationsAccountStatus,
  type OperationsCredentialMetadata,
  type OperationsHumanPrincipalId,
  type OperationsHumanPrincipalStatus,
  type OperationsSession,
} from '../../modules/operations-identity/operations-identity-contract.js';
import {
  assertOperationsLifecycleCounter,
  OPERATIONS_LIFECYCLE_COUNTER_MAX,
  OperationsLifecycleContractError,
  planOperationsAccountTransition,
  planOperationsPrincipalTransition,
  assertOperationsPrincipalLifecycleState,
  assertOperationsAccountLifecycleState,
  type OperationsPrincipalLifecycleState,
  type OperationsAccountLifecycleState,
  type OperationsLifecycleExpectation,
  type OperationsLifecycleTransitionPlan,
} from '../../modules/operations-identity/operations-identity-lifecycle-contract.js';
import {
  createEncodedPasswordVerifier,
  OperationsCredentialVerifierError,
  OperationsCredentialNotFoundError,
  OperationsCredentialVersionConflictError,
  type OperationsCredentialRepository,
} from './operations-credential-repositories.js';
import {
  OperationsAccountNotFoundError,
  OperationsHumanPrincipalNotFoundError,
  OperationsTerminalStatusTransitionError,
} from './operations-identity-repositories.js';
import {
  createOperationsSessionCredentialDigest,
  createOperationsPrincipalSecurityEpoch,
  createOperationsSessionCredentialVersion,
  OperationsSessionNotAuthenticatedError,
  OperationsSessionNotFoundError,
  OperationsSessionConflictError,
  OperationsSessionContractError,
  OperationsPrincipalSecurityEpochConflictError,
  type OperationsSessionPersistenceRecord,
  type OperationsSessionRepository,
  type OperationsPrincipalSecurityEpoch,
  type OperationsSessionCredentialVersion,
} from './operations-session-repositories.js';

/** Existing entities, read authoritatively after locking; not a second identity model. */
export interface OperationsIdentitySecuritySnapshot {
  readonly principal?: OperationsPrincipalLifecycleState;
  readonly account?: OperationsAccountLifecycleState;
  readonly credential?: OperationsCredentialMetadata;
}

/** Technical audit context only. No permissions, credential material or canonical product event. */
export interface OperationsLifecycleAuditContext {
  readonly operationId: string;
  readonly correlationId: string;
  readonly reasonCode: string;
  readonly occurredAt: Date;
}

export interface OperationsPrincipalLifecycleCommand extends OperationsLifecycleExpectation<OperationsHumanPrincipalStatus> {
  readonly principalId: OperationsHumanPrincipalId;
  readonly expectedEpoch: OperationsPrincipalSecurityEpoch;
  readonly audit: OperationsLifecycleAuditContext;
}

export interface OperationsAccountLifecycleCommand extends OperationsLifecycleExpectation<OperationsAccountStatus> {
  readonly principalId: OperationsHumanPrincipalId;
  readonly accountId: OperationsAccountId;
  readonly expectedEpoch: OperationsPrincipalSecurityEpoch;
  readonly audit: OperationsLifecycleAuditContext;
}

export interface OperationsLifecycleApplicationPlan<
  Status extends string,
> extends OperationsLifecycleTransitionPlan<Status> {
  readonly previousEpoch: OperationsPrincipalSecurityEpoch;
  readonly nextEpoch: OperationsPrincipalSecurityEpoch;
}

export interface OperationsLifecycleTransitionCommit<Status extends string> {
  readonly principalId: OperationsHumanPrincipalId;
  readonly accountId?: OperationsAccountId;
  readonly plan: OperationsLifecycleApplicationPlan<Status>;
  readonly revokedSessionCount: number;
  readonly revokedCredentialCount: number;
  readonly audit: OperationsLifecycleAuditContext;
}

type ExistingCredentialReplacement = Parameters<
  OperationsCredentialRepository['replaceActivePasswordCredential']
>[0];

export interface OperationsCredentialReplacementCommand extends ExistingCredentialReplacement {
  readonly principalId: OperationsHumanPrincipalId;
  readonly expectedEpoch: OperationsPrincipalSecurityEpoch;
  readonly expectedVersion: OperationsSessionCredentialVersion;
  readonly audit: OperationsLifecycleAuditContext;
}

export interface OperationsCredentialReplacementPlan {
  readonly previousCredential: OperationsCredentialMetadata;
  readonly nextCredential: OperationsCredentialMetadata;
  readonly principalEpoch: OperationsPrincipalSecurityEpoch;
  readonly revokeSessionsForCredentialVersion: OperationsSessionCredentialVersion;
  readonly audit: OperationsLifecycleAuditContext;
}

/**
 * C2 transaction port ONLY. C1 supplies no implementation or composition wiring. Every method is
 * one database transaction: acquire locks, re-read, validate expected values, then commit all effects
 * or roll them all back. Status/Credential changes durably audit their supplied context in that
 * transaction. Never implement by calling root repositories in
 * sequence. Principal -> Account -> Credential -> Session; sets use ascending stable row IDs.
 *
 * Status methods read separate Principal/Account activation histories inside the transaction via
 * its transaction-local read scope. Commands never carry history or an activation approval. First
 * activation preserves Epoch and changes never_activated to previously_activated; recovery consumes
 * +1. FD-UNKNOWN-01 permits only whitelisted restrictive changes with unknown history unchanged;
 * safetyOperation=restrictive_unknown is a derived plan, never command authority. Account restrictions
 * read/validate both owners and may retain a nonterminal unknown parent, but never change its status
 * or history. Known-inconsistent/missing history and all positive unknown operations still reject.
 * Original no-op history checks remain strict. Status/history/Epoch/effects/audit commit together.
 * A tombstone and its Epoch
 * change must be written together while OLD is nonterminal, never via a later Epoch repair.
 * Terminal transitions revoke active Password Credentials and Sessions in the target scope.
 *
 * Replays use CAS, not automatic retries: a changed expected status/Epoch/version fails. Nonterminal
 * same-state requests with matching expectations are no-ops. Terminal repeats always reject, even
 * with the same operationId. operationId is audit correlation, NOT a promised durable dedupe store.
 * Unknown commit outcomes require reconciliation; do not blindly replay an increment.
 *
 * Inherited Session methods preserve the accepted seven signatures, Digest-only persistence, strict
 * CAS, no grace, lost-response reauthentication, immutable absolute expiry and revoked history.
 * Snapshot checks and writes share locks. Revocation need not require active parents/Credentials.
 * Credential replacement atomically revokes the old Credential, inserts exactly version+1 and
 * revokes Sessions bound to the old version, without changing Principal Epoch.
 * It requires both parents active, never changes either activation history, and grants no privileged
 * recovery bypass. Future privileged recovery needs separate authorization, identity verification,
 * recovery authority and atomicity design; it is not included in C2/C3 by default.
 *
 * Known-ID absence, state/CAS conflict, policy pending, terminal rejection and infrastructure failure
 * remain distinguishable. Never map all failures to unauthorized or expose driver/secret details.
 * These method declarations prove neither transactions, role enforcement nor absence of deadlocks.
 */
export interface OperationsIdentityLifecycleTransactionPort extends OperationsSessionRepository {
  changePrincipalStatus(
    command: OperationsPrincipalLifecycleCommand,
  ): Promise<OperationsLifecycleTransitionCommit<OperationsHumanPrincipalStatus>>;
  changeAccountStatus(
    command: OperationsAccountLifecycleCommand,
  ): Promise<OperationsLifecycleTransitionCommit<OperationsAccountStatus>>;
  replacePasswordCredential(
    command: OperationsCredentialReplacementCommand,
  ): Promise<OperationsCredentialReplacementPlan>;
}

/** Future adapter's transaction-local reads, NOT command/HTTP inputs or standalone root reads.
 * Implementations must lock/re-read in P -> A order, keep each entity's own persisted history,
 * preserve unknown legacy history, and never derive history from Epoch/status or initialize old rows.
 * Return unknown faithfully, including legacy active/limited states: the operation-specific planner
 * decides FD-UNKNOWN-01 restrictions; never filter those rows out or repair their history in a reader.
 * These declarations provide no storage implementation or runtime proof of snapshot provenance. */
export interface OperationsIdentityLifecycleStateReader {
  findPrincipalLifecycleState(
    principalId: OperationsHumanPrincipalId,
  ): Promise<OperationsPrincipalLifecycleState | undefined>;
  findAccountLifecycleState(
    accountId: OperationsAccountId,
  ): Promise<OperationsAccountLifecycleState | undefined>;
}

/** Pure preparation only; the future adapter must read history and execute the plan atomically. */
export function planOperationsPrincipalLifecycleCommand(
  principal: OperationsPrincipalLifecycleState | undefined,
  command: OperationsPrincipalLifecycleCommand,
) {
  if (principal === undefined) throw new OperationsLifecycleContractError('principal_not_found');
  if (principal.id !== command.principalId) {
    throw new OperationsLifecycleContractError('ownership_mismatch');
  }
  assertAudit(command.audit, principal.updatedAt);
  return refineLifecyclePlan(planOperationsPrincipalTransition(principal, command));
}

export function planOperationsAccountLifecycleCommand(
  snapshot: OperationsIdentitySecuritySnapshot,
  command: OperationsAccountLifecycleCommand,
) {
  const { principal, account } = requireOwners(snapshot);
  if (principal.id !== command.principalId || account.id !== command.accountId) {
    throw new OperationsLifecycleContractError('ownership_mismatch');
  }
  assertAudit(command.audit, principal.updatedAt, account.updatedAt);
  return refineLifecyclePlan(planOperationsAccountTransition(principal, account, command));
}

/** Version and Session invalidation intent only: no verifier generation or database mutation. */
export function planOperationsCredentialReplacement(
  snapshot: OperationsIdentitySecuritySnapshot,
  command: OperationsCredentialReplacementCommand,
): OperationsCredentialReplacementPlan {
  const { principal, account, credential } = requireActiveSecurity(snapshot);
  assertAudit(command.audit, principal.updatedAt, account.updatedAt, credential.createdAt);
  if (principal.id !== command.principalId || account.id !== command.accountId) {
    throw new OperationsLifecycleContractError('ownership_mismatch');
  }
  assertOperationsLifecycleCounter(command.expectedEpoch);
  if (command.expectedEpoch !== principal.securityEpoch) {
    throw new OperationsLifecycleContractError('expected_epoch_mismatch');
  }
  assertOperationsLifecycleCounter(command.expectedVersion, 1);
  if (command.expectedVersion !== credential.version) {
    throw new OperationsLifecycleContractError('expected_version_mismatch');
  }
  if (credential.version === OPERATIONS_LIFECYCLE_COUNTER_MAX) {
    throw new OperationsLifecycleContractError('version_exhausted');
  }
  createEncodedPasswordVerifier(command.verifier);
  if (
    command.id === credential.id ||
    !validDate(command.replacedAt) ||
    command.replacedAt.getTime() !== command.audit.occurredAt.getTime()
  ) {
    throw new OperationsLifecycleContractError('invalid_lifecycle_input');
  }
  return {
    previousCredential: createOperationsCredentialMetadata({
      ...credential,
      status: 'revoked',
      revokedAt: command.replacedAt,
    }),
    nextCredential: createOperationsCredentialMetadata({
      id: command.id,
      accountId: account.id,
      kind: 'password',
      status: 'active',
      version: credential.version + 1,
      createdAt: command.replacedAt,
    }),
    principalEpoch: createOperationsPrincipalSecurityEpoch(principal.securityEpoch),
    revokeSessionsForCredentialVersion: createOperationsSessionCredentialVersion(
      credential.version,
    ),
    audit: command.audit,
  };
}

export function assertOperationsSessionCreationContract(
  snapshot: OperationsIdentitySecuritySnapshot,
  input: Parameters<OperationsSessionRepository['createSession']>[0],
): void {
  createOperationsSessionCredentialDigest(input.credentialDigest);
  assertEligibleSession(snapshot, input.session, input.now);
}

export function assertOperationsSessionValidationContract(
  snapshot: OperationsIdentitySecuritySnapshot,
  record: OperationsSessionPersistenceRecord,
  input: Parameters<OperationsSessionRepository['findActiveSessionByCredentialDigest']>[0],
): void {
  createOperationsSessionCredentialDigest(input.credentialDigest);
  if (record.credentialDigest !== input.credentialDigest) {
    throw new OperationsLifecycleContractError('digest_mismatch');
  }
  assertOperationsLifecycleCounter(record.sessionVersion, 1);
  assertEligibleSession(snapshot, record.session, input.now);
}

export function planOperationsSessionTouch(
  snapshot: OperationsIdentitySecuritySnapshot,
  record: OperationsSessionPersistenceRecord,
  input: Parameters<OperationsSessionRepository['validateAndTouchSession']>[0],
) {
  assertOperationsSessionValidationContract(snapshot, record, input);
  return mergeTouch(record.session, input.nextLastActivityAt, input.nextIdleExpiresAt);
}

export function planOperationsSessionRotation(
  snapshot: OperationsIdentitySecuritySnapshot,
  record: OperationsSessionPersistenceRecord,
  input: Parameters<OperationsSessionRepository['rotateSession']>[0],
) {
  assertOperationsLifecycleCounter(input.expectedSessionVersion, 1);
  if (record.sessionVersion !== input.expectedSessionVersion) {
    throw new OperationsLifecycleContractError('expected_version_mismatch');
  }
  if (
    record.session.id !== input.sessionId ||
    record.session.principalId !== input.principalId ||
    record.session.accountId !== input.accountId
  ) {
    throw new OperationsLifecycleContractError('ownership_mismatch');
  }
  createOperationsSessionCredentialDigest(input.credentialDigest);
  if (record.credentialDigest !== input.credentialDigest) {
    throw new OperationsSessionConflictError('credential_digest');
  }
  assertOperationsSessionValidationContract(snapshot, record, {
    credentialDigest: input.credentialDigest,
    now: input.rotatedAt,
  });
  createOperationsSessionCredentialDigest(input.nextCredentialDigest);
  if (input.nextCredentialDigest === input.credentialDigest) {
    throw new OperationsLifecycleContractError('invalid_lifecycle_input');
  }
  if (record.sessionVersion === OPERATIONS_LIFECYCLE_COUNTER_MAX) {
    throw new OperationsLifecycleContractError('version_exhausted');
  }
  return {
    ...mergeTouch(record.session, input.nextLastActivityAt, input.nextIdleExpiresAt),
    nextSessionVersion: record.sessionVersion + 1,
    nextCredentialDigest: input.nextCredentialDigest,
    absoluteExpiresAt: record.session.absoluteExpiresAt,
  };
}

export function planOperationsSessionRevocation(
  record: OperationsSessionPersistenceRecord,
  input: Parameters<OperationsSessionRepository['revokeSession']>[0],
) {
  assertOperationsSession(record.session);
  assertOperationsLifecycleCounter(record.sessionVersion, 1);
  if (
    record.session.id !== input.sessionId ||
    record.session.principalId !== input.principalId ||
    record.session.accountId !== input.accountId
  ) {
    throw new OperationsLifecycleContractError('ownership_mismatch');
  }
  if (input.expectedSessionVersion !== undefined) {
    assertOperationsLifecycleCounter(input.expectedSessionVersion, 1);
    if (input.expectedSessionVersion !== record.sessionVersion) {
      throw new OperationsLifecycleContractError('expected_version_mismatch');
    }
  }
  if (record.session.status === 'revoked') return record.session;
  if (
    !validDate(input.revokedAt) ||
    input.revokedAt.getTime() < record.session.createdAt.getTime()
  ) {
    throw new OperationsLifecycleContractError('invalid_lifecycle_input');
  }
  return { ...record.session, status: 'revoked' as const, revokedAt: input.revokedAt };
}

export type OperationsLifecycleLockKind = 'principal' | 'account' | 'credential' | 'session';
const lockOrder: readonly OperationsLifecycleLockKind[] = [
  'principal',
  'account',
  'credential',
  'session',
];

/** Validates a declared trace, NOT real locks. C2/C3 must verify actual database acquisition. */
export function assertOperationsLifecycleLockOrder(
  claims: readonly { readonly kind: OperationsLifecycleLockKind; readonly id: string }[],
): void {
  let previous = -1;
  let previousId = '';
  for (const claim of claims) {
    const rank = lockOrder.indexOf(claim.kind);
    if (
      rank < 0 ||
      rank < previous ||
      claim.id.trim().length === 0 ||
      (rank === previous && claim.id < previousId)
    ) {
      throw new OperationsLifecycleContractError('invalid_lock_order');
    }
    previousId = claim.id;
    previous = rank;
  }
}

export function classifyOperationsLifecycleFailure(error: unknown) {
  if (error instanceof OperationsLifecycleContractError) return error.category;
  if (error instanceof OperationsSessionNotAuthenticatedError) return 'not_authenticated';
  if (
    error instanceof OperationsSessionNotFoundError ||
    error instanceof OperationsCredentialNotFoundError ||
    error instanceof OperationsAccountNotFoundError ||
    error instanceof OperationsHumanPrincipalNotFoundError
  )
    return 'not_found';
  if (error instanceof OperationsSessionConflictError)
    return error.reason === 'ownership' ? 'state_conflict' : 'cas_conflict';
  if (
    error instanceof OperationsPrincipalSecurityEpochConflictError ||
    error instanceof OperationsCredentialVersionConflictError
  )
    return 'cas_conflict';
  if (error instanceof OperationsTerminalStatusTransitionError) return 'state_conflict';
  if (
    error instanceof OperationsDomainInvariantError ||
    error instanceof OperationsSessionContractError ||
    error instanceof OperationsCredentialVerifierError
  )
    return 'contract_failure';
  return 'infrastructure_failure';
}

function refineLifecyclePlan<Status extends string>(
  plan: OperationsLifecycleTransitionPlan<Status>,
): OperationsLifecycleApplicationPlan<Status> {
  return {
    ...plan,
    previousEpoch: createOperationsPrincipalSecurityEpoch(plan.previousEpoch),
    nextEpoch: createOperationsPrincipalSecurityEpoch(plan.nextEpoch),
  };
}

function requireOwners(snapshot: OperationsIdentitySecuritySnapshot) {
  const { principal, account } = snapshot;
  if (principal === undefined) throw new OperationsLifecycleContractError('principal_not_found');
  if (account === undefined) throw new OperationsLifecycleContractError('account_not_found');
  assertOperationsHumanPrincipal(principal);
  assertOperationsAccount(account);
  assertOperationsLifecycleCounter(principal.securityEpoch);
  if (account.principalId !== principal.id)
    throw new OperationsLifecycleContractError('ownership_mismatch');
  return { principal, account };
}

function requireActiveSecurity(snapshot: OperationsIdentitySecuritySnapshot) {
  const { principal, account } = requireOwners(snapshot);
  if (principal.status !== 'active' || account.status !== 'active') {
    throw new OperationsLifecycleContractError('parent_not_active');
  }
  assertOperationsPrincipalLifecycleState(principal);
  assertOperationsAccountLifecycleState(account);
  const credential = snapshot.credential;
  if (credential === undefined) throw new OperationsLifecycleContractError('credential_not_active');
  assertOperationsCredentialMetadata(credential);
  assertOperationsLifecycleCounter(credential.version, 1);
  if (credential.accountId !== account.id)
    throw new OperationsLifecycleContractError('ownership_mismatch');
  if (credential.status !== 'active')
    throw new OperationsLifecycleContractError('credential_not_active');
  return { principal, account, credential };
}

function assertEligibleSession(
  snapshot: OperationsIdentitySecuritySnapshot,
  session: OperationsSession,
  now: Date,
) {
  const { principal, account, credential } = requireActiveSecurity(snapshot);
  assertOperationsSession(session);
  if (session.principalId !== principal.id || session.accountId !== account.id)
    throw new OperationsLifecycleContractError('ownership_mismatch');
  if (session.status !== 'active') throw new OperationsLifecycleContractError('session_not_active');
  if (session.credentialVersion !== credential.version)
    throw new OperationsLifecycleContractError('credential_snapshot_mismatch');
  if (session.principalSecurityEpoch !== principal.securityEpoch)
    throw new OperationsLifecycleContractError('epoch_snapshot_mismatch');
  if (!validDate(now)) throw new OperationsLifecycleContractError('invalid_lifecycle_input');
  if (
    now.getTime() >= session.idleExpiresAt.getTime() ||
    now.getTime() >= session.absoluteExpiresAt.getTime()
  )
    throw new OperationsLifecycleContractError('session_expired');
}

function mergeTouch(session: OperationsSession, activity: Date, idle: Date) {
  if (
    !validDate(activity) ||
    !validDate(idle) ||
    idle.getTime() < activity.getTime() ||
    idle.getTime() > session.absoluteExpiresAt.getTime()
  )
    throw new OperationsLifecycleContractError('invalid_lifecycle_input');
  const next = {
    lastActivityAt: new Date(Math.max(session.lastActivityAt.getTime(), activity.getTime())),
    idleExpiresAt: new Date(Math.max(session.idleExpiresAt.getTime(), idle.getTime())),
  };
  assertOperationsSessionTouch(session, next);
  return next;
}

function validDate(value: Date): boolean {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function assertAudit(audit: OperationsLifecycleAuditContext, ...previous: readonly Date[]) {
  if (
    ![audit.operationId, audit.correlationId, audit.reasonCode].every(
      (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 128,
    ) ||
    !validDate(audit.occurredAt) ||
    previous.some((date) => audit.occurredAt.getTime() < date.getTime())
  )
    throw new OperationsLifecycleContractError('invalid_lifecycle_input');
}
