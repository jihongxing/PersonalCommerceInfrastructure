import { describe, expect, it } from 'vitest';

import {
  businessCapabilities,
  createFoundationManifest,
} from '../../apps/prototype/src/foundation.js';
import { canonicalEventNames } from '../../modules/product-facts/canonical-events.js';

describe('VS-01 foundation composition', () => {
  it('registers the governed business capability boundaries', () => {
    expect(businessCapabilities).toEqual([
      'creator-commerce-identity',
      'service-offering',
      'distribution',
      'customer-request',
      'commerce-decision',
      'product-facts',
    ]);
  });

  it('exposes the canonical event registry through the composition root', () => {
    expect(createFoundationManifest().canonicalEvents).toBe(canonicalEventNames);
  });
});
