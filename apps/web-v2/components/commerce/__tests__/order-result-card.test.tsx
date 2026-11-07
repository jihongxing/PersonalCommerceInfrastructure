import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderResultCard } from '@/components/commerce/order-result-card';
import type { OrderResult } from '@/features/order-fulfillment/api/use-order-result';

describe('OrderResultCard Component', () => {
  const mockOrderSubmitted: OrderResult = {
    actionId: 'action-123',
    state: 'submitted',
    resultAccessToken: 'token-123',
    customerId: 'customer-123',
    customer: {
      id: 'customer-123',
      contactName: 'John Doe',
      contactMethod: '13800138000',
    },
    offering: {
      id: 'offering-123',
      title: 'Taichi Class',
    },
  };

  const mockOrderConfirmed: OrderResult = {
    ...mockOrderSubmitted,
    state: 'confirmed',
    fulfillmentCode: {
      code: 'FC-ABCD1234',
      status: 'pending',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    },
  };

  const mockOrderDeclined: OrderResult = {
    ...mockOrderSubmitted,
    state: 'declined',
  };

  it('should display submitted state', () => {
    render(<OrderResultCard order={mockOrderSubmitted} />);

    expect(screen.getByText(/等待 Creator 回复/i)).toBeInTheDocument();
    expect(screen.getByText(/自动刷新/i)).toBeInTheDocument();
  });

  it('should display confirmed state with fulfillment code', () => {
    render(<OrderResultCard order={mockOrderConfirmed} />);

    expect(screen.getByText(/已确认/i)).toBeInTheDocument();
    expect(screen.getByText('FC-ABCD1234')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /确认履约/i })).toBeInTheDocument();
  });

  it('should display declined state', () => {
    render(<OrderResultCard order={mockOrderDeclined} />);

    expect(screen.getByText(/已拒绝/i)).toBeInTheDocument();
    expect(
      screen.getByText(/很抱歉.*无法接受此预约/i)
    ).toBeInTheDocument();
  });

  it('should handle refresh button click for submitted state', async () => {
    const handleRefresh = vi.fn();
    render(
      <OrderResultCard
        order={mockOrderSubmitted}
        onRefresh={handleRefresh}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /手动刷新/i });
    await userEvent.click(refreshButton);

    expect(handleRefresh).toHaveBeenCalledOnce();
  });

  it('should display customer information', () => {
    render(<OrderResultCard order={mockOrderSubmitted} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('13800138000')).toBeInTheDocument();
  });
});
