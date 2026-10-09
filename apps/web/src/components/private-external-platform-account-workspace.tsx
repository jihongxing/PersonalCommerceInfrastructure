'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { privateExternalPlatformAccountCopy } from '../content/user-facing-copy';
import { loadWebConfiguration } from '../configuration/bootstrap';
import type { AccessTokenProvider } from '../lib/api/authentication';
import { createApiClient } from '../lib/api/client';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { Button } from './ui/button';

export interface PrivateExternalPlatformAccount {
  readonly externalPlatformAccountId: string;
  readonly platform: string;
  readonly platformAccountId: string;
  readonly lifecycle: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
}

export function PrivateExternalPlatformAccountWorkspace({
  accessTokenProvider,
}: {
  readonly accessTokenProvider: AccessTokenProvider;
}) {
  const [accounts, setAccounts] = useState<readonly PrivateExternalPlatformAccount[]>([]);
  const [message, setMessage] = useState<string>(
    privateExternalPlatformAccountCopy.genericLoadFailed,
  );
  const [profiles, setProfiles] = useState<
    readonly {
      commerceProfileId: string;
      displayName: string;
      lifecycle: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
    }[]
  >([]);
  const [platform, setPlatform] = useState('instagram');
  const [platformAccountId, setPlatformAccountId] = useState('');
  const [profileId, setProfileId] = useState('');
  const [busy, setBusy] = useState(false);
  const client = useMemo(
    () =>
      createApiClient({
        apiBaseUrl: loadWebConfiguration().apiBaseUrl,
        accessTokenProvider,
      }),
    [accessTokenProvider],
  );

  const loadAccounts = useCallback(async (): Promise<void> => {
    const response = await client.GET('/api/v1/private/external-platform-accounts');
    if (response.data === undefined) {
      setMessage(privateExternalPlatformAccountCopy.genericLoadFailed);
      return;
    }
    setAccounts(response.data.accounts);
    const profileResponse = await client.GET('/api/v1/private/profiles');
    if (profileResponse.data !== undefined) {
      const availableProfiles = profileResponse.data.profiles.filter(
        (profile) => profile.lifecycle !== 'ARCHIVED',
      );
      setProfiles(availableProfiles);
      setProfileId((current) => current || availableProfiles[0]?.commerceProfileId || '');
    }
    setMessage('');
  }, [client]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  async function declareAccountAndRelationship(): Promise<void> {
    if (profileId.length === 0) {
      setMessage(privateExternalPlatformAccountCopy.noProfiles);
      return;
    }
    setBusy(true);
    const response = await client.POST('/api/v1/private/external-platform-relationships', {
      body: { platform, platformAccountId, commerceProfileId: profileId },
    });
    setBusy(false);
    if (response.data === undefined) {
      setMessage(privateExternalPlatformAccountCopy.declareFailed);
      return;
    }
    setPlatformAccountId('');
    await loadAccounts();
    setMessage(privateExternalPlatformAccountCopy.declared);
  }

  return (
    <Surface aria-labelledby="private-external-platform-accounts-heading" tone="raised">
      <p className="ds-eyebrow">{privateExternalPlatformAccountCopy.eyebrow}</p>
      <h2 className="ds-heading-section" id="private-external-platform-accounts-heading">
        {privateExternalPlatformAccountCopy.title}
      </h2>
      {message.length > 0 ? <StatusMessage>{message}</StatusMessage> : null}
      <ExternalPlatformAccountList accounts={accounts} />
      <div className="ds-section-stack">
        <h3 className="ds-heading-section">{privateExternalPlatformAccountCopy.addTitle}</h3>
        {profiles.length === 0 ? <p>{privateExternalPlatformAccountCopy.noProfiles}</p> : null}
        <FormField
          htmlFor="external-platform"
          label={privateExternalPlatformAccountCopy.platformLabel}
        >
          <Input
            id="external-platform"
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
          />
        </FormField>
        <FormField
          htmlFor="external-platform-account-id"
          label={privateExternalPlatformAccountCopy.platformAccountIdLabel}
        >
          <Input
            id="external-platform-account-id"
            value={platformAccountId}
            onChange={(event) => setPlatformAccountId(event.target.value)}
          />
        </FormField>
        <FormField
          htmlFor="external-platform-profile"
          label={privateExternalPlatformAccountCopy.profileLabel}
        >
          <select
            id="external-platform-profile"
            value={profileId}
            onChange={(event) => setProfileId(event.target.value)}
          >
            {profiles.map((profile) => (
              <option key={profile.commerceProfileId} value={profile.commerceProfileId}>
                {profile.displayName}
              </option>
            ))}
          </select>
        </FormField>
        <Button
          disabled={busy || profiles.length === 0 || platformAccountId.trim().length === 0}
          onClick={() => void declareAccountAndRelationship()}
          type="button"
        >
          {privateExternalPlatformAccountCopy.declare}
        </Button>
      </div>
    </Surface>
  );
}

export function ExternalPlatformAccountList({
  accounts,
}: {
  readonly accounts: readonly PrivateExternalPlatformAccount[];
}) {
  if (accounts.length === 0) {
    return <p>{privateExternalPlatformAccountCopy.empty}</p>;
  }

  return (
    <ul>
      {accounts.map((account) => (
        <li key={account.externalPlatformAccountId}>
          <strong>
            {account.platform} {privateExternalPlatformAccountCopy.accountSuffix}
          </strong>{' '}
          <span>{account.platformAccountId}</span> <span>{account.lifecycle}</span>
        </li>
      ))}
    </ul>
  );
}
