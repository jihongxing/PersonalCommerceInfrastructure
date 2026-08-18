'use client';

import { useEffect, useMemo, useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { contractCopy } from '../content/user-facing-copy';
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

type CreatorRequest =
  operations['listCreatorSubmittedRequests']['responses'][200]['content']['application/json']['requests'][number];
type ContractDetails =
  operations['listCreatorContracts']['responses'][200]['content']['application/json']['contracts'][number];

export function CreatorContractWorkspace({
  accessTokenProvider,
}: {
  readonly accessTokenProvider: AccessTokenProvider;
}) {
  const client = useMemo(
    () =>
      createApiClient({
        apiBaseUrl: loadWebConfiguration().apiBaseUrl,
        accessTokenProvider,
      }),
    [accessTokenProvider],
  );
  const [requests, setRequests] = useState<readonly CreatorRequest[]>([]);
  const [contracts, setContracts] = useState<readonly ContractDetails[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [performanceType, setPerformanceType] = useState('Commercial appearance');
  const [performanceDate, setPerformanceDate] = useState('');
  const [location, setLocation] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [creatorHeadcount, setCreatorHeadcount] = useState('1');
  const [deliverables, setDeliverables] = useState('One live performance.');
  const [priceMinor, setPriceMinor] = useState('100000');
  const [cancellationTerms, setCancellationTerms] = useState(
    'Cancellation is reviewed against the agreed scope.',
  );
  const [fulfillmentCriteria, setFulfillmentCriteria] = useState(
    'Performance completed at the agreed date and location.',
  );
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const hasRequests = requests.length !== 0;
  const hasContracts = contracts.length !== 0;
  const hasMessage = message.length !== 0;

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh(): Promise<void> {
    const [requestsResponse, contractsResponse] = await Promise.all([
      client.GET('/api/v1/creator/requests'),
      client.GET('/api/v1/creator/contracts'),
    ]);
    if (requestsResponse.error === undefined) {
      setRequests(requestsResponse.data.requests);
      setSelectedRequestId(
        (current) => current || requestsResponse.data.requests[0]?.action.id || '',
      );
    }
    if (contractsResponse.error === undefined) {
      setContracts(contractsResponse.data.contracts);
    }
  }

  async function createProposal(): Promise<void> {
    if (selectedRequestId.length === 0) return;
    setBusy(true);
    try {
      const response = await client.POST('/api/v1/creator/contracts/proposals', {
        body: {
          commerceActionId: selectedRequestId,
          proposalExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          scope: {
            performanceType,
            performanceDate,
            location,
            durationMinutes: Number(durationMinutes),
            creatorHeadcount: Number(creatorHeadcount),
            deliverables,
            priceMinor,
            currency: 'CNY',
            cancellationTerms,
            fulfillmentCriteria,
          },
        },
      });
      if (response.error !== undefined) {
        setMessage(contractCopy.createFailed);
        return;
      }
      setMessage(contractCopy.proposed);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Surface className="ds-page__surface ds-section-stack" tone="raised">
      <div>
        <p className="ds-eyebrow">{contractCopy.creatorEyebrow}</p>
        <h2 className="ds-heading-section">{contractCopy.creatorTitle}</h2>
        <p className="ds-body-secondary">{contractCopy.creatorDescription}</p>
      </div>
      {!hasRequests ? <EmptyState>{contractCopy.noRequests}</EmptyState> : null}
      {hasRequests ? (
        <section className="ds-section-stack">
          <FormField htmlFor="contract-request" label={contractCopy.requestLabel}>
            <select
              id="contract-request"
              value={selectedRequestId}
              onChange={(event) => setSelectedRequestId(event.target.value)}
            >
              {requests.map((request) => (
                <option key={request.action.id} value={request.action.id}>
                  {request.offering.title} — {request.customer.contactName}
                </option>
              ))}
            </select>
          </FormField>
          <div className="ds-form-grid">
            <FormField
              htmlFor="contract-performance-type"
              label={contractCopy.performanceTypeLabel}
            >
              <Input
                id="contract-performance-type"
                value={performanceType}
                onChange={(event) => setPerformanceType(event.target.value)}
              />
            </FormField>
            <FormField
              htmlFor="contract-performance-date"
              label={contractCopy.performanceDateLabel}
            >
              <Input
                id="contract-performance-date"
                type="datetime-local"
                value={performanceDate}
                onChange={(event) => setPerformanceDate(event.target.value)}
              />
            </FormField>
            <FormField htmlFor="contract-location" label={contractCopy.locationLabel}>
              <Input
                id="contract-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </FormField>
            <FormField htmlFor="contract-duration" label={contractCopy.durationLabel}>
              <Input
                id="contract-duration"
                inputMode="numeric"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
              />
            </FormField>
            <FormField htmlFor="contract-headcount" label={contractCopy.headcountLabel}>
              <Input
                id="contract-headcount"
                inputMode="numeric"
                value={creatorHeadcount}
                onChange={(event) => setCreatorHeadcount(event.target.value)}
              />
            </FormField>
            <FormField htmlFor="contract-price" label={contractCopy.priceLabel}>
              <Input
                id="contract-price"
                inputMode="numeric"
                value={priceMinor}
                onChange={(event) => setPriceMinor(event.target.value)}
              />
            </FormField>
          </div>
          <FormField htmlFor="contract-deliverables" label={contractCopy.deliverablesLabel}>
            <Textarea
              id="contract-deliverables"
              value={deliverables}
              onChange={(event) => setDeliverables(event.target.value)}
            />
          </FormField>
          <FormField htmlFor="contract-cancellation" label={contractCopy.cancellationLabel}>
            <Textarea
              id="contract-cancellation"
              value={cancellationTerms}
              onChange={(event) => setCancellationTerms(event.target.value)}
            />
          </FormField>
          <FormField htmlFor="contract-fulfillment" label={contractCopy.fulfillmentLabel}>
            <Textarea
              id="contract-fulfillment"
              value={fulfillmentCriteria}
              onChange={(event) => setFulfillmentCriteria(event.target.value)}
            />
          </FormField>
          <Button disabled={busy} onClick={() => void createProposal()} type="button">
            {contractCopy.createProposal}
          </Button>
        </section>
      ) : null}
      <section className="ds-section-stack">
        <h3 className="ds-heading-section">{contractCopy.contractListTitle}</h3>
        {!hasContracts ? <EmptyState>{contractCopy.noContracts}</EmptyState> : null}
        {contracts.map((details) => (
          <Surface className="ds-list-item" key={details.contract.id} tone="subtle">
            <p className="ds-list-item__title">{details.scopeVersion.scope.performanceType}</p>
            <p className="ds-list-item__description">
              {contractCopy.stateLabel}
              {details.contract.state} · {contractCopy.priceLabel}
              {details.scopeVersion.scope.priceMinor}
              {contractCopy.priceMinorUnit}
            </p>
            <p className="ds-list-item__description">
              {contractCopy.expiryLabel}
              {details.contract.proposalExpiresAt ?? contractCopy.notApplicable}
            </p>
          </Surface>
        ))}
      </section>
      <StatusMessage>{contractCopy.simulationBoundary}</StatusMessage>
      {hasMessage ? <StatusMessage>{message}</StatusMessage> : null}
    </Surface>
  );
}
