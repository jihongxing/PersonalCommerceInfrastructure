'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';

type Terms = {
  title: string;
  location: string;
  benefits: string;
  terms: string;
  durationDays: number;
};
type Offering = {
  id: string;
  revision: number;
  draft: Terms;
  published?: { version: number; terms: Terms };
};
type PublicOffering = { id: string; version: number; terms: Terms; intakeOpen: boolean };
type Application = {
  id: string;
  accountId: string;
  offeringId: string;
  status: 'pending' | 'active' | 'expired';
  version: number;
  acceptedTerms: Terms;
  acceptedAt: string;
  membership?: { id: string; validFrom: string; validUntil: string };
};
type Fact = { id: string; occurredAt: string } & (
  | { kind: 'verification'; eligible: boolean }
  | { kind: 'admission'; verificationId: string }
  | { kind: 'admission_correction'; admissionId: string; reason: string }
);
const statusLabel = { pending: '待审批', active: '有效', expired: '已到期' };
const creatorPath = '/api/v1/creator/membership';
const privatePath = '/api/v1/private/membership';
const blankTerms: Terms = { title: '', location: '', benefits: '', terms: '', durationDays: 1 };
const field = 'block min-h-10 w-full rounded-md border border-input bg-background px-3 py-2';
const panel = 'space-y-4 rounded-lg border border-border bg-card p-5';

function dataOf<Data>(result: {
  data: Data | null;
  error: { error?: { message?: string } } | null;
  status: number;
}): Data {
  if (result.data !== null) return result.data;
  if (result.status === 404) throw new Error('会员入口或记录不可用。');
  throw new Error(result.error?.error?.message ?? '未能完成操作，请刷新并重试。');
}

function dateLabel(value: string): string {
  return new Date(value).toLocaleString('zh-CN');
}

function MembershipDetails({ application }: { application: Application }) {
  return (
    <>
      <p>
        申请编号：<code className="break-all">{application.id}</code> ·{' '}
        {statusLabel[application.status]}
      </p>
      <p>
        条款版本 {application.version} · 接受时间 {dateLabel(application.acceptedAt)}
      </p>
      <details>
        <summary>查看已接受的条款</summary>
        <p className="whitespace-pre-wrap">
          {application.acceptedTerms.location} · 批准后有效 {application.acceptedTerms.durationDays}{' '}
          天
        </p>
        <p className="whitespace-pre-wrap">{application.acceptedTerms.benefits}</p>
        <p className="whitespace-pre-wrap">{application.acceptedTerms.terms}</p>
      </details>
      {application.membership && (
        <>
          <p>
            会员编号：<code className="break-all">{application.membership.id}</code>
          </p>
          <p>
            有效期间：{dateLabel(application.membership.validFrom)} 至{' '}
            {dateLabel(application.membership.validUntil)}
          </p>
        </>
      )}
    </>
  );
}

