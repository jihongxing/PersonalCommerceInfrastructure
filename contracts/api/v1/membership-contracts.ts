import { Type, type Static } from 'typebox';

const identifier = Type.String({
  pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
});
const revision = Type.Integer({ minimum: 1, maximum: 2147483647 });
export const MembershipIdParameters = Type.Object({ id: identifier });
export const MembershipActivityParameters = Type.Object({ id: identifier, memberId: identifier });
export const MembershipTermsSchema = Type.Object(
  {
    title: Type.String({ minLength: 1, maxLength: 120 }),
    location: Type.String({ minLength: 1, maxLength: 300 }),
    benefits: Type.String({ minLength: 1, maxLength: 2000 }),
    terms: Type.String({ minLength: 1, maxLength: 4000 }),
    durationDays: Type.Integer({ minimum: 1, maximum: 36500 }),
  },
  { additionalProperties: false },
);
export const MembershipPublishSchema = Type.Object(
  { expectedRevision: revision },
  { additionalProperties: false },
);
export const MembershipReviseSchema = Type.Object(
  { expectedRevision: revision, terms: MembershipTermsSchema },
  { additionalProperties: false },
);
export const MembershipApplySchema = Type.Object(
  { version: revision, accepted: Type.Boolean() },
  { additionalProperties: false },
);
export const MembershipIdentityCheckSchema = Type.Object(
  { identityChecked: Type.Boolean() },
  { additionalProperties: false },
);
export const MembershipAdmissionSchema = Type.Object(
  { verificationId: identifier, occurred: Type.Boolean() },
  { additionalProperties: false },
);
export const MembershipCorrectionSchema = Type.Object(
  { admissionId: identifier, reason: Type.String({ minLength: 1, maxLength: 500 }) },
  { additionalProperties: false },
);

export type MembershipTermsBody = Static<typeof MembershipTermsSchema>;
export type MembershipPublishBody = Static<typeof MembershipPublishSchema>;
export type MembershipReviseBody = Static<typeof MembershipReviseSchema>;
export type MembershipApplyBody = Static<typeof MembershipApplySchema>;
export type MembershipIdentityCheckBody = Static<typeof MembershipIdentityCheckSchema>;
export type MembershipAdmissionBody = Static<typeof MembershipAdmissionSchema>;
export type MembershipCorrectionBody = Static<typeof MembershipCorrectionSchema>;
