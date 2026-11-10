import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { HomepageManagement } from './homepage-management';

const api = vi.hoisted(() => ({ GET: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ apiClient: api }));
vi.mock('@/components/commerce/stable-sharing-tools', () => ({
  StableSharingTools: () => null,
}));

beforeEach(() => {
  api.GET.mockReset();
  api.GET.mockImplementation((path: string) => {
    if (path === '/api/v1/private/homepages') {
      return Promise.resolve({
        data: {
          versions: [
            {
              homepageId: 'a',
              state: 'PUBLISHED',
              isDefault: true,
              commerceProfile: { displayName: '方案甲' },
            },
            {
              homepageId: 'b',
              state: 'PUBLISHED',
              isDefault: false,
              commerceProfile: { displayName: '方案乙' },
            },
          ],
          windows: [],
          activeHomepageId: 'a',
          defaultHomepageId: 'a',
          nextSwitchAt: null,
        },
      });
    }
    if (path === '/api/v1/private/profiles') return Promise.resolve({ data: { profiles: [] } });
    if (path === '/api/v1/private/identity/reference') {
      return Promise.resolve({
        data: { assignmentStatus: 'ASSIGNED', displayValue: 'ACDEFH-3479JK-MNPQRT' },
      });
    }
    if (path === '/api/v1/private/homepages/a/preview') {
      return Promise.resolve({ data: { displayName: '甲预览', offerings: [] } });
    }
    return Promise.resolve({ error: { message: '预览失败' } });
  });
});

it('identifies the selected action target and removes a stale preview when selection changes', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <HomepageManagement />
    </QueryClientProvider>,
  );

  expect(await screen.findByText('管理的方案：方案甲')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '预览' }));
  expect(await screen.findByText('这是“甲预览”的主页预览')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /方案乙/ }));
  expect(screen.getByText('管理的方案：方案乙')).toBeInTheDocument();
  expect(screen.queryByText('这是“甲预览”的主页预览')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '预览' }));
  expect(await screen.findByText('预览失败')).toBeInTheDocument();
  expect(screen.queryByText('这是“甲预览”的主页预览')).not.toBeInTheDocument();
});