export function MembershipJoin({ offeringId }: { offeringId: string }) {
  const { user } = useAuth();
  const [offering, setOffering] = useState<PublicOffering>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    void apiClient
      .GET<PublicOffering>('/api/v1/public/membership-offerings/{id}', {
        params: { path: { id: offeringId } },
        signal: controller.signal,
      })
      .then((result) => {
        if (!controller.signal.aborted) setOffering(dataOf(result));
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [offeringId]);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    void apiClient
      .GET<Application[]>(privatePath, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setApplications(dataOf(result));
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!offering || !accepted || busy || !user) return;
    setBusy(true);
    setError('');
    try {
      dataOf(
        await apiClient.POST(`${privatePath}/{id}/applications`, {
          params: { path: { id: offeringId } },
          body: { version: offering.version, accepted },
        }),
      );
      setApplications(dataOf(await apiClient.GET<Application[]>(privatePath)));
      setAccepted(false);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const application = user
    ? applications.find((item) => item.offeringId === offeringId)
    : undefined;
  return (
    <main className="mx-auto max-w-2xl space-y-5 p-5">
      <h1 className="text-2xl font-semibold">{offering?.terms.title ?? '线下空间会员'}</h1>
      {error && <p role="alert">{error}</p>}
      {offering && (
        <section className={panel} aria-label="会员条款">
          <p>
            免费 · 批准后有效 {offering.terms.durationDays} 天 · 条款版本 {offering.version}
          </p>
          <p className="whitespace-pre-wrap">地点：{offering.terms.location}</p>
          <p className="whitespace-pre-wrap">会员待遇：{offering.terms.benefits}</p>
          <p className="whitespace-pre-wrap">条款：{offering.terms.terms}</p>
          {application && <MembershipDetails application={application} />}
          {!offering.intakeOpen && <p>新申请现已暂停；已有会员按原有效期使用。</p>}
          {!user && offering.intakeOpen && (
            <p>
              <Link
                className="underline"
                href={`/auth/login?returnTo=${encodeURIComponent(`/membership/${offeringId}`)}`}
              >
                登录
              </Link>
              后回到本页申请。
            </p>
          )}
          {user && !application && offering.intakeOpen && (
            <form className="space-y-3" onSubmit={(event) => void submit(event)}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  required
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                我已阅读并本人接受此版本条款
              </label>
              <p>申请后，请本人到场并向供给方出示申请编号。未批准前不具备会员资格。</p>
              <Button type="submit" disabled={!accepted || busy}>
                提交会员申请
              </Button>
            </form>
          )}
        </section>
      )}
    </main>
  );
}

export function MembershipManagement() {
  const [offers, setOffers] = useState<Offering[]>([]);
  const [selected, setSelected] = useState('');
  const [draft, setDraft] = useState<Terms>(blankTerms);
  const [applications, setApplications] = useState<Application[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [checkedApplication, setCheckedApplication] = useState('');
  const [member, setMember] = useState('');
  const [facts, setFacts] = useState<Fact[]>([]);
  const [verification, setVerification] = useState('');
  const [correction, setCorrection] = useState('');
  const [reason, setReason] = useState('');
  const offering = offers.find((item) => item.id === selected);

  async function loadOffers() {
    setOffers(dataOf(await apiClient.GET<Offering[]>(`${creatorPath}/offerings`)));
  }
  async function loadApplications(id: string) {
    setApplications(
      dataOf(await apiClient.GET<Application[]>(`${creatorPath}/offerings/${id}/applications`)),
    );
  }
  const memberPath = `${creatorPath}/offerings/${selected}/members/${member}`;
  async function loadFacts(id: string) {
    setFacts(
      dataOf(
        await apiClient.GET<{ facts: Fact[] }>(
          `${creatorPath}/offerings/${selected}/members/${id}`,
        ),
      ).facts,
    );
  }
  async function run(work: () => Promise<void>) {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await work();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void apiClient
      .GET<Offering[]>(`${creatorPath}/offerings`, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setOffers(dataOf(result));
        setReady(true);
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, []);

  function select(id: string) {
    setSelected(id);
    setDraft(offers.find((offer) => offer.id === id)?.draft ?? blankTerms);
    setApplications([]);
    setMember('');
    setCheckedApplication('');
    setFacts([]);
    setVerification('');
    setCorrection('');
    setReason('');
    if (id) void run(() => loadApplications(id));
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const saved = dataOf(
        offering
          ? await apiClient.PATCH<Offering>(`${creatorPath}/offerings/${offering.id}`, {
              body: { expectedRevision: offering.revision, terms: draft },
            })
          : await apiClient.POST<Offering>(`${creatorPath}/offerings`, { body: draft }),
      );
      setSelected(saved.id);
      setDraft(saved.draft);
      await loadOffers();
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-2xl font-semibold">线下空间会员管理</h1>
      {error && <p role="alert">{error}</p>}
      {ready && (
        <fieldset className="space-y-5" disabled={busy}>
          <section className={panel} aria-label="我的会员供给">
            <label>
              选择供给
              <select
                className={field}
                value={selected}
                onChange={(event) => select(event.target.value)}
              >
                <option value="">新建草稿</option>
                {offers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.draft.title} · {item.published ? '已发布' : '草稿'}
                  </option>
                ))}
              </select>
            </label>
            <form className="space-y-3" onSubmit={save}>
              <label className="block">
                会员供给名称
                <input
                  className={field}
                  required
                  maxLength={120}
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
              </label>
              <label className="block">
                现场地址
                <input
                  className={field}
                  required
                  maxLength={300}
                  value={draft.location}
                  onChange={(event) => setDraft({ ...draft, location: event.target.value })}
                />
              </label>
              <label className="block">
                会员待遇
                <textarea
                  className={field}
                  required
                  maxLength={2000}
                  value={draft.benefits}
                  onChange={(event) => setDraft({ ...draft, benefits: event.target.value })}
                />
              </label>
              <label className="block">
                会员条款
                <textarea
                  className={field}
                  required
                  maxLength={4000}
                  value={draft.terms}
                  onChange={(event) => setDraft({ ...draft, terms: event.target.value })}
                />
              </label>
              <label className="block">
                批准后有效天数
                <input
                  className={field}
                  required
                  type="number"
                  min={1}
                  max={36500}
                  value={draft.durationDays || ''}
                  onChange={(event) =>
                    setDraft({ ...draft, durationDays: event.target.valueAsNumber })
                  }
                />
              </label>
              <Button type="submit">保存草稿</Button>
            </form>
            {offering && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    offering.published?.version === offering.revision ||
                    Object.keys(draft).some(
                      (key) => draft[key as keyof Terms] !== offering.draft[key as keyof Terms],
                    )
                  }
                  onClick={() =>
                    void run(async () => {
                      dataOf(
                        await apiClient.POST(`${creatorPath}/offerings/${offering.id}/publish`, {
                          body: { expectedRevision: offering.revision },
                        }),
                      );
                      await loadOffers();
                    })
                  }
                >
                  发布已保存版本
                </Button>
                {offering.published && (
                  <Link className="underline" href={`/membership/${offering.id}`}>
                    申请页面（版本 {offering.published.version}）
                  </Link>
                )}
              </div>
            )}
          </section>
          {offering && (
            <section className={panel} aria-label="会员申请与关系">
              <h2 className="text-lg font-semibold">申请与会员</h2>
              <Button
                type="button"
                variant="outline"
                onClick={() => void run(() => loadApplications(offering.id))}
              >
                刷新申请
              </Button>
              {applications.length === 0 && <p>暂无申请。</p>}
              {applications.map((item) => (
                <article key={item.id} className="space-y-2 border-t border-border pt-3">
                  <MembershipDetails application={item} />
                  <p>
                    申请人账号引用：<code className="break-all">{item.accountId}</code>
                  </p>
                  {item.status === 'pending' && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checkedApplication === item.id}
                          onChange={(event) =>
                            setCheckedApplication(event.target.checked ? item.id : '')
                          }
                        />
                        已现场核对本人及该申请
                      </label>
                      <Button
                        type="button"
                        disabled={checkedApplication !== item.id}
                        onClick={() =>
                          void run(async () => {
                            dataOf(
                              await apiClient.POST(
                                `${creatorPath}/applications/${item.id}/approve`,
                                { body: { identityChecked: true } },
                              ),
                            );
                            setCheckedApplication('');
                            await loadApplications(offering.id);
                          })
                        }
                      >
                        批准申请
                      </Button>
                    </div>
                  )}
                  {item.membership && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        void run(async () => {
                          const id = item.membership?.id;
                          if (!id) return;
                          setMember(id);
                          setVerification('');
                          setFacts([]);
                          setCorrection('');
                          setReason('');
                          await loadFacts(id);
                        })
                      }
                    >
                      查看核验与入场
                    </Button>
                  )}
                </article>
              ))}
            </section>
          )}
          {member && (
            <section className={panel} aria-label="现场核验与入场">
              <h2 className="text-lg font-semibold">现场核验与入场</h2>
              <p>
                当前会员：<code className="break-all">{member}</code>。核验不代表已经入场。
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void run(async () => {
                      const result = dataOf(
                        await apiClient.POST<Fact>(`${memberPath}/verifications`, {
                          body: { identityChecked: true },
                        }),
                      );
                      setVerification(
                        result.kind === 'verification' && result.eligible ? result.id : '',
                      );
                      await loadFacts(member);
                    })
                  }
                >
                  已核对本人，记录资格核验
                </Button>
                <Button
                  type="button"
                  disabled={!verification}
                  onClick={() =>
                    void run(async () => {
                      dataOf(
                        await apiClient.POST(`${memberPath}/admissions`, {
                          body: { verificationId: verification, occurred: true },
                        }),
                      );
                      setVerification('');
                      await loadFacts(member);
                    })
                  }
                >
                  确认已实际入场
                </Button>
              </div>
              <ul className="space-y-2">
                {facts.map((fact) => (
                  <li key={fact.id}>
                    {dateLabel(fact.occurredAt)} ·{' '}
                    {fact.kind === 'verification' ? (
                      fact.eligible ? (
                        '资格核验通过'
                      ) : (
                        '资格核验未通过'
                      )
                    ) : fact.kind === 'admission_correction' ? (
                      `误登记更正：${fact.reason}`
                    ) : facts.some(
                        (item) =>
                          item.kind === 'admission_correction' && item.admissionId === fact.id,
                      ) ? (
                      '入场记录已更正'
                    ) : (
                      <>
                        实际入场{' '}
                        <button
                          type="button"
                          className="underline"
                          onClick={() => {
                            setCorrection(fact.id);
                            setReason('');
                          }}
                        >
                          报告误登记
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              {correction && (
                <form
                  className="space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run(async () => {
                      dataOf(
                        await apiClient.POST(`${memberPath}/corrections`, {
                          body: { admissionId: correction, reason },
                        }),
                      );
                      setCorrection('');
                      setReason('');
                      await loadFacts(member);
                    });
                  }}
                >
                  <label>
                    误登记原因
                    <input
                      className={field}
                      required
                      maxLength={500}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </label>
                  <Button type="submit" disabled={!reason.trim()}>
                    保留原记录并更正
                  </Button>
                </form>
              )}
            </section>
          )}
        </fieldset>
      )}
    </div>
  );
}
