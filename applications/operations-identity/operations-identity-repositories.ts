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

export class OperationsHumanPrincipalAlreadyExistsError extends Error {
  public constructor(public readonly principalId: OperationsHumanPrincipalId) {
    super(`Operations Human Principal ${principalId} already exists.`);
    this.name = 'OperationsHumanPrincipalAlreadyExistsError';
  }
}

export class OperationsAccountAlreadyExistsError extends Error {
  public constructor(public readonly accountId: OperationsAccountId) {
    super(`Operations Account ${accountId} conflicts with an existing account.`);
    this.name = 'OperationsAccountAlreadyExistsError';
  }
}

export class ServicePrincipalAlreadyExistsError extends Error {
  public constructor(public readonly servicePrincipalId: ServicePrincipalId) {
    super(`Service Principal ${servicePrincipalId} conflicts with an existing principal.`);
    this.name = 'ServicePrincipalAlreadyExistsError';
  }
}

export interface OperationsHumanPrincipalRepository {
  create(principal: OperationsHumanPrincipal): Promise<void>;
  findById(principalId: OperationsHumanPrincipalId): Promise<OperationsHumanPrincipal | undefined>;
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
