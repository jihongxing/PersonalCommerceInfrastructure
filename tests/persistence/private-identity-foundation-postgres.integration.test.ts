import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { PostgresCanonicalCommerceProfileRepository } from '../../adapters/persistence/postgres/postgres-canonical-commerce-profile-repository.js';
import { PostgresCanonicalCommerceReferenceRepository } from '../../adapters/persistence/postgres/postgres-canonical-commerce-reference-repository.js';
import { PostgresCommerceRelationshipRepository } from '../../adapters/persistence/postgres/postgres-commerce-relationship-repository.js';
import {
  createPostgresDatabase,
  type PostgresDatabaseConnection,
} from '../../adapters/persistence/postgres/postgres-database.js';
import { PostgresExternalPlatformAccountRepository } from '../../adapters/persistence/postgres/postgres-external-platform-account-repository.js';
import { PostgresIdentityFoundationTransaction } from '../../adapters/persistence/postgres/postgres-identity-foundation-transaction.js';
import { PostgresInternalIdentityRepository } from '../../adapters/persistence/postgres/postgres-internal-identity-repository.js';
import { createCanonicalCommerceProfileService } from '../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import { UuidCommerceProfileIdGenerator } from '../../applications/canonical-commerce-profile/uuid-commerce-profile-id-generator.js';
import { createCanonicalCommerceReferenceService } from '../../applications/canonical-commerce-reference/canonical-commerce-reference-service.js';
import { createCommerceRelationshipService } from '../../applications/commerce-relationship/commerce-relationship-service.js';
import { UuidCommerceRelationshipIdGenerator } from '../../applications/commerce-relationship/uuid-commerce-relationship-id-generator.js';
import { createExternalPlatformAccountService } from '../../applications/external-platform-account/external-platform-account-service.js';
import { UuidExternalPlatformAccountIdGenerator } from '../../applications/external-platform-account/uuid-external-platform-account-id-generator.js';
import { createInternalIdentityService } from '../../applications/internal-identity/internal-identity-service.js';
import { UuidInternalIdentityIdGenerator } from '../../applications/internal-identity/uuid-internal-identity-id-generator.js';
import { createCommerceReference } from '../../modules/identity-infrastructure/commerce-reference-contract.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl === undefined ? describe.skip : describe;
const clock = new FixedClock('2026-08-26T10:00:00.000Z');

