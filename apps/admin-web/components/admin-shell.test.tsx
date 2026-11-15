import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminShell } from './admin-shell';
import Overview from '../app/page';
import SectionPage from '../app/[section]/page';
import ErrorBoundary from '../app/error';
import Loading from '../app/loading';
import { sections } from '../lib/sections';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
const navigation = vi.hoisted(() => ({ pathname: '/templates' }));
vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => router,
  notFound: () => {
    throw new Error('not found');
  },
}));

vi.stubGlobal(
  'fetch',
  vi.fn(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          principalId: 'principal-1',
          accountId: 'account-1',
          sessionId: 'session-1',
          permissions: ['catalog:read', 'audit:read', 'offering:read', 'request:read'],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    ),
  ),
);

describe('Operations shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockImplementation(async (input) =>
      Response.json(
        input === '/api/operations/overview'
          ? { queriedAt: '2030-01-01T00:00:00Z', modules: {} }
          : {
              principalId: 'principal-1',
              accountId: 'account-1',
              sessionId: 'session-1',
              permissions: ['catalog:read', 'audit:read', 'offering:read', 'request:read'],
            },
      ),
    );
    navigation.pathname = '/templates';
  });
  it('withholds protected content when session validation fails and allows a retry', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network failure'));
    render(<AdminShell>Protected content</AdminShell>);
    expect(await screen.findByRole('alert')).toHaveTextContent('暂时无法验证');
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(await screen.findByText('Protected content')).toBeVisible();
  });

  it('validates a new protected route before revealing its content', async () => {
    const view = render(<AdminShell>First route</AdminShell>);
    expect(await screen.findByText('First route')).toBeVisible();
    navigation.pathname = '/';
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));
    view.rerender(<AdminShell>Second route</AdminShell>);
    expect(screen.queryByText('Second route')).not.toBeInTheDocument();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('Second route')).not.toBeInTheDocument();
  });
  it('has ten navigation destinations, an active area and a session control', async () => {
    render(
      <AdminShell>
        <Overview />
      </AdminShell>,
    );
    expect(screen.getByText('正在验证 Session')).toBeVisible();
    const navigation = await screen.findByRole('navigation', { name: '运营管理导航' });
    expect(navigation.querySelectorAll('a')).toHaveLength(10);
    expect(screen.getByRole('link', { name: '服务模板', current: 'page' })).toHaveAttribute(
      'href',
      '/templates',
    );
    expect(screen.getByRole('link', { name: '跳到主要内容' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('textbox', { name: '业务检索' })).toBeVisible();
    expect(await screen.findByRole('button', { name: '退出' })).toBeVisible();
  });

  it('keeps the shell on logout failure and only redirects after a confirmed retry', async () => {
    render(
      <AdminShell>
        <Overview />
      </AdminShell>,
    );
    await screen.findByRole('button', { name: '退出' });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 503 }));
    fireEvent.click(screen.getByRole('button', { name: '退出' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('退出未确认');
    expect(router.replace).not.toHaveBeenCalled();
    expect(screen.getByRole('navigation')).toBeVisible();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    fireEvent.click(screen.getByRole('button', { name: '退出' }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
  });

  it.each(
    sections.filter(
      (section) =>
        section.slug !== '' &&
        ![
          'search',
          'capabilities',
          'templates',
          'policy-versions',
          'audit',
          'offerings',
          'requests',
        ].includes(section.slug),
    ),
  )('keeps $english unavailable without fabricated data or management actions', async (section) => {
    render(await SectionPage({ params: Promise.resolve({ section: section.slug }) }));
    expect(screen.getByRole('heading', { level: 1, name: section.label })).toBeVisible();
    expect(screen.getByText('待实施 · 暂不可用')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders controlled Catalog policy management for Policy Versions', async () => {
    render(await SectionPage({ params: Promise.resolve({ section: 'policy-versions' }) }));
    expect(screen.getByRole('heading', { level: 1, name: '政策版本' })).toBeVisible();
    expect(screen.getByRole('button', { name: '新建草稿' })).toBeVisible();
    expect(screen.getByText(/尚未打开 Catalog 草稿/)).toBeVisible();
  });

  it.each([
    ['capabilities', '能力目录'],
    ['templates', '服务模板'],
    ['audit', '操作审计'],
    ['offerings', '服务 Offering'],
    ['requests', 'Customer Request'],
  ] as const)('renders the real read-only surface for %s', async (slug, label) => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify(
          slug === 'audit'
            ? { items: [], page: 1, pageSize: 20, total: 0 }
            : { policyVersion: 'v1', kind: slug, items: [], page: 1, pageSize: 20, total: 0 },
        ),
        { status: 200 },
      ),
    );
    render(await SectionPage({ params: Promise.resolve({ section: slug }) }));
    expect(screen.getByRole('heading', { level: 1, name: label })).toBeVisible();
    expect(await screen.findByText(/没有匹配|没有匹配的审计/)).toBeVisible();
    expect(screen.queryByText('待实施 · 暂不可用')).not.toBeInTheDocument();
  });

  it('exposes a safe retry without rendering exception details', () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error('private diagnostic')} reset={reset} />);
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.queryByText('private diagnostic')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重新加载' }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('announces loading separately from an unavailable area', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toHaveTextContent('正在加载工作区域');
  });
});
