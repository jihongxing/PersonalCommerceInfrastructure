import { and, eq, ne } from 'drizzle-orm';

import {
  createOperationsAccount,
  createOperationsHumanPrincipal,
  createPlatformSystemPrincipal,
  createProviderServicePrincipal,
  createServicePrincipalId,
  createOperationsAccountId,
  createOperationsHumanPrincipalId,
  createPlatformSystemId,
  createProviderId,
  normalizeOperationsLoginIdentifier,
  type OperationsAccount,
  type OperationsHumanPrincipal,
  type PlatformSystemPrincipal,
  type ProviderServicePrincipal,
  type ServicePrincipal,
} from '../../../modules/operations-identity/operations-identity-contract.js';
import {
  OperationsAccountAlreadyExistsError,
  OperationsAccountNotFoundError,
  OperationsHumanPrincipalAlreadyExistsError,
  OperationsHumanPrincipalNotFoundError,
  OperationsTerminalStatusTransitionError,
  ServicePrincipalAlreadyExistsError,
  ServicePrincipalNotFoundError,
  type OperationsAccountRepository,
  type OperationsHumanPrincipalRepository,
  type ServicePrincipalRepository,
} from '../../../applications/operations-identity/operations-identity-repositories.js';
import {
  operationsAccounts,
  operationsHumanPrincipals,
  servicePrincipals,
} from '../../../database/schema/operations-identity.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresOperationsHumanPrincipalRepository implements OperationsHumanPrincipalRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async create(principal: OperationsHumanPrincipal): Promise<void> {
    try {
      await this.database.insert(operationsHumanPrincipals).values({
        principalId: principal.id,
        status: principal.status,
        securityEpoch: principal.securityEpoch,
        createdAt: principal.createdAt.toISOString(),
        updatedAt: principal.updatedAt.toISOString(),
      });
    } catch (error) {
      if (uniqueConstraint(error) === 'operations_human_principals_pkey') {
        throw new OperationsHumanPrincipalAlreadyExistsError(principal.id);
      }
      throw error;
    }
  }

  public async findById(
    principalId: OperationsHumanPrincipal['id'],
  ): Promise<OperationsHumanPrincipal | undefined> {
    const rows = await this.database
      .select()
      .from(operationsHumanPrincipals)
      .where(eq(operationsHumanPrincipals.principalId, principalId));
    const row = rows[0];
    return row === undefined ? undefined : toHumanPrincipal(row);
  }

  public async updateStatus(
    principalId: OperationsHumanPrincipal['id'],
    status: OperationsHumanPrincipal['status'],
    updatedAt: Date,
  ): Promise<void> {
    const updated = await this.database
      .update(operationsHumanPrincipals)
      .set({ status, updatedAt: updatedAt.toISOString() })
      .where(
        status === 'active'
          ? and(
              eq(operationsHumanPrincipals.principalId, principalId),
              ne(operationsHumanPrincipals.status, 'tombstoned'),
            )
          : eq(operationsHumanPrincipals.principalId, principalId),
      )
      .returning({ principalId: operationsHumanPrincipals.principalId });
    if (updated.length > 0) return;
    const existing = await this.findById(principalId);
    if (existing === undefined) throw new OperationsHumanPrincipalNotFoundError(principalId);
    if (existing.status === 'tombstoned' && status === 'active') {
      throw new OperationsTerminalStatusTransitionError(
        'human_principal',
        principalId,
        'tombstoned',
      );
    }
    throw new OperationsHumanPrincipalNotFoundError(principalId);
  }
}

