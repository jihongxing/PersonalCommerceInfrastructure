import { DomainTransitionError } from '../shared/domain-error.js';

export type OfferingState = 'draft' | 'published' | 'unpublished' | 'archived';

export interface RequestableAvailability {
  readonly description: string;
}

export type AppearanceType = 'convention' | 'guest' | 'brand' | 'photo' | 'signing';

export type AppearanceBuyerType =
  'organizer' | 'brand' | 'fan_group' | 'approved_external_requester';

export interface AppearanceOfferingMetadata {
  readonly appearanceType: AppearanceType;
  readonly startsOn: string;
  readonly endsOn?: string;
  readonly locationDescription: string;
  readonly buyerType: AppearanceBuyerType;
  readonly pricingRule?: string;
  readonly requestCallToAction: string;
  readonly upcomingTitle: string;
  readonly externalUrl?: string;
}

export interface Offering {
  readonly id: string;
  readonly creatorId: string;
  readonly capabilityIds: readonly string[];
  readonly title: string;
  readonly description: string;
  readonly availability?: RequestableAvailability;
  readonly appearance?: AppearanceOfferingMetadata;
  readonly requestInstructions: string;
  readonly state: OfferingState;
}

export interface OfferingDraftInput {
  readonly capabilityIds: readonly string[];
  readonly title: string;
  readonly description: string;
  readonly availabilityDescription?: string;
  readonly appearance?: AppearanceOfferingMetadata;
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
    ...appearanceMetadata(input.appearance),
    requestInstructions: input.requestInstructions.trim(),
    state: 'draft',
  };
}

export function updateOffering(offering: Offering, input: OfferingDraftInput): Offering {
  if (offering.state === 'archived') {
    throw new DomainTransitionError('Offering', offering.state, 'edit');
  }

  const availabilityDescription = input.availabilityDescription?.trim();
  const appearance = appearanceMetadata(input.appearance);
  const updatedOffering = {
    id: offering.id,
    creatorId: offering.creatorId,
    capabilityIds: uniqueNonEmptyValues(input.capabilityIds),
    title: input.title.trim(),
    description: input.description.trim(),
    requestInstructions: input.requestInstructions.trim(),
    state: offering.state,
  };

  if (availabilityDescription === undefined || availabilityDescription.length === 0) {
    return {
      id: updatedOffering.id,
      creatorId: updatedOffering.creatorId,
      capabilityIds: updatedOffering.capabilityIds,
      title: updatedOffering.title,
      description: updatedOffering.description,
      ...appearance,
      requestInstructions: updatedOffering.requestInstructions,
      state: updatedOffering.state,
    };
  }

  return {
    ...updatedOffering,
    availability: { description: availabilityDescription },
    ...appearance,
  };
}

function appearanceMetadata(appearance: AppearanceOfferingMetadata | undefined): {
  readonly appearance?: AppearanceOfferingMetadata;
} {
  if (appearance === undefined) {
    return {};
  }

  const startsOn = requiredDate(appearance.startsOn, 'Appearance start date');
  const endsOn =
    appearance.endsOn === undefined
      ? undefined
      : requiredDate(appearance.endsOn, 'Appearance end date');
  if (endsOn !== undefined && endsOn < startsOn) {
    throw new Error('Appearance end date cannot be before its start date.');
  }

  const externalUrl = optionalUrl(appearance.externalUrl);
  const pricingRule = optionalText(appearance.pricingRule);
  return {
    appearance: {
      appearanceType: appearance.appearanceType,
      startsOn,
      ...(endsOn === undefined ? {} : { endsOn }),
      locationDescription: requiredText(appearance.locationDescription, 'Appearance location'),
      buyerType: appearance.buyerType,
      ...(pricingRule === undefined ? {} : { pricingRule }),
      requestCallToAction: requiredText(
        appearance.requestCallToAction,
        'Appearance request call to action',
      ),
      upcomingTitle: requiredText(appearance.upcomingTitle, 'Upcoming title'),
      ...(externalUrl === undefined ? {} : { externalUrl }),
    },
  };
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return normalized;
}

function optionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized === undefined || normalized.length === 0 ? undefined : normalized;
}

function requiredDate(value: string, label: string): string {
  const normalized = value.trim();
  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(normalized) ||
    Number.isNaN(Date.parse(`${normalized}T00:00:00Z`))
  ) {
    throw new Error(`${label} must use YYYY-MM-DD.`);
  }
  return normalized;
}

function optionalUrl(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (normalized === undefined || normalized.length === 0) {
    return undefined;
  }
  try {
    return new URL(normalized).toString();
  } catch (cause) {
    throw new Error('Appearance external URL must be valid.', { cause });
  }
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
