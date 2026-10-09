'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { privateCommerceRelationshipCopy } from '../content/user-facing-copy';
import { loadWebConfiguration } from '../configuration/bootstrap';
import type { AccessTokenProvider } from '../lib/api/authentication';
import { createApiClient } from '../lib/api/client';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';

export interface PrivateCommerceRelationship {
  readonly relationshipId: string;
  readonly profile: {
    readonly commerceProfileId: string;
    readonly displayName: string;
  };
  readonly externalPlatformAccount: {
    readonly platform: string;
    readonly platformAccountId: string;
    readonly lifecycle: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  };
  readonly role: 'OWNER' | 'MANAGER' | 'DELEGATED_MANAGER';
  readonly provenance: 'SELF_DECLARED' | 'PLATFORM_VERIFIED' | 'UNKNOWN';
  readonly lifecycle: 'PROPOSED' | 'VERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'HISTORICAL';
  readonly effectiveAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function PrivateCommerceRelationshipWorkspace({
  accessTokenProvider,
}: {
  readonly accessTokenProvider: AccessTokenProvider;
}) {
  const [relationships, setRelationships] = useState<readonly PrivateCommerceRelationship[]>([]);
  const [message, setMessage] = useState<string>(privateCommerceRelationshipCopy.genericLoadFailed);
  const client = useMemo(
    () =>
      createApiClient({
        apiBaseUrl: loadWebConfiguration().apiBaseUrl,
        accessTokenProvider,
      }),
    [accessTokenProvider],
  );

  const loadRelationships = useCallback(async (): Promise<void> => {
    const response = await client.GET('/api/v1/private/commerce-relationships');
    if (response.data === undefined) {
      setMessage(privateCommerceRelationshipCopy.genericLoadFailed);
      return;
    }
    setRelationships(response.data.relationships);
    setMessage('');
  }, [client]);

  useEffect(() => {
    void loadRelationships();
  }, [loadRelationships]);

  return (
    <Surface aria-labelledby="private-commerce-relationships-heading" tone="raised">
      <p className="ds-eyebrow">{privateCommerceRelationshipCopy.eyebrow}</p>
      <h2 className="ds-heading-section" id="private-commerce-relationships-heading">
        {privateCommerceRelationshipCopy.title}
      </h2>
      {message.length > 0 ? <StatusMessage>{message}</StatusMessage> : null}
      <CommerceRelationshipList relationships={relationships} />
    </Surface>
  );
}

export function CommerceRelationshipList({
  relationships,
}: {
  readonly relationships: readonly PrivateCommerceRelationship[];
}) {
  if (relationships.length === 0) {
    return <p>{privateCommerceRelationshipCopy.empty}</p>;
  }

  return (
    <ul>
      {groupRelationshipsByProfile(relationships).map(
        ([commerceProfileId, profileRelationships]) => (
          <li key={commerceProfileId}>
            <strong>{profileRelationships[0]?.profile.displayName}</strong>
            <ul>
              {profileRelationships.map((relationship) => (
                <li key={relationship.relationshipId}>
                  <span>
                    {relationship.externalPlatformAccount.platform}{' '}
                    {privateCommerceRelationshipCopy.accountSuffix}{' '}
                  </span>
                  <span>{relationship.externalPlatformAccount.platformAccountId}</span>
                  <span>
                    {privateCommerceRelationshipCopy.rolePrefix}
                    {formatRole(relationship.role)}
                  </span>
                  <span>
                    {privateCommerceRelationshipCopy.statusPrefix}
                    {formatLifecycle(relationship.lifecycle)}
                  </span>
                  <span>Provenance: {formatProvenance(relationship.provenance)}</span>
                </li>
              ))}
            </ul>
          </li>
        ),
      )}
    </ul>
  );
}

function groupRelationshipsByProfile(
  relationships: readonly PrivateCommerceRelationship[],
): readonly [string, readonly PrivateCommerceRelationship[]][] {
  const relationshipsByProfile = new Map<string, PrivateCommerceRelationship[]>();
  for (const relationship of relationships) {
    const profileRelationships = relationshipsByProfile.get(relationship.profile.commerceProfileId);
    if (profileRelationships === undefined) {
      relationshipsByProfile.set(relationship.profile.commerceProfileId, [relationship]);
      continue;
    }
    profileRelationships.push(relationship);
  }
  return [...relationshipsByProfile.entries()];
}

function formatRole(role: PrivateCommerceRelationship['role']): string {
  if (role === 'DELEGATED_MANAGER') {
    return 'Delegated Manager';
  }
  return role[0] + role.slice(1).toLowerCase();
}

function formatLifecycle(lifecycle: PrivateCommerceRelationship['lifecycle']): string {
  return lifecycle[0] + lifecycle.slice(1).toLowerCase();
}

function formatProvenance(provenance: PrivateCommerceRelationship['provenance']): string {
  if (provenance === 'SELF_DECLARED') {
    return 'Self-declared';
  }
  if (provenance === 'PLATFORM_VERIFIED') {
    return 'Platform-verified';
  }
  return 'Unknown';
}
