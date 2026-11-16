import { describe, expect, it } from 'vitest';

import { DomainTransitionError } from '../shared/domain-error.js';
import {
  archiveOffering,
  InvalidAppearanceDateRangeError,
  createDraftOffering,
  missingPublishConditions,
  publishOffering,
  unpublishOffering,
  updateOffering,
  type Offering,
} from './offering.js';

function createOffering(overrides: Partial<Offering> = {}): Offering {
  return {
    id: 'offering-1',
    creatorId: 'creator-1',
    capabilityIds: ['capability-1'],
    title: '舞蹈私教',
    description: '一小时一对一舞蹈私教',
    availability: { description: '周末可约，具体时间需确认' },
    requestInstructions: '请提供期望时间和舞蹈基础',
    state: 'draft',
    ...overrides,
  };
}

describe('Offering state machine', () => {
  it('publishes an eligible draft offering', () => {
    expect(publishOffering(createOffering()).state).toBe('published');
  });

  it('rejects an offering without availability', () => {
    const offering: Offering = {
      id: 'offering-1',
      creatorId: 'creator-1',
      capabilityIds: ['capability-1'],
      title: '舞蹈私教',
      description: '一小时一对一舞蹈私教',
      requestInstructions: '请提供期望时间和舞蹈基础',
      state: 'draft',
    };

    expect(() => publishOffering(offering)).toThrow('minimum publish conditions');
  });

  it('unpublishes a published offering', () => {
    expect(unpublishOffering(createOffering({ state: 'published' })).state).toBe('unpublished');
  });

  it('rejects draft to unpublished', () => {
    expect(() => unpublishOffering(createOffering())).toThrow(DomainTransitionError);
  });

  it('archives a non-archived offering', () => {
    expect(archiveOffering(createOffering()).state).toBe('archived');
  });

  it('saves an incomplete offering as a draft and reports its missing publish conditions', () => {
    const offering = createDraftOffering('offering-1', 'creator-1', {
      capabilityIds: ['capability-1'],
      title: ' ',
      description: '一小时舞蹈私教',
      requestInstructions: ' ',
    });

    expect(offering.state).toBe('draft');
    expect(missingPublishConditions(offering)).toEqual([
      'title',
      'availability',
      'request_instructions',
    ]);
  });

  it('updates a draft offering without changing its identity or state', () => {
    const updated = updateOffering(createOffering(), {
      capabilityIds: [' capability-1 ', 'capability-1'],
      title: ' 舞蹈私教 ',
      description: ' 一小时一对一舞蹈私教 ',
      availabilityDescription: ' 周末可约 ',
      requestInstructions: ' 请提供期望时间 ',
    });

    expect(updated).toMatchObject({
      id: 'offering-1',
      state: 'draft',
      capabilityIds: ['capability-1'],
      availability: { description: '周末可约' },
    });
  });

  it('normalizes optional Appearance metadata without creating a new Offering type', () => {
    const offering = createDraftOffering('offering-appearance', 'creator-1', {
      capabilityIds: ['capability-1'],
      title: ' 上海漫展嘉宾出席 ',
      description: ' 提供漫展嘉宾与品牌活动出席合作 ',
      availabilityDescription: ' 仅接受已确认请求 ',
      requestInstructions: ' 请说明主办方、日期和合作内容 ',
      appearance: {
        appearanceType: 'convention',
        startsOn: '2026-08-20',
        endsOn: '2026-08-21',
        locationDescription: ' 上海新国际博览中心 ',
        buyerType: 'organizer',
        pricingRule: ' 根据时长和合作内容报价 ',
        requestCallToAction: ' 提交出席合作请求 ',
        upcomingTitle: ' 8 月上海漫展 ',
        externalUrl: 'https://example.com/convention',
      },
    });

    expect(offering.appearance).toEqual({
      appearanceType: 'convention',
      startsOn: '2026-08-20',
      endsOn: '2026-08-21',
      locationDescription: '上海新国际博览中心',
      buyerType: 'organizer',
      pricingRule: '根据时长和合作内容报价',
      requestCallToAction: '提交出席合作请求',
      upcomingTitle: '8 月上海漫展',
      externalUrl: 'https://example.com/convention',
    });
  });

  it('preserves Appearance metadata when an older client omits it during ordinary edits', () => {
    const updated = updateOffering(
      createOffering({
        appearance: {
          appearanceType: 'guest',
          startsOn: '2026-08-20',
          locationDescription: '上海',
          buyerType: 'organizer',
          requestCallToAction: '提交请求',
          upcomingTitle: '上海漫展',
        },
      }),
      {
        capabilityIds: ['capability-1'],
        title: '舞蹈私教',
        description: '一小时一对一舞蹈私教',
        availabilityDescription: '周末可约',
        requestInstructions: '请提供期望时间',
      },
    );

    expect(updated.appearance).toEqual({
      appearanceType: 'guest',
      startsOn: '2026-08-20',
      locationDescription: '上海',
      buyerType: 'organizer',
      requestCallToAction: '提交请求',
      upcomingTitle: '上海漫展',
    });
  });
  it('replaces the entire supplied Appearance object and permits an omitted upcomingTitle', () => {
    const original = createOffering({
      appearance: {
        appearanceType: 'guest',
        startsOn: '2026-08-20',
        endsOn: '2026-08-21',
        locationDescription: '上海',
        buyerType: 'organizer',
        requestCallToAction: '提交请求',
        upcomingTitle: '旧标题',
        pricingRule: '旧说明',
        externalUrl: 'https://example.test/old',
      },
    });
    const replacement = {
      appearanceType: 'brand' as const,
      startsOn: '2026-11-20',
      locationDescription: '北京',
      buyerType: 'brand' as const,
      requestCallToAction: '提交合作请求',
    };
    const updated = updateOffering(original, { ...original, appearance: replacement });
    expect(updated.appearance).toEqual(replacement);
    expect(original.appearance?.upcomingTitle).toBe('旧标题');
  });

  it('preserves Appearance in the update branch without availability', () => {
    const original = createOffering({
      appearance: {
        appearanceType: 'guest',
        startsOn: '2026-08-20',
        locationDescription: '上海',
        buyerType: 'organizer',
        requestCallToAction: '提交请求',
      },
    });
    const updated = updateOffering(original, {
      capabilityIds: original.capabilityIds,
      title: '新标题',
      description: original.description,
      requestInstructions: original.requestInstructions,
    });
    expect(updated.appearance).toEqual(original.appearance);
  });

  it('keeps ordinary Offering creation and updates free of Appearance', () => {
    const input = {
      capabilityIds: ['capability-1'],
      title: '舞蹈私教',
      description: '说明',
      requestInstructions: '提交请求',
    };
    const created = createDraftOffering('ordinary', 'creator-1', input);
    expect(created).not.toHaveProperty('appearance');
    expect(updateOffering(created, { ...input, title: '新标题' })).not.toHaveProperty('appearance');
  });

  it('rejects reversed dates on create and update without mutating the original', () => {
    const original = createOffering();
    const input = {
      ...original,
      appearance: {
        appearanceType: 'guest' as const,
        startsOn: '2026-08-21',
        endsOn: '2026-08-20',
        locationDescription: '上海',
        buyerType: 'organizer' as const,
        requestCallToAction: '提交请求',
      },
    };
    expect(() => createDraftOffering('invalid', 'creator-1', input)).toThrow(
      InvalidAppearanceDateRangeError,
    );
    expect(() => updateOffering(original, input)).toThrow(InvalidAppearanceDateRangeError);
    expect(original).not.toHaveProperty('appearance');
    expect(() =>
      createDraftOffering('same-day', 'creator-1', {
        ...input,
        appearance: { ...input.appearance, endsOn: input.appearance.startsOn },
      }),
    ).not.toThrow();
  });
});
