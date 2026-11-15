import { Type } from 'typebox';

// PCI-ENG-018-F, additive read DTOs for existing FR-005-FR-053 projections.
const SearchItemSchema = Type.Object(
  {
    kind: Type.Union(
      ['capabilities', 'templates', 'offering', 'request', 'audit'].map((value) =>
        Type.Literal(value),
      ),
    ),
    id: Type.String(),
    name: Type.String(),
    state: Type.String(),
    relatedId: Type.Optional(Type.String()),
    updatedAt: Type.Optional(Type.String()),
    occurredAt: Type.Optional(Type.String()),
    actorId: Type.Optional(Type.String()),
    actorCategory: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);
export const OperationsSearchResponseSchema = Type.Object({
  items: Type.Array(SearchItemSchema),
  total: Type.Integer({ minimum: 0 }),
  page: Type.Integer({ minimum: 1 }),
  pageSize: Type.Integer({ minimum: 1, maximum: 100 }),
});
const SummarySchema = Type.Object({
  total: Type.Integer({ minimum: 0 }),
  states: Type.Record(Type.String(), Type.Integer({ minimum: 0 })),
  source: Type.String(),
  scope: Type.String(),
  exact: Type.Literal(true),
  policyVersion: Type.Optional(Type.String()),
});
export const OperationsOverviewResponseSchema = Type.Object({
  queriedAt: Type.String(),
  consistency: Type.Literal('repeatable_read_snapshot'),
  modules: Type.Object({
    catalog: Type.Optional(SummarySchema),
    offering: Type.Optional(SummarySchema),
    request: Type.Optional(SummarySchema),
    audit: Type.Optional(SummarySchema),
  }),
  recentActivity: Type.Optional(Type.Array(SearchItemSchema)),
});

const ExceptionRuleSchema = Type.Object({
  id: Type.String(),
  classification: Type.Union([Type.Literal('confirmed_fact'), Type.Literal('needs_review')]),
  source: Type.Union([Type.Literal('offering'), Type.Literal('request'), Type.Literal('audit')]),
  requiredModules: Type.Array(Type.String()),
  title: Type.String(),
  condition: Type.String(),
  evidenceFields: Type.String(),
  relationship: Type.String(),
  exclusions: Type.String(),
});
const ExceptionSignalSchema = Type.Object({
  id: Type.String(),
  ruleId: Type.String(),
  classification: Type.Union([Type.Literal('confirmed_fact'), Type.Literal('needs_review')]),
  source: Type.Union([Type.Literal('offering'), Type.Literal('request'), Type.Literal('audit')]),
  title: Type.String(),
  summary: Type.String(),
  occurredAt: Type.Optional(Type.String()),
  evidence: Type.Record(Type.String(), Type.Unknown()),
  related: Type.Array(Type.Object({ kind: Type.String(), id: Type.String() })),
});
export const OperationsExceptionsResponseSchema = Type.Object({
  items: Type.Array(ExceptionSignalSchema),
  total: Type.Integer({ minimum: 0 }),
  page: Type.Integer({ minimum: 1 }),
  pageSize: Type.Integer({ minimum: 1, maximum: 100 }),
  rules: Type.Array(ExceptionRuleSchema),
});
