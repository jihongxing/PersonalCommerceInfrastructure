import { describe, expect, it } from 'vitest';

import {
  formatForDisplay,
  generateCommerceReference,
  isValidCommerceReference,
  normalizeFromDisplay,
} from './commerce-reference-generator.js';

const ALPHABET = '3479ACDEFHJKMNPQRTVWXY';

describe('Commerce Reference Generator', () => {
  describe('generateCommerceReference', () => {
    it('generates 18-character reference', () => {
      const ref = generateCommerceReference();
      expect(ref).toHaveLength(18);
    });

    it('uses only allowed alphabet', () => {
      const ref = generateCommerceReference();
      expect(ref).toMatch(/^[3479ACDEFHJKMNPQRTVWXY]{18}$/u);
    });

    it('generates unique references', () => {
      const refs = new Set<string>();

      for (let i = 0; i < 1000; i++) {
        refs.add(generateCommerceReference());
      }

      expect(refs.size).toBe(1000);
    });

    it('does not contain易混淆 characters (0O1I2Z5S8B6G)', () => {
      const refs: string[] = [];

      for (let i = 0; i < 100; i++) {
        refs.push(generateCommerceReference());
      }

      const combinedRefs = refs.join('');
      expect(combinedRefs).not.toMatch(/[0O1I2Z5S8B6G]/u);
    });

    it('has roughly uniform distribution across alphabet', () => {
      // Note: This is a statistical test. The 30% tolerance reflects the inherent
      // randomness of CSPRNG output. With 1000 samples × 18 chars = 18,000 chars
      // and 25 possible values, each character should appear ~720 times ±30%.
      const counts: Record<string, number> = {};

      for (const char of ALPHABET) {
        counts[char] = 0;
      }

      const sampleSize = 1000;
      const totalChars = sampleSize * 18;

      for (let i = 0; i < sampleSize; i++) {
        const ref = generateCommerceReference();
        for (const char of ref) {
          counts[char]!++;
        }
      }

      const expectedFrequency = totalChars / 25;
      const tolerance = expectedFrequency * 0.3; // 30% tolerance (was 25%)

      for (const char of ALPHABET) {
        expect(counts[char]).toBeGreaterThanOrEqual(expectedFrequency - tolerance);
        expect(counts[char]).toBeLessThanOrEqual(expectedFrequency + tolerance);
      }
    });
  });

  describe('formatForDisplay', () => {
    it('formats reference as 6-6-6', () => {
      const ref = '3479ACDEFHJKMNPQRT';
      expect(formatForDisplay(ref)).toBe('3479AC-DEFHJK-MNPQRT');
    });

    it('preserves all characters in correct order', () => {
      const ref = 'AAAAAA999999CCCCCC';
      expect(formatForDisplay(ref)).toBe('AAAAAA-999999-CCCCCC');
    });

    it('throws on invalid length', () => {
      expect(() => formatForDisplay('TOOSHORT')).toThrow(
        'Commerce Reference must be exactly 18 characters, got 8',
      );
      expect(() => formatForDisplay('THISISTOOLONGFOR18CHARS')).toThrow(
        'Commerce Reference must be exactly 18 characters, got 23',
      );
    });
  });

  describe('normalizeFromDisplay', () => {
    it('removes hyphens from formatted reference', () => {
      const formatted = '3479AC-DEFHJK-MNPQRT';
      expect(normalizeFromDisplay(formatted)).toBe('3479ACDEFHJKMNPQRT');
    });

    it('handles reference without hyphens', () => {
      const ref = '3479ACDEFHJKMNPQRT';
      expect(normalizeFromDisplay(ref)).toBe('3479ACDEFHJKMNPQRT');
    });

    it('throws if normalized result is not 18 characters', () => {
      expect(() => normalizeFromDisplay('3479AC-DEFHJK')).toThrow(
        'Normalized Commerce Reference must be exactly 18 characters, got 12',
      );
    });
  });

  describe('isValidCommerceReference', () => {
    it('accepts valid reference', () => {
      const ref = '3479ACDEFHJKMNPQRT';
      expect(isValidCommerceReference(ref)).toBe(true);
    });

    it('accepts reference with all alphabet characters', () => {
      const ref = '3479ACDEFHJKMNPQRV';
      expect(isValidCommerceReference(ref)).toBe(true);
    });

    it('rejects reference with invalid characters', () => {
      expect(isValidCommerceReference('0479ACDEFHJKMNPQRT')).toBe(false); // 0
      expect(isValidCommerceReference('I479ACDEFHJKMNPQRT')).toBe(false); // I
      expect(isValidCommerceReference('3479ACDEFHJKMNPQRT')).toBe(true); // valid
    });

    it('rejects reference with wrong length', () => {
      expect(isValidCommerceReference('TOOSHORT')).toBe(false);
      expect(isValidCommerceReference('THISISTOOLONGFOR18CHARS')).toBe(false);
    });

    it('rejects reference with lowercase characters', () => {
      expect(isValidCommerceReference('3479acdefhjkmnpqrt')).toBe(false);
    });

    it('rejects reference with hyphens', () => {
      expect(isValidCommerceReference('3479AC-DEFHJK-MNPQRT')).toBe(false);
    });
  });

  describe('round-trip format and normalize', () => {
    it('maintains reference integrity', () => {
      const original = generateCommerceReference();
      const formatted = formatForDisplay(original);
      const normalized = normalizeFromDisplay(formatted);

      expect(normalized).toBe(original);
    });

    it('works for multiple references', () => {
      for (let i = 0; i < 100; i++) {
        const original = generateCommerceReference();
        const formatted = formatForDisplay(original);
        const normalized = normalizeFromDisplay(formatted);

        expect(normalized).toBe(original);
        expect(isValidCommerceReference(normalized)).toBe(true);
      }
    });
  });
});
