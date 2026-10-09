import { describe, expect, it } from 'vitest';

import { DomainTransitionError } from '../shared/domain-error.js';
import {
  createCommerceProfile,
  transitionCommerceProfile,
  updateCommerceProfilePresentation,
} from './commerce-profile.js';

const createdAt = '2026-08-26T00:00:00.000Z';

function createProfile() {
  return createCommerceProfile({
    commerceProfileId: 'commerce-profile-1',
    identityId: 'identity-1',
    presentation: {
      displayName: '  Studio North  ',
      bio: '  Design practice  ',
      avatarUrl: '  https://example.test/avatar.png  ',
      location: '  Shanghai  ',
      socialLinks: ['  https://example.test  ', ''],
    },
    createdAt,
  });
}

describe('CommerceProfile domain', () => {
  it('creates an independent draft profile with normalized presentation data', () => {
    expect(createProfile()).toEqual({
      commerceProfileId: 'commerce-profile-1',
      identityId: 'identity-1',
      lifecycle: 'DRAFT',
      presentation: {
        displayName: 'Studio North',
        bio: 'Design practice',
        avatarUrl: 'https://example.test/avatar.png',
        location: 'Shanghai',
        socialLinks: ['https://example.test'],
      },
      createdAt,
      updatedAt: createdAt,
    });
  });

  it('requires a display name while keeping optional presentation fields nullable', () => {
    expect(() =>
      createCommerceProfile({
        commerceProfileId: 'commerce-profile-1',
        identityId: 'identity-1',
        presentation: { displayName: ' ', socialLinks: [] },
        createdAt,
      }),
    ).toThrow('display name is required');
  });

  it('allows every approved lifecycle transition', () => {
    expect(
      transitionCommerceProfile(createProfile(), 'ACTIVE', '2026-08-26T01:00:00.000Z').lifecycle,
    ).toBe('ACTIVE');
    expect(
      transitionCommerceProfile(createProfile(), 'ARCHIVED', '2026-08-26T01:00:00.000Z').lifecycle,
    ).toBe('ARCHIVED');
    expect(
      transitionCommerceProfile(
        transitionCommerceProfile(createProfile(), 'ACTIVE', '2026-08-26T01:00:00.000Z'),
        'SUSPENDED',
        '2026-08-26T02:00:00.000Z',
      ).lifecycle,
    ).toBe('SUSPENDED');
    expect(
      transitionCommerceProfile(
        transitionCommerceProfile(createProfile(), 'ACTIVE', '2026-08-26T01:00:00.000Z'),
        'ARCHIVED',
        '2026-08-26T02:00:00.000Z',
      ).lifecycle,
    ).toBe('ARCHIVED');
    expect(
      transitionCommerceProfile(
        transitionCommerceProfile(
          transitionCommerceProfile(createProfile(), 'ACTIVE', '2026-08-26T01:00:00.000Z'),
          'SUSPENDED',
          '2026-08-26T02:00:00.000Z',
        ),
        'ACTIVE',
        '2026-08-26T03:00:00.000Z',
      ).lifecycle,
    ).toBe('ACTIVE');
    expect(
      transitionCommerceProfile(
        transitionCommerceProfile(
          transitionCommerceProfile(createProfile(), 'ACTIVE', '2026-08-26T01:00:00.000Z'),
          'SUSPENDED',
          '2026-08-26T02:00:00.000Z',
        ),
        'ARCHIVED',
        '2026-08-26T03:00:00.000Z',
      ).lifecycle,
    ).toBe('ARCHIVED');
  });

  it('rejects same-state and invalid transitions and keeps archived profiles terminal', () => {
    const archived = transitionCommerceProfile(
      createProfile(),
      'ARCHIVED',
      '2026-08-26T01:00:00.000Z',
    );

    expect(() =>
      transitionCommerceProfile(createProfile(), 'DRAFT', '2026-08-26T02:00:00.000Z'),
    ).toThrow(DomainTransitionError);
    expect(() =>
      transitionCommerceProfile(createProfile(), 'SUSPENDED', '2026-08-26T02:00:00.000Z'),
    ).toThrow(DomainTransitionError);
    expect(() => transitionCommerceProfile(archived, 'ACTIVE', '2026-08-26T02:00:00.000Z')).toThrow(
      DomainTransitionError,
    );
    expect(() =>
      transitionCommerceProfile(
        transitionCommerceProfile(createProfile(), 'ACTIVE', '2026-08-26T01:00:00.000Z'),
        'ACTIVE',
        '2026-08-26T02:00:00.000Z',
      ),
    ).toThrow(DomainTransitionError);
    expect(() =>
      transitionCommerceProfile(
        transitionCommerceProfile(
          transitionCommerceProfile(createProfile(), 'ACTIVE', '2026-08-26T01:00:00.000Z'),
          'SUSPENDED',
          '2026-08-26T02:00:00.000Z',
        ),
        'SUSPENDED',
        '2026-08-26T03:00:00.000Z',
      ),
    ).toThrow(DomainTransitionError);
  });

  it('allows presentation changes only while draft or active', () => {
    const draft = updateCommerceProfilePresentation(
      createProfile(),
      { displayName: 'Draft Updated', socialLinks: [] },
      '2026-08-26T01:00:00.000Z',
    );
    const active = updateCommerceProfilePresentation(
      transitionCommerceProfile(createProfile(), 'ACTIVE', '2026-08-26T01:00:00.000Z'),
      { displayName: 'Active Updated', socialLinks: [] },
      '2026-08-26T02:00:00.000Z',
    );
    const suspended = transitionCommerceProfile(
      transitionCommerceProfile(createProfile(), 'ACTIVE', '2026-08-26T01:00:00.000Z'),
      'SUSPENDED',
      '2026-08-26T02:00:00.000Z',
    );
    const archived = transitionCommerceProfile(
      createProfile(),
      'ARCHIVED',
      '2026-08-26T01:00:00.000Z',
    );

    expect(draft.presentation.displayName).toBe('Draft Updated');
    expect(active.presentation.displayName).toBe('Active Updated');
    expect(() =>
      updateCommerceProfilePresentation(
        suspended,
        { displayName: 'Replacement', socialLinks: [] },
        '2026-08-26T03:00:00.000Z',
      ),
    ).toThrow(DomainTransitionError);
    expect(() =>
      updateCommerceProfilePresentation(
        archived,
        { displayName: 'Replacement', socialLinks: [] },
        '2026-08-26T02:00:00.000Z',
      ),
    ).toThrow(DomainTransitionError);
  });
});
