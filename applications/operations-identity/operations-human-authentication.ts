import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { ApplicationError } from '../core/application-error.js';
import { createActorContext, type ActorContext } from '../core/actor-context.js';
import type { OperationsAuthContextProvider } from '../core/ports/operations-auth-context-provider.js';
import {
  createOperationsSession,
  createOperationsSessionId,
  type OperationsAccount,
  type OperationsAccountId,
  type OperationsHumanPrincipal,
  type OperationsHumanPrincipalId,
  type OperationsSession,
} from '../../modules/operations-identity/operations-identity-contract.js';
import type {
  EncodedPasswordVerifier,
  OperationsPasswordCredentialRecord,
} from './operations-credential-repositories.js';
import {
  createOperationsPrincipalSecurityEpoch,
  createOperationsSessionCredentialDigest,
  createOperationsSessionCredentialVersion,
  createOperationsSessionVersion,
  OperationsSessionNotAuthenticatedError,
  type OperationsSessionRepository,
  type OperationsSessionSnapshot,
} from './operations-session-repositories.js';
import {
  OPERATIONS_HUMAN_PERMISSIONS,
  type OperationsHumanPermission,
} from '../../modules/operations-identity/operations-identity-contract.js';

export { OPERATIONS_HUMAN_PERMISSIONS, type OperationsHumanPermission };
export type OperationsActivationHistory = 'never_activated' | 'previously_activated' | 'unknown';

export interface OperationsHumanAuthenticationSnapshot {
  /** Server-owned 0041 bootstrap provenance; absent/false grants no admin permissions. */
  readonly isInitialAdmin?: boolean;
  readonly principal: OperationsHumanPrincipal;
  readonly account: OperationsAccount;
  readonly credential: OperationsPasswordCredentialRecord;
  readonly principalActivationHistory: OperationsActivationHistory;
  readonly accountActivationHistory: OperationsActivationHistory;
}

export interface OperationsHumanAuthenticationStore {
  findSessionForLogout(digest: string): Promise<
    | {
        sessionId: OperationsSession['id'];
        principalId: OperationsHumanPrincipalId;
        accountId: OperationsAccountId;
        sessionVersion: number;
        status: string;
      }
    | undefined
  >;
  findByLoginIdentifier(
    loginIdentifier: string,
  ): Promise<OperationsHumanAuthenticationSnapshot | undefined>;
  findByIdentity(input: {
    readonly principalId: OperationsHumanPrincipalId;
    readonly accountId: OperationsAccountId;
  }): Promise<OperationsHumanAuthenticationSnapshot | undefined>;
}

export interface OperationsPasswordVerifier {
  hash(password: string): Promise<EncodedPasswordVerifier>;
  verify(password: string, verifier: EncodedPasswordVerifier): Promise<boolean>;
  verifyDummy(password: string): Promise<boolean>;
}

export interface OperationsHumanLoginResult {
  readonly credential: string;
  readonly principalId: OperationsHumanPrincipalId;
  readonly accountId: OperationsAccountId;
  readonly sessionId: OperationsSession['id'];
  readonly absoluteExpiresAt: Date;
  readonly permissions: readonly OperationsHumanPermission[];
}

export interface OperationsHumanAuthenticationRuntime extends OperationsAuthContextProvider {
  login(input: {
    readonly loginIdentifier: string;
    readonly password: string;
    readonly correlationId: string;
  }): Promise<OperationsHumanLoginResult>;
  logout(input: { readonly credential: string; readonly correlationId: string }): Promise<void>;
}

export class OperationsHumanAuthenticationError extends Error {
  public constructor() {
    super('Operations authentication could not be verified.');
    this.name = 'OperationsHumanAuthenticationError';
  }
}

const IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1000;
const ABSOLUTE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export function createOperationsHumanAuthenticationRuntime(dependencies: {
  readonly store: OperationsHumanAuthenticationStore;
  readonly passwordVerifier: OperationsPasswordVerifier;
  readonly sessionRepository: OperationsSessionRepository;
  readonly now?: () => Date;
  readonly randomCredential?: () => string;
  readonly sessionId?: () => string;
}): OperationsHumanAuthenticationRuntime {
  const now = dependencies.now ?? (() => new Date());
  const randomCredential =
    dependencies.randomCredential ?? (() => randomBytes(32).toString('base64url'));
  const sessionId = dependencies.sessionId ?? (() => randomUUID());

  return {
    async login(input) {
      let snapshot: OperationsHumanAuthenticationSnapshot | undefined;
      try {
        snapshot = await dependencies.store.findByLoginIdentifier(input.loginIdentifier);
      } catch {
        throw new ApplicationError({
          category: 'unavailable',
          code: 'operations_auth_unavailable',
          message: 'Operations authentication is temporarily unavailable.',
        });
      }

      const passwordMatches =
        snapshot === undefined
          ? await dependencies.passwordVerifier.verifyDummy(input.password)
          : await dependencies.passwordVerifier.verify(
              input.password,
              snapshot.credential.verifier,
            );
      if (snapshot === undefined || !passwordMatches || !eligible(snapshot)) {
        throw new OperationsHumanAuthenticationError();
      }

      const currentTime = now();
      const rawCredential = randomCredential();
      if (rawCredential.length < 32) throw new OperationsHumanAuthenticationError();
      const digest = createOperationsSessionCredentialDigest(
        createHash('sha256').update(rawCredential, 'utf8').digest('hex'),
      );
      const account = snapshot.account;
      const session = createOperationsSession({
        id: createOperationsSessionId(sessionId()),
        account,
        status: 'active',
        credentialVersion: snapshot.credential.metadata.version,
        principalSecurityEpoch: snapshot.principal.securityEpoch,
        createdAt: currentTime,
        lastActivityAt: currentTime,
        idleExpiresAt: new Date(currentTime.getTime() + IDLE_TIMEOUT_MS),
        absoluteExpiresAt: new Date(currentTime.getTime() + ABSOLUTE_TIMEOUT_MS),
      });
      const sessionSnapshot: OperationsSessionSnapshot = {
        ...session,
        credentialVersion: createOperationsSessionCredentialVersion(
          snapshot.credential.metadata.version,
        ),
        principalSecurityEpoch: createOperationsPrincipalSecurityEpoch(
          snapshot.principal.securityEpoch,
        ),
      };
      const stored = await dependencies.sessionRepository.createSession({
        session: sessionSnapshot,
        credentialDigest: digest,
        now: currentTime,
      });
      return {
        credential: rawCredential,
        principalId: snapshot.principal.id,
        accountId: snapshot.account.id,
        sessionId: stored.session.id,
        absoluteExpiresAt: stored.session.absoluteExpiresAt,
        permissions: snapshot.isInitialAdmin === true ? OPERATIONS_HUMAN_PERMISSIONS : [],
      };
    },

    async resolveActorContext(request): Promise<ActorContext> {
      const digest = credentialDigest(request.accessToken);
      const current = await dependencies.sessionRepository.findActiveSessionByCredentialDigest({
        credentialDigest: digest,
        now: now(),
      });
      const currentTime = now();
      const nextIdleExpiresAt = new Date(
        Math.min(
          current.session.absoluteExpiresAt.getTime(),
          currentTime.getTime() + IDLE_TIMEOUT_MS,
        ),
      );
      const touched = await dependencies.sessionRepository.validateAndTouchSession({
        credentialDigest: digest,
        now: currentTime,
        nextLastActivityAt: currentTime,
        nextIdleExpiresAt,
      });
      const snapshot = await dependencies.store.findByIdentity({
        principalId: touched.session.principalId,
        accountId: touched.session.accountId,
      });
      if (
        snapshot === undefined ||
        !eligible(snapshot) ||
        snapshot.credential.metadata.version !== touched.session.credentialVersion ||
        snapshot.principal.securityEpoch !== touched.session.principalSecurityEpoch
      ) {
        throw new OperationsSessionNotAuthenticatedError();
      }
      return createActorContext({
        actor: {
          kind: 'operations_human',
          principalId: touched.session.principalId,
          accountId: touched.session.accountId,
          sessionId: touched.session.id,
          permissions: snapshot.isInitialAdmin === true ? OPERATIONS_HUMAN_PERMISSIONS : [],
        },
        accountId: touched.session.accountId,
        correlationId: request.correlationId,
      });
    },

    async logout(input) {
      const digest = credentialDigest(input.credential);
      const record = await dependencies.store.findSessionForLogout(digest);
      // A successful authoritative lookup confirms absence/revocation. Infrastructure
      // failures propagate; an invalid parent/expired session is still revoked.
      if (record === undefined || record.status === 'revoked') return;
      await dependencies.sessionRepository.revokeSession({
        sessionId: record.sessionId,
        principalId: record.principalId,
        accountId: record.accountId,
        expectedSessionVersion: createOperationsSessionVersion(record.sessionVersion),
        revokedAt: now(),
      });
    },
  };
}

function credentialDigest(value: string) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/u.test(value)) {
    throw new OperationsHumanAuthenticationError();
  }
  return createOperationsSessionCredentialDigest(
    createHash('sha256').update(value, 'utf8').digest('hex'),
  );
}

function eligible(snapshot: OperationsHumanAuthenticationSnapshot): boolean {
  return (
    snapshot.principal.status === 'active' &&
    snapshot.account.status === 'active' &&
    snapshot.credential.metadata.status === 'active' &&
    snapshot.credential.metadata.accountId === snapshot.account.id &&
    snapshot.account.principalId === snapshot.principal.id &&
    snapshot.principalActivationHistory === 'previously_activated' &&
    snapshot.accountActivationHistory === 'previously_activated'
  );
}

/** Fixed first-operator allowlist, not a role-management or grant mechanism. */
export function requireOperationsHumanPermission(context: ActorContext, permission: string): void {
  if (context.actor.kind !== 'operations_human') {
    throw new ApplicationError({
      category: 'authentication',
      code: 'operations_login_required',
      message: 'Operations login required.',
    });
  }
  if (
    !OPERATIONS_HUMAN_PERMISSIONS.some((allowed) => allowed === permission) ||
    !context.actor.permissions.includes(permission)
  ) {
    throw new ApplicationError({
      category: 'authorization',
      code: 'operations_permission_denied',
      message: 'Operations permission denied.',
    });
  }
}
