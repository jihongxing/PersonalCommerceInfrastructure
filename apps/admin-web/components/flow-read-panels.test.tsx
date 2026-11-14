import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OfferingReadPanel } from './offering-read-panel';
import { RequestReadPanel } from './request-read-panel';

const offering = {
  id: 'offering-1',
  creator: { id: 'creator-1', displayName: 'Creator One' },
  capabilities: [{ id: 'capability-1', name: 'Capability One', catalogItemId: 'catalog-1' }],
  title: 'Offering One',
  description: 'Offering description',
  requestInstructions: 'Send a request',
  state: 'published',
  policyStatus: 'approved',
  distribution: null,
  createdAt: '2030-01-01T00:00:00.000Z',
};
const request = {
  id: 'request-1',
  offeringId: offering.id,
  offering: { id: offering.id, title: offering.title, state: offering.state },
  creator: offering.creator,
  customer: { id: 'customer-1' },
  state: 'submitted',
  creatorDecision: 'not_recorded',
  requestContentVisibility: 'withheld',
};
afterEach(() => vi.unstubAllGlobals());

describe.each(['offerings', 'requests'] as const)('%s read panel', (resource) => {
  const renderPanel = () =>
    render(resource === 'offerings' ? <OfferingReadPanel /> : <RequestReadPanel />);
  const item = resource === 'offerings' ? offering : request;
  const title = resource === 'offerings' ? 'Offering One' : 'request-1';
  const detailLabel = resource === 'offerings' ? 'Offering 详情' : 'Customer Request 详情';
  const setUrl = (search = '') => window.history.replaceState(null, '', `/${resource}${search}`);

  it('reads list/detail, exposes real associations and uses only GET requests', async () => {
    setUrl();
    const transport = vi.fn(async (input: string) =>
      Response.json(
        input.includes('?') ? { items: [item], total: 1, page: 1, pageSize: 20 } : item,
      ),
    );
    vi.stubGlobal('fetch', transport);
    renderPanel();
    expect(screen.getByRole('status')).toHaveTextContent('正在加载');
    await screen.findByText(title);
    fireEvent.click(screen.getByRole('button', { name: '查看详情' }));
    const detail = await screen.findByRole('complementary', { name: detailLabel });
    expect(detail).toHaveTextContent('creator-1');
    if (resource === 'requests') {
      expect(detail).toHaveTextContent('not_recorded');
      expect(detail).toHaveTextContent('不返回原文');
      expect(screen.getByRole('link', { name: 'Offering One (offering-1)' })).toHaveAttribute(
        'href',
        '/offerings?id=offering-1',
      );
    } else {
      expect(detail).toHaveTextContent('catalog-1');
      expect(detail).toHaveTextContent('UTC');
      expect(detail).toHaveTextContent('暂无独立分发记录');
    }
    expect(
      screen.queryByRole('button', { name: /发布|撤回|确认|拒绝|删除/u }),
    ).not.toBeInTheDocument();
    for (const [, options] of transport.mock.calls as unknown as [string, RequestInit][])
      expect(options.method ?? 'GET').toBe('GET');
    expect(window.location.search).toContain(`id=${item.id}`);
  });

  it.each([
    [401, 'Session 已失效'],
    [403, '没有'],
    [404, '记录不存在'],
    [503, '请求失败'],
  ] as const)('presents HTTP %s distinctly', async (status, message) => {
    setUrl();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status })),
    );
    renderPanel();
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it('shows empty/network states and can recover by querying again', async () => {
    setUrl();
    const transport = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValue(Response.json({ items: [], total: 0, page: 1, pageSize: 20 }));
    vi.stubGlobal('fetch', transport);
    renderPanel();
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: '查询' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(await screen.findByRole('status')).toHaveTextContent('没有匹配');
  });

  it('forwards filters/pagination and restores detail from a shared URL', async () => {
    setUrl(`?q=creator-1&state=${item.state}&page=2&id=${item.id}`);
    const transport = vi.fn(async (input: string) =>
      Response.json(
        input.includes('?') ? { items: [item], total: 45, page: 2, pageSize: 20 } : item,
      ),
    );
    vi.stubGlobal('fetch', transport);
    renderPanel();
    await screen.findByRole('complementary', { name: detailLabel });
    expect(transport.mock.calls[0]![0]).toBe(
      `/api/operations/${resource}?page=2&pageSize=20&q=creator-1&state=${item.state}`,
    );
    fireEvent.click(screen.getByRole('button', { name: '下一页' }));
    await waitFor(() =>
      expect(transport).toHaveBeenLastCalledWith(
        expect.stringContaining('page=3'),
        expect.anything(),
      ),
    );
    expect(window.location.search).not.toContain('id=');
  });
});
