import { describe, expect, it } from 'vitest';

import { DomainTransitionError } from '../shared/domain-error.js';
import {
  archiveOffering,
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
});
