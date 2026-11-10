import { describe, expect, it } from 'vitest';
import {
  evaluateOfferingPolicy,
  findCapabilityCatalogItem,
  findServiceOfferingTemplate,
  isPolicyPublishable,
  resolveCapabilitySelection,
} from './catalog.js';
import { initialServicePolicyCatalog } from './catalog-seed.js';

describe('controlled service catalog policy', () => {
  it('ships ten capability and ten template records across multiple verticals', () => {
    expect(initialServicePolicyCatalog.capabilities).toHaveLength(10);
    expect(initialServicePolicyCatalog.templates).toHaveLength(10);
    expect(
      new Set(initialServicePolicyCatalog.capabilities.map((item) => item.vertical)).size,
    ).toBeGreaterThanOrEqual(8);
  });

  it('resolves aliases and matches a service template', () => {
    const capability = findCapabilityCatalogItem(
      { name: 'Private Dance Lesson' },
      initialServicePolicyCatalog,
    );
    expect(capability?.id).toBe('capability-dance-teaching');
    expect(
      findServiceOfferingTemplate(
        {
          capabilityCatalogItemId: capability?.id,
          title: '1 对 1 舞蹈私教',
        },
        initialServicePolicyCatalog,
      )?.id,
    ).toBe('template-dance-private-lesson');
  });

  it('resolves an explicit catalog selection even when the creator label is customized', () => {
    const selection = resolveCapabilitySelection(
      {
        catalogItemId: 'capability-commercial-appearance',
        name: 'My commercial appearance practice',
      },
      initialServicePolicyCatalog,
    );
    expect(selection).toMatchObject({
      status: 'active',
      item: { id: 'capability-commercial-appearance' },
    });
  });

  it('auto approves the VS-01 low-risk template', () => {
    const result = evaluateOfferingPolicy({
      catalog: initialServicePolicyCatalog,
      title: '1 对 1 舞蹈私教',
      description: '明确时长和地点的舞蹈教学。',
      requestInstructions: '提供可预约时间。',
      capabilityNames: ['舞蹈教学'],
      capabilityCatalogItemIds: ['capability-dance-teaching'],
      capabilityStatuses: ['active'],
      templateId: 'template-dance-private-lesson',
    });
    expect(result.status).toBe('auto_approved');
    expect(isPolicyPublishable(result.status)).toBe(true);
  });

  it('does not infer a template for a catalog-backed capability', () => {
    const result = evaluateOfferingPolicy({
      catalog: initialServicePolicyCatalog,
      title: '任意标题',
      description: '服务描述',
      requestInstructions: '提交时间',
      capabilityNames: ['舞蹈教学'],
      capabilityCatalogItemIds: ['capability-dance-teaching'],
      capabilityStatuses: ['active'],
    });
    expect(result.status).toBe('rejected');
  });

  it('routes unknown or prohibited content away from public release', () => {
    const unknown = evaluateOfferingPolicy({
      catalog: initialServicePolicyCatalog,
      title: '自定义服务',
      description: '未定义类型',
      requestInstructions: '联系我',
      capabilityNames: ['神秘服务'],
      capabilityStatuses: ['custom_request'],
    });
    expect(unknown.status).toBe('review_required');
    expect(isPolicyPublishable(unknown.status)).toBe(false);

    const prohibited = evaluateOfferingPolicy({
      catalog: initialServicePolicyCatalog,
      title: '私人陪伴',
      description: '陪玩',
      requestInstructions: '私下联系',
      capabilityNames: ['舞蹈教学'],
      capabilityCatalogItemIds: ['capability-dance-teaching'],
      capabilityStatuses: ['active'],
      templateId: 'template-dance-private-lesson',
    });
    expect(prohibited.status).toBe('rejected');

    const mismatched = evaluateOfferingPolicy({
      catalog: initialServicePolicyCatalog,
      title: '1 对 1 舞蹈私教',
      description: '舞蹈教学',
      requestInstructions: '提交时间',
      capabilityNames: ['舞蹈教学'],
      capabilityCatalogItemIds: ['capability-dance-teaching'],
      capabilityStatuses: ['active'],
      templateId: 'template-portrait-session',
    });
    expect(mismatched.status).toBe('rejected');
  });

  it('blocks publishing immediately when a catalog item or template is paused, retired, or disabled', () => {
    const base = {
      title: '1 对 1 舞蹈私教',
      description: '明确时长和地点的舞蹈教学。',
      requestInstructions: '提供可预约时间。',
      capabilityNames: ['舞蹈教学'],
      capabilityCatalogItemIds: ['capability-dance-teaching'],
      capabilityStatuses: ['active' as const],
      templateId: 'template-dance-private-lesson',
    };
    const pausedCapability = {
      ...initialServicePolicyCatalog,
      capabilities: initialServicePolicyCatalog.capabilities.map((item) =>
        item.id === 'capability-dance-teaching' ? { ...item, status: 'paused' as const } : item,
      ),
    };
    expect(evaluateOfferingPolicy({ ...base, catalog: pausedCapability }).status).toBe(
      'review_required',
    );

    const retiredTemplate = {
      ...initialServicePolicyCatalog,
      templates: initialServicePolicyCatalog.templates.map((template) =>
        template.id === 'template-dance-private-lesson'
          ? { ...template, status: 'retired' as const }
          : template,
      ),
    };
    expect(evaluateOfferingPolicy({ ...base, catalog: retiredTemplate }).status).toBe(
      'review_required',
    );

    const emergencyDisabledTemplate = {
      ...initialServicePolicyCatalog,
      templates: initialServicePolicyCatalog.templates.map((template) =>
        template.id === 'template-dance-private-lesson'
          ? { ...template, publishEnabled: false }
          : template,
      ),
    };
    expect(evaluateOfferingPolicy({ ...base, catalog: emergencyDisabledTemplate }).status).toBe(
      'review_required',
    );
  });
});
