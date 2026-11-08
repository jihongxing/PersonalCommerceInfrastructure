import { DomainTransitionError } from '../shared/domain-error.js';

export type CommerceIdentityState = 'draft' | 'published' | 'unpublished';

export interface CommerceIdentityProfile {
  readonly displayName: string;
  readonly bio: string;
  readonly avatarUrl?: string;
  readonly location?: string;
  readonly socialLinks: readonly string[];
}

export interface Capability {
  readonly id: string;
  readonly creatorId: string;
  readonly name: string;
  readonly description: string;
}

export interface CommerceIdentity {
  readonly creatorId: string;
  readonly profile: CommerceIdentityProfile;
  readonly capabilityIds: readonly string[];
  readonly state: CommerceIdentityState;
}

export function createDraftCommerceIdentity(
  creatorId: string,
  profile: CommerceIdentityProfile,
): CommerceIdentity {
  assertIdentityProfile(profile);

  return {
    creatorId,
    profile: normalizeIdentityProfile(profile),
    capabilityIds: [],
    state: 'draft',
  };
}

export function createInitialCommerceIdentity(creatorId: string, displayName: string): CommerceIdentity {
  return {
    creatorId,
    profile: { displayName: displayName.trim(), bio: '', socialLinks: [] },
    capabilityIds: [],
    state: 'draft',
  };
}

export function updateCommerceIdentity(
  identity: CommerceIdentity,
  profile: CommerceIdentityProfile,
): CommerceIdentity {
  assertIdentityProfile(profile);

  return {
    ...identity,
    profile: normalizeIdentityProfile(profile),
  };
}

export function addCapabilityToIdentity(
  identity: CommerceIdentity,
  capability: Capability,
): CommerceIdentity {
  if (capability.creatorId !== identity.creatorId) {
    throw new Error('Capability does not belong to the Commerce Identity owner');
  }

  if (identity.capabilityIds.includes(capability.id)) {
    return identity;
  }

  return {
    ...identity,
    capabilityIds: [...identity.capabilityIds, capability.id],
  };
}

export function publishCommerceIdentity(identity: CommerceIdentity): CommerceIdentity {
  if (identity.state !== 'draft' && identity.state !== 'unpublished') {
    throw new DomainTransitionError('CommerceIdentity', identity.state, 'publish');
  }

  return { ...identity, state: 'published' };
}

export function unpublishCommerceIdentity(identity: CommerceIdentity): CommerceIdentity {
  if (identity.state !== 'published') {
    throw new DomainTransitionError('CommerceIdentity', identity.state, 'unpublish');
  }

  return { ...identity, state: 'unpublished' };
}

function assertIdentityProfile(profile: CommerceIdentityProfile): void {
  if (profile.displayName.trim().length === 0) {
    throw new Error('Commerce Identity display name is required');
  }

  if (profile.bio.trim().length === 0) {
    throw new Error('Commerce Identity bio is required');
  }

  if (!Array.isArray(profile.socialLinks)) {
    throw new Error('Commerce Identity social links must be an array');
  }
}

function normalizeIdentityProfile(profile: CommerceIdentityProfile): CommerceIdentityProfile {
  const normalized: CommerceIdentityProfile = {
    displayName: profile.displayName.trim(),
    bio: profile.bio.trim(),
    socialLinks: profile.socialLinks.map((link) => link.trim()).filter((link) => link.length > 0),
  };

  const avatarUrl = profile.avatarUrl?.trim();
  if (avatarUrl !== undefined && avatarUrl.length > 0) {
    Object.assign(normalized, { avatarUrl });
  }

  const location = profile.location?.trim();
  if (location !== undefined && location.length > 0) {
    Object.assign(normalized, { location });
  }

  return normalized;
}
