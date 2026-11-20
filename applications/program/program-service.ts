import { randomUUID } from 'node:crypto';
import { ApplicationError } from '../core/application-error.js';

export type ProgramRunStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type ProgramApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type ProgramEnrollmentStatus =
  | 'confirmed'
  | 'withdrawn_before_start'
  | 'withdrawn_after_start';
export type ProgramSessionStatus = 'planned' | 'held' | 'cancelled';
export type ProgramAttendanceStatus = 'attended' | 'absent';

export interface ProgramOfferingTerms {
  title: string;
  description: string;
  location: string;
}

export interface ProgramOffering {
  id: string;
  providerId: string;
  revision: number;
  draft: ProgramOfferingTerms;
  published?: { version: number; terms: ProgramOfferingTerms };
}

export interface ProgramRun {
  id: string;
  offeringId: string;
  providerId: string;
  status: ProgramRunStatus;
  startsAt: string;
  endsAt: string;
  location: string;
  capacity: number;
  createdAt: string;
  cancelledAt?: string;
  completedAt?: string;
}

export interface ProgramSessionChange {
  reason: string;
  previous: Pick<ProgramSession, 'scheduledStart' | 'scheduledEnd' | 'location'>;
  next: Pick<ProgramSession, 'scheduledStart' | 'scheduledEnd' | 'location'>;
  actorId: string;
  occurredAt: string;
  correlationId: string;
}

export interface ProgramSession {
  id: string;
  runId: string;
  sequence: number;
  scheduledStart: string;
  scheduledEnd: string;
  location: string;
  status: ProgramSessionStatus;
  changes: ProgramSessionChange[];
}

export interface ProgramApplication {
  id: string;
  runId: string;
  accountId: string;
  status: ProgramApplicationStatus;
  createdAt: string;
  decidedAt?: string;
  withdrawnAt?: string;
  correlationId: string;
}

export interface ProgramEnrollment {
  id: string;
  applicationId: string;
  runId: string;
  accountId: string;
  status: ProgramEnrollmentStatus;
  confirmedAt: string;
  withdrawnAt?: string;
  correlationId: string;
}

export interface ProgramAttendance {
  id: string;
  sessionId: string;
  enrollmentId: string;
  status: ProgramAttendanceStatus;
  recordedAt: string;
  actorId: string;
  correlationId: string;
}

export interface ProgramCompletion {
  id: string;
  enrollmentId: string;
  completed: boolean;
  reason: string;
  recordedAt: string;
  actorId: string;
  correlationId: string;
}

export interface ProgramAudit {
  id: string;
  targetType: string;
  targetId: string;
  action: string;
  before: object;
  after: object;
  reason: string;
  actorId: string;
  actorAccountId?: string;
  occurredAt: string;
  correlationId: string;
}

export interface ProgramTransaction {
  now(): Promise<string>;
  intakeOpen(): Promise<boolean>;
  offering(id: string): Promise<ProgramOffering | undefined>;
  offerings(providerId: string): Promise<ProgramOffering[]>;
  saveOffering(offering: ProgramOffering): Promise<void>;
  run(id: string, lock?: boolean): Promise<ProgramRun | undefined>;
  runs(providerId?: string): Promise<ProgramRun[]>;
  saveRun(run: ProgramRun): Promise<void>;
  sessions(runId: string): Promise<ProgramSession[]>;
  session(id: string): Promise<ProgramSession | undefined>;
  saveSession(session: ProgramSession): Promise<void>;
  applications(runId: string): Promise<ProgramApplication[]>;
  applicationsForAccount(accountId: string): Promise<ProgramApplication[]>;
  application(id: string): Promise<ProgramApplication | undefined>;
  saveApplication(application: ProgramApplication): Promise<void>;
  enrollmentByApplication(applicationId: string): Promise<ProgramEnrollment | undefined>;
  enrollment(id: string): Promise<ProgramEnrollment | undefined>;
  enrollments(runId: string): Promise<ProgramEnrollment[]>;
  enrollmentsForAccount(accountId: string): Promise<ProgramEnrollment[]>;
  saveEnrollment(enrollment: ProgramEnrollment): Promise<void>;
  attendance(sessionId: string, enrollmentId: string): Promise<ProgramAttendance | undefined>;
  attendances(runId: string): Promise<ProgramAttendance[]>;
  saveAttendance(attendance: ProgramAttendance): Promise<void>;
  completion(enrollmentId: string): Promise<ProgramCompletion | undefined>;
  completions(runId: string): Promise<ProgramCompletion[]>;
  saveCompletion(completion: ProgramCompletion): Promise<void>;
  audit(audit: ProgramAudit): Promise<void>;
}

