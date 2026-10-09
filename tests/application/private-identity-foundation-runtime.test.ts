import { describe, expect, it } from 'vitest';

import { InMemoryCanonicalCommerceProfileRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-profile-repository.js';
import { InMemoryCanonicalCommerceReferenceRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-reference-repository.js';
import { InMemoryCommerceRelationshipRepository } from '../../adapters/in-memory/in-memory-commerce-relationship-repository.js';
import { InMemoryExternalPlatformAccountRepository } from '../../adapters/in-memory/in-memory-external-platform-account-repository.js';
import { InMemoryIdentityFoundationTransaction } from '../../adapters/in-memory/in-memory-identity-foundation-transaction.js';
import { InMemoryInternalIdentityRepository } from '../../adapters/in-memory/in-memory-internal-identity-repository.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { createCanonicalCommerceProfileService } from '../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import { createCanonicalCommerceReferenceService } from '../../applications/canonical-commerce-reference/canonical-commerce-reference-service.js';
import {
  createCommerceRelationshipService,
  type CommerceRelationshipService,
} from '../../applications/commerce-relationship/commerce-relationship-service.js';
import { createExternalPlatformAccountService } from '../../applications/external-platform-account/external-platform-account-service.js';
import type {
  IdentityFoundationTransaction,
  IdentityFoundationTransactionScope,
} from '../../applications/identity-foundation/identity-foundation-transaction.js';
import { createInternalIdentityService } from '../../applications/internal-identity/internal-identity-service.js';
import {
  createCommerceProfileId,
  createInternalIdentityId,
  type CommerceProfileId,
} from '../../modules/identity-infrastructure/identity-contract.js';
import { createCommerceReference } from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import type {
  CommerceRelationshipId,
  CommerceRelationshipLifecycle,
  ExternalPlatformAccountId,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import type { CommerceRelationshipRepository } from '../../modules/identity-infrastructure/commerce-relationship-repository.js';

const clock = new FixedClock('2026-08-26T10:00:00.000Z');
const reference = createCommerceReference('3479ACDEFHJKMNPQRT');

describe('Private Identity Foundation Application Runtime', () => {
  it('orchestrates Identity, Profile, supplied Reference, Account, and Relationship facts', async () => {
    const fixture = createFixture();
    const identity = await fixture.identities.create();
    const profile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Private Creator' },
    });
    const assigned = await fixture.references.assign({
      commerceReference: reference,
      commerceProfileId: profile.commerceProfileId,
    });
    const account = await fixture.accounts.register({
      platform: 'instagram',
      platformAccountId: 'account-a',
    });
    const relationship = await fixture.relationships.create({
      externalPlatformAccountId: account.externalPlatformAccountId,
      commerceProfileId: profile.commerceProfileId,
      role: 'OWNER',
      effectiveAt: '2026-08-26T10:00:00.000Z',
    });

    const verified = await fixture.relationships.changeLifecycle(
      relationship.commerceRelationshipId,
      'VERIFIED',
    );
    const active = await fixture.relationships.changeLifecycle(
      verified.commerceRelationshipId,
      'ACTIVE',
    );

    await expect(fixture.identities.get(identity.internalIdentityId)).resolves.toEqual(identity);
    await expect(fixture.profiles.get(profile.commerceProfileId)).resolves.toEqual(profile);
    await expect(
      fixture.profiles.listOwnedByIdentity(identity.internalIdentityId),
    ).resolves.toEqual([profile]);
    expect(assigned).toMatchObject({
      commerceReference: reference,
      commerceProfileId: profile.commerceProfileId,
      lifecycle: 'ASSIGNED',
    });
    await expect(fixture.accounts.get(account.externalPlatformAccountId)).resolves.toEqual(account);
    await expect(
      fixture.relationships.getActiveForAccount(account.externalPlatformAccountId),
    ).resolves.toEqual(active);
    await expect(fixture.relationships.listForProfile(profile.commerceProfileId)).resolves.toEqual([
      active,
    ]);
  });

  it('uses existing services for allowed lifecycle changes and fails closed for invalid states', async () => {
    const fixture = createFixture();
    const identity = await fixture.identities.create();
    const profile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Lifecycle Profile' },
    });
    const account = await fixture.accounts.register({
      platform: 'youtube',
      platformAccountId: 'account-b',
    });

    await expect(
      fixture.identities.changeLifecycle(identity.internalIdentityId, 'SUSPENDED'),
    ).resolves.toMatchObject({ lifecycle: 'SUSPENDED' });
    await expect(
      fixture.profiles.changeLifecycle(profile.commerceProfileId, 'SUSPENDED'),
    ).resolves.toMatchObject({ lifecycle: 'SUSPENDED' });
    await expect(
      fixture.accounts.changeLifecycle(account.externalPlatformAccountId, 'SUSPENDED'),
    ).resolves.toMatchObject({ lifecycle: 'SUSPENDED' });
    await expect(
      fixture.accounts.changeLifecycle(account.externalPlatformAccountId, 'SUSPENDED'),
    ).rejects.toBeInstanceOf(Error);
  });

  it('maps supplied Reference conflicts and missing Profiles to explicit application errors', async () => {
    const fixture = createFixture();
    const identity = await fixture.identities.create();
    const profile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Reference Profile' },
    });
    await fixture.references.assign({
      commerceReference: reference,
      commerceProfileId: profile.commerceProfileId,
    });

    await expect(
      fixture.references.assign({
        commerceReference: reference,
        commerceProfileId: profile.commerceProfileId,
      }),
    ).rejects.toMatchObject({
      category: 'conflict',
      code: 'identity_foundation_conflict',
    });
    await expect(
      fixture.references.assign({
        commerceReference: createCommerceReference('3479ACDEFHJKMNPQRV'),
        commerceProfileId: createCommerceProfileId('profile_missing'),
      }),
    ).rejects.toMatchObject({
      category: 'not_found',
      code: 'identity_foundation_not_found',
    });
  });

  it('fails closed for missing Account or Profile when creating a Relationship', async () => {
    const fixture = createFixture();
    const identity = await fixture.identities.create();
    const profile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Relationship Profile' },
    });
    const account = await fixture.accounts.register({
      platform: 'tiktok',
      platformAccountId: 'account-c',
    });

    await expect(
      fixture.relationships.create({
        externalPlatformAccountId: account.externalPlatformAccountId,
        commerceProfileId: createCommerceProfileId('profile_missing'),
        role: 'MANAGER',
        effectiveAt: '2026-08-26T10:00:00.000Z',
      }),
    ).rejects.toMatchObject({
      category: 'not_found',
      code: 'identity_foundation_not_found',
    });
    await expect(
      fixture.relationships.create({
        externalPlatformAccountId: 'account_missing' as ExternalPlatformAccountId,
        commerceProfileId: profile.commerceProfileId,
        role: 'DELEGATED_MANAGER',
        effectiveAt: '2026-08-26T10:00:00.000Z',
      }),
    ).rejects.toMatchObject({
      category: 'not_found',
      code: 'identity_foundation_not_found',
    });
  });

  it('keeps Relationship history immutable while atomically historicalizing a suspended record and activating its replacement', async () => {
    const fixture = createFixture();
    const identity = await fixture.identities.create();
    const firstProfile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Original Profile' },
    });
    const secondProfile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Replacement Profile' },
    });
    const account = await fixture.accounts.register({
      platform: 'instagram',
      platformAccountId: 'account-d',
    });
    const original = await createActiveRelationship(
      fixture.relationships,
      account.externalPlatformAccountId,
      firstProfile.commerceProfileId,
      'OWNER',
    );
    const suspended = await fixture.relationships.changeLifecycle(
      original.commerceRelationshipId,
      'SUSPENDED',
    );
    const replacement = await fixture.relationships.create({
      externalPlatformAccountId: account.externalPlatformAccountId,
      commerceProfileId: secondProfile.commerceProfileId,
      role: 'MANAGER',
      effectiveAt: '2026-08-26T11:00:00.000Z',
    });
    const verifiedReplacement = await fixture.relationships.changeLifecycle(
      replacement.commerceRelationshipId,
      'VERIFIED',
    );

    const active = await fixture.relationships.replaceSuspendedWithVerified({
      suspendedRelationshipId: suspended.commerceRelationshipId,
      verifiedRelationshipId: verifiedReplacement.commerceRelationshipId,
    });

    expect(active).toMatchObject({
      commerceRelationshipId: verifiedReplacement.commerceRelationshipId,
      commerceProfileId: secondProfile.commerceProfileId,
      role: 'MANAGER',
      lifecycle: 'ACTIVE',
    });
    await expect(
      fixture.relationships.get(suspended.commerceRelationshipId),
    ).resolves.toMatchObject({
      commerceProfileId: firstProfile.commerceProfileId,
      role: 'OWNER',
      effectiveAt: original.effectiveAt,
      lifecycle: 'HISTORICAL',
    });
    await expect(
      fixture.relationships.listForAccount(account.externalPlatformAccountId),
    ).resolves.toHaveLength(2);
  });

  it('rolls back Relationship historicalization if replacement activation fails', async () => {
    const fixture = createFixture({ failRelationshipActivation: true });
    const identity = await fixture.identities.create();
    const firstProfile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Rollback Original' },
    });
    const secondProfile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Rollback Replacement' },
    });
    const account = await fixture.accounts.register({
      platform: 'youtube',
      platformAccountId: 'account-e',
    });
    const active = await createActiveRelationship(
      fixture.relationships,
      account.externalPlatformAccountId,
      firstProfile.commerceProfileId,
      'OWNER',
    );
    const suspended = await fixture.relationships.changeLifecycle(
      active.commerceRelationshipId,
      'SUSPENDED',
    );
    const replacement = await fixture.relationships.create({
      externalPlatformAccountId: account.externalPlatformAccountId,
      commerceProfileId: secondProfile.commerceProfileId,
      role: 'OWNER',
      effectiveAt: '2026-08-26T11:00:00.000Z',
    });
    const verified = await fixture.relationships.changeLifecycle(
      replacement.commerceRelationshipId,
      'VERIFIED',
    );

    await expect(
      fixture.relationships.replaceSuspendedWithVerified({
        suspendedRelationshipId: suspended.commerceRelationshipId,
        verifiedRelationshipId: verified.commerceRelationshipId,
      }),
    ).rejects.toMatchObject({
      category: 'unavailable',
      code: 'identity_foundation_persistence_failure',
    });
    await expect(
      fixture.relationships.get(suspended.commerceRelationshipId),
    ).resolves.toMatchObject({
      lifecycle: 'SUSPENDED',
    });
    await expect(fixture.relationships.get(verified.commerceRelationshipId)).resolves.toMatchObject(
      {
        lifecycle: 'VERIFIED',
      },
    );
  });

  it('rolls back a failed Reference assignment without mutating the Profile', async () => {
    const fixture = createFixture({ failReferenceAssignment: true });
    const identity = await fixture.identities.create();
    const profile = await fixture.profiles.create({
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Reference Rollback' },
    });

    await expect(
      fixture.references.assign({
        commerceReference: reference,
        commerceProfileId: profile.commerceProfileId,
      }),
    ).rejects.toMatchObject({
      category: 'unavailable',
      code: 'identity_foundation_persistence_failure',
    });
    await expect(fixture.profiles.get(profile.commerceProfileId)).resolves.toEqual(profile);
    await expect(
      fixture.referenceRepository.getByProfileId(profile.commerceProfileId),
    ).resolves.toBeUndefined();
  });
});

