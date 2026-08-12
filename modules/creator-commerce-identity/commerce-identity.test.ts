import { describe, expect, it } from 'vitest';

import { DomainTransitionError } from '../shared/domain-error.js';
import {
  addCapabilityToIdentity,
  createDraftCommerceIdentity,
  publishCommerceIdentity,
  updateCommerceIdentity,
  unpublishCommerceIdentity,
  type CommerceIdentity,
} from './commerce-identity.js';

describe('CommerceIdentity state machine', () => {
  it('publishes a draft identity', () => {
    const identity = createDraftCommerceIdentity('creator-1', {
      displayName: 'Dancer One',
      bio: 'Private dance lessons',
      socialLinks: [],
    });

    expect(publishCommerceIdentity(identity).state).toBe('published');
  });

  it('unpublishes a published identity', () => {
    const identity: CommerceIdentity = {
      creatorId: 'creator-1',
      profile: {
        displayName: 'Dancer One',
        bio: 'Private dance lessons',
        socialLinks: [],
      },
      capabilityIds: [],
      state: 'published',
    };

    expect(unpublishCommerceIdentity(identity).state).toBe('unpublished');
  });

  it('rejects unpublishing a draft identity', () => {
    const identity = createDraftCommerceIdentity('creator-1', {
      displayName: 'Dancer One',
      bio: 'Private dance lessons',
      socialLinks: [],
    });

    expect(() => unpublishCommerceIdentity(identity)).toThrow(DomainTransitionError);
  });

  it('creates and updates the minimum Commerce Identity profile', () => {
    const identity = createDraftCommerceIdentity('creator-1', {
      displayName: ' Dancer One ',
      bio: ' Private dance lessons ',
      location: ' Shanghai ',
      socialLinks: [' https://example.com/dancer ', ''],
    });

    expect(identity.profile).toEqual({
      displayName: 'Dancer One',
      bio: 'Private dance lessons',
      location: 'Shanghai',
      socialLinks: ['https://example.com/dancer'],
    });

    expect(
      updateCommerceIdentity(identity, {
        displayName: 'Dancer One Updated',
        bio: 'Updated bio',
        socialLinks: [],
      }).profile.displayName,
    ).toBe('Dancer One Updated');
  });

  it('associates a Creator-owned Capability once', () => {
    const identity = createDraftCommerceIdentity('creator-1', {
      displayName: 'Dancer One',
      bio: 'Private dance lessons',
      socialLinks: [],
    });
    const capability = {
      id: 'capability-1',
      creatorId: 'creator-1',
      name: 'Private Dance Lesson',
      description: 'One-on-one dance instruction',
    };

    const associated = addCapabilityToIdentity(identity, capability);

    expect(addCapabilityToIdentity(associated, capability).capabilityIds).toEqual(['capability-1']);
  });

  it('rejects a Capability owned by another Creator', () => {
    const identity = createDraftCommerceIdentity('creator-1', {
      displayName: 'Dancer One',
      bio: 'Private dance lessons',
      socialLinks: [],
    });

    expect(() =>
      addCapabilityToIdentity(identity, {
        id: 'capability-1',
        creatorId: 'creator-2',
        name: 'Private Dance Lesson',
        description: 'One-on-one dance instruction',
      }),
    ).toThrow('Capability does not belong to the Commerce Identity owner');
  });
});