export interface ProgramStore {
  transact<Result>(work: (transaction: ProgramTransaction) => Promise<Result>): Promise<Result>;
}

function fail(category: ApplicationError['category'], code: string, message: string): never {
  throw new ApplicationError({ category, code, message });
}

function requireInput(condition: boolean, code: string, message: string): asserts condition {
  if (!condition) fail('validation', code, message);
}

function notFound(message = 'Program record not found.'): never {
  return fail('not_found', 'program_not_found', message);
}

function normalizeTerms(input: ProgramOfferingTerms): ProgramOfferingTerms {
  const terms = {
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location.trim(),
  };
  requireInput(terms.title.length > 0, 'program_title_required', 'Program title is required.');
  requireInput(
    terms.description.length > 0,
    'program_description_required',
    'Program description is required.',
  );
  requireInput(terms.location.length > 0, 'program_location_required', 'Program location is required.');
  return terms;
}

function auditContext(
  targetType: string,
  targetId: string,
  action: string,
  actorId: string,
  correlationId: string,
  occurredAt: string,
  before: object,
  after: object,
  reason: string,
  actorAccountId?: string,
): ProgramAudit {
  return {
    id: randomUUID(),
    targetType,
    targetId,
    action,
    actorId,
    ...(actorAccountId === undefined ? {} : { actorAccountId }),
    occurredAt,
    correlationId,
    before,
    after,
    reason,
  };
}

function firstSession(sessions: ProgramSession[]): ProgramSession | undefined {
  return [...sessions].sort((left, right) => left.sequence - right.sequence)[0];
}

function nextSessionView(input: SessionScheduleInput): ProgramSessionChange['next'] {
  return {
    scheduledStart: input.scheduledStart,
    scheduledEnd: input.scheduledEnd,
    location: input.location.trim(),
  };
}

export interface SessionScheduleInput {
  scheduledStart: string;
  scheduledEnd: string;
  location: string;
  reason?: string;
}

