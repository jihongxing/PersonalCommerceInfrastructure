import { eq, sql } from 'drizzle-orm';

import type {
  ContractAcceptanceFactRepository,
  ContractRepository,
  ContractScopeVersionRepository,
} from '../../../applications/contract-commerce/contract-repositories.js';
import type {
  Contract,
  ContractAcceptanceFact,
  ContractScopeVersion,
} from '../../../modules/contract-commerce/contract.js';
import {
  commercialContractAcceptanceFacts,
  commercialContracts,
  commercialContractScopeVersions,
} from '../../../database/schema/paid-commerce.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresContractRepository
  implements ContractRepository, ContractScopeVersionRepository, ContractAcceptanceFactRepository
{
  public constructor(private readonly database: ProductDatabase) {}

  public async findById(id: string): Promise<Contract | undefined> {
    const rows = await this.database
      .select()
      .from(commercialContracts)
      .where(eq(commercialContracts.id, id));
    return rows[0] === undefined ? undefined : toContract(rows[0]);
  }

  public async findByCommerceActionId(commerceActionId: string): Promise<Contract | undefined> {
    const rows = await this.database
      .select()
      .from(commercialContracts)
      .where(eq(commercialContracts.commerceActionId, commerceActionId));
    return rows[0] === undefined ? undefined : toContract(rows[0]);
  }

  public async findByResultAccessToken(resultAccessToken: string): Promise<Contract | undefined> {
    const rows = await this.database
      .select()
      .from(commercialContracts)
      .where(eq(commercialContracts.resultAccessToken, resultAccessToken));
    return rows[0] === undefined ? undefined : toContract(rows[0]);
  }

  public async findByCreatorId(creatorId: string): Promise<readonly Contract[]> {
    const rows = await this.database
      .select()
      .from(commercialContracts)
      .where(eq(commercialContracts.creatorId, creatorId))
      .orderBy(commercialContracts.createdAt);
    return rows.map(toContract);
  }

  public async save(contract: Contract): Promise<void> {
    await this.database
      .insert(commercialContracts)
      .values({
        ...contract,
        currentScopeVersionId: contract.currentScopeVersionId ?? null,
        proposedAt: contract.proposedAt ?? null,
        proposalExpiresAt: contract.proposalExpiresAt ?? null,
        acceptedAt: contract.acceptedAt ?? null,
        acceptedBy: contract.acceptedBy ?? null,
        contractedAt: contract.contractedAt ?? null,
        orderId: contract.orderId ?? null,
        rejectedAt: contract.rejectedAt ?? null,
        cancelledAt: contract.cancelledAt ?? null,
        cancelledBy: contract.cancelledBy ?? null,
      })
      .onConflictDoUpdate({
        target: commercialContracts.id,
        set: {
          state: contract.state,
          currentScopeVersionId: contract.currentScopeVersionId ?? null,
          proposedAt: contract.proposedAt ?? null,
          proposalExpiresAt: contract.proposalExpiresAt ?? null,
          acceptedAt: contract.acceptedAt ?? null,
          acceptedBy: contract.acceptedBy ?? null,
          contractedAt: contract.contractedAt ?? null,
          orderId: contract.orderId ?? null,
          rejectedAt: contract.rejectedAt ?? null,
          cancelledAt: contract.cancelledAt ?? null,
          cancelledBy: contract.cancelledBy ?? null,
          updatedAt: new Date().toISOString(),
        },
      });
  }

  public async lock(contractId: string): Promise<void> {
    await this.database.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${contractId}))`);
  }

  public async findVersionById(id: string): Promise<ContractScopeVersion | undefined> {
    const rows = await this.database
      .select()
      .from(commercialContractScopeVersions)
      .where(eq(commercialContractScopeVersions.id, id));
    return rows[0] === undefined ? undefined : toScopeVersion(rows[0]);
  }

  public async listByContractId(contractId: string): Promise<readonly ContractScopeVersion[]> {
    const rows = await this.database
      .select()
      .from(commercialContractScopeVersions)
      .where(eq(commercialContractScopeVersions.contractId, contractId))
      .orderBy(commercialContractScopeVersions.version);
    return rows.map(toScopeVersion);
  }

  public async append(version: ContractScopeVersion): Promise<void> {
    await this.database.insert(commercialContractScopeVersions).values({
      id: version.id,
      contractId: version.contractId,
      version: version.version,
      performanceType: version.scope.performanceType,
      performanceDate: version.scope.performanceDate,
      location: version.scope.location,
      durationMinutes: version.scope.durationMinutes,
      creatorHeadcount: version.scope.creatorHeadcount,
      deliverables: version.scope.deliverables,
      priceMinor: version.scope.priceMinor,
      currency: version.scope.currency,
      cancellationTerms: version.scope.cancellationTerms,
      fulfillmentCriteria: version.scope.fulfillmentCriteria,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
    });
  }

  public async listAcceptanceFactsByContractId(
    contractId: string,
  ): Promise<readonly ContractAcceptanceFact[]> {
    const rows = await this.database
      .select()
      .from(commercialContractAcceptanceFacts)
      .where(eq(commercialContractAcceptanceFacts.contractId, contractId));
    return rows.map((row) => ({
      id: row.id,
      contractId: row.contractId,
      scopeVersionId: row.scopeVersionId,
      actorId: row.actorId,
      actorKind: row.actorKind as 'creator' | 'buyer',
      acceptedAt: row.acceptedAt,
    }));
  }

  public async appendAcceptanceFact(fact: ContractAcceptanceFact): Promise<void> {
    await this.database
      .insert(commercialContractAcceptanceFacts)
      .values(fact)
      .onConflictDoNothing({
        target: [
          commercialContractAcceptanceFacts.contractId,
          commercialContractAcceptanceFacts.actorId,
          commercialContractAcceptanceFacts.scopeVersionId,
        ],
      });
  }
}

function toContract(row: typeof commercialContracts.$inferSelect): Contract {
  return {
    id: row.id,
    commerceActionId: row.commerceActionId,
    creatorId: row.creatorId,
    buyerId: row.buyerId,
    offeringId: row.offeringId,
    resultAccessToken: row.resultAccessToken,
    state: row.state as Contract['state'],
    ...(row.currentScopeVersionId === null
      ? {}
      : { currentScopeVersionId: row.currentScopeVersionId }),
    ...(row.proposedAt === null ? {} : { proposedAt: row.proposedAt }),
    ...(row.proposalExpiresAt === null ? {} : { proposalExpiresAt: row.proposalExpiresAt }),
    ...(row.acceptedAt === null ? {} : { acceptedAt: row.acceptedAt }),
    ...(row.acceptedBy === null ? {} : { acceptedBy: row.acceptedBy }),
    ...(row.contractedAt === null ? {} : { contractedAt: row.contractedAt }),
    ...(row.orderId === null ? {} : { orderId: row.orderId }),
    ...(row.rejectedAt === null ? {} : { rejectedAt: row.rejectedAt }),
    ...(row.cancelledAt === null ? {} : { cancelledAt: row.cancelledAt }),
    ...(row.cancelledBy === null ? {} : { cancelledBy: row.cancelledBy as 'creator' | 'buyer' }),
  };
}

function toScopeVersion(
  row: typeof commercialContractScopeVersions.$inferSelect,
): ContractScopeVersion {
  return {
    id: row.id,
    contractId: row.contractId,
    version: row.version,
    scope: {
      performanceType: row.performanceType,
      performanceDate: row.performanceDate,
      location: row.location,
      durationMinutes: row.durationMinutes,
      creatorHeadcount: row.creatorHeadcount,
      deliverables: row.deliverables,
      priceMinor: row.priceMinor,
      currency: row.currency as 'CNY',
      cancellationTerms: row.cancellationTerms,
      fulfillmentCriteria: row.fulfillmentCriteria,
    },
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}
