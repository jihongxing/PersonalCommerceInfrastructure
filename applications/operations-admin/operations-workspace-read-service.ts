import { ApplicationError } from '../core/application-error.js';
import type { ActorContext } from '../core/actor-context.js';
import { requireOperationsHumanPermission } from '../operations-identity/operations-human-authentication.js';
import type {
  OperationsQueryRepository,
  ReadModule,
  SearchInput,
} from './operations-query-repository.js';
import {
  exceptionRules,
  type ExceptionClassification,
  type ExceptionRuleId,
  type ExceptionSource,
} from './operations-exceptions.js';

const modules: readonly ReadModule[] = ['catalog', 'offering', 'request', 'audit'];
// Authorization is evaluated before any repository query, independently per module.
function authorized(context: ActorContext, requested?: ReadModule): ReadModule[] {
  if (requested) {
    requireOperationsHumanPermission(context, `${requested}:read`);
    return [requested];
  }
  if (context.actor.kind !== 'operations_human')
    requireOperationsHumanPermission(context, 'catalog:read');
  const selected = modules.filter(
    (module) =>
      context.actor.kind === 'operations_human' &&
      context.actor.permissions.includes(`${module}:read`),
  );
  if (!selected.length)
    throw new ApplicationError({
      category: 'authorization',
      code: 'operations_permission_denied',
      message: 'No readable modules.',
    });
  for (const module of selected) requireOperationsHumanPermission(context, `${module}:read`);
  return selected;
}
function authorizedExceptionRules(context: ActorContext): ExceptionRuleId[] {
  if (context.actor.kind !== 'operations_human')
    throw new ApplicationError({
      category: 'authorization',
      code: 'operations_permission_denied',
      message: 'Human Operations permission is required.',
    });
  const human = context.actor;
  const selected = exceptionRules.filter((rule) =>
    rule.requiredModules.every((module) => human.permissions.includes(`${module}:read`)),
  );
  if (!selected.length)
    throw new ApplicationError({
      category: 'authorization',
      code: 'operations_permission_denied',
      message: 'No readable exception sources.',
    });
  return selected.map((rule) => rule.id);
}
export function createOperationsWorkspaceReadService(repository: OperationsQueryRepository) {
  return {
    overview(context: ActorContext) {
      return repository.overview(authorized(context));
    },
    search(context: ActorContext, input: SearchInput & { readonly module?: ReadModule }) {
      return repository.search(authorized(context, input.module), input);
    },
    exceptions(
      context: ActorContext,
      input: {
        readonly page: number;
        readonly pageSize: number;
        readonly ruleId?: ExceptionRuleId;
        readonly classification?: ExceptionClassification;
        readonly source?: ExceptionSource;
      },
    ) {
      return repository.listExceptions(authorizedExceptionRules(context), input);
    },
  };
}
export type OperationsWorkspaceReadService = ReturnType<
  typeof createOperationsWorkspaceReadService
>;
