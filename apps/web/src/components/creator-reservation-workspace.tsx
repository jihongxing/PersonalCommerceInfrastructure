'use client';

import { useEffect, useMemo, useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { reservationCopy } from '../content/user-facing-copy';
import type { AccessTokenProvider } from '../lib/api/authentication';
import { createApiClient } from '../lib/api/client';
import type { operations } from '../lib/api/generated';
import { Button } from './ui/button';
import { EmptyState } from './ui/empty-state';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';

type Offering =
  operations['listCreatorServiceOfferings']['responses'][200]['content']['application/json']['offerings'][number];
type Reservation =
  operations['listCreatorReservations']['responses'][200]['content']['application/json']['reservations'][number];

export function CreatorReservationWorkspace({
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
  const [offerings, setOfferings] = useState<readonly Offering[]>([]);
  const [reservations, setReservations] = useState<readonly Reservation[]>([]);
  const [offeringId, setOfferingId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [grossPriceMinor, setGrossPriceMinor] = useState('39900');
  const [serviceTerms, setServiceTerms] = useState('One 60-minute portrait session.');
  const [rescheduleSlotId, setRescheduleSlotId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const [offeringResponse, reservationResponse] = await Promise.all([
      client.GET('/api/v1/creator/offerings'),
      client.GET('/api/v1/creator/reservations'),
    ]);
    if (offeringResponse.error === undefined) {
      setOfferings(offeringResponse.data.offerings);
      setOfferingId((current) => current || offeringResponse.data.offerings[0]?.id || '');
    }
    if (reservationResponse.error === undefined) {
      setReservations(reservationResponse.data.reservations);
    }
  }

  async function run(work: () => unknown, success: string) {
    setBusy(true);
    try {
      const response = (await work()) as { readonly error?: unknown };
      if (response.error !== undefined) {
        setMessage(reservationCopy.operationFailed);
        return;
      }
      setMessage(success);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function createSlot() {
    if (offeringId.length === 0) {
      return;
    }
    await run(
      () =>
        client.POST('/api/v1/creator/offerings/{offeringId}/availability-slots', {
          params: { path: { offeringId } },
          body: {
            startsAt: new Date(startsAt).toISOString(),
            endsAt: new Date(endsAt).toISOString(),
          },
        }),
      reservationCopy.creatorPublished,
    );
  }

  return (
    <Surface className="ds-page__surface ds-section-stack" tone="raised">
      <div>
        <p className="ds-eyebrow">{reservationCopy.creatorEyebrow}</p>
        <h2 className="ds-heading-section">{reservationCopy.creatorTitle}</h2>
        <p className="ds-body-secondary">{reservationCopy.creatorDescription}</p>
      </div>
      <StatusMessage>{reservationCopy.creatorBoundary}</StatusMessage>
      <section className="ds-section-stack">
        <h3 className="ds-heading-section">{reservationCopy.creatorPublishTitle}</h3>
        <div className="ds-form-grid">
          <FormField htmlFor="reservation-offering" label={reservationCopy.creatorOfferingLabel}>
            <select
              id="reservation-offering"
              value={offeringId}
              onChange={(event) => setOfferingId(event.target.value)}
            >
              {offerings.map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {offering.title}
                </option>
              ))}
            </select>
          </FormField>
          <FormField htmlFor="reservation-starts-at" label={reservationCopy.creatorStartLabel}>
            <Input
              id="reservation-starts-at"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </FormField>
          <FormField htmlFor="reservation-ends-at" label={reservationCopy.creatorEndLabel}>
            <Input
              id="reservation-ends-at"
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </FormField>
        </div>
        <Button
          disabled={busy || offeringId.length === 0 || startsAt.length === 0 || endsAt.length === 0}
          onClick={() => void createSlot()}
          type="button"
        >
          {reservationCopy.creatorPublishSlot}
        </Button>
      </section>
      <section className="ds-section-stack">
        <h3 className="ds-heading-section">{reservationCopy.creatorReservationsTitle}</h3>
        {reservations.length === 0 ? (
          <EmptyState>{reservationCopy.creatorEmpty}</EmptyState>
        ) : (
          reservations.map((reservation) => (
            <Surface
              className="ds-list-item ds-section-stack"
              data-testid={`creator-reservation-${reservation.id}`}
              key={reservation.id}
              tone="subtle"
            >
              <p className="ds-list-item__title">
                {reservation.snapshot?.offeringTitle ?? reservation.offeringId}
              </p>
              <p>
                {reservationCopy.creatorReservationLabel}
                {reservation.state}
              </p>
              <p>
                {reservationCopy.creatorExpiryLabel}
                {new Date(reservation.holdExpiresAt).toLocaleString()}
              </p>
              <p>
                {reservationCopy.creatorOrderLabel}
                {reservation.orderId ?? reservationCopy.creatorHeldNoOrder}
              </p>
              {reservation.state === 'held' ? (
                <>
                  <div className="ds-form-grid">
                    <FormField htmlFor={`reservation-price-${reservation.id}`} label="Gross minor">
                      <Input
                        id={`reservation-price-${reservation.id}`}
                        inputMode="numeric"
                        value={grossPriceMinor}
                        onChange={(event) => setGrossPriceMinor(event.target.value)}
                      />
                    </FormField>
                    <FormField
                      htmlFor={`reservation-terms-${reservation.id}`}
                      label="Service terms"
                    >
                      <Input
                        id={`reservation-terms-${reservation.id}`}
                        value={serviceTerms}
                        onChange={(event) => setServiceTerms(event.target.value)}
                      />
                    </FormField>
                  </div>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () =>
                          client.POST('/api/v1/creator/reservations/{reservationId}/confirm', {
                            params: { path: { reservationId: reservation.id } },
                            body: { grossPriceMinor, serviceTerms },
                          }),
                        'Reservation 已确认，Order 已创建一次。',
                      )
                    }
                    type="button"
                  >
                    Confirm Reservation
                  </Button>
                </>
              ) : null}
              {reservation.state === 'confirmed' ? (
                <>
                  <FormField
                    htmlFor={`reservation-reschedule-${reservation.id}`}
                    label="New Availability Slot ID"
                  >
                    <Input
                      id={`reservation-reschedule-${reservation.id}`}
                      value={rescheduleSlotId}
                      onChange={(event) => setRescheduleSlotId(event.target.value)}
                    />
                  </FormField>
                  <div className="ds-action-row">
                    <Button
                      disabled={busy || rescheduleSlotId.trim().length === 0}
                      onClick={() =>
                        void run(
                          () =>
                            client.POST('/api/v1/creator/reservations/{reservationId}/reschedule', {
                              params: { path: { reservationId: reservation.id } },
                              body: { availabilitySlotId: rescheduleSlotId.trim() },
                            }),
                          'Reservation 已改期，原 Order 保持不变。',
                        )
                      }
                      type="button"
                      variant="outline"
                    >
                      Reschedule
                    </Button>
                    <Button
                      disabled={busy || reservation.orderId === undefined}
                      onClick={() =>
                        void run(
                          () =>
                            client.POST('/api/v1/creator/paid-orders/{orderId}/fulfillment', {
                              params: { path: { orderId: reservation.orderId as string } },
                              body: {
                                evidenceReference: `session-completed:${reservation.id}`,
                              },
                            }),
                          'Session Completed 已通过现有 Fulfillment 用例记录。',
                        )
                      }
                      type="button"
                    >
                      Session Completed
                    </Button>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () =>
                            client.POST('/api/v1/creator/reservations/{reservationId}/no-show', {
                              params: { path: { reservationId: reservation.id } },
                            }),
                          'No-show 已记录为 Fulfillment / Resolution 事实，未直接改变资金。',
                        )
                      }
                      type="button"
                      variant="outline"
                    >
                      Record No-show
                    </Button>
                  </div>
                </>
              ) : null}
              {reservation.state === 'held' || reservation.state === 'confirmed' ? (
                <Button
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () =>
                        client.POST('/api/v1/creator/reservations/{reservationId}/cancel', {
                          params: { path: { reservationId: reservation.id } },
                        }),
                      'Reservation 已取消；已付款资金仍需通过 Refund / Recovery 事实处理。',
                    )
                  }
                  type="button"
                  variant="outline"
                >
                  Creator Cancel
                </Button>
              ) : null}
            </Surface>
          ))
        )}
      </section>
      {message.length === 0 ? null : <StatusMessage>{message}</StatusMessage>}
    </Surface>
  );
}
