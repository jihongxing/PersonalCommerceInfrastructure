import { sql } from 'drizzle-orm';

import { OperationsHumanPrincipalNotFoundError } from '../../../applications/operations-identity/operations-identity-repositories.js';
import {
  createOperationsPrincipalSecurityEpoch,
  OperationsPrincipalSecurityEpochConflictError,
  OperationsSessionContractError,
  type OperationsPrincipalSecurityEpoch,
  type OperationsPrincipalSecurityEpochRepository,
} from '../../../applications/operations-identity/operations-session-repositories.js';
import type { ProductDatabase } from './postgres-database.js';
import { mapOperationsSessionPersistenceError } from './postgres-operations-session-repository.js';

export class PostgresOperationsSecurityEpochRepository implements OperationsPrincipalSecurityEpochRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async incrementSecurityEpoch(
    input: Parameters<OperationsPrincipalSecurityEpochRepository['incrementSecurityEpoch']>[0],
  ): Promise<OperationsPrincipalSecurityEpoch> {
    try {
      createOperationsPrincipalSecurityEpoch(input.expectedEpoch);
      if (!(input.updatedAt instanceof Date) || !Number.isFinite(input.updatedAt.getTime())) {
        throw new OperationsSessionContractError('A valid Principal update timestamp is required.');
      }
      return await this.database.transaction(async (tx) => {
        const principals = await tx.execute<{ security_epoch: number; created_at: string }>(sql`
          SELECT security_epoch, created_at FROM operations_human_principals
          WHERE principal_id = ${input.principalId} FOR UPDATE
        `);
        const principal = principals[0];
        if (principal === undefined)
          throw new OperationsHumanPrincipalNotFoundError(input.principalId);
        if (principal.security_epoch !== input.expectedEpoch)
          throw new OperationsPrincipalSecurityEpochConflictError();
        if (principal.security_epoch >= 2147483647)
          throw new OperationsSessionContractError('Principal Security Epoch is exhausted.');
        if (input.updatedAt.getTime() < new Date(principal.created_at).getTime())
          throw new OperationsSessionContractError('Principal update cannot precede creation.');
        const rows = await tx.execute<{ security_epoch: number }>(sql`
          UPDATE operations_human_principals SET security_epoch = security_epoch + 1, updated_at = ${input.updatedAt.toISOString()}
          WHERE principal_id = ${input.principalId} AND security_epoch = ${input.expectedEpoch}
          RETURNING security_epoch
        `);
        if (rows[0] === undefined) throw new OperationsPrincipalSecurityEpochConflictError();
        return createOperationsPrincipalSecurityEpoch(rows[0].security_epoch);
      });
    } catch (error) {
      throw mapOperationsSessionPersistenceError(error);
    }
  }
}