describeWithDatabase('Private Identity Foundation PostgreSQL integration', () => {
  let connection: PostgresDatabaseConnection;

  beforeAll(async () => {
    connection = createPostgresDatabase(databaseUrl as string);
    await migrate(connection.database, {
      migrationsFolder: 'database/migrations',
    });
  });

  beforeEach(async () => {
    await connection.database.execute(
      sql`truncate table
        commerce_relationships,
        commerce_references,
        external_platform_accounts,
        legacy_subject_mappings,
        commerce_profiles,
        account_identity_memberships,
        identities`,
    );
  });

  afterAll(async () => {
    await connection.close();
  });

  it('orchestrates the complete durable fact graph through repository ports', async () => {
    const fixture = createFixture(connection);
    const identity = await fixture.identities.create();
    const profile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'PostgreSQL Private Creator' },
    });
    const reference = createCommerceReference('3479ACDEFHJKMNPQRT');
    const assigned = await fixture.references.assign({
      commerceReference: reference,
      commerceProfileId: profile.commerceProfileId,
    });
    const account = await fixture.accounts.register({
      platform: 'instagram',
      platformAccountId: 'postgres-account-a',
    });
    const relationship = await fixture.relationships.create({
      externalPlatformAccountId: account.externalPlatformAccountId,
      commerceProfileId: profile.commerceProfileId,
      role: 'OWNER',
      effectiveAt: clock.now(),
    });
    const verified = await fixture.relationships.changeLifecycle(
      relationship.commerceRelationshipId,
      'VERIFIED',
    );
    const active = await fixture.relationships.changeLifecycle(
      verified.commerceRelationshipId,
      'ACTIVE',
    );

    await expectRehydratedIdentity(fixture, identity);
    await expectRehydratedProfile(fixture, profile);
    expect(assigned).toMatchObject({
      commerceReference: reference,
      commerceProfileId: profile.commerceProfileId,
      lifecycle: 'ASSIGNED',
    });
    await expectRehydratedAccount(fixture, account);
    await expectRehydratedRelationship(fixture, active);
  });

  it('rolls back a cross-aggregate reference assignment when its transaction fails', async () => {
    const fixture = createFixture(connection);
    const identity = await fixture.identities.create();
    const profile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Rollback Profile' },
    });
    const reference = createCommerceReference('VWXY3479ACDEFHJKMN');

    await expect(
      fixture.transaction.execute(async (scope) => {
        await scope.commerceReferenceRepository.assign({
          commerceReference: reference,
          commerceProfileId: profile.commerceProfileId,
          assignedAt: clock.now(),
        });
        throw new Error('Simulated private runtime transaction failure.');
      }),
    ).rejects.toThrow('Simulated private runtime transaction failure.');

    await expect(
      new PostgresCanonicalCommerceReferenceRepository(connection.database).getByReference(
        reference,
      ),
    ).resolves.toBeUndefined();
  });

  it('enforces foreign keys, uniqueness, checks, and the active relationship index in PostgreSQL', async () => {
    const fixture = createFixture(connection);
    const identity = await fixture.identities.create();
    const profileA = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Constraint Profile A' },
    });
    const profileB = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Constraint Profile B' },
    });
    const reference = createCommerceReference('7HJ7KMPQRTVWXY3479');
    await fixture.references.assign({
      commerceReference: reference,
      commerceProfileId: profileA.commerceProfileId,
    });
    const account = await fixture.accounts.register({
      platform: 'instagram',
      platformAccountId: 'constraint-account-a',
    });
    const relationship = await createActiveRelationship(fixture, account.externalPlatformAccountId, profileA.commerceProfileId);

    await expect(
      fixture.profiles.create({
        owningIdentityId: 'identity_unknown' as typeof identity.internalIdentityId,
        presentation: { displayName: 'Unknown Owner' },
      }),
    ).rejects.toMatchObject({ cause: { code: '23503' } });
    await expect(
      fixture.references.assign({
        commerceReference: createCommerceReference('PQRTVWXY3479ACDEFH'),
        commerceProfileId: 'profile_unknown' as typeof profileA.commerceProfileId,
      }),
    ).rejects.toBeInstanceOf(Error);
    await expect(
      connection.database.execute(
        sql`insert into commerce_references (
          commerce_reference,
          commerce_profile_id,
          lifecycle,
          assigned_at,
          created_at,
          updated_at
        ) values (
          'PQRTVWXY3479ACDEFH',
          'profile_unknown',
          'ASSIGNED',
          ${clock.now()},
          ${clock.now()},
          ${clock.now()}
        )`,
      ),
    ).rejects.toMatchObject({ cause: { code: '23503' } });
    await expect(
      fixture.references.assign({
        commerceReference: reference,
        commerceProfileId: profileB.commerceProfileId,
      }),
    ).rejects.toBeInstanceOf(Error);
    await expect(
      fixture.references.assign({
        commerceReference: createCommerceReference('JKMNPQRTVWXY3479AC'),
        commerceProfileId: profileA.commerceProfileId,
      }),
    ).rejects.toBeInstanceOf(Error);
    await expect(
      fixture.accounts.register({
        platform: 'instagram',
        platformAccountId: 'constraint-account-a',
      }),
    ).rejects.toMatchObject({
      name: 'ExternalPlatformAccountAlreadyExistsError',
      platform: 'instagram',
      platformAccountId: 'constraint-account-a',
    });

    await expect(
      connection.database.execute(
        sql`insert into commerce_relationships (
          commerce_relationship_id,
          external_platform_account_id,
          commerce_profile_id,
          role,
          lifecycle,
          effective_at,
          created_at,
          updated_at
        ) values (
          'relationship_unknown_account',
          'account_unknown',
          ${profileA.commerceProfileId},
          'OWNER',
          'PROPOSED',
          ${clock.now()},
          ${clock.now()},
          ${clock.now()}
        )`,
      ),
    ).rejects.toMatchObject({ cause: { code: '23503' } });
    await expect(
      connection.database.execute(
        sql`insert into commerce_relationships (
          commerce_relationship_id,
          external_platform_account_id,
          commerce_profile_id,
          role,
          lifecycle,
          effective_at,
          created_at,
          updated_at
        ) values (
          'relationship_unknown_profile',
          ${account.externalPlatformAccountId},
          'profile_unknown',
          'OWNER',
          'PROPOSED',
          ${clock.now()},
          ${clock.now()},
          ${clock.now()}
        )`,
      ),
    ).rejects.toMatchObject({ cause: { code: '23503' } });
    await expect(
      connection.database.execute(
        sql`insert into commerce_relationships (
          commerce_relationship_id,
          external_platform_account_id,
          commerce_profile_id,
          role,
          lifecycle,
          effective_at,
          created_at,
          updated_at
        ) values (
          'relationship_invalid_role',
          ${account.externalPlatformAccountId},
          ${profileA.commerceProfileId},
          'INVALID_ROLE',
          'PROPOSED',
          ${clock.now()},
          ${clock.now()},
          ${clock.now()}
        )`,
      ),
    ).rejects.toMatchObject({ cause: { code: '23514' } });

    const proposed = await fixture.relationships.create({
      externalPlatformAccountId: account.externalPlatformAccountId,
      commerceProfileId: profileB.commerceProfileId,
      role: 'MANAGER',
      effectiveAt: clock.now(),
    });
    const verified = await fixture.relationships.changeLifecycle(
      proposed.commerceRelationshipId,
      'VERIFIED',
    );
    await expect(
      fixture.relationships.changeLifecycle(verified.commerceRelationshipId, 'ACTIVE'),
    ).rejects.toBeInstanceOf(Error);
    await expectRehydratedRelationship(fixture, relationship);
  });

  it('preserves permanent references through profile archival and rehydrates each durable fact', async () => {
    const fixture = createFixture(connection);
    const identity = await fixture.identities.create();
    const profile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Permanent Reference Profile' },
    });
    const reference = createCommerceReference('ACDEFHJKMNPQRTVWXY');
    const assigned = await fixture.references.assign({
      commerceReference: reference,
      commerceProfileId: profile.commerceProfileId,
    });
    const account = await fixture.accounts.register({
      platform: 'youtube',
      platformAccountId: 'namespace-account-a',
    });
    const relationship = await createActiveRelationship(
      fixture,
      account.externalPlatformAccountId,
      profile.commerceProfileId,
    );

    await fixture.referenceRepository.reserve({
      commerceReference: reference,
      updatedAt: clock.now(),
    });
    const archived = await fixture.profiles.changeLifecycle(profile.commerceProfileId, 'ARCHIVED');

    await expectRehydratedIdentity(fixture, identity);
    await expectRehydratedProfile(fixture, archived);
    await expect(fixture.referenceRepository.getByReference(reference)).resolves.toMatchObject({
      ...assigned,
      lifecycle: 'PERMANENTLY_RESERVED',
    });
    await expectRehydratedAccount(fixture, account);
    await expectRehydratedRelationship(fixture, relationship);
    await expect(
      fixture.references.assign({
        commerceReference: reference,
        commerceProfileId: profile.commerceProfileId,
      }),
    ).rejects.toBeInstanceOf(Error);

    await fixture.accounts.register({
      platform: 'instagram',
      platformAccountId: 'namespace-account-a',
    });
    await fixture.accounts.register({
      platform: 'instagram',
      platformAccountId: 'namespace-account-b',
    });
  });

  it('historicalizes and activates a replacement in one PostgreSQL transaction without rewriting history', async () => {
    const fixture = createFixture(connection);
    const identity = await fixture.identities.create();
    const oldProfile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Historical Profile' },
    });
    const replacementProfile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Replacement Profile' },
    });
    const account = await fixture.accounts.register({
      platform: 'instagram',
      platformAccountId: 'replacement-account',
    });
    const oldActive = await createActiveRelationship(
      fixture,
      account.externalPlatformAccountId,
      oldProfile.commerceProfileId,
    );
    const suspended = await fixture.relationships.changeLifecycle(
      oldActive.commerceRelationshipId,
      'SUSPENDED',
    );
    const replacement = await fixture.relationships.create({
      externalPlatformAccountId: account.externalPlatformAccountId,
      commerceProfileId: replacementProfile.commerceProfileId,
      role: 'DELEGATED_MANAGER',
      effectiveAt: clock.now(),
    });
    const verifiedReplacement = await fixture.relationships.changeLifecycle(
      replacement.commerceRelationshipId,
      'VERIFIED',
    );

    const activeReplacement = await fixture.relationships.replaceSuspendedWithVerified({
      suspendedRelationshipId: suspended.commerceRelationshipId,
      verifiedRelationshipId: verifiedReplacement.commerceRelationshipId,
    });
    const historical = await fixture.relationships.get(suspended.commerceRelationshipId);

    expect(activeReplacement.lifecycle).toBe('ACTIVE');
    expect(historical).toMatchObject({
      commerceRelationshipId: suspended.commerceRelationshipId,
      externalPlatformAccountId: suspended.externalPlatformAccountId,
      commerceProfileId: suspended.commerceProfileId,
      role: suspended.role,
      effectiveAt: suspended.effectiveAt,
      createdAt: suspended.createdAt,
      lifecycle: 'HISTORICAL',
    });
    await expectRehydratedRelationship(fixture, activeReplacement);
  });

  it('rolls back a failed relationship replacement transaction and leaves the old relationship suspended', async () => {
    const fixture = createFixture(connection);
    const identity = await fixture.identities.create();
    const profile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Replacement Rollback Profile' },
    });
    const account = await fixture.accounts.register({
      platform: 'instagram',
      platformAccountId: 'replacement-rollback-account',
    });
    const active = await createActiveRelationship(
      fixture,
      account.externalPlatformAccountId,
      profile.commerceProfileId,
    );
    const suspended = await fixture.relationships.changeLifecycle(
      active.commerceRelationshipId,
      'SUSPENDED',
    );

    await expect(
      fixture.transaction.execute(async (scope) => {
        await scope.commerceRelationshipRepository.updateLifecycle({
          relationshipId: suspended.commerceRelationshipId,
          expectedLifecycle: 'SUSPENDED',
          nextLifecycle: 'HISTORICAL',
          updatedAt: clock.now(),
        });
        await scope.commerceRelationshipRepository.create(suspended);
      }),
    ).rejects.toMatchObject({
      name: 'ActiveCommerceRelationshipConflictError',
    });

    await expectRehydratedRelationship(fixture, suspended);
  });

  it('uses conditional lifecycle writes to prevent lost updates for every mutable durable fact', async () => {
    const fixture = createFixture(connection);
    const identity = await fixture.identities.create();
    const profile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Conditional Write Profile' },
    });
    const account = await fixture.accounts.register({
      platform: 'instagram',
      platformAccountId: 'conditional-write-account',
    });
    const relationship = await createActiveRelationship(
      fixture,
      account.externalPlatformAccountId,
      profile.commerceProfileId,
    );

    await expectExactlyOneLifecycleWrite(
      [
        fixture.identityRepository.updateLifecycle({
          identityId: identity.internalIdentityId,
          expectedLifecycle: 'ACTIVE',
          nextLifecycle: 'SUSPENDED',
          updatedAt: clock.now(),
        }),
        fixture.identityRepository.updateLifecycle({
          identityId: identity.internalIdentityId,
          expectedLifecycle: 'ACTIVE',
          nextLifecycle: 'ARCHIVED',
          updatedAt: clock.now(),
        }),
      ],
      'InternalIdentityConcurrentUpdateError',
    );
    await expectExactlyOneLifecycleWrite(
      [
        fixture.profileRepository.updateLifecycle({
          profileId: profile.commerceProfileId,
          expectedLifecycle: 'ACTIVE',
          expectedUpdatedAt: profile.updatedAt,
          nextLifecycle: 'SUSPENDED',
          updatedAt: clock.now(),
        }),
        fixture.profileRepository.updateLifecycle({
          profileId: profile.commerceProfileId,
          expectedLifecycle: 'ACTIVE',
          expectedUpdatedAt: profile.updatedAt,
          nextLifecycle: 'ARCHIVED',
          updatedAt: clock.now(),
        }),
      ],
      'CommerceProfileLifecycleConflictError',
    );
    await expectExactlyOneLifecycleWrite(
      [
        fixture.accountRepository.updateLifecycle({
          accountId: account.externalPlatformAccountId,
          expectedLifecycle: 'ACTIVE',
          nextLifecycle: 'SUSPENDED',
          updatedAt: clock.now(),
        }),
        fixture.accountRepository.updateLifecycle({
          accountId: account.externalPlatformAccountId,
          expectedLifecycle: 'ACTIVE',
          nextLifecycle: 'REVOKED',
          updatedAt: clock.now(),
        }),
      ],
      'ExternalPlatformAccountLifecycleConflictError',
    );
    await expectExactlyOneLifecycleWrite(
      [
        fixture.relationshipRepository.updateLifecycle({
          relationshipId: relationship.commerceRelationshipId,
          expectedLifecycle: 'ACTIVE',
          nextLifecycle: 'SUSPENDED',
          updatedAt: clock.now(),
        }),
        fixture.relationshipRepository.updateLifecycle({
          relationshipId: relationship.commerceRelationshipId,
          expectedLifecycle: 'ACTIVE',
          nextLifecycle: 'REVOKED',
          updatedAt: clock.now(),
        }),
      ],
      'CommerceRelationshipLifecycleConflictError',
    );
  });
});

