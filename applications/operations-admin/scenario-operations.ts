import type { ActorContext } from '../core/actor-context.js';
import { ApplicationError } from '../core/application-error.js';
import { requireOperationsHumanPermission } from '../operations-identity/operations-human-authentication.js';
import type { ServicePolicyCatalogRepository } from '../service-policy/service-policy-repositories.js';

export const scenarioKinds = [
  'Service',
  'Goods',
  'Program',
  'Membership',
  'Project',
  'Right',
] as const;
export type ScenarioKind = (typeof scenarioKinds)[number];

export interface ScenarioRevision {
  readonly scenario: ScenarioKind;
  readonly open: boolean;
  readonly revision: number;
  readonly reason: string;
  readonly actorId: string;
  readonly occurredAt: string;
  readonly correlationId: string;
}

export interface ScenarioOperationsStore {
  latest(scenario: ScenarioKind): Promise<ScenarioRevision | undefined>;
  append(revision: ScenarioRevision, previousOpen: boolean): Promise<boolean>;
  history?(scenario: ScenarioKind): Promise<ScenarioRevision[]>;
}

export type ServiceIntakeReader = Pick<ScenarioOperationsStore, 'latest'>;

export async function serviceIntakeOpen(reader: ServiceIntakeReader | undefined): Promise<boolean> {
  return (await reader?.latest('Service'))?.open ?? true;
}

export function createScenarioOperationsService(
  store: ScenarioOperationsStore,
  catalog: Pick<ServicePolicyCatalogRepository, 'getSnapshot'>,
  membershipIntegrated = false,
) {
  return {
    async list(context: ActorContext) {
      requireOperationsHumanPermission(context, 'catalog:read');
      const [revision, policy, membershipHistory] = await Promise.all([
        store.latest('Service'),
        catalog.getSnapshot(),
        membershipIntegrated ? store.history?.('Membership') : undefined,
      ]);
      const membership =
        membershipIntegrated && store.history === undefined
          ? await store.latest('Membership')
          : membershipHistory?.[0];
      const canManage =
        context.actor.kind === 'operations_human' &&
        context.actor.permissions.includes('catalog:policy:activate');
      return {
        scenarios: scenarioKinds.map((scenario) =>
          scenario === 'Service'
            ? {
                scenario,
                status: revision?.open === false ? ('paused' as const) : ('open' as const),
                activePolicyVersion: policy.policyVersion,
                revision: revision?.revision ?? 0,
                ...(revision === undefined ? {} : { lastChange: revision }),
                canManage,
              }
            : scenario === 'Membership' && membershipIntegrated
              ? {
                  scenario,
                  status: membership?.open === true ? ('open' as const) : ('paused' as const),
                  revision: membership?.revision ?? 0,
                  activePolicyVersion: 'membership-first-slice-v1',
                  canManage,
                  ...(membership === undefined ? {} : { lastChange: membership }),
                  history: membershipHistory ?? [],
                }
              : { scenario, status: 'not_integrated' as const, canManage: false },
        ),
      };
    },

    async change(
      input: { scenario: ScenarioKind; open: boolean; expectedRevision: number; reason: string },
      context: ActorContext,
    ) {
      requireOperationsHumanPermission(context, 'catalog:policy:activate');
      if (context.actor.kind !== 'operations_human') throw new Error('Expected Operations Human');
      if (
        input.scenario !== 'Service' &&
        !(membershipIntegrated && input.scenario === 'Membership')
      ) {
        throw new ApplicationError({
          category: 'conflict',
          code: 'scenario_not_integrated',
          message: 'This scenario has no operational policy implementation.',
        });
      }
      const reason = input.reason.trim();
      if (reason.length === 0 || reason.length > 500) {
        throw new ApplicationError({
          category: 'validation',
          code: 'scenario_change_reason_required',
          message: 'Supply a reason between 1 and 500 characters.',
        });
      }
      const previous = await store.latest(input.scenario);
      const revision = previous?.revision ?? 0;
      const previousOpen = previous?.open ?? input.scenario === 'Service';
      if (input.expectedRevision !== revision) throw staleRevision();
      if (input.open === previousOpen) {
        throw new ApplicationError({
          category: 'conflict',
          code: 'scenario_status_unchanged',
          message: 'The scenario is already in the requested state.',
        });
      }
      const change = {
        scenario: input.scenario,
        open: input.open,
        revision: revision + 1,
        reason,
        actorId: context.actor.principalId,
        occurredAt: new Date().toISOString(),
        correlationId: context.correlationId,
      };
      if (!(await store.append(change, previousOpen))) throw staleRevision();
      return change;
    },
  };
}

export type ScenarioOperationsService = ReturnType<typeof createScenarioOperationsService>;

function staleRevision(): ApplicationError {
  return new ApplicationError({
    category: 'conflict',
    code: 'scenario_revision_conflict',
    message: 'The scenario changed. Reload the current state before retrying.',
  });
}
