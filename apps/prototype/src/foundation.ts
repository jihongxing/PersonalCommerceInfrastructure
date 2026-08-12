import { canonicalEventNames } from '../../../modules/product-facts/canonical-events.js';

export const businessCapabilities = [
  'creator-commerce-identity',
  'service-offering',
  'distribution',
  'customer-request',
  'commerce-decision',
  'product-facts',
] as const;

export interface FoundationManifest {
  readonly application: 'vs-01-controlled-prototype';
  readonly businessCapabilities: typeof businessCapabilities;
  readonly canonicalEvents: typeof canonicalEventNames;
}

export function createFoundationManifest(): FoundationManifest {
  return {
    application: 'vs-01-controlled-prototype',
    businessCapabilities,
    canonicalEvents: canonicalEventNames,
  };
}
