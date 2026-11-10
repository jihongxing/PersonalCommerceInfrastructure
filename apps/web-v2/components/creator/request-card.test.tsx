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
};

describe('confirmed request', () => {
  it('requires the visitor code before invoking fulfillment', () => {
    const confirm = vi.fn();
    render(<RequestCard request={request} onConfirmFulfillment={confirm} />);
    const button = screen.getByRole('button', { name: '确认履约' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('访客提供的履约码'), {
      target: { value: 'fc-a1b2c3d4' },
    });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(confirm).toHaveBeenCalledWith('action-1', 'FC-A1B2C3D4');
  });
});
