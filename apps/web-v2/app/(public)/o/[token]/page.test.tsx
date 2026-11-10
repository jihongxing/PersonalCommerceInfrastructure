import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderResultPage from './page';
import { useOrderResult } from '@/features/order-fulfillment/api/use-order-result';

vi.mock('@/features/order-fulfillment/api/use-order-result', () => ({ useOrderResult: vi.fn() }));

describe('OrderResultPage', () => {
  const refetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refreshes a submitted result using its token', async () => {
    vi.mocked(useOrderResult).mockReturnValue({
      data: {
        actionId: 'action-1',
        resultAccessToken: 'token-1',
        state: 'submitted',
        message: '已提交',
      },
      isLoading: false,
      error: null,
      refetch,
      isRefetching: false,
    } as unknown as ReturnType<typeof useOrderResult>);
    await act(async () => {
      render(<OrderResultPage params={Promise.resolve({ token: 'token-1' })} />);
    });
    await userEvent.click(await screen.findByRole('button', { name: '手动刷新状态' }));
    expect(useOrderResult).toHaveBeenCalledWith('token-1');
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('allows retry after a query error', async () => {
    vi.mocked(useOrderResult).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('查询码无效'),
      refetch,
      isRefetching: false,
    } as unknown as ReturnType<typeof useOrderResult>);
    await act(async () => {
      render(<OrderResultPage params={Promise.resolve({ token: 'bad-token' })} />);
    });
    expect(await screen.findByText('查询码无效')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
