import { Type } from 'typebox';

const RiskTierSchema = Type.Union([
  Type.Literal('low'),
  Type.Literal('review'),
  Type.Literal('prohibited'),
]);

const ReleaseScopeSchema = Type.Union([
  Type.Literal('vs01'),
  Type.Literal('established'),
  Type.Literal('future'),
]);

const CatalogStatusSchema = Type.Union([
  Type.Literal('draft'),
  Type.Literal('active'),
  Type.Literal('paused'),
  Type.Literal('retired'),
]);

export const CapabilityCatalogItemSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    slug: Type.String({ minLength: 1 }),
    vertical: Type.String({ minLength: 1 }),
    name: Type.String({ minLength: 1 }),
    description: Type.String({ minLength: 1 }),
    aliases: Type.Optional(Type.Array(Type.String())),
    riskTier: RiskTierSchema,
    releaseScope: ReleaseScopeSchema,
    version: Type.String({ minLength: 1 }),
    status: CatalogStatusSchema,
    creatorSelectable: Type.Optional(Type.Boolean()),
    publishEnabled: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

export const ServiceOfferingTemplateSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    slug: Type.String({ minLength: 1 }),
    capabilityCatalogItemId: Type.String({ minLength: 1 }),
    name: Type.String({ minLength: 1 }),
    description: Type.String({ minLength: 1 }),
    riskTier: RiskTierSchema,
    releaseScope: ReleaseScopeSchema,
    requiredFields: Type.Array(Type.String({ minLength: 1 })),
    version: Type.String({ minLength: 1 }),
    status: CatalogStatusSchema,
    creatorSelectable: Type.Optional(Type.Boolean()),
    publishEnabled: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

const PolicyRiskTierSchema = Type.Union([
  Type.Literal('low'),
  Type.Literal('review'),
  Type.Literal('prohibited'),
]);

export const ServicePolicyAdminUpdateSchema = Type.Object(
  {
    status: Type.Optional(CatalogStatusSchema),
    creatorSelectable: Type.Optional(Type.Boolean()),
    publishEnabled: Type.Optional(Type.Boolean()),
    riskTier: Type.Optional(PolicyRiskTierSchema),
    reason: Type.String({ minLength: 1, maxLength: 1_024 }),
  },
  { additionalProperties: false },
);

export const ServicePolicyPublishVersionSchema = Type.Object(
  {
    version: Type.String({ minLength: 1, maxLength: 32 }),
    reason: Type.String({ minLength: 1, maxLength: 1_024 }),
  },
  { additionalProperties: false },
);

export const ServicePolicyAuditSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    actorId: Type.String({ minLength: 1 }),
    actorCategory: Type.Optional(
      Type.Union([
        Type.Literal('human_operations'),
        Type.Literal('provider_service'),
        Type.Literal('platform_system'),
        Type.Literal('unknown'),
      ]),
    ),
    entityType: Type.Union([
      Type.Literal('capability'),
      Type.Literal('template'),
      Type.Literal('release'),
    ]),
    entityId: Type.String({ minLength: 1 }),
    action: Type.Union([Type.Literal('updated'), Type.Literal('published')]),
    before: Type.Record(Type.String(), Type.Unknown()),
    after: Type.Record(Type.String(), Type.Unknown()),
    reason: Type.String(),
    policyVersion: Type.String({ minLength: 1 }),
    occurredAt: Type.String({ minLength: 1 }),
    correlationId: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export const ServicePolicyAdminWorkspaceSchema = Type.Object(
  {
    capabilities: Type.Array(CapabilityCatalogItemSchema),
    templates: Type.Array(ServiceOfferingTemplateSchema),
    policyVersion: Type.String({ minLength: 1 }),
    audit: Type.Array(ServicePolicyAuditSchema),
  },
  { additionalProperties: false },
);

export const ServiceCatalogResponseSchema = Type.Object(
  {
    capabilities: Type.Array(CapabilityCatalogItemSchema),
    templates: Type.Array(ServiceOfferingTemplateSchema),
    policyVersion: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

const CatalogReadKindSchema = Type.Union([Type.Literal('capabilities'), Type.Literal('templates')]);

const PageSchema = Type.Object({
  page: Type.Integer({ minimum: 1 }),
  pageSize: Type.Integer({ minimum: 1, maximum: 100 }),
  total: Type.Integer({ minimum: 0 }),
});

export const OperationsCatalogReadResponseSchema = Type.Intersect([
  PageSchema,
  Type.Object({
    policyVersion: Type.String({ minLength: 1 }),
    kind: CatalogReadKindSchema,
    items: Type.Array(Type.Union([CapabilityCatalogItemSchema, ServiceOfferingTemplateSchema])),
  }),
]);

export const OperationsCatalogDetailResponseSchema = Type.Union([
  CapabilityCatalogItemSchema,
  ServiceOfferingTemplateSchema,
]);

export const OperationsAuditReadResponseSchema = Type.Intersect([
  PageSchema,
  Type.Object({ items: Type.Array(ServicePolicyAuditSchema) }),
]);

export const OperationsAuditDetailResponseSchema = ServicePolicyAuditSchema;
