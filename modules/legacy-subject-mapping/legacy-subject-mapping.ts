import { DomainTransitionError } from '../shared/domain-error.js';

export type LegacySubjectMappingState = 'ACTIVE' | 'VERIFIED' | 'AMBIGUOUS' | 'FAILED' | 'RETIRED';

export type LegacySubjectMappingFailureCode =
  | 'LEGACY_SUBJECT_NOT_FOUND'
  | 'MULTIPLE_CANDIDATES'
  | 'IDENTITY_CONFLICT'
  | 'PROFILE_CONFLICT'
  | 'LEGACY_DATA_INVALID'
  | 'MANUAL_REVIEW_REQUIRED';

export interface LegacySubjectMapping {
  readonly mappingId: string;
  readonly legacySubjectReference: string;
  readonly identityId: string;
  readonly initialCommerceProfileId: string;
  readonly state: LegacySubjectMappingState;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly verifiedAt?: string;
  readonly mappingFailureCode?: LegacySubjectMappingFailureCode;
}

export function createLegacySubjectMapping(input: {
  readonly mappingId: string;
  readonly legacySubjectReference: string;
  readonly identityId: string;
  readonly initialCommerceProfileId: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly state?: LegacySubjectMappingState;
  readonly verifiedAt?: string;
  readonly mappingFailureCode?: LegacySubjectMappingFailureCode;
}): LegacySubjectMapping {
  requireNonEmpty(input.mappingId, 'Legacy Subject Mapping ID');
  requireNonEmpty(input.legacySubjectReference, 'Legacy subject reference');
  requireNonEmpty(input.identityId, 'Identity ID');
  requireNonEmpty(input.initialCommerceProfileId, 'Initial Commerce Profile ID');
  requireNonEmpty(input.createdAt, 'Legacy Subject Mapping creation timestamp');
  requireNonEmpty(input.updatedAt ?? input.createdAt, 'Legacy Subject Mapping update timestamp');

  const legacyReference = input.legacySubjectReference.trim();
  const identityId = input.identityId.trim();
  const profileId = input.initialCommerceProfileId.trim();
  if (legacyReference === identityId || legacyReference === profileId) {
    throw new TypeError('Legacy subject reference cannot be a new-model identifier.');
  }
  if (identityId === profileId) {
    throw new TypeError('Identity ID and Commerce Profile ID must remain distinct.');
  }

  const state = input.state ?? 'ACTIVE';
  validateStateMetadata(state, input.verifiedAt, input.mappingFailureCode);

  return {
    mappingId: input.mappingId.trim(),
    legacySubjectReference: legacyReference,
    identityId,
    initialCommerceProfileId: profileId,
    state,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt ?? input.createdAt,
    ...(input.verifiedAt === undefined ? {} : { verifiedAt: input.verifiedAt }),
    ...(input.mappingFailureCode === undefined
      ? {}
      : { mappingFailureCode: input.mappingFailureCode }),
  };
}

export function transitionLegacySubjectMapping(
  mapping: LegacySubjectMapping,
  state: LegacySubjectMappingState,
  updatedAt: string,
  metadata: {
    readonly verifiedAt?: string;
    readonly mappingFailureCode?: LegacySubjectMappingFailureCode;
  } = {},
): LegacySubjectMapping {
  requireNonEmpty(updatedAt, 'Legacy Subject Mapping update timestamp');
  if (mapping.state === state || !isAllowedTransition(mapping.state, state)) {
    throw new DomainTransitionError('LegacySubjectMapping', mapping.state, state.toLowerCase());
  }
  validateStateMetadata(state, metadata.verifiedAt, metadata.mappingFailureCode);

  return {
    ...mapping,
    state,
    updatedAt,
    ...(metadata.verifiedAt === undefined ? {} : { verifiedAt: metadata.verifiedAt }),
    ...(metadata.mappingFailureCode === undefined
      ? {}
      : { mappingFailureCode: metadata.mappingFailureCode }),
  };
}

export function isEffectiveLegacySubjectMapping(mapping: LegacySubjectMapping): boolean {
  return mapping.state === 'ACTIVE' || mapping.state === 'VERIFIED';
}

function isAllowedTransition(
  current: LegacySubjectMappingState,
  next: LegacySubjectMappingState,
): boolean {
  return (
    (current === 'ACTIVE' &&
      (next === 'VERIFIED' || next === 'AMBIGUOUS' || next === 'FAILED' || next === 'RETIRED')) ||
    (current === 'VERIFIED' && next === 'RETIRED') ||
    ((current === 'AMBIGUOUS' || current === 'FAILED') && next === 'RETIRED')
  );
}

function validateStateMetadata(
  state: LegacySubjectMappingState,
  verifiedAt: string | undefined,
  mappingFailureCode: LegacySubjectMappingFailureCode | undefined,
): void {
  if (state === 'VERIFIED' && verifiedAt === undefined) {
    throw new TypeError('Verified mappings require verifiedAt.');
  }
  if ((state === 'AMBIGUOUS' || state === 'FAILED') && mappingFailureCode === undefined) {
    throw new TypeError(`${state} mappings require mappingFailureCode.`);
  }
  if (state !== 'VERIFIED' && verifiedAt !== undefined) {
    throw new TypeError('Only verified mappings may have verifiedAt.');
  }
  if (state !== 'AMBIGUOUS' && state !== 'FAILED' && mappingFailureCode !== undefined) {
    throw new TypeError('Only ambiguous or failed mappings may have mappingFailureCode.');
  }
}

function requireNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new TypeError(`${field} cannot be empty.`);
  }
}
