'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { ProgramRunOperations, type RunOperations } from './program-run-operations';

type Terms = { title: string; description: string; location: string };
type Offering = { id: string; revision: number; draft: Terms; published?: { version: number; terms: Terms } };
type Session = { id: string; sequence: number; scheduledStart: string; scheduledEnd: string; location: string; changes: unknown[] };
type Run = RunOperations & { offeringId: string; startsAt: string; endsAt: string; location: string; capacity: number; occupancy: number; remainingCapacity: number };
type PublicRun = {
  id: string;
  location: string;
  remainingCapacity: number;
  acceptsApplications: boolean;
  sessions: Omit<Session, 'changes'>[];
};
type Application = { id: string; runId: string; status: string; createdAt: string };

const field = 'block min-h-10 w-full rounded-md border border-input bg-background px-3 py-2';
const panel = 'space-y-4 rounded-lg border border-border bg-card p-5';

function readData<T>(result: { data: T | null; error: { error?: { message?: string } } | null; status: number }): T {
  if (result.data !== null) return result.data;
  throw new Error(result.error?.error?.message ?? '请求未完成，请刷新并重试。');
}

export function ProgramManagement() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState('');
  const [terms, setTerms] = useState<Terms>({ title: '', description: '', location: '' });
  const [runInput, setRunInput] = useState({ offeringId: '', startsAt: '', endsAt: '', location: '', capacity: 10 });
  const [sessionInput, setSessionInput] = useState({ runId: '', scheduledStart: '', scheduledEnd: '', location: '' });
  const [selectedRunId, setSelectedRunId] = useState('');
  const selectedRun = runs.find((run) => run.id === selectedRunId);

  async function load(reportFailure = true) {
    try {
      setError('');
      const [offeringResult, runResult] = await Promise.all([
        apiClient.GET<Offering[]>('/api/v1/creator/program/offerings'),
        apiClient.GET<Run[]>('/api/v1/creator/program/runs'),
      ]);
      setOfferings(readData(offeringResult));
      setRuns(readData(runResult));
    } catch (failure) {
      if (!reportFailure) throw failure;
      setError(failure instanceof Error ? failure.message : '加载 Program 失败。');
    }
  }

  useEffect(() => { void load(); }, []);

  async function createOffering(event: FormEvent) {
    event.preventDefault();
    try { readData(await apiClient.POST<Offering>('/api/v1/creator/program/offerings', { body: terms })); setTerms({ title: '', description: '', location: '' }); await load(); } catch (failure) { setError(failure instanceof Error ? failure.message : '创建失败。'); }
  }

  async function createRun(event: FormEvent) {
    event.preventDefault();
    try { readData(await apiClient.POST<Run>('/api/v1/creator/program/runs', { body: { ...runInput, startsAt: new Date(runInput.startsAt).toISOString(), endsAt: new Date(runInput.endsAt).toISOString() } })); await load(); } catch (failure) { setError(failure instanceof Error ? failure.message : '创建一期失败。'); }
  }

  async function addSession(event: FormEvent) {
    event.preventDefault();
    try { readData(await apiClient.POST<Session>('/api/v1/creator/program/runs/{id}/sessions', { params: { path: { id: sessionInput.runId } }, body: { scheduledStart: sessionInput.scheduledStart, scheduledEnd: sessionInput.scheduledEnd, location: sessionInput.location } })); await load(); } catch (failure) { setError(failure instanceof Error ? failure.message : '创建场次失败。'); }
  }

  return <div className="creator-list-page space-y-5">
    <header className="creator-page-heading"><div><h1>Program</h1><p>管理线下、短周期、固定场次的 Program Offering 与一期 Run。</p></div></header>
    {error && <p role="alert">{error}</p>}
    <section className={panel}><h2>创建 Program Offering</h2><form className="space-y-3" onSubmit={(event) => { void createOffering(event); }}>
      <input className={field} required placeholder="标题" value={terms.title} onChange={(event) => setTerms({ ...terms, title: event.target.value })} />
      <textarea className={field} required placeholder="说明" value={terms.description} onChange={(event) => setTerms({ ...terms, description: event.target.value })} />
      <input className={field} required placeholder="线下地点" value={terms.location} onChange={(event) => setTerms({ ...terms, location: event.target.value })} />
      <Button type="submit">保存 Offering</Button>
    </form></section>
    <section className={panel}><h2>我的 Offering</h2><ul className="space-y-2">{offerings.map((offering) => <li key={offering.id} className="flex flex-wrap items-center justify-between gap-2"><span>{offering.draft.title} · {offering.published ? '已发布' : '草稿'}</span>{!offering.published && <Button type="button" variant="outline" onClick={() => void apiClient.POST(`/api/v1/creator/program/offerings/{id}/publish`, { params: { path: { id: offering.id } }, body: { expectedRevision: offering.revision } }).then(() => load())}>发布</Button>}</li>)}</ul></section>
    <section className={panel}><h2>创建一期 Run</h2><form className="space-y-3" onSubmit={(event) => { void createRun(event); }}>
      <select className={field} required value={runInput.offeringId} onChange={(event) => setRunInput({ ...runInput, offeringId: event.target.value })}><option value="">选择已发布 Offering</option>{offerings.filter((item) => item.published).map((item) => <option key={item.id} value={item.id}>{item.published?.terms.title}</option>)}</select>
      <input className={field} required type="datetime-local" aria-label="一期开始时间" value={runInput.startsAt} onChange={(event) => setRunInput({ ...runInput, startsAt: event.target.value })} />
      <input className={field} required type="datetime-local" aria-label="一期结束时间" value={runInput.endsAt} onChange={(event) => setRunInput({ ...runInput, endsAt: event.target.value })} />
      <input className={field} required placeholder="地点" value={runInput.location} onChange={(event) => setRunInput({ ...runInput, location: event.target.value })} />
      <input className={field} required type="number" min={1} value={runInput.capacity} onChange={(event) => setRunInput({ ...runInput, capacity: Number(event.target.value) })} />
      <Button type="submit">创建一期</Button>
    </form></section>
    <section className={panel}><h2>一期与场次</h2><ul className="space-y-4">{runs.map((run) => <li key={run.id} className="space-y-2 border-b pb-4"><h3>{offerings.find((offering) => offering.id === run.offeringId)?.draft.title ?? 'Program'}</h3><p>{run.status} · {run.location} · {new Date(run.startsAt).toLocaleString()}</p><p>{run.sessions.length} 个计划场次 · 已占用 {run.occupancy}/{run.capacity} · 剩余 {run.remainingCapacity}</p><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" aria-pressed={selectedRunId === run.id} onClick={() => setSelectedRunId(run.id)}>管理此期</Button>{run.status === 'draft' && run.sessions.length > 0 && <Button type="button" onClick={() => void apiClient.POST(`/api/v1/creator/program/runs/{id}/publish`, { params: { path: { id: run.id } } }).then(() => load())}>发布一期</Button>}{(run.status === 'draft' || run.status === 'published') && <Button type="button" variant="outline" onClick={() => setSessionInput({ ...sessionInput, runId: run.id })}>为此期添加场次</Button>}{run.status === 'published' && <Link className="underline" href={`/programs/${run.id}`}>查看公开页面</Link>}</div></li>)}</ul></section>
    {selectedRun && <ProgramRunOperations key={selectedRun.id} run={selectedRun} reload={() => load(false)} />}
    {sessionInput.runId && <section className={panel}><h2>添加计划场次</h2><form className="space-y-3" onSubmit={(event) => { void addSession(event); }}><input className={field} required type="datetime-local" onChange={(event) => setSessionInput({ ...sessionInput, scheduledStart: new Date(event.target.value).toISOString() })} /><input className={field} required type="datetime-local" onChange={(event) => setSessionInput({ ...sessionInput, scheduledEnd: new Date(event.target.value).toISOString() })} /><input className={field} required placeholder="场次地点" value={sessionInput.location} onChange={(event) => setSessionInput({ ...sessionInput, location: event.target.value })} /><Button type="submit">保存场次</Button></form></section>}
  </div>;
}

export function ProgramBrowser() {
  const [runs, setRuns] = useState<PublicRun[]>([]);
  useEffect(() => { void apiClient.GET<PublicRun[]>('/api/v1/public/program-runs').then((result) => { if (result.data) setRuns(result.data.filter((run) => run.acceptsApplications)); }); }, []);
  return <main className="mx-auto max-w-4xl space-y-6 p-6"><h1 className="text-3xl font-semibold">Program</h1><p>查找可报名的线下 Program。</p><ul className="space-y-4">{runs.map((run) => <li key={run.id} className={panel}><Link className="text-lg underline" href={`/programs/${run.id}`}>查看一期 Program</Link><p>{run.location} · 剩余名额 {run.remainingCapacity}</p><p>{run.sessions.length} 个计划场次</p></li>)}</ul>{runs.length === 0 && <p>当前没有可公开报名的一期 Program。</p>}</main>;
}

export function ProgramJoin({ runId }: { runId: string }) {
  const [run, setRun] = useState<PublicRun | null>(null);
  const [loadError, setLoadError] = useState('');
  const [application, setApplication] = useState<Application>();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    void apiClient.GET<PublicRun>('/api/v1/public/program-runs/{id}', { params: { path: { id: runId } } })
      .then((result) => {
        if (!active) return;
        if (result.data) setRun(result.data);
        else setLoadError(result.status === 404 ? '此期计划暂不可访问。' : '加载失败，请刷新重试。');
      })
      .catch(() => { if (active) setLoadError('加载失败，请刷新重试。'); });
    return () => { active = false; };
  }, [runId]);
  async function apply() {
    setSubmitting(true);
    try {
      const result = await apiClient.POST<Application>('/api/v1/private/program/runs/{id}/applications', { params: { path: { id: runId } }, body: {} });
      if (result.data) {
        setApplication(result.data);
        setMessage('报名申请已提交，等待提供方审批。');
      } else {
        setMessage(result.error?.error?.message ?? '报名未完成。');
      }
    } catch {
      setMessage('报名未完成，请重试。');
    } finally {
      setSubmitting(false);
    }
  }
  if (loadError) return <main className="mx-auto max-w-4xl p-6"><p role="alert">{loadError}</p></main>;
  if (!run) return <main className="mx-auto max-w-4xl p-6"><p>正在加载 Program…</p></main>;
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold">计划详情</h1>
      <p className="break-words">{run.location} · 剩余名额 {run.remainingCapacity}</p>
      <ul>{run.sessions.map((session) => <li key={session.id}>{session.sequence}. {new Date(session.scheduledStart).toLocaleString('zh-CN')} · {session.location}</li>)}</ul>
      {!run.acceptsApplications ? <p>此期计划目前不接受新报名。</p> : !application && (
        <Button type="button" disabled={submitting} onClick={() => void apply()}>
          {submitting ? '正在提交…' : '提交报名申请'}
        </Button>
      )}
      {message && <p role="status">{message}</p>}
    </main>
  );
}
