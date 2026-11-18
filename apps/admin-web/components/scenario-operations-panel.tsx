'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

type Scenario = {
  readonly scenario: string;
  readonly status: 'open' | 'paused' | 'not_integrated';
  readonly canManage: boolean;
  readonly activePolicyVersion?: string;
  readonly revision?: number;
  readonly lastChange?: {
    readonly actorId: string;
    readonly reason: string;
    readonly occurredAt: string;
    readonly correlationId: string;
  };
};

const endpoint = '/api/operations/scenarios';
const labels = { open: '开放', paused: '暂停', not_integrated: '未接入运营' } as const;

async function readScenarios(signal?: AbortSignal): Promise<readonly Scenario[]> {
  const response = await fetch(endpoint, { cache: 'no-store', signal });
  if (!response.ok) throw new Error('Scenario settings unavailable');
  return ((await response.json()) as { scenarios: Scenario[] }).scenarios;
}

export function ScenarioOperationsPanel() {
  const [scenarios, setScenarios] = useState<readonly Scenario[] | null>(null);
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    void readScenarios(controller.signal).then(setScenarios, () => {
      if (!controller.signal.aborted) setError('无法读取场景设置，请确认权限或刷新页面。');
    });
    return () => controller.abort();
  }, []);

  const managed = scenarios?.find((item) => item.canManage && item.revision !== undefined);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!managed || pending || !reason.trim()) return;
    setPending(true);
    setError('');
    setFeedback('');
    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scenario: managed.scenario,
          open: managed.status === 'paused',
          expectedRevision: managed.revision,
          reason: reason.trim(),
        }),
      });
      if (response.status === 409) {
        setScenarios(await readScenarios());
        setError('操作未应用，已重新读取当前状态。请核对后再提交。');
        return;
      }
      if (!response.ok) throw new Error('Scenario change not confirmed');
      setReason('');
      setFeedback('设置已保存。');
      setScenarios(await readScenarios());
    } catch {
      setScenarios(null);
      setError('无法确认最新状态。请刷新页面核对，不要重复提交。');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="data-panel" aria-label="商业场景运营状态">
      {error && <p role="alert">{error}</p>}
      <p role="status">{feedback || (!scenarios && !error ? '正在读取实际运营设置…' : '')}</p>
      {scenarios && (
        <div className="data-table-wrap">
          <table>
            <caption>六类商业供给的运营接入与生效策略</caption>
            <thead>
              <tr>
                <th scope="col">场景</th>
                <th scope="col">当前状态</th>
                <th scope="col">生效策略</th>
                <th scope="col">最近变更</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((item) => (
                <tr key={item.scenario}>
                  <th scope="row">{item.scenario}</th>
                  <td>{labels[item.status]}</td>
                  <td>
                    {item.activePolicyVersion ? (
                      <Link href="/policy-versions">
                        Service Catalog · {item.activePolicyVersion}
                      </Link>
                    ) : (
                      '无已接入的策略或入口'
                    )}
                  </td>
                  <td>
                    {item.lastChange ? (
                      <>
                        <strong>
                          修订 {item.revision} · {item.lastChange.reason}
                        </strong>
                        <small>
                          操作者 {item.lastChange.actorId} ·{' '}
                          <time dateTime={item.lastChange.occurredAt}>
                            {item.lastChange.occurredAt}
                          </time>
                        </small>
                        <small>关联 ID：{item.lastChange.correlationId}</small>
                      </>
                    ) : item.status === 'not_integrated' ? (
                      '不支持开放'
                    ) : (
                      '沿用初始开放配置'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {managed && (
        <form className="filter-bar" onSubmit={(event) => void submit(event)}>
          <p id="scenario-change-impact">
            暂停会阻止新的 Service 发布和公开 Request；既有 Request、结果和履约继续可用。
          </p>
          <label>
            变更理由
            <input
              required
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={pending || !reason.trim()}
            aria-describedby="scenario-change-impact"
          >
            {pending
              ? '正在保存…'
              : managed.status === 'open'
                ? '暂停 Service 新增入口'
                : '恢复 Service 新增入口'}
          </button>
        </form>
      )}
    </section>
  );
}
