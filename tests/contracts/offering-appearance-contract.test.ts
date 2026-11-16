import { Value } from 'typebox/value';
import { describe, expect, it } from 'vitest';
import {
  CreateServiceOfferingRequestSchema,
  UpdateServiceOfferingRequestSchema,
  ServiceOfferingResponseSchema,
} from '../../contracts/api/v1/service-offering-contracts.js';
import { PublicOfferingResponseSchema } from '../../contracts/api/v1/customer-request-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../contracts/api/v1/system-contracts.js';

const appearance = {
  appearanceType: 'guest',
  startsOn: '2026-11-20',
  locationDescription: 'Venue',
  buyerType: 'organizer',
  requestCallToAction: 'Submit request',
};
const input = {
  capabilityIds: ['capability-1'],
  title: 'Activity',
  description: 'Details',
  requestInstructions: 'Contact us',
};
describe('Scoped Appearance contracts', () => {
  it('keeps Appearance optional on create/update and upcomingTitle optional inside a complete object', () => {
    for (const schema of [CreateServiceOfferingRequestSchema, UpdateServiceOfferingRequestSchema]) {
      expect(Value.Check(schema, input)).toBe(true);
      expect(Value.Check(schema, { ...input, appearance })).toBe(true);
      expect(
        Value.Check(schema, {
          ...input,
          appearance: { ...appearance, upcomingTitle: 'Existing title' },
        }),
      ).toBe(true);
      for (const value of [
        null,
        {},
        { ...appearance, upcomingTitle: '' },
        { ...appearance, currency: 'CNY' },
        { ...appearance, priceRangeMin: 1 },
        { ...appearance, priceRangeMax: 2 },
      ]) {
        expect(Value.Check(schema, { ...input, appearance: value })).toBe(false);
      }
      for (const key of [
        'appearanceType',
        'startsOn',
        'locationDescription',
        'buyerType',
        'requestCallToAction',
      ]) {
        const partial = { ...appearance };
        Reflect.deleteProperty(partial, key);
        expect(Value.Check(schema, { ...input, appearance: partial })).toBe(false);
      }
    }
  });

  it('accepts creator and public response objects both with and without upcomingTitle', () => {
    for (const metadata of [appearance, { ...appearance, upcomingTitle: 'Historical title' }]) {
      expect(
        Value.Check(ServiceOfferingResponseSchema, {
          ...input,
          id: 'offering-1',
          creatorId: 'creator-1',
          state: 'draft',
          policyStatus: 'review_required',
          missingPublishConditions: [],
          appearance: metadata,
        }),
      ).toBe(true);
      expect(
        Value.Check(PublicOfferingResponseSchema, {
          creator: { displayName: 'Creator', bio: 'Details', capabilityNames: ['Appearance'] },
          offering: {
            id: 'offering-1',
            title: input.title,
            description: input.description,
            availabilityDescription: 'By request',
            requestInstructions: input.requestInstructions,
            appearance: metadata,
          },
        }),
      ).toBe(true);
    }
  });

  it('represents date-range rejection with the stable API validation envelope', () => {
    expect(
      Value.Check(ApiErrorEnvelopeSchema, {
        error: {
          category: 'validation',
          code: 'service_offering_appearance_date_range_invalid',
          correlationId: 'appearance-range',
          message: 'Appearance end date cannot be before its start date.',
        },
      }),
    ).toBe(true);
  });
});
