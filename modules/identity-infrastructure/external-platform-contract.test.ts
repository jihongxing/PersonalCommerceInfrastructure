import { describe, expect, it } from 'vitest';

import { DomainTransitionError } from '../shared/domain-error.js';
import {
  createCommerceRelationship,
  createCommerceRelationshipId,
  createExternalPlatform,
  createExternalPlatformAccount,
  createExternalPlatformAccountId,
  createExternalPlatformNamespace,
  createPlatformAccountIdentifier,
  transitionCommerceRelationship,
  transitionExternalPlatformAccount,
  type CommerceRelationshipId,
  type ExternalPlatformAccountId,
  type PlatformAccountIdentifier,
} from './external-platform-contract.js';
import {
  createCommerceProfileId,
  type CommerceProfileId,
  type InternalIdentityId,
} from './identity-contract.js';

const createdAt = '2026-08-26T00:00:00.000Z';
const effectiveAt = '2026-08-26T00:05:00.000Z';

function createAccount(input: {
  readonly accountValue: string;
  readonly namespace?: string;
  readonly platformAccountValue?: string;
}) {
  return createExternalPlatformAccount({
    externalPlatformAccountId: createExternalPlatformAccountId(input.accountValue),
    platform: createExternalPlatform(
      createExternalPlatformNamespace(input.namespace ?? 'instagram'),
    ),
    platformAccountId: createPlatformAccountIdentifier(
      input.platformAccountValue ?? `${input.accountValue}-platform`,
    ),
    createdAt,
  });
}

function createRelationship(input: {
  readonly relationshipValue: string;
  readonly accountValue: string;
  readonly profileValue: string;
  readonly role?: 'OWNER' | 'MANAGER' | 'DELEGATED_MANAGER';
}) {
  return createCommerceRelationship({
    commerceRelationshipId: createCommerceRelationshipId(input.relationshipValue),
    externalPlatformAccountId: createExternalPlatformAccountId(input.accountValue),
    commerceProfileId: createCommerceProfileId(input.profileValue),
    role: input.role ?? 'OWNER',
    effectiveAt,
    createdAt,
  });
}

function transitionRelationship(
  relationship: ReturnType<typeof createRelationship>,
  lifecycle: Parameters<typeof transitionCommerceRelationship>[0]['lifecycle'],
  relationships: readonly ReturnType<typeof createRelationship>[] = [],
) {
  return transitionCommerceRelationship({
    relationship,
    lifecycle,
    updatedAt: '2026-08-26T01:00:00.000Z',
    relationships,
  });
}

function activateRelationship(
  relationship: ReturnType<typeof createRelationship>,
  relationships: readonly ReturnType<typeof createRelationship>[] = [],
) {
  return transitionRelationship(
    transitionRelationship(relationship, 'VERIFIED', relationships),
    'ACTIVE',
    relationships,
  );
}

