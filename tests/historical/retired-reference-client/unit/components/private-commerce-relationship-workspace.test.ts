import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  CommerceRelationshipList,
  type PrivateCommerceRelationship,
} from './private-commerce-relationship-workspace';

describe('CommerceRelationshipList', () => {
  it('shows profile-account relationship history without mutation controls', () => {
    const markup = renderToStaticMarkup(
      createElement(CommerceRelationshipList, {
        relationships: [
          relationship(
            'relationship-history',
            'profile-studio-a',
            'Studio A',
            'instagram',
            'studio-a',
            'MANAGER',
            'HISTORICAL',
          ),
          relationship(
            'relationship-active',
            'profile-studio-a',
            'Studio A',
            'tiktok',
            'studio-a-tiktok',
            'DELEGATED_MANAGER',
            'ACTIVE',
          ),
          relationship(
            'relationship-brand',
            'profile-brand-a',
            'Brand A',
            'instagram',
            'brand-a',
            'OWNER',
            'ACTIVE',
          ),
        ],
      }),
    );

    expect(markup).toContain('Studio A');
    expect(markup).toContain('instagram Account');
    expect(markup).toContain('tiktok Account');
    expect(markup.match(/Studio A/g)).toHaveLength(1);
    expect(markup).toContain('Role: Manager');
    expect(markup).toContain('Relationship Status: Historical');
    expect(markup).toContain('Role: Delegated Manager');
    expect(markup).not.toMatch(/<button/iu);
    expect(markup).not.toMatch(/bind|unbind|connect|verify|change role|delete/iu);
  });

  it('shows the read-only empty state', () => {
    expect(
      renderToStaticMarkup(createElement(CommerceRelationshipList, { relationships: [] })),
    ).toContain('No commerce relationships.');
  });
});

function relationship(
  relationshipId: string,
  commerceProfileId: string,
  displayName: string,
  platform: string,
  platformAccountId: string,
  role: PrivateCommerceRelationship['role'],
  lifecycle: PrivateCommerceRelationship['lifecycle'],
): PrivateCommerceRelationship {
  return {
    relationshipId,
    profile: { commerceProfileId, displayName },
    externalPlatformAccount: { platform, platformAccountId, lifecycle: 'ACTIVE' },
    role,
    provenance: 'SELF_DECLARED',
    lifecycle,
    effectiveAt: '2026-08-27T00:00:00.000Z',
    createdAt: '2026-08-27T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z',
  };
}
