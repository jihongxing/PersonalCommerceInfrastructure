import { randomBytes } from 'node:crypto';

const ALPHABET = '3479ACDEFHJKMNPQRTVWXY';
const ALPHABET_SIZE = ALPHABET.length; // 25
const REFERENCE_LENGTH = 18;

/**
 * Generates a cryptographically secure Commerce Reference (C号).
 *
 * @returns An 18-character uppercase string using the canonical alphabet.
 *
 * @example
 * ```typescript
 * const ref = generateCommerceReference();
 * // => "3479ACDEFHJKMNPQRT"
 * ```
 */
export function generateCommerceReference(): string {
  const buffer = randomBytes(REFERENCE_LENGTH);
  let ref = '';

  for (let i = 0; i < REFERENCE_LENGTH; i++) {
    const index = buffer[i]! % ALPHABET_SIZE;
    ref += ALPHABET[index];
  }

  return ref;
}

/**
 * Formats a Commerce Reference for display with 6-6-6 grouping.
 *
 * @param ref - The canonical 18-character Commerce Reference.
 * @returns Formatted reference with hyphens (e.g., "3479AC-DEFHJK-MNPQRT").
 *
 * @throws {TypeError} If the reference is not exactly 18 characters.
 */
export function formatForDisplay(ref: string): string {
  if (ref.length !== REFERENCE_LENGTH) {
    throw new TypeError(
      `Commerce Reference must be exactly ${REFERENCE_LENGTH} characters, got ${ref.length}`,
    );
  }

  return `${ref.slice(0, 6)}-${ref.slice(6, 12)}-${ref.slice(12, 18)}`;
}

/**
 * Normalizes a formatted Commerce Reference by removing hyphens.
 *
 * @param formatted - The formatted reference (e.g., "3479AC-DEFHJK-MNPQRT").
 * @returns The canonical reference without hyphens (e.g., "3479ACDEFHJKMNPQRT").
 *
 * @throws {TypeError} If the normalized result is not exactly 18 characters.
 */
export function normalizeFromDisplay(formatted: string): string {
  const normalized = formatted.replace(/-/g, '');

  if (normalized.length !== REFERENCE_LENGTH) {
    throw new TypeError(
      `Normalized Commerce Reference must be exactly ${REFERENCE_LENGTH} characters, got ${normalized.length}`,
    );
  }

  return normalized;
}

/**
 * Validates a Commerce Reference against the canonical alphabet.
 *
 * @param ref - The reference to validate.
 * @returns True if the reference is valid, false otherwise.
 */
export function isValidCommerceReference(ref: string): boolean {
  if (ref.length !== REFERENCE_LENGTH) {
    return false;
  }

  const pattern = new RegExp(`^[${ALPHABET}]{${REFERENCE_LENGTH}}$`, 'u');
  return pattern.test(ref);
}
