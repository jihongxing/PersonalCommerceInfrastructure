'use client';

import { useEffect, useMemo, useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { customerRequestResultCopy } from '../content/user-facing-copy';
import { createApiClient } from '../lib/api/client';
import type { operations } from '../lib/api/generated';
import { Surface } from './ui/surface';
import { StatusMessage } from './ui/status-message';

type CustomerRequestResult =
  operations['getCustomerRequestResult']['responses'][200]['content']['application/json'];

export function CustomerRequestResultWorkspace({
  resultAccessToken,
}: {
  readonly resultAccessToken: string;
}) {
  const [result, setResult] = useState<CustomerRequestResult | null>(null);
  const [message, setMessage] = useState<string>(customerRequestResultCopy.loading);
  const client = useMemo(
    () => createApiClient({ apiBaseUrl: loadWebConfiguration().apiBaseUrl }),
    [],
  );

  useEffect(() => {
    void loadResult();
  }, [resultAccessToken]);

  async function loadResult(): Promise<void> {
    try {
      const response = await client.GET('/api/v1/public/requests/{resultAccessToken}', {
        params: { path: { resultAccessToken } },
      });
      if (response.error !== undefined) {
        setMessage(customerRequestResultCopy.unavailable);
        return;
      }
      setResult(response.data);
      setMessage('');
    } catch {
      setMessage(customerRequestResultCopy.unavailable);
    }
  }

  const resultCopy =
    result?.state === 'confirmed'
      ? {
          title: customerRequestResultCopy.confirmedTitle,
          description: customerRequestResultCopy.confirmedDescription,
        }
      : result?.state === 'declined'
        ? {
            title: customerRequestResultCopy.declinedTitle,
            description: customerRequestResultCopy.declinedDescription,
          }
        : {
            title: customerRequestResultCopy.submittedTitle,
            description: customerRequestResultCopy.submittedDescription,
          };

  return (
    <main className="ds-page">
      <Surface className="ds-page__surface" tone="raised">
        <p className="ds-eyebrow">{customerRequestResultCopy.eyebrow}</p>
        {message === '' ? null : <StatusMessage>{message}</StatusMessage>}
        {result === null ? null : (
          <>
            <h1 className="ds-heading-page">{resultCopy.title}</h1>
            <p className="ds-body-secondary ds-measure">{resultCopy.description}</p>
            <StatusMessage>{customerRequestResultCopy.boundaryNotice}</StatusMessage>
          </>
        )}
      </Surface>
    </main>
  );
}