export class PostgresOperationsAccountRepository implements OperationsAccountRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async create(account: OperationsAccount): Promise<void> {
    const loginIdentifierNormalized = normalizeOperationsLoginIdentifier(
      account.loginIdentifierNormalized,
    );
    try {
      await this.database.insert(operationsAccounts).values({
        accountId: account.id,
        principalId: account.principalId,
        loginIdentifierNormalized,
        status: account.status,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      });
    } catch (error) {
      const constraint = uniqueConstraint(error);
      if (constraint === 'operations_accounts_pkey') {
        throw new OperationsAccountAlreadyExistsError(account.id, 'primary_id');
      }
      if (constraint === 'operations_accounts_principal_id_unique') {
        throw new OperationsAccountAlreadyExistsError(account.id, 'principal_id');
      }
      if (constraint === 'operations_accounts_login_identifier_normalized_unique') {
        throw new OperationsAccountAlreadyExistsError(account.id, 'login_identifier_normalized');
      }
      throw error;
    }
  }

  public async findById(
    accountId: OperationsAccount['id'],
  ): Promise<OperationsAccount | undefined> {
    const rows = await this.database
      .select()
      .from(operationsAccounts)
      .where(eq(operationsAccounts.accountId, accountId));
    const row = rows[0];
    return row === undefined ? undefined : toOperationsAccount(row);
  }

  public async findByPrincipalId(
    principalId: OperationsAccount['principalId'],
  ): Promise<OperationsAccount | undefined> {
    const rows = await this.database
      .select()
      .from(operationsAccounts)
      .where(eq(operationsAccounts.principalId, principalId));
    const row = rows[0];
    return row === undefined ? undefined : toOperationsAccount(row);
  }

  public async findByNormalizedLoginIdentifier(
    loginIdentifierNormalized: string,
  ): Promise<OperationsAccount | undefined> {
    const canonicalLoginIdentifier = normalizeOperationsLoginIdentifier(loginIdentifierNormalized);
    const rows = await this.database
      .select()
      .from(operationsAccounts)
      .where(eq(operationsAccounts.loginIdentifierNormalized, canonicalLoginIdentifier));
    const row = rows[0];
    return row === undefined ? undefined : toOperationsAccount(row);
  }

  public async updateStatus(
    accountId: OperationsAccount['id'],
    status: OperationsAccount['status'],
    updatedAt: Date,
  ): Promise<void> {
    const updated = await this.database
      .update(operationsAccounts)
      .set({ status, updatedAt: updatedAt.toISOString() })
      .where(
        status === 'active'
          ? and(
              eq(operationsAccounts.accountId, accountId),
              ne(operationsAccounts.status, 'revoked'),
            )
          : eq(operationsAccounts.accountId, accountId),
      )
      .returning({ accountId: operationsAccounts.accountId });
    if (updated.length > 0) return;
    const existing = await this.findById(accountId);
    if (existing === undefined) throw new OperationsAccountNotFoundError(accountId);
    if (existing.status === 'revoked' && status === 'active') {
      throw new OperationsTerminalStatusTransitionError('account', accountId, 'revoked');
    }
    throw new OperationsAccountNotFoundError(accountId);
  }
}

export class PostgresServicePrincipalRepository implements ServicePrincipalRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async createProvider(principal: ProviderServicePrincipal): Promise<void> {
    try {
      await this.database.insert(servicePrincipals).values({
        servicePrincipalId: principal.id,
        kind: principal.kind,
        providerId: principal.providerId,
        systemId: null,
        status: principal.status,
        createdAt: principal.createdAt.toISOString(),
      });
    } catch (error) {
      const constraint = uniqueConstraint(error);
      if (constraint === 'service_principals_pkey') {
        throw new ServicePrincipalAlreadyExistsError(principal.id, 'primary_id');
      }
      if (constraint === 'service_principals_provider_id_unique') {
        throw new ServicePrincipalAlreadyExistsError(principal.id, 'provider_id');
      }
      if (constraint === 'service_principals_system_id_unique') {
        throw new ServicePrincipalAlreadyExistsError(principal.id, 'system_id');
      }
      throw error;
    }
  }

  public async createPlatformSystem(principal: PlatformSystemPrincipal): Promise<void> {
    try {
      await this.database.insert(servicePrincipals).values({
        servicePrincipalId: principal.id,
        kind: principal.kind,
        providerId: null,
        systemId: principal.systemId,
        status: principal.status,
        createdAt: principal.createdAt.toISOString(),
      });
    } catch (error) {
      const constraint = uniqueConstraint(error);
      if (constraint === 'service_principals_pkey') {
        throw new ServicePrincipalAlreadyExistsError(principal.id, 'primary_id');
      }
      if (constraint === 'service_principals_provider_id_unique') {
        throw new ServicePrincipalAlreadyExistsError(principal.id, 'provider_id');
      }
      if (constraint === 'service_principals_system_id_unique') {
        throw new ServicePrincipalAlreadyExistsError(principal.id, 'system_id');
      }
      throw error;
    }
  }

  public async findById(
    principalId: ServicePrincipal['id'],
  ): Promise<ServicePrincipal | undefined> {
    const rows = await this.database
      .select()
      .from(servicePrincipals)
      .where(eq(servicePrincipals.servicePrincipalId, principalId));
    const row = rows[0];
    return row === undefined ? undefined : toServicePrincipal(row);
  }

  public async findByProviderId(
    providerId: ProviderServicePrincipal['providerId'],
  ): Promise<ProviderServicePrincipal | undefined> {
    const rows = await this.database
      .select()
      .from(servicePrincipals)
      .where(
        and(
          eq(servicePrincipals.kind, 'provider_service'),
          eq(servicePrincipals.providerId, providerId),
        ),
      );
    const row = rows[0];
    const principal = row === undefined ? undefined : toServicePrincipal(row);
    return principal?.kind === 'provider_service' ? principal : undefined;
  }

  public async findBySystemId(
    systemId: PlatformSystemPrincipal['systemId'],
  ): Promise<PlatformSystemPrincipal | undefined> {
    const rows = await this.database
      .select()
      .from(servicePrincipals)
      .where(
        and(
          eq(servicePrincipals.kind, 'platform_system'),
          eq(servicePrincipals.systemId, systemId),
        ),
      );
    const row = rows[0];
    const principal = row === undefined ? undefined : toServicePrincipal(row);
    return principal?.kind === 'platform_system' ? principal : undefined;
  }

  public async updateStatus(
    principalId: ServicePrincipal['id'],
    status: ServicePrincipal['status'],
  ): Promise<void> {
    const updated = await this.database
      .update(servicePrincipals)
      .set({ status })
      .where(
        status === 'active'
          ? and(
              eq(servicePrincipals.servicePrincipalId, principalId),
              ne(servicePrincipals.status, 'revoked'),
            )
          : eq(servicePrincipals.servicePrincipalId, principalId),
      )
      .returning({ servicePrincipalId: servicePrincipals.servicePrincipalId });
    if (updated.length > 0) return;
    const existing = await this.findById(principalId);
    if (existing === undefined) throw new ServicePrincipalNotFoundError(principalId);
    if (existing.status === 'revoked' && status === 'active') {
      throw new OperationsTerminalStatusTransitionError(
        'service_principal',
        principalId,
        'revoked',
      );
    }
    throw new ServicePrincipalNotFoundError(principalId);
  }
}

