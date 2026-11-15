import type { ReadModule } from './operations-query-repository.js';

export type ExceptionClassification = 'confirmed_fact' | 'needs_review';
export type ExceptionRuleId =
  | 'AUDIT_OPERATION_FAILURE'
  | 'AUDIT_UNKNOWN_ACTOR'
  | 'PUBLISHED_OFFERING_WITHOUT_DISTRIBUTION'
  | 'REQUEST_OFFERING_UNRESOLVED';

export type ExceptionSource = Extract<ReadModule, 'offering' | 'request' | 'audit'>;

export interface ExceptionRuleDefinition {
  readonly id: ExceptionRuleId;
  readonly classification: ExceptionClassification;
  readonly source: ExceptionSource;
  readonly requiredModules: readonly ExceptionSource[];
  readonly title: string;
  readonly condition: string;
  readonly evidenceFields: string;
  readonly relationship: string;
  readonly exclusions: string;
}

export const exceptionRules: readonly ExceptionRuleDefinition[] = [
  {
    id: 'AUDIT_OPERATION_FAILURE',
    classification: 'confirmed_fact',
    source: 'audit',
    requiredModules: ['audit'],
    title: 'Catalog operation recorded as failed',
    condition: "Audit action is 'activation_failed' or 'draft_update_failed'.",
    evidenceFields:
      'Audit ID, action, entity, actor, reason, policy version, occurredAt, correlationId.',
    relationship: 'Catalog policy operation and its immutable Operations Audit record.',
    exclusions:
      'Does not infer a failure from a draft, inactive policy, age, or missing follow-up.',
  },
  {
    id: 'AUDIT_UNKNOWN_ACTOR',
    classification: 'needs_review',
    source: 'audit',
    requiredModules: ['audit'],
    title: 'Audit execution actor is not classified',
    condition: 'Existing actor classification resolves to unknown.',
    evidenceFields: 'Audit ID, actorId, entity, action, occurredAt, correlationId.',
    relationship: 'Operations Audit execution attribution.',
    exclusions:
      'Does not claim unauthorized activity; an unknown identifier may be a valid legacy actor.',
  },
  {
    id: 'PUBLISHED_OFFERING_WITHOUT_DISTRIBUTION',
    classification: 'needs_review',
    source: 'offering',
    requiredModules: ['offering'],
    title: 'Published Offering has no distribution record',
    condition: "Offering state is 'published' and no Distribution Asset is present.",
    evidenceFields:
      'Offering ID, title, creator ID, state, policy status, updatedAt, distribution presence.',
    relationship: 'Offering publication and its existing Distribution Asset association.',
    exclusions:
      'Does not infer an outage, customer impact, or SLA breach from age or publication alone.',
  },
  {
    id: 'REQUEST_OFFERING_UNRESOLVED',
    classification: 'needs_review',
    source: 'request',
    requiredModules: ['request', 'offering'],
    title: 'Request Offering association cannot be resolved',
    condition: 'Request offeringId has no matching Offering owned by the recorded creator.',
    evidenceFields: 'Request ID, offeringId, creator ID, request state, createdAt, updatedAt.',
    relationship: 'Customer Request to Offering and Creator association.',
    exclusions:
      'Does not infer fraud, abandonment, or customer harm; incomplete legacy data remains unclassified.',
  },
];

export function exceptionRule(id: ExceptionRuleId): ExceptionRuleDefinition {
  return exceptionRules.find((rule) => rule.id === id)!;
}
