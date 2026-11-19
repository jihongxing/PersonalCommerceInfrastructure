import type { Sql, TransactionSql } from 'postgres';
import type {
  ProgramApplication,
  ProgramAttendance,
  ProgramCompletion,
  ProgramEnrollment,
  ProgramOffering,
  ProgramRun,
  ProgramSession,
  ProgramStore,
  ProgramTransaction,
} from '../../../applications/program/program-service.js';

export const programIntakeLock = 71017214;

interface DataRow<Data> {
  data: Data;
}

export async function verifyProgramPersistence(sql: Sql): Promise<void> {
  const [result] = await sql<{ ready: boolean }[]>`
    SELECT bool_and(has_table_privilege(current_user, relation, 'SELECT')
      AND has_table_privilege(current_user, relation, 'INSERT')
      AND has_table_privilege(current_user, relation, 'UPDATE')) AS ready
    FROM unnest(ARRAY[
      'public.program_offerings'::regclass,
      'public.program_runs'::regclass,
      'public.program_sessions'::regclass,
      'public.program_applications'::regclass,
      'public.program_enrollments'::regclass,
      'public.program_attendance'::regclass,
      'public.program_completions'::regclass,
      'public.program_audits'::regclass
    ]) AS tables(relation)`;
  if (!result?.ready) throw new Error('Program persistence grants are required.');
}

