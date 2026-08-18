'use client';

import { useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { commonCopy, operationsCopy } from '../content/user-facing-copy';
import { createApiClient } from '../lib/api/client';
import type { operations } from '../lib/api/generated';
import { Button } from './ui/button';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';

type ExternalObservation =
  operations['recordExternalPaymentFact']['responses'][200]['content']['application/json'];
type ObservationRoute =
  | '/api/v1/operations/requests/{actionId}/external-payment'
  | '/api/v1/operations/requests/{actionId}/fulfillment';

function initialOccurredAt(): string {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}

function errorMessage(error: { readonly error?: { readonly code?: string } }): string {
  switch (error.error?.code) {
    case 'invalid_operations_access_token':
    case 'missing_authorization':
      return operationsCopy.unauthorized;
    case 'external_observation_requires_confirmed_action':
      return operationsCopy.confirmedRequired;
    case 'fulfillment_requires_external_payment':
      return operationsCopy.paymentRequired;
    default:
      return operationsCopy.failed;
  }
}

export function OperationsExternalFactWorkspace() {
  const configuration = loadWebConfiguration();
  const simulationEnabled = configuration.runtimeEnvironment !== 'production';
  const [accessToken, setAccessToken] = useState('');
  const [actionId, setActionId] = useState('');
  const [evidenceReference, setEvidenceReference] = useState('');
  const [occurredAt, setOccurredAt] = useState(initialOccurredAt);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'info' | 'success' | 'error'>('info');
  const [result, setResult] = useState<ExternalObservation | null>(null);
  const [simulationOrderId, setSimulationOrderId] = useState('');
  const [simulationWithdrawalId, setSimulationWithdrawalId] = useState('');
  const [simulationMessage, setSimulationMessage] = useState('');

  const canSubmit =
    !busy &&
    accessToken.trim().length > 0 &&
    actionId.trim().length > 0 &&
    evidenceReference.trim().length > 0 &&
    occurredAt.length > 0;

  async function recordObservation(route: ObservationRoute): Promise<void> {
    setBusy(true);
    setMessage('');
    try {
      const client = createApiClient({
        apiBaseUrl: configuration.apiBaseUrl,
        accessTokenProvider: {
          getAccessToken: () => Promise.resolve(accessToken.trim()),
        },
      });
      const response = await client.POST(route, {
        params: { path: { actionId: actionId.trim() } },
        body: {
          evidenceReference: evidenceReference.trim(),
          occurredAt: new Date(occurredAt).toISOString(),
        },
      });

      if (response.error !== undefined) {
        setMessage(errorMessage(response.error));
        setMessageTone('error');
        return;
      }

      setResult(response.data);
      setMessage(
        response.data.type === 'external_paid_verified'
          ? operationsCopy.paymentRecorded
          : operationsCopy.fulfillmentRecorded,
      );
      setMessageTone('success');
    } catch {
      setMessage(operationsCopy.failed);
      setMessageTone('error');
    } finally {
      setBusy(false);
    }
  }

  async function runSimulation(
    route:
      | '/api/v1/operations/simulation/paid-orders/{orderId}/payment'
      | '/api/v1/operations/simulation/paid-orders/{orderId}/settlement'
      | '/api/v1/operations/simulation/withdrawals/{withdrawalId}',
  ): Promise<void> {
    const targetId =
      route === '/api/v1/operations/simulation/withdrawals/{withdrawalId}'
        ? simulationWithdrawalId.trim()
        : simulationOrderId.trim();
    if (accessToken.trim().length === 0 || targetId.length === 0) {
      setSimulationMessage(operationsCopy.simulationFailed);
      return;
    }

    setBusy(true);
    setSimulationMessage('');
    try {
      const client = createApiClient({
        apiBaseUrl: configuration.apiBaseUrl,
        accessTokenProvider: {
          getAccessToken: () => Promise.resolve(accessToken.trim()),
        },
      });
      const response =
        route === '/api/v1/operations/simulation/paid-orders/{orderId}/payment'
          ? await client.POST(route, {
              params: { path: { orderId: targetId } },
              body: {
                amountMinor: '39900',
                currency: 'CNY',
                idempotencyKey: `web-simulation-payment-${targetId}`,
              },
            })
          : route === '/api/v1/operations/simulation/paid-orders/{orderId}/settlement'
            ? await client.POST(route, {
                params: { path: { orderId: targetId } },
                body: {
                  amountMinor: '35670',
                  currency: 'CNY',
                  idempotencyKey: `web-simulation-settlement-${targetId}`,
                  providerFeeMinor: '240',
                  platformFeeMinor: '3990',
                  deductionsMinor: '0',
                  calculationVersion: 'simulation-cny-v1',
                },
              })
            : await client.POST(route, {
                params: { path: { withdrawalId: targetId } },
                body: {
                  amountMinor: '35670',
                  currency: 'CNY',
                  idempotencyKey: `web-simulation-withdrawal-${targetId}`,
                },
              });
      setSimulationMessage(
        response.error === undefined
          ? operationsCopy.simulationSuccess
          : operationsCopy.simulationFailed,
      );
    } catch {
      setSimulationMessage(operationsCopy.simulationFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="ds-workspace-page ds-page">
      <header className="ds-workspace-header">
        <div className="ds-workspace-brand">
          <span className="ds-brand-mark" aria-hidden="true" />
          <span>{commonCopy.brand}</span>
        </div>
        <span className="ds-header-note">{operationsCopy.headerNote}</span>
      </header>
      <Surface className="ds-page__surface" tone="raised">
        <p className="ds-eyebrow">{operationsCopy.eyebrow}</p>
        <h1 className="ds-heading-page">{operationsCopy.title}</h1>
        <p className="ds-body-secondary ds-measure">{operationsCopy.description}</p>
        <StatusMessage data-testid="operations-boundary-status">
          {operationsCopy.boundaryNotice}
        </StatusMessage>
        <StatusMessage data-testid="operations-state-status">
          {operationsCopy.stateNotice}
        </StatusMessage>

        <section className="ds-form-grid" aria-label={operationsCopy.title}>
          <FormField
            helperText={operationsCopy.accessTokenHelper}
            htmlFor="operations-access-token"
            label={operationsCopy.accessTokenLabel}
          >
            <Input
              autoComplete="off"
              id="operations-access-token"
              type="password"
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
            />
          </FormField>
          <FormField htmlFor="operations-action-id" label={operationsCopy.actionIdLabel}>
            <Input
              id="operations-action-id"
              value={actionId}
              onChange={(event) => setActionId(event.target.value)}
            />
          </FormField>
          <FormField
            helperText={operationsCopy.evidenceReferenceHelper}
            htmlFor="operations-evidence-reference"
            label={operationsCopy.evidenceReferenceLabel}
          >
            <Input
              id="operations-evidence-reference"
              value={evidenceReference}
              onChange={(event) => setEvidenceReference(event.target.value)}
            />
          </FormField>
          <FormField htmlFor="operations-occurred-at" label={operationsCopy.occurredAtLabel}>
            <Input
              id="operations-occurred-at"
              type="datetime-local"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
            />
          </FormField>
          <div className="ds-action-row">
            <Button
              disabled={!canSubmit}
              onClick={() =>
                void recordObservation('/api/v1/operations/requests/{actionId}/external-payment')
              }
              type="button"
            >
              {operationsCopy.recordPayment}
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={() =>
                void recordObservation('/api/v1/operations/requests/{actionId}/fulfillment')
              }
              type="button"
              variant="outline"
            >
              {operationsCopy.recordFulfillment}
            </Button>
          </div>
        </section>

        {simulationEnabled ? (
          <section className="ds-section-stack" data-testid="local-commerce-simulation-control">
            <h2 className="ds-heading-section">{operationsCopy.simulationTitle}</h2>
            <StatusMessage data-testid="local-commerce-simulation-notice">
              {operationsCopy.simulationNotice}
            </StatusMessage>
            <div className="ds-form-grid">
              <FormField
                htmlFor="simulation-order-id"
                label={operationsCopy.simulationOrderIdLabel}
              >
                <Input
                  id="simulation-order-id"
                  value={simulationOrderId}
                  onChange={(event) => setSimulationOrderId(event.target.value)}
                />
              </FormField>
              <FormField
                htmlFor="simulation-withdrawal-id"
                label={operationsCopy.simulationWithdrawalIdLabel}
              >
                <Input
                  id="simulation-withdrawal-id"
                  value={simulationWithdrawalId}
                  onChange={(event) => setSimulationWithdrawalId(event.target.value)}
                />
              </FormField>
            </div>
            <div className="ds-action-row">
              <Button
                disabled={busy || simulationOrderId.trim().length === 0}
                onClick={() =>
                  void runSimulation('/api/v1/operations/simulation/paid-orders/{orderId}/payment')
                }
                type="button"
              >
                {operationsCopy.simulationPayment}
              </Button>
              <Button
                disabled={busy || simulationOrderId.trim().length === 0}
                onClick={() =>
                  void runSimulation(
                    '/api/v1/operations/simulation/paid-orders/{orderId}/settlement',
                  )
                }
                type="button"
                variant="outline"
              >
                {operationsCopy.simulationSettlement}
              </Button>
              <Button
                disabled={busy || simulationWithdrawalId.trim().length === 0}
                onClick={() =>
                  void runSimulation('/api/v1/operations/simulation/withdrawals/{withdrawalId}')
                }
                type="button"
                variant="outline"
              >
                {operationsCopy.simulationWithdrawal}
              </Button>
            </div>
            {simulationMessage === '' ? null : (
              <StatusMessage data-testid="local-commerce-simulation-status">
                {simulationMessage}
              </StatusMessage>
            )}
          </section>
        ) : null}

        {message === '' ? null : (
          <StatusMessage data-testid="operations-action-status" tone={messageTone}>
            {message}
          </StatusMessage>
        )}
        {result === null ? null : (
          <Surface className="ds-status-card ds-section-stack" tone="subtle">
            <h2 className="ds-heading-section">{operationsCopy.resultTitle}</h2>
            <p className="ds-list-item__description">
              <strong>{operationsCopy.resultTypeLabel}</strong> {result.type}
            </p>
            <p className="ds-list-item__description">
              <strong>{operationsCopy.resultEvidenceLabel}</strong> {result.evidenceReference}
            </p>
            <p className="ds-list-item__description">
              <strong>{operationsCopy.resultOccurredAtLabel}</strong> {result.occurredAt}
            </p>
            <p className="ds-list-item__description">
              <strong>{operationsCopy.resultRecordedByLabel}</strong> {result.recordedBy}
            </p>
          </Surface>
        )}
      </Surface>
    </main>
  );
}
