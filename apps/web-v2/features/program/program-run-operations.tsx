'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';

type Schedule = { scheduledStart: string; scheduledEnd: string; location: string };
type Session = Schedule & {
  id: string;
  sequence: number;
  status: 'planned' | 'held' | 'cancelled';
  delivery?: { recordedAt: string };
  changes: { reason: string; occurredAt: string; previous: Schedule; next: Schedule }[];
};
type Application = {
  id: string;
  accountId: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  createdAt: string;
  decidedAt?: string;
  withdrawnAt?: string;
};
type Enrollment = {
  id: string;
  accountId: string;
  status: 'confirmed' | 'withdrawn_before_start' | 'withdrawn_after_start';
  confirmedAt: string;
  withdrawnAt?: string;
};
type Attendance = {
  sessionId: string;
  enrollmentId: string;
  status: 'attended' | 'absent';
  recordedAt: string;
};
type Completion = { enrollmentId: string; completed: boolean; reason: string; recordedAt: string };

export type RunOperations = {
  id: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  completedAt?: string;
  cancelledAt?: string;
  completionOpensAt: string;
  sessions: Session[];
  applications: Application[];
  enrollments: Enrollment[];
  attendance: Attendance[];
  completions: Completion[];
};

const creatorProgram = '/api/v1/creator/program';
const field = 'block min-h-10 w-full rounded-md border border-input bg-background px-3 py-2';
const applicationStatus = {
  pending: '待处理',
  approved: '已批准',
  rejected: '已拒绝',
  withdrawn: '已撤回',
};
const enrollmentStatus = {
  confirmed: '已确认',
  withdrawn_before_start: '首场前退出',
  withdrawn_after_start: '首场开始后退出',
};
const deliveryStatus = { planned: '未记录', held: '实际开展', cancelled: '场次取消' };
const runStatus = {
  draft: '草稿',
  published: '已发布',
  cancelled: '整期取消',
  completed: '已确认结束',
};

const formatTime = (value: string) => new Date(value).toLocaleString();
const schedule = (value: Schedule) =>
  `${formatTime(value.scheduledStart)} 至 ${formatTime(value.scheduledEnd)} · ${value.location}`;

