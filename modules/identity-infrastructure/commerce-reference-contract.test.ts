import { describe, expect, it } from 'vitest';

import { DomainTransitionError } from '../shared/domain-error.js';
import {
  assignCommerceReference,
  COMMERCE_REFERENCE_ALPHABET,
  COMMERCE_REFERENCE_LENGTH,
  createCommerceReference,
  formatCommerceReferenceForDisplay,
  permanentlyReserveCommerceReference,
  type AssignedCommerceReference,
  type CommerceReference,
} from './commerce-reference-contract.js';
import {
  createAuthenticationAccountId,
  createCommerceProfileId,
  createInternalIdentityId,
  type CommerceProfileId,
  type InternalIdentityId,
} from './identity-contract.js';
import {
  createCommerceRelationshipId,
  createExternalPlatformAccountId,
} from './external-platform-contract.js';

const assignedAt = '2026-08-26T00:00:00.000Z';
const validReferenceFixture = '3C7M4Q9RDFHJKNTWVY';

function assignReference(
  input: {
    readonly reference?: CommerceReference;
    readonly profileValue?: string;
    readonly assignedReferences?: readonly AssignedCommerceReference[];
  } = {},
): AssignedCommerceReference {
  return assignCommerceReference({
    commerceReference: input.reference ?? createCommerceReference(validReferenceFixture),
    commerceProfileId: createCommerceProfileId(input.profileValue ?? 'profile-a'),
    assignedAt,
    assignedReferences: input.assignedReferences ?? [],
  });
}

describe('Commerce Reference domain contract', () => {
  it('uses the frozen 22-character alphabet and fixed 18-character length', () => {
    expect(COMMERCE_REFERENCE_ALPHABET).toBe('3479ACDEFHJKMNPQRTVWXY');
    expect(COMMERCE_REFERENCE_ALPHABET).toHaveLength(22);
    expect(COMMERCE_REFERENCE_LENGTH).toBe(18);
    expect(createCommerceReference(validReferenceFixture)).toBe(validReferenceFixture);
  });

  it.each([
    ['short value', '3C7M4Q9RDFHJKNTWV'],
    ['long value', '3C7M4Q9RDFHJKNTWVY3'],
    ['lowercase value', '3c7m4q9rdfhjkntwvy'],
    ['hyphenated display value', '3C7M4Q-9RDFHJ-KNTWVY'],
    ['leading whitespace', ' 3C7M4Q9RDFHJKNTWVY'],
    ['punctuation', '3C7M4Q9RDFHJKNTW!Y'],
    ['unknown alphabet character', '3C7M4Q9RDFHJKNTWV0'],
  ])('rejects a non-canonical %s', (_description, value) => {
    expect(() => createCommerceReference(value)).toThrow(TypeError);
  });

  it('formats grouping for display without changing the canonical value', () => {
    const reference = createCommerceReference(validReferenceFixture);

    expect(formatCommerceReferenceForDisplay(reference)).toBe('3C7M4Q-9RDFHJ-KNTWVY');
    expect(reference).toBe(validReferenceFixture);
  });

  it('assigns exactly one immutable Commerce Profile target to a valid reference', () => {
    expect(assignReference()).toEqual({
      commerceReference: validReferenceFixture,
      commerceProfileId: 'profile-a',
      lifecycle: 'ASSIGNED',
      assignedAt,
      updatedAt: assignedAt,
    });
  });

  it('rejects assigning one Profile a second Commerce Reference', () => {
    const assignedReference = assignReference();

    expect(() =>
      assignReference({
        reference: createCommerceReference('4C7M4Q9RDFHJKNTWVY'),
        assignedReferences: [assignedReference],
      }),
    ).toThrow('Commerce Profile already has a Commerce Reference.');
  });

  it('rejects assigning one Commerce Reference to a second Profile', () => {
    const assignedReference = assignReference();

    expect(() =>
      assignReference({
        profileValue: 'profile-b',
        assignedReferences: [assignedReference],
      }),
    ).toThrow('Commerce Reference is already assigned.');
  });

  it('transitions an assigned reference to permanently reserved', () => {
    const permanentlyReserved = permanentlyReserveCommerceReference(
      assignReference(),
      '2026-08-26T01:00:00.000Z',
    );

    expect(permanentlyReserved).toMatchObject({
      commerceReference: validReferenceFixture,
      commerceProfileId: 'profile-a',
      lifecycle: 'PERMANENTLY_RESERVED',
      assignedAt,
      updatedAt: '2026-08-26T01:00:00.000Z',
    });
  });

  it('rejects releasing, reusing, or reassigning a permanently reserved reference', () => {
    const permanentlyReserved = permanentlyReserveCommerceReference(
      assignReference(),
      '2026-08-26T01:00:00.000Z',
    );

    expect(() =>
      permanentlyReserveCommerceReference(permanentlyReserved, '2026-08-26T02:00:00.000Z'),
    ).toThrow(DomainTransitionError);
    expect(() =>
      assignReference({
        profileValue: 'profile-b',
        assignedReferences: [permanentlyReserved],
      }),
    ).toThrow('Commerce Reference is already assigned.');
  });

  it('does not provide ordinary mutation operations for reference values or Profile targets', () => {
    const assignedReference = assignReference();

    expect(assignedReference).toMatchObject({
      commerceReference: validReferenceFixture,
      commerceProfileId: 'profile-a',
    });
  });

  it('keeps Commerce Reference isolated from all other identity and binding namespaces', () => {
    const reference = createCommerceReference(validReferenceFixture);
    const accountId = createAuthenticationAccountId('account-a');
    const identityId = createInternalIdentityId('identity-a');
    const profileId = createCommerceProfileId('profile-a');
    const externalAccountId = createExternalPlatformAccountId('external-account-a');
    const relationshipId = createCommerceRelationshipId('relationship-a');

    acceptsCommerceReference(reference);

    // @ts-expect-error Authentication Account ID is not a Commerce Reference.
    acceptsCommerceReference(accountId);
    // @ts-expect-error Internal Identity ID is not a Commerce Reference.
    acceptsCommerceReference(identityId);
    // @ts-expect-error Commerce Profile ID is not a Commerce Reference.
    acceptsCommerceReference(profileId);
    // @ts-expect-error External Platform Account ID is not a Commerce Reference.
    acceptsCommerceReference(externalAccountId);
    // @ts-expect-error Commerce Relationship ID is not a Commerce Reference.
    acceptsCommerceReference(relationshipId);
    // @ts-expect-error Commerce Reference is not an Internal Identity ID.
    acceptsInternalIdentityId(reference);
    // @ts-expect-error Commerce Reference is not a Commerce Profile ID.
    acceptsCommerceProfileId(reference);
  });
});

function acceptsCommerceReference(value: CommerceReference): void {
  void value;
}

function acceptsInternalIdentityId(value: InternalIdentityId): void {
  void value;
}

function acceptsCommerceProfileId(value: CommerceProfileId): void {
  void value;
}