function transactionPort(sql: TransactionSql): ProgramTransaction {
  return {
    async now() {
      const [row] = await sql<{ epoch_milliseconds: string }[]>`
        SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::text AS epoch_milliseconds`;
      if (!row) throw new Error('Database clock unavailable');
      return new Date(Number(row.epoch_milliseconds)).toISOString();
    },
    async intakeOpen() {
      const [revision] = await sql<{ state: { open?: unknown } }[]>`
        SELECT after_state AS state FROM public.operations_action_audits
        WHERE target_type='commercial_scenario' AND target_id='Program' AND action='change_scenario_intake'
        ORDER BY id DESC LIMIT 1`;
      return revision?.state.open === true;
    },
    async offering(id) {
      const [row] = await sql<DataRow<ProgramOffering>[]>`SELECT data FROM public.program_offerings WHERE id=${id}`;
      return row?.data;
    },
    async offerings(providerId) {
      return (await sql<DataRow<ProgramOffering>[]>`SELECT data FROM public.program_offerings WHERE provider_id=${providerId} ORDER BY id`).map((row) => row.data);
    },
    async saveOffering(offering) {
      await sql`INSERT INTO public.program_offerings (id, provider_id, data) VALUES (${offering.id}, ${offering.providerId}, ${JSON.stringify(offering)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET data=excluded.data, provider_id=excluded.provider_id`;
    },
    async run(id, lock = false) {
      const rows = lock
        ? await sql<DataRow<ProgramRun>[]>`SELECT data FROM public.program_runs WHERE id=${id} FOR UPDATE`
        : await sql<DataRow<ProgramRun>[]>`SELECT data FROM public.program_runs WHERE id=${id}`;
      return rows[0]?.data;
    },
    async runs(providerId) {
      const rows = providerId === undefined
        ? await sql<DataRow<ProgramRun>[]>`SELECT data FROM public.program_runs ORDER BY created_at, id`
        : await sql<DataRow<ProgramRun>[]>`SELECT data FROM public.program_runs WHERE provider_id=${providerId} ORDER BY created_at, id`;
      return rows.map((row) => row.data);
    },
    async saveRun(run) {
      await sql`INSERT INTO public.program_runs (id, offering_id, provider_id, status, starts_at, ends_at, capacity, created_at, data)
        VALUES (${run.id}, ${run.offeringId}, ${run.providerId}, ${run.status}, ${run.startsAt}, ${run.endsAt}, ${run.capacity}, ${run.createdAt}, ${JSON.stringify(run)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET status=excluded.status, starts_at=excluded.starts_at, ends_at=excluded.ends_at, capacity=excluded.capacity, data=excluded.data`;
    },
    async sessions(runId) {
      return (await sql<DataRow<ProgramSession>[]>`SELECT data FROM public.program_sessions WHERE run_id=${runId} ORDER BY sequence, id`).map((row) => row.data);
    },
    async session(id) {
      const [row] = await sql<DataRow<ProgramSession>[]>`SELECT data FROM public.program_sessions WHERE id=${id}`;
      return row?.data;
    },
    async saveSession(session) {
      await sql`INSERT INTO public.program_sessions (id, run_id, sequence, scheduled_start, scheduled_end, data)
        VALUES (${session.id}, ${session.runId}, ${session.sequence}, ${session.scheduledStart}, ${session.scheduledEnd}, ${JSON.stringify(session)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET scheduled_start=excluded.scheduled_start, scheduled_end=excluded.scheduled_end, data=excluded.data`;
    },
    async applications(runId) {
      return (await sql<DataRow<ProgramApplication>[]>`SELECT data FROM public.program_applications WHERE run_id=${runId} ORDER BY created_at, id`).map((row) => row.data);
    },
    async applicationsForAccount(accountId) {
      return (await sql<DataRow<ProgramApplication>[]>`SELECT data FROM public.program_applications WHERE account_id=${accountId} ORDER BY created_at, id`).map((row) => row.data);
    },
    async application(id) {
      const [row] = await sql<DataRow<ProgramApplication>[]>`SELECT data FROM public.program_applications WHERE id=${id}`;
      return row?.data;
    },
    async saveApplication(application) {
      await sql`INSERT INTO public.program_applications (id, run_id, account_id, status, data, created_at)
        VALUES (${application.id}, ${application.runId}, ${application.accountId}, ${application.status}, ${JSON.stringify(application)}::jsonb, ${application.createdAt})
        ON CONFLICT (id) DO UPDATE SET status=excluded.status, data=excluded.data`;
    },
    async enrollmentByApplication(applicationId) {
      const [row] = await sql<DataRow<ProgramEnrollment>[]>`SELECT data FROM public.program_enrollments WHERE application_id=${applicationId}`;
      return row?.data;
    },
    async enrollment(id) {
      const [row] = await sql<DataRow<ProgramEnrollment>[]>`SELECT data FROM public.program_enrollments WHERE id=${id}`;
      return row?.data;
    },
    async enrollments(runId) {
      return (await sql<DataRow<ProgramEnrollment>[]>`SELECT data FROM public.program_enrollments WHERE run_id=${runId} ORDER BY confirmed_at, id`).map((row) => row.data);
    },
    async enrollmentsForAccount(accountId) {
      return (await sql<DataRow<ProgramEnrollment>[]>`SELECT data FROM public.program_enrollments WHERE account_id=${accountId} ORDER BY confirmed_at, id`).map((row) => row.data);
    },
    async saveEnrollment(enrollment) {
      await sql`INSERT INTO public.program_enrollments (id, application_id, run_id, account_id, status, data, confirmed_at)
        VALUES (${enrollment.id}, ${enrollment.applicationId}, ${enrollment.runId}, ${enrollment.accountId}, ${enrollment.status}, ${JSON.stringify(enrollment)}::jsonb, ${enrollment.confirmedAt})
        ON CONFLICT (id) DO UPDATE SET status=excluded.status, data=excluded.data`;
    },
    async attendance(sessionId, enrollmentId) {
      const [row] = await sql<DataRow<ProgramAttendance>[]>`SELECT data FROM public.program_attendance WHERE session_id=${sessionId} AND enrollment_id=${enrollmentId}`;
      return row?.data;
    },
    async attendances(runId) {
      return (await sql<DataRow<ProgramAttendance>[]>`SELECT a.data FROM public.program_attendance a JOIN public.program_sessions s ON s.id=a.session_id WHERE s.run_id=${runId} ORDER BY a.recorded_at, a.id`).map((row) => row.data);
    },
    async saveAttendance(attendance) {
      await sql`INSERT INTO public.program_attendance (id, session_id, enrollment_id, status, data, recorded_at)
        VALUES (${attendance.id}, ${attendance.sessionId}, ${attendance.enrollmentId}, ${attendance.status}, ${JSON.stringify(attendance)}::jsonb, ${attendance.recordedAt})
        ON CONFLICT (session_id, enrollment_id) DO UPDATE SET status=excluded.status, data=excluded.data`;
    },
    async completion(enrollmentId) {
      const [row] = await sql<DataRow<ProgramCompletion>[]>`SELECT data FROM public.program_completions WHERE enrollment_id=${enrollmentId}`;
      return row?.data;
    },
    async completions(runId) {
      return (await sql<DataRow<ProgramCompletion>[]>`SELECT c.data FROM public.program_completions c JOIN public.program_enrollments e ON e.id=c.enrollment_id WHERE e.run_id=${runId} ORDER BY c.recorded_at, c.id`).map((row) => row.data);
    },
    async saveCompletion(completion) {
      await sql`INSERT INTO public.program_completions (id, enrollment_id, completed, data, recorded_at)
        VALUES (${completion.id}, ${completion.enrollmentId}, ${completion.completed}, ${JSON.stringify(completion)}::jsonb, ${completion.recordedAt})
        ON CONFLICT (enrollment_id) DO NOTHING`;
    },
    async audit(audit) {
      await sql`INSERT INTO public.program_audits (id, target_type, target_id, action, before_state, after_state, reason, actor_id, actor_account_id, occurred_at, correlation_id)
        VALUES (${audit.id}, ${audit.targetType}, ${audit.targetId}, ${audit.action}, ${JSON.stringify(audit.before)}::jsonb, ${JSON.stringify(audit.after)}::jsonb, ${audit.reason}, ${audit.actorId}, ${audit.actorAccountId ?? null}, ${audit.occurredAt}, ${audit.correlationId})`;
    },
  };
}

export function createPostgresProgramStore(sql: Sql): ProgramStore {
  return {
    async transact<Result>(work: (transaction: ProgramTransaction) => Promise<Result>): Promise<Result> {
      const result = await sql.begin('isolation level read committed', async (transaction) => {
        await transaction`SELECT pg_advisory_xact_lock(${programIntakeLock}::bigint)`;
        return { value: await work(transactionPort(transaction)) };
      });
      return result.value;
    },
  };
}
