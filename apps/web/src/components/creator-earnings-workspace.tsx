'use client';

import { useEffect, useMemo, useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { creatorEarningsCopy } from '../content/user-facing-copy';
import type { AccessTokenProvider } from '../lib/api/authentication';
import { createApiClient } from '../lib/api/client';
import type { operations } from '../lib/api/generated';
import { Button } from './ui/button';
import { EmptyState } from './ui/empty-state';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';
import { Textarea } from './ui/textarea';
import { QrCodeScanner } from './qr-code-scanner';

type ConfirmedRequest =
  operations['listCreatorConfirmedRequests']['responses'][200]['content']['application/json']['requests'][number];
type LocalWorkspace =
  operations['getCreatorLocalCommerceWorkspace']['responses'][200]['content']['application/json'];
type LocalOrder = LocalWorkspace['orders'][number];
type SettlementScenario =
  operations['simulateLocalProductSettlement']['requestBody']['content']['application/json']['scenario'];
type WithdrawalScenario =
  operations['simulateLocalProductWithdrawal']['requestBody']['content']['application/json']['scenario'];
type RefundScenario =
  operations['simulateLocalProductRefund']['requestBody']['content']['application/json']['scenario'];

const emptyWorkspace: LocalWorkspace = {
  origin: 'simulation',
  providerId: 'local_commerce_simulator',
  orders: [],
  wallet: {
    currency: 'CNY',
    pendingMinor: '0',
    availableMinor: '0',
    restrictedMinor: '0',
    withdrawalInProgressMinor: '0',
    withdrawnMinor: '0',
    recoveryOutstandingMinor: '0',
  },
  withdrawals: [],
};

export function CreatorEarningsWorkspace({
  accessTokenProvider,
}: {
  readonly accessTokenProvider: AccessTokenProvider;
}) {
  const simulationEnabled = useMemo(
    () => loadWebConfiguration().runtimeEnvironment !== 'production',
    [],
  );
  const [confirmedRequests, setConfirmedRequests] = useState<readonly ConfirmedRequest[]>([]);
  const [workspace, setWorkspace] = useState<LocalWorkspace>(emptyWorkspace);
  const [grossPriceMinor, setGrossPriceMinor] = useState('39900');
  const [serviceTerms, setServiceTerms] = useState('一次 60 分钟线下舞蹈私教服务。');
  const [fulfillmentEvidence, setFulfillmentEvidence] = useState('');
  const [withdrawalAmountMinor, setWithdrawalAmountMinor] = useState('');
  const [destinationReference, setDestinationReference] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [settlementScenario, setSettlementScenario] = useState<SettlementScenario>('immediate');
  const [withdrawalScenario, setWithdrawalScenario] = useState<WithdrawalScenario>('success');
  const [refundScenario, setRefundScenario] = useState<RefundScenario>('after_settlement');
  const [pendingSettlementReferences, setPendingSettlementReferences] = useState<
    Readonly<Record<string, string>>
  >({});
  const [pendingWithdrawalReferences, setPendingWithdrawalReferences] = useState<
    Readonly<Record<string, string>>
  >({});
  const [showScanner, setShowScanner] = useState(false);
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
    if (simulationEnabled) {
      void refresh();
    }
  }, [simulationEnabled]);

  async function refresh() {
    setBusy(true);
    try {
      const confirmedResponse = await client.GET('/api/v1/creator/confirmed-requests');
      const workspaceResponse = simulationEnabled
        ? await client.GET('/api/v1/creator/local-commerce/workspace')
        : undefined;
      if (
        confirmedResponse.error !== undefined ||
        workspaceResponse === undefined ||
        workspaceResponse.error !== undefined
      ) {
        setMessage(creatorEarningsCopy.failed);
        return;
      }
      setConfirmedRequests(confirmedResponse.data.requests);
      setWorkspace(workspaceResponse.data);
    } catch {
      setMessage(creatorEarningsCopy.failed);
    } finally {
      setBusy(false);
    }
  }

  async function createOrder(commerceActionId: string) {
    await runAction(async () => {
      const response = await client.POST('/api/v1/creator/paid-orders', {
        body: { commerceActionId, grossPriceMinor, serviceTerms },
      });
      if (response.error !== undefined) {
        throw new Error(creatorEarningsCopy.failed);
      }
      setMessage(creatorEarningsCopy.orderCreated);
    });
  }

  async function recordFulfillment(orderId: string) {
    await runAction(async () => {
      const response = await client.POST('/api/v1/creator/paid-orders/{orderId}/fulfillment', {
        params: { path: { orderId } },
        body: { evidenceReference: fulfillmentEvidence },
      });
      if (response.error !== undefined) {
        throw new Error(creatorEarningsCopy.failed);
      }
      setFulfillmentEvidence('');
      setMessage(creatorEarningsCopy.fulfillmentRecorded);
    });
  }

  async function requestWithdrawal() {
    await runAction(async () => {
      const response = await client.POST('/api/v1/creator/wallet/withdrawals', {
        body: { amountMinor: withdrawalAmountMinor, destinationReference, idempotencyKey },
      });
      if (response.error !== undefined) {
        throw new Error(creatorEarningsCopy.failed);
      }
      setMessage(creatorEarningsCopy.withdrawalRequested);
    });
  }

  async function confirmFulfillment(actionId: string, fulfillmentCode: string) {
    await runAction(async () => {
      const response = await client.POST(
        '/api/v1/creator/requests/{actionId}/confirm-fulfillment',
        {
          params: { path: { actionId } },
          body: { fulfillmentCode },
        },
      );
      if (response.error !== undefined) {
        const errorCode = response.error.error?.code ?? 'UNKNOWN';
        if (errorCode === 'FULFILLMENT_CODE_INVALID') {
          throw new Error('履约码格式无效');
        } else if (errorCode === 'FULFILLMENT_CODE_EXPIRED') {
          throw new Error('履约码已过期');
        } else if (errorCode === 'FULFILLMENT_CODE_ALREADY_USED') {
          throw new Error('履约码已被使用');
        } else if (errorCode === 'COMMERCE_ACTION_NOT_FOUND') {
          throw new Error('订单不存在');
        } else if (errorCode === 'CREATOR_NOT_AUTHORIZED') {
          throw new Error('您没有权限核销此订单');
        }
        throw new Error('核销失败');
      }
      setMessage('履约码核销成功');
      setShowScanner(false);
    });
  }

  async function handleCodeScanned(code: string) {
    // Find the action ID for this fulfillment code
    // Since we don't have the mapping, we'll need to try each confirmed request
    // In a real implementation, the backend should return the action ID with the code
    let found = false;
    for (const request of confirmedRequests) {
      try {
        await confirmFulfillment(request.action.id, code);
        found = true;
        break;
      } catch {
        // Try next request
      }
    }
    if (!found) {
      setMessage('无法找到匹配的订单，或核销失败');
      setShowScanner(false);
    }
  }

  async function simulateSettlement(orderId: string) {
    await runAction(async () => {
      const response = await client.POST(
        '/api/v1/creator/local-commerce/orders/{orderId}/settlement',
        { params: { path: { orderId } }, body: { scenario: settlementScenario } },
      );
      if (response.error !== undefined) throw new Error(creatorEarningsCopy.failed);
      if (
        settlementScenario === 'delayed' &&
        response.data.operationProviderReference !== undefined
      ) {
        setPendingSettlementReferences((current) => ({
          ...current,
          [orderId]: response.data.operationProviderReference as string,
        }));
      }
      setMessage(
        settlementScenario === 'delayed'
          ? '模拟结算正在等待 Provider Fact。'
          : '模拟结算事实已处理。',
      );
    });
  }

  async function advanceSettlement(orderId: string) {
    const providerReference = pendingSettlementReferences[orderId];
    if (providerReference === undefined) return;
    await runAction(async () => {
      const response = await client.POST(
        '/api/v1/creator/local-commerce/orders/{orderId}/settlement/advance',
        { params: { path: { orderId } }, body: { providerReference } },
      );
      if (response.error !== undefined) throw new Error(creatorEarningsCopy.failed);
      setPendingSettlementReferences((current) => {
        const next = { ...current };
        delete next[orderId];
        return next;
      });
      setMessage('延迟的模拟结算事实已处理。');
    });
  }

  async function simulateWithdrawal(withdrawalId: string) {
    await runAction(async () => {
      const response = await client.POST(
        '/api/v1/creator/local-commerce/withdrawals/{withdrawalId}/simulate',
        { params: { path: { withdrawalId } }, body: { scenario: withdrawalScenario } },
      );
      if (response.error !== undefined) throw new Error(creatorEarningsCopy.failed);
      if (
        withdrawalScenario === 'delayed' &&
        response.data.operationProviderReference !== undefined
      ) {
        setPendingWithdrawalReferences((current) => ({
          ...current,
          [withdrawalId]: response.data.operationProviderReference as string,
        }));
      }
      setMessage(
        withdrawalScenario === 'delayed'
          ? '模拟提现正在等待 Provider Fact。'
          : '模拟提现事实已处理。',
      );
    });
  }

  async function advanceWithdrawal(withdrawalId: string) {
    const providerReference = pendingWithdrawalReferences[withdrawalId];
    if (providerReference === undefined) return;
    await runAction(async () => {
      const response = await client.POST(
        '/api/v1/creator/local-commerce/withdrawals/{withdrawalId}/advance',
        { params: { path: { withdrawalId } }, body: { providerReference } },
      );
      if (response.error !== undefined) throw new Error(creatorEarningsCopy.failed);
      setPendingWithdrawalReferences((current) => {
        const next = { ...current };
        delete next[withdrawalId];
        return next;
      });
      setMessage('延迟的模拟提现事实已处理。');
    });
  }

  async function simulateRefund(orderId: string) {
    await runAction(async () => {
      const response = await client.POST('/api/v1/creator/local-commerce/orders/{orderId}/refund', {
        params: { path: { orderId } },
        body: { scenario: refundScenario },
      });
      if (response.error !== undefined) throw new Error(creatorEarningsCopy.failed);
      setMessage('模拟退款事实已处理，Ledger 与 Recovery 投影已刷新。');
    });
  }

  async function runAction(action: () => unknown) {
    setBusy(true);
    try {
      await action();
      await refresh();
    } catch {
      setMessage(creatorEarningsCopy.failed);
    } finally {
      setBusy(false);
    }
  }

  if (!simulationEnabled) {
    return null;
  }

  return (
    <Surface className="ds-page__surface ds-section-stack" tone="raised">
      <div>
        <p className="ds-eyebrow">{creatorEarningsCopy.title}</p>
        <h2 className="ds-heading-section">{creatorEarningsCopy.title}</h2>
        <p className="ds-body-secondary ds-measure">{creatorEarningsCopy.description}</p>
      </div>

      <StatusMessage data-testid="creator-simulation-boundary">
        {creatorEarningsCopy.simulationBoundary}
      </StatusMessage>

      <section className="ds-section-stack">
        <div className="ds-action-row">
          <h3 className="ds-heading-section">{creatorEarningsCopy.confirmedRequestsTitle}</h3>
          <div className="ds-action-row">
            <Button
              disabled={busy}
              onClick={() => setShowScanner(true)}
              type="button"
              variant="outline"
            >
              扫码核销
            </Button>
            <Button disabled={busy} onClick={() => void refresh()} type="button" variant="outline">
              {creatorEarningsCopy.refresh}
            </Button>
          </div>
        </div>

        {showScanner ? (
          <QrCodeScanner
            onCodeScanned={(code) => void handleCodeScanned(code)}
            onCancel={() => setShowScanner(false)}
          />
        ) : null}

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
        <h3 className="ds-heading-section">{creatorEarningsCopy.orderWorkspaceTitle}</h3>
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
        <div className="ds-form-grid">
          <FormField
            htmlFor="settlement-scenario"
            label={creatorEarningsCopy.settlementScenarioLabel}
          >
            <select
              id="settlement-scenario"
              value={settlementScenario}
              onChange={(event) => setSettlementScenario(event.target.value as SettlementScenario)}
            >
              <option value="immediate">{creatorEarningsCopy.immediateScenario}</option>
              <option value="delayed">{creatorEarningsCopy.delayedScenario}</option>
              <option value="failed">{creatorEarningsCopy.failedScenario}</option>
              <option value="duplicate">{creatorEarningsCopy.duplicateScenario}</option>
              <option value="conflicting_terminal_event">
                {creatorEarningsCopy.conflictScenario}
              </option>
            </select>
          </FormField>
          <FormField htmlFor="refund-scenario" label={creatorEarningsCopy.refundScenarioLabel}>
            <select
              id="refund-scenario"
              value={refundScenario}
              onChange={(event) => setRefundScenario(event.target.value as RefundScenario)}
            >
              <option value="after_settlement">
                {creatorEarningsCopy.afterSettlementScenario}
              </option>
              <option value="before_settlement">
                {creatorEarningsCopy.beforeSettlementScenario}
              </option>
              <option value="failed_refund">{creatorEarningsCopy.failedRefundScenario}</option>
            </select>
          </FormField>
        </div>
        {workspace.orders.length === 0 ? (
          <EmptyState>{creatorEarningsCopy.ordersEmpty}</EmptyState>
        ) : (
          <div className="ds-section-stack">
            {workspace.orders.map((item) => (
              <CreatorOrderCard
                busy={busy}
                fulfillmentEvidence={fulfillmentEvidence}
                item={item}
                key={item.order.id}
                pendingSettlementReference={pendingSettlementReferences[item.order.id]}
                onAdvanceSettlement={(orderId) => void advanceSettlement(orderId)}
                onFulfill={(orderId) => void recordFulfillment(orderId)}
                onRefund={(orderId) => void simulateRefund(orderId)}
                onSettle={(orderId) => void simulateSettlement(orderId)}
              />
            ))}
          </div>
        )}
      </section>

      <WalletSection workspace={workspace} />

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
          <FormField
            htmlFor="withdrawal-scenario"
            label={creatorEarningsCopy.withdrawalScenarioLabel}
          >
            <select
              id="withdrawal-scenario"
              value={withdrawalScenario}
              onChange={(event) => setWithdrawalScenario(event.target.value as WithdrawalScenario)}
            >
              <option value="success">{creatorEarningsCopy.successScenario}</option>
              <option value="failed">{creatorEarningsCopy.failedScenario}</option>
              <option value="delayed">{creatorEarningsCopy.delayedScenario}</option>
              <option value="duplicate">{creatorEarningsCopy.duplicateScenario}</option>
            </select>
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
        {workspace.withdrawals.map((withdrawal) => (
          <Surface
            className="ds-list-item"
            data-testid={`withdrawal-${withdrawal.id}`}
            key={withdrawal.id}
            tone="subtle"
          >
            <p className="ds-list-item__title">Withdrawal {formatMoney(withdrawal.amountMinor)}</p>
            <p
              className="ds-list-item__description"
              data-testid={`withdrawal-state-${withdrawal.id}`}
            >
              {creatorEarningsCopy.withdrawalStateLabel}
              {withdrawal.state}
            </p>
            {withdrawal.state === 'requested' || withdrawal.state === 'failed' ? (
              <Button
                disabled={busy}
                onClick={() => void simulateWithdrawal(withdrawal.id)}
                type="button"
              >
                {withdrawal.state === 'failed'
                  ? creatorEarningsCopy.retryWithdrawal
                  : creatorEarningsCopy.runWithdrawal}
              </Button>
            ) : null}
            {pendingWithdrawalReferences[withdrawal.id] === undefined ? null : (
              <Button
                disabled={busy}
                onClick={() => void advanceWithdrawal(withdrawal.id)}
                type="button"
                variant="outline"
              >
                {creatorEarningsCopy.advanceWithdrawal}
              </Button>
            )}
          </Surface>
        ))}
      </section>

      {message.length === 0 ? null : (
        <StatusMessage data-testid="creator-earnings-action-status">{message}</StatusMessage>
      )}
    </Surface>
  );
}