function createFixture(
  options: {
    readonly failReferenceAssignment?: boolean;
    readonly failRelationshipActivation?: boolean;
  } = {},
) {
  const identityRepository = new InMemoryInternalIdentityRepository();
  const commerceProfileRepository = new InMemoryCanonicalCommerceProfileRepository(
    identityRepository,
  );
  const referenceRepository = new InMemoryCanonicalCommerceReferenceRepository(
    commerceProfileRepository,
  );
  const accountRepository = new InMemoryExternalPlatformAccountRepository();
  const relationshipRepository = new InMemoryCommerceRelationshipRepository(
    accountRepository,
    commerceProfileRepository,
  );
  const transactionalReferenceRepository = options.failReferenceAssignment
    ? new FailingReferenceAssignmentRepository(referenceRepository)
    : referenceRepository;
  const transactionalRelationshipRepository = options.failRelationshipActivation
    ? new FailingRelationshipActivationRepository(relationshipRepository)
    : relationshipRepository;
  const transaction: IdentityFoundationTransaction = new InMemoryIdentityFoundationTransaction(
    {
      commerceProfileRepository,
      commerceReferenceRepository: transactionalReferenceRepository,
      commerceRelationshipRepository: transactionalRelationshipRepository,
    },
    [referenceRepository, relationshipRepository],
  );

  let identitySequence = 0;
  let profileSequence = 0;
  let accountSequence = 0;
  let relationshipSequence = 0;
  return {
    identityRepository,
    referenceRepository,
    identities: createInternalIdentityService({
      repository: identityRepository,
      idGenerator: {
        generate: () => {
          identitySequence += 1;
          return createInternalIdentityId(`identity_${identitySequence}`);
        },
      },
      clock,
    }),
    profiles: createCanonicalCommerceProfileService({
      repository: commerceProfileRepository,
      idGenerator: {
        generate: () => {
          profileSequence += 1;
          return createCommerceProfileId(`profile_${profileSequence}`);
        },
      },
      clock,
    }),
    references: createCanonicalCommerceReferenceService({
      commerceProfileRepository,
      commerceReferenceRepository: referenceRepository,
      transaction,
      clock,
    }),
    accounts: createExternalPlatformAccountService({
      repository: accountRepository,
      idGenerator: {
        generate: () => {
          accountSequence += 1;
          return `account_${accountSequence}` as ExternalPlatformAccountId;
        },
      },
      clock,
    }),
    relationships: createCommerceRelationshipService({
      commerceRelationshipRepository: relationshipRepository,
      commerceProfileRepository,
      externalPlatformAccountRepository: accountRepository,
      transaction,
      idGenerator: {
        generate: () => {
          relationshipSequence += 1;
          return `relationship_${relationshipSequence}` as CommerceRelationshipId;
        },
      },
      clock,
    }),
  };
}

