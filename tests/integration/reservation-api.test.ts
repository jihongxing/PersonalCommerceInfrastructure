import { afterEach, describe, expect, it } from 'vitest';

import { createApiServer } from '../../apps/api/src/create-api-server.js';

const creatorHeaders = { authorization: 'Bearer test-creator-token' };
const operationsHeaders = { authorization: 'Bearer test-operations-token' };

describe('Reservation Commerce API', () => {
  const servers: Awaited<ReturnType<typeof createApiServer>>[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
  });

  it('runs Hold → Confirm → one Order → Payment → Session → Settlement → Wallet', async () => {
    const server = await createApiServer();
    servers.push(server);

    await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity',
      headers: creatorHeaders,
      payload: {
        profile: {
          displayName: 'Independent Photographer',
          bio: 'Portrait photographer.',
          socialLinks: [],
        },
      },
    });
    const capability = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity/capabilities',
      headers: creatorHeaders,
      payload: { name: 'Portrait photography', description: '60-minute portrait sessions.' },
    });
    expect(capability.statusCode).toBe(201);
    const capabilityId = capability.json<{ capabilityIds: readonly string[] }>().capabilityIds[0];
    const offering = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/offerings',
      headers: creatorHeaders,
      payload: {
        capabilityIds: [capabilityId],
        title: '60-minute portrait session',
        description: 'A one-hour portrait session.',
        availabilityDescription: 'Choose one published time.',
        requestInstructions: 'Select an available slot.',
      },
    });
    expect(offering.statusCode).toBe(201);
    const offeringId = offering.json<{ id: string }>().id;
    const publish = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/offerings/${offeringId}/publish`,
      headers: creatorHeaders,
    });
    expect(publish.statusCode).toBe(200);
    const slot = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/offerings/${offeringId}/availability-slots`,
      headers: creatorHeaders,
      payload: {
        startsAt: '2026-08-20T02:00:00.000Z',
        endsAt: '2026-08-20T03:00:00.000Z',
      },
    });
    if (slot.statusCode !== 201) {
      throw new Error(`slot setup failed: ${slot.statusCode} ${slot.body}`);
    }
    expect(slot.statusCode).toBe(201);
    const slotId = slot.json<{ id: string }>().id;
    expect(
      (
        await server.inject({
          method: 'GET',
          url: `/api/v1/public/offerings/${offeringId}/availability-slots`,
        })
      ).json(),
    ).toMatchObject({ slots: [{ id: slotId, capacity: 1, state: 'available' }] });

    const hold = await server.inject({
      method: 'POST',
      url: `/api/v1/public/offerings/${offeringId}/reservation-holds`,
      payload: {
        availabilitySlotId: slotId,
        contactName: 'Portrait Client',
        contactMethod: 'portrait-client@example.com',
      },
    });
    expect(hold.statusCode).toBe(201);
    const held = hold.json<{
      id: string;
      resultAccessToken: string;
      state: string;
      orderId?: string;
    }>();
    expect(held).toMatchObject({ state: 'held' });
    expect(held.orderId).toBeUndefined();
    expect(
      (
        await server.inject({
          method: 'POST',
          url: `/api/v1/public/offerings/${offeringId}/reservation-holds`,
          payload: {
            availabilitySlotId: slotId,
            contactName: 'Another Client',
            contactMethod: 'another@example.com',
          },
        })
      ).statusCode,
    ).toBe(409);

    const confirmed = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/reservations/${held.id}/confirm`,
      headers: creatorHeaders,
      payload: {
        grossPriceMinor: '39900',
        serviceTerms: 'One 60-minute portrait session.',
      },
    });
    expect(confirmed.statusCode).toBe(200);
    const confirmedReservation = confirmed.json<{ orderId: string; state: string }>();
    expect(confirmedReservation.state).toBe('confirmed');
    const replay = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/reservations/${held.id}/confirm`,
      headers: creatorHeaders,
      payload: {
        grossPriceMinor: '39900',
        serviceTerms: 'One 60-minute portrait session.',
      },
    });
    expect(replay.json<{ orderId: string }>().orderId).toBe(confirmedReservation.orderId);
    const orders = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/paid-orders',
      headers: creatorHeaders,
    });
    expect(orders.json<{ orders: unknown[] }>().orders).toHaveLength(1);
    expect(orders.json()).toMatchObject({
      orders: [{ reservationId: held.id, state: 'payment_pending' }],
    });

    const earlySettlement = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/paid-orders/${confirmedReservation.orderId}/settlement`,
      headers: operationsHeaders,
      payload: {
        amountMinor: '35670',
        currency: 'CNY',
        idempotencyKey: 'reservation-early-settlement',
        providerFeeMinor: '240',
        platformFeeMinor: '3990',
        deductionsMinor: '0',
        calculationVersion: 'simulation-cny-v1',
      },
    });
    expect(earlySettlement.statusCode).toBe(409);

    const payment = await server.inject({
      method: 'POST',
      url: `/api/v1/local-commerce/requests/${held.resultAccessToken}/payment`,
      payload: { scenario: 'success' },
    });
    expect(payment.statusCode).toBe(200);
    expect(payment.json()).toMatchObject({
      origin: 'simulation',
      processed: [{ transitioned: true }],
    });

    const stillEarlySettlement = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/paid-orders/${confirmedReservation.orderId}/settlement`,
      headers: operationsHeaders,
      payload: {
        amountMinor: '35670',
        currency: 'CNY',
        idempotencyKey: 'reservation-before-session-settlement',
        providerFeeMinor: '240',
        platformFeeMinor: '3990',
        deductionsMinor: '0',
        calculationVersion: 'simulation-cny-v1',
      },
    });
    expect(stillEarlySettlement.statusCode).toBe(409);

    expect(
      (
        await server.inject({
          method: 'POST',
          url: `/api/v1/creator/paid-orders/${confirmedReservation.orderId}/fulfillment`,
          headers: creatorHeaders,
          payload: { evidenceReference: `session-completed:${held.id}` },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await server.inject({
          method: 'POST',
          url: `/api/v1/operations/simulation/paid-orders/${confirmedReservation.orderId}/settlement`,
          headers: operationsHeaders,
          payload: {
            amountMinor: '35670',
            currency: 'CNY',
            idempotencyKey: 'reservation-settlement',
            providerFeeMinor: '240',
            platformFeeMinor: '3990',
            deductionsMinor: '0',
            calculationVersion: 'simulation-cny-v1',
          },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await server.inject({
          method: 'GET',
          url: '/api/v1/creator/wallet',
          headers: creatorHeaders,
        })
      ).json(),
    ).toMatchObject({ availableMinor: '35670' });
  });
});
