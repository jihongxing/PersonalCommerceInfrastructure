import { describe, expect, it } from 'vitest';

import {
  COMMERCE_REFERENCE_ALPHABET,
  COMMERCE_REFERENCE_LENGTH,
} from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import { CsprngCommerceReferenceGenerator } from '../../applications/canonical-commerce-reference/commerce-reference-generator.js';

describe('Commerce Reference generator', () => {
  it('generates canonical uppercase references from the exact alphabet', () => {
    const reference = new CsprngCommerceReferenceGenerator().generate();

    expect(reference).toHaveLength(COMMERCE_REFERENCE_LENGTH);
    expect(reference).toMatch(new RegExp(`^[${COMMERCE_REFERENCE_ALPHABET}]+$`));
    expect(reference).toBe(reference.toUpperCase());
    expect(reference).not.toContain('-');
  });

  it('supports deterministic dependency injection for collision and failure tests', () => {
    const randomInteger = (minimum: number, maximum: number): number => {
      expect(minimum).toBe(0);
      expect(maximum).toBe(COMMERCE_REFERENCE_ALPHABET.length);
      return 0;
    };

    expect(new CsprngCommerceReferenceGenerator(randomInteger).generate()).toBe(
      COMMERCE_REFERENCE_ALPHABET[0]!.repeat(COMMERCE_REFERENCE_LENGTH),
    );
  });
});