async function createActiveRelationship(
  service: CommerceRelationshipService,
  accountId: ExternalPlatformAccountId,
  profileId: CommerceProfileId,
  role: 'OWNER' | 'MANAGER' | 'DELEGATED_MANAGER',
) {
  const proposed = await service.create({
    externalPlatformAccountId: accountId,
    commerceProfileId: profileId,
    role,
    effectiveAt: '2026-08-26T10:00:00.000Z',
  });
  const verified = await service.changeLifecycle(proposed.commerceRelationshipId, 'VERIFIED');
  return service.changeLifecycle(verified.commerceRelationshipId, 'ACTIVE');
}

class FailingReferenceAssignmentRepository {
  public constructor(
    private readonly delegate: IdentityFoundationTransactionScope['commerceReferenceRepository'],
  ) {}

  public async assign(
    input: Parameters<
      IdentityFoundationTransactionScope['commerceReferenceRepository']['assign']
    >[0],
  ): Promise<void> {
    await this.delegate.assign(input);
    throw new Error('Simulated reference persistence failure.');
  }

  public getByReference(...input: Parameters<typeof this.delegate.getByReference>) {
    return this.delegate.getByReference(...input);
  }

  public getByProfileId(...input: Parameters<typeof this.delegate.getByProfileId>) {
    return this.delegate.getByProfileId(...input);
  }

