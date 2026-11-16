import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingForm } from './booking-form';

const state = vi.hoisted(() => ({ submit: vi.fn(), push: vi.fn(), error: null as Error | null }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock('@/features/service-booking/api/use-submit-booking', () => ({
  useSubmitBooking: () => ({ mutateAsync: state.submit, isPending: false, error: state.error }),
}));

beforeEach(() => {
  state.submit.mockReset();
  state.push.mockReset();
  state.error = null;
});

describe('visitor request form', () => {
  it('validates required fields and submits the entered values', async () => {
    state.submit.mockResolvedValue({ resultAccessToken: 'result-token' });
    const user = userEvent.setup();
    render(<BookingForm offeringId="service-1" />);
    await user.click(screen.getByRole('button', { name: '提交请求' }));
    expect(await screen.findByText('请输入您的姓名')).toBeInTheDocument();
    expect(state.submit).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('您的姓名'), 'Visitor');
    await user.type(screen.getByLabelText('联系方式'), 'contact');
    await user.type(screen.getByLabelText('请求说明'), 'Details');
    await user.click(screen.getByRole('button', { name: '提交请求' }));
    await waitFor(() =>
      expect(state.submit).toHaveBeenCalledWith({
        contactName: 'Visitor',
        contactMethod: 'contact',
        requestMessage: 'Details',
      }),
    );
    expect(state.push).toHaveBeenCalledWith('/o/result-token');
  });

  it('announces a failed submission', () => {
    state.error = new Error('服务不可预约');
    render(<BookingForm offeringId="service-1" />);
    expect(screen.getByRole('alert')).toHaveTextContent('服务不可预约');
  });
});
