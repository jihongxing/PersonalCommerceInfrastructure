import { describe, expect, it } from 'vitest';
import { createInMemoryProgramStore } from '../../adapters/in-memory/in-memory-program-store.js';
import { createProgramService } from '../../applications/program/program-service.js';

describe('Program first slice', () => {
  it('reserves capacity for applications and releases it on rejection or withdrawal', async () => {
    const current = '2026-12-01T08:00:00.000Z';
    const store = createInMemoryProgramStore(() => current) as ReturnType<typeof createInMemoryProgramStore> & { setIntakeOpen(open: boolean): void };
    store.setIntakeOpen(true);
    const service = createProgramService(store);
    const offering = await service.createOffering('provider-a', { title: 'First cohort', description: 'In person', location: 'Studio A' });
    await service.publishOffering('provider-a', offering.id, offering.revision);
    const run = await service.createRun('provider-a', { offeringId: offering.id, startsAt: '2026-12-05T09:00:00.000Z', endsAt: '2026-12-05T12:00:00.000Z', location: 'Studio A', capacity: 1 });
    await service.addSession('provider-a', run.id, { scheduledStart: '2026-12-05T09:00:00.000Z', scheduledEnd: '2026-12-05T10:00:00.000Z', location: 'Studio A' }, 'session-a');
    await service.publishRun('provider-a', run.id);

    const first = await service.apply('account-a', run.id, 'apply-a');
    await expect(service.apply('account-b', run.id, 'apply-b')).rejects.toMatchObject({ code: 'program_capacity_full' });
    await service.withdrawApplication('account-a', first.id, 'withdraw-a');
    const second = await service.apply('account-b', run.id, 'apply-b2');
    expect(second.status).toBe('pending');
    await expect(service.approveApplication('provider-a', second.id, 'provider-account', 'approve-b')).resolves.toMatchObject({ accountId: 'account-b', status: 'confirmed' });
  });

  it('keeps post-start withdrawal history without allowing replacement', async () => {
    let current = '2026-12-05T08:00:00.000Z';
    const store = createInMemoryProgramStore(() => current) as ReturnType<typeof createInMemoryProgramStore> & { setIntakeOpen(open: boolean): void };
    store.setIntakeOpen(true);
    const service = createProgramService(store);
    const offering = await service.createOffering('provider-a', { title: 'Second cohort', description: 'In person', location: 'Hall B' });
    await service.publishOffering('provider-a', offering.id, offering.revision);
    const run = await service.createRun('provider-a', { offeringId: offering.id, startsAt: '2026-12-05T09:00:00.000Z', endsAt: '2026-12-05T12:00:00.000Z', location: 'Hall B', capacity: 2 });
    await service.addSession('provider-a', run.id, { scheduledStart: '2026-12-05T09:00:00.000Z', scheduledEnd: '2026-12-05T10:00:00.000Z', location: 'Hall B' }, 'session-b');
    await service.publishRun('provider-a', run.id);
    const application = await service.apply('account-a', run.id, 'apply-c');
    const enrollment = await service.approveApplication('provider-a', application.id, 'provider-account', 'approve-c');
    current = '2026-12-05T09:30:00.000Z';
    const withdrawn = await service.withdrawEnrollment('account-a', enrollment.id, 'withdraw-c');
    expect(withdrawn.status).toBe('withdrawn_after_start');
    await expect(service.apply('account-b', run.id, 'apply-d')).rejects.toMatchObject({ code: 'program_run_started' });
  });

  it('records session changes and preserves facts when a run is cancelled', async () => {
    const store = createInMemoryProgramStore(() => '2026-12-01T08:00:00.000Z') as ReturnType<typeof createInMemoryProgramStore> & { setIntakeOpen(open: boolean): void };
    store.setIntakeOpen(true);
    const service = createProgramService(store);
    const offering = await service.createOffering('provider-a', { title: 'Cancelled cohort', description: 'In person', location: 'Hall C' });
    await service.publishOffering('provider-a', offering.id, offering.revision);
    const run = await service.createRun('provider-a', { offeringId: offering.id, startsAt: '2026-12-10T09:00:00.000Z', endsAt: '2026-12-10T12:00:00.000Z', location: 'Hall C', capacity: 3 });
    const session = await service.addSession('provider-a', run.id, { scheduledStart: '2026-12-10T09:00:00.000Z', scheduledEnd: '2026-12-10T10:00:00.000Z', location: 'Hall C' }, 'session-c');
    const changed = await service.changeSession('provider-a', session.id, { scheduledStart: '2026-12-11T09:00:00.000Z', scheduledEnd: '2026-12-11T10:00:00.000Z', location: 'Hall D', reason: 'Venue maintenance' }, 'change-c');
    expect(changed.changes).toHaveLength(1);
    await service.publishRun('provider-a', run.id);
    const pending = await service.apply('account-c', run.id, 'apply-cancelled-run');
    await service.recordSessionDelivery('provider-a', session.id, 'cancelled', 'provider-account', 'cancel-session');
    const cancelled = await service.cancelRun('provider-a', run.id, 'Venue unavailable', 'cancel-c');
    expect(cancelled.status).toBe('cancelled');
    await expect(service.approveApplication('provider-a', pending.id, 'provider-account', 'approve-cancelled-run')).rejects.toMatchObject({ code: 'program_run_not_active' });
    await expect(service.rejectApplication('provider-a', pending.id, 'provider-account', 'reject-cancelled-run')).rejects.toMatchObject({ code: 'program_run_not_active' });
    await expect(service.completeRun('provider-a', run.id, [], 'provider-account', 'complete-cancelled-run')).rejects.toMatchObject({ code: 'program_run_not_completable' });
    const history = (await service.providerRuns('provider-a'))[0];
    expect(history?.sessions[0]?.changes).toHaveLength(1);
    expect(history).toMatchObject({ status: 'cancelled', sessions: [{ status: 'cancelled', delivery: { actorAccountId: 'provider-account' } }], applications: [{ id: pending.id, status: 'pending' }], attendance: [], completions: [] });
  });

  it('allows a run to complete after a confirmed participant withdraws', async () => {
    let current = '2026-12-10T08:00:00.000Z';
    const store = createInMemoryProgramStore(() => current) as ReturnType<typeof createInMemoryProgramStore> & { setIntakeOpen(open: boolean): void };
    store.setIntakeOpen(true);
    const service = createProgramService(store);
    const offering = await service.createOffering('provider-a', { title: 'Completed cohort', description: 'In person', location: 'Hall D' });
    await service.publishOffering('provider-a', offering.id, offering.revision);
    const run = await service.createRun('provider-a', { offeringId: offering.id, startsAt: '2026-12-10T09:00:00.000Z', endsAt: '2026-12-10T12:00:00.000Z', location: 'Hall D', capacity: 2 });
    const session = await service.addSession('provider-a', run.id, { scheduledStart: '2026-12-10T09:00:00.000Z', scheduledEnd: '2026-12-10T10:00:00.000Z', location: 'Hall D' }, 'session-d');
    await service.publishRun('provider-a', run.id);
    const applicationA = await service.apply('account-a', run.id, 'apply-d-a');
    const applicationB = await service.apply('account-b', run.id, 'apply-d-b');
    const enrollmentA = await service.approveApplication('provider-a', applicationA.id, 'provider-account', 'approve-d-a');
    const enrollmentB = await service.approveApplication('provider-a', applicationB.id, 'provider-account', 'approve-d-b');
    current = '2026-12-10T13:00:00.000Z';
    await service.withdrawEnrollment('account-a', enrollmentA.id, 'withdraw-d-a');
    await service.recordAttendance('provider-a', session.id, [{ enrollmentId: enrollmentB.id, status: 'attended' }], 'attendance-d');
    await expect(service.recordAttendance('provider-a', session.id, [{ enrollmentId: enrollmentB.id, status: 'absent' }], 'attendance-conflict')).rejects.toMatchObject({ code: 'program_attendance_conflict' });
    expect((await service.providerRuns('provider-a'))[0]).toMatchObject({ status: 'published', sessions: [{ status: 'planned' }], completions: [] });
    const result = await service.completeRun('provider-a', run.id, [{ enrollmentId: enrollmentB.id, completed: true, reason: 'Completed the cohort.' }], 'provider-account', 'complete-d');
    expect(result.run.status).toBe('completed');
    expect(result.completions).toHaveLength(1);
    expect((await service.providerRuns('provider-a'))[0]).toMatchObject({ status: 'completed', sessions: [{ status: 'planned' }], attendance: [{ status: 'attended' }], completions: [{ completed: true }] });
  });
});
