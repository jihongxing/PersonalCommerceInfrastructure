export type ApplicationErrorCategory =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'conflict'
  | 'unavailable'
  | 'internal';

export interface ApplicationErrorDetails {
  readonly category: ApplicationErrorCategory;
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
}

export class ApplicationError extends Error {
  public readonly category: ApplicationErrorCategory;
  public readonly code: string;

  public constructor(details: ApplicationErrorDetails) {
    super(details.message, { cause: details.cause });
    this.name = 'ApplicationError';
    this.category = details.category;
    this.code = details.code;
  }
}
