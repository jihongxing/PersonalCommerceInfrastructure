import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CapabilitiesPage from './page';

const state = vi.hoisted(() => ({
  query: {} as Record<string, unknown>,
  refetch: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('@/features/creator-onboarding/api/use-creator-capabilities', () => ({
  useCreatorCapabilities: () => state.query,
  useDeleteCapability: () => ({ mutateAsync: state.remove, isPending: false }),
}));

beforeEach(() => {
  state.refetch.mockClear();
  state.remove.mockReset();
  state.query = { isLoading: false, isError: false, refetch: state.refetch };
});

describe('capabilities list', () => {
  it('shows actual capabilities and their count', () => {
    state.query.data = [{ id: '1', name: '咨询', description: '服务说明' }];
    render(<CapabilitiesPage />);
    expect(screen.getByRole('heading', { name: '咨询' })).toBeInTheDocument();
    expect(screen.getByText('1 项')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '添加能力' })).toHaveAttribute(
      'href',
      '/capabilities/new',
    );
  });

  it('distinguishes an error from an empty list and supports retry', () => {
    state.query.isError = true;
    render(<CapabilitiesPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('能力加载失败');
    expect(screen.queryByText('还没有添加能力。')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(state.refetch).toHaveBeenCalledOnce();
  });

  it('confirms deletion and displays an in-use error', async () => {
    state.query.data = [{ id: '1', name: '咨询', description: '服务说明' }];
    state.remove.mockRejectedValue(new Error('该能力已关联服务，请先在服务中移除关联。'));
    render(<CapabilitiesPage />);
    expect(screen.getByRole('link', { name: '编辑咨询' })).toHaveAttribute(
      'href',
      '/capabilities/1/edit',
    );
    fireEvent.click(screen.getByRole('button', { name: '删除咨询' }));
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('该能力已关联服务');
    expect(state.remove).toHaveBeenCalledWith('1');
  });
});
