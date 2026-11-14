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
