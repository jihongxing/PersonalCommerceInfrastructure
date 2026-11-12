import type {
  OperationsIdentityPersistenceScope,
  OperationsIdentityPersistenceTransaction,
} from '../../../applications/operations-identity/operations-identity-repositories.js';
import type {
  OperationsAccount,
  OperationsHumanPrincipal,
} from '../../../modules/operations-identity/operations-identity-contract.js';
import { OperationsPrincipalAccountAssociationError } from '../../../applications/operations-identity/operations-identity-repositories.js';
import type { ProductDatabase } from './postgres-database.js';
import {
  PostgresOperationsAccountRepository,
  PostgresOperationsHumanPrincipalRepository,
  PostgresServicePrincipalRepository,
} from './postgres-operations-identity-repositories.js';

export class PostgresOperationsIdentityTransaction implements OperationsIdentityPersistenceTransaction {
  public constructor(private readonly database: ProductDatabase) {}

  public execute<Result>(
    operation: (scope: OperationsIdentityPersistenceScope) => Promise<Result>,
  ): Promise<Result> {
    return this.database.transaction((transaction) =>
      operation({
        humanPrincipalRepository: new PostgresOperationsHumanPrincipalRepository(transaction),
        accountRepository: new PostgresOperationsAccountRepository(transaction),
        servicePrincipalRepository: new PostgresServicePrincipalRepository(transaction),
      }),
    );
  }

  public createHumanPrincipalWithAccount(
    principal: OperationsHumanPrincipal,
    account: OperationsAccount,
  ): Promise<void> {
    if (principal.id !== account.principalId) {
      return Promise.reject(
        new OperationsPrincipalAccountAssociationError(principal.id, account.principalId),
      );
    }
    return this.execute(async ({ humanPrincipalRepository, accountRepository }) => {
      await humanPrincipalRepository.create(principal);
      await accountRepository.create(account);
    });
  }
}