function createFixture(connection: PostgresDatabaseConnection) {
  const identityRepository = new PostgresInternalIdentityRepository(connection.database);
  const profileRepository = new PostgresCanonicalCommerceProfileRepository(connection.database);
  const referenceRepository = new PostgresCanonicalCommerceReferenceRepository(connection.database);
  const accountRepository = new PostgresExternalPlatformAccountRepository(connection.database);
  const relationshipRepository = new PostgresCommerceRelationshipRepository(connection.database);
  const transaction = new PostgresIdentityFoundationTransaction(connection.database);

  return {
    transaction,
    identityRepository,
    profileRepository,
    referenceRepository,
    accountRepository,
    relationshipRepository,
    identities: createInternalIdentityService({
      repository: identityRepository,
      idGenerator: new UuidInternalIdentityIdGenerator(),
      clock,
    }),
    profiles: createCanonicalCommerceProfileService({
      repository: profileRepository,
      idGenerator: new UuidCommerceProfileIdGenerator(),
      clock,
    }),
    references: createCanonicalCommerceReferenceService({
      commerceProfileRepository: profileRepository,
      commerceReferenceRepository: referenceRepository,
      transaction,
      clock,
    }),
    accounts: createExternalPlatformAccountService({
      repository: accountRepository,
      idGenerator: new UuidExternalPlatformAccountIdGenerator(),
      clock,
    }),
    relationships: createCommerceRelationshipService({
      commerceRelationshipRepository: relationshipRepository,
      commerceProfileRepository: profileRepository,
      externalPlatformAccountRepository: accountRepository,
      transaction,
      idGenerator: new UuidCommerceRelationshipIdGenerator(),
      clock,
    }),
  };
}