function CreatorOrderCard({
  busy,
  fulfillmentEvidence,
  item,
  pendingSettlementReference,
  onAdvanceSettlement,
  onFulfill,
  onRefund,
  onSettle,
}: {
  readonly busy: boolean;
  readonly fulfillmentEvidence: string;
  readonly item: LocalOrder;
  readonly pendingSettlementReference?: string;
  readonly onAdvanceSettlement: (orderId: string) => void;
  readonly onFulfill: (orderId: string) => void;
  readonly onRefund: (orderId: string) => void;
  readonly onSettle: (orderId: string) => void;
}) {
  return (
    <Surface className="ds-list-item" data-testid={`creator-order-${item.order.id}`} tone="subtle">
      <p className="ds-list-item__title">{item.order.snapshot.offeringTitle}</p>
      <p className="ds-list-item__description">
        {creatorEarningsCopy.customerLabel}
        {item.customerName}
      </p>
      <p className="ds-list-item__description">
        {creatorEarningsCopy.grossLabel}
        {formatMoney(item.order.snapshot.grossPriceMinor)}
      </p>
      <p className="ds-list-item__description" data-testid={`order-state-${item.order.id}`}>
        {creatorEarningsCopy.orderLabel}
        {item.order.state}
      </p>
      <p
        className="ds-list-item__description"
        data-testid={`creator-payment-state-${item.order.id}`}
      >
        {creatorEarningsCopy.paymentLabel}
        {item.payment?.state ?? 'not_started'}
      </p>
      <p className="ds-list-item__description" data-testid={`fulfillment-state-${item.order.id}`}>
        {creatorEarningsCopy.fulfillmentLabel}
        {item.fulfillmentState}
      </p>
      <p className="ds-list-item__description" data-testid={`settlement-state-${item.order.id}`}>
        {creatorEarningsCopy.settlementLabel}
        {item.settlement?.state ?? 'not_started'}
      </p>
      <p className="ds-list-item__description" data-testid={`earnings-state-${item.order.id}`}>
        {creatorEarningsCopy.earningsLabel}
        {item.earningsState}
      </p>
      {item.settlement === undefined ? null : (
        <Surface
          className="ds-status-card"
          data-testid={`fee-trace-${item.order.id}`}
          tone="subtle"
        >
          <strong>{creatorEarningsCopy.feeTraceLabel}</strong> {creatorEarningsCopy.grossLabel}{' '}
          {formatMoney(item.settlement.grossMinor)} ·{' '}
          {creatorEarningsCopy.simulatedProviderFeeLabel}{' '}
          {formatMoney(item.settlement.providerFeeMinor)} ·{' '}
          {creatorEarningsCopy.simulatedPlatformFeeLabel}{' '}
          {formatMoney(item.settlement.platformFeeMinor)} ·{' '}
          {creatorEarningsCopy.simulatedAdjustmentLabel}{' '}
          {formatMoney(item.settlement.adjustmentMinor)} · {creatorEarningsCopy.creatorNetLabel}{' '}
          {formatMoney(item.settlement.creatorNetMinor)}
        </Surface>
      )}
      {item.order.state === 'paid' ? (
        <Button
          disabled={busy || fulfillmentEvidence.trim().length === 0}
          onClick={() => void onFulfill(item.order.id)}
          type="button"
          variant="outline"
        >
          {creatorEarningsCopy.fulfill}
        </Button>
      ) : null}
      {(item.order.state === 'fulfilled' || item.order.state === 'pending_resolution') &&
      item.payment?.state === 'confirmed' ? (
        <Button disabled={busy} onClick={() => void onSettle(item.order.id)} type="button">
          {item.order.state === 'pending_resolution'
            ? creatorEarningsCopy.retrySettlement
            : creatorEarningsCopy.runSettlement}
        </Button>
      ) : null}
      {pendingSettlementReference === undefined ? null : (
        <Button
          disabled={busy}
          onClick={() => void onAdvanceSettlement(item.order.id)}
          type="button"
          variant="outline"
        >
          {creatorEarningsCopy.advanceSettlement}
        </Button>
      )}
      {item.payment?.state === 'confirmed' ? (
        <Button
          disabled={busy}
          onClick={() => void onRefund(item.order.id)}
          type="button"
          variant="outline"
        >
          {creatorEarningsCopy.runRefund}
        </Button>
      ) : null}
    </Surface>
  );
}

