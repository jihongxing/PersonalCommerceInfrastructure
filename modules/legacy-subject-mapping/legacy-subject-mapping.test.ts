import { describe, expect, it } from 'vitest';

import {
  createLegacySubjectMapping,
  isEffectiveLegacySubjectMapping,
  transitionLegacySubjectMapping,
} from './legacy-subject-mapping.js';

const baseInput = {
  mappingId: 'mapping-1',
  legacySubjectReference: 'creator-1',
  identityId: 'identity-1',
  initialCommerceProfileId: 'profile-1',
  createdAt: '2026-08-26T00:00:00.000Z',
};

describe('Legacy Subject Mapping domain', () => {
  it('creates a valid mapping without treating creatorId as a new-model identifier', () => {
    const mapping = createLegacySubjectMapping(baseInput);

    expect(mapping).toMatchObject({
      ...baseInput,
      state: 'ACTIVE',
    });
    expect(isEffectiveLegacySubjectMapping(mapping)).toBe(true);
  });

  it('rejects empty or reused new-model references', () => {
    expect(() => createLegacySubjectMapping({ ...baseInput, legacySubjectReference: ' ' })).toThrow(
      'Legacy subject reference cannot be empty.',
    );
    expect(() =>
      createLegacySubjectMapping({ ...baseInput, legacySubjectReference: baseInput.identityId }),
    ).toThrow('Legacy subject reference cannot be a new-model identifier.');
  });

  it('requires state-specific evidence metadata', () => {
    expect(() => createLegacySubjectMapping({ ...baseInput, state: 'VERIFIED' })).toThrow(
      'Verified mappings require verifiedAt.',
    );
    expect(() => createLegacySubjectMapping({ ...baseInput, state: 'AMBIGUOUS' })).toThrow(
      'AMBIGUOUS mappings require mappingFailureCode.',
    );
  });

  it('allows only forward state transitions and fails closed for non-effective states', () => {
    const mapping = createLegacySubjectMapping(baseInput);
    const ambiguous = transitionLegacySubjectMapping(
      mapping,
      'AMBIGUOUS',
      '2026-08-26T01:00:00.000Z',
      {
        mappingFailureCode: 'MULTIPLE_CANDIDATES',
      },
    );

    expect(isEffectiveLegacySubjectMapping(ambiguous)).toBe(false);
    expect(() =>
      transitionLegacySubjectMapping(ambiguous, 'ACTIVE', '2026-08-26T02:00:00.000Z'),
    ).toThrow();
  });

  it('does not allow a retired mapping to be reactivated', () => {
    const mapping = createLegacySubjectMapping(baseInput);
    const retired = transitionLegacySubjectMapping(mapping, 'RETIRED', '2026-08-26T01:00:00.000Z');

    expect(() =>
      transitionLegacySubjectMapping(retired, 'ACTIVE', '2026-08-26T02:00:00.000Z'),
    ).toThrow();
  });
});
