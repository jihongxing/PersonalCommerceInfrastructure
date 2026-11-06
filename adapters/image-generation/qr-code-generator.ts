/**
 * QR Code Generator Adapter
 * 
 * Generates QR codes for fulfillment codes
 */

import QRCode from 'qrcode';

export interface IQrCodeGenerator {
  /**
   * Generate QR code as data URL (base64 PNG)
   */
  generateDataUrl(text: string): Promise<string>;

  /**
   * Generate QR code as Buffer (PNG)
   */
  generateBuffer(text: string): Promise<Buffer>;
}

export class QrCodeGeneratorImpl implements IQrCodeGenerator {
  async generateDataUrl(text: string): Promise<string> {
    return QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  }

  async generateBuffer(text: string): Promise<Buffer> {
    return QRCode.toBuffer(text, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  }
}
