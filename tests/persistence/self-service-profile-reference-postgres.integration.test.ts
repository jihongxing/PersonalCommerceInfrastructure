import { randomUUID } from 'node:crypto';

import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { PostgresAccountIdentityMembershipRepository } from '../../adapters/persistence/postgres/postgres-account-identity-membership-repository.js';
import { PostgresCanonicalCommerceProfileRepository } from '../../adapters/persistence/postgres/postgres-canonical-commerce-profile-repository.js';
import { PostgresCanonicalCommerceReferenceRepository } from '../../adapters/persistence/postgres/postgres-canonical-commerce-reference-repository.js';
import {
  createPostgresDatabase,
  type PostgresDatabaseConnection,
} from '../../adapters/persistence/postgres/postgres-database.js';
import { PostgresIdentityRepository } from '../../adapters/persistence/postgres/postgres-identity-repository.js';
import { PostgresUnitOfWork } from '../../adapters/persistence/postgres/postgres-unit-of-work.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';
import { createCurrentUserIdentityService } from '../../applications/account-identity-membership/current-user-identity-service.js';
import { createCanonicalCommerceProfileService } from '../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import {
  CsprngCommerceReferenceGenerator,
  type CommerceReferenceGenerator,
} from '../../applications/canonical-commerce-reference/commerce-reference-generator.js';
import { createPrivateCommerceProfileService } from '../../applications/private-commerce-profile/private-commerce-profile-service.js';
import type { UnitOfWork, UnitOfWorkScope } from '../../applications/core/ports/unit-of-work.js';
import type { CommerceReferenceRepository } from '../../modules/identity-infrastructure/commerce-reference-repository.js';
import {
  createCommerceProfileId,
  type CommerceReference,
} from '../../modules/identity-infrastructure/identity-contract.js';
import { createCommerceReference } from '../../modules/identity-infrastructure/commerce-reference-contract.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl === undefined ? describe.skip : describe;
const now = '2026-08-27T00:00:00.000Z';
let integrationConnection: PostgresDatabaseConnection;

describeWithDatabase('Self-service Profile + Commerce Reference PostgreSQL integration', () => {
  beforeAll(async () => {
    integrationConnection = createPostgresDatabase(databaseUrl as string);
    await migrate(integrationConnection.database, { migrationsFolder: 'database/migrations' });
  });

  beforeEach(async () => {
    await integrationConnection.database.execute(sql`truncate table identities cascade`);
  });

  afterAll(async () => {
    await integrationConnection.close();
  });

  it('persists a Profile and assigned C号 atomically, supports multiple Profiles, and retains archived references', async () => {
    const { service, profileRepository, referenceRepository, membershipService } = createService();
    await membershipService.createIdentityForAuthenticatedAccount(account('account-a'));

    const first = await service.createMyCommerceProfile(account('account-a'), { displayName: 'Studio A' });
    const second = await service.createMyCommerceProfile(account('account-a'), { displayName: 'Brand A' });

    expect(first.commerceReference).toHaveLength(18);
    expect(first.commerceReferenceDisplayValue).toMatch(/^[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}$/u);
    expect(second.commerceReference).not.toBe(first.commerceReference);
    await service.archiveMyCommerceProfile(account('account-a'), first.commerceProfileId);
    await expect(profileRepository.getById(createCommerceProfileId(first.commerceProfileId))).resolves.toMatchObject({
      lifecycle: 'ARCHIVED',
    });
    await expect(referenceRepository.getByProfileId(createCommerceProfileId(first.commerceProfileId))).resolves.toMatchObject({
      commerceReference: first.commerceReference,
      lifecycle: 'ASSIGNED',
    });
  });

  it('concurrently creates distinct Profiles with unique References', async () => {
    const first = createService();
    const second = createService();
    await first.membershipService.createIdentityForAuthenticatedAccount(account('account-a'));

    const results = await Promise.all([
      first.service.createMyCommerceProfile(account('account-a'), { displayName: 'One' }),
      second.service.createMyCommerceProfile(account('account-a'), { displayName: 'Two' }),
    ]);

    expect(new Set(results.map((result) => result.commerceProfileId))).toHaveLength(2);
    expect(new Set(results.map((result) => result.commerceReference))).toHaveLength(2);
    const rows = await integrationConnection.database.execute(sql`select commerce_reference from commerce_references`);
    expect(rows).toHaveLength(2);
  });

  it('retries a database uniqueness collision without leaving the losing Profile', async () => {
    const occupied = createService({ references: ['3C7M4Q9RDFHJKNTWVY'] });
    await occupied.membershipService.createIdentityForAuthenticatedAccount(account('account-a'));
    const existing = await occupied.service.createMyCommerceProfile(account('account-a'), {
      displayName: 'Existing',
    });

    const retrying = createService({
      references: ['3C7M4Q9RDFHJKNTWVY', '4C7M4Q9RDFHJKNTWVY'],
    });
    const created = await retrying.service.createMyCommerceProfile(account('account-a'), {
      displayName: 'Retried',
    });

    expect(created.commerceReference).toBe('4C7M4Q9RDFHJKNTWVY');
    expect(existing.commerceReference).toBe('3C7M4Q9RDFHJKNTWVY');
    const profiles = await connectionProfiles();
    const references = await connectionReferences();
    expect(profiles).toHaveLength(2);
    expect(references).toHaveLength(2);
  });

  it('rolls back when the generator fails before persistence', async () => {
    const { membershipService } = createService({
      generator: { generate: () => { throw new Error('CSPRNG failure.'); } },
    });
    await membershipService.createIdentityForAuthenticatedAccount(account('account-a'));
    const { service } = createService({
      generator: { generate: () => { throw new Error('CSPRNG failure.'); } },
    });

    await expect(service.createMyCommerceProfile(account('account-a'), { displayName: 'Failure' }))
      .rejects.toThrow('CSPRNG failure.');
    expect(await connectionProfiles()).toHaveLength(0);
    expect(await connectionReferences()).toHaveLength(0);
  });

  it('rolls back the Profile when Reference persistence fails', async () => {
    const { membershipService, currentUserIdentityService } = createService();
    await membershipService.createIdentityForAuthenticatedAccount(account('account-a'));
    const profileRepository = new PostgresCanonicalCommerceProfileRepository(integrationConnection.database);
    const service = createPrivateCommerceProfileService({
      currentUserIdentityService,
      commerceProfileService: createCanonicalCommerceProfileService({
        repository: profileRepository,
        idGenerator: { generate: () => createCommerceProfileId(randomUUID()) },
        clock: new FixedClock(now),
      }),
      commerceProfileIdGenerator: { generate: () => createCommerceProfileId(randomUUID()) },
      commerceReferenceGenerator: new CsprngCommerceReferenceGenerator(),
      clock: new FixedClock(now),
      unitOfWork: new FailingReferenceUnitOfWork(integrationConnection),
    });

    await expect(service.createMyCommerceProfile(account('account-a'), { displayName: 'Rollback' })).rejects.toThrow(
      'Reference persistence failed.',
    );
    const rows = await integrationConnection.database.execute(sql`select commerce_profile_id from commerce_profiles`);
    const references = await integrationConnection.database.execute(sql`select commerce_reference from commerce_references`);
    expect(rows).toHaveLength(0);
    expect(references).toHaveLength(0);
  });
});

