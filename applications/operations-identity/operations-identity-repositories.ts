import type {
  OperationsAccount,
  OperationsAccountId,
  OperationsAccountStatus,
  OperationsHumanPrincipal,
  OperationsHumanPrincipalId,
  OperationsHumanPrincipalStatus,
  PlatformSystemId,
  PlatformSystemPrincipal,
  ProviderId,
  ProviderServicePrincipal,
  ServicePrincipal,
  ServicePrincipalId,
  ServicePrincipalStatus,
} from '../../modules/operations-identity/operations-identity-contract.js';

export type OperationsAccountUniqueConflict =
  'primary_id' | 'principal_id' | 'login_identifier_normalized';
export type ServicePrincipalUniqueConflict = 'primary_id' | 'provider_id' | 'system_id';

export class OperationsHumanPrincipalAlreadyExistsError extends Error {
  public readonly constraint = 'primary_id' as const;

  public constructor(public readonly principalId: OperationsHumanPrincipalId) {
    super(`Operations Human Principal ${principalId} already exists.`);
    this.name = 'OperationsHumanPrincipalAlreadyExistsError';
  }
}

export class OperationsAccountAlreadyExistsError extends Error {
  public constructor(
    public readonly accountId: OperationsAccountId,
    public readonly conflict: OperationsAccountUniqueConflict = 'primary_id',
  ) {
    super(`Operations Account ${accountId} conflicts with an existing account.`);
    this.name = 'OperationsAccountAlreadyExistsError';
  }
}

export class ServicePrincipalAlreadyExistsError extends Error {
  public constructor(
    public readonly servicePrincipalId: ServicePrincipalId,
    public readonly conflict: ServicePrincipalUniqueConflict = 'primary_id',
  ) {
    super(`Service Principal ${servicePrincipalId} conflicts with an existing principal.`);
    this.name = 'ServicePrincipalAlreadyExistsError';
  }
}

export class OperationsPrincipalAccountAssociationError extends Error {
  public constructor(
    public readonly principalId: OperationsHumanPrincipalId,
    public readonly accountPrincipalId: OperationsHumanPrincipalId,
  ) {
    super(
      `Operations Account ${accountPrincipalId} must belong to Human Principal ${principalId}.`,
    );
    this.name = 'OperationsPrincipalAccountAssociationError';
  }
}

export class OperationsHumanPrincipalNotFoundError extends Error {
  public constructor(public readonly principalId: OperationsHumanPrincipalId) {
    super(`Operations Human Principal ${principalId} was not found.`);
    this.name = 'OperationsHumanPrincipalNotFoundError';
  }
}

export class OperationsAccountNotFoundError extends Error {
  public constructor(public readonly accountId: OperationsAccountId) {
    super(`Operations Account ${accountId} was not found.`);
    this.name = 'OperationsAccountNotFoundError';
  }
}

export class ServicePrincipalNotFoundError extends Error {
  public constructor(public readonly servicePrincipalId: ServicePrincipalId) {
    super(`Service Principal ${servicePrincipalId} was not found.`);
    this.name = 'ServicePrincipalNotFoundError';
  }
}

export class OperationsTerminalStatusTransitionError extends Error {
  public constructor(
    public readonly entity: 'human_principal' | 'account' | 'service_principal',
    public readonly id: string,
    public readonly status: 'tombstoned' | 'revoked',
  ) {
    super(`Terminal ${entity} ${id} cannot be modified from ${status}.`);
    this.name = 'OperationsTerminalStatusTransitionError';
  }
}

export interface OperationsHumanPrincipalRepository {
  create(principal: OperationsHumanPrincipal): Promise<void>;
  findById(principalId: OperationsHumanPrincipalId): Promise<OperationsHumanPrincipal | undefined>;
  /** Reject every update once the current Principal is tombstoned, including no-op updates. */
  updateStatus(
    principalId: OperationsHumanPrincipalId,
    status: OperationsHumanPrincipalStatus,
    updatedAt: Date,
  ): Promise<void>;
}

export interface OperationsAccountRepository {
  create(account: OperationsAccount): Promise<void>;
  findById(accountId: OperationsAccountId): Promise<OperationsAccount | undefined>;
  findByPrincipalId(
    principalId: OperationsHumanPrincipalId,
  ): Promise<OperationsAccount | undefined>;
  findByNormalizedLoginIdentifier(
    loginIdentifierNormalized: string,
  ): Promise<OperationsAccount | undefined>;
  /** Reject every update once the current Account is revoked, including no-op updates. */
  updateStatus(
    accountId: OperationsAccountId,
    status: OperationsAccountStatus,
    updatedAt: Date,
  ): Promise<void>;
}

export interface ServicePrincipalRepository {
  createProvider(principal: ProviderServicePrincipal): Promise<void>;
  createPlatformSystem(principal: PlatformSystemPrincipal): Promise<void>;
  findById(principalId: ServicePrincipalId): Promise<ServicePrincipal | undefined>;
  findByProviderId(providerId: ProviderId): Promise<ProviderServicePrincipal | undefined>;
  findBySystemId(systemId: PlatformSystemId): Promise<PlatformSystemPrincipal | undefined>;
  /** Reject every update once the current Service Principal is revoked, including no-op updates. */
  updateStatus(principalId: ServicePrincipalId, status: ServicePrincipalStatus): Promise<void>;
}

export interface OperationsIdentityPersistenceScope {
  readonly humanPrincipalRepository: OperationsHumanPrincipalRepository;
  readonly accountRepository: OperationsAccountRepository;
  readonly servicePrincipalRepository: ServicePrincipalRepository;
}

export interface OperationsIdentityPersistenceTransaction {
  execute<Result>(
    operation: (scope: OperationsIdentityPersistenceScope) => Promise<Result>,
  ): Promise<Result>;
}
