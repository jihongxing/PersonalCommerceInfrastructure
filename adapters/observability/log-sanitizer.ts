/**
 * Sensitive query parameters that should be redacted in logs.
 * 
 * These parameters often contain authentication tokens, PII, or secrets.
 */
const SENSITIVE_QUERY_PARAMS = [
  'token',
  'password',
  'email',
  'phone',
  'idcard',
  'id_card',
  'secret',
  'key',
  'credential',
  'authorization',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'session',
  'ssn',
  'social_security',
] as const;

/**
 * Sensitive body fields that should be redacted in logs.
 * 
 * These fields often contain passwords, PII, or payment information.
 */
const SENSITIVE_BODY_FIELDS = [
  'password',
  'oldpassword',
  'newpassword',
  'secret',
  'privatekey',
  'apikey',
  'api_key',
  'idnumber',
  'id_number',
  'passportnumber',
  'passport_number',
  'creditcardnumber',
  'credit_card_number',
  'cardnumber',
  'card_number',
  'cvv',
  'cvc',
  'pin',
  'ssn',
  'social_security_number',
] as const;

/**
 * Sanitizes a URL path by redacting sensitive query parameters.
 * 
 * @param path - The URL path (with or without query string)
 * @returns The sanitized path with sensitive parameters redacted
 * 
 * @example
 * ```typescript
 * sanitizePath('/api/auth?token=secret123&email=user@example.com')
 * // => '/api/auth?token=***&email=***'
 * ```
 */
export function sanitizePath(path: string): string {
  if (!path) {
    return path;
  }

  try {
    // 尝试解析为完整 URL
    const url = new URL(path, 'http://localhost');

    for (const param of SENSITIVE_QUERY_PARAMS) {
      // 检查所有参数（不区分大小写）
      for (const [key] of url.searchParams) {
        if (key.toLowerCase() === param) {
          url.searchParams.set(key, '***');
        }
      }
    }

    return url.pathname + url.search;
  } catch {
    // 如果不是有效 URL，使用正则替换
    let sanitized = path;

    for (const param of SENSITIVE_QUERY_PARAMS) {
      const pattern = new RegExp(
        `([?&]${param}=)[^&]*`,
        'giu',
      );
      sanitized = sanitized.replace(pattern, '$1***');
    }

    return sanitized;
  }
}

/**
 * Sanitizes a request body by redacting sensitive fields.
 * 
 * This function recursively traverses objects and arrays to find and redact
 * sensitive fields at any depth.
 * 
 * @param body - The request body (plain object, array, or primitive)
 * @returns A new object with sensitive fields redacted
 * 
 * @example
 * ```typescript
 * sanitizeBody({
 *   username: 'john',
 *   password: 'secret123',
 *   profile: { idNumber: '123456' }
 * })
 * // => {
 * //   username: 'john',
 * //   password: '***',
 * //   profile: { idNumber: '***' }
 * // }
 * ```
 */
export function sanitizeBody(body: unknown): unknown {
  if (body === null || body === undefined) {
    return body;
  }

  if (Array.isArray(body)) {
    return body.map((item) => sanitizeBody(item));
  }

  if (typeof body !== 'object') {
    return body;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');

    if (SENSITIVE_BODY_FIELDS.some((field) => normalizedKey === field.replace(/[_-]/g, ''))) {
      sanitized[key] = '***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitizes HTTP headers by redacting sensitive values.
 * 
 * @param headers - HTTP headers object
 * @returns A new headers object with sensitive values redacted
 * 
 * @example
 * ```typescript
 * sanitizeHeaders({
 *   'authorization': 'Bearer token123',
 *   'content-type': 'application/json'
 * })
 * // => {
 * //   'authorization': '***',
 * //   'content-type': 'application/json'
 * // }
 * ```
 */
export function sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token',
    'x-refresh-token',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(headers)) {
    const normalizedKey = key.toLowerCase();

    if (sensitiveHeaders.includes(normalizedKey)) {
      sanitized[key] = '***';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
