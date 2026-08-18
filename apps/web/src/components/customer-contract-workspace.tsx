'use client';

import { useEffect, useMemo, useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { contractCopy } from '../content/user-facing-copy';
import { createApiClient } from '../lib/api/client';
import type { operations } from '../lib/api/generated';
import { Button } from './ui/button';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';

type ContractDetails =
  operations['getPublicContract']['responses'][200]['content']['application/json'];
type Checkout =
  operations['getLocalPaidCommerceCheckout']['responses'][200]['content']['application/json'];
type PaymentScenario =
  operations['simulateLocalProductPayment']['requestBody']['content']['application/json']['scenario'];

export function CustomerContractWorkspace({
  resultAccessToken,
}: {
  readonly resultAccessToken: string;
}) {
  const configuration = useMemo(() => loadWebConfiguration(), []);
  const client = useMemo(
    () => createApiClient({ apiBaseUrl: configuration.apiBaseUrl }),
    [configuration],
  );
  const [details, setDetails] = useState<ContractDetails | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [scenario, setScenario] = useState<PaymentScenario>('success');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const hasMessage = message.length !== 0;

  useEffect(() => {
    void refresh();
  }, [resultAccessToken]);

  async function refresh(): Promise<void> {
    const response = await client.GET('/api/v1/public/contracts/{resultAccessToken}', {
      params: { path: { resultAccessToken } },
    });
    if (response.error !== undefined) return;
    setDetails(response.data);
    await refreshCheckout(response.data);
  }

  async function refreshCheckout(contractDetails: ContractDetails): Promise<void> {
    if (contractDetails.contract.state !== 'contracted') {
      setCheckout(null);
      return;
    }
    const checkoutResponse = await client.GET(
      '/api/v1/local-commerce/requests/{resultAccessToken}/checkout',
      {
        params: { path: { resultAccessToken } },
      },
    );
    if (checkoutResponse.error === undefined) {
      setCheckout(checkoutResponse.data);
    }
  }

  async function decide(decision: 'accept' | 'reject'): Promise<void> {
    setBusy(true);
    try {
      const response = await client.POST(
        `/api/v1/public/contracts/{resultAccessToken}/${decision}`,
        {
          params: { path: { resultAccessToken } },
        },
      );
      if (response.error !== undefined) {
        setMessage(contractCopy.decisionFailed);
        return;
      }
      setMessage(decision === 'accept' ? contractCopy.accepted : contractCopy.rejected);
      setDetails(response.data);
      await refreshCheckout(response.data);
    } finally {
      setBusy(false);
    }
  }

  async function simulatePayment(): Promise<void> {
    setBusy(true);
    try {
      const response = await client.POST(
        '/api/v1/local-commerce/requests/{resultAccessToken}/payment',
        {
          params: { path: { resultAccessToken } },
          body: { scenario },
        },
      );
      setMessage(
        response.error === undefined ? contractCopy.paymentSimulated : contractCopy.paymentFailed,
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (details === null) return null;
  const scope = details.scopeVersion.scope;
  return (
    <Surface className="ds-page__surface ds-section-stack" tone="raised">
      <p className="ds-eyebrow">{contractCopy.buyerEyebrow}</p>
      <h2 className="ds-heading-section">{contractCopy.buyerTitle}</h2>
      <p className="ds-body-secondary">{contractCopy.scopeSnapshotNotice}</p>
      <div className="ds-list-item">
        <p className="ds-list-item__title">{scope.performanceType}</p>
        <p className="ds-list-item__description">
          {contractCopy.performanceDateLabel}
          {scope.performanceDate}
        </p>
        <p className="ds-list-item__description">
          {contractCopy.locationLabel}
          {scope.location}
        </p>
        <p className="ds-list-item__description">
          {contractCopy.durationLabel}
          {scope.durationMinutes} minutes
        </p>
        <p className="ds-list-item__description">
          {contractCopy.deliverablesLabel}
          {scope.deliverables}
        </p>
        <p className="ds-list-item__description">
          {contractCopy.priceLabel}CNY ¥{(Number(scope.priceMinor) / 100).toFixed(2)}
        </p>
        <p className="ds-list-item__description">
          {contractCopy.cancellationLabel}
          {scope.cancellationTerms}
        </p>
        <p className="ds-list-item__description">
          {contractCopy.fulfillmentLabel}
          {scope.fulfillmentCriteria}
        </p>
      </div>
      <StatusMessage>
        {contractCopy.stateLabel}
        {details.contract.state}
      </StatusMessage>
      {details.contract.state === 'proposed' ? (
        <div className="ds-action-row">
          <Button disabled={busy} onClick={() => void decide('accept')} type="button">
            {contractCopy.acceptContract}
          </Button>
          <Button
            disabled={busy}
            onClick={() => void decide('reject')}
            type="button"
            variant="outline"
          >
            {contractCopy.rejectContract}
          </Button>
        </div>
      ) : null}
      {checkout !== null ? (
        <section className="ds-section-stack">
          <StatusMessage>{contractCopy.simulationBoundary}</StatusMessage>
          <StatusMessage>
            {contractCopy.orderLabel}
            {checkout.order.state} · {contractCopy.paymentLabel}
            {checkout.payment?.state ?? 'not_started'}
          </StatusMessage>
          {checkout.payment?.state !== 'confirmed' ? (
            <div className="ds-action-row">
              <select
                value={scenario}
                onChange={(event) => setScenario(event.target.value as PaymentScenario)}
              >
                <option value="success">{contractCopy.successScenario}</option>
                <option value="failed">{contractCopy.failedScenario}</option>
                <option value="delayed">{contractCopy.delayedScenario}</option>
              </select>
              <Button disabled={busy} onClick={() => void simulatePayment()} type="button">
                {contractCopy.simulatePayment}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
      {hasMessage ? <StatusMessage>{message}</StatusMessage> : null}
    </Surface>
  );
}
