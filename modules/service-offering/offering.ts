import { DomainTransitionError } from '../shared/domain-error.js';

export type OfferingState = 'draft' | 'published' | 'unpublished' | 'archived';

export interface RequestableAvailability {
  readonly description: string;
}

export interface Offering {
  readonly id: string;
  readonly creatorId: string;
  readonly capabilityIds: readonly string[];
  readonly title: string;
  readonly description: string;
  readonly availability?: RequestableAvailability;
  readonly requestInstructions: string;
  readonly state: OfferingState;
}

export interface OfferingDraftInput {
  readonly capabilityIds: readonly string[];
  readonly title: string;
  readonly description: string;
  readonly availabilityDescription?: string;
  readonly requestInstructions: string;
}

export type MissingPublishCondition =
  'title' | 'description' | 'capability' | 'availability' | 'request_instructions';

export function createDraftOffering(
  id: string,
  creatorId: string,
  input: OfferingDraftInput,
): Offering {
  return {
    id,
    creatorId,
    capabilityIds: uniqueNonEmptyValues(input.capabilityIds),
    title: input.title.trim(),
    description: input.description.trim(),
    ...(input.availabilityDescription?.trim() === undefined ||
    input.availabilityDescription.trim().length === 0
      ? {}
      : { availability: { description: input.availabilityDescription.trim() } }),
    requestInstructions: input.requestInstructions.trim(),
    state: 'draft',
  };
}

export function updateOffering(offering: Offering, input: OfferingDraftInput): Offering {
  if (offering.state === 'archived') {
    throw new DomainTransitionError('Offering', offering.state, 'edit');
  }

  const availabilityDescription = input.availabilityDescription?.trim();
  const updatedOffering = {
    ...offering,
    capabilityIds: uniqueNonEmptyValues(input.capabilityIds),
    title: input.title.trim(),
    description: input.description.trim(),
    requestInstructions: input.requestInstructions.trim(),
  };

  if (availabilityDescription === undefined || availabilityDescription.length === 0) {
    return {
      id: updatedOffering.id,
      creatorId: updatedOffering.creatorId,
      capabilityIds: updatedOffering.capabilityIds,
      title: updatedOffering.title,
      description: updatedOffering.description,
      requestInstructions: updatedOffering.requestInstructions,
      state: updatedOffering.state,
    };
  }

  return {
    ...updatedOffering,
    availability: { description: availabilityDescription },
  };
}

export function missingPublishConditions(offering: Offering): readonly MissingPublishCondition[] {
  const missingConditions: MissingPublishCondition[] = [];

  if (offering.title.length === 0) {
    missingConditions.push('title');
  }
  if (offering.description.length === 0) {
    missingConditions.push('description');
  }
  if (offering.capabilityIds.length === 0) {
    missingConditions.push('capability');
  }
  if (
    offering.availability === undefined ||
    offering.availability.description.trim().length === 0
  ) {
    missingConditions.push('availability');
  }
  if (offering.requestInstructions.length === 0) {
    missingConditions.push('request_instructions');
  }

  return missingConditions;
}

export function isPublishEligible(offering: Offering): boolean {
  return missingPublishConditions(offering).length === 0;
}

export function publishOffering(offering: Offering): Offering {
  if (offering.state !== 'draft' && offering.state !== 'unpublished') {
    throw new DomainTransitionError('Offering', offering.state, 'publish');
  }

  if (!isPublishEligible(offering)) {
    throw new Error('Offering does not satisfy minimum publish conditions');
  }

  return { ...offering, state: 'published' };
}

export function unpublishOffering(offering: Offering): Offering {
  if (offering.state !== 'published') {
    throw new DomainTransitionError('Offering', offering.state, 'unpublish');
  }

  return { ...offering, state: 'unpublished' };
}

export function archiveOffering(offering: Offering): Offering {
  if (offering.state === 'archived') {
    throw new DomainTransitionError('Offering', offering.state, 'archive');
  }

  return { ...offering, state: 'archived' };
}

function uniqueNonEmptyValues(values: readonly string[]): readonly string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}
