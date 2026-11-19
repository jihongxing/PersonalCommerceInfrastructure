import type {
  ProgramApplication,
  ProgramAttendance,
  ProgramAudit,
  ProgramCompletion,
  ProgramEnrollment,
  ProgramOffering,
  ProgramRun,
  ProgramSession,
  ProgramStore,
  ProgramTransaction,
} from '../../applications/program/program-service.js';

export function createInMemoryProgramStore(now = () => new Date().toISOString()): ProgramStore {
  const offerings = new Map<string, ProgramOffering>();
  const runs = new Map<string, ProgramRun>();
  const sessions = new Map<string, ProgramSession>();
  const applications = new Map<string, ProgramApplication>();
  const enrollments = new Map<string, ProgramEnrollment>();
  const attendance = new Map<string, ProgramAttendance>();
  const completions = new Map<string, ProgramCompletion>();
  const audits: ProgramAudit[] = [];
  let intake = false;

  const transaction: ProgramTransaction = {
    now: () => Promise.resolve(now()),
    intakeOpen: () => Promise.resolve(intake),
    offering: (id) => Promise.resolve(offerings.get(id)),
    offerings: (providerId) => Promise.resolve([...offerings.values()].filter((item) => item.providerId === providerId)),
    saveOffering: (item) => { offerings.set(item.id, item); return Promise.resolve(); },
    run: (id) => Promise.resolve(runs.get(id)),
    runs: (providerId) => Promise.resolve([...runs.values()].filter((item) => providerId === undefined || item.providerId === providerId)),
    saveRun: (item) => { runs.set(item.id, item); return Promise.resolve(); },
    sessions: (runId) => Promise.resolve([...sessions.values()].filter((item) => item.runId === runId).sort((left, right) => left.sequence - right.sequence)),
    session: (id) => Promise.resolve(sessions.get(id)),
    saveSession: (item) => { sessions.set(item.id, item); return Promise.resolve(); },
    applications: (runId) => Promise.resolve([...applications.values()].filter((item) => item.runId === runId)),
    applicationsForAccount: (accountId) => Promise.resolve([...applications.values()].filter((item) => item.accountId === accountId)),
    application: (id) => Promise.resolve(applications.get(id)),
    saveApplication: (item) => { applications.set(item.id, item); return Promise.resolve(); },
    enrollmentByApplication: (applicationId) => Promise.resolve([...enrollments.values()].find((item) => item.applicationId === applicationId)),
    enrollment: (id) => Promise.resolve(enrollments.get(id)),
    enrollments: (runId) => Promise.resolve([...enrollments.values()].filter((item) => item.runId === runId)),
    enrollmentsForAccount: (accountId) => Promise.resolve([...enrollments.values()].filter((item) => item.accountId === accountId)),
    saveEnrollment: (item) => { enrollments.set(item.id, item); return Promise.resolve(); },
    attendance: (sessionId, enrollmentId) => Promise.resolve(attendance.get(`${sessionId}:${enrollmentId}`)),
    attendances: (runId) => {
      const sessionIds = new Set([...sessions.values()].filter((item) => item.runId === runId).map((item) => item.id));
      return Promise.resolve([...attendance.values()].filter((item) => sessionIds.has(item.sessionId)));
    },
    saveAttendance: (item) => { attendance.set(`${item.sessionId}:${item.enrollmentId}`, item); return Promise.resolve(); },
    completion: (enrollmentId) => Promise.resolve(completions.get(enrollmentId)),
    completions: (runId) => {
      const enrollmentIds = new Set([...enrollments.values()].filter((item) => item.runId === runId).map((item) => item.id));
      return Promise.resolve([...completions.values()].filter((item) => enrollmentIds.has(item.enrollmentId)));
    },
    saveCompletion: (item) => { if (!completions.has(item.enrollmentId)) completions.set(item.enrollmentId, item); return Promise.resolve(); },
    audit: (item) => { audits.push(item); return Promise.resolve(); },
  };

  return {
    async transact(work) {
      return work(transaction);
    },
    setIntakeOpen(open: boolean) {
      intake = open;
    },
    audits,
  } as ProgramStore & { setIntakeOpen(open: boolean): void; audits: ProgramAudit[] };
}
