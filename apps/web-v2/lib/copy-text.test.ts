import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from './copy-text';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('copyText', () => {
  it('uses the selection fallback when the clipboard API is unavailable', async () => {
    vi.stubGlobal('navigator', {});
    const copy = vi.fn(() => {
      const field = document.activeElement as HTMLTextAreaElement;
      expect(field.value).toBe('C-123');
      expect(field.selectionStart).toBe(0);
      expect(field.selectionEnd).toBe(5);
      return true;
    });
    Object.defineProperty(document, 'execCommand', { configurable: true, value: copy });
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    expect(await copyText('C-123')).toBe(true);
    expect(copy).toHaveBeenCalledWith('copy');
    expect(document.activeElement).toBe(button);
    expect(document.querySelector('textarea')).toBeNull();
    button.remove();
  });

  it('reports failure when both copy methods fail', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error()) },
    });
    Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false });
    expect(await copyText('value')).toBe(false);
  });
});
