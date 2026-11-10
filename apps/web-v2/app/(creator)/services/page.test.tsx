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
});
