import type {
  OperationsAccountId,
  OperationsHumanPrincipalId,
  OperationsSession,
  OperationsSessionId,
} from '../../modules/operations-identity/operations-identity-contract.js';

declare const operationsSessionCredentialDigestBrand: unique symbol;
declare const operationsSessionVersionBrand: unique symbol;
declare const operationsSessionCredentialVersionBrand: unique symbol;
declare const operationsPrincipalSecurityEpochBrand: unique symbol;

/** A canonical SHA-256-sized digest; the raw bearer credential never crosses this port. */
export type OperationsSessionCredentialDigest = string & {
  readonly [operationsSessionCredentialDigestBrand]: 'OperationsSessionCredentialDigest';
};

/** A persistence-only CAS value; it is distinct from Password Credential Version. */
export type OperationsSessionVersion = number & {
  readonly [operationsSessionVersionBrand]: 'OperationsSessionVersion';
};

/** The accepted Password Credential history version captured when a Session is created. */
export type OperationsSessionCredentialVersion = number & {
  readonly [operationsSessionCredentialVersionBrand]: 'OperationsSessionCredentialVersion';
};

/** A persistence contract value for the monotonic Human Principal security epoch. */
export type OperationsPrincipalSecurityEpoch = number & {
  readonly [operationsPrincipalSecurityEpochBrand]: 'OperationsPrincipalSecurityEpoch';
};

export class OperationsSessionContractError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'OperationsSessionContractError';
  }
}

export function createOperationsSessionCredentialDigest(
  value: string,
): OperationsSessionCredentialDigest {
  if (!/^[0-9a-f]{64}$/u.test(value)) {
    throw new OperationsSessionContractError(
      'Operations Session Credential Digest must be 64 lowercase hexadecimal characters.',
    );
  }
  return value as OperationsSessionCredentialDigest;
}

export function createOperationsSessionVersion(value: number): OperationsSessionVersion {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new OperationsSessionContractError(
      'Operations Session Version must be a positive integer.',
    );
  }
  return value as OperationsSessionVersion;
}

export function createOperationsSessionCredentialVersion(
  value: number,
): OperationsSessionCredentialVersion {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new OperationsSessionContractError(
      'Operations Session Credential Version must be a positive integer.',
    );
  }
  return value as OperationsSessionCredentialVersion;
}

/** Pure CAS arithmetic only; a future adapter must check and update atomically in the database. */
export function nextOperationsSessionVersion(
  currentVersion: OperationsSessionVersion,
  expectedVersion: OperationsSessionVersion,
): OperationsSessionVersion {
  if (currentVersion !== expectedVersion) {
    throw new OperationsSessionConflictError('session_version');
  }
  return createOperationsSessionVersion(currentVersion + 1);
}

export function createOperationsPrincipalSecurityEpoch(
  value: number,
): OperationsPrincipalSecurityEpoch {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new OperationsSessionContractError(
      'Operations Principal Security Epoch must be a non-negative integer.',
    );
  }
  return value as OperationsPrincipalSecurityEpoch;
}

/** Pure epoch arithmetic, not a PostgreSQL update or an authentication operation. */
export function nextOperationsPrincipalSecurityEpoch(
  currentEpoch: OperationsPrincipalSecurityEpoch,
  expectedEpoch: OperationsPrincipalSecurityEpoch,
): OperationsPrincipalSecurityEpoch {
  if (currentEpoch !== expectedEpoch) {
    throw new OperationsPrincipalSecurityEpochConflictError();
  }
  return createOperationsPrincipalSecurityEpoch(currentEpoch + 1);
}

/** Refines existing Domain snapshot fields; it adds no database fields to the Domain entity. */
export interface OperationsSessionSnapshot extends OperationsSession {
  readonly credentialVersion: OperationsSessionCredentialVersion;
  readonly principalSecurityEpoch: OperationsPrincipalSecurityEpoch;
}

