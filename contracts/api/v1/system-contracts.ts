import { Type } from 'typebox';

export const ApiVersion = 'v1' as const;
export const ApiBasePath = `/api/${ApiVersion}` as const;
export const ApiServiceName = 'vs-01-api' as const;

export const ApplicationErrorCategorySchema = Type.Union([
  Type.Literal('validation'),
  Type.Literal('authentication'),
  Type.Literal('authorization'),
  Type.Literal('not_found'),
  Type.Literal('conflict'),
  Type.Literal('unavailable'),
  Type.Literal('internal'),
]);

export const ApiErrorEnvelopeSchema = Type.Object(
  {
    error: Type.Object(
      {
        category: ApplicationErrorCategorySchema,
        code: Type.String({ minLength: 1 }),
        correlationId: Type.String({ minLength: 1 }),
        message: Type.String({ minLength: 1 }),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const HealthResponseSchema = Type.Object(
  {
    service: Type.Literal(ApiServiceName),
    status: Type.Literal('ok'),
    version: Type.Literal(ApiVersion),
  },
  { additionalProperties: false },
);

export const ReadinessResponseSchema = Type.Object(
  {
    service: Type.Literal(ApiServiceName),
    status: Type.Literal('ready'),
    version: Type.Literal(ApiVersion),
  },
  { additionalProperties: false },
);
