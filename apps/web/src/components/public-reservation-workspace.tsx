'use client';

import { useEffect, useMemo, useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { reservationCopy } from '../content/user-facing-copy';
import { createApiClient } from '../lib/api/client';
import type { operations } from '../lib/api/generated';
import { Button } from './ui/button';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { StatusMessage } from './ui/status-message';

type AvailabilitySlot =
  operations['listPublicAvailabilitySlots']['responses'][200]['content']['application/json']['slots'][number];

export function PublicReservationWorkspace({ offeringId }: { readonly offeringId: string }) {
  const client = useMemo(
    () => createApiClient({ apiBaseUrl: loadWebConfiguration().apiBaseUrl }),
    [],
  );
  const [slots, setSlots] = useState<readonly AvailabilitySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadSlots();
  }, [offeringId]);

  async function loadSlots(): Promise<void> {
    const response = await client.GET('/api/v1/public/offerings/{offeringId}/availability-slots', {
      params: { path: { offeringId } },
    });
    if (response.error !== undefined) {
      return;
    }
    setSlots(response.data.slots);
    setSelectedSlotId((current) => current || response.data.slots[0]?.id || '');
  }

  async function createHold(): Promise<void> {
    if (selectedSlotId.length === 0) {
      return;
    }
    setBusy(true);
    try {
      const response = await client.POST(
        '/api/v1/public/offerings/{offeringId}/reservation-holds',
        {
          params: { path: { offeringId } },
          body: {
            availabilitySlotId: selectedSlotId,
            contactName,
            contactMethod,
          },
        },
      );
      if (response.error !== undefined) {
        setMessage(() => reservationCopy.publicUnavailable);
        await loadSlots();
        return;
      }
      window.location.assign(`/public/reservations/${response.data.resultAccessToken}`);
    } finally {
      setBusy(false);
    }
  }

  if (slots.length === 0) {
    return null;
  }

  return (
    <section
      className="ds-section-divider ds-section-stack"
      aria-labelledby="reservation-title"
      data-testid="reservation-commerce"
    >
      <div>
        <p className="ds-eyebrow">{reservationCopy.publicEyebrow}</p>
        <h2 className="ds-heading-section" id="reservation-title">
          {reservationCopy.publicTitle}
        </h2>
        <p className="ds-body-secondary">{reservationCopy.publicDescription}</p>
      </div>
      <FormField htmlFor="reservation-slot" label={reservationCopy.publicSlotLabel}>
        <select
          id="reservation-slot"
          value={selectedSlotId}
          onChange={(event) => setSelectedSlotId(event.target.value)}
        >
          {slots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {new Date(slot.startsAt).toLocaleString()} —{' '}
              {new Date(slot.endsAt).toLocaleTimeString()}
            </option>
          ))}
        </select>
      </FormField>
      <div className="ds-form-grid">
        <FormField
          htmlFor="reservation-contact-name"
          label={reservationCopy.publicContactNameLabel}
        >
          <Input
            id="reservation-contact-name"
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
          />
        </FormField>
        <FormField
          htmlFor="reservation-contact-method"
          label={reservationCopy.publicContactMethodLabel}
        >
          <Input
            id="reservation-contact-method"
            value={contactMethod}
            onChange={(event) => setContactMethod(event.target.value)}
          />
        </FormField>
      </div>
      <Button
        disabled={
          busy ||
          selectedSlotId.length === 0 ||
          contactName.trim().length === 0 ||
          contactMethod.trim().length === 0
        }
        onClick={() => void createHold()}
        type="button"
      >
        {reservationCopy.publicCreateHold}
      </Button>
      {message.length === 0 ? null : <StatusMessage>{message}</StatusMessage>}
    </section>
  );
}
