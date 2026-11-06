/**
 * QR Code Generator Tests
 */

import { describe, it, expect } from 'vitest';
import { QrCodeGeneratorImpl } from '../adapters/image-generation/qr-code-generator.js';

describe('QrCodeGenerator', () => {
  const generator = new QrCodeGeneratorImpl();

  it('generates data URL for fulfillment code', async () => {
    const code = 'FC-ABCD1234';
    const dataUrl = await generator.generateDataUrl(code);

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(dataUrl.length).toBeGreaterThan(100);
  });

  it('generates buffer for fulfillment code', async () => {
    const code = 'FC-XYZ56789';
    const buffer = await generator.generateBuffer(code);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    // PNG signature: 89 50 4E 47
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);
  });

  it('generates consistent output for same input', async () => {
    const code = 'FC-TEST9999';
    const dataUrl1 = await generator.generateDataUrl(code);
    const dataUrl2 = await generator.generateDataUrl(code);

    expect(dataUrl1).toBe(dataUrl2);
  });

  it('generates different output for different input', async () => {
    const code1 = 'FC-AAAA1111';
    const code2 = 'FC-BBBB2222';
    const dataUrl1 = await generator.generateDataUrl(code1);
    const dataUrl2 = await generator.generateDataUrl(code2);

    expect(dataUrl1).not.toBe(dataUrl2);
  });
});
