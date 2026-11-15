import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import ServiceDetailPage from './page';

const mocks = vi.hoisted(() => ({
  publish: vi.fn(),
  service: vi.fn(),
  asset: vi.fn(),
  distribute: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'service-1' }) }));
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
      missingPublishConditions: [],
    },
  }),
  usePublishService: () => ({ mutateAsync: mocks.publish, isPending: false }),
  useUnpublishService: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDistributionAsset: () => ({ data: mocks.asset(), isPending: false, isError: false }),
  useRecordDistribution: () => ({ mutateAsync: mocks.distribute, isPending: false }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.publish.mockReset();
  mocks.service.mockReset();
  mocks.asset.mockReset();
  mocks.distribute.mockReset();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

it('uses server publish conditions to prevent publication', () => {
  mocks.service.mockReturnValue({
    id: 'service-1',
    state: 'draft',
    title: '咨询',
    description: '描述',
    capabilityIds: ['capability-1'],
    availabilityDescription: '工作日',
    requestInstructions: '留言',
    templateId: 'template-professional-consulting',
    policyStatus: 'approved',
    missingPublishConditions: ['availability'],
  });
  render(<ServiceDetailPage />);
  expect(screen.getByText('4 / 5 完成')).toBeInTheDocument();
  expect(screen.getByText('需要说明服务何时可用')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '发布服务' })).toBeDisabled();
});

it('announces server rejection after a complete readiness check', async () => {
  mocks.publish.mockRejectedValue(new Error('发布状态已发生变化'));
  render(<ServiceDetailPage />);
  expect(screen.getByText('发布前检查清单').parentElement).toHaveTextContent('5 / 5 完成');
  await userEvent.click(screen.getByRole('button', { name: '发布服务' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('发布状态已发生变化');
});

it('records external distribution only after explicit confirmation', async () => {
  mocks.service.mockReturnValue({
    id: 'service-1',
    state: 'published',
    title: '咨询',
    description: '描述',
    capabilityIds: [],
    requestInstructions: '留言',
    missingPublishConditions: [],
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
