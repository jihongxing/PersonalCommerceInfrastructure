import { and, eq, sql } from 'drizzle-orm';

import type {
  CapabilityRepository,
  CommerceIdentityRepository,
} from '../../../applications/creator-identity/creator-identity-repositories.js';
import type { OfferingRepository } from '../../../applications/service-offering/offering-repositories.js';
import type { DistributionAssetRepository } from '../../../applications/distribution/distribution-repositories.js';
import type {
  CommerceActionRepository,
  CustomerRepository,
} from '../../../applications/customer-request/customer-request-repositories.js';
import type {
  Capability,
  CommerceIdentity,
} from '../../../modules/creator-commerce-identity/commerce-identity.js';
import type { Offering } from '../../../modules/service-offering/offering.js';
import type { DistributionAsset } from '../../../modules/distribution/distribution-asset.js';
import type {
  CommerceAction,
  Customer,
} from '../../../modules/customer-request/commerce-action.js';
import {
  commerceIdentities,
  commerceActions,
  customers,
  creatorCapabilities,
  distributionAssets,
  serviceOfferings,
} from '../../../database/schema/creator-identity.js';
import type { ProductDatabase } from './postgres-database.js';

function toIdentity(row: typeof commerceIdentities.$inferSelect): CommerceIdentity {
  return {
    creatorId: row.creatorId,
    profile: {
      displayName: row.displayName,
      bio: row.bio,
      ...(row.avatarUrl === null ? {} : { avatarUrl: row.avatarUrl }),
      ...(row.location === null ? {} : { location: row.location }),
      socialLinks: row.socialLinks,
    },
    capabilityIds: [],
    state: row.state as CommerceIdentity['state'],
  };
}

function toCapability(row: typeof creatorCapabilities.$inferSelect): Capability {
  return {
    id: row.id,
    creatorId: row.creatorId,
    name: row.name,
    description: row.description,
  };
}

function toOffering(row: typeof serviceOfferings.$inferSelect): Offering {
  return {
    id: row.id,
    creatorId: row.creatorId,
    capabilityIds: row.capabilityIds,
    title: row.title,
    description: row.description,
    ...(row.availabilityDescription === null
      ? {}
      : { availability: { description: row.availabilityDescription } }),
    requestInstructions: row.requestInstructions,
    state: row.state as Offering['state'],
  };
}

export class PostgresCommerceIdentityRepository implements CommerceIdentityRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async findById(id: string): Promise<CommerceIdentity | undefined> {
    const rows = await this.database
      .select()
      .from(commerceIdentities)
      .where(eq(commerceIdentities.creatorId, id));
    const row = rows[0];
    return row === undefined ? undefined : toIdentity(row);
  }

  public findByOwnerId(ownerId: string): Promise<readonly CommerceIdentity[]> {
    return this.findById(ownerId).then((identity) => (identity === undefined ? [] : [identity]));
  }

  public async save(entity: CommerceIdentity): Promise<void> {
    await this.database
      .insert(commerceIdentities)
      .values({
        creatorId: entity.creatorId,
        displayName: entity.profile.displayName,
        bio: entity.profile.bio,
        avatarUrl: entity.profile.avatarUrl ?? null,
        location: entity.profile.location ?? null,
        socialLinks: [...entity.profile.socialLinks],
        state: entity.state,
      })
      .onConflictDoUpdate({
        target: commerceIdentities.creatorId,
        set: {
          displayName: entity.profile.displayName,
          bio: entity.profile.bio,
          avatarUrl: entity.profile.avatarUrl ?? null,
          location: entity.profile.location ?? null,
          socialLinks: [...entity.profile.socialLinks],
          state: entity.state,
          updatedAt: new Date().toISOString(),
        },
      });
  }
}

export class PostgresCapabilityRepository implements CapabilityRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async findById(id: string): Promise<Capability | undefined> {
    const rows = await this.database
      .select()
      .from(creatorCapabilities)
      .where(eq(creatorCapabilities.id, id));
    const row = rows[0];
    return row === undefined ? undefined : toCapability(row);
  }

  public async findByOwnerId(ownerId: string): Promise<readonly Capability[]> {
    const rows = await this.database
      .select()
      .from(creatorCapabilities)
      .where(eq(creatorCapabilities.creatorId, ownerId));
    return rows.map(toCapability);
  }

  public async save(entity: Capability): Promise<void> {
    await this.database.insert(creatorCapabilities).values({
      id: entity.id,
      creatorId: entity.creatorId,
      name: entity.name,
      description: entity.description,
    });
  }
}

export class PostgresOfferingRepository implements OfferingRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async findById(id: string): Promise<Offering | undefined> {
    const rows = await this.database
      .select()
      .from(serviceOfferings)
      .where(eq(serviceOfferings.id, id));
    const row = rows[0];
    return row === undefined ? undefined : toOffering(row);
  }

  public async findByOwnerId(ownerId: string): Promise<readonly Offering[]> {
    const rows = await this.database
      .select()
      .from(serviceOfferings)
      .where(eq(serviceOfferings.creatorId, ownerId));
    return rows.map(toOffering);
  }

  public async save(entity: Offering): Promise<void> {
    await this.database
      .insert(serviceOfferings)
      .values({
        id: entity.id,
        creatorId: entity.creatorId,
        capabilityIds: [...entity.capabilityIds],
        title: entity.title,
        description: entity.description,
        availabilityDescription: entity.availability?.description ?? null,
        requestInstructions: entity.requestInstructions,
        state: entity.state,
      })
      .onConflictDoUpdate({
        target: serviceOfferings.id,
        set: {
          capabilityIds: [...entity.capabilityIds],
          title: entity.title,
          description: entity.description,
          availabilityDescription: entity.availability?.description ?? null,
          requestInstructions: entity.requestInstructions,
          state: entity.state,
          updatedAt: new Date().toISOString(),
        },
      });
  }
}

