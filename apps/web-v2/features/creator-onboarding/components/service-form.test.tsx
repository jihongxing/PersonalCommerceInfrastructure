import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ServiceForm } from './service-form';

const update = vi.hoisted(() => vi.fn());
vi.mock('../api/use-creator-capabilities', () => ({
  useCreatorCapabilities: () => ({ data: [], isLoading: false }),
}));
vi.mock('../api/use-service-catalog', () => ({
  useServiceCatalog: () => ({ data: [], isLoading: false }),
}));
vi.mock('../api/use-creator-services', () => ({
  useServiceOffering: () => ({
    data: {
      id: 'archived-1',
      state: 'archived',
      title: '历史服务',
      capabilityIds: [],
      description: '历史说明',
      requestInstructions: '历史请求要求',
    },
    isLoading: false,
  }),
  useCreateService: () => ({ isPending: false }),
  useUpdateService: () => ({ mutateAsync: update, isPending: false }),
}));

it('keeps a direct archived edit route read-only without sending an update', () => {
  render(<ServiceForm serviceId="archived-1" />);
  expect(screen.getByText('此服务已归档')).toBeTruthy();
  expect(screen.queryByRole('textbox')).toBeNull();
  const details = screen.getByRole('link', { name: '查看服务' });
  expect(details.getAttribute('href')).toBe('/services/archived-1');
  expect(update).not.toHaveBeenCalled();
});
