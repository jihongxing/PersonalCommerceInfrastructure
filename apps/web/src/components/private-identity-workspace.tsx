'use client';

import { useEffect, useState } from 'react';

import { privateIdentityCopy } from '../content/user-facing-copy';
import type { AccessTokenProvider } from '../lib/api/authentication';
import { loadWebConfiguration } from '../configuration/bootstrap';
import { createApiClient } from '../lib/api/client';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';

export function PrivateIdentityWorkspace({
  accessTokenProvider,
}: {
  readonly accessTokenProvider: AccessTokenProvider;
}) {
  const [identity, setIdentity] = useState<{
    readonly identityId: string;
    readonly status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
    readonly createdAt: string;
  } | null>(null);
  const [initializedThisSession, setInitializedThisSession] = useState(false);
  const [message, setMessage] = useState<string>(privateIdentityCopy.loading);

  useEffect(() => {
    let cancelled = false;
    const client = createApiClient({
      apiBaseUrl: loadWebConfiguration().apiBaseUrl,
      accessTokenProvider,
    });

    void client.GET('/api/v1/private/identity').then(async ({ data, error }) => {
      if (cancelled) {
        return;
      }
      if (data !== undefined) {
        setIdentity(data);
        setMessage('');
        return;
      }
      if (error?.error.code === 'active_identity_binding_not_found') {
        const initialized = await client.POST('/api/v1/private/onboarding/initialize');
        if (cancelled) {
          return;
        }
        if (initialized.data !== undefined) {
          setIdentity(initialized.data);
          setInitializedThisSession(true);
          setMessage('');
          return;
        }
        setMessage(
          privateIdentityCopy.initializationFailed,
        );
        return;
      }
      setMessage(privateIdentityCopy.unavailable);
    });

    return () => {
      cancelled = true;
    };
  }, [accessTokenProvider]);

  return (
    <Surface aria-labelledby="private-identity-heading" tone="raised">
      <p className="ds-eyebrow">{privateIdentityCopy.eyebrow}</p>
      <h2 className="ds-heading-section" id="private-identity-heading">
        {privateIdentityCopy.title}
      </h2>
      {identity === null ? (
        <StatusMessage tone={message.includes('not available') ? 'error' : 'info'}>
          {message}
        </StatusMessage>
      ) : (
        <>
          <dl className="ds-definition-list">
            <div>
              <dt>{privateIdentityCopy.identityIdLabel}</dt>
              <dd>{identity.identityId}</dd>
            </div>
            <div>
              <dt>{privateIdentityCopy.statusLabel}</dt>
              <dd>{identity.status}</dd>
            </div>
            <div>
              <dt>{privateIdentityCopy.createdLabel}</dt>
              <dd>{new Date(identity.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
          {initializedThisSession ? (
            <div className="ds-stack">
              <p>{privateIdentityCopy.welcome}</p>
              <p>{privateIdentityCopy.ready}</p>
              <p>{privateIdentityCopy.nextStep}</p>
            </div>
          ) : null}
        </>
      )}
    </Surface>
  );
}