export function createProgramService(store: ProgramStore) {
  return {
    createOffering(providerId: string, terms: ProgramOfferingTerms) {
      return store.transact(async (transaction) => {
        const now = await transaction.now();
        const offering: ProgramOffering = {
          id: randomUUID(),
          providerId,
          revision: 1,
          draft: normalizeTerms(terms),
        };
        await transaction.saveOffering(offering);
        await transaction.audit(
          auditContext(
            'program_offering',
            offering.id,
            'create_program_offering',
            providerId,
            providerId,
            now,
            {},
            offering,
            'Program offering created',
          ),
        );
        return offering;
      });
    },
    providerOfferings(providerId: string) {
      return store.transact((transaction) => transaction.offerings(providerId));
    },
    publishOffering(providerId: string, offeringId: string, expectedRevision: number) {
      return store.transact(async (transaction) => {
        const offering = await transaction.offering(offeringId);
        if (offering?.providerId !== providerId) notFound('Program offering not found.');
        if (offering.revision !== expectedRevision)
          fail('conflict', 'program_offering_revision_conflict', 'The offering changed. Reload it.');
        const now = await transaction.now();
        const published = {
          ...offering,
          revision: offering.revision + 1,
          published: { version: (offering.published?.version ?? 0) + 1, terms: offering.draft },
        };
        await transaction.saveOffering(published);
        await transaction.audit(
          auditContext(
            'program_offering',
            offering.id,
            'publish_program_offering',
            providerId,
            providerId,
            now,
            offering,
            published,
            'Program offering published',
          ),
        );
        return published;
      });
    },
    createRun(
      providerId: string,
      input: { offeringId: string; startsAt: string; endsAt: string; location: string; capacity: number },
    ) {
      return store.transact(async (transaction) => {
        const offering = await transaction.offering(input.offeringId);
        if (offering?.providerId !== providerId || offering.published === undefined)
          notFound('Published Program offering not found.');
        requireInput(Number.isInteger(input.capacity) && input.capacity > 0, 'program_capacity_invalid', 'Capacity must be positive.');
        requireInput(Date.parse(input.startsAt) < Date.parse(input.endsAt), 'program_schedule_invalid', 'Program schedule is invalid.');
        requireInput(input.location.trim().length > 0, 'program_location_required', 'Program location is required.');
        const now = await transaction.now();
        const run: ProgramRun = {
          id: randomUUID(), offeringId: input.offeringId, providerId, status: 'draft',
          startsAt: input.startsAt, endsAt: input.endsAt, location: input.location.trim(),
          capacity: input.capacity, createdAt: now,
        };
        await transaction.saveRun(run);
        await transaction.audit(auditContext('program_run', run.id, 'create_program_run', providerId, providerId, now, {}, run, 'Program run created'));
        return run;
      });
    },
    providerRuns(providerId: string) {
      return store.transact(async (transaction) => Promise.all((await transaction.runs(providerId)).map((run) => hydrateRun(transaction, run))));
    },
    publishRun(providerId: string, runId: string) {
      return store.transact(async (transaction) => {
        const run = await ownedRun(transaction, runId, providerId);
        requireInput((await transaction.sessions(runId)).length > 0, 'program_sessions_required', 'Add at least one session before publishing.');
        requireInput(run.status === 'draft', 'program_run_not_publishable', 'Only a draft Program run can be published.');
        const now = await transaction.now();
        const published = { ...run, status: 'published' as const };
        await transaction.saveRun(published);
        await transaction.audit(auditContext('program_run', run.id, 'publish_program_run', providerId, providerId, now, run, published, 'Program run published'));
        return hydrateRun(transaction, published);
      });
    },
    publicRuns() {
      return store.transact(async (transaction) => {
        const runs = (await transaction.runs()).filter((run) => run.status === 'published');
        const intakeOpen = await transaction.intakeOpen();
        const now = await transaction.now();
        return Promise.all(runs.map((run) => publicRunView(transaction, run, intakeOpen, now)));
      });
    },
    publicRun(runId: string) {
      return store.transact(async (transaction) => {
        const run = await transaction.run(runId);
        if (run?.status !== 'published') notFound('Published Program run not found.');
        return publicRunView(transaction, run, await transaction.intakeOpen(), await transaction.now());
      });
    },
    myApplications(accountId: string) {
      return store.transact(async (transaction) => transaction.applicationsForAccount(accountId));
    },
    myEnrollments(accountId: string) {
      return store.transact(async (transaction) => {
        const enrollments = await transaction.enrollmentsForAccount(accountId);
        return Promise.all(enrollments.map(async (enrollment) => ({ ...enrollment, sessions: await transaction.sessions(enrollment.runId), completion: await transaction.completion(enrollment.id) })));
      });
    },
    apply(accountId: string, runId: string, correlationId: string) {
      return store.transact(async (transaction) => {
        if (!(await transaction.intakeOpen())) fail('conflict', 'program_intake_paused', 'Program is not accepting new applications.');
        const run = await transaction.run(runId, true);
        if (run?.status !== 'published') notFound('Published Program run not found.');
        const sessions = await transaction.sessions(runId);
        requireInput(Date.parse(await transaction.now()) < Date.parse(sessions[0]?.scheduledStart ?? run.startsAt), 'program_run_started', 'This Program run has already started.');
        const existing = (await transaction.applications(runId)).find((item) => item.accountId === accountId);
        if (existing?.status !== undefined && existing.status !== 'withdrawn')
          fail('conflict', 'program_application_exists', 'You already have an application for this Program run.');
        const occupancy = await occupiedCount(transaction, runId);
        if (occupancy >= run.capacity) fail('conflict', 'program_capacity_full', 'This Program run is full.');
        const now = await transaction.now();
        const application: ProgramApplication = existing === undefined
          ? { id: randomUUID(), runId, accountId, status: 'pending', createdAt: now, correlationId }
          : { ...existing, status: 'pending', createdAt: now, withdrawnAt: undefined, decidedAt: undefined, correlationId };
        await transaction.saveApplication(application);
        await transaction.audit(auditContext('program_application', application.id, 'submit_program_application', accountId, correlationId, now, {}, application, 'Program application submitted', accountId));
        return application;
      });
    },
    withdrawApplication(accountId: string, applicationId: string, correlationId: string) {
      return store.transact(async (transaction) => {
        const application = await transaction.application(applicationId);
        if (application?.accountId !== accountId) notFound('Program application not found.');
        if (application.status !== 'pending') fail('conflict', 'program_application_not_withdrawable', 'Only a pending application can be withdrawn.');
        const now = await transaction.now();
        const updated = { ...application, status: 'withdrawn' as const, withdrawnAt: now };
        await transaction.saveApplication(updated);
        await transaction.audit(auditContext('program_application', application.id, 'withdraw_program_application', accountId, correlationId, now, application, updated, 'Program application withdrawn', accountId));
        return updated;
      });
    },
    providerApplications(providerId: string, runId: string) {
      return store.transact(async (transaction) => { await ownedRun(transaction, runId, providerId); return transaction.applications(runId); });
    },
    approveApplication(providerId: string, applicationId: string, actorAccountId: string, correlationId: string) {
      return store.transact(async (transaction) => {
        const application = await transaction.application(applicationId);
        if (application === undefined) notFound('Program application not found.');
        const run = await ownedRun(transaction, application.runId, providerId);
        if (application.status !== 'pending') fail('conflict', 'program_application_already_decided', 'This application has already been decided.');
        const now = await transaction.now();
        const updatedApplication = { ...application, status: 'approved' as const, decidedAt: now };
        await transaction.saveApplication(updatedApplication);
        const enrollment: ProgramEnrollment = { id: randomUUID(), applicationId: application.id, runId: run.id, accountId: application.accountId, status: 'confirmed', confirmedAt: now, correlationId };
        await transaction.saveEnrollment(enrollment);
        await transaction.audit(auditContext('program_application', application.id, 'approve_program_application', providerId, correlationId, now, application, updatedApplication, 'Program application approved', actorAccountId));
        return enrollment;
      });
    },
    rejectApplication(providerId: string, applicationId: string, actorAccountId: string, correlationId: string) {
      return store.transact(async (transaction) => {
        const application = await transaction.application(applicationId);
        if (application === undefined) notFound('Program application not found.');
        await ownedRun(transaction, application.runId, providerId);
        if (application.status !== 'pending') fail('conflict', 'program_application_already_decided', 'This application has already been decided.');
        const now = await transaction.now();
        const updated = { ...application, status: 'rejected' as const, decidedAt: now };
        await transaction.saveApplication(updated);
        await transaction.audit(auditContext('program_application', application.id, 'reject_program_application', providerId, correlationId, now, application, updated, 'Program application rejected', actorAccountId));
        return updated;
      });
    },
    withdrawEnrollment(accountId: string, enrollmentId: string, correlationId: string) {
      return store.transact(async (transaction) => {
        const enrollment = await transaction.enrollment(enrollmentId);
        if (enrollment?.accountId !== accountId) notFound('Program enrollment not found.');
        if (enrollment.status !== 'confirmed') fail('conflict', 'program_enrollment_already_withdrawn', 'This enrollment has already been withdrawn.');
        const run = await transaction.run(enrollment.runId, true);
        if (run === undefined) notFound();
        const first = firstSession(await transaction.sessions(run.id));
        const now = await transaction.now();
        const beforeStart = Date.parse(now) < Date.parse(first?.scheduledStart ?? run.startsAt);
        const updated = { ...enrollment, status: beforeStart ? ('withdrawn_before_start' as const) : ('withdrawn_after_start' as const), withdrawnAt: now };
        await transaction.saveEnrollment(updated);
        await transaction.audit(auditContext('program_enrollment', enrollment.id, beforeStart ? 'withdraw_program_enrollment_before_start' : 'withdraw_program_enrollment_after_start', accountId, correlationId, now, enrollment, updated, 'Program enrollment withdrawn', accountId));
        return updated;
      });
    },
    addSession(providerId: string, runId: string, input: SessionScheduleInput, correlationId: string) {
      return store.transact(async (transaction) => {
        const run = await ownedRun(transaction, runId, providerId);
        requireInput(run.status === 'draft' || run.status === 'published', 'program_run_not_editable', 'This Program run cannot be changed.');
        validateSchedule(input);
        const sessions = await transaction.sessions(runId);
        const now = await transaction.now();
        const session: ProgramSession = { id: randomUUID(), runId, sequence: sessions.length + 1, scheduledStart: input.scheduledStart, scheduledEnd: input.scheduledEnd, location: input.location.trim(), status: 'planned', changes: [] };
        await transaction.saveSession(session);
        await transaction.audit(auditContext('program_session', session.id, 'create_program_session', providerId, correlationId, now, {}, session, 'Program session created', providerId));
        return session;
      });
    },
    changeSession(providerId: string, sessionId: string, input: SessionScheduleInput, correlationId: string) {
      return store.transact(async (transaction) => {
        const session = await transaction.session(sessionId);
        if (session === undefined) notFound('Program session not found.');
        const run = await ownedRun(transaction, session.runId, providerId);
        requireInput(run.status === 'draft' || run.status === 'published', 'program_run_not_editable', 'This Program run cannot be changed.');
        validateSchedule(input);
        const reason = input.reason?.trim() ?? '';
        requireInput(reason.length > 0, 'program_session_change_reason_required', 'A session change reason is required.');
        const now = await transaction.now();
        const next = nextSessionView(input);
        const change: ProgramSessionChange = { reason, previous: { scheduledStart: session.scheduledStart, scheduledEnd: session.scheduledEnd, location: session.location }, next, actorId: providerId, occurredAt: now, correlationId };
        const updated = { ...session, ...next, changes: [...session.changes, change] };
        await transaction.saveSession(updated);
        await transaction.audit(auditContext('program_session', session.id, 'change_program_session', providerId, correlationId, now, session, updated, reason, providerId));
        return updated;
      });
    },
    recordAttendance(providerId: string, sessionId: string, entries: readonly { enrollmentId: string; status: ProgramAttendanceStatus }[], correlationId: string) {
      return store.transact(async (transaction) => {
        const session = await transaction.session(sessionId);
        if (session === undefined) notFound('Program session not found.');
        await ownedRun(transaction, session.runId, providerId);
        const now = await transaction.now();
        const enrollments = await transaction.enrollments(session.runId);
        const allowed = new Set(enrollments.filter((item) => item.status === 'confirmed').map((item) => item.id));
        const result: ProgramAttendance[] = [];
        for (const entry of entries) {
          requireInput(allowed.has(entry.enrollmentId), 'program_enrollment_not_found', 'Enrollment is not part of this Program run.');
          const existing = await transaction.attendance(session.id, entry.enrollmentId);
          if (existing !== undefined && existing.status !== entry.status) fail('conflict', 'program_attendance_conflict', 'Attendance already has a different recorded status.');
          const attendance = existing ?? { id: randomUUID(), sessionId: session.id, enrollmentId: entry.enrollmentId, status: entry.status, recordedAt: now, actorId: providerId, correlationId };
          await transaction.saveAttendance(attendance);
          result.push(attendance);
        }
        await transaction.audit(auditContext('program_session', session.id, 'record_program_attendance', providerId, correlationId, now, {}, { entries: result }, 'Program attendance recorded', providerId));
        return result;
      });
    },
    runAttendance(providerId: string, runId: string) {
      return store.transact(async (transaction) => { await ownedRun(transaction, runId, providerId); return transaction.attendances(runId); });
    },
    cancelRun(providerId: string, runId: string, reason: string, correlationId: string) {
      return store.transact(async (transaction) => {
        const run = await ownedRun(transaction, runId, providerId);
        requireInput(run.status === 'published', 'program_run_not_cancellable', 'Only a published Program run can be cancelled.');
        requireInput(reason.trim().length > 0, 'program_cancel_reason_required', 'A cancellation reason is required.');
        const now = await transaction.now();
        const updated = { ...run, status: 'cancelled' as const, cancelledAt: now };
        await transaction.saveRun(updated);
        await transaction.audit(auditContext('program_run', run.id, 'cancel_program_run', providerId, correlationId, now, run, updated, reason.trim(), providerId));
        return updated;
      });
    },
    completeRun(providerId: string, runId: string, entries: readonly { enrollmentId: string; completed: boolean; reason: string }[], actorAccountId: string, correlationId: string) {
      return store.transact(async (transaction) => {
        const run = await ownedRun(transaction, runId, providerId);
        requireInput(run.status === 'published', 'program_run_not_completable', 'Only a published Program run can be completed.');
        const sessions = await transaction.sessions(runId);
        const now = await transaction.now();
        requireInput(Date.parse(now) >= Date.parse(sessions.reduce((latest, item) => item.scheduledEnd > latest ? item.scheduledEnd : latest, run.endsAt)), 'program_run_not_finished', 'The final Program session has not ended.');
        const enrollments = (await transaction.enrollments(runId)).filter(
          (item) => item.status === 'confirmed',
        );
        requireInput(entries.length === enrollments.length && enrollments.every((item) => entries.some((entry) => entry.enrollmentId === item.id)), 'program_completions_incomplete', 'Record a completion result for every enrollment.');
        const completions: ProgramCompletion[] = [];
        for (const entry of entries) {
          const enrollment = enrollments.find((item) => item.id === entry.enrollmentId);
          if (enrollment === undefined) notFound('Program enrollment not found.');
          requireInput(entry.reason.trim().length > 0, 'program_completion_reason_required', 'A completion reason is required.');
          const existing = await transaction.completion(enrollment.id);
          if (existing !== undefined) { completions.push(existing); continue; }
          const completion: ProgramCompletion = { id: randomUUID(), enrollmentId: enrollment.id, completed: entry.completed, reason: entry.reason.trim(), recordedAt: now, actorId: providerId, correlationId };
          await transaction.saveCompletion(completion);
          completions.push(completion);
        }
        const updated = { ...run, status: 'completed' as const, completedAt: now };
        await transaction.saveRun(updated);
        await transaction.audit(auditContext('program_run', run.id, 'complete_program_run', providerId, correlationId, now, run, updated, 'Program run completed', actorAccountId));
        return { run: updated, completions };
      });
    },
  };
}

