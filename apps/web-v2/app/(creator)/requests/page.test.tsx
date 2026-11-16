import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import RequestsPage from './page';
import { ApiError } from '@/lib/api/client';
import type { CreatorRequest } from '@/features/creator-dashboard/api/use-creator-requests';

const state = vi.hoisted(() => ({
  confirm: vi.fn(),
  decline: vi.fn(),
  fulfill: vi.fn(),
  refetch: vi.fn(),
  error: null as Error | null,
  requests: [] as CreatorRequest[],
}));
const request: CreatorRequest = {
  action: {
    id: 'action-1',
    state: 'submitted',
    requestMessage: 'Discuss next Tuesday',
    customerId: 'customer-1',
    creatorId: 'creator-1',
    offeringId: 'offering-1',
    resultAccessToken: 'private-result-token',
  },
  customer: { contactName: 'Visitor', contactMethod: 'visitor@example.test' },
  offering: { title: 'Consultation' },
};
vi.mock('@/lib/auth/context', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));
vi.mock('@/features/creator-dashboard/api/use-creator-requests', () => ({
  useCreatorRequests: () => ({
    data: state.requests,
    isLoading: false,
    error: state.error,
    refetch: state.refetch,
  }),
  useCreatorConfirmedRequests: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
}));
vi.mock('@/features/creator-dashboard/api/use-creator-actions', () => ({
  useConfirmRequest: () => ({ mutateAsync: state.confirm, isPending: false }),
  useDeclineRequest: () => ({ mutateAsync: state.decline, isPending: false }),
  useConfirmFulfillment: () => ({ mutateAsync: state.fulfill, isPending: false }),
}));

// jsdom does not implement native modal behavior. Actual focus/inert/Escape behavior
// is separately verified in the real browser; this stub only exercises React wiring.
const showDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      if (!this.open) return;
      this.open = false;
      this.dispatchEvent(new Event('close'));
    },
  });
});
afterAll(() => {
  for (const [key, descriptor] of [
    ['showModal', showDescriptor],
    ['close', closeDescriptor],
  ] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, key, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, key);
  }
});
beforeEach(() => {
  vi.resetAllMocks();
  state.requests = [request];
  state.error = null;
});

describe('request decisions', () => {
  it.each([
    ['确认请求', '确认此请求？', '确认接受', 'confirm'],
    ['拒绝请求', '拒绝此请求？', '确认拒绝', 'decline'],
  ] as const)(
    'reviews the request before %s and supports cancellation',
    (opener, title, commit, mutation) => {
      render(<RequestsPage />);
      fireEvent.click(screen.getByRole('button', { name: opener }));
      const modal = screen.getByRole('dialog', { name: title });
      expect(modal.textContent).toContain('不可撤销');
      for (const text of [
        'Consultation',
        'Visitor',
        'visitor@example.test',
        'action-1',
        'Discuss next Tuesday',
      ]) {
        expect(within(modal).getByText(text)).toBeTruthy();
      }
      expect(modal.textContent).not.toContain('private-result-token');
      expect(within(modal).getByRole('button', { name: commit })).toBeTruthy();
      expect(state[mutation]).not.toHaveBeenCalled();
      fireEvent.click(within(modal).getByRole('button', { name: '取消' }));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(state[mutation]).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['确认请求', '确认接受', 'confirm', '已确认请求'],
    ['拒绝请求', '确认拒绝', 'decline', '已拒绝请求'],
  ] as const)(
    'submits %s once, blocks cancellation while pending, and announces success',
    async (opener, commit, mutation, success) => {
      let finish!: (value: object) => void;
      state[mutation].mockReturnValue(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
      render(<RequestsPage />);
      fireEvent.click(screen.getByRole('button', { name: opener }));
      const modal = screen.getByRole('dialog');
      const button = within(modal).getByRole('button', { name: commit });
      fireEvent.click(button);
      fireEvent.click(button);
      expect(state[mutation]).toHaveBeenCalledExactlyOnceWith('action-1');
      expect(button.hasAttribute('disabled')).toBe(true);
      expect(document.activeElement?.textContent).toContain('正在提交并核对最新状态');
      expect(within(modal).getByRole('button', { name: '取消' }).hasAttribute('disabled')).toBe(
        true,
      );
      const cancel = new Event('cancel', { cancelable: true });
      fireEvent(modal, cancel);
      expect(cancel.defaultPrevented).toBe(true);
      await act(async () => finish({}));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByRole('status').textContent).toBe(success);
      expect(document.activeElement).toBe(screen.getByRole('status'));
    },
  );

  it('supports native cancellation before a decision is submitted', () => {
    render(<RequestsPage />);
    fireEvent.click(screen.getByRole('button', { name: '确认请求' }));
    const modal = screen.getByRole('dialog');
    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(modal, cancel);
    expect(cancel.defaultPrevented).toBe(false);
    act(() => (modal as HTMLDialogElement).close());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(state.confirm).not.toHaveBeenCalled();
  });

  it('keeps a failed action visible and permits a deliberate retry', async () => {
    state.confirm
      .mockRejectedValueOnce(new ApiError('API 暂不可用', 'unavailable', 503))
      .mockResolvedValueOnce({});
    render(<RequestsPage />);
    fireEvent.click(screen.getByRole('button', { name: '确认请求' }));
    fireEvent.click(screen.getByRole('button', { name: '确认接受' }));
    expect((await screen.findByRole('alert')).textContent).toContain('API 暂不可用');
    expect(document.activeElement).toBe(screen.getByRole('alert'));
    expect(screen.queryByText('已确认请求')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '确认接受' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('已确认请求'));
    expect(state.confirm).toHaveBeenCalledTimes(2);
  });

  it('retains cached requests while a failed refresh blocks another decision and permits refresh', () => {
    const view = render(<RequestsPage />);
    fireEvent.click(screen.getByRole('button', { name: '确认请求' }));
    state.error = new Error('API 暂不可用');
    view.rerender(<RequestsPage />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('button', { name: '确认接受' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '确认接受' }));
    expect(state.confirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(screen.getByText('最新请求状态加载失败，请刷新后再操作。')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '刷新请求' }));
    expect(state.refetch).toHaveBeenCalledOnce();
    state.error = null;
    view.rerender(<RequestsPage />);
    fireEvent.click(screen.getByRole('button', { name: '确认请求' }));
    expect(screen.getByRole('button', { name: '确认接受' }).hasAttribute('disabled')).toBe(false);
  });

  it('reports a concurrent conflict and prevents another decision after refreshed data removes the request', async () => {
    state.decline.mockRejectedValue(new ApiError('请求状态已变更', 'conflict', 409));
    const view = render(<RequestsPage />);
    fireEvent.click(screen.getByRole('button', { name: '拒绝请求' }));
    fireEvent.click(screen.getByRole('button', { name: '确认拒绝' }));
    expect((await screen.findByRole('alert')).textContent).toContain('请求状态发生冲突');
    state.requests = [];
    view.rerender(<RequestsPage />);
    expect(screen.getByRole('button', { name: '确认拒绝' }).hasAttribute('disabled')).toBe(true);
    expect(
      screen.getByText('当前无法确认此请求仍为待处理状态，不能继续提交。请关闭弹窗查看最新状态。'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '确认拒绝' }));
    expect(state.decline).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(screen.getByText('暂无待处理的请求')).toBeTruthy();
  });
});
