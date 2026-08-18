'use client';

import { useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { operationsCopy } from '../content/user-facing-copy';
import { createApiClient } from '../lib/api/client';
import type { operations } from '../lib/api/generated';
import { Button } from './ui/button';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';

type Workspace =
  operations['getCommercialPilotOperationsWorkspace']['responses'][200]['content']['application/json'];
type Order = Workspace['orders'][number];
interface OperationsAction {
  (): Promise<{ error?: unknown }>;
}

export function CommercialPilotOperationsWorkspace() {
  const configuration = loadWebConfiguration();
  const [accessToken, setAccessToken] = useState('');
  const [reason, setReason] = useState('');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'info' | 'success' | 'error'>('info');
  const [busy, setBusy] = useState(false);

  function client() {
    return createApiClient({
      apiBaseUrl: configuration.apiBaseUrl,
      accessTokenProvider: { getAccessToken: () => Promise.resolve(accessToken.trim()) },
    });
  }

  async function loadWorkspace(): Promise<void> {
    if (accessToken.trim().length === 0) {
      setMessage(operationsCopy.unauthorized);
      setMessageTone('error');
      return;
    }
    setBusy(true);
    try {
      const response = await client().GET('/api/v1/operations/commercial-pilot/workspace');
      if (response.error !== undefined) throw new Error(operationsCopy.pilotWorkspaceFailed);
      setWorkspace(response.data);
      setMessage(operationsCopy.pilotWorkspaceLoaded);
      setMessageTone('success');
    } catch {
      setMessage(operationsCopy.pilotWorkspaceFailed);
      setMessageTone('error');
    } finally {
      setBusy(false);
    }
  }

  async function runAction(action: OperationsAction): Promise<void> {
    if (reason.trim().length === 0) {
      setMessage(operationsCopy.pilotActionFailed);
      setMessageTone('error');
      return;
    }
    setBusy(true);
    try {
      const response = await action();
      if (response.error !== undefined) throw new Error(operationsCopy.pilotActionFailed);
      await loadWorkspace();
      setMessage(operationsCopy.pilotResolutionRecorded);
      setMessageTone('success');
    } catch {
      setMessage(operationsCopy.pilotActionFailed);
      setMessageTone('error');
    } finally {
      setBusy(false);
    }
  }

  async function exportEvidence(orderId: string): Promise<void> {
    setBusy(true);
    try {
      const response = await client().GET(
        '/api/v1/operations/commercial-pilot/orders/{orderId}/evidence',
        {
          params: { path: { orderId } },
        },
      );
      if (response.error !== undefined) throw new Error(operationsCopy.pilotActionFailed);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${orderId}-commercial-evidence-summary.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(operationsCopy.pilotWorkspaceLoaded);
      setMessageTone('success');
    } catch {
      setMessage(operationsCopy.pilotActionFailed);
      setMessageTone('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="ds-page-shell">
      <Surface className="ds-section-stack">
        <p className="ds-eyebrow">{operationsCopy.eyebrow}</p>
        <h1 className="ds-heading-page">{operationsCopy.pilotWorkspaceTitle}</h1>
        <p className="ds-body">{operationsCopy.pilotWorkspaceDescription}</p>
        <FormField
          helperText={operationsCopy.accessTokenHelper}
          htmlFor="pilot-operations-access-token"
          label={operationsCopy.pilotWorkspaceTokenLabel}
        >
          <Input
            autoComplete="off"
            id="pilot-operations-access-token"
            type="password"
            value={accessToken}
            onChange={(event) => setAccessToken(event.target.value)}
          />
        </FormField>
        <FormField htmlFor="pilot-operations-reason" label={operationsCopy.pilotReasonLabel}>
          <Input
            id="pilot-operations-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </FormField>
        <Button
          disabled={busy || accessToken.trim().length === 0}
          onClick={() => void loadWorkspace()}
        >
          {operationsCopy.pilotWorkspaceLoad}
        </Button>
        {message === '' ? null : <StatusMessage tone={messageTone}>{message}</StatusMessage>}
      </Surface>

      {workspace === null ? null : (
        <div className="ds-section-stack">
          {workspace.orders.length === 0 ? (
            <Surface>{operationsCopy.pilotWorkspaceEmpty}</Surface>
          ) : (
            workspace.orders.map((item) => (
              <OperationsOrderCard
                key={item.order.id}
                item={item}
                busy={busy}
                reason={reason}
                onEvidence={() => void exportEvidence(item.order.id)}
                onRetrySettlement={() =>
                  void runAction(() =>
                    client().POST(
                      '/api/v1/operations/commercial-pilot/orders/{orderId}/retry-settlement',
                      {
                        params: { path: { orderId: item.order.id } },
                        body: { reason: reason.trim() },
                      },
                    ),
                  )
                }
                onRetryWithdrawal={(withdrawalId) =>
                  void runAction(() =>
                    client().POST(
                      '/api/v1/operations/commercial-pilot/withdrawals/{withdrawalId}/retry',
                      {
                        params: { path: { withdrawalId } },
                        body: { reason: reason.trim() },
                      },
                    ),
                  )
                }
                onResolve={() =>
                  void runAction(() =>
                    client().POST('/api/v1/operations/commercial-pilot/resolutions', {
                      body: {
                        action: 'manual_resolution',
                        targetType: 'order',
                        targetId: item.order.id,
                        reason: reason.trim(),
                      },
                    }),
                  )
                }
              />
            ))
          )}
          <Surface className="ds-section-stack" tone="subtle">
            <h2 className="ds-heading-section">{operationsCopy.pilotAuditTitle}</h2>
            {workspace.audit.length === 0 ? (
              <p>{operationsCopy.pilotNoIssues}</p>
            ) : (
              workspace.audit.map((audit) => (
                <p
                  key={audit.id}
                  className="ds-list-item__description"
                  data-testid={`operations-audit-${audit.id}`}
                >
                  {audit.action} · {audit.targetType}:{audit.targetId} · {audit.reason}
                </p>
              ))
            )}
          </Surface>
        </div>
      )}
    </main>
  );
}

function OperationsOrderCard({
  item,
  busy,
  reason,
  onEvidence,
  onRetrySettlement,
  onRetryWithdrawal,
  onResolve,
}: {
  readonly item: Order;
  readonly busy: boolean;
  readonly reason: string;
  readonly onEvidence: () => void;
  readonly onRetrySettlement: () => void;
  readonly onRetryWithdrawal: (withdrawalId: string) => void;
  readonly onResolve: () => void;
}) {
  return (
    <Surface className="ds-section-stack" data-testid={`operations-order-${item.order.id}`}>
      <div>
        <p className="ds-eyebrow">
          {operationsCopy.pilotOrigin}: {item.origin}
        </p>
        <h2 className="ds-heading-section">
          {operationsCopy.pilotOrder} {item.order.id}
        </h2>
        <p className="ds-list-item__description">
          {item.order.offeringSnapshot.title} · {item.order.amountMinor} {item.order.currency}
        </p>
        <p className="ds-list-item__description">
          Creator {item.order.creatorId} · Customer {item.order.customerId}
        </p>
      </div>
      <p data-testid="operations-payment-state">
        {operationsCopy.pilotPayment}: {item.payment?.state ?? 'not_started'}
        {item.payment?.providerReference === undefined
          ? ''
          : ` · ${item.payment.providerReference}`}
      </p>
      <p data-testid="operations-settlement-state">
        {operationsCopy.pilotSettlement}: {item.settlement?.state ?? 'not_started'}
      </p>
      {item.settlement === undefined ? null : (
        <p data-testid="operations-settlement-fees">
          Gross {item.settlement.grossMinor} · Provider Fee {item.settlement.providerFeeMinor} ·
          Platform Fee {item.settlement.platformFeeMinor} · Creator Net{' '}
          {item.settlement.creatorNetMinor}
        </p>
      )}
      <p>
        {operationsCopy.pilotEarnings} (Order Earnings Projection): pending{' '}
        {item.earnings.pendingMinor} · available {item.earnings.availableMinor} · restricted{' '}
        {item.earnings.restrictedMinor} · recovery {item.earnings.recoveryOutstandingMinor}
      </p>
      <p>
        Creator Wallet Projection: pending {item.creatorWallet.pendingMinor} · available{' '}
        {item.creatorWallet.availableMinor} · restricted {item.creatorWallet.restrictedMinor} ·
        recovery {item.creatorWallet.recoveryOutstandingMinor} · processing{' '}
        {item.creatorWallet.withdrawalInProgressMinor} · withdrawn{' '}
        {item.creatorWallet.withdrawnMinor}
      </p>
      <div>
        <p>{operationsCopy.pilotWithdrawal}</p>
        {item.withdrawals.map((withdrawal) => (
          <div key={withdrawal.id} data-testid={`operations-withdrawal-${withdrawal.id}`}>
            <p>
              {withdrawal.id}: {withdrawal.state} · {withdrawal.amountMinor}
            </p>
            {withdrawal.state === 'failed' ? (
              <Button
                disabled={busy || reason.trim().length === 0}
                onClick={() => onRetryWithdrawal(withdrawal.id)}
                type="button"
                variant="outline"
              >
                {operationsCopy.pilotRetryWithdrawal}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      <div>
        <p>{operationsCopy.pilotIssues}</p>
        {item.issues.length === 0 ? (
          <p>{operationsCopy.pilotNoIssues}</p>
        ) : (
          item.issues.map((issue) => <p key={issue}>{issue}</p>)
        )}
      </div>
      <div data-testid="operations-ledger-entries">
        <p>{operationsCopy.pilotLedgerTitle}</p>
        {item.ledgerEntries.map((entry) => (
          <p key={entry.id}>
            {entry.type} · {entry.amountMinor} · {entry.correlationId}
          </p>
        ))}
      </div>
      <div data-testid="operations-canonical-events">
        <p>{operationsCopy.pilotCanonicalEventsTitle}</p>
        {item.canonicalEvents.map((event) => (
          <p key={event.id}>
            {event.name} · {event.occurredAt}
          </p>
        ))}
      </div>
      <div className="ds-action-row">
        <Button disabled={busy} onClick={onEvidence} type="button" variant="outline">
          {operationsCopy.pilotEvidence}
        </Button>
        {item.settlement?.state === 'failed' ? (
          <Button
            disabled={busy || reason.trim().length === 0}
            onClick={onRetrySettlement}
            type="button"
          >
            {operationsCopy.pilotRetrySettlement}
          </Button>
        ) : null}
        <Button
          disabled={busy || reason.trim().length === 0}
          onClick={onResolve}
          type="button"
          variant="outline"
        >
          {operationsCopy.pilotResolve}
        </Button>
      </div>
    </Surface>
  );
}
