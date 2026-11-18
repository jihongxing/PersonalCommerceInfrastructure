import { Type, type Static } from 'typebox';

const ScenarioKindSchema = Type.Union([
  Type.Literal('Service'),
  Type.Literal('Goods'),
  Type.Literal('Program'),
  Type.Literal('Membership'),
  Type.Literal('Project'),
  Type.Literal('Right'),
]);

export const ScenarioRevisionSchema = Type.Object({
  scenario: ScenarioKindSchema,
  open: Type.Boolean(),
  revision: Type.Integer({ minimum: 1 }),
  reason: Type.String(),
  actorId: Type.String(),
  occurredAt: Type.String(),
  correlationId: Type.String(),
});

export const ScenarioOperationsResponseSchema = Type.Object({
  scenarios: Type.Array(
    Type.Object({
      scenario: ScenarioKindSchema,
      status: Type.Union([
        Type.Literal('open'),
        Type.Literal('paused'),
        Type.Literal('not_integrated'),
      ]),
      canManage: Type.Boolean(),
      activePolicyVersion: Type.Optional(Type.String()),
      revision: Type.Optional(Type.Integer({ minimum: 0 })),
      lastChange: Type.Optional(ScenarioRevisionSchema),
    }),
  ),
});

export const ScenarioOperationsChangeSchema = Type.Object(
  {
    scenario: ScenarioKindSchema,
    open: Type.Boolean(),
    expectedRevision: Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER - 1 }),
    reason: Type.String({ minLength: 1, maxLength: 500 }),
  },
  { additionalProperties: false },
);

export type ScenarioOperationsChange = Static<typeof ScenarioOperationsChangeSchema>;
export type ScenarioOperationsResponse = Static<typeof ScenarioOperationsResponseSchema>;
