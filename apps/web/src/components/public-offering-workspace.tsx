'use client';

import { useEffect, useMemo, useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { commonCopy, publicOfferingCopy } from '../content/user-facing-copy';
import { createApiClient } from '../lib/api/client';
import type { operations } from '../lib/api/generated';
import { toUserFacingMessage } from '../lib/ui/user-facing-messages';
import { Button } from './ui/button';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';
import { Textarea } from './ui/textarea';

type PublicOfferingResponse =
  operations['getPublicServiceOffering']['responses'][200]['content']['application/json'];

export function PublicOfferingWorkspace({ offeringId }: { readonly offeringId: string }) {
  const client = useMemo(
    () => createApiClient({ apiBaseUrl: loadWebConfiguration().apiBaseUrl }),
    [],
  );
  const [details, setDetails] = useState<PublicOfferingResponse | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [resultAccessToken, setResultAccessToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string>(publicOfferingCopy.loading);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadOffering();
  }, []);

  async function loadOffering(): Promise<void> {
    setBusy(true);
    try {
      const response = await client.GET('/api/v1/public/offerings/{offeringId}', {
        params: { path: { offeringId } },
      });
      if (response.error !== undefined) {
        setDetails(null);
        setMessage(toUserFacingMessage(response.error, publicOfferingCopy.unavailable));
        return;
      }
      setDetails(response.data);
      setMessage(publicOfferingCopy.ready);
    } catch {
      setDetails(null);
      setMessage(publicOfferingCopy.unavailable);
    } finally {
      setBusy(false);
    }
  }

  async function submitRequest(): Promise<void> {
    setBusy(true);
    try {
      const response = await client.POST('/api/v1/public/offerings/{offeringId}/requests', {
        params: { path: { offeringId } },
        body: {
          contactName,
          contactMethod,
          requestMessage,
        },
      });
      if (response.error !== undefined) {
        setMessage(toUserFacingMessage(response.error, publicOfferingCopy.submitFailed));
        return;
      }
      setResultAccessToken(response.data.resultAccessToken);
      setMessage(publicOfferingCopy.submitted);
    } catch {
      setMessage(publicOfferingCopy.submitFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="ds-public-page ds-page">
      <header className="ds-workspace-header">
        <div className="ds-workspace-brand">
          <span className="ds-brand-mark" aria-hidden="true" />
          <span>{commonCopy.brand}</span>
        </div>
        <span className="ds-header-note">{commonCopy.publicService}</span>
      </header>
      <Surface className="ds-page__surface">
        <p className="ds-eyebrow">{publicOfferingCopy.eyebrow}</p>
        <StatusMessage>{busy ? publicOfferingCopy.syncing : message}</StatusMessage>
        {resultAccessToken === null ? null : (
          <p>
            <a href={`/public/requests/${resultAccessToken}`}>{publicOfferingCopy.resultLink}</a>
          </p>
        )}
        {details === null ? null : (
          <>
            <h1 className="ds-heading-page">{details.creator.displayName}</h1>
            <p className="ds-body-secondary ds-measure">{details.creator.bio}</p>
            {details.creator.capabilityNames.length === 0 ? null : (
              <p className="ds-body-secondary">
                {publicOfferingCopy.capabilitiesLabel}
                {details.creator.capabilityNames.join('、')}
              </p>
            )}
            <section className="ds-section-divider ds-section-stack">
              <h2 className="ds-heading-section">{details.offering.title}</h2>
              <p className="ds-body-secondary">{details.offering.description}</p>
              <p className="ds-body-secondary">
                {publicOfferingCopy.availabilityLabel}
                {details.offering.availabilityDescription}
              </p>
              <p className="ds-body-secondary">
                {publicOfferingCopy.instructionsLabel}
                {details.offering.requestInstructions}
              </p>
            </section>
            <section
              className="ds-section-divider ds-section-stack"
              aria-labelledby="request-title"
            >
              <h2 className="ds-heading-section" id="request-title">
                {publicOfferingCopy.requestTitle}
              </h2>
              <p className="ds-body-secondary">{publicOfferingCopy.requestNotice}</p>
              <FormField
                htmlFor="customer-contact-name"
                label={publicOfferingCopy.contactNameLabel}
              >
                <Input
                  id="customer-contact-name"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                />
              </FormField>
              <FormField
                htmlFor="customer-contact-method"
                label={publicOfferingCopy.contactMethodLabel}
              >
                <Input
                  id="customer-contact-method"
                  value={contactMethod}
                  onChange={(event) => setContactMethod(event.target.value)}
                />
              </FormField>
              <FormField htmlFor="customer-request-message" label={publicOfferingCopy.messageLabel}>
                <Textarea
                  id="customer-request-message"
                  value={requestMessage}
                  onChange={(event) => setRequestMessage(event.target.value)}
                />
              </FormField>
              <Button
                disabled={
                  busy ||
                  contactName.trim().length === 0 ||
                  contactMethod.trim().length === 0 ||
                  requestMessage.trim().length === 0
                }
                onClick={() => void submitRequest()}
                type="button"
              >
                {publicOfferingCopy.submit}
              </Button>
            </section>
          </>
        )}
      </Surface>
    </main>
  );
}