async function createActiveRelationship(
  fixture: ReturnType<typeof createFixture>,
  externalPlatformAccountId: Parameters<ReturnType<typeof createFixture>['relationships']['create']>[0]['externalPlatformAccountId'],
  commerceProfileId: Parameters<ReturnType<typeof createFixture>['relationships']['create']>[0]['commerceProfileId'],
) {
  const proposed = await fixture.relationships.create({
    externalPlatformAccountId,
    commerceProfileId,
    role: 'OWNER',
    effectiveAt: clock.now(),
  });
  const verified = await fixture.relationships.changeLifecycle(
    proposed.commerceRelationshipId,
    'VERIFIED',
  );
  return fixture.relationships.changeLifecycle(verified.commerceRelationshipId, 'ACTIVE');
}

async function expectExactlyOneLifecycleWrite(
  writes: readonly Promise<void>[],
  expectedErrorName: string,
): Promise<void> {
  const results = await Promise.allSettled(writes);
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  const rejected = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );
  expect(rejected).toHaveLength(1);
  expect(rejected[0]?.reason).toMatchObject({ name: expectedErrorName });
}

async function expectRehydratedIdentity(
  fixture: ReturnType<typeof createFixture>,
  expected: Awaited<ReturnType<ReturnType<typeof createFixture>['identities']['create']>>,
): Promise<void> {
  const actual = await fixture.identities.get(expected.internalIdentityId);
  expect(actual).toMatchObject({
    internalIdentityId: expected.internalIdentityId,
    lifecycle: expected.lifecycle,
  });
  expectSameInstant(actual.createdAt, expected.createdAt);
  expectSameInstant(actual.updatedAt, expected.updatedAt);
}

