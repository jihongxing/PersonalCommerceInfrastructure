'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { privateCommerceProfileCopy } from '../content/user-facing-copy';
import type { AccessTokenProvider } from '../lib/api/authentication';
import { createApiClient } from '../lib/api/client';
import { copyCanonicalCommerceReference } from '../lib/commerce-reference-copy';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';

type PrivateCommerceProfile = {
  readonly commerceProfileId: string;
  readonly displayName: string;
  readonly lifecycle: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  readonly commerceReference?: string;
  readonly commerceReferenceDisplayValue?: string;
};

export type PrivateCommerceReference =
  | {
      readonly assignmentStatus: 'ASSIGNED';
      readonly commerceReference: string;
      readonly displayValue: string;
    }
  | {
      readonly assignmentStatus: 'NOT_ASSIGNED';
    };

export function PrivateCommerceProfileWorkspace({
  accessTokenProvider,
}: {
  readonly accessTokenProvider: AccessTokenProvider;
}) {
  const [profiles, setProfiles] = useState<readonly PrivateCommerceProfile[]>([]);
  const [referencesByProfileId, setReferencesByProfileId] = useState<
    Readonly<Record<string, PrivateCommerceReference>>
  >({});
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState<string>(privateCommerceProfileCopy.genericLoadFailed);
  const [createdReference, setCreatedReference] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const client = useMemo(
    () =>
      createApiClient({
        apiBaseUrl: loadWebConfiguration().apiBaseUrl,
        accessTokenProvider,
      }),
    [accessTokenProvider],
  );

  const loadProfiles = useCallback(async (): Promise<void> => {
    const response = await client.GET('/api/v1/private/profiles');
    if (response.data === undefined) {
      setMessage(privateCommerceProfileCopy.genericLoadFailed);
      return;
    }
    setProfiles(response.data.profiles);
    const references = await Promise.all(
      response.data.profiles.map(async (profile) => {
        const referenceResponse = await client.GET(
          '/api/v1/private/profiles/{profileId}/reference',
          { params: { path: { profileId: profile.commerceProfileId } } },
        );
        if (referenceResponse.data === undefined) {
          throw new Error(privateCommerceProfileCopy.genericReferenceFailed);
        }
        return [
          profile.commerceProfileId,
          referenceResponse.data,
        ] as const;
      }),
    );
    setReferencesByProfileId(Object.fromEntries(references));
    setMessage('');
  }, [client]);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  async function createProfile(): Promise<void> {
    setBusy(true);
    const response = await client.POST('/api/v1/private/profiles', {
      body: { displayName },
    });
    if (response.data === undefined) {
      setMessage(privateCommerceProfileCopy.genericCreateFailed);
    } else {
      setDisplayName('');
      setCreatedReference(response.data.commerceReferenceDisplayValue ?? null);
      await loadProfiles();
      setMessage(privateCommerceProfileCopy.created);
    }
    setBusy(false);
  }

  async function updateProfile(profileId: string, nextDisplayName: string): Promise<void> {
    setBusy(true);
    const response = await client.PATCH('/api/v1/private/profiles/{profileId}', {
      params: { path: { profileId } },
      body: { displayName: nextDisplayName },
    });
    if (response.data === undefined) {
      setMessage(privateCommerceProfileCopy.genericUpdateFailed);
    } else {
      await loadProfiles();
      setMessage(privateCommerceProfileCopy.updated);
    }
    setBusy(false);
  }

  async function changeLifecycle(
    profileId: string,
    action: 'suspend' | 'archive' | 'reactivate',
  ): Promise<void> {
    setBusy(true);
    const response =
      action === 'suspend'
        ? await client.POST('/api/v1/private/profiles/{profileId}/suspend', {
            params: { path: { profileId } },
          })
        : action === 'archive'
          ? await client.POST('/api/v1/private/profiles/{profileId}/archive', {
              params: { path: { profileId } },
            })
          : await client.POST('/api/v1/private/profiles/{profileId}/reactivate', {
              params: { path: { profileId } },
            });
    if (response.data === undefined) {
      setMessage(privateCommerceProfileCopy.genericLifecycleFailed);
    } else {
      await loadProfiles();
      setMessage(privateCommerceProfileCopy.lifecycleChanged[action]);
    }
    setBusy(false);
  }

  return (
    <Surface aria-labelledby="private-commerce-profiles-heading" tone="raised">
      <p className="ds-eyebrow">{privateCommerceProfileCopy.eyebrow}</p>
      <h2 className="ds-heading-section" id="private-commerce-profiles-heading">
        {privateCommerceProfileCopy.title}
      </h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void createProfile();
        }}
      >
        <label htmlFor="new-commerce-profile-display-name">
          {privateCommerceProfileCopy.displayNameLabel}
        </label>
        <input
          id="new-commerce-profile-display-name"
          onChange={(event) => setDisplayName(event.target.value)}
          required
          value={displayName}
        />
          <button disabled={busy} type="submit">{privateCommerceProfileCopy.create}</button>
      </form>
      {message.length === 0 ? null : <StatusMessage tone="info">{message}</StatusMessage>}
      {createdReference === null ? null : (
        <p>
          {privateCommerceProfileCopy.referenceLabel}
          <code>{createdReference}</code>{' '}
          <button
            onClick={() => {
              void copyCanonicalCommerceReference(
                navigator.clipboard,
                createdReference.replaceAll('-', ''),
              )
                .then(() => setMessage(privateCommerceProfileCopy.copied))
                .catch(() => setMessage(privateCommerceProfileCopy.copyFailed));
            }}
            type="button"
          >
            {privateCommerceProfileCopy.copyReference}
          </button>
        </p>
      )}
      <ul>
        {profiles.map((profile) => (
          <ProfileRow
            busy={busy}
            key={profile.commerceProfileId}
            onLifecycle={changeLifecycle}
            onUpdate={updateProfile}
            profile={profile}
            reference={referencesByProfileId[profile.commerceProfileId]}
          />
        ))}
      </ul>
    </Surface>
  );
}

