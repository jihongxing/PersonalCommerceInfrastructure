import { createCommerceReference } from '../identity-infrastructure/commerce-reference-contract.js';
import type { CommerceReference } from '../identity-infrastructure/identity-contract.js';

export type HomepageState = 'UNPUBLISHED' | 'PUBLISHED' | 'PAUSED';
export type HomepageAction = 'publish' | 'pause';

export function normalizePublicCommerceReference(input: string): CommerceReference {
  const trimmed = input.trim().toUpperCase();
  if (
    !/^(?:[3479ACDEFHJKMNPQRTVWXY]{18}|[3479ACDEFHJKMNPQRTVWXY]{6}(?:-[3479ACDEFHJKMNPQRTVWXY]{6}){2})$/u.test(
      trimmed,
    )
  ) {
    throw new TypeError('Invalid Commerce Reference format.');
  }
  return createCommerceReference(trimmed.replaceAll('-', ''));
}

export function transitionHomepage(state: HomepageState, action: HomepageAction): HomepageState {
  if (action === 'publish') return 'PUBLISHED';
  if (state === 'UNPUBLISHED') throw new Error('An unpublished homepage cannot be paused.');
  return 'PAUSED';
}
