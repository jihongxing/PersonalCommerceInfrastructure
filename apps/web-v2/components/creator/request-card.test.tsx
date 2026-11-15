import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
  it('shows the terminal decision without fulfillment controls', () => {
    render(<RequestCard request={request} />);
    expect(screen.getByText('已确认')).toBeInTheDocument();
    expect(screen.queryByText(/履约/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
