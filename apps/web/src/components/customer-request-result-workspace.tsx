'use client';

import { useEffect, useMemo, useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { commonCopy, customerRequestResultCopy } from '../content/user-facing-copy';
import { createApiClient } from '../lib/api/client';
import type { operations } from '../lib/api/generated';
import { Surface } from './ui/surface';
import { StatusMessage } from './ui/status-message';

type CustomerRequestResult =
  operations['getCustomerRequestResult']['responses'][200]['content']['application/json'];
type PaidServiceStatus =
  operations['getPublicPaidServiceOrderStatus']['responses'][200]['content']['application/json'];

export function CustomerRequestResultWorkspace({
  resultAccessToken,
}: {
  readonly resultAccessToken: string;
}) {
  const [result, setResult] = useState<CustomerRequestResult | null>(null);
  const [paidServiceStatus, setPaidServiceStatus] = useState<PaidServiceStatus | null>(null);
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
      if (response.data.state === 'confirmed') {
        const statusResponse = await client.GET(
          '/api/v1/public/requests/{resultAccessToken}/paid-service-status',
          { params: { path: { resultAccessToken } } },
        );
        if (statusResponse.error === undefined) {
          setPaidServiceStatus(statusResponse.data);
        }
      }
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
    <main className="ds-result-page ds-page">
      <header className="ds-workspace-header">
        <div className="ds-workspace-brand">
          <span className="ds-brand-mark" aria-hidden="true" />
          <span>{commonCopy.brand}</span>
        </div>
        <span className="ds-header-note">{commonCopy.requestResult}</span>
      </header>
      <Surface className="ds-page__surface" tone="raised">
        <p className="ds-eyebrow">{customerRequestResultCopy.eyebrow}</p>
        {message === '' ? null : <StatusMessage>{message}</StatusMessage>}
        {result === null ? null : (
          <>
            <h1 className="ds-heading-page">{resultCopy.title}</h1>
            <p className="ds-body-secondary ds-measure">{resultCopy.description}</p>
            {result.state === 'confirmed' && paidServiceStatus !== null ? (
              <StatusMessage>{paymentMessage(paidServiceStatus)}</StatusMessage>
            ) : null}
            <StatusMessage>{customerRequestResultCopy.boundaryNotice}</StatusMessage>
          </>
        )}
      </Surface>
    </main>
  );
}

function paymentMessage(status: PaidServiceStatus): string {
  if (status.paymentState === 'confirmed') {
    return customerRequestResultCopy.paymentConfirmed;
  }
  if (status.paymentState === 'failed') {
    return customerRequestResultCopy.paymentFailed;
  }
  if (status.paymentState === 'pending') {
    return customerRequestResultCopy.paymentPending;
  }
  return customerRequestResultCopy.paymentNotStarted;
}