export interface OperationsSessionPersistenceRecord {
  /** Domain metadata only; it contains no raw credential. */
  readonly session: OperationsSessionSnapshot;
  /** Persistence-only digest used to look up the current bearer credential. */
  readonly credentialDigest: OperationsSessionCredentialDigest;
  /** Persistence-only CAS metadata, separate from credentialVersion and securityEpoch. */
  readonly sessionVersion: OperationsSessionVersion;
}

export class OperationsSessionNotAuthenticatedError extends Error {
  public constructor() {
    super('Operations Session authentication could not be verified.');
    this.name = 'OperationsSessionNotAuthenticatedError';
  }
}

export class OperationsSessionNotFoundError extends Error {
  public constructor(public readonly sessionId: OperationsSessionId) {
    super(`Operations Session ${sessionId} was not found.`);
    this.name = 'OperationsSessionNotFoundError';
  }
}

export type OperationsSessionConflictReason = 'credential_digest' | 'session_version' | 'ownership';

export class OperationsSessionConflictError extends Error {
  public constructor(public readonly reason: OperationsSessionConflictReason) {
    super('Operations Session concurrency or ownership conflict.');
    this.name = 'OperationsSessionConflictError';
  }
}

export class OperationsPrincipalSecurityEpochConflictError extends Error {
  public constructor() {
    super('Operations Principal Security Epoch conflict.');
    this.name = 'OperationsPrincipalSecurityEpochConflictError';
  }
}

export class OperationsSessionPersistenceError extends Error {
  public constructor(public readonly code?: string) {
    super('Operations Session persistence failed.');
    this.name = 'OperationsSessionPersistenceError';
  }
}

/**
 * Future persistence contract only; no implementation or authentication authority is provided here.
 *
 * Locks, whenever participating, follow one order across creation, validation, rotation, revocation
 * and epoch changes: Human Principal -> Operations Account -> Operations Credential -> Operations
 * Session. Mutating operations must be atomic; ownership and validity checks belong in the same
 * transaction/consistent read as the write, not in an earlier application read.
 *
 * All credential lookups, touches and rotations must fail closed unless the Session, its Human
 * Principal, its matching Account and its current Password Credential are active; credentialVersion
 * and principalSecurityEpoch snapshots must match the current authoritative records. now (or
 * rotatedAt) must be strictly before both idleExpiresAt and absoluteExpiresAt. Expired records
 * cannot be revived by Touch or Rotation. Provider/System and Creator identities are not owners.
 *
 * Missing/invalid Digest, expiry, inactive ownership or stale security snapshots produce
 * OperationsSessionNotAuthenticatedError. Known-ID administrative absence produces
 * OperationsSessionNotFoundError. Ownership, Digest uniqueness and CAS mismatches produce
 * OperationsSessionConflictError. Infrastructure failures produce OperationsSessionPersistenceError
 * with a sanitized code only; no SQL parameters, Digest or raw driver cause may escape.
 * Invalid metadata produces OperationsSessionContractError or OperationsDomainInvariantError.
 * No raw bearer credential, deletion, reactivation or arbitrary update crosses this port.
 */
export interface OperationsSessionRepository {
  /**
   * Create only an active Session after checking its ownership, security snapshots and expiry at now.
   * Initialize sessionVersion to 1 inside persistence; callers cannot choose a later initial version.
   * credentialDigest is unique. This stores metadata; it does not issue a credential or authorize login.
   */
  createSession(input: {
    readonly session: OperationsSessionSnapshot;
    readonly credentialDigest: OperationsSessionCredentialDigest;
    readonly now: Date;
  }): Promise<OperationsSessionPersistenceRecord>;

  /** Apply all validity checks above; absence is NotAuthenticated, not a successful empty result. */
  findActiveSessionByCredentialDigest(input: {
    readonly credentialDigest: OperationsSessionCredentialDigest;
    readonly now: Date;
  }): Promise<OperationsSessionPersistenceRecord>;

