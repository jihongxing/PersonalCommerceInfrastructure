import { describe, expect, it } from 'vitest';

import { CanonicalEventRecorder } from '../../applications/core/canonical-event-recorder.js';
import type { Clock } from '../../applications/core/ports/clock.js';
import { createReservationService } from '../../applications/reservation/reservation-service.js';
import { InMemoryCommerceActionRepository } from '../../adapters/in-memory/in-memory-commerce-action-repository.js';
import { InMemoryCustomerRepository } from '../../adapters/in-memory/in-memory-customer-repository.js';
import { InMemoryEntityCollectionRepository } from '../../adapters/in-memory/in-memory-entity-collection-repository.js';
import { InMemoryPaidCommerceRepository } from '../../adapters/in-memory/in-memory-paid-commerce-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryReservationRepository } from '../../adapters/in-memory/in-memory-reservation-repository.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import type { Offering } from '../../modules/service-offering/offering.js';

class MutableClock implements Clock {
  public constructor(private current: string) {}
  public now(): string {
    return this.current;
  }
  public set(current: string): void {
    this.current = current;
  }
}

async function fixture() {
  const offeringRepository = new InMemoryEntityCollectionRepository<Offering>(
    (offering) => offering.id,
    (offering) => offering.creatorId,
  );
  const customerRepository = new InMemoryCustomerRepository();
  const reservationRepository = new InMemoryReservationRepository();
  const paidCommerceRepository = new InMemoryPaidCommerceRepository();
  const commerceActionRepository = new InMemoryCommerceActionRepository();
  const productEventStore = new InMemoryProductEventStore();
  const unitOfWork = new InMemoryUnitOfWork(
    [
      offeringRepository,
      customerRepository,
      reservationRepository,
      paidCommerceRepository,
      productEventStore,
    ],
    productEventStore,
    {
      offeringRepository,
      customerRepository,
      commerceActionRepository,
      reservationRepository,
      paidCommerceRepository,
    },
  );
  const clock = new MutableClock('2026-08-17T10:00:00.000Z');
  const service = createReservationService({
    offeringRepository,
    customerRepository,
    reservationRepository,
    paidCommerceRepository,
    idGenerator: new SequentialIdGenerator('reservation'),
    clock,
    holdTtlMilliseconds: 15 * 60 * 1_000,
    canonicalEventRecorder: new CanonicalEventRecorder({
      clock,
      eventStore: productEventStore,
      idGenerator: new SequentialIdGenerator('event'),
    }),
    unitOfWork,
  });
  await offeringRepository.save({
    id: 'offering-1',
    creatorId: 'creator-1',
    capabilityIds: ['capability-1'],
    title: '60-minute portrait session',
    description: 'A creator-controlled portrait session.',
    availability: { description: 'Choose a published time.' },
    requestInstructions: 'Choose one available time.',
    state: 'published',
  });
  const creator = {
    actor: { kind: 'creator' as const, creatorId: 'creator-1' },
    correlationId: 'creator-reservation',
  };
  const slot1 = await service.createAvailabilitySlot(
    {
      offeringId: 'offering-1',
      startsAt: '2026-08-20T02:00:00.000Z',
      endsAt: '2026-08-20T03:00:00.000Z',
    },
    creator,
  );
  const slot2 = await service.createAvailabilitySlot(
    {
      offeringId: 'offering-1',
      startsAt: '2026-08-21T02:00:00.000Z',
      endsAt: '2026-08-21T03:00:00.000Z',
    },
    creator,
  );
  return {
    service,
    creator,
    clock,
    slot1,
    slot2,
    reservationRepository,
    paidCommerceRepository,
    productEventStore,
  };
}

