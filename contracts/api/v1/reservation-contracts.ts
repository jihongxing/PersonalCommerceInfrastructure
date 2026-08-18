import { Type } from 'typebox';

const ReservationStateSchema = Type.Union([
  Type.Literal('held'),
  Type.Literal('confirmed'),
  Type.Literal('cancelled'),
  Type.Literal('expired'),
]);

export const AvailabilitySlotSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    creatorId: Type.String({ minLength: 1 }),
    offeringId: Type.String({ minLength: 1 }),
    startsAt: Type.String({ format: 'date-time' }),
    endsAt: Type.String({ format: 'date-time' }),
    capacity: Type.Literal(1),
    state: Type.Union([Type.Literal('available'), Type.Literal('blocked')]),
  },
  { additionalProperties: false },
);

export const AvailabilitySlotListSchema = Type.Object(
  { slots: Type.Array(AvailabilitySlotSchema) },
  { additionalProperties: false },
);

export const CreateAvailabilitySlotSchema = Type.Object(
  {
    startsAt: Type.String({ format: 'date-time' }),
    endsAt: Type.String({ format: 'date-time' }),
  },
  { additionalProperties: false },
);

export const CreateReservationHoldSchema = Type.Object(
  {
    availabilitySlotId: Type.String({ minLength: 1 }),
    contactName: Type.String({ minLength: 1, maxLength: 160 }),
    contactMethod: Type.String({ minLength: 1, maxLength: 320 }),
  },
  { additionalProperties: false },
);

export const ConfirmReservationSchema = Type.Object(
  {
    grossPriceMinor: Type.String({ pattern: '^[0-9]+$' }),
    serviceTerms: Type.String({ minLength: 1, maxLength: 2_000 }),
  },
  { additionalProperties: false },
);

export const RescheduleReservationSchema = Type.Object(
  { availabilitySlotId: Type.String({ minLength: 1 }) },
  { additionalProperties: false },
);

export const ReservationSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    creatorId: Type.String({ minLength: 1 }),
    customerId: Type.String({ minLength: 1 }),
    offeringId: Type.String({ minLength: 1 }),
    availabilitySlotId: Type.String({ minLength: 1 }),
    resultAccessToken: Type.String({ minLength: 1 }),
    state: ReservationStateSchema,
    heldAt: Type.String({ format: 'date-time' }),
    holdExpiresAt: Type.String({ format: 'date-time' }),
    confirmedAt: Type.Optional(Type.String({ format: 'date-time' })),
    cancelledAt: Type.Optional(Type.String({ format: 'date-time' })),
    cancelledBy: Type.Optional(Type.Union([Type.Literal('creator'), Type.Literal('customer')])),
    rescheduledAt: Type.Optional(Type.String({ format: 'date-time' })),
    orderId: Type.Optional(Type.String({ minLength: 1 })),
    snapshot: Type.Optional(
      Type.Object(
        {
          offeringTitle: Type.String({ minLength: 1 }),
          offeringDescription: Type.String({ minLength: 1 }),
          serviceTerms: Type.String({ minLength: 1 }),
          slotStartsAt: Type.String({ format: 'date-time' }),
          slotEndsAt: Type.String({ format: 'date-time' }),
        },
        { additionalProperties: false },
      ),
    ),
    rescheduleHistory: Type.Array(
      Type.Object(
        {
          fromAvailabilitySlotId: Type.String({ minLength: 1 }),
          toAvailabilitySlotId: Type.String({ minLength: 1 }),
          occurredAt: Type.String({ format: 'date-time' }),
          actor: Type.Union([Type.Literal('creator'), Type.Literal('customer')]),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const CreatorReservationListSchema = Type.Object(
  { reservations: Type.Array(ReservationSchema) },
  { additionalProperties: false },
);
