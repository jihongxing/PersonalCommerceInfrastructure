import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Webhook signature verifier interface.
 * 
 * Implementations must use timing-safe comparison to prevent timing attacks.
 */
export interface WebhookSignatureVerifier {
  /**
   * Verifies a webhook signature.
   * 
   * @param timestamp - The timestamp from the webhook header
   * @param nonce - The nonce from the webhook header
   * @param body - The raw request body as string
   * @param signature - The signature from the webhook header
   * @returns True if the signature is valid, false otherwise
   */
  verify(
    timestamp: string,
    nonce: string,
    body: string,
    signature: string,
  ): boolean;
}

/**
 * Creates a WeChat Pay-compatible webhook signature verifier.
 * 
 * Signature format: HMAC-SHA256(timestamp + nonce + body + \n, apiKey)
 * 
 * @param apiKey - The API key/secret for signature verification
 * @returns A WebhookSignatureVerifier instance
 * 
 * @example
 * ```typescript
 * const verifier = createWechatPaySignatureVerifier(process.env.WECHAT_API_KEY);
 * 
 * const isValid = verifier.verify(
 *   request.headers['x-timestamp'],
 *   request.headers['x-nonce'],
 *   JSON.stringify(request.body),
 *   request.headers['x-signature'],
 * );
 * ```
 */
export function createWechatPaySignatureVerifier(
  apiKey: string,
): WebhookSignatureVerifier {
  if (!apiKey || apiKey.length === 0) {
    throw new TypeError('API key must be non-empty');
  }

  return {
    verify(timestamp, nonce, body, signature) {
      if (!timestamp || !nonce || !body || !signature) {
        return false;
      }

      const message = `${timestamp}\n${nonce}\n${body}\n`;
      const expectedSignature = createHmac('sha256', apiKey)
        .update(message)
        .digest('base64');

      try {
        return timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature),
        );
      } catch {
        // timingSafeEqual throws if buffers have different lengths
        return false;
      }
    },
  };
}

/**
 * Creates a generic HMAC-SHA256 webhook signature verifier.
 * 
 * This is a more flexible verifier that can be adapted to different webhook formats.
 * 
 * @param secret - The shared secret for signature verification
 * @param buildMessage - A function that builds the message to be signed
 * @returns A WebhookSignatureVerifier instance
 * 
 * @example
 * ```typescript
 * const verifier = createGenericHmacVerifier(
 *   process.env.WEBHOOK_SECRET,
 *   (timestamp, nonce, body) => `${timestamp}:${nonce}:${body}`,
 * );
 * ```
 */
export function createGenericHmacVerifier(
  secret: string,
  buildMessage: (timestamp: string, nonce: string, body: string) => string,
): WebhookSignatureVerifier {
  if (!secret || secret.length === 0) {
    throw new TypeError('Secret must be non-empty');
  }

  return {
    verify(timestamp, nonce, body, signature) {
      if (!timestamp || !nonce || !body || !signature) {
        return false;
      }

      const message = buildMessage(timestamp, nonce, body);
      const expectedSignature = createHmac('sha256', secret)
        .update(message)
        .digest('hex');

      try {
        return timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature),
        );
      } catch {
        return false;
      }
    },
  };
}
