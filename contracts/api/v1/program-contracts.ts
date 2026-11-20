import { Type, type Static } from 'typebox';

const id = Type.String({ pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' });
const date = Type.String({ minLength: 1 });
const params = Type.Object({ id });
const sessionParams = Type.Object({ sessionId: id });
const applicationParams = Type.Object({ applicationId: id });
const enrollmentParams = Type.Object({ enrollmentId: id });
const revision = Type.Integer({ minimum: 1, maximum: 2147483647 });

export const ProgramOfferingTermsSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 120 }),
  description: Type.String({ minLength: 1, maxLength: 4000 }),
  location: Type.String({ minLength: 1, maxLength: 300 }),
}, { additionalProperties: false });

export const ProgramRunCreateSchema = Type.Object({
  offeringId: id,
  startsAt: date,
  endsAt: date,
  location: Type.String({ minLength: 1, maxLength: 300 }),
  capacity: Type.Integer({ minimum: 1, maximum: 100000 }),
}, { additionalProperties: false });

export const ProgramPublishOfferingSchema = Type.Object({ expectedRevision: revision }, { additionalProperties: false });
export const ProgramSessionSchema = Type.Object({
  scheduledStart: date,
  scheduledEnd: date,
  location: Type.String({ minLength: 1, maxLength: 300 }),
  reason: Type.Optional(Type.String({ maxLength: 500 })),
}, { additionalProperties: false });
export const ProgramApplicationSchema = Type.Object({}, { additionalProperties: false });
export const ProgramSessionDeliverySchema = Type.Object({
  status: Type.Union([Type.Literal('held'), Type.Literal('cancelled')]),
}, { additionalProperties: false });
export const ProgramAttendanceSchema = Type.Object({
  entries: Type.Array(Type.Object({ enrollmentId: id, status: Type.Union([Type.Literal('attended'), Type.Literal('absent')]) }, { additionalProperties: false }), { minItems: 1 }),
}, { additionalProperties: false });
export const ProgramCancelSchema = Type.Object({ reason: Type.String({ minLength: 1, maxLength: 500 }) }, { additionalProperties: false });
export const ProgramCompletionSchema = Type.Object({
  entries: Type.Array(Type.Object({ enrollmentId: id, completed: Type.Boolean(), reason: Type.String({ minLength: 1, maxLength: 500 }) }, { additionalProperties: false })),
}, { additionalProperties: false });

export type ProgramOfferingTermsBody = Static<typeof ProgramOfferingTermsSchema>;
export type ProgramRunCreateBody = Static<typeof ProgramRunCreateSchema>;
export type ProgramSessionBody = Static<typeof ProgramSessionSchema>;
export type ProgramSessionDeliveryBody = Static<typeof ProgramSessionDeliverySchema>;
export type ProgramAttendanceBody = Static<typeof ProgramAttendanceSchema>;
export type ProgramCancelBody = Static<typeof ProgramCancelSchema>;
export type ProgramCompletionBody = Static<typeof ProgramCompletionSchema>;
export { params as ProgramIdParameters, sessionParams as ProgramSessionParameters, applicationParams as ProgramApplicationParameters, enrollmentParams as ProgramEnrollmentParameters };
