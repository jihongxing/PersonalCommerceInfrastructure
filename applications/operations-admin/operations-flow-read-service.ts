import { ApplicationError } from '../core/application-error.js';
import type {
  CapabilityRepository,
  CommerceIdentityRepository,
} from '../creator-identity/creator-identity-repositories.js';
import type { CommerceActionRepository } from '../customer-request/customer-request-repositories.js';
import type { DistributionAssetRepository } from '../distribution/distribution-repositories.js';
import type { OfferingRepository } from '../service-offering/offering-repositories.js';
import type { CommerceAction } from '../../modules/customer-request/commerce-action.js';
import type { Offering } from '../../modules/service-offering/offering.js';
import type { CommerceIdentity } from '../../modules/creator-commerce-identity/commerce-identity.js';

export type OperationsOfferingState = 'draft' | 'published' | 'unpublished' | 'archived';
export type OperationsRequestState = 'draft' | 'submitted' | 'confirmed' | 'declined';
export type OperationsReadSource<T> = T & {
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

export interface OperationsOfferingRead {
  readonly id: string;
  readonly creator: { readonly id: string; readonly displayName?: string };
  readonly capabilityIds: readonly string[];
  readonly capabilities: readonly {
    readonly id: string;
    readonly name?: string;
    readonly catalogItemId?: string;
  }[];
  readonly templateId?: string;
  readonly title: string;
  readonly description: string;
  readonly availabilityDescription?: string;
  readonly requestInstructions: string;
  readonly state: OperationsOfferingState;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly policyStatus: string;
  readonly policyReason?: string;
  readonly policyVersion?: string;
  readonly distribution: { readonly publicUrl: string; readonly state: string } | null;
}

export interface OperationsRequestRead {
  readonly id: string;
  readonly offering: { readonly id: string; readonly title: string; readonly state: string } | null;
  readonly offeringId: string;
  readonly creator: { readonly id: string; readonly displayName?: string };
  readonly customer: { readonly id: string };
  readonly state: OperationsRequestState;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly creatorDecision: 'not_recorded' | 'confirmed' | 'declined';
  readonly requestContentVisibility: 'withheld';
}

export interface OperationsPage<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

export type OperationsFlowReadService = ReturnType<typeof createOperationsFlowReadService>;

type ReadCollectionRepository<Entity> = {
  findAll(): Promise<readonly OperationsReadSource<Entity>[]>;
  findReadById?(id: string): Promise<OperationsReadSource<Entity> | undefined>;
};

export function createOperationsFlowReadService(dependencies: {
  readonly offeringRepository: Pick<OfferingRepository, 'findById'> &
    ReadCollectionRepository<Offering>;
  readonly distributionAssetRepository: Pick<DistributionAssetRepository, 'findById'>;
  readonly capabilityRepository: Pick<CapabilityRepository, 'findById'>;
  readonly identityRepository: Pick<CommerceIdentityRepository, 'findById'> &
    ReadCollectionRepository<CommerceIdentity>;
  readonly commerceActionRepository: Pick<CommerceActionRepository, 'findById'> &
    ReadCollectionRepository<CommerceAction>;
}) {
  return {
    async listOfferings(input: {
      readonly page: number;
      readonly pageSize: number;
      readonly query?: string;
      readonly state?: OperationsOfferingState;
    }): Promise<OperationsPage<OperationsOfferingRead>> {
      const offerings = await dependencies.offeringRepository.findAll();
      const identities = new Map(
        (await dependencies.identityRepository.findAll()).map((identity) => [
          identity.creatorId,
          identity.profile.displayName,
        ]),
      );
      const query = input.query?.trim().toLocaleLowerCase('en-US');
      const filtered = offerings.filter((offering) => {
        const searchable = [offering.id, offering.title, offering.creatorId, offering.description];
        return (
          (input.state === undefined || offering.state === input.state) &&
          (query === undefined ||
            query.length === 0 ||
            searchable.some((value) => value.toLocaleLowerCase('en-US').includes(query)))
        );
      });
      filtered.sort((a, b) => a.id.localeCompare(b.id, 'en-US'));
      const selected = page(filtered, input.page, input.pageSize);
      return {
        ...selected,
        items: await Promise.all(
          selected.items.map((offering) =>
            toOfferingRead(
              dependencies.distributionAssetRepository,
              dependencies.capabilityRepository,
              offering,
              identities.get(offering.creatorId),
            ),
          ),
        ),
      };
    },

    async getOffering(id: string): Promise<OperationsOfferingRead> {
      const offering = await (dependencies.offeringRepository.findReadById?.(id) ??
        dependencies.offeringRepository.findById(id));
      if (offering === undefined) throw notFound('offering');
      const identity = await dependencies.identityRepository.findById(offering.creatorId);
      return toOfferingRead(
        dependencies.distributionAssetRepository,
        dependencies.capabilityRepository,
        offering,
        identity?.profile.displayName,
      );
    },

    async listRequests(input: {
      readonly page: number;
      readonly pageSize: number;
      readonly query?: string;
      readonly state?: OperationsRequestState;
    }): Promise<OperationsPage<OperationsRequestRead>> {
      const actions = await dependencies.commerceActionRepository.findAll();
      const [offerings, identities] = await Promise.all([
        dependencies.offeringRepository.findAll(),
        dependencies.identityRepository.findAll(),
      ]);
      const offeringMap = new Map(offerings.map((offering) => [offering.id, offering]));
      const identityMap = new Map(
        identities.map((identity) => [identity.creatorId, identity.profile.displayName]),
      );
      const query = input.query?.trim().toLocaleLowerCase('en-US');
      const filtered = actions.filter((action) => {
        const searchable = [action.id, action.offeringId, action.creatorId, action.customerId];
        return (
          (input.state === undefined || action.state === input.state) &&
          (query === undefined ||
            query.length === 0 ||
            searchable.some((value) => value.toLocaleLowerCase('en-US').includes(query)))
        );
      });
      filtered.sort((a, b) => a.id.localeCompare(b.id, 'en-US'));
      return page(
        filtered.map((action) =>
          toRequestRead(
            action,
            offeringMap.get(action.offeringId),
            identityMap.get(action.creatorId),
          ),
        ),
        input.page,
        input.pageSize,
      );
    },

    async getRequest(id: string): Promise<OperationsRequestRead> {
      const action = await (dependencies.commerceActionRepository.findReadById?.(id) ??
        dependencies.commerceActionRepository.findById(id));
      if (action === undefined) throw notFound('request');
      const [offering, identity] = await Promise.all([
        dependencies.offeringRepository.findById(action.offeringId),
        dependencies.identityRepository.findById(action.creatorId),
      ]);
      return toRequestRead(action, offering, identity?.profile.displayName);
    },
  };
}

async function toOfferingRead(
  distributionRepository: Pick<DistributionAssetRepository, 'findById'>,
  capabilityRepository: Pick<CapabilityRepository, 'findById'>,
  offering: OperationsReadSource<Offering>,
  displayName?: string,
): Promise<OperationsOfferingRead> {
  const distribution = await distributionRepository.findById(offering.id);
  const capabilities = await Promise.all(
    offering.capabilityIds.map(async (id) => {
      const capability = await capabilityRepository.findById(id);
      // Never match another Creator's Capability merely because an ID was referenced.
      return capability === undefined || capability.creatorId !== offering.creatorId
        ? { id }
        : {
            id,
            name: capability.name,
            ...(capability.catalogItemId === undefined
              ? {}
              : { catalogItemId: capability.catalogItemId }),
          };
    }),
  );
  return {
    id: offering.id,
    creator: { id: offering.creatorId, ...(displayName === undefined ? {} : { displayName }) },
    capabilityIds: offering.capabilityIds,
    capabilities,
    ...(offering.templateId === undefined ? {} : { templateId: offering.templateId }),
    title: offering.title,
    description: offering.description,
    ...(offering.availability === undefined
      ? {}
      : { availabilityDescription: offering.availability.description }),
    requestInstructions: offering.requestInstructions,
    state: offering.state,
    ...timestamps(offering),
    policyStatus: offering.policyStatus ?? 'not_checked',
    ...(offering.policyReason === undefined ? {} : { policyReason: offering.policyReason }),
    ...(offering.policyVersion === undefined ? {} : { policyVersion: offering.policyVersion }),
    distribution:
      distribution === undefined
        ? null
        : { publicUrl: distribution.publicUrl, state: distribution.state },
  };
}

function page<T>(items: readonly T[], pageNumber: number, pageSize: number): OperationsPage<T> {
  const start = (pageNumber - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: pageNumber,
    pageSize,
    total: items.length,
  };
}

function toRequestRead(
  action: OperationsReadSource<CommerceAction>,
  offering: Offering | undefined,
  displayName: string | undefined,
): OperationsRequestRead {
  return {
    id: action.id,
    offeringId: action.offeringId,
    offering:
      offering === undefined || offering.creatorId !== action.creatorId
        ? null
        : { id: offering.id, title: offering.title, state: offering.state },
    creator: { id: action.creatorId, ...(displayName === undefined ? {} : { displayName }) },
    customer: { id: action.customerId },
    state: action.state,
    ...timestamps(action),
    creatorDecision:
      action.state === 'confirmed' || action.state === 'declined' ? action.state : 'not_recorded',
    requestContentVisibility: 'withheld',
  };
}

function timestamps(source: { readonly createdAt?: string; readonly updatedAt?: string }) {
  return {
    ...(source.createdAt === undefined
      ? {}
      : { createdAt: new Date(source.createdAt).toISOString() }),
    ...(source.updatedAt === undefined
      ? {}
      : { updatedAt: new Date(source.updatedAt).toISOString() }),
  };
}

function notFound(kind: 'offering' | 'request'): ApplicationError {
  return new ApplicationError({
    category: 'not_found',
    code: `operations_${kind}_not_found`,
    message: `${kind === 'offering' ? 'Offering' : 'Customer Request'} was not found.`,
  });
}
