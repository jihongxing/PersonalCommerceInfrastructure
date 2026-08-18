'use client';

import { useEffect, useMemo, useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { reservationCopy } from '../content/user-facing-copy';
import { createApiClient } from '../lib/api/client';
import type { operations } from '../lib/api/generated';
import { Button } from './ui/button';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';

type Reservation =
  operations['getPublicReservation']['responses'][200]['content']['application/json'];
type LocalCheckout =
  operations['getLocalPaidCommerceCheckout']['responses'][200]['content']['application/json'];

export function CustomerReservationWorkspace({
  resultAccessToken,
}: {
  readonly resultAccessToken: string;
}) {
  const configuration = useMemo(() => loadWebConfiguration(), []);
  const client = useMemo(
    () => createApiClient({ apiBaseUrl: configuration.apiBaseUrl }),
    [configuration],
  );
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [checkout, setCheckout] = useState<LocalCheckout | null>(null);
  const [message, setMessage] = useState(reservationCopy.customerLoading);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refresh();
  }, [resultAccessToken]);

  async function refresh(): Promise<void> {
    const response = await client.GET('/api/v1/public/reservations/{resultAccessToken}', {
      params: { path: { resultAccessToken } },
    });
    if (response.error !== undefined) {
      setMessage(reservationCopy.customerNotFound);
      return;
    }
    setReservation(response.data);
    setMessage('');
    if (response.data.state === 'confirmed' && configuration.runtimeEnvironment !== 'production') {
      const checkoutResponse = await client.GET(
        '/api/v1/local-commerce/requests/{resultAccessToken}/checkout',
        { params: { path: { resultAccessToken } } },
      );
      if (checkoutResponse.error === undefined) {
        setCheckout(checkoutResponse.data);
      }
    }
  }

  async function cancel(): Promise<void> {
    setBusy(true);
    try {
      await client.POST('/api/v1/public/reservations/{resultAccessToken}/cancel', {
        params: { path: { resultAccessToken } },
      });
      setMessage(reservationCopy.customerCancelled);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function pay(): Promise<void> {
    setBusy(true);
    try {
      await client.POST('/api/v1/local-commerce/requests/{resultAccessToken}/payment', {
        params: { path: { resultAccessToken } },
        body: { scenario: 'success' },
      });
      setMessage(reservationCopy.customerPaymentSuccess);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="ds-result-page ds-page">
      <Surface className="ds-page__surface ds-section-stack">
        <p className="ds-eyebrow">{reservationCopy.customerEyebrow}</p>
        <h1 className="ds-heading-page">{reservationCopy.customerTitle}</h1>
        {message.length === 0 ? null : <StatusMessage>{message}</StatusMessage>}
        {reservation === null ? null : (
          <>
            <p data-testid="reservation-state">
              {reservationCopy.customerReservationLabel}
              {reservation.state}
            </p>
            <p>
              {reservationCopy.customerHoldExpiryLabel}
              {new Date(reservation.holdExpiresAt).toLocaleString()}
            </p>
            <p>
              {reservationCopy.customerOrderLabel}
              {reservation.orderId ?? reservationCopy.customerOrderMissing}
            </p>
            <p>
              {reservationCopy.customerPaymentLabel}
              {checkout?.payment?.state ?? reservationCopy.customerPaymentMissing}
            </p>
            {reservation.snapshot === undefined ? null : (
              <p>
                {reservationCopy.customerSessionLabel}
                {new Date(reservation.snapshot.slotStartsAt).toLocaleString()} —{' '}
                {new Date(reservation.snapshot.slotEndsAt).toLocaleTimeString()}
              </p>
            )}
            <StatusMessage>{reservationCopy.customerBoundary}</StatusMessage>
            <div className="ds-action-row">
              {reservation.state === 'confirmed' &&
              checkout?.payment?.state !== 'confirmed' &&
              configuration.runtimeEnvironment !== 'production' ? (
                <Button disabled={busy} onClick={() => void pay()} type="button">
                  {reservationCopy.customerSimulationPayment}
                </Button>
              ) : null}
              {reservation.state === 'held' || reservation.state === 'confirmed' ? (
                <Button
                  disabled={busy}
                  onClick={() => void cancel()}
                  type="button"
                  variant="outline"
                >
                  {reservationCopy.customerCancel}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </Surface>
    </main>
  );
}
