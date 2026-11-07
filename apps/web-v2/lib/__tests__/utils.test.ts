import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn() utility', () => {
  it('should merge classNames correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('should handle conditional classes', () => {
    expect(cn('px-2', true && 'py-1', false && 'hidden')).toBe('px-2 py-1');
  });

  it('should resolve Tailwind conflicts', () => {
    // tailwind-merge should resolve this
    const result = cn('px-2', 'px-4');
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
  });

  it('should handle undefined and null', () => {
    expect(cn('px-2', undefined, null, 'py-1')).toBe('px-2 py-1');
  });
});