async function ownedRun(transaction: ProgramTransaction, runId: string, providerId: string): Promise<ProgramRun> {
  const run = await transaction.run(runId, true);
  if (run?.providerId !== providerId) notFound('Program run not found.');
  return run;
}

async function publicRunView(
  transaction: ProgramTransaction,
  run: ProgramRun,
  intakeOpen: boolean,
  now: string,
) {
  const sessions = await transaction.sessions(run.id);
  const remainingCapacity = Math.max(0, run.capacity - await occupiedCount(transaction, run.id));
  const firstStart = firstSession(sessions)?.scheduledStart ?? run.startsAt;
  return {
    id: run.id,
    location: run.location,
    startsAt: run.startsAt,
    endsAt: run.endsAt,
    remainingCapacity,
    acceptsApplications: intakeOpen && remainingCapacity > 0 && Date.parse(now) < Date.parse(firstStart),
    sessions: sessions.map(({ id, sequence, scheduledStart, scheduledEnd, location }) => ({
      id, sequence, scheduledStart, scheduledEnd, location,
    })),
  };
}

async function hydrateRun(transaction: ProgramTransaction, run: ProgramRun) {
  const sessions = await transaction.sessions(run.id);
  const applications = await transaction.applications(run.id);
  const enrollments = await transaction.enrollments(run.id);
  const occupancy = enrollments.filter((item) => item.status === 'confirmed').length + applications.filter((item) => item.status === 'pending').length;
  return { ...run, sessions, applications, enrollments, occupancy, remainingCapacity: Math.max(0, run.capacity - occupancy) };
}

async function occupiedCount(transaction: ProgramTransaction, runId: string): Promise<number> {
  const applications = await transaction.applications(runId);
  const enrollments = await transaction.enrollments(runId);
  return applications.filter((item) => item.status === 'pending').length + enrollments.filter((item) => item.status === 'confirmed').length;
}

function validateSchedule(input: SessionScheduleInput): void {
  requireInput(Date.parse(input.scheduledStart) < Date.parse(input.scheduledEnd), 'program_session_schedule_invalid', 'Session schedule is invalid.');
  requireInput(input.location.trim().length > 0, 'program_location_required', 'Session location is required.');
}

export type ProgramService = ReturnType<typeof createProgramService>;