async function expectRehydratedProfile(
  fixture: ReturnType<typeof createFixture>,
  expected: Awaited<ReturnType<ReturnType<typeof createFixture>['profiles']['create']>>,
): Promise<void> {
  const actual = await fixture.profiles.get(expected.commerceProfileId);
  expect(actual).toMatchObject({
    commerceProfileId: expected.commerceProfileId,
    owningIdentityId: expected.owningIdentityId,
    lifecycle: expected.lifecycle,
    presentation: expected.presentation,
  });
  expectSameInstant(actual.createdAt, expected.createdAt);
  expectSameInstant(actual.updatedAt, expected.updatedAt);
}

async function expectRehydratedAccount(
  fixture: ReturnType<typeof createFixture>,
  expected: Awaited<ReturnType<ReturnType<typeof createFixture>['accounts']['register']>>,
): Promise<void> {
  const actual = await fixture.accounts.get(expected.externalPlatformAccountId);
  expect(actual).toMatchObject({
    externalPlatformAccountId: expected.externalPlatformAccountId,
    platform: expected.platform,
    platformAccountId: expected.platformAccountId,
    lifecycle: expected.lifecycle,
  });
  expectSameInstant(actual.createdAt, expected.createdAt);
  expectSameInstant(actual.updatedAt, expected.updatedAt);
}

async function expectRehydratedRelationship(
  fixture: ReturnType<typeof createFixture>,
  expected: Awaited<ReturnType<ReturnType<typeof createFixture>['relationships']['create']>>,
): Promise<void> {
  const actual = await fixture.relationships.get(expected.commerceRelationshipId);
  expect(actual).toMatchObject({
    commerceRelationshipId: expected.commerceRelationshipId,
    externalPlatformAccountId: expected.externalPlatformAccountId,
    commerceProfileId: expected.commerceProfileId,
    role: expected.role,
    lifecycle: expected.lifecycle,
  });
  expectSameInstant(actual.effectiveAt, expected.effectiveAt);
  expectSameInstant(actual.createdAt, expected.createdAt);
  expectSameInstant(actual.updatedAt, expected.updatedAt);
}

function expectSameInstant(actual: string, expected: string): void {
  expect(new Date(actual).toISOString()).toBe(new Date(expected).toISOString());
}
