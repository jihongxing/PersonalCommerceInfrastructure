import type {
  OperationsAccountId,
  OperationsCredentialId,
  OperationsCredentialMetadata,
} from '../../modules/operations-identity/operations-identity-contract.js';

declare const encodedPasswordVerifierBrand: unique symbol;

export type EncodedPasswordVerifier = string & {
  readonly [encodedPasswordVerifierBrand]: 'EncodedPasswordVerifier';
};

export class OperationsCredentialVerifierError extends Error {
  public constructor() {
    super('Encoded Operations Password Verifier is invalid.');
    this.name = 'OperationsCredentialVerifierError';
  }
}

export function createEncodedPasswordVerifier(value: string): EncodedPasswordVerifier {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 4096) {
    throw new OperationsCredentialVerifierError();
  }
  return value as EncodedPasswordVerifier;
}

export interface OperationsPasswordCredentialRecord {
  readonly metadata: OperationsCredentialMetadata;
  readonly verifier: EncodedPasswordVerifier;
}

export type OperationsCredentialUniqueConflict =
  'credential_id' | 'active_password' | 'account_version';

export class OperationsCredentialAlreadyExistsError extends Error {
  public constructor(
    public readonly accountId: OperationsAccountId,
    public readonly conflict: OperationsCredentialUniqueConflict,
  ) {
    super(
      `Operations Password Credential conflicts with an existing credential for Account ${accountId}.`,
    );
    this.name = 'OperationsCredentialAlreadyExistsError';
  }
}

export class OperationsCredentialNotFoundError extends Error {
  public constructor(public readonly accountId: OperationsAccountId) {
    super(`Active Operations Password Credential for Account ${accountId} was not found.`);
    this.name = 'OperationsCredentialNotFoundError';
  }
}

export class OperationsCredentialVersionConflictError extends Error {
  public constructor(
    public readonly accountId: OperationsAccountId,
    public readonly expectedVersion: number,
    public readonly actualVersion: number,
  ) {
    super(
      `Operations Password Credential version conflict for Account ${accountId}: expected ${expectedVersion}, found ${actualVersion}.`,
    );
    this.name = 'OperationsCredentialVersionConflictError';
  }
}

export class OperationsCredentialPersistenceError extends Error {
  public constructor(public readonly code?: string) {
    super('Operations Password Credential persistence failed.');
    this.name = 'OperationsCredentialPersistenceError';
  }
}

export interface OperationsCredentialRepository {
  findActivePasswordByAccountId(
    accountId: OperationsAccountId,
  ): Promise<OperationsPasswordCredentialRecord | undefined>;

  createPasswordCredential(input: {
    readonly id: OperationsCredentialId;
    readonly accountId: OperationsAccountId;
    readonly verifier: EncodedPasswordVerifier;
    readonly createdAt: Date;
  }): Promise<OperationsPasswordCredentialRecord>;

  revokeActivePasswordCredential(input: {
    readonly accountId: OperationsAccountId;
    readonly expectedVersion: number;
    readonly revokedAt: Date;
  }): Promise<void>;

  replaceActivePasswordCredential(input: {
    readonly id: OperationsCredentialId;
    readonly accountId: OperationsAccountId;
    readonly expectedVersion: number;
    readonly verifier: EncodedPasswordVerifier;
    readonly replacedAt: Date;
  }): Promise<OperationsPasswordCredentialRecord>;
}