function toHumanPrincipal(
  row: typeof operationsHumanPrincipals.$inferSelect,
): OperationsHumanPrincipal {
  return createOperationsHumanPrincipal({
    id: createOperationsHumanPrincipalId(row.principalId),
    status: row.status as OperationsHumanPrincipal['status'],
    securityEpoch: row.securityEpoch,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  });
}

function toOperationsAccount(row: typeof operationsAccounts.$inferSelect): OperationsAccount {
  return createOperationsAccount({
    id: createOperationsAccountId(row.accountId),
    principalId: createOperationsHumanPrincipalId(row.principalId),
    loginIdentifierNormalized: row.loginIdentifierNormalized,
    status: row.status as OperationsAccount['status'],
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  });
}

function toServicePrincipal(row: typeof servicePrincipals.$inferSelect): ServicePrincipal {
  if (row.kind === 'provider_service' && row.providerId !== null && row.systemId === null) {
    return createProviderServicePrincipal({
      id: createServicePrincipalId(row.servicePrincipalId),
      providerId: createProviderId(row.providerId),
      status: row.status as ProviderServicePrincipal['status'],
      createdAt: new Date(row.createdAt),
    });
  }
  if (row.kind === 'platform_system' && row.providerId === null && row.systemId !== null) {
    return createPlatformSystemPrincipal({
      id: createServicePrincipalId(row.servicePrincipalId),
      systemId: createPlatformSystemId(row.systemId),
      status: row.status as PlatformSystemPrincipal['status'],
      createdAt: new Date(row.createdAt),
    });
  }
  throw new Error(`Invalid Service Principal discriminator for ${row.servicePrincipalId}.`);
}

function uniqueConstraint(error: unknown): string | undefined {
  const databaseError = unwrapDatabaseError(error);
  if (
    typeof databaseError !== 'object' ||
    databaseError === null ||
    !('code' in databaseError) ||
    databaseError.code !== '23505'
  ) {
    return undefined;
  }
  if ('constraint_name' in databaseError && typeof databaseError.constraint_name === 'string') {
    return databaseError.constraint_name;
  }
  if ('constraint' in databaseError && typeof databaseError.constraint === 'string') {
    return databaseError.constraint;
  }
  return undefined;
}

function unwrapDatabaseError(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'cause' in error) {
    return error.cause;
  }
  return error;
}
