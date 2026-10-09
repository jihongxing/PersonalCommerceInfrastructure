import type {
  LegacySubjectMapping,
  LegacySubjectMappingState,
  LegacySubjectMappingFailureCode,
} from '../../modules/legacy-subject-mapping/legacy-subject-mapping.js';

export class LegacySubjectMappingAlreadyExistsError extends Error {
  public constructor(legacySubjectReference: string) {
    super(`Legacy subject mapping for ${legacySubjectReference} already exists.`);
    this.name = 'LegacySubjectMappingAlreadyExistsError';
  }
}

export class LegacySubjectMappingConflictError extends Error {
  public constructor(legacySubjectReference: string) {
    super(
      `Legacy subject mapping for ${legacySubjectReference} conflicts with the requested target.`,
    );
    this.name = 'LegacySubjectMappingConflictError';
  }
}

export interface LegacySubjectMappingRepository {
  create(mapping: LegacySubjectMapping): Promise<LegacySubjectMapping>;
  findByLegacySubject(legacySubjectReference: string): Promise<LegacySubjectMapping | undefined>;
  findByIdentity(identityId: string): Promise<readonly LegacySubjectMapping[]>;
  findByInitialCommerceProfile(commerceProfileId: string): Promise<readonly LegacySubjectMapping[]>;
  findHistoricalByLegacySubject(
    legacySubjectReference: string,
  ): Promise<LegacySubjectMapping | undefined>;
  updateState(
    mappingId: string,
    state: LegacySubjectMappingState,
    updatedAt: string,
    metadata?: {
      readonly verifiedAt?: string;
      readonly mappingFailureCode?: LegacySubjectMappingFailureCode;
    },
  ): Promise<LegacySubjectMapping>;
}
