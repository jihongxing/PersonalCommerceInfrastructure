import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import DashboardPage, { loadReference, loadWorkspace } from './dashboard-client';

const api = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ apiClient: api }));
vi.mock('@/lib/auth/context', () => ({
  useAuth: () => ({ user: { email: 'creator@example.com' } }),
}));
vi.mock('@/components/commerce/stable-sharing-tools', () => ({
  StableSharingTools: () => null,
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  api.GET.mockReset();
  api.POST.mockReset();
});

it('keeps NOT_ASSIGNED as a normal reference response', async () => {
  api.GET.mockResolvedValue({ data: { assignmentStatus: 'NOT_ASSIGNED' }, error: null });

  await expect(loadReference()).resolves.toEqual({ assignmentStatus: 'NOT_ASSIGNED' });
});

it('does not initialize the workspace again while loading the dashboard', async () => {
  api.GET.mockResolvedValue({
    data: { profile: { displayName: '创作者', bio: '简介' } },
    error: null,
  });

  await expect(loadWorkspace()).resolves.toEqual({ name: '创作者', complete: true });
  expect(api.POST).not.toHaveBeenCalled();
});

it('shows an unassigned C number separately from a loading error', async () => {
  api.GET.mockImplementation((path: string) => {
    if (path === '/api/v1/creator/identity') {
      return Promise.resolve({
        data: { profile: { displayName: '创作者', bio: '简介' } },
        error: null,
      });
    }
    if (path === '/api/v1/private/identity/reference') {
      return Promise.resolve({ data: { assignmentStatus: 'NOT_ASSIGNED' }, error: null });
    }
    return Promise.resolve({
      data: {
        configuration: { state: 'UNPUBLISHED', commerceProfile: null },
        activeHomepageId: null,
        defaultHomepageId: null,
        nextSwitchAt: null,
      },
      error: null,
    });
  });

  render(<DashboardPage />, { wrapper });

  expect(await screen.findByText('C 号尚未分配，等待系统分配')).toBeInTheDocument();
  expect(screen.queryByText('C 号加载失败')).not.toBeInTheDocument();
});
