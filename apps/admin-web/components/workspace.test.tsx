import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WorkspaceOverview } from './workspace-overview';
import { WorkspaceSearch } from './workspace-search';
afterEach(() => vi.unstubAllGlobals());
describe('Operations workspace', () => {
  it('shows exact permitted summaries, timestamp and real pending state only', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          queriedAt: '2030-01-01T00:00:00Z',
          modules: {
            request: { total: 3, states: { submitted: 2, confirmed: 1 }, scope: 'all' },
          },
          consistency: 'repeatable_read_snapshot',
        }),
      ),
    );
    render(<WorkspaceOverview />);
    expect(await screen.findByText('submitted · 等待 Creator 决策')).toBeVisible();
    expect(screen.getByText(/2030-01-01T00:00:00.000Z/)).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Offering' })).not.toBeInTheDocument();
    expect(screen.queryByText(/超时|未读|违约|需人工介入/)).not.toBeInTheDocument();
  });
  it.each([
    [401, 'Session 已失效'],
    [403, '没有可读取'],
    [503, '查询失败'],
  ] as const)('overview handles HTTP %s without invented numbers', async (status, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
    render(<WorkspaceOverview />);
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
  it('search uses a bounded GET and navigates to the right detail including kind+ID', async () => {
    const transport = vi.fn().mockResolvedValue(
      Response.json({
        items: [
          { kind: 'capabilities', id: 'same-id', name: 'Catalog One', state: 'active' },
          { kind: 'offering', id: 'same-id', name: 'Offering One', state: 'published' },
          { kind: 'request', id: 'r', name: 'r', state: 'submitted', relatedId: 'same-id' },
          {
            kind: 'audit',
            id: 'a',
            name: 'updated',
            state: 'capability',
            actorId: 'human-1',
            actorCategory: 'human_operations',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 4,
      }),
    );
    vi.stubGlobal('fetch', transport);
    render(<WorkspaceSearch />);
    fireEvent.change(screen.getByLabelText('业务检索'), { target: { value: 'same-id' } });
    fireEvent.click(screen.getByRole('button', { name: '检索' }));
    expect(await screen.findByRole('link', { name: 'Catalog One · same-id' })).toHaveAttribute(
      'href',
      '/capabilities?id=same-id',
    );
    expect(screen.getByRole('link', { name: 'Offering One · same-id' })).toHaveAttribute(
      'href',
      '/offerings?id=same-id',
    );
    expect(screen.getByRole('link', { name: 'r · r' })).toHaveAttribute('href', '/requests?id=r');
    expect(screen.getByRole('link', { name: 'updated · a' })).toHaveAttribute(
      'href',
      '/audit?id=a',
    );
    expect(transport.mock.calls[0]![0]).toContain('pageSize=20');
    expect(transport.mock.calls[0]![1].method ?? 'GET').toBe('GET');
  });
  it('distinguishes a failed query from an empty successful query', async () => {
    const transport = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ items: [], total: 0, page: 1, pageSize: 20 }));
    vi.stubGlobal('fetch', transport);
    render(<WorkspaceSearch />);
    fireEvent.change(screen.getByLabelText('业务检索'), { target: { value: 'nothing' } });
    fireEvent.click(screen.getByRole('button', { name: '检索' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('检索失败');
    expect(screen.queryByText('没有匹配记录。')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '检索' }));
    expect(await screen.findByText('没有匹配记录。')).toBeVisible();
  });
});
