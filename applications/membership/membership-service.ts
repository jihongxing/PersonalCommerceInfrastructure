import { randomUUID } from 'node:crypto';
import { ApplicationError } from '../core/application-error.js';

export interface MembershipTerms {
  title: string;
  location: string;
  benefits: string;
  terms: string;
  durationDays: number;
}

export interface MembershipOffering {
  id: string;
  providerId: string;
  revision: number;
  draft: MembershipTerms;
  published?: { version: number; terms: MembershipTerms };
}

export interface MembershipApplication {
  id: string;
  offeringId: string;
  accountId: string;
  version: number;
  acceptedTerms: MembershipTerms;
  acceptedAt: string;
  correlationId: string;
}

export interface Membership {
  id: string;
  applicationId: string;
  offeringId: string;
  accountId: string;
  termsVersion: number;
  approvedBy: string;
  approvedByAccountId: string;
  identityCheckedInPerson: true;
  validFrom: string;
  validUntil: string;
  correlationId: string;
}

interface MembershipFactContext {
  id: string;
  membershipId: string;
  actorId: string;
  actorAccountId: string;
  occurredAt: string;
  correlationId: string;
}

export type MembershipFact = MembershipFactContext &
  (
    | { kind: 'verification'; eligible: boolean; identityCheckedInPerson: true }
    | { kind: 'admission'; verificationId: string }
    | {
        kind: 'admission_correction';
        admissionId: string;
        reason: string;
        before: 'recorded';
        after: 'voided';
      }
  );

export interface MembershipTransaction {
  intakeOpen(): Promise<boolean>;
  now(): Promise<string>;
  offering(id: string): Promise<MembershipOffering | undefined>;
  offerings(providerId: string): Promise<MembershipOffering[]>;
  saveOffering(offering: MembershipOffering): Promise<void>;
  applications(
    scope: { offeringId: string } | { accountId: string },
  ): Promise<MembershipApplication[]>;
  findApplication(
    offeringId: string,
    accountId: string,
  ): Promise<MembershipApplication | undefined>;
  application(id: string): Promise<MembershipApplication | undefined>;
  addApplication(application: MembershipApplication): Promise<void>;
  memberByApplication(applicationId: string): Promise<Membership | undefined>;
  membership(id: string): Promise<Membership | undefined>;
  addMembership(membership: Membership): Promise<void>;
  facts(membershipId: string): Promise<MembershipFact[]>;
  addFact(fact: MembershipFact): Promise<void>;
}

export interface MembershipStore {
  transact<Result>(work: (transaction: MembershipTransaction) => Promise<Result>): Promise<Result>;
}

function unavailable(): never {
  throw new ApplicationError({
    category: 'not_found',
    code: 'membership_not_found',
    message: 'Membership record not found.',
  });
}

function conflict(code: string, message: string): never {
  throw new ApplicationError({ category: 'conflict', code, message });
}

function requireInput(condition: boolean, code: string, message: string): asserts condition {
  if (!condition) throw new ApplicationError({ category: 'validation', code, message });
}

async function requireOpen(transaction: MembershipTransaction) {
  if (!(await transaction.intakeOpen()))
    conflict('membership_intake_paused', 'Membership is not accepting applications or approvals.');
}

async function ownedOffering(
  transaction: MembershipTransaction,
  offeringId: string,
  providerId: string,
) {
  const offering = await transaction.offering(offeringId);
  if (offering?.providerId !== providerId) unavailable();
  return offering;
}

function memberStatus(membership: Membership, now: string) {
  return now >= membership.validFrom && now < membership.validUntil
    ? ('active' as const)
    : ('expired' as const);
}

async function viewApplication(
  transaction: MembershipTransaction,
  application: MembershipApplication,
  now: string,
) {
  const membership = await transaction.memberByApplication(application.id);
  return membership === undefined
    ? { ...application, status: 'pending' as const }
    : {
        ...application,
        status: memberStatus(membership, now),
        membership: {
          id: membership.id,
          validFrom: membership.validFrom,
          validUntil: membership.validUntil,
        },
      };
}

