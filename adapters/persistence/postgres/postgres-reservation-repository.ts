import { eq, sql } from 'drizzle-orm';

import type { ReservationRepository } from '../../../applications/reservation/reservation-repositories.js';
import type { AvailabilitySlot, Reservation } from '../../../modules/reservation/reservation.js';
import { availabilitySlots, reservations } from '../../../database/schema/paid-commerce.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresReservationRepository implements ReservationRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async findAvailabilitySlotById(id: string): Promise<AvailabilitySlot | undefined> {
    const rows = await this.database
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.id, id));
    return rows[0] === undefined ? undefined : toSlot(rows[0]);
  }

  public async lockAvailabilitySlots(slotIds: readonly string[]): Promise<void> {
    for (const slotId of [...new Set(slotIds)].sort()) {
      await this.database.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${slotId}))`);
    }
  }

  public async findAvailabilitySlotsByOfferingId(
    offeringId: string,
  ): Promise<readonly AvailabilitySlot[]> {
    const rows = await this.database
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.offeringId, offeringId))
      .orderBy(availabilitySlots.startsAt);
    return rows.map(toSlot);
  }

  public async saveAvailabilitySlot(slot: AvailabilitySlot): Promise<void> {
    await this.database
      .insert(availabilitySlots)
      .values(slot)
      .onConflictDoUpdate({
        target: availabilitySlots.id,
        set: { state: slot.state, updatedAt: new Date().toISOString() },
      });
  }

  public async findReservationById(id: string): Promise<Reservation | undefined> {
    const rows = await this.database.select().from(reservations).where(eq(reservations.id, id));
    return rows[0] === undefined ? undefined : toReservation(rows[0]);
  }

  public async findReservationByResultAccessToken(token: string): Promise<Reservation | undefined> {
    const rows = await this.database
      .select()
      .from(reservations)
      .where(eq(reservations.resultAccessToken, token));
    return rows[0] === undefined ? undefined : toReservation(rows[0]);
  }

  public async findReservationsByCreatorId(creatorId: string): Promise<readonly Reservation[]> {
    const rows = await this.database
      .select()
      .from(reservations)
      .where(eq(reservations.creatorId, creatorId))
      .orderBy(reservations.createdAt);
    return rows.map(toReservation);
  }

  public async findReservationsByAvailabilitySlotId(
    slotId: string,
  ): Promise<readonly Reservation[]> {
    const rows = await this.database
      .select()
      .from(reservations)
      .where(eq(reservations.availabilitySlotId, slotId));
    return rows.map(toReservation);
  }

  public async saveReservation(reservation: Reservation): Promise<void> {
    await this.database
      .insert(reservations)
      .values({
        ...reservation,
        confirmedAt: reservation.confirmedAt ?? null,
        cancelledAt: reservation.cancelledAt ?? null,
        cancelledBy: reservation.cancelledBy ?? null,
        rescheduledAt: reservation.rescheduledAt ?? null,
        orderId: reservation.orderId ?? null,
        snapshot: reservation.snapshot ?? null,
        rescheduleHistory: [...reservation.rescheduleHistory],
      })
      .onConflictDoUpdate({
        target: reservations.id,
        set: {
          availabilitySlotId: reservation.availabilitySlotId,
          state: reservation.state,
          confirmedAt: reservation.confirmedAt ?? null,
          cancelledAt: reservation.cancelledAt ?? null,
          cancelledBy: reservation.cancelledBy ?? null,
          rescheduledAt: reservation.rescheduledAt ?? null,
          orderId: reservation.orderId ?? null,
          snapshot: reservation.snapshot ?? null,
          rescheduleHistory: [...reservation.rescheduleHistory],
          updatedAt: new Date().toISOString(),
        },
      });
  }
}

function toSlot(row: typeof availabilitySlots.$inferSelect): AvailabilitySlot {
  return {
    id: row.id,
    creatorId: row.creatorId,
    offeringId: row.offeringId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    capacity: 1,
    state: row.state as AvailabilitySlot['state'],
  };
}

function toReservation(row: typeof reservations.$inferSelect): Reservation {
  return {
    id: row.id,
    creatorId: row.creatorId,
    customerId: row.customerId,
    offeringId: row.offeringId,
    availabilitySlotId: row.availabilitySlotId,
    resultAccessToken: row.resultAccessToken,
    state: row.state as Reservation['state'],
    heldAt: row.heldAt,
    holdExpiresAt: row.holdExpiresAt,
    ...(row.confirmedAt === null ? {} : { confirmedAt: row.confirmedAt }),
    ...(row.cancelledAt === null ? {} : { cancelledAt: row.cancelledAt }),
    ...(row.cancelledBy === null ? {} : { cancelledBy: row.cancelledBy as 'creator' | 'customer' }),
    ...(row.rescheduledAt === null ? {} : { rescheduledAt: row.rescheduledAt }),
    ...(row.orderId === null ? {} : { orderId: row.orderId }),
    ...(row.snapshot === null ? {} : { snapshot: row.snapshot }),
    rescheduleHistory: row.rescheduleHistory,
  };
}
