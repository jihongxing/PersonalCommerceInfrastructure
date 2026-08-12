import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { CanonicalEventRecorder } from '../../applications/core/canonical-event-recorder.js';
import { createActorContext } from '../../applications/core/actor-context.js';
import { createCreatorIdentityService } from '../../applications/creator-identity/creator-identity-service.js';
import type { PostgresDatabaseConnection } from '../../adapters/persistence/postgres/postgres-database.js';
import { createPostgresDatabase } from '../../adapters/persistence/postgres/postgres-database.js';
import {
  PostgresCapabilityRepository,
  PostgresCommerceIdentityRepository,
} from '../../adapters/persistence/postgres/postgres-creator-identity-repositories.js';
import { PostgresUnitOfWork } from '../../adapters/persistence/postgres/postgres-unit-of-work.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl === undefined ? describe.skip : describe;

describeWithDatabase('PostgreSQL persistence integration', () => {
  let connection: PostgresDatabaseConnection;

  beforeAll(async () => {
    connection = createPostgresDatabase(databaseUrl as string);
    await migrate(connection.database, {
      migrationsFolder: 'database/migrations',
    });
  });

  beforeEach(async () => {
    await connection.database.execute(
      sql`truncate table product_events, creator_capabilities, commerce_identities`,
    );
  });

  afterAll(async () => {
    await connection.close();
  });

  it('commits canonical events through the transaction scope', async () => {
    const recorder = new CanonicalEventRecorder({
      clock: new FixedClock('2026-08-11T12:00:00.000Z'),
      eventStore: {
        append: () => {
          return Promise.reject(
            new Error('Default store must not be used inside the transaction.'),
          );
        },
      },
      idGenerator: new SequentialIdGenerator('event'),
    });
    const unitOfWork = new PostgresUnitOfWork(connection.database);

    await unitOfWork.execute(async ({ productEventStore }) => {
      await recorder.record(
        {
          actorId: 'creator-1',
          correlationId: 'postgres-commit',
          name: 'creator_published',
          objectId: 'identity-1',
          source: 'creator',
        },
        productEventStore,
      );
    });

    const rows = await connection.database.execute(
      sql`select id, name from product_events where correlation_id = 'postgres-commit'`,
    );
    expect(rows).toHaveLength(1);
  });

  it('rolls canonical events back when the transaction fails', async () => {
    const recorder = new CanonicalEventRecorder({
      clock: new FixedClock('2026-08-11T12:00:00.000Z'),
      eventStore: {
        append: () => {
          return Promise.reject(
            new Error('Default store must not be used inside the transaction.'),
          );
        },
      },
      idGenerator: new SequentialIdGenerator('event'),
    });
    const unitOfWork = new PostgresUnitOfWork(connection.database);

    await expect(
      unitOfWork.execute(async ({ productEventStore }) => {
        await recorder.record(
          {
            actorId: 'creator-1',
            correlationId: 'postgres-rollback',
            name: 'creator_published',
            objectId: 'identity-2',
            source: 'creator',
          },
          productEventStore,
        );
        throw new Error('simulated transaction failure');
      }),
    ).rejects.toThrow('simulated transaction failure');

    const rows = await connection.database.execute(
      sql`select id from product_events where correlation_id = 'postgres-rollback'`,
    );
    expect(rows).toHaveLength(0);
  });

  it('persists and reads a Creator Identity with its Capabilities', async () => {
    const service = createCreatorIdentityService({
      identityRepository: new PostgresCommerceIdentityRepository(connection.database),
      capabilityRepository: new PostgresCapabilityRepository(connection.database),
      idGenerator: new SequentialIdGenerator('capability'),
      unitOfWork: new PostgresUnitOfWork(connection.database),
    });
    const context = createActorContext({
      actor: { kind: 'creator', creatorId: 'creator-postgres-1' },
      correlationId: 'postgres-identity',
    });

    await service.create(
      {
        profile: {
          displayName: 'PostgreSQL Dancer',
          bio: 'Private dance lessons',
          socialLinks: ['https://example.test/dancer'],
        },
      },
      context,
    );
    await service.addCapability(
      {
        name: 'Private Dance Lesson',
        description: 'One-on-one dance instruction',
      },
      context,
    );

    await expect(service.get(context)).resolves.toMatchObject({
      creatorId: 'creator-postgres-1',
      profile: {
        displayName: 'PostgreSQL Dancer',
      },
      state: 'draft',
      capabilityIds: ['capability-1'],
      capabilities: [
        {
          id: 'capability-1',
          name: 'Private Dance Lesson',
        },
      ],
    });
  });
});
