import type {
  OperationsAccountRepository,
  OperationsHumanPrincipalRepository,
  ServicePrincipalRepository,
  OperationsIdentityPersistenceTransaction,
} from '../../../applications/operations-identity/operations-identity-repositories.js';
import type { OperationsCredentialRepository } from '../../../applications/operations-identity/operations-credential-repositories.js';
import type { OperationsHumanAuthenticationRuntime } from '../../../applications/operations-identity/operations-human-authentication.js';
import type {
  OperationsPrincipalSecurityEpochRepository,
  OperationsSessionRepository,
} from '../../../applications/operations-identity/operations-session-repositories.js';
import type { ProductDatabase } from './postgres-database.js';
import {
  PostgresOperationsAccountRepository,
  PostgresOperationsHumanPrincipalRepository,
  PostgresServicePrincipalRepository,
} from './postgres-operations-identity-repositories.js';
import { PostgresOperationsCredentialRepository } from './postgres-operations-credential-repository.js';
import { PostgresOperationsIdentityTransaction } from './postgres-operations-identity-transaction.js';
import { PostgresOperationsSessionRepository } from './postgres-operations-session-repository.js';
import { PostgresOperationsSecurityEpochRepository } from './postgres-operations-security-epoch-repository.js';
import { PostgresOperationsHumanAuthenticationStore } from './postgres-operations-human-authentication-store.js';
import { createOperationsHumanAuthenticationRuntime } from '../../../applications/operations-identity/operations-human-authentication.js';
import { Argon2idOperationsPasswordVerifier } from '../../../adapters/auth/operations/argon2id-password-hasher.js';

export interface PostgresOperationsIdentityComposition {
  readonly humanPrincipalRepository: OperationsHumanPrincipalRepository;
  readonly accountRepository: OperationsAccountRepository;
  readonly credentialRepository: OperationsCredentialRepository;
  readonly sessionRepository: OperationsSessionRepository;
  readonly securityEpochRepository: OperationsPrincipalSecurityEpochRepository;
  readonly servicePrincipalRepository: ServicePrincipalRepository;
  readonly transaction: OperationsIdentityPersistenceTransaction;
  readonly humanAuthenticationRuntime: OperationsHumanAuthenticationRuntime;
}

/** Constructs the bounded Operations Identity persistence adapters from one database. */
export function createPostgresOperationsIdentityComposition(
  database: ProductDatabase,
): PostgresOperationsIdentityComposition {
  return {
    humanPrincipalRepository: new PostgresOperationsHumanPrincipalRepository(database),
    accountRepository: new PostgresOperationsAccountRepository(database),
    credentialRepository: new PostgresOperationsCredentialRepository(database),
    sessionRepository: new PostgresOperationsSessionRepository(database),
    securityEpochRepository: new PostgresOperationsSecurityEpochRepository(database),
    servicePrincipalRepository: new PostgresServicePrincipalRepository(database),
    transaction: new PostgresOperationsIdentityTransaction(database),
    humanAuthenticationRuntime: createOperationsHumanAuthenticationRuntime({
      store: new PostgresOperationsHumanAuthenticationStore(database),
      passwordVerifier: new Argon2idOperationsPasswordVerifier(),
      sessionRepository: new PostgresOperationsSessionRepository(database),
    }),
  };
}
