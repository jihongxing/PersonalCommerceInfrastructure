import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RequestCard } from './request-card';
import type { CreatorConfirmedRequest } from '@/features/creator-dashboard/api/use-creator-requests';

const request: CreatorConfirmedRequest = {
  action: {
    id: 'action-1',
    customerId: 'customer-1',
    creatorId: 'creator-1',
    offeringId: 'offering-1',
    requestMessage: 'Discuss availability',
    resultAccessToken: 'token',
    state: 'confirmed',
  },
  customer: { contactName: 'Visitor', contactMethod: 'contact' },
  offering: { title: 'Consultation' },
  fulfillmentCode: {
    code: 'FC-ABCD1234',
    status: 'pending',
    expiresAt: '2026-12-01T00:00:00.000Z',
  },
};

describe('confirmed request', () => {
  it('shows the fulfillment code and submits a validated code through the callback', () => {
    const onConfirmFulfillment = vi.fn();
    render(<RequestCard request={request} onConfirmFulfillment={onConfirmFulfillment} />);
    expect(screen.getByText('已确认')).toBeInTheDocument();
    expect(screen.getByText('FC-ABCD1234')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('输入客户提供的履约码'), {
      target: { value: 'fc-abcd1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: '确认履约' }));
    expect(onConfirmFulfillment).toHaveBeenCalledWith('action-1', 'FC-ABCD1234');
  });
});
