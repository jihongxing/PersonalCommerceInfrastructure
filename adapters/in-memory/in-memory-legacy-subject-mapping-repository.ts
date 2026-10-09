import {
  LegacySubjectMappingConflictError,
  LegacySubjectMappingAlreadyExistsError,
  type LegacySubjectMappingRepository,
} from '../../applications/legacy-subject-mapping/legacy-subject-mapping-repositories.js';
import {
  isEffectiveLegacySubjectMapping,
  type LegacySubjectMapping,
  type LegacySubjectMappingFailureCode,
  type LegacySubjectMappingState,
  transitionLegacySubjectMapping,
} from '../../modules/legacy-subject-mapping/legacy-subject-mapping.js';
import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryLegacySubjectMappingRepository
  implements LegacySubjectMappingRepository, TransactionParticipant
{
  private readonly mappings = new Map<string, LegacySubjectMapping>();

  public create(mapping: LegacySubjectMapping): Promise<LegacySubjectMapping> {
    const existing = [...this.mappings.values()].find(
      (candidate) => candidate.legacySubjectReference === mapping.legacySubjectReference,
    );
    if (existing !== undefined) {
      if (
        existing.identityId === mapping.identityId &&
        existing.initialCommerceProfileId === mapping.initialCommerceProfileId
      ) {
        return Promise.resolve(structuredClone(existing));
      }
      return Promise.reject(new LegacySubjectMappingConflictError(mapping.legacySubjectReference));
    }
    if (this.mappings.has(mapping.mappingId)) {
      return Promise.reject(
        new LegacySubjectMappingAlreadyExistsError(mapping.legacySubjectReference),
      );
    }
    if (
      [...this.mappings.values()].some(
        (candidate) =>
          candidate.initialCommerceProfileId === mapping.initialCommerceProfileId ||
          (candidate.identityId === mapping.identityId &&
            candidate.initialCommerceProfileId === mapping.initialCommerceProfileId),
      )
    ) {
      return Promise.reject(new LegacySubjectMappingAlreadyExistsError(mapping.mappingId));
    }
    this.mappings.set(mapping.mappingId, structuredClone(mapping));
    return Promise.resolve(structuredClone(mapping));
  }

  public findByLegacySubject(
    legacySubjectReference: string,
  ): Promise<LegacySubjectMapping | undefined> {
    const mapping = [...this.mappings.values()].find(
      (candidate) =>
        candidate.legacySubjectReference === legacySubjectReference &&
        isEffectiveLegacySubjectMapping(candidate),
    );
    return Promise.resolve(mapping === undefined ? undefined : structuredClone(mapping));
  }

  public findByIdentity(identityId: string): Promise<readonly LegacySubjectMapping[]> {
    return Promise.resolve(
      [...this.mappings.values()]
        .filter((mapping) => mapping.identityId === identityId)
        .map((mapping) => structuredClone(mapping)),
    );
  }

  public findByInitialCommerceProfile(
    commerceProfileId: string,
  ): Promise<readonly LegacySubjectMapping[]> {
    return Promise.resolve(
      [...this.mappings.values()]
        .filter((mapping) => mapping.initialCommerceProfileId === commerceProfileId)
        .map((mapping) => structuredClone(mapping)),
    );
  }

  public findHistoricalByLegacySubject(
    legacySubjectReference: string,
  ): Promise<LegacySubjectMapping | undefined> {
    const mapping = [...this.mappings.values()].find(
      (candidate) => candidate.legacySubjectReference === legacySubjectReference,
    );
    return Promise.resolve(mapping === undefined ? undefined : structuredClone(mapping));
  }

  public updateState(
    mappingId: string,
    state: LegacySubjectMappingState,
    updatedAt: string,
    metadata: {
      readonly verifiedAt?: string;
      readonly mappingFailureCode?: LegacySubjectMappingFailureCode;
    } = {},
  ): Promise<LegacySubjectMapping> {
    const mapping = this.mappings.get(mappingId);
    if (mapping === undefined) {
      return Promise.reject(new Error(`Legacy subject mapping ${mappingId} not found.`));
    }
    const updated = transitionLegacySubjectMapping(mapping, state, updatedAt, metadata);
    this.mappings.set(mappingId, updated);
    return Promise.resolve(structuredClone(updated));
  }

  public createSnapshot(): unknown {
    return structuredClone(this.mappings);
  }

  public restoreSnapshot(snapshot: unknown): void {
    this.mappings.clear();
    for (const [mappingId, mapping] of structuredClone(
      snapshot as Map<string, LegacySubjectMapping>,
    )) {
      this.mappings.set(mappingId, mapping);
    }
  }
}