function WalletSection({ workspace }: { readonly workspace: LocalWorkspace }) {
  const wallet = workspace.wallet;
  return (
    <section className="ds-section-stack">
      <h3 className="ds-heading-section">{creatorEarningsCopy.walletTitle}</h3>
      <StatusMessage data-testid="creator-wallet-notice">
        {creatorEarningsCopy.walletNotice}
      </StatusMessage>
      <div className="ds-form-grid" data-testid="creator-wallet-projection">
        <WalletValue
          label={creatorEarningsCopy.pendingLabel}
          testId="wallet-pending"
          value={wallet.pendingMinor}
        />
        <WalletValue
          label={creatorEarningsCopy.availableLabel}
          testId="wallet-available"
          value={wallet.availableMinor}
        />
        <WalletValue
          label={creatorEarningsCopy.restrictedLabel}
          testId="wallet-restricted"
          value={wallet.restrictedMinor}
        />
        <WalletValue
          label={creatorEarningsCopy.processingLabel}
          testId="wallet-processing"
          value={wallet.withdrawalInProgressMinor}
        />
        <WalletValue
          label={creatorEarningsCopy.withdrawnLabel}
          testId="wallet-withdrawn"
          value={wallet.withdrawnMinor}
        />
        <WalletValue
          label={creatorEarningsCopy.recoveryOutstandingLabel}
          testId="wallet-recovery"
          value={wallet.recoveryOutstandingMinor}
        />
      </div>
    </section>
  );
}

function WalletValue({
  label,
  testId,
  value,
}: {
  readonly label: string;
  readonly testId: string;
  readonly value: string;
}) {
  return (
    <Surface className="ds-status-card" data-testid={testId} tone="subtle">
      <strong>{label}</strong> {value}
    </Surface>
  );
}

function formatMoney(minor: string): string {
  return `CNY ¥${(Number(minor) / 100).toFixed(2)}`;
}
