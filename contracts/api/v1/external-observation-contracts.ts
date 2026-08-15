import { Type } from 'typebox';

export const RecordExternalObservationSchema = Type.Object(
  {
    evidenceReference: Type.String({ minLength: 1, maxLength: 2048 }),
    occurredAt: Type.String({ format: 'date-time' }),
  },
  { additionalProperties: false },
);

export const ExternalObservationResponseSchema = Type.Object(
  {
    actionId: Type.String({ minLength: 1 }),
    type: Type.Union([
      Type.Literal('external_paid_verified'),
      Type.Literal('fulfillment_observed'),
    ]),
    evidenceReference: Type.String({ minLength: 1, maxLength: 2048 }),
    occurredAt: Type.String({ format: 'date-time' }),
    recordedBy: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);