  /**
   * Validate before extending idle expiry. Merge activity and idle expiry monotonically in storage so
   * an older concurrent request cannot overwrite a later value. Reject invalid candidate ordering or
   * dates beyond absoluteExpiresAt. Preserve absolute expiry, snapshots, Digest and sessionVersion.
   */
  validateAndTouchSession(input: {
    readonly credentialDigest: OperationsSessionCredentialDigest;
    readonly now: Date;
    readonly nextLastActivityAt: Date;
    readonly nextIdleExpiresAt: Date;
  }): Promise<OperationsSessionPersistenceRecord>;

  /**
   * Strict database CAS on the current Digest AND expectedSessionVersion, with matching owner IDs.
   * Atomically replace the unique Digest, invalidate the old Digest and advance sessionVersion by 1;
   * preserve ID, ownership, createdAt, security snapshots and absoluteExpiresAt. Apply monotonic Touch
   * semantics to the requested activity/idle timestamps. The new Digest must differ from the current
   * Digest. Failure changes nothing. At most one contender using the same old pair may succeed.
   *
   * A single CAS conflict fails closed for the losing request and never revokes the winner's new
   * Session. A lost rotation response leaves the old Digest unusable and requires reauthentication.
   * No grace window or default successor-credential recovery is provided. BFF single-flight is future
   * request coordination and cannot replace database CAS. No independent credential TTL is added.
   */
  rotateSession(input: {
    readonly sessionId: OperationsSessionId;
    readonly principalId: OperationsHumanPrincipalId;
    readonly accountId: OperationsAccountId;
    readonly credentialDigest: OperationsSessionCredentialDigest;
    readonly expectedSessionVersion: OperationsSessionVersion;
    readonly nextCredentialDigest: OperationsSessionCredentialDigest;
    readonly rotatedAt: Date;
    readonly nextLastActivityAt: Date;
    readonly nextIdleExpiresAt: Date;
  }): Promise<OperationsSessionPersistenceRecord>;

  /**
   * Verify the stored owner IDs; optionally enforce the expected CAS version. Active -> revoked is
   * terminal. An already-revoked record is an unchanged no-op, never a rewrite of historical metadata.
   * Missing ID is NotFound; mismatched owner/version is Conflict. Preserve Digest and all snapshots.
   */
  revokeSession(input: {
    readonly sessionId: OperationsSessionId;
    readonly principalId: OperationsHumanPrincipalId;
    readonly accountId: OperationsAccountId;
    readonly expectedSessionVersion?: OperationsSessionVersion;
    readonly revokedAt: Date;
  }): Promise<void>;

  /** Atomically revoke active records only; preserve revoked history and return the changed count. */
  revokeAllSessionsForAccount(input: {
    readonly accountId: OperationsAccountId;
    readonly revokedAt: Date;
  }): Promise<number>;

  /** Atomically revoke active records only; preserve revoked history and return the changed count. */
  revokeAllSessionsForPrincipal(input: {
    readonly principalId: OperationsHumanPrincipalId;
    readonly revokedAt: Date;
  }): Promise<number>;
}

/**
 * Separate application port: the existing Principal repository has no arbitrary epoch setter.
 * Under the shared lock order above, compare expectedEpoch and atomically write exactly epoch + 1.
 * No decrement, reset or caller-selected replacement value is allowed; reject overflow.
 * Missing Principal is OperationsHumanPrincipalNotFoundError, stale epoch is
 * OperationsPrincipalSecurityEpochConflictError and storage failure is OperationsSessionPersistenceError.
 * Account/Principal status-change workflows must coordinate this operation transactionally so future
 * validation rejects prior snapshots. This unit implements neither that workflow nor its SQL update.
 */
export interface OperationsPrincipalSecurityEpochRepository {
  incrementSecurityEpoch(input: {
    readonly principalId: OperationsHumanPrincipalId;
    readonly expectedEpoch: OperationsPrincipalSecurityEpoch;
    readonly updatedAt: Date;
  }): Promise<OperationsPrincipalSecurityEpoch>;
}
