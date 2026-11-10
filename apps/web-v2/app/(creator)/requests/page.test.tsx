import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RequestsPage from './page';

const state = vi.hoisted(() => ({ confirm: vi.fn(), decline: vi.fn(), fulfill: vi.fn() }));

vi.mock('@/lib/auth/session', () => ({ getBearerToken: () => 'access-token' }));
vi.mock('@/features/creator-dashboard/api/use-creator-requests', () => ({
  useCreatorRequests: () => ({
    data: [
      {
        action: { id: 'action-1', state: 'submitted', requestMessage: 'Hello' },
        customer: { contactName: 'Visitor', contactMethod: 'contact' },
        offering: { title: 'Consultation' },
      },
    ],
    isLoading: false,
  }),
  useCreatorConfirmedRequests: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/features/creator-dashboard/api/use-creator-actions', () => ({
  useConfirmRequest: () => ({ mutateAsync: state.confirm, isPending: false }),
  useDeclineRequest: () => ({ mutateAsync: state.decline, isPending: false }),
  useConfirmFulfillment: () => ({ mutateAsync: state.fulfill, isPending: false }),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('request decisions', () => {
  it('shows a failed decision and replaces it after a successful retry', async () => {
    state.confirm.mockRejectedValueOnce(new Error('请求状态已变更')).mockResolvedValueOnce({});
    render(<RequestsPage />);

    fireEvent.click(screen.getByRole('button', { name: '确认预约' }));
    expect(await screen.findByRole('status')).toHaveTextContent('请求状态已变更');

    fireEvent.click(screen.getByRole('button', { name: '确认预约' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('已确认预约'));
    expect(state.confirm).toHaveBeenCalledWith('action-1');
  });
});
