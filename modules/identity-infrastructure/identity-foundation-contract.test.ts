import { describe, expect, it } from 'vitest';

import {
  assignCommerceReference,
  createCommerceReference,
  type AssignedCommerceReference,
} from './commerce-reference-contract.js';
import {
  createCommerceRelationship,
  createCommerceRelationshipId,
  createExternalPlatform,
  createExternalPlatformAccount,
  createExternalPlatformAccountId,
  createExternalPlatformNamespace,
  createPlatformAccountIdentifier,
  transitionCommerceRelationship,
} from './external-platform-contract.js';
import {
  createCommerceProfile,
  createCommerceProfileId,
  createInternalIdentity,
  createInternalIdentityId,
  listOwnedCommerceProfiles,
} from './identity-contract.js';

const createdAt = '2026-08-26T00:00:00.000Z';
const updatedAt = '2026-08-26T01:00:00.000Z';

function activateRelationship(input: {
  readonly relationshipId: string;
  readonly externalAccountId: string;
  readonly profileId: string;
  readonly relationships?: readonly ReturnType<typeof createCommerceRelationship>[];
}) {
  const proposed = createCommerceRelationship({
    commerceRelationshipId: createCommerceRelationshipId(input.relationshipId),
    externalPlatformAccountId: createExternalPlatformAccountId(input.externalAccountId),
    commerceProfileId: createCommerceProfileId(input.profileId),
    role: 'OWNER',
    effectiveAt: createdAt,
    createdAt,
  });
  const verified = transitionCommerceRelationship({
    relationship: proposed,
    lifecycle: 'VERIFIED',
    updatedAt,
    relationships: input.relationships ?? [],
  });

  return transitionCommerceRelationship({
    relationship: verified,
    lifecycle: 'ACTIVE',
    updatedAt,
    relationships: input.relationships ?? [],
  });
}