function ProfileRow({
  busy,
  onLifecycle,
  onUpdate,
  profile,
  reference,
}: {
  readonly busy: boolean;
  readonly onLifecycle: (
    profileId: string,
    action: 'suspend' | 'archive' | 'reactivate',
  ) => Promise<void>;
  readonly onUpdate: (profileId: string, displayName: string) => Promise<void>;
  readonly profile: PrivateCommerceProfile;
  readonly reference: PrivateCommerceReference | undefined;
}) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);

  if (editing) {
    return (
      <li>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onUpdate(profile.commerceProfileId, displayName).then(() => setEditing(false));
          }}
        >
          <label htmlFor={`commerce-profile-${profile.commerceProfileId}`}>
            {privateCommerceProfileCopy.displayNameLabel}
          </label>
          <input
            id={`commerce-profile-${profile.commerceProfileId}`}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            value={displayName}
          />
          <button disabled={busy} type="submit">
            {privateCommerceProfileCopy.save}
          </button>
        </form>
      </li>
    );
  }

  return (
    <li>
      <strong>{profile.displayName}</strong> <span>{profile.lifecycle}</span>
      <CommerceReferenceView reference={reference} />
      {profile.lifecycle === 'ACTIVE' ? (
        <>
          <button disabled={busy} onClick={() => setEditing(true)} type="button">
            {privateCommerceProfileCopy.editDisplayName}
          </button>
          <button
            disabled={busy}
            onClick={() => void onLifecycle(profile.commerceProfileId, 'suspend')}
            type="button"
          >
            {privateCommerceProfileCopy.suspend}
          </button>
        </>
      ) : null}
      {profile.lifecycle === 'SUSPENDED' ? (
        <button
          disabled={busy}
          onClick={() => void onLifecycle(profile.commerceProfileId, 'reactivate')}
          type="button"
        >
          {privateCommerceProfileCopy.reactivate}
        </button>
      ) : null}
      {profile.lifecycle !== 'ARCHIVED' ? (
        <button
          disabled={busy}
          onClick={() => void onLifecycle(profile.commerceProfileId, 'archive')}
          type="button"
        >
          {privateCommerceProfileCopy.archive}
        </button>
      ) : null}
    </li>
  );
}

export function CommerceReferenceView({
  reference,
}: {
  readonly reference: PrivateCommerceReference | undefined;
}) {
  const [message, setMessage] = useState('');

  if (reference === undefined) {
    return null;
  }
  if (reference.assignmentStatus === 'NOT_ASSIGNED') {
    return <p>{privateCommerceProfileCopy.noReference}</p>;
  }

  return (
    <p>
      <span>
        {privateCommerceProfileCopy.referenceLabel}
        <code>{reference.displayValue}</code>
      </span>{' '}
          <button
        onClick={() => {
          void copyCanonicalCommerceReference(navigator.clipboard, reference.commerceReference)
            .then(() => setMessage(privateCommerceProfileCopy.copied))
            .catch(() => setMessage(privateCommerceProfileCopy.copyFailed));
        }}
        type="button"
      >
        {privateCommerceProfileCopy.copyReference}
      </button>
      {message.length > 0 ? <span> {message}</span> : null}
    </p>
  );
}
