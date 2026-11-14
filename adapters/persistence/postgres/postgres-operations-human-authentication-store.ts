import { sql } from 'drizzle-orm';

import {
  createOperationsSessionId,
  createOperationsAccount,
  createOperationsAccountId,
  createOperationsCredentialMetadata,
  createOperationsCredentialId,
  createOperationsHumanPrincipal,
  createOperationsHumanPrincipalId,
  normalizeOperationsLoginIdentifier,
} from '../../../modules/operations-identity/operations-identity-contract.js';
import {
  createEncodedPasswordVerifier,
  type OperationsPasswordCredentialRecord,
} from '../../../applications/operations-identity/operations-credential-repositories.js';
import type {
  OperationsActivationHistory,
  OperationsHumanAuthenticationSnapshot,
  OperationsHumanAuthenticationStore,
} from '../../../applications/operations-identity/operations-human-authentication.js';
import type { ProductDatabase } from './postgres-database.js';

interface AuthenticationRow extends Record<string, unknown> {
  principal_id: string;
  principal_status: string;
  principal_security_epoch: number;
  principal_created_at: string;
  principal_updated_at: string;
  account_id: string;
  account_principal_id: string;
  login_identifier_normalized: string;
  account_status: string;
  account_created_at: string;
  account_updated_at: string;
  credential_id: string;
  credential_account_id: string;
  credential_kind: string;
  credential_status: string;
  verifier: string;
  credential_version: number;
  credential_created_at: string;
  revoked_at: string | null;
  principal_history: string;
  account_history: string;
}

export class PostgresOperationsHumanAuthenticationStore implements OperationsHumanAuthenticationStore {
  public constructor(private readonly database: ProductDatabase) {}

  public async findSessionForLogout(digest: string) {
    const rows = await this.database.execute<{
      session_id: string;
      principal_id: string;
      account_id: string;
      session_version: number;
      status: string;
    }>(sql`SELECT session_id, principal_id, account_id, session_version, status
      FROM public.operations_sessions WHERE credential_digest = ${Buffer.from(digest, 'hex')}`);
    const row = rows[0];
    return row === undefined
      ? undefined
      : {
          sessionId: createOperationsSessionId(row.session_id),
          principalId: createOperationsHumanPrincipalId(row.principal_id),
          accountId: createOperationsAccountId(row.account_id),
          sessionVersion: row.session_version,
          status: row.status,
        };
  }

  public async findByLoginIdentifier(
    loginIdentifier: string,
  ): Promise<OperationsHumanAuthenticationSnapshot | undefined> {
    const rows = await this.database.execute<AuthenticationRow>(
      query(normalizeOperationsLoginIdentifier(loginIdentifier)),
    );
    return rows[0] === undefined ? undefined : toSnapshot(rows[0]);
  }

  public async findByIdentity(input: {
    readonly principalId: string;
    readonly accountId: string;
  }): Promise<OperationsHumanAuthenticationSnapshot | undefined> {
    const rows = await this.database.execute<AuthenticationRow>(query(undefined, input));
    return rows[0] === undefined ? undefined : toSnapshot(rows[0]);
  }
}

function query(loginIdentifier?: string, identity?: { principalId: string; accountId: string }) {
  return sql`
    SELECT
      p.principal_id,
      p.status AS principal_status,
      p.security_epoch AS principal_security_epoch,
      p.created_at AS principal_created_at,
      p.updated_at AS principal_updated_at,
      a.account_id,
      a.principal_id AS account_principal_id,
      a.login_identifier_normalized,
      a.status AS account_status,
      a.created_at AS account_created_at,
      a.updated_at AS account_updated_at,
      c.credential_id,
      c.account_id AS credential_account_id,
      c.kind AS credential_kind,
      c.status AS credential_status,
      c.verifier,
      c.version AS credential_version,
      c.created_at AS credential_created_at,
      c.revoked_at,
      ph.activation_history AS principal_history,
      ah.activation_history AS account_history
    FROM operations_human_principals p
    JOIN operations_accounts a ON a.principal_id = p.principal_id
    JOIN operations_credentials c ON c.account_id = a.account_id
      AND c.kind = 'password' AND c.status = 'active'
    JOIN operations_human_principal_activation_histories ph ON ph.principal_id = p.principal_id
    JOIN operations_account_activation_histories ah ON ah.account_id = a.account_id
    WHERE ${
      loginIdentifier === undefined
        ? sql`p.principal_id = ${identity?.principalId} AND a.account_id = ${identity?.accountId}`
        : sql`a.login_identifier_normalized = ${loginIdentifier}`
    }
    LIMIT 1
  `;
}

function toSnapshot(row: AuthenticationRow): OperationsHumanAuthenticationSnapshot {
  const principal = createOperationsHumanPrincipal({
    id: createOperationsHumanPrincipalId(row.principal_id),
    status: row.principal_status as 'pending' | 'active' | 'suspended' | 'disabled' | 'tombstoned',
    securityEpoch: row.principal_security_epoch,
    createdAt: new Date(row.principal_created_at),
    updatedAt: new Date(row.principal_updated_at),
  });
  const account = createOperationsAccount({
    id: createOperationsAccountId(row.account_id),
    principalId: createOperationsHumanPrincipalId(row.account_principal_id),
    loginIdentifierNormalized: row.login_identifier_normalized,
    status: row.account_status as 'invited' | 'active' | 'locked' | 'disabled' | 'revoked',
    createdAt: new Date(row.account_created_at),
    updatedAt: new Date(row.account_updated_at),
  });
  const credential: OperationsPasswordCredentialRecord = {
    metadata: createOperationsCredentialMetadata({
      id: createOperationsCredentialId(row.credential_id),
      accountId: createOperationsAccountId(row.credential_account_id),
      kind: 'password',
      status: row.credential_status as 'active' | 'revoked',
      version: row.credential_version,
      createdAt: new Date(row.credential_created_at),
      ...(row.revoked_at === null ? {} : { revokedAt: new Date(row.revoked_at) }),
    }),
    verifier: createEncodedPasswordVerifier(row.verifier),
  };
  return {
    principal,
    account,
    credential,
    principalActivationHistory: row.principal_history as OperationsActivationHistory,
    accountActivationHistory: row.account_history as OperationsActivationHistory,
  };
}
