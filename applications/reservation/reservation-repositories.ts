import type { AvailabilitySlot, Reservation } from '../../modules/reservation/reservation.js';

export interface ReservationRepository {
  findAvailabilitySlotById(id: string): Promise<AvailabilitySlot | undefined>;
  lockAvailabilitySlots(slotIds: readonly string[]): Promise<void>;
  findAvailabilitySlotsByOfferingId(offeringId: string): Promise<readonly AvailabilitySlot[]>;
  saveAvailabilitySlot(slot: AvailabilitySlot): Promise<void>;
  findReservationById(id: string): Promise<Reservation | undefined>;
  findReservationByResultAccessToken(token: string): Promise<Reservation | undefined>;
  findReservationsByCreatorId(creatorId: string): Promise<readonly Reservation[]>;
  findReservationsByAvailabilitySlotId(slotId: string): Promise<readonly Reservation[]>;
  saveReservation(reservation: Reservation): Promise<void>;
}
