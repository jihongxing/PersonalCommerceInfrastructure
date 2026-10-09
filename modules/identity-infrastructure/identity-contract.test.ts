import { describe, expect, it } from 'vitest';

import { DomainTransitionError } from '../shared/domain-error.js';
import {
  createAuthenticationAccountId,
  createCommerceProfile,
  createCommerceProfileId,
  createInternalIdentity,
  createInternalIdentityId,
  listOwnedCommerceProfiles,
  transitionCommerceProfile,
  transitionInternalIdentity,
  updateCommerceProfilePresentation,
  type AuthenticationAccountId,
  type CommerceProfileId,
  type CommerceReference,
  type InternalIdentityId,
} from './identity-contract.js';

const createdAt = '2026-08-26T00:00:00.000Z';

function createIdentity(identityValue = 'identity-1') {
  return createInternalIdentity({
    internalIdentityId: createInternalIdentityId(identityValue),
    createdAt,
  });
}

function createProfile(input: {
  readonly profileValue: string;
  readonly ownerValue?: string;
  readonly displayName?: string;
}) {
  return createCommerceProfile({
    commerceProfileId: createCommerceProfileId(input.profileValue),
    owningIdentityId: createInternalIdentityId(input.ownerValue ?? 'identity-1'),
    presentation: { displayName: input.displayName ?? 'Studio North' },
    createdAt,
  });
}

