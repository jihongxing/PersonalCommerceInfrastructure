import type {
  OperationsAccountRepository,
  OperationsHumanPrincipalRepository,
  ServicePrincipalRepository,
  OperationsIdentityPersistenceTransaction,
} from '../../../applications/operations-identity/operations-identity-repositories.js';
import type { OperationsCredentialRepository } from '../../../applications/operations-identity/operations-credential-repositories.js';
import type { ProductDatabase } from './postgres-database.js';
import {
  PostgresOperationsAccountRepository,
  PostgresOperationsHumanPrincipalRepository,
  PostgresServicePrincipalRepository,
} from './postgres-operations-identity-repositories.js';
import { PostgresOperationsCredentialRepository } from './postgres-operations-credential-repository.js';
import { PostgresOperationsIdentityTransaction } from './postgres-operations-identity-transaction.js';

export interface PostgresOperationsIdentityComposition {
  readonly humanPrincipalRepository: OperationsHumanPrincipalRepository;
  readonly accountRepository: OperationsAccountRepository;
  readonly credentialRepository: OperationsCredentialRepository;
  readonly servicePrincipalRepository: ServicePrincipalRepository;
  readonly transaction: OperationsIdentityPersistenceTransaction;
}

/** Constructs the bounded Operations Identity persistence adapters from one database. */
export function createPostgresOperationsIdentityComposition(
  database: ProductDatabase,
): PostgresOperationsIdentityComposition {
  return {
    humanPrincipalRepository: new PostgresOperationsHumanPrincipalRepository(database),
    accountRepository: new PostgresOperationsAccountRepository(database),
    credentialRepository: new PostgresOperationsCredentialRepository(database),
    servicePrincipalRepository: new PostgresServicePrincipalRepository(database),
    transaction: new PostgresOperationsIdentityTransaction(database),
  };
}
