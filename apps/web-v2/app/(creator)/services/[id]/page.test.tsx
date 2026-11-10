import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import ServiceDetailPage from './page';

const mocks = vi.hoisted(() => ({
  identity: vi.fn(),
  publish: vi.fn(),
  refetch: vi.fn(),
  service: vi.fn(),
  asset: vi.fn(),
  distribute: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'service-1' }) }));
vi.mock('@/features/creator-onboarding/api/use-creator-identity', () => ({
  useCreatorIdentity: mocks.identity,
}));
vi.mock('@/features/creator-onboarding/api/use-creator-services', () => ({
  useServiceOffering: () => ({
    data: mocks.service() ?? {
      id: 'service-1',
      state: 'draft',
      title: '咨询',
      description: '描述',
      capabilityIds: ['capability-1'],
      availabilityDescription: '工作日',
      requestInstructions: '留言',
      templateId: 'template-professional-consulting',
      policyStatus: 'approved',
    },
  }),
  usePublishService: () => ({ mutateAsync: mocks.publish, isPending: false }),
  useUnpublishService: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDistributionAsset: () => ({ data: mocks.asset(), isPending: false, isError: false }),
  useRecordDistribution: () => ({ mutateAsync: mocks.distribute, isPending: false }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

it('identifies incomplete identity and prevents publication', () => {
  mocks.identity.mockReturnValue({
    data: { profile: { displayName: '  ', bio: '' } },
    isPending: false,
    isError: false,
  });
  render(<ServiceDetailPage />);
  expect(screen.getByText('7 / 8 完成')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '完善商业身份' })).toHaveAttribute(
    'href',
    '/profile/edit',
  );
  expect(screen.getByRole('button', { name: '发布服务' })).toBeDisabled();
});

it('offers retry when identity cannot be checked', async () => {
  mocks.identity.mockReturnValue({ isPending: false, isError: true, refetch: mocks.refetch });
  render(<ServiceDetailPage />);
  expect(screen.getByRole('alert')).toHaveTextContent('无法检查商业身份');
  expect(screen.getByRole('button', { name: '发布服务' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: '重试' }));
  expect(mocks.refetch).toHaveBeenCalledOnce();
});

it('announces server rejection after a complete readiness check', async () => {
  mocks.identity.mockReturnValue({
    data: { profile: { displayName: '创作者', bio: '简介' } },
    isPending: false,
    isError: false,
  });
  mocks.publish.mockRejectedValue(new Error('发布状态已发生变化'));
  render(<ServiceDetailPage />);
  expect(screen.getByText('8 / 8 完成')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '发布服务' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('发布状态已发生变化');
});

it('records external distribution only after explicit confirmation', async () => {
  mocks.identity.mockReturnValue({ data: { profile: { displayName: '创作者', bio: '简介' } } });
  mocks.service.mockReturnValue({
    id: 'service-1',
    state: 'published',
    title: '咨询',
    description: '描述',
    capabilityIds: [],
    requestInstructions: '留言',
  });
  mocks.asset.mockReturnValue({
    offeringId: 'service-1',
    publicUrl: 'https://example.test/service',
    state: 'generated',
  });
  mocks.distribute.mockResolvedValue({});
  render(<ServiceDetailPage />);
  expect(screen.getByText('分享资产已生成，尚未记录实际对外分发')).toBeInTheDocument();
  expect(mocks.distribute).not.toHaveBeenCalled();
  vi.mocked(window.confirm).mockReturnValueOnce(false);
  await userEvent.click(screen.getByRole('button', { name: '确认已实际对外分发' }));
  expect(mocks.distribute).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: '确认已实际对外分发' }));
  expect(mocks.distribute).toHaveBeenCalledOnce();
  expect(await screen.findByRole('status')).toHaveTextContent('已记录实际对外分发');
});
