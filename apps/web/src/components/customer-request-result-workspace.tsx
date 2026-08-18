'use client';

import { useEffect, useMemo, useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { commonCopy, customerRequestResultCopy } from '../content/user-facing-copy';
import { createApiClient } from '../lib/api/client';
import type { operations } from '../lib/api/generated';
import { Button } from './ui/button';
import { FormField } from './ui/form-field';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';
import { CustomerContractWorkspace } from './customer-contract-workspace';

type CustomerRequestResult =
  operations['getCustomerRequestResult']['responses'][200]['content']['application/json'];
type PaidServiceStatus =
  operations['getPublicPaidServiceOrderStatus']['responses'][200]['content']['application/json'];
type LocalCheckout =
  operations['getLocalPaidCommerceCheckout']['responses'][200]['content']['application/json'];
type PaymentScenario =
  operations['simulateLocalProductPayment']['requestBody']['content']['application/json']['scenario'];

export function CustomerRequestResultWorkspace({
  resultAccessToken,
}: {
  readonly resultAccessToken: string;
}) {
  const configuration = useMemo(() => loadWebConfiguration(), []);
  const simulationEnabled = configuration.runtimeEnvironment !== 'production';
  const [result, setResult] = useState<CustomerRequestResult | null>(null);
  const [paidServiceStatus, setPaidServiceStatus] = useState<PaidServiceStatus | null>(null);
  const [checkout, setCheckout] = useState<LocalCheckout | null>(null);
  const [scenario, setScenario] = useState<PaymentScenario>('success');
  const [pendingProviderReference, setPendingProviderReference] = useState('');
  const [message, setMessage] = useState<string>(customerRequestResultCopy.loading);
  const [busy, setBusy] = useState(false);
  const client = useMemo(
    () => createApiClient({ apiBaseUrl: configuration.apiBaseUrl }),
    [configuration],
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
        await refreshCommerce();
      }
      setMessage('');
    } catch {
      setMessage(customerRequestResultCopy.unavailable);
    }
  }

  async function refreshCommerce(): Promise<void> {
    const statusResponse = await client.GET(
      '/api/v1/public/requests/{resultAccessToken}/paid-service-status',
      { params: { path: { resultAccessToken } } },
    );
    if (statusResponse.error === undefined) {
      setPaidServiceStatus(statusResponse.data);
    }
    if (!simulationEnabled || statusResponse.data?.orderState === 'not_created') {
      return;
    }
    const checkoutResponse = await client.GET(
      '/api/v1/local-commerce/requests/{resultAccessToken}/checkout',
      { params: { path: { resultAccessToken } } },
    );
    if (checkoutResponse.error === undefined) {
      setCheckout(checkoutResponse.data);
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
      if (response.error !== undefined) {
        setMessage('模拟付款未完成，请检查当前付款状态。');
        return;
      }
      setPendingProviderReference(
        scenario === 'delayed' ? (response.data.operationProviderReference ?? '') : '',
      );
      setMessage(
        scenario === 'delayed'
          ? '模拟付款正在等待 Provider Fact。'
          : '模拟付款结果已通过 Provider Fact 管线处理。',
      );
      await refreshCommerce();
    } catch {
      setMessage('模拟付款未完成，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }

  async function advancePayment(): Promise<void> {
    setBusy(true);
    try {
      const response = await client.POST(
        '/api/v1/local-commerce/requests/{resultAccessToken}/payment/advance',
        {
          params: { path: { resultAccessToken } },
          body: { providerReference: pendingProviderReference },
        },
      );
      if (response.error !== undefined) {
        setMessage('模拟付款推进失败。');
        return;
      }
      setPendingProviderReference('');
      setMessage('延迟的模拟付款事实已处理。');
      await refreshCommerce();
    } finally {
      setBusy(false);
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
      <Surface className="ds-page__surface ds-section-stack" tone="raised">
        <p className="ds-eyebrow">{customerRequestResultCopy.eyebrow}</p>
        {message === '' ? null : (
          <StatusMessage data-testid="customer-result-status">{message}</StatusMessage>
        )}
        {result === null ? null : (
          <>
            <CustomerContractWorkspace resultAccessToken={resultAccessToken} />
            <h1 className="ds-heading-page">{resultCopy.title}</h1>
            <p className="ds-body-secondary ds-measure">{resultCopy.description}</p>
            {result.state === 'confirmed' && paidServiceStatus !== null ? (
              <StatusMessage data-testid="customer-payment-status">
                {paymentMessage(paidServiceStatus)}
              </StatusMessage>
            ) : null}
            {simulationEnabled && checkout !== null ? (
              <section className="ds-section-stack" data-testid="local-checkout">
                <StatusMessage data-testid="simulation-environment-notice">
                  {customerRequestResultCopy.simulationEnvironmentNotice}
                </StatusMessage>
                <h2 className="ds-heading-section">
                  {customerRequestResultCopy.localCheckoutTitle}
                </h2>
                <Surface className="ds-list-item" tone="subtle">
                  <p className="ds-list-item__title" data-testid="checkout-offering-title">
                    {checkout.order.snapshot.offeringTitle}
                  </p>
                  <p className="ds-list-item__description">
                    {customerRequestResultCopy.creatorLabel}
                    {checkout.creatorDisplayName}
                  </p>
                  <p className="ds-list-item__description">
                    {customerRequestResultCopy.grossLabel}
                    {formatMoney(checkout.order.snapshot.grossPriceMinor)}
                  </p>
                  <p className="ds-list-item__description">
                    {customerRequestResultCopy.simulationServiceLabel}
                  </p>
                  <p className="ds-list-item__description" data-testid="checkout-order-state">
                    {customerRequestResultCopy.orderLabel}
                    {checkout.order.state}
                  </p>
                  <p className="ds-list-item__description" data-testid="checkout-payment-state">
                    {customerRequestResultCopy.paymentLabel}
                    {checkout.payment?.state ?? 'not_started'}
                  </p>
                </Surface>
                {checkout.payment?.state !== 'confirmed' &&
                checkout.payment?.state !== 'refunded' ? (
                  <>
                    <FormField
                      htmlFor="simulation-payment-scenario"
                      label={customerRequestResultCopy.paymentScenarioLabel}
                    >
                      <select
                        id="simulation-payment-scenario"
                        data-testid="simulation-payment-scenario"
                        value={scenario}
                        onChange={(event) => setScenario(event.target.value as PaymentScenario)}
                      >
                        <option value="success">{customerRequestResultCopy.successScenario}</option>
                        <option value="failed">{customerRequestResultCopy.failedScenario}</option>
                        <option value="delayed">{customerRequestResultCopy.delayedScenario}</option>
                        <option value="expired">{customerRequestResultCopy.expiredScenario}</option>
                        <option value="duplicate_event">
                          {customerRequestResultCopy.duplicateScenario}
                        </option>
                        <option value="out_of_order_event">
                          {customerRequestResultCopy.outOfOrderScenario}
                        </option>
                      </select>
                    </FormField>
                    <Button
                      data-testid="simulate-payment"
                      disabled={busy}
                      onClick={() => void simulatePayment()}
                      type="button"
                    >
                      {checkout.payment?.state === 'failed' || checkout.payment?.state === 'expired'
                        ? customerRequestResultCopy.retryPayment
                        : customerRequestResultCopy.runPayment}
                    </Button>
                  </>
                ) : null}
                {pendingProviderReference.length === 0 ? null : (
                  <Button
                    data-testid="advance-payment"
                    disabled={busy}
                    onClick={() => void advancePayment()}
                    type="button"
                    variant="outline"
                  >
                    {customerRequestResultCopy.advancePayment}
                  </Button>
                )}
              </section>
            ) : null}
            <StatusMessage data-testid="customer-result-boundary-status">
              {customerRequestResultCopy.boundaryNotice}
            </StatusMessage>
          </>
        )}
      </Surface>
    </main>
  );
}

function paymentMessage(status: PaidServiceStatus): string {
  if (status.paymentState === 'confirmed') return customerRequestResultCopy.paymentConfirmed;
  if (status.paymentState === 'failed') return '模拟付款失败，可以在同一订单上安全重试。';
  if (status.paymentState === 'expired') return '模拟付款已过期，可以在同一订单上重新尝试。';
  if (status.paymentState === 'pending') return customerRequestResultCopy.paymentPending;
  if (status.paymentState === 'refunded') return '模拟付款已退款。';
  return customerRequestResultCopy.paymentNotStarted;
}

function formatMoney(minor: string): string {
  return `CNY ¥${(Number(minor) / 100).toFixed(2)}`;
}
