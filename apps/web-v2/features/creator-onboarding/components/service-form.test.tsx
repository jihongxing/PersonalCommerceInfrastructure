import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceForm } from './service-form';
import type { ServiceOffering } from '../api/use-creator-services';

const state = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  push: vi.fn(),
  existing: undefined as ServiceOffering | undefined,
}));
const templates = [
  {
    id: 'template-commercial-appearance',
    capabilityCatalogItemId: 'capability-commercial-appearance',
    name: '商业演出与活动出席',
    status: 'active',
    riskTier: 'review',
  },
  {
    id: 'template-dance-private-lesson',
    capabilityCatalogItemId: 'capability-dance-teaching',
    name: '舞蹈私教',
    status: 'active',
    riskTier: 'low',
  },
];
const catalog = { templates };
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: state.push, back: vi.fn() }) }));
vi.mock('../api/use-creator-capabilities', () => ({
  useCreatorCapabilities: () => ({
    data: [
      { id: 'activity-cap', name: '活动出席', catalogItemId: 'capability-commercial-appearance' },
      { id: 'dance-cap', name: '舞蹈教学', catalogItemId: 'capability-dance-teaching' },
    ],
    isLoading: false,
  }),
}));
vi.mock('../api/use-service-catalog', () => ({
  useServiceCatalog: () => ({ data: catalog, isLoading: false }),
}));
vi.mock('../api/use-creator-services', () => ({
  useServiceOffering: () => ({ data: state.existing, isLoading: false }),
  useCreateService: () => ({ mutateAsync: state.create, isPending: false }),
  useUpdateService: () => ({ mutateAsync: state.update, isPending: false }),
}));
const metadata = {
  appearanceType: 'guest' as const,
  startsOn: '2026-11-20',
  endsOn: '2026-11-21',
  locationDescription: '上海活动场地',
  buyerType: 'approved_external_requester' as const,
  pricingRule: '说明合作范围',
  requestCallToAction: '提交出席请求',
  upcomingTitle: '活动展示标题',
  externalUrl: 'https://example.test/event',
};
function existing(scoped = true, withMetadata = true): ServiceOffering {
  return {
    id: 'service-1',
    creatorId: 'creator-1',
    capabilityIds: [scoped ? 'activity-cap' : 'dance-cap'],
    templateId: scoped ? templates[0]!.id : templates[1]!.id,
    title: '现有服务',
    description: '服务说明',
    availabilityDescription: '需联系确认',
    requestInstructions: '请说明活动需求',
    state: 'draft',
    missingPublishConditions: [],
    createdAt: '',
    updatedAt: '',
    ...(withMetadata ? { appearance: metadata } : {}),
  };
}
beforeEach(() => {
  state.create.mockReset();
  state.update.mockReset();
  state.push.mockReset();
  state.existing = undefined;
});
async function choose(scoped = true) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: scoped ? '活动出席' : '舞蹈教学' }));
  await user.selectOptions(
    screen.getByLabelText(/服务模板/),
    scoped ? templates[0]!.id : templates[1]!.id,
  );
  for (const [label, value] of [
    [/服务名称/, '新活动'],
    [/详细描述/, '活动服务说明'],
    [/可用性描述/, '联系确认'],
    [/请求说明/, '说明活动需求'],
  ] as const)
    await user.type(screen.getByLabelText(label), value);
  return user;
}