describe('Stage 2 Identity Foundation domain graph', () => {
  it('keeps one Identity, multiple Profiles, References, Accounts, and binding history coherent', () => {
    const identity = createInternalIdentity({
      internalIdentityId: createInternalIdentityId('identity-a'),
      createdAt,
    });
    const profileA = createCommerceProfile({
      commerceProfileId: createCommerceProfileId('profile-a'),
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Studio A' },
      createdAt,
    });
    const profileB = createCommerceProfile({
      commerceProfileId: createCommerceProfileId('profile-b'),
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Brand B' },
      createdAt,
    });
    const profileReferences: readonly AssignedCommerceReference[] = [
      assignCommerceReference({
        commerceReference: createCommerceReference('3C7M4Q9RDFHJKNTWVY'),
        commerceProfileId: profileA.commerceProfileId,
        assignedAt: createdAt,
        assignedReferences: [],
      }),
      assignCommerceReference({
        commerceReference: createCommerceReference('4C7M4Q9RDFHJKNTWVY'),
        commerceProfileId: profileB.commerceProfileId,
        assignedAt: createdAt,
        assignedReferences: [],
      }),
    ];
    const instagram = createExternalPlatform(createExternalPlatformNamespace('instagram'));
    const tiktok = createExternalPlatform(createExternalPlatformNamespace('tiktok'));
    const instagramOne = createExternalPlatformAccount({
      externalPlatformAccountId: createExternalPlatformAccountId('instagram-1'),
      platform: instagram,
      platformAccountId: createPlatformAccountIdentifier('instagram-account-1'),
      createdAt,
    });
    const instagramTwo = createExternalPlatformAccount({
      externalPlatformAccountId: createExternalPlatformAccountId('instagram-2'),
      platform: instagram,
      platformAccountId: createPlatformAccountIdentifier('instagram-account-2'),
      createdAt,
    });
    const tiktokOne = createExternalPlatformAccount({
      externalPlatformAccountId: createExternalPlatformAccountId('tiktok-1'),
      platform: tiktok,
      platformAccountId: createPlatformAccountIdentifier('tiktok-account-1'),
      createdAt,
    });

    const initialRelationship = activateRelationship({
      relationshipId: 'relationship-a',
      externalAccountId: instagramOne.externalPlatformAccountId,
      profileId: profileA.commerceProfileId,
    });
    const revokedRelationship = transitionCommerceRelationship({
      relationship: initialRelationship,
      lifecycle: 'REVOKED',
      updatedAt,
      relationships: [initialRelationship],
    });
    const historicalRelationship = transitionCommerceRelationship({
      relationship: revokedRelationship,
      lifecycle: 'HISTORICAL',
      updatedAt,
      relationships: [revokedRelationship],
    });
    const replacementRelationship = activateRelationship({
      relationshipId: 'relationship-b',
      externalAccountId: instagramOne.externalPlatformAccountId,
      profileId: profileB.commerceProfileId,
      relationships: [historicalRelationship],
    });
    const secondInstagramRelationship = activateRelationship({
      relationshipId: 'relationship-c',
      externalAccountId: instagramTwo.externalPlatformAccountId,
      profileId: profileA.commerceProfileId,
    });
    const tiktokRelationship = activateRelationship({
      relationshipId: 'relationship-d',
      externalAccountId: tiktokOne.externalPlatformAccountId,
      profileId: profileA.commerceProfileId,
    });

    expect(listOwnedCommerceProfiles(identity, [profileA, profileB])).toEqual([profileA, profileB]);
    expect(profileReferences).toHaveLength(2);
    expect(profileReferences[0]?.commerceProfileId).toBe(profileA.commerceProfileId);
    expect(profileReferences[1]?.commerceProfileId).toBe(profileB.commerceProfileId);
    expect(profileReferences[0]?.commerceReference).not.toBe(
      profileReferences[1]?.commerceReference,
    );
    expect(profileA.owningIdentityId).toBe(identity.internalIdentityId);
    expect(initialRelationship.commerceProfileId).toBe(profileA.commerceProfileId);
    expect(initialRelationship.role).toBe('OWNER');
    expect(initialRelationship).not.toHaveProperty('owningIdentityId');
    expect(historicalRelationship.lifecycle).toBe('HISTORICAL');
    expect(replacementRelationship.commerceProfileId).toBe(profileB.commerceProfileId);
    expect(replacementRelationship.lifecycle).toBe('ACTIVE');
    expect(secondInstagramRelationship.lifecycle).toBe('ACTIVE');
    expect(tiktokRelationship.lifecycle).toBe('ACTIVE');
    expect(instagramOne.externalPlatformAccountId).not.toBe(
      initialRelationship.commerceRelationshipId,
    );
    expect(initialRelationship.commerceRelationshipId).not.toBe(
      replacementRelationship.commerceRelationshipId,
    );
  });

  it('rejects duplicate active bindings and reference reassignment in the composed graph', () => {
    const activeRelationship = activateRelationship({
      relationshipId: 'relationship-a',
      externalAccountId: 'instagram-1',
      profileId: 'profile-a',
    });
    const proposedReplacement = createCommerceRelationship({
      commerceRelationshipId: createCommerceRelationshipId('relationship-b'),
      externalPlatformAccountId: createExternalPlatformAccountId('instagram-1'),
      commerceProfileId: createCommerceProfileId('profile-b'),
      role: 'MANAGER',
      effectiveAt: createdAt,
      createdAt,
    });
    const verifiedReplacement = transitionCommerceRelationship({
      relationship: proposedReplacement,
      lifecycle: 'VERIFIED',
      updatedAt,
      relationships: [activeRelationship],
    });
    const assignedReference = assignCommerceReference({
      commerceReference: createCommerceReference('3C7M4Q9RDFHJKNTWVY'),
      commerceProfileId: createCommerceProfileId('profile-a'),
      assignedAt: createdAt,
      assignedReferences: [],
    });

    expect(() =>
      transitionCommerceRelationship({
        relationship: verifiedReplacement,
        lifecycle: 'ACTIVE',
        updatedAt,
        relationships: [activeRelationship],
      }),
    ).toThrow('External Platform Account cannot have more than one active Commerce Relationship.');
    expect(() =>
      assignCommerceReference({
        commerceReference: assignedReference.commerceReference,
        commerceProfileId: createCommerceProfileId('profile-b'),
        assignedAt: updatedAt,
        assignedReferences: [assignedReference],
      }),
    ).toThrow('Commerce Reference is already assigned.');
  });
});
