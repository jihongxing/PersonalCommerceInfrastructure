export interface Capability {
  id: string;
  name: string;
  description: string;
  catalogItemId?: string;
  catalogStatus?: 'active' | 'custom_request' | 'retired';
  policyVersion?: string;
}

export interface CreatorIdentityResponse {
  creatorId: string;
  profile: {
    displayName: string;
    bio: string;
    avatarUrl?: string;
    location?: string;
    socialLinks: string[];
  };
  capabilityIds: string[];
  capabilities: Capability[];
  state: 'draft' | 'published' | 'unpublished';
}

export type MissingPublishCondition =
  'title' | 'description' | 'capability' | 'availability' | 'request_instructions';
