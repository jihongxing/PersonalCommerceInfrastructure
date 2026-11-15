import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderResultCard } from '@/components/commerce/order-result-card';
import type { OrderResult } from '@/features/order-fulfillment/api/use-order-result';

const submitted: OrderResult = {
  actionId: 'action-123',
  state: 'submitted',
  resultAccessToken: 'token-123',
  message: '请求已提交',
};

describe('OrderResultCard', () => {
  it('shows the submitted state, message and query token', () => {
    render(<OrderResultCard result={submitted} />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('等待 Creator 回复');
    expect(screen.getByText('请求已提交')).toBeInTheDocument();
    expect(screen.getByTestId('query-code')).toHaveTextContent('token-123');
    expect(screen.getByText(/页面将自动刷新/)).toBeInTheDocument();
  });

  it('does not expose a historical fulfillment code', () => {
    render(
      <OrderResultCard
        result={
          {
            ...submitted,
            state: 'confirmed',
            fulfillmentCode: { code: 'FC-ABCD1234' },
          } as OrderResult
        }
      />,
    );
    expect(screen.getByTestId('status-badge')).toHaveTextContent('已确认');
    expect(screen.queryByText('FC-ABCD1234')).not.toBeInTheDocument();
    expect(screen.queryByText('履约码')).not.toBeInTheDocument();
  });

  it('shows the declined state without a fulfillment code', () => {
    render(<OrderResultCard result={{ ...submitted, state: 'declined' }} />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('已拒绝');
    expect(screen.getByText(/无法接受此请求/)).toBeInTheDocument();
  });
});