function normalizeTerms(input: MembershipTerms): MembershipTerms {
  const terms = {
    title: input.title.trim(),
    location: input.location.trim(),
    benefits: input.benefits.trim(),
    terms: input.terms.trim(),
    durationDays: input.durationDays,
  };
  requireInput(
    !!(terms.title && terms.location && terms.benefits && terms.terms),
    'membership_terms_required',
    'Complete all offering terms.',
  );
  return terms;
}

export function createMembershipService(store: MembershipStore) {
  return {
    createOffering(providerId: string, terms: MembershipTerms) {
      return store.transact(async (transaction) => {
        const offering = {
          id: randomUUID(),
          providerId,
          revision: 1,
          draft: normalizeTerms(terms),
        };
        await transaction.saveOffering(offering);
        return offering;
      });
    },
    reviseOffering(
      providerId: string,
      offeringId: string,
      expectedRevision: number,
      terms: MembershipTerms,
    ) {
      return store.transact(async (transaction) => {
        const offering = await ownedOffering(transaction, offeringId, providerId);
        if (offering.revision !== expectedRevision)
          conflict('membership_offering_stale', 'Reload the current offering.');
        const updated = {
          ...offering,
          revision: offering.revision + 1,
          draft: normalizeTerms(terms),
        };
        await transaction.saveOffering(updated);
        return updated;
      });
    },
    publishOffering(providerId: string, offeringId: string, expectedRevision: number) {
      return store.transact(async (transaction) => {
        const offering = await ownedOffering(transaction, offeringId, providerId);
        if (offering.revision !== expectedRevision)
          conflict('membership_offering_stale', 'Reload the current offering.');
        if (offering.published?.version === offering.revision) return offering;
        const published = {
          ...offering,
          published: { version: offering.revision, terms: offering.draft },
        };
        await transaction.saveOffering(published);
        return published;
      });
    },
    providerOfferings(providerId: string) {
      return store.transact((transaction) => transaction.offerings(providerId));
    },
    publicOffering(offeringId: string) {
      return store.transact(async (transaction) => {
        const offering = await transaction.offering(offeringId);
        if (!offering?.published) unavailable();
        return {
          id: offering.id,
          ...offering.published,
          intakeOpen: await transaction.intakeOpen(),
        };
      });
    },
    apply(input: {
      accountId: string;
      offeringId: string;
      version: number;
      accepted: boolean;
      correlationId: string;
    }) {
      return store.transact(async (transaction) => {
        await requireOpen(transaction);
        requireInput(
          input.accepted,
          'membership_acceptance_required',
          'Accept the exact published terms to apply.',
        );
        const offering = await transaction.offering(input.offeringId);
        if (!offering?.published) unavailable();
        const existing = await transaction.findApplication(input.offeringId, input.accountId);
        if (existing?.version === input.version) return existing;
        if (existing)
          conflict(
            'membership_application_exists',
            'This account already applied for the offering.',
          );
        if (offering.published.version !== input.version)
          conflict('membership_terms_stale', 'Read and accept the current terms.');
        const application = {
          id: randomUUID(),
          offeringId: offering.id,
          accountId: input.accountId,
          version: input.version,
          acceptedTerms: offering.published.terms,
          acceptedAt: await transaction.now(),
          correlationId: input.correlationId,
        };
        await transaction.addApplication(application);
        return application;
      });
    },
    myApplications(accountId: string) {
      return store.transact(async (transaction) => {
        const now = await transaction.now();
        return Promise.all(
          (await transaction.applications({ accountId })).map((application) =>
            viewApplication(transaction, application, now),
          ),
        );
      });
    },
    providerApplications(providerId: string, offeringId: string) {
      return store.transact(async (transaction) => {
        await ownedOffering(transaction, offeringId, providerId);
        const now = await transaction.now();
        return Promise.all(
          (await transaction.applications({ offeringId })).map((application) =>
            viewApplication(transaction, application, now),
          ),
        );
      });
    },
    approve(input: {
      providerId: string;
      actorAccountId: string;
      applicationId: string;
      identityChecked: boolean;
      correlationId: string;
    }) {
      return store.transact(async (transaction) => {
        const application = await transaction.application(input.applicationId);
        if (!application) unavailable();
        await ownedOffering(transaction, application.offeringId, input.providerId);
        await requireOpen(transaction);
        requireInput(
          input.identityChecked,
          'membership_identity_check_required',
          'Check the applicant in person before approving.',
        );
        const existing = await transaction.memberByApplication(application.id);
        if (existing) return existing;
        const now = await transaction.now();
        const membership: Membership = {
          id: randomUUID(),
          applicationId: application.id,
          offeringId: application.offeringId,
          accountId: application.accountId,
          termsVersion: application.version,
          approvedBy: input.providerId,
          approvedByAccountId: input.actorAccountId,
          identityCheckedInPerson: true,
          validFrom: now,
          validUntil: new Date(
            Date.parse(now) + application.acceptedTerms.durationDays * 86_400_000,
          ).toISOString(),
          correlationId: input.correlationId,
        };
        await transaction.addMembership(membership);
        return membership;
      });
    },
    activity(providerId: string, offeringId: string, membershipId: string) {
      return store.transact(async (transaction) => {
        await ownedOffering(transaction, offeringId, providerId);
        const membership = await transaction.membership(membershipId);
        if (membership?.offeringId !== offeringId) unavailable();
        return {
          status: memberStatus(membership, await transaction.now()),
          facts: await transaction.facts(membership.id),
        };
      });
    },
    record(
      input: {
        providerId: string;
        actorAccountId: string;
        offeringId: string;
        membershipId: string;
        correlationId: string;
      } & (
        | { kind: 'verification'; identityChecked: boolean }
        | { kind: 'admission'; verificationId: string; occurred: boolean }
        | { kind: 'admission_correction'; admissionId: string; reason: string }
      ),
    ) {
      return store.transact(async (transaction) => {
        await ownedOffering(transaction, input.offeringId, input.providerId);
        const membership = await transaction.membership(input.membershipId);
        if (membership?.offeringId !== input.offeringId) unavailable();
        const now = await transaction.now();
        const context = {
          id: randomUUID(),
          membershipId: membership.id,
          actorId: input.providerId,
          actorAccountId: input.actorAccountId,
          occurredAt: now,
          correlationId: input.correlationId,
        };
        const eligible = memberStatus(membership, now) === 'active';
        let fact: MembershipFact;
        if (input.kind === 'verification') {
          requireInput(
            input.identityChecked,
            'membership_identity_check_required',
            'Check the member in person.',
          );
          fact = { ...context, kind: input.kind, eligible, identityCheckedInPerson: true };
        } else if (input.kind === 'admission') {
          requireInput(
            input.occurred,
            'membership_admission_confirmation_required',
            'Confirm actual admission.',
          );
          if (!eligible) conflict('membership_not_active', 'The membership is not active.');
          const facts = await transaction.facts(membership.id);
          const verification = facts.find((entry) => entry.id === input.verificationId);
          if (verification?.kind !== 'verification' || !verification.eligible)
            conflict('membership_verification_required', 'Record a successful verification first.');
          const previous = facts.find(
            (entry) => entry.kind === 'admission' && entry.verificationId === verification.id,
          );
          if (previous) return previous;
          fact = { ...context, kind: input.kind, verificationId: verification.id };
        } else {
          const reason = input.reason.trim();
          requireInput(
            !!reason,
            'membership_correction_reason_required',
            'Describe the erroneous registration.',
          );
          const facts = await transaction.facts(membership.id);
          if (!facts.some((entry) => entry.id === input.admissionId && entry.kind === 'admission'))
            unavailable();
          if (
            facts.some(
              (entry) =>
                entry.kind === 'admission_correction' && entry.admissionId === input.admissionId,
            )
          )
            conflict(
              'membership_admission_already_corrected',
              'The admission is already corrected.',
            );
          fact = {
            ...context,
            kind: input.kind,
            admissionId: input.admissionId,
            reason,
            before: 'recorded',
            after: 'voided',
          };
        }
        await transaction.addFact(fact);
        return fact;
      });
    },
  };
}

export type MembershipService = ReturnType<typeof createMembershipService>;