export class PostgresDistributionAssetRepository implements DistributionAssetRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async findById(id: string): Promise<DistributionAsset | undefined> {
    const rows = await this.database
      .select()
      .from(distributionAssets)
      .where(eq(distributionAssets.offeringId, id));
    const row = rows[0];
    return row === undefined
      ? undefined
      : {
          offeringId: row.offeringId,
          publicUrl: row.publicUrl,
          state: row.state as DistributionAsset['state'],
        };
  }

  public async save(entity: DistributionAsset): Promise<void> {
    await this.database
      .insert(distributionAssets)
      .values({
        offeringId: entity.offeringId,
        publicUrl: entity.publicUrl,
        state: entity.state,
      })
      .onConflictDoUpdate({
        target: distributionAssets.offeringId,
        set: {
          publicUrl: entity.publicUrl,
          state: entity.state,
          updatedAt: new Date().toISOString(),
        },
      });
  }
}

export class PostgresCustomerRepository implements CustomerRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async findById(id: string): Promise<Customer | undefined> {
    const rows = await this.database.select().from(customers).where(eq(customers.id, id));
    const row = rows[0];
    return row === undefined
      ? undefined
      : {
          id: row.id,
          contactName: row.contactName,
          contactMethod: row.contactMethod,
        };
  }

  public async findByContactMethod(contactMethod: string): Promise<Customer | undefined> {
    const rows = await this.database
      .select()
      .from(customers)
      .where(eq(customers.contactMethod, contactMethod));
    const row = rows[0];
    return row === undefined
      ? undefined
      : {
          id: row.id,
          contactName: row.contactName,
          contactMethod: row.contactMethod,
        };
  }

  public async save(entity: Customer): Promise<void> {
    await this.database.insert(customers).values(entity).onConflictDoNothing();
  }
}

export class PostgresCommerceActionRepository implements CommerceActionRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async findById(id: string): Promise<CommerceAction | undefined> {
    const rows = await this.database
      .select()
      .from(commerceActions)
      .where(eq(commerceActions.id, id));
    const row = rows[0];
    return row === undefined ? undefined : toCommerceAction(row);
  }

  public async findByOwnerId(ownerId: string): Promise<readonly CommerceAction[]> {
    const rows = await this.database
      .select()
      .from(commerceActions)
      .where(eq(commerceActions.creatorId, ownerId));
    return rows.map(toCommerceAction);
  }

  public async findSubmittedByCustomerAndOffering(
    customerId: string,
    offeringId: string,
  ): Promise<CommerceAction | undefined> {
    const rows = await this.database
      .select()
      .from(commerceActions)
      .where(
        sql`${commerceActions.customerId} = ${customerId} and ${commerceActions.offeringId} = ${offeringId} and ${commerceActions.state} = 'submitted'`,
      );
    const row = rows[0];
    return row === undefined ? undefined : toCommerceAction(row);
  }

  public async findByResultAccessToken(token: string): Promise<CommerceAction | undefined> {
    const rows = await this.database
      .select()
      .from(commerceActions)
      .where(eq(commerceActions.resultAccessToken, token));
    const row = rows[0];
    return row === undefined ? undefined : toCommerceAction(row);
  }

  public async saveTerminalDecision(entity: CommerceAction): Promise<boolean> {
    if (entity.state !== 'confirmed' && entity.state !== 'declined') {
      return false;
    }

    const rows = await this.database
      .update(commerceActions)
      .set({
        state: entity.state,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(commerceActions.id, entity.id), eq(commerceActions.state, 'submitted')))
      .returning({ id: commerceActions.id });
    return rows.length === 1;
  }

  public async save(entity: CommerceAction): Promise<void> {
    await this.database
      .insert(commerceActions)
      .values({
        id: entity.id,
        customerId: entity.customerId,
        creatorId: entity.creatorId,
        offeringId: entity.offeringId,
        requestMessage: entity.requestMessage,
        resultAccessToken: entity.resultAccessToken,
        state: entity.state,
      })
      .onConflictDoUpdate({
        target: commerceActions.id,
        set: {
          requestMessage: entity.requestMessage,
          resultAccessToken: entity.resultAccessToken,
          state: entity.state,
          updatedAt: new Date().toISOString(),
        },
      });
  }
}

function toCommerceAction(row: typeof commerceActions.$inferSelect): CommerceAction {
  return {
    id: row.id,
    customerId: row.customerId,
    creatorId: row.creatorId,
    offeringId: row.offeringId,
    requestMessage: row.requestMessage,
    resultAccessToken: row.resultAccessToken,
    state: row.state as CommerceAction['state'],
  };
}
