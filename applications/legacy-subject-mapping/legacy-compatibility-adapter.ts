import type { AccountContext } from '../core/account-context.js';
import { ApplicationError } from '../core/application-error.js';
import type { IdentityProfileAuthorizationPolicy } from '../core/identity-profile-authorization-policy.js';
import type { CommerceProfileRepository } from '../commerce-profile/commerce-profile-repositories.js';
import type { IdentityRepository } from '../identity/identity-repositories.js';
import {
  isEffectiveLegacySubjectMapping,
  type LegacySubjectMapping,
  type LegacySubjectMappingState,
} from '../../modules/legacy-subject-mapping/legacy-subject-mapping.js';
import type { LegacySubjectMappingRepository } from './legacy-subject-mapping-repositories.js';

export interface LegacyCompatibilityContext {
  readonly legacySubjectReference: string;
  readonly mappingId: string;
  readonly identityId: string;
  readonly initialCommerceProfileId: string;
  readonly mappingState: LegacySubjectMappingState;
  readonly identityLifecycle: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  readonly profileLifecycle: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  readonly resolutionSource: 'LEGACY_SUBJECT_MAPPING';
}

export interface LegacyCompatibilityAdapter {
  resolveByLegacySubject(legacySubjectReference: string): Promise<LegacyCompatibilityContext>;
  resolveForMutation(
    accountContext: AccountContext,
    legacySubjectReference: string,
  ): Promise<LegacyCompatibilityContext>;
}

export function createLegacyCompatibilityAdapter(dependencies: {
  readonly legacySubjectMappingRepository: LegacySubjectMappingRepository;
  readonly identityRepository: IdentityRepository;
  readonly commerceProfileRepository: CommerceProfileRepository;
  readonly authorizationPolicy: IdentityProfileAuthorizationPolicy;
}): LegacyCompatibilityAdapter {
  return {
    resolveByLegacySubject(legacySubjectReference) {
      return resolveMapping(dependencies, legacySubjectReference);
    },

    async resolveForMutation(accountContext, legacySubjectReference) {
      const context = await resolveMapping(dependencies, legacySubjectReference);
      try {
        await dependencies.authorizationPolicy.authorizeProfileMutation(
          accountContext,
          context.identityId,
          context.initialCommerceProfileId,
          'LEGACY_COMPATIBILITY_MUTATION',
        );
      } catch (error) {
        if (
          error instanceof ApplicationError &&
          (error.code === 'context_access_denied' || error.code === 'context_membership_not_active')
        ) {
          throw new ApplicationError({
            category: 'authorization',
            code: 'compatibility_access_denied',
            message: 'An active OWNER membership is required for compatibility mutation.',
            cause: error,
          });
        }
        throw error;
      }
      return context;
    },
  };
}

async function resolveMapping(
  dependencies: {
    readonly legacySubjectMappingRepository: LegacySubjectMappingRepository;
    readonly identityRepository: IdentityRepository;
    readonly commerceProfileRepository: CommerceProfileRepository;
  },
  legacySubjectReference: string,
): Promise<LegacyCompatibilityContext> {
  const normalizedReference = legacySubjectReference.trim();
  if (normalizedReference.length === 0) {
    throw new ApplicationError({
      category: 'validation',
      code: 'compatibility_not_resolvable',
      message: 'A legacy subject reference is required.',
    });
  }

  const mapping =
    await dependencies.legacySubjectMappingRepository.findByLegacySubject(normalizedReference);
  if (mapping === undefined) {
    const historicalMapping =
      await dependencies.legacySubjectMappingRepository.findHistoricalByLegacySubject(
        normalizedReference,
      );
    throw mappingStateError(historicalMapping);
  }
  if (!isEffectiveLegacySubjectMapping(mapping)) {
    throw mappingStateError(mapping);
  }

  const identity = await dependencies.identityRepository.findById(mapping.identityId);
  const profile = await dependencies.commerceProfileRepository.findById(
    mapping.initialCommerceProfileId,
  );
  if (
    identity === undefined ||
    profile === undefined ||
    profile.identityId !== identity.identityId
  ) {
    throw new ApplicationError({
      category: 'conflict',
      code: 'compatibility_mapping_invalid',
      message: 'Legacy subject mapping points to an invalid Identity or Commerce Profile.',
    });
  }

  return toContext(mapping, identity.lifecycle, profile.lifecycle);
}

function mappingStateError(mapping: LegacySubjectMapping | undefined): ApplicationError {
  if (mapping === undefined) {
    return new ApplicationError({
      category: 'not_found',
      code: 'compatibility_not_mapped',
      message: 'Legacy subject is not mapped.',
    });
  }
  const details =
    mapping.state === 'AMBIGUOUS'
      ? {
          code: 'compatibility_mapping_ambiguous',
          message: 'Legacy subject mapping requires manual review.',
        }
      : mapping.state === 'FAILED'
        ? {
            code: 'compatibility_mapping_failed',
            message: 'Legacy subject mapping failed and cannot be resolved automatically.',
          }
        : {
            code: 'compatibility_mapping_retired',
            message: 'Legacy subject mapping is retired and cannot be used.',
          };
  return new ApplicationError({
    category: 'authorization',
    code: details.code,
    message: details.message,
  });
}

function toContext(
  mapping: LegacySubjectMapping,
  identityLifecycle: LegacyCompatibilityContext['identityLifecycle'],
  profileLifecycle: LegacyCompatibilityContext['profileLifecycle'],
): LegacyCompatibilityContext {
  return {
    legacySubjectReference: mapping.legacySubjectReference,
    mappingId: mapping.mappingId,
    identityId: mapping.identityId,
    initialCommerceProfileId: mapping.initialCommerceProfileId,
    mappingState: mapping.state,
    identityLifecycle,
    profileLifecycle,
    resolutionSource: 'LEGACY_SUBJECT_MAPPING',
  };
}