function createService(options: {
  readonly references?: readonly string[];
  readonly generator?: CommerceReferenceGenerator;
} = {}) {
  const identityRepository = new PostgresIdentityRepository(integrationConnection.database);
  const membershipRepository = new PostgresAccountIdentityMembershipRepository(integrationConnection.database);
  const profileRepository = new PostgresCanonicalCommerceProfileRepository(integrationConnection.database);
  const referenceRepository = new PostgresCanonicalCommerceReferenceRepository(integrationConnection.database);
  const membershipService = createAccountIdentityMembershipService({
    membershipRepository,
    unitOfWork: new PostgresUnitOfWork(integrationConnection.database),
    identityIdGenerator: { generate: randomUUID },
    membershipIdGenerator: { generate: randomUUID },
    clock: new FixedClock(now),
  });
  const currentUserIdentityService = createCurrentUserIdentityService({
    identityRepository,
    membershipRepository,
  });
  const profileService = createCanonicalCommerceProfileService({
    repository: profileRepository,
    idGenerator: { generate: () => createCommerceProfileId(randomUUID()) },
    clock: new FixedClock(now),
  });
  return {
    membershipService,
    currentUserIdentityService,
    profileRepository,
    referenceRepository,
    service: createPrivateCommerceProfileService({
      currentUserIdentityService,
      commerceProfileService: profileService,
      commerceProfileIdGenerator: { generate: () => createCommerceProfileId(randomUUID()) },
      commerceReferenceGenerator: options.generator ?? createReferenceGenerator(options.references),
      clock: new FixedClock(now),
      unitOfWork: new PostgresUnitOfWork(integrationConnection.database),
    }),
  };
}

function createReferenceGenerator(references: readonly string[] | undefined): CommerceReferenceGenerator {
  if (references === undefined) {
    return new CsprngCommerceReferenceGenerator();
  }
  let referenceIndex = 0;
  return {
    generate: (): CommerceReference =>
      createCommerceReference(references[referenceIndex++] ?? references[references.length - 1]!),
  };
}

async function connectionProfiles() {
  return integrationConnection.database.execute(sql`select commerce_profile_id from commerce_profiles`);
}

async function connectionReferences() {
  return integrationConnection.database.execute(sql`select commerce_reference from commerce_references`);
}

function account(accountId: string) {
  return { accountId, correlationId: `correlation-${accountId}` };
}

class FailingReferenceUnitOfWork implements UnitOfWork {
  public constructor(private readonly connection: PostgresDatabaseConnection) {}

  public execute<Result>(operation: (scope: UnitOfWorkScope) => Promise<Result>): Promise<Result> {
    return this.connection.database.transaction((transaction) =>
      operation({
        productEventStore: { append: () => Promise.resolve(), list: () => Promise.resolve([]) },
        commerceProfileRepository: new PostgresCanonicalCommerceProfileRepository(transaction),
        commerceReferenceRepository: new FailingReferenceRepository(),
      }),
    );
  }
}

class FailingReferenceRepository implements CommerceReferenceRepository {
  public assign(): Promise<void> {
    return Promise.reject(new Error('Reference persistence failed.'));
  }

  public getByReference() { return Promise.resolve(undefined); }
  public getByProfileId() { return Promise.resolve(undefined); }
  public exists() { return Promise.resolve(false); }
  public reserve() { return Promise.resolve(); }
}