describe('scoped Appearance service form', () => {
  it('keeps a direct archived edit route read-only', () => {
    state.existing = { ...existing(), state: 'archived' };
    render(<ServiceForm serviceId="service-1" />);
    expect(screen.getByText('此服务已归档')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(state.update).not.toHaveBeenCalled();
  });
  it('hides the creation entry on ordinary templates and creates without Appearance', async () => {
    render(<ServiceForm />);
    const user = await choose(false);
    expect(screen.queryByRole('button', { name: '添加活动信息' })).toBeNull();
    await user.click(screen.getByRole('button', { name: '创建服务' }));
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
    expect(state.create.mock.calls[0]![0]).not.toHaveProperty('appearance');
  });
  it('keeps the full object optional even on the confirmed template', async () => {
    render(<ServiceForm />);
    const user = await choose();
    expect(screen.getByRole('button', { name: '添加活动信息' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '创建服务' }));
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
    expect(state.create.mock.calls[0]![0]).not.toHaveProperty('appearance');
  });
  it('creates a full real API object and omits blank optional values', async () => {
    render(<ServiceForm />);
    const user = await choose();
    await user.click(screen.getByRole('button', { name: '添加活动信息' }));
    fireEvent.change(screen.getByLabelText('活动日期'), { target: { value: '2026-11-20' } });
    await user.type(screen.getByLabelText('活动地点'), '上海');
    await user.selectOptions(screen.getByLabelText('适合的请求方'), 'approved_external_requester');
    await user.click(screen.getByRole('button', { name: '创建服务' }));
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
    expect(state.create.mock.calls[0]![0].appearance).toEqual({
      appearanceType: 'guest',
      startsOn: '2026-11-20',
      locationDescription: '上海',
      buyerType: 'approved_external_requester',
      requestCallToAction: '提交请求',
    });
  });
  it('rehydrates all metadata and submits a whole edited object', async () => {
    state.existing = existing();
    render(<ServiceForm serviceId="service-1" />);
    expect(await screen.findByDisplayValue('上海活动场地')).toBeTruthy();
    expect(screen.getByLabelText('活动日期')).toHaveValue(metadata.startsOn);
    expect(screen.getByLabelText('结束日期（可选）')).toHaveValue(metadata.endsOn);
    expect(screen.getByLabelText('外部信息链接（可选）')).toHaveValue(metadata.externalUrl);
    const user = userEvent.setup();
    await user.clear(screen.getByLabelText('活动地点'));
    await user.type(screen.getByLabelText('活动地点'), '北京');
    await user.click(screen.getByRole('button', { name: '更新服务' }));
    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
    expect(state.update.mock.calls[0]![0].appearance).toEqual({
      ...metadata,
      locationDescription: '北京',
    });
  });
  it('keeps Appearance on ordinary title edits of a scoped Offering', async () => {
    state.existing = existing();
    render(<ServiceForm serviceId="service-1" />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/服务名称/), '更新');
    await user.click(screen.getByRole('button', { name: '更新服务' }));
    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
    expect(state.update.mock.calls[0]![0].appearance).toEqual(metadata);
  });
  it('keeps unsaved edits when the service query refreshes', async () => {
    state.existing = existing();
    const view = render(<ServiceForm serviceId="service-1" />);
    const user = userEvent.setup();
    await user.clear(await screen.findByLabelText('活动地点'));
    await user.type(screen.getByLabelText('活动地点'), '未保存地点');
    state.existing = { ...existing(), title: '服务端重新读取标题' };
    view.rerender(<ServiceForm serviceId="service-1" />);
    expect(screen.getByLabelText('活动地点')).toHaveValue('未保存地点');
    await user.click(screen.getByRole('button', { name: '更新服务' }));
    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
    expect(state.update.mock.calls[0]![0].appearance.locationDescription).toBe('未保存地点');
  });
  it('does not submit newly entered Appearance after switching to an ordinary template', async () => {
    render(<ServiceForm />);
    const user = await choose();
    await user.click(screen.getByRole('button', { name: '添加活动信息' }));
    await user.type(screen.getByLabelText('活动地点'), '未保存活动');
    await user.click(screen.getByRole('button', { name: '活动出席' }));
    await user.click(screen.getByRole('button', { name: '舞蹈教学' }));
    await user.selectOptions(screen.getByLabelText(/服务模板/), templates[1]!.id);
    expect(screen.queryByLabelText('活动地点')).toBeNull();
    expect(screen.queryByRole('button', { name: '添加活动信息' })).toBeNull();
    await user.click(screen.getByRole('button', { name: '创建服务' }));
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
    expect(state.create.mock.calls[0]![0]).not.toHaveProperty('appearance');
  });
  it('shows off-scope historical metadata read-only and omits it from ordinary updates', async () => {
    state.existing = existing(false);
    render(<ServiceForm serviceId="service-1" />);
    expect(await screen.findByRole('region', { name: '历史活动信息' })).toBeTruthy();
    expect(screen.getByText('外部请求方')).toBeTruthy();
    expect(screen.queryByLabelText('活动地点')).toBeNull();
    expect(screen.queryByRole('button', { name: '添加活动信息' })).toBeNull();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/服务名称/), '更新');
    await user.click(screen.getByRole('button', { name: '更新服务' }));
    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
    expect(state.update.mock.calls[0]![0]).not.toHaveProperty('appearance');
  });
  it('rejects reversed dates and missing required metadata without issuing an API request', async () => {
    state.existing = existing();
    render(<ServiceForm serviceId="service-1" />);
    const user = userEvent.setup();
    fireEvent.change(await screen.findByLabelText('结束日期（可选）'), {
      target: { value: '2026-11-19' },
    });
    await user.clear(screen.getByLabelText('活动地点'));
    await user.click(screen.getByRole('button', { name: '更新服务' }));
    expect(await screen.findByText('结束日期不能早于活动日期')).toBeTruthy();
    expect(screen.getByText('请输入活动地点')).toBeTruthy();
    expect(state.update).not.toHaveBeenCalled();
  });
  it('retains entered metadata after server failure and permits a retry', async () => {
    state.existing = existing();
    state.update.mockRejectedValueOnce(new Error('服务暂时不可用')).mockResolvedValueOnce({});
    render(<ServiceForm serviceId="service-1" />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('活动地点'), '新地点');
    await user.click(screen.getByRole('button', { name: '更新服务' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('服务暂时不可用');
    expect(screen.getByLabelText('活动地点')).toHaveValue(metadata.locationDescription + '新地点');
    await user.click(screen.getByRole('button', { name: '更新服务' }));
    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(2));
    expect(state.push).toHaveBeenCalledWith('/services');
  });
  it('prevents duplicate submits while a mutation remains unresolved', async () => {
    state.existing = existing();
    let finish!: () => void;
    state.update.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    render(<ServiceForm serviceId="service-1" />);
    const button = await screen.findByRole('button', { name: '更新服务' });
    fireEvent.submit(button.closest('form')!);
    fireEvent.submit(button.closest('form')!);
    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
    finish();
  });
});