describe('External Platform and Commerce Relationship domain contract', () => {
  it('normalizes a valid External Platform namespace', () => {
    expect(createExternalPlatformNamespace('  Instagram  ')).toBe('instagram');
  });

  it.each(['', 'Instagram!', 'insta gram', '-instagram', '微信'])(
    'rejects an invalid External Platform namespace: %s',
    (namespace) => {
      expect(() => createExternalPlatformNamespace(namespace)).toThrow(TypeError);
    },
  );

  it('creates a namespace-only External Platform', () => {
    expect(createExternalPlatform(createExternalPlatformNamespace('tiktok'))).toEqual({
      namespace: 'tiktok',
    });
  });

  it('creates an active External Platform Account scoped to its platform namespace', () => {
    expect(createAccount({ accountValue: 'external-account-1' })).toEqual({
      externalPlatformAccountId: 'external-account-1',
      platform: { namespace: 'instagram' },
      platformAccountId: 'external-account-1-platform',
      lifecycle: 'ACTIVE',
      createdAt,
      updatedAt: createdAt,
    });
  });

  it('requires an account ID, platform namespace, and platform account identifier', () => {
    expect(() =>
      createExternalPlatformAccount({
        externalPlatformAccountId: '' as ExternalPlatformAccountId,
        platform: createExternalPlatform(createExternalPlatformNamespace('instagram')),
        platformAccountId: createPlatformAccountIdentifier('account-1'),
        createdAt,
      }),
    ).toThrow('External Platform Account ID cannot be empty.');
    expect(() =>
      createExternalPlatformAccount({
        externalPlatformAccountId: createExternalPlatformAccountId('external-account-1'),
        platform: { namespace: '' as ReturnType<typeof createExternalPlatformNamespace> },
        platformAccountId: createPlatformAccountIdentifier('account-1'),
        createdAt,
      }),
    ).toThrow('External Platform namespace cannot be empty.');
    expect(() =>
      createExternalPlatformAccount({
        externalPlatformAccountId: createExternalPlatformAccountId('external-account-1'),
        platform: createExternalPlatform(createExternalPlatformNamespace('instagram')),
        platformAccountId: '' as PlatformAccountIdentifier,
        createdAt,
      }),
    ).toThrow('Platform account identifier cannot be empty.');
  });

  it.each([
    ['ACTIVE', 'SUSPENDED'],
    ['ACTIVE', 'REVOKED'],
    ['SUSPENDED', 'ACTIVE'],
    ['SUSPENDED', 'REVOKED'],
  ] as const)('allows External Platform Account lifecycle transition %s -> %s', (from, to) => {
    const account =
      from === 'ACTIVE'
        ? createAccount({ accountValue: 'external-account-1' })
        : transitionExternalPlatformAccount(
            createAccount({ accountValue: 'external-account-1' }),
            'SUSPENDED',
            '2026-08-26T00:30:00.000Z',
          );

    expect(
      transitionExternalPlatformAccount(account, to, '2026-08-26T01:00:00.000Z').lifecycle,
    ).toBe(to);
  });

  it.each([
    ['ACTIVE', 'ACTIVE'],
    ['SUSPENDED', 'SUSPENDED'],
    ['REVOKED', 'ACTIVE'],
    ['REVOKED', 'SUSPENDED'],
  ] as const)(
    'rejects invalid External Platform Account lifecycle transition %s -> %s',
    (from, to) => {
      const account =
        from === 'ACTIVE'
          ? createAccount({ accountValue: 'external-account-1' })
          : from === 'SUSPENDED'
            ? transitionExternalPlatformAccount(
                createAccount({ accountValue: 'external-account-1' }),
                'SUSPENDED',
                '2026-08-26T00:30:00.000Z',
              )
            : transitionExternalPlatformAccount(
                createAccount({ accountValue: 'external-account-1' }),
                'REVOKED',
                '2026-08-26T00:30:00.000Z',
              );

      expect(() =>
        transitionExternalPlatformAccount(account, to, '2026-08-26T01:00:00.000Z'),
      ).toThrow(DomainTransitionError);
    },
  );

  it('allows multiple accounts for one Profile on the same platform and across platforms', () => {
    const profileId = createCommerceProfileId('profile-a');
    const accounts = [
      createAccount({ accountValue: 'instagram-1' }),
      createAccount({ accountValue: 'instagram-2' }),
      createAccount({ accountValue: 'tiktok-1', namespace: 'tiktok' }),
      createAccount({ accountValue: 'youtube-1', namespace: 'youtube' }),
    ];
    const relationships = accounts.map((account, index) =>
      activateRelationship(
        createCommerceRelationship({
          commerceRelationshipId: createCommerceRelationshipId(`relationship-${index + 1}`),
          externalPlatformAccountId: account.externalPlatformAccountId,
          commerceProfileId: profileId,
          role: index === 0 ? 'OWNER' : 'MANAGER',
          effectiveAt,
          createdAt,
        }),
      ),
    );

    expect(relationships).toHaveLength(4);
    expect(relationships.every((relationship) => relationship.lifecycle === 'ACTIVE')).toBe(true);
  });

  it('creates a proposed Commerce Relationship with independent account, profile, and relationship IDs', () => {
    expect(
      createRelationship({
        relationshipValue: 'relationship-1',
        accountValue: 'external-account-1',
        profileValue: 'profile-a',
        role: 'MANAGER',
      }),
    ).toEqual({
      commerceRelationshipId: 'relationship-1',
      externalPlatformAccountId: 'external-account-1',
      commerceProfileId: 'profile-a',
      role: 'MANAGER',
      provenance: 'SELF_DECLARED',
      lifecycle: 'PROPOSED',
      effectiveAt,
      createdAt,
      updatedAt: createdAt,
    });
  });

  it.each(['OWNER', 'MANAGER', 'DELEGATED_MANAGER'] as const)(
    'accepts the %s Commerce Relationship role',
    (role) => {
      expect(
        createRelationship({
          relationshipValue: `relationship-${role}`,
          accountValue: 'external-account-1',
          profileValue: 'profile-a',
          role,
        }).role,
      ).toBe(role);
    },
  );

  it('rejects an invalid Commerce Relationship role when untyped input bypasses the contract', () => {
    expect(() =>
      createCommerceRelationship({
        commerceRelationshipId: createCommerceRelationshipId('relationship-1'),
        externalPlatformAccountId: createExternalPlatformAccountId('external-account-1'),
        commerceProfileId: createCommerceProfileId('profile-a'),
        role: 'CUSTOMER' as never,
        effectiveAt,
        createdAt,
      }),
    ).toThrow('Commerce Relationship role is invalid.');
  });

  it.each([
    ['PROPOSED', 'VERIFIED'],
    ['VERIFIED', 'ACTIVE'],
    ['ACTIVE', 'SUSPENDED'],
    ['ACTIVE', 'REVOKED'],
    ['SUSPENDED', 'ACTIVE'],
    ['SUSPENDED', 'REVOKED'],
    ['SUSPENDED', 'HISTORICAL'],
    ['REVOKED', 'HISTORICAL'],
  ] as const)('allows Commerce Relationship lifecycle transition %s -> %s', (from, to) => {
    const proposed = createRelationship({
      relationshipValue: 'relationship-1',
      accountValue: 'external-account-1',
      profileValue: 'profile-a',
    });
    const relationship =
      from === 'PROPOSED'
        ? proposed
        : from === 'VERIFIED'
          ? transitionRelationship(proposed, 'VERIFIED')
          : from === 'ACTIVE'
            ? activateRelationship(proposed)
            : from === 'SUSPENDED'
              ? transitionRelationship(activateRelationship(proposed), 'SUSPENDED')
              : transitionRelationship(activateRelationship(proposed), 'REVOKED');

    expect(transitionRelationship(relationship, to).lifecycle).toBe(to);
  });

  it.each([
    ['PROPOSED', 'ACTIVE'],
    ['VERIFIED', 'HISTORICAL'],
    ['REVOKED', 'ACTIVE'],
    ['REVOKED', 'VERIFIED'],
    ['HISTORICAL', 'ACTIVE'],
    ['HISTORICAL', 'VERIFIED'],
  ] as const)('rejects invalid Commerce Relationship lifecycle transition %s -> %s', (from, to) => {
    const proposed = createRelationship({
      relationshipValue: 'relationship-1',
      accountValue: 'external-account-1',
      profileValue: 'profile-a',
    });
    const relationship =
      from === 'PROPOSED'
        ? proposed
        : from === 'VERIFIED'
          ? transitionRelationship(proposed, 'VERIFIED')
          : from === 'REVOKED'
            ? transitionRelationship(activateRelationship(proposed), 'REVOKED')
            : transitionRelationship(
                transitionRelationship(activateRelationship(proposed), 'REVOKED'),
                'HISTORICAL',
              );

    expect(() => transitionRelationship(relationship, to)).toThrow(DomainTransitionError);
  });

  it('rejects a second active Commerce Relationship for the same External Platform Account', () => {
    const activeRelationship = activateRelationship(
      createRelationship({
        relationshipValue: 'relationship-a',
        accountValue: 'external-account-1',
        profileValue: 'profile-a',
      }),
    );
    const secondRelationship = transitionRelationship(
      createRelationship({
        relationshipValue: 'relationship-b',
        accountValue: 'external-account-1',
        profileValue: 'profile-b',
      }),
      'VERIFIED',
      [activeRelationship],
    );

    expect(() =>
      transitionRelationship(secondRelationship, 'ACTIVE', [activeRelationship]),
    ).toThrow('External Platform Account cannot have more than one active Commerce Relationship.');
  });

  it('allows a historical relationship and a new active relationship for the same External Platform Account', () => {
    const originalRelationship = activateRelationship(
      createRelationship({
        relationshipValue: 'relationship-a',
        accountValue: 'external-account-1',
        profileValue: 'profile-a',
      }),
    );
    const historicalRelationship = transitionRelationship(
      transitionRelationship(originalRelationship, 'REVOKED'),
      'HISTORICAL',
    );
    const replacementRelationship = activateRelationship(
      createRelationship({
        relationshipValue: 'relationship-b',
        accountValue: 'external-account-1',
        profileValue: 'profile-b',
      }),
      [historicalRelationship],
    );

    expect(historicalRelationship.commerceProfileId).toBe(createCommerceProfileId('profile-a'));
    expect(replacementRelationship.commerceProfileId).toBe(createCommerceProfileId('profile-b'));
    expect(replacementRelationship.lifecycle).toBe('ACTIVE');
  });

  it('does not provide ordinary mutation operations for historical relationship facts', () => {
    const historicalRelationship = transitionRelationship(
      transitionRelationship(
        activateRelationship(
          createRelationship({
            relationshipValue: 'relationship-a',
            accountValue: 'external-account-1',
            profileValue: 'profile-a',
          }),
        ),
        'REVOKED',
      ),
      'HISTORICAL',
    );

    expect(historicalRelationship).toMatchObject({
      commerceProfileId: createCommerceProfileId('profile-a'),
      effectiveAt,
      role: 'OWNER',
      lifecycle: 'HISTORICAL',
    });
  });

  it('keeps External Platform Account, Commerce Relationship, Commerce Profile, and Internal Identity ID types isolated', () => {
    const externalAccountId = createExternalPlatformAccountId('external-account-1');
    const relationshipId = createCommerceRelationshipId('relationship-1');
    const profileId = createCommerceProfileId('profile-a');

    acceptsExternalPlatformAccountId(externalAccountId);
    acceptsCommerceRelationshipId(relationshipId);

    // @ts-expect-error External Platform Account ID is not a Commerce Relationship ID.
    acceptsCommerceRelationshipId(externalAccountId);
    // @ts-expect-error Commerce Relationship ID is not a Commerce Profile ID.
    acceptsCommerceProfileId(relationshipId);
    // @ts-expect-error Commerce Profile ID is not an Internal Identity ID.
    acceptsInternalIdentityId(profileId);
    // @ts-expect-error External Platform Account ID is not an Internal Identity ID.
    acceptsInternalIdentityId(externalAccountId);
  });
});

function acceptsExternalPlatformAccountId(value: ExternalPlatformAccountId): void {
  void value;
}

function acceptsCommerceRelationshipId(value: CommerceRelationshipId): void {
  void value;
}

function acceptsCommerceProfileId(value: CommerceProfileId): void {
  void value;
}

function acceptsInternalIdentityId(value: InternalIdentityId): void {
  void value;
}
