import { DomainTransitionError } from '../shared/domain-error.js';

export type CommerceProfileLifecycle = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export interface CommerceProfilePresentation {
  readonly displayName: string;
  readonly bio?: string;
  readonly avatarUrl?: string;
  readonly location?: string;
  readonly socialLinks: readonly string[];
}

export interface CommerceProfile {
  readonly commerceProfileId: string;
  readonly identityId: string;
  readonly lifecycle: CommerceProfileLifecycle;
  readonly presentation: CommerceProfilePresentation;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function createCommerceProfile(input: {
  readonly commerceProfileId: string;
  readonly identityId: string;
  readonly presentation: CommerceProfilePresentation;
  readonly createdAt: string;
  readonly updatedAt?: string;
}): CommerceProfile {
  requireNonEmpty(input.commerceProfileId, 'Commerce Profile ID');
  requireNonEmpty(input.identityId, 'Identity ID');
  requireNonEmpty(input.createdAt, 'Commerce Profile creation timestamp');
  requireNonEmpty(input.updatedAt ?? input.createdAt, 'Commerce Profile update timestamp');

  return {
    commerceProfileId: input.commerceProfileId,
    identityId: input.identityId,
    lifecycle: 'DRAFT',
    presentation: normalizePresentation(input.presentation),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt ?? input.createdAt,
  };
}

export function updateCommerceProfilePresentation(
  profile: CommerceProfile,
  presentation: CommerceProfilePresentation,
  updatedAt: string,
): CommerceProfile {
  requireNonEmpty(updatedAt, 'Commerce Profile update timestamp');
  if (profile.lifecycle !== 'DRAFT' && profile.lifecycle !== 'ACTIVE') {
    throw new DomainTransitionError('CommerceProfile', profile.lifecycle, 'update presentation');
  }

  return {
    ...profile,
    presentation: normalizePresentation(presentation),
    updatedAt,
  };
}

export function transitionCommerceProfile(
  profile: CommerceProfile,
  lifecycle: CommerceProfileLifecycle,
  updatedAt: string,
): CommerceProfile {
  requireNonEmpty(updatedAt, 'Commerce Profile update timestamp');
  if (profile.lifecycle === lifecycle || !isAllowedTransition(profile.lifecycle, lifecycle)) {
    throw new DomainTransitionError('CommerceProfile', profile.lifecycle, lifecycle.toLowerCase());
  }

  return {
    ...profile,
    lifecycle,
    updatedAt,
  };
}

function normalizePresentation(
  presentation: CommerceProfilePresentation,
): CommerceProfilePresentation {
  const displayName = presentation.displayName.trim();
  if (displayName.length === 0) {
    throw new TypeError('Commerce Profile display name is required.');
  }
  if (displayName.length > 256) {
    throw new TypeError('Commerce Profile display name cannot exceed 256 characters.');
  }
  const socialLinks: string[] = [];
  for (const link of presentation.socialLinks) {
    const normalizedLink = link.trim();
    if (normalizedLink.length === 0) {
      continue;
    }
    if (normalizedLink.length > 2_048) {
      throw new TypeError('Commerce Profile social links cannot exceed 2048 characters.');
    }
    socialLinks.push(normalizedLink);
  }

  const normalized: {
    displayName: string;
    bio?: string;
    avatarUrl?: string;
    location?: string;
    socialLinks: readonly string[];
  } = {
    displayName,
    socialLinks,
  };

  const bio = normalizeOptionalField('bio', presentation.bio, 2_000);
  const avatarUrl = normalizeOptionalField('avatarUrl', presentation.avatarUrl, 2_048);
  const location = normalizeOptionalField('location', presentation.location, 256);

  return {
    ...normalized,
    ...(bio === undefined ? {} : { bio }),
    ...(avatarUrl === undefined ? {} : { avatarUrl }),
    ...(location === undefined ? {} : { location }),
  };
}

function normalizeOptionalField(
  field: 'bio' | 'avatarUrl' | 'location',
  value: string | undefined,
  maximumLength: number,
): string | undefined {
  const normalized = value?.trim();
  if (normalized === undefined || normalized.length === 0) {
    return undefined;
  }
  if (normalized.length > maximumLength) {
    throw new TypeError(`Commerce Profile ${field} cannot exceed ${maximumLength} characters.`);
  }
  return normalized;
}

function isAllowedTransition(
  current: CommerceProfileLifecycle,
  next: CommerceProfileLifecycle,
): boolean {
  return (
    (current === 'DRAFT' && (next === 'ACTIVE' || next === 'ARCHIVED')) ||
    (current === 'ACTIVE' && (next === 'SUSPENDED' || next === 'ARCHIVED')) ||
    (current === 'SUSPENDED' && (next === 'ACTIVE' || next === 'ARCHIVED'))
  );
}

function requireNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new TypeError(`${field} cannot be empty.`);
  }
}
