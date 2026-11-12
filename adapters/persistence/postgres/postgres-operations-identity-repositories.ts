import { and, eq } from 'drizzle-orm';

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
  type OperationsAccount,
  type OperationsHumanPrincipal,
  type PlatformSystemPrincipal,
  type ProviderServicePrincipal,
  type ServicePrincipal,
} from '../../../modules/operations-identity/operations-identity-contract.js';
import {
  OperationsAccountAlreadyExistsError,
  OperationsHumanPrincipalAlreadyExistsError,
  ServicePrincipalAlreadyExistsError,
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
      if (isUniqueViolation(error)) {
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
    await this.database
      .update(operationsHumanPrincipals)
      .set({ status, updatedAt: updatedAt.toISOString() })
      .where(eq(operationsHumanPrincipals.principalId, principalId));
  }
}

export class PostgresOperationsAccountRepository implements OperationsAccountRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async create(account: OperationsAccount): Promise<void> {
    try {
      await this.database.insert(operationsAccounts).values({
        accountId: account.id,
        principalId: account.principalId,
        loginIdentifierNormalized: account.loginIdentifierNormalized,
        status: account.status,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new OperationsAccountAlreadyExistsError(account.id);
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
    const rows = await this.database
      .select()
      .from(operationsAccounts)
      .where(eq(operationsAccounts.loginIdentifierNormalized, loginIdentifierNormalized));
    const row = rows[0];
    return row === undefined ? undefined : toOperationsAccount(row);
  }

  public async updateStatus(
    accountId: OperationsAccount['id'],
    status: OperationsAccount['status'],
    updatedAt: Date,
  ): Promise<void> {
    await this.database
      .update(operationsAccounts)
      .set({ status, updatedAt: updatedAt.toISOString() })
      .where(eq(operationsAccounts.accountId, accountId));
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
      if (isUniqueViolation(error)) {
        throw new ServicePrincipalAlreadyExistsError(principal.id);
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
      if (isUniqueViolation(error)) {
        throw new ServicePrincipalAlreadyExistsError(principal.id);
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
    await this.database
      .update(servicePrincipals)
      .set({ status })
      .where(eq(servicePrincipals.servicePrincipalId, principalId));
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

function isUniqueViolation(error: unknown): boolean {
  const databaseError = unwrapDatabaseError(error);
  return (
    typeof databaseError === 'object' &&
    databaseError !== null &&
    'code' in databaseError &&
    databaseError.code === '23505'
  );
}

function unwrapDatabaseError(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'cause' in error) {
    return error.cause;
  }
  return error;
}
