import { randomInt } from 'node:crypto';

import {
  COMMERCE_REFERENCE_ALPHABET,
  COMMERCE_REFERENCE_LENGTH,
  createCommerceReference,
} from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import type { CommerceReference } from '../../modules/identity-infrastructure/identity-contract.js';

export interface CommerceReferenceGenerator {
  generate(): CommerceReference;
}

export class CsprngCommerceReferenceGenerator implements CommerceReferenceGenerator {
  public constructor(
    private readonly randomInteger: (minimum: number, maximum: number) => number = randomInt,
  ) {}

  public generate(): CommerceReference {
    let candidate = '';
    for (let index = 0; index < COMMERCE_REFERENCE_LENGTH; index += 1) {
      candidate +=
        COMMERCE_REFERENCE_ALPHABET[
          this.randomInteger(0, COMMERCE_REFERENCE_ALPHABET.length)
        ] ?? '';
    }
    return createCommerceReference(candidate);
  }
}
