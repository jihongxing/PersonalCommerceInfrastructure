import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ServicesPage from './page';

const state = vi.hoisted(() => ({ query: {} as Record<string, unknown>, refetch: vi.fn() }));
vi.mock('@/features/creator-onboarding/api/use-creator-services', () => ({
  useCreatorServices: () => state.query,
}));

beforeEach(() => {
  state.refetch.mockClear();
  state.query = { isLoading: false, isError: false, refetch: state.refetch };
});

describe('services list', () => {
  it('groups actual services by state and preserves their routes', async () => {
    state.query.data = [
      { id: 'draft-1', title: '咨询', description: '草稿说明', state: 'draft' },
      { id: 'live-1', title: '指导', description: '服务说明', state: 'published' },
    ];
    render(<ServicesPage />);
    expect(screen.getByRole('link', { name: '编辑咨询' })).toHaveAttribute(
      'href',
      '/services/draft-1/edit',
    );
    expect(screen.getByRole('link', { name: '查看咨询' })).toHaveAttribute(
      'href',
      '/services/draft-1',
    );
    await userEvent.click(screen.getByRole('tab', { name: '已发布 (1)' }));
    expect(screen.getByRole('link', { name: '查看指导' })).toHaveAttribute(
      'href',
      '/services/live-1',
    );
  });

  it('shows an error instead of treating a failed query as an empty list', () => {
    state.query.isError = true;
    render(<ServicesPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('服务加载失败');
    expect(screen.queryByText('还没有创建服务。')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(state.refetch).toHaveBeenCalledOnce();
  });

  it('separates unpublished and archived offerings and exposes only permitted management links', async () => {
    state.query.data = [
      { id: 'unpublished-1', title: '可继续管理', description: '撤回说明', state: 'unpublished' },
      { id: 'archived-1', title: '历史服务', description: '归档说明', state: 'archived' },
    ];
    render(<ServicesPage />);
    await userEvent.click(screen.getByRole('tab', { name: '未发布 (1)' }));
    expect(screen.getByRole('link', { name: '编辑可继续管理' }).getAttribute('href')).toBe(
      '/services/unpublished-1/edit',
    );
    expect(screen.getByText(/可编辑并按发布条件重新发布/)).toBeTruthy();
    expect(screen.queryByRole('link', { name: '查看历史服务' })).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: '已归档 (1)' }));
    expect(screen.queryByRole('link', { name: '编辑历史服务' })).toBeNull();
    expect(screen.getByRole('link', { name: '查看历史服务' }).getAttribute('href')).toBe(
      '/services/archived-1',
    );
    expect(screen.getByText(/不能编辑或重新发布/)).toBeTruthy();
    expect(screen.queryByRole('link', { name: '编辑可继续管理' })).toBeNull();
  });
});
