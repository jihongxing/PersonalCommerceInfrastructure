import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EditCapabilityForm } from './edit-capability-form';

const refetch = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));
vi.mock('../api/use-capability', () => ({
  useCapability: () => ({
    isLoading: false,
    isError: true,
    error: new Error('服务暂不可用'),
    refetch,
  }),
  useUpdateCapability: () => ({ isPending: false }),
}));

describe('capability edit failure', () => {
  it('distinguishes loading failure from a missing capability and offers retry', () => {
    render(<EditCapabilityForm capabilityId="test-id" />);
    expect(screen.getByRole('alert')).toHaveTextContent('服务暂不可用');
    expect(screen.queryByText('能力未找到')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