export function ProgramRunOperations({
  run,
  reload,
}: {
  run: RunOperations;
  reload: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(false);
  const active = run.status === 'published';
  const confirmed = run.enrollments.filter((item) => item.status === 'confirmed');

  async function submit(path: string, success: string, body?: object) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const result = await apiClient.POST(
        `${creatorProgram}${path}`,
        body === undefined ? undefined : { body },
      );
      if (result.data === null) throw new Error(result.error?.error?.message ?? '未保存，请重试。');
      setMessage(success);
      try {
        await reload();
      } catch {
        setError('已保存，但读取最新记录失败。请刷新页面。');
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '未保存，请重试。');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entries = confirmed.map((item) => {
      const reason = form.get(`reason-${item.id}`);
      return {
        enrollmentId: item.id,
        completed: form.get(`result-${item.id}`) === 'completed',
        reason: typeof reason === 'string' ? reason : '',
      };
    });
    void submit(`/runs/${run.id}/complete`, '已确认一期结束及逐人完成结果。', { entries });
  }

  return (
    <section
      aria-label="一期运营"
      className="space-y-5 border-t border-border py-5"
      aria-busy={busy}
    >
      <h2 className="text-lg font-semibold">一期运营 · {runStatus[run.status]}</h2>
      <p role="status" aria-live="polite">
        {message}
      </p>
      {error && <p role="alert">{error}</p>}

      <section aria-label="报名申请" className="space-y-2">
        <h3 className="font-semibold">
          报名申请 · {run.applications.filter((item) => item.status === 'pending').length} 待处理
        </h3>
        {run.applications.length === 0 && <p>暂无申请。</p>}
        <ul className="divide-y divide-border">
          {run.applications.map((item) => {
            const updatedAt = item.decidedAt ?? item.withdrawnAt;
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="break-all">账号 {item.accountId}</p>
                  <p className="text-sm text-muted-foreground">
                    {applicationStatus[item.status]} · 提交 {formatTime(item.createdAt)}
                    {updatedAt && ` · 更新 ${formatTime(updatedAt)}`}
                  </p>
                </div>
                {active && item.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void submit(`/applications/${item.id}/approve`, '已批准申请。')
                      }
                    >
                      批准
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void submit(`/applications/${item.id}/reject`, '已拒绝申请。')}
                    >
                      拒绝
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="参与者" className="space-y-2">
        <h3 className="font-semibold">参与者 · {confirmed.length} 已确认</h3>
        {run.enrollments.length === 0 && <p>暂无参与者。</p>}
        <ul className="divide-y divide-border">
          {run.enrollments.map((item) => (
            <li key={item.id} className="break-all py-2">
              账号 {item.accountId} · {enrollmentStatus[item.status]} · 确认{' '}
              {formatTime(item.confirmedAt)}
              {item.withdrawnAt && ` · 退出 ${formatTime(item.withdrawnAt)}`}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="场次履约" className="space-y-2">
        <h3 className="font-semibold">场次履约</h3>
        {run.sessions.length === 0 && <p>暂无计划场次。</p>}
        {run.sessions.map((session) => (
          <details key={session.id} className="space-y-3 border-b border-border py-2">
            <summary className="cursor-pointer font-medium">
              场次 {session.sequence} · {deliveryStatus[session.status]}
            </summary>
            <p>{schedule(session)}</p>
            <p>
              场次交付：{deliveryStatus[session.status]}
              {session.delivery && ` · 记录于 ${formatTime(session.delivery.recordedAt)}`}
            </p>
            {active && session.status === 'planned' && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    void submit(`/sessions/${session.id}/delivery`, '已记录场次开展。', {
                      status: 'held',
                    })
                  }
                >
                  记录实际开展
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void submit(`/sessions/${session.id}/delivery`, '已记录场次取消。', {
                      status: 'cancelled',
                    })
                  }
                >
                  记录场次取消
                </Button>
              </div>
            )}
            {session.changes.length > 0 && (
              <ul aria-label="排期变更">
                {session.changes.map((change, index) => (
                  <li key={index} className="py-1 text-sm">
                    {formatTime(change.occurredAt)} · {change.reason} · {schedule(change.previous)}{' '}
                    → {schedule(change.next)}
                  </li>
                ))}
              </ul>
            )}
            <h4 className="font-medium">参与记录</h4>
            <ul className="divide-y divide-border">
              {run.enrollments.map((item) => {
                const fact = run.attendance.find(
                  (entry) => entry.sessionId === session.id && entry.enrollmentId === item.id,
                );
                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <div className="min-w-0">
                      <p className="break-all">账号 {item.accountId}</p>
                      <p className="text-sm text-muted-foreground">
                        {fact
                          ? `${fact.status === 'attended' ? '已出席' : '缺席'} · ${formatTime(fact.recordedAt)}`
                          : '未记录'}
                      </p>
                    </div>
                    {active &&
                      session.status !== 'cancelled' &&
                      item.status === 'confirmed' &&
                      !fact && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void submit(`/sessions/${session.id}/attendance`, '已记录出席。', {
                                entries: [{ enrollmentId: item.id, status: 'attended' }],
                              })
                            }
                          >
                            记录出席
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void submit(`/sessions/${session.id}/attendance`, '已记录缺席。', {
                                entries: [{ enrollmentId: item.id, status: 'absent' }],
                              })
                            }
                          >
                            记录缺席
                          </Button>
                        </div>
                      )}
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
      </section>

      <section aria-label="一期结束与完成结果" className="space-y-3">
        <h3 className="font-semibold">一期结束与完成结果</h3>
        {run.completedAt && <p>一期已确认结束 · {formatTime(run.completedAt)}</p>}
        {run.cancelledAt && <p>整期已取消 · {formatTime(run.cancelledAt)}</p>}
        {run.completions.length > 0 && (
          <ul className="divide-y divide-border">
            {run.completions.map((item) => (
              <li key={item.enrollmentId} className="break-all py-2">
                账号{' '}
                {run.enrollments.find((entry) => entry.id === item.enrollmentId)?.accountId ??
                  item.enrollmentId}{' '}
                · {item.completed ? '已完成' : '未完成'} · {item.reason} ·{' '}
                {formatTime(item.recordedAt)}
              </li>
            ))}
          </ul>
        )}
        {active && (
          <form className="space-y-3" onSubmit={complete}>
            <p className="text-sm text-muted-foreground">
              可确认结束时间：{formatTime(run.completionOpensAt)}
            </p>
            {confirmed.map((item) => (
              <fieldset key={item.id} disabled={busy} className="grid gap-2 sm:grid-cols-2">
                <legend className="break-all">账号 {item.accountId}</legend>
                <label>
                  完成结果
                  <select className={field} required name={`result-${item.id}`} defaultValue="">
                    <option value="">请选择</option>
                    <option value="completed">已完成</option>
                    <option value="not-completed">未完成</option>
                  </select>
                </label>
                <label>
                  确认说明
                  <input className={field} required maxLength={500} name={`reason-${item.id}`} />
                </label>
              </fieldset>
            ))}
            <Button type="submit" disabled={busy}>
              确认 Run 结束
            </Button>
          </form>
        )}
      </section>
    </section>
  );
}