  public exists(...input: Parameters<typeof this.delegate.exists>) {
    return this.delegate.exists(...input);
  }

  public reserve(...input: Parameters<typeof this.delegate.reserve>) {
    return this.delegate.reserve(...input);
  }
}

class FailingRelationshipActivationRepository implements CommerceRelationshipRepository {
  public constructor(private readonly delegate: CommerceRelationshipRepository) {}

  public create(...input: Parameters<CommerceRelationshipRepository['create']>) {
    return this.delegate.create(...input);
  }

  public getById(...input: Parameters<CommerceRelationshipRepository['getById']>) {
    return this.delegate.getById(...input);
  }

  public listByExternalPlatformAccount(
    ...input: Parameters<CommerceRelationshipRepository['listByExternalPlatformAccount']>
  ) {
    return this.delegate.listByExternalPlatformAccount(...input);
  }

  public listByCommerceProfile(
    ...input: Parameters<CommerceRelationshipRepository['listByCommerceProfile']>
  ) {
    return this.delegate.listByCommerceProfile(...input);
  }

  public getActiveByExternalPlatformAccount(
    ...input: Parameters<CommerceRelationshipRepository['getActiveByExternalPlatformAccount']>
  ) {
    return this.delegate.getActiveByExternalPlatformAccount(...input);
  }

  public async updateLifecycle(input: {
    readonly relationshipId: CommerceRelationshipId;
    readonly expectedLifecycle: CommerceRelationshipLifecycle;
    readonly nextLifecycle: CommerceRelationshipLifecycle;
    readonly updatedAt: string;
  }): Promise<void> {
    if (input.nextLifecycle === 'ACTIVE') {
      throw new Error('Simulated relationship activation failure.');
    }
    await this.delegate.updateLifecycle(input);
  }
}
