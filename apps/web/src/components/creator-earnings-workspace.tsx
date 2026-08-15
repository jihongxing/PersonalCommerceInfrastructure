'use client';

import { useEffect, useMemo, useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { creatorEarningsCopy } from '../content/user-facing-copy';
import type { AccessTokenProvider } from '../lib/api/authentication';
import { createApiClient } from '../lib/api/client';
import type { operations } from '../lib/api/generated';
import { toUserFacingMessage } from '../lib/ui/user-facing-messages';
import { Button } from './ui/button';
import { EmptyState } from './ui/empty-state';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';
import { Textarea } from './ui/textarea';

type ConfirmedRequest =
  operations['listCreatorConfirmedRequests']['responses'][200]['content']['application/json']['requests'][number];
type PaidOrder =
  operations['listCreatorPaidServiceOrders']['responses'][200]['content']['application/json']['orders'][number];
type Wallet =
  operations['getCreatorEarningsWallet']['responses'][200]['content']['application/json'];

const emptyWallet: Wallet = {
  currency: 'CNY',
  pendingMinor: '0',
  availableMinor: '0',
  restrictedMinor: '0',
  withdrawalInProgressMinor: '0',
  withdrawnMinor: '0',
};

export function CreatorEarningsWorkspace({
  accessTokenProvider,
}: {
  readonly accessTokenProvider: AccessTokenProvider;
}) {
  const [confirmedRequests, setConfirmedRequests] = useState<readonly ConfirmedRequest[]>([]);
  const [orders, setOrders] = useState<readonly PaidOrder[]>([]);
  const [wallet, setWallet] = useState<Wallet>(emptyWallet);
  const [grossPriceMinor, setGrossPriceMinor] = useState('39900');
  const [serviceTerms, setServiceTerms] = useState('一次 60 分钟线下舞蹈私教服务。');
  const [fulfillmentEvidence, setFulfillmentEvidence] = useState('');
  const [withdrawalAmountMinor, setWithdrawalAmountMinor] = useState('');
  const [destinationReference, setDestinationReference] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const client = useMemo(
    () =>
      createApiClient({
        apiBaseUrl: loadWebConfiguration().apiBaseUrl,
        accessTokenProvider,
      }),
    [accessTokenProvider],
  );

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh(): Promise<void> {
    setBusy(true);
    try {
      const [confirmedResponse, ordersResponse, walletResponse] = await Promise.all([
        client.GET('/api/v1/creator/confirmed-requests'),
        client.GET('/api/v1/creator/paid-orders'),
        client.GET('/api/v1/creator/wallet'),
      ]);
      if (
        confirmedResponse.error !== undefined ||
        ordersResponse.error !== undefined ||
        walletResponse.error !== undefined
      ) {
        setMessage(creatorEarningsCopy.failed);
        return;
      }
      setConfirmedRequests(confirmedResponse.data.requests);
      setOrders(ordersResponse.data.orders);
      setWallet(walletResponse.data);
    } catch {
      setMessage(creatorEarningsCopy.failed);
    } finally {
      setBusy(false);
    }
  }

  async function createOrder(commerceActionId: string): Promise<void> {
    setBusy(true);
    try {
      const response = await client.POST('/api/v1/creator/paid-orders', {
        body: { commerceActionId, grossPriceMinor, serviceTerms },
      });
      if (response.error !== undefined) {
        setMessage(toUserFacingMessage(response.error, creatorEarningsCopy.failed));
        return;
      }
      setMessage(creatorEarningsCopy.orderCreated);
      await refresh();
    } catch {
      setMessage(creatorEarningsCopy.failed);
    } finally {
      setBusy(false);
    }
  }

  async function recordFulfillment(orderId: string): Promise<void> {
    setBusy(true);
    try {
      const response = await client.POST('/api/v1/creator/paid-orders/{orderId}/fulfillment', {
        params: { path: { orderId } },
        body: { evidenceReference: fulfillmentEvidence },
      });
      if (response.error !== undefined) {
        setMessage(toUserFacingMessage(response.error, creatorEarningsCopy.failed));
        return;
      }
      setFulfillmentEvidence('');
      setMessage(creatorEarningsCopy.fulfillmentRecorded);
      await refresh();
    } catch {
      setMessage(creatorEarningsCopy.failed);
    } finally {
      setBusy(false);
    }
  }

  async function requestWithdrawal(): Promise<void> {
    setBusy(true);
    try {
      const response = await client.POST('/api/v1/creator/wallet/withdrawals', {
        body: {
          amountMinor: withdrawalAmountMinor,
          destinationReference,
          idempotencyKey,
        },
      });
      if (response.error !== undefined) {
        setMessage(toUserFacingMessage(response.error, creatorEarningsCopy.failed));
        return;
      }
      setMessage(creatorEarningsCopy.withdrawalRequested);
      await refresh();
    } catch {
      setMessage(creatorEarningsCopy.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Surface className="ds-page__surface ds-section-stack" tone="raised">
      <div>
        <p className="ds-eyebrow">{creatorEarningsCopy.title}</p>
        <h2 className="ds-heading-section">{creatorEarningsCopy.title}</h2>
        <p className="ds-body-secondary ds-measure">{creatorEarningsCopy.description}</p>
      </div>

      <section className="ds-section-stack">
        <div className="ds-action-row">
          <h3 className="ds-heading-section">{creatorEarningsCopy.confirmedRequestsTitle}</h3>
          <Button disabled={busy} onClick={() => void refresh()} type="button" variant="outline">
            {creatorEarningsCopy.refresh}
          </Button>
        </div>
        {confirmedRequests.length === 0 ? (
          <EmptyState>{creatorEarningsCopy.confirmedRequestsEmpty}</EmptyState>
        ) : (
          <div className="ds-section-stack">
            <div className="ds-form-grid">
              <FormField htmlFor="paid-order-price" label={creatorEarningsCopy.orderPriceLabel}>
                <Input
                  id="paid-order-price"
                  inputMode="numeric"
                  value={grossPriceMinor}
                  onChange={(event) => setGrossPriceMinor(event.target.value)}
                />
              </FormField>
              <FormField htmlFor="paid-order-terms" label={creatorEarningsCopy.orderTermsLabel}>
                <Input
                  id="paid-order-terms"
                  value={serviceTerms}
                  onChange={(event) => setServiceTerms(event.target.value)}
                />
              </FormField>
            </div>
            {confirmedRequests.map((request) => (
              <Surface className="ds-list-item" key={request.action.id} tone="subtle">
                <p className="ds-list-item__title">{request.offering.title}</p>
                <p className="ds-list-item__description">{request.customer.contactName}</p>
                <Button
                  disabled={busy}
                  onClick={() => void createOrder(request.action.id)}
                  type="button"
                >
                  {creatorEarningsCopy.createOrder}
                </Button>
              </Surface>
            ))}
          </div>
        )}
      </section>

      <section className="ds-section-stack">
        <h3 className="ds-heading-section">{creatorEarningsCopy.ordersTitle}</h3>
        <FormField
          htmlFor="paid-order-fulfillment-evidence"
          label={creatorEarningsCopy.fulfillmentEvidenceLabel}
        >
          <Textarea
            id="paid-order-fulfillment-evidence"
            value={fulfillmentEvidence}
            onChange={(event) => setFulfillmentEvidence(event.target.value)}
          />
        </FormField>
        {orders.length === 0 ? (
          <EmptyState>{creatorEarningsCopy.ordersEmpty}</EmptyState>
        ) : (
          <div className="ds-section-stack">
            {orders.map((order) => (
              <Surface className="ds-list-item" key={order.id} tone="subtle">
                <p className="ds-list-item__title">{order.snapshot.offeringTitle}</p>
                <p className="ds-list-item__description">
                  {creatorEarningsCopy.stateLabel} {order.state}
                </p>
                <p className="ds-list-item__description">
                  {order.snapshot.currency} {order.snapshot.grossPriceMinor}
                </p>
                {order.state === 'paid' ? (
                  <Button
                    disabled={busy || fulfillmentEvidence.trim().length === 0}
                    onClick={() => void recordFulfillment(order.id)}
                    type="button"
                    variant="outline"
                  >
                    {creatorEarningsCopy.fulfill}
                  </Button>
                ) : null}
              </Surface>
            ))}
          </div>
        )}
      </section>

      <section className="ds-section-stack">
        <h3 className="ds-heading-section">{creatorEarningsCopy.walletTitle}</h3>
        <StatusMessage>{creatorEarningsCopy.walletNotice}</StatusMessage>
        <div className="ds-form-grid">
          <Surface className="ds-status-card" tone="subtle">
            <strong>{creatorEarningsCopy.pendingLabel}</strong> {wallet.pendingMinor}
          </Surface>
          <Surface className="ds-status-card" tone="subtle">
            <strong>{creatorEarningsCopy.availableLabel}</strong> {wallet.availableMinor}
          </Surface>
          <Surface className="ds-status-card" tone="subtle">
            <strong>{creatorEarningsCopy.restrictedLabel}</strong> {wallet.restrictedMinor}
          </Surface>
          <Surface className="ds-status-card" tone="subtle">
            <strong>{creatorEarningsCopy.processingLabel}</strong>{' '}
            {wallet.withdrawalInProgressMinor}
          </Surface>
          <Surface className="ds-status-card" tone="subtle">
            <strong>{creatorEarningsCopy.withdrawnLabel}</strong> {wallet.withdrawnMinor}
          </Surface>
        </div>
      </section>

      <section className="ds-section-stack">
        <h3 className="ds-heading-section">{creatorEarningsCopy.withdrawalTitle}</h3>
        <div className="ds-form-grid">
          <FormField
            htmlFor="creator-withdrawal-amount"
            label={creatorEarningsCopy.withdrawalAmountLabel}
          >
            <Input
              id="creator-withdrawal-amount"
              inputMode="numeric"
              value={withdrawalAmountMinor}
              onChange={(event) => setWithdrawalAmountMinor(event.target.value)}
            />
          </FormField>
          <FormField
            htmlFor="creator-withdrawal-destination"
            label={creatorEarningsCopy.withdrawalDestinationLabel}
          >
            <Input
              id="creator-withdrawal-destination"
              value={destinationReference}
              onChange={(event) => setDestinationReference(event.target.value)}
            />
          </FormField>
          <FormField
            htmlFor="creator-withdrawal-key"
            label={creatorEarningsCopy.withdrawalKeyLabel}
          >
            <Input
              id="creator-withdrawal-key"
              value={idempotencyKey}
              onChange={(event) => setIdempotencyKey(event.target.value)}
            />
          </FormField>
        </div>
        <Button
          disabled={
            busy ||
            withdrawalAmountMinor.trim().length === 0 ||
            destinationReference.trim().length === 0 ||
            idempotencyKey.trim().length === 0
          }
          onClick={() => void requestWithdrawal()}
          type="button"
        >
          {creatorEarningsCopy.requestWithdrawal}
        </Button>
      </section>

      {message.length === 0 ? null : <StatusMessage>{message}</StatusMessage>}
    </Surface>
  );
}