describe('Reservation Commerce application', () => {
  it('prevents simultaneous holds, expires the Hold, then releases the Slot', async () => {
    const setup = await fixture();
    const first = await setup.service.createHold(
      {
        offeringId: 'offering-1',
        availabilitySlotId: setup.slot1.id,
        contactName: 'Customer A',
        contactMethod: 'customer-a@example.com',
      },
      'hold-a',
    );
    await expect(
      setup.service.createHold(
        {
          offeringId: 'offering-1',
          availabilitySlotId: setup.slot1.id,
          contactName: 'Customer B',
          contactMethod: 'customer-b@example.com',
        },
        'hold-b',
      ),
    ).rejects.toMatchObject({ code: 'reservation_slot_unavailable' });

    setup.clock.set(first.holdExpiresAt);
    const expired = await setup.service.getPublicReservation(first.resultAccessToken);
    expect(expired.state).toBe('expired');
    expect(expired.orderId).toBeUndefined();
    await expect(
      setup.service.createHold(
        {
          offeringId: 'offering-1',
          availabilitySlotId: setup.slot1.id,
          contactName: 'Customer B',
          contactMethod: 'customer-b@example.com',
        },
        'hold-b-retry',
      ),
    ).resolves.toMatchObject({ state: 'held' });
  });

  it('confirms once, creates one existing Order and rejects conflicting replay', async () => {
    const setup = await fixture();
    const hold = await setup.service.createHold(
      {
        offeringId: 'offering-1',
        availabilitySlotId: setup.slot1.id,
        contactName: 'Customer A',
        contactMethod: 'customer-a@example.com',
      },
      'hold-a',
    );
    const confirmed = await setup.service.confirm(
      {
        reservationId: hold.id,
        grossPriceMinor: 39900n,
        serviceTerms: 'One 60-minute portrait session.',
      },
      setup.creator,
    );
    const replay = await setup.service.confirm(
      {
        reservationId: hold.id,
        grossPriceMinor: 39900n,
        serviceTerms: 'One 60-minute portrait session.',
      },
      setup.creator,
    );
    expect(replay.orderId).toBe(confirmed.orderId);
    expect(await setup.paidCommerceRepository.listOrders()).toHaveLength(1);
    expect(await setup.paidCommerceRepository.findOrderByReservationId(confirmed.id)).toMatchObject(
      { reservationId: confirmed.id, state: 'payment_pending' },
    );
    await expect(
      setup.service.confirm(
        {
          reservationId: hold.id,
          grossPriceMinor: 40000n,
          serviceTerms: 'Changed terms.',
        },
        setup.creator,
      ),
    ).rejects.toMatchObject({ code: 'reservation_confirm_replay_conflict' });
  });

  it('serializes confirm/cancel and reschedule conflicts while retaining one Order', async () => {
    const setup = await fixture();
    const hold = await setup.service.createHold(
      {
        offeringId: 'offering-1',
        availabilitySlotId: setup.slot1.id,
        contactName: 'Customer A',
        contactMethod: 'customer-a@example.com',
      },
      'hold-a',
    );
    const [confirmResult, cancelResult] = await Promise.allSettled([
      setup.service.confirm(
        {
          reservationId: hold.id,
          grossPriceMinor: 39900n,
          serviceTerms: 'One 60-minute portrait session.',
        },
        setup.creator,
      ),
      setup.service.cancel(
        { reservationId: hold.id, cancelledBy: 'creator' },
        { ...setup.creator, correlationId: 'cancel-race' },
      ),
    ]);
    expect([confirmResult.status, cancelResult.status]).toContain('fulfilled');
    expect(await setup.paidCommerceRepository.listOrders()).toHaveLength(
      confirmResult.status === 'fulfilled' ? 1 : 0,
    );

    const finalReservation = await setup.reservationRepository.findReservationById(hold.id);
    if (finalReservation?.state === 'confirmed') {
      const rescheduled = await setup.service.reschedule(
        { reservationId: hold.id, availabilitySlotId: setup.slot2.id },
        { ...setup.creator, correlationId: 'reschedule-1' },
      );
      expect(rescheduled.rescheduleHistory).toHaveLength(1);
      expect(await setup.paidCommerceRepository.listOrders()).toHaveLength(1);
    }
  });

  it('records no-show as a fulfillment resolution fact without changing Money', async () => {
    const setup = await fixture();
    const hold = await setup.service.createHold(
      {
        offeringId: 'offering-1',
        availabilitySlotId: setup.slot1.id,
        contactName: 'Customer A',
        contactMethod: 'customer-a@example.com',
      },
      'hold-a',
    );
    await setup.service.confirm(
      {
        reservationId: hold.id,
        grossPriceMinor: 39900n,
        serviceTerms: 'One 60-minute portrait session.',
      },
      setup.creator,
    );
    await setup.service.recordNoShow(hold.id, setup.creator);
    expect((await setup.productEventStore.list()).at(-1)).toMatchObject({
      name: 'fulfillment_observed',
      payload: { outcome: 'no_show' },
    });
    expect(await setup.paidCommerceRepository.listLedgerEntriesByCreatorId('creator-1')).toEqual(
      [],
    );
  });
});
