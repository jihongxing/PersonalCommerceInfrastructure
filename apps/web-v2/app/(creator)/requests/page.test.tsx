import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RequestsPage from './page';

const state = vi.hoisted(() => ({ confirm: vi.fn(), decline: vi.fn() }));
vi.mock('@/lib/auth/context', () => ({ useAuth: () => ({ isAuthenticated: true, isLoading: false }) }));
vi.mock('@/features/creator-dashboard/api/use-creator-requests', () => ({
  useCreatorRequests: () => ({ data: [{ action: { id: 'action-1', state: 'submitted', requestMessage: 'Hello' }, customer: { contactName: 'Visitor', contactMethod: 'contact' }, offering: { title: 'Consultation' } }], isLoading: false }),
  useCreatorConfirmedRequests: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/features/creator-dashboard/api/use-creator-actions', () => ({
  useConfirmRequest: () => ({ mutateAsync: state.confirm, isPending: false }),
  useDeclineRequest: () => ({ mutateAsync: state.decline, isPending: false }),
}));

beforeEach(() => vi.resetAllMocks());

describe('request decisions', () => {
  it('shows a failed decision and replaces it after a successful retry', async () => {
    state.confirm.mockRejectedValueOnce(new Error('请求状态已变更')).mockResolvedValueOnce({});
    render(<RequestsPage />);
    fireEvent.click(screen.getByRole('button', { name: '确认请求' }));
    expect(await screen.findByRole('status')).toHaveTextContent('请求状态已变更');
    fireEvent.click(screen.getByRole('button', { name: '确认请求' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('已确认请求'));
    expect(state.confirm).toHaveBeenCalledWith('action-1');
  });
});