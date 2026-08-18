import type { ReservationRepository } from '../../applications/reservation/reservation-repositories.js';
import type { AvailabilitySlot, Reservation } from '../../modules/reservation/reservation.js';

import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryReservationRepository
  implements ReservationRepository, TransactionParticipant
{
  private slots = new Map<string, AvailabilitySlot>();
  private reservations = new Map<string, Reservation>();

  public findAvailabilitySlotById(id: string): Promise<AvailabilitySlot | undefined> {
    return Promise.resolve(clone(this.slots.get(id)));
  }

  public lockAvailabilitySlots(slotIds: readonly string[]): Promise<void> {
    void slotIds;
    return Promise.resolve();
  }

  public findAvailabilitySlotsByOfferingId(
    offeringId: string,
  ): Promise<readonly AvailabilitySlot[]> {
    return Promise.resolve(
      structuredClone([...this.slots.values()].filter((slot) => slot.offeringId === offeringId)),
    );
  }

  public saveAvailabilitySlot(slot: AvailabilitySlot): Promise<void> {
    this.slots.set(slot.id, structuredClone(slot));
    return Promise.resolve();
  }

  public findReservationById(id: string): Promise<Reservation | undefined> {
    return Promise.resolve(clone(this.reservations.get(id)));
  }

  public findReservationByResultAccessToken(token: string): Promise<Reservation | undefined> {
    return Promise.resolve(
      clone(
        [...this.reservations.values()].find(
          (reservation) => reservation.resultAccessToken === token,
        ),
      ),
    );
  }

  public findReservationsByCreatorId(creatorId: string): Promise<readonly Reservation[]> {
    return Promise.resolve(
      structuredClone(
        [...this.reservations.values()].filter(
          (reservation) => reservation.creatorId === creatorId,
        ),
      ),
    );
  }

  public findReservationsByAvailabilitySlotId(slotId: string): Promise<readonly Reservation[]> {
    return Promise.resolve(
      structuredClone(
        [...this.reservations.values()].filter(
          (reservation) => reservation.availabilitySlotId === slotId,
        ),
      ),
    );
  }

  public saveReservation(reservation: Reservation): Promise<void> {
    this.reservations.set(reservation.id, structuredClone(reservation));
    return Promise.resolve();
  }

  public createSnapshot(): unknown {
    return structuredClone({ slots: this.slots, reservations: this.reservations });
  }

  public restoreSnapshot(snapshot: unknown): void {
    const value = snapshot as {
      readonly slots: Map<string, AvailabilitySlot>;
      readonly reservations: Map<string, Reservation>;
    };
    this.slots = structuredClone(value.slots);
    this.reservations = structuredClone(value.reservations);
  }
}

function clone<Value>(value: Value | undefined): Value | undefined {
  return value === undefined ? undefined : structuredClone(value);
}
