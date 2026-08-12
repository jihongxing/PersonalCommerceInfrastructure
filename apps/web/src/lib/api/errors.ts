export interface ApiErrorDetails {
  readonly category: string;
  readonly code: string;
  readonly correlationId: string;
  readonly message: string;
}

export class WebApiError extends Error {
  public readonly category: string;
  public readonly code: string;
  public readonly correlationId: string;
  public readonly status: number;

  public constructor(status: number, details: ApiErrorDetails) {
    super(details.message);
    this.name = 'WebApiError';
    this.status = status;
    this.category = details.category;
    this.code = details.code;
    this.correlationId = details.correlationId;
  }
}

export async function errorFromResponse(response: Response): Promise<WebApiError> {
  const body: unknown = await response.json().catch(() => undefined);

  if (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'object' &&
    body.error !== null
  ) {
    const error = body.error as Record<string, unknown>;

    if (
      typeof error.category === 'string' &&
      typeof error.code === 'string' &&
      typeof error.correlationId === 'string' &&
      typeof error.message === 'string'
    ) {
      return new WebApiError(response.status, {
        category: error.category,
        code: error.code,
        correlationId: error.correlationId,
        message: error.message,
      });
    }
  }

  return new WebApiError(response.status, {
    category: 'internal',
    code: 'invalid_api_error_response',
    correlationId: response.headers.get('x-correlation-id') ?? 'unknown',
    message: 'The API request could not be completed.',
  });
}
