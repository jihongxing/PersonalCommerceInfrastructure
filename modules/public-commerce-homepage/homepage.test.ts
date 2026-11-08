import { describe, expect, it } from 'vitest';
import { normalizePublicCommerceReference, transitionHomepage } from './homepage.js';

describe('public commerce reference', () => {
  it('normalizes canonical and displayed references without correcting their characters', () => {
    const expected = '3C7M4Q9RDFHJKNTWVY';
    expect(normalizePublicCommerceReference(' 3c7m4q-9rdfhj-kntwvy ')).toBe(expected);
    expect(normalizePublicCommerceReference(expected)).toBe(expected);
  });

  it.each([
    '3C7M4Q-9RDFHJKNTWVY',
    '3C7M4Q--9RDFHJ-KNTWVY',
    '3C7M4Q 9RDFHJ KNTWVY',
    '3C7M4Q-9RDFHJ-KNTWVO',
    '',
  ])('rejects invalid input %s', (value) => {
    expect(() => normalizePublicCommerceReference(value)).toThrow(TypeError);
  });
});

describe('homepage publication', () => {
  it('publishes, pauses and resumes independently of offerings', () => {
    expect(transitionHomepage('UNPUBLISHED', 'publish')).toBe('PUBLISHED');
    expect(transitionHomepage('PUBLISHED', 'pause')).toBe('PAUSED');
    expect(transitionHomepage('PAUSED', 'publish')).toBe('PUBLISHED');
  });

  it('keeps repeat commands idempotent and rejects pausing before publication', () => {
    expect(transitionHomepage('PUBLISHED', 'publish')).toBe('PUBLISHED');
    expect(transitionHomepage('PAUSED', 'pause')).toBe('PAUSED');
    expect(() => transitionHomepage('UNPUBLISHED', 'pause')).toThrow();
  });
});