describe('Internal Identity and Commerce Profile domain contract', () => {
  it('creates a private active Internal Identity without profile presentation or PII fields', () => {
    expect(createIdentity()).toEqual({
      internalIdentityId: 'identity-1',
      lifecycle: 'ACTIVE',
      createdAt,
      updatedAt: createdAt,
    });
  });

  it('updates active Commerce Profile presentation without changing immutable facts', () => {
    const profile = createProfile({ profileValue: 'profile-update' });
    const updated = updateCommerceProfilePresentation(
      profile,
      { displayName: 'Studio South' },
      '2026-08-27T01:00:00.000Z',
    );

    expect(updated).toEqual({
      ...profile,
      presentation: { displayName: 'Studio South' },
      updatedAt: '2026-08-27T01:00:00.000Z',
    });
    expect(() =>
      updateCommerceProfilePresentation(
        transitionCommerceProfile(profile, 'SUSPENDED', '2026-08-27T01:00:00.000Z'),
        { displayName: 'Denied' },
        '2026-08-27T02:00:00.000Z',
      ),
    ).toThrow(DomainTransitionError);
  });

  it('rejects an Internal Identity without a valid Identity ID', () => {
    expect(() =>
      createInternalIdentity({
        internalIdentityId: '' as InternalIdentityId,
        createdAt,
      }),
    ).toThrow('Internal Identity ID cannot be empty.');
  });

  it('keeps Identity lifecycle independent from Profile lifecycle', () => {
    const suspendedIdentity = transitionInternalIdentity(
      createIdentity(),
      'SUSPENDED',
      '2026-08-26T01:00:00.000Z',
    );
    const archivedProfile = transitionCommerceProfile(
      createProfile({ profileValue: 'profile-1' }),
      'ARCHIVED',
      '2026-08-26T01:00:00.000Z',
    );

    expect(suspendedIdentity.lifecycle).toBe('SUSPENDED');
    expect(archivedProfile.lifecycle).toBe('ARCHIVED');
  });

  it.each([
    ['ACTIVE', 'SUSPENDED'],
    ['ACTIVE', 'ARCHIVED'],
    ['SUSPENDED', 'ACTIVE'],
    ['SUSPENDED', 'ARCHIVED'],
  ] as const)('allows Internal Identity lifecycle transition %s -> %s', (from, to) => {
    const identity =
      from === 'ACTIVE'
        ? createIdentity()
        : transitionInternalIdentity(createIdentity(), 'SUSPENDED', '2026-08-26T01:00:00.000Z');

    expect(transitionInternalIdentity(identity, to, '2026-08-26T02:00:00.000Z').lifecycle).toBe(to);
  });

  it.each([
    ['ACTIVE', 'ACTIVE'],
    ['SUSPENDED', 'SUSPENDED'],
    ['ARCHIVED', 'ACTIVE'],
    ['ARCHIVED', 'SUSPENDED'],
  ] as const)('rejects invalid Internal Identity lifecycle transition %s -> %s', (from, to) => {
    const identity =
      from === 'ACTIVE'
        ? createIdentity()
        : from === 'SUSPENDED'
          ? transitionInternalIdentity(createIdentity(), 'SUSPENDED', '2026-08-26T01:00:00.000Z')
          : transitionInternalIdentity(createIdentity(), 'ARCHIVED', '2026-08-26T01:00:00.000Z');

    expect(() => transitionInternalIdentity(identity, to, '2026-08-26T02:00:00.000Z')).toThrow(
      DomainTransitionError,
    );
  });

  it('creates an active Commerce Profile with exactly one owning Identity', () => {
    expect(createProfile({ profileValue: 'profile-1' })).toEqual({
      commerceProfileId: 'profile-1',
      owningIdentityId: 'identity-1',
      lifecycle: 'ACTIVE',
      presentation: { displayName: 'Studio North' },
      createdAt,
      updatedAt: createdAt,
    });
  });

  it('rejects a Commerce Profile without a valid owning Identity', () => {
    expect(() =>
      createCommerceProfile({
        commerceProfileId: createCommerceProfileId('profile-1'),
        owningIdentityId: '' as InternalIdentityId,
        presentation: { displayName: 'Studio North' },
        createdAt,
      }),
    ).toThrow('Internal Identity ID cannot be empty.');
  });

  it('rejects multiple owning Identities where untyped input attempts to bypass the contract', () => {
    expect(() =>
      createCommerceProfile({
        commerceProfileId: createCommerceProfileId('profile-1'),
        owningIdentityId: ['identity-1', 'identity-2'] as unknown as InternalIdentityId,
        presentation: { displayName: 'Studio North' },
        createdAt,
      }),
    ).toThrow('Internal Identity ID cannot be empty.');
  });

  it('rejects a Commerce Profile without a valid Profile ID', () => {
    expect(() =>
      createCommerceProfile({
        commerceProfileId: '' as CommerceProfileId,
        owningIdentityId: createInternalIdentityId('identity-1'),
        presentation: { displayName: 'Studio North' },
        createdAt,
      }),
    ).toThrow('Commerce Profile ID cannot be empty.');
  });

  it('allows one Identity to own multiple Commerce Profiles', () => {
    const identity = createIdentity();
    const profiles = [
      createProfile({ profileValue: 'profile-a' }),
      createProfile({ profileValue: 'profile-b' }),
      createProfile({ profileValue: 'profile-c' }),
      createProfile({ profileValue: 'profile-other', ownerValue: 'identity-2' }),
    ];

    expect(
      listOwnedCommerceProfiles(identity, profiles).map((profile) => profile.commerceProfileId),
    ).toEqual(['profile-a', 'profile-b', 'profile-c']);
  });

  it.each([
    ['ACTIVE', 'SUSPENDED'],
    ['ACTIVE', 'ARCHIVED'],
    ['SUSPENDED', 'ACTIVE'],
    ['SUSPENDED', 'ARCHIVED'],
  ] as const)('allows Commerce Profile lifecycle transition %s -> %s', (from, to) => {
    const profile =
      from === 'ACTIVE'
        ? createProfile({ profileValue: 'profile-1' })
        : transitionCommerceProfile(
            createProfile({ profileValue: 'profile-1' }),
            'SUSPENDED',
            '2026-08-26T01:00:00.000Z',
          );

    expect(transitionCommerceProfile(profile, to, '2026-08-26T02:00:00.000Z').lifecycle).toBe(to);
  });

  it.each([
    ['ACTIVE', 'ACTIVE'],
    ['SUSPENDED', 'SUSPENDED'],
    ['ARCHIVED', 'ACTIVE'],
    ['ARCHIVED', 'SUSPENDED'],
  ] as const)('rejects invalid Commerce Profile lifecycle transition %s -> %s', (from, to) => {
    const profile =
      from === 'ACTIVE'
        ? createProfile({ profileValue: 'profile-1' })
        : from === 'SUSPENDED'
          ? transitionCommerceProfile(
              createProfile({ profileValue: 'profile-1' }),
              'SUSPENDED',
              '2026-08-26T01:00:00.000Z',
            )
          : transitionCommerceProfile(
              createProfile({ profileValue: 'profile-1' }),
              'ARCHIVED',
              '2026-08-26T01:00:00.000Z',
            );

    expect(() => transitionCommerceProfile(profile, to, '2026-08-26T02:00:00.000Z')).toThrow(
      DomainTransitionError,
    );
  });

  it('does not provide an ownership reassignment operation', () => {
    const profile = createProfile({ profileValue: 'profile-1' });

    expect(profile.owningIdentityId).toBe(createInternalIdentityId('identity-1'));
  });

  it('keeps Authentication Account, Internal Identity, Commerce Profile, and Commerce Reference types isolated', () => {
    const accountId = createAuthenticationAccountId('account-1');
    const identityId = createInternalIdentityId('identity-1');
    const profileId = createCommerceProfileId('profile-1');

    acceptsAuthenticationAccountId(accountId);
    acceptsInternalIdentityId(identityId);
    acceptsCommerceProfileId(profileId);

    // @ts-expect-error Authentication Account ID is not an Internal Identity ID.
    acceptsInternalIdentityId(accountId);
    // @ts-expect-error Internal Identity ID is not a Commerce Profile ID.
    acceptsCommerceProfileId(identityId);
    // @ts-expect-error Commerce Profile ID is not a Commerce Reference.
    acceptsCommerceReference(profileId);
  });
});

function acceptsAuthenticationAccountId(value: AuthenticationAccountId): void {
  void value;
}

function acceptsInternalIdentityId(value: InternalIdentityId): void {
  void value;
}

function acceptsCommerceProfileId(value: CommerceProfileId): void {
  void value;
}

function acceptsCommerceReference(value: CommerceReference): void {
  void value;
}
