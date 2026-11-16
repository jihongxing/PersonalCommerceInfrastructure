import { describe, expect, it } from 'vitest';
import { AppearanceFormSchema, supportsAppearance } from './service-offering-appearance';
describe('Appearance scope and contract', () => {
  it('requires the exact confirmed template and capability mapping', () => {
    expect(
      supportsAppearance('template-commercial-appearance', [
        {
          id: 'template-commercial-appearance',
          capabilityCatalogItemId: 'capability-commercial-appearance',
        },
      ]),
    ).toBe(true);
    expect(
      supportsAppearance('template-commercial-appearance', [
        {
          id: 'template-commercial-appearance',
          capabilityCatalogItemId: 'capability-portrait-photography',
        },
      ]),
    ).toBe(false);
    expect(
      supportsAppearance('template-portrait-session', [
        {
          id: 'template-portrait-session',
          capabilityCatalogItemId: 'capability-portrait-photography',
        },
      ]),
    ).toBe(false);
    expect(supportsAppearance('template-commercial-appearance', undefined)).toBe(false);
  });
  it('rejects impossible dates and pseudoprice fields while allowing an omitted title', () => {
    const input = {
      appearanceType: 'guest',
      startsOn: '2026-11-20',
      locationDescription: '地点',
      buyerType: 'organizer',
      requestCallToAction: '提交请求',
    };
    expect(AppearanceFormSchema.safeParse(input).success).toBe(true);
    expect(AppearanceFormSchema.safeParse({ ...input, startsOn: '2026-02-30' }).success).toBe(
      false,
    );
    for (const field of ['currency', 'priceRangeMin', 'priceRangeMax'])
      expect(AppearanceFormSchema.safeParse({ ...input, [field]: 1 }).success).toBe(false);
  });
});
