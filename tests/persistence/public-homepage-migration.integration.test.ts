import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';

const databaseUrl = process.env.LOCAL_AUTH_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)('public homepage database constraints', () => {
  const sql = postgres(databaseUrl!, { max: 1, prepare: false });
  afterAll(async () => sql.end());

  it('preserves historical data and rejects invalid ownership and states', async () => {
    const schema = `dev062_${randomUUID().replaceAll('-', '')}`;
    const legacyMigration = await readFile(
      'database/migrations/0029_public_commerce_homepage.sql',
      'utf8',
    );
    const scheduledMigration = await readFile(
      'database/migrations/0030_time_scheduled_public_homepages.sql',
      'utf8',
    );
    const rollback = new Error('rollback test fixture');
    await expect(
      sql.begin(async (tx) => {
        await tx.unsafe(`CREATE SCHEMA ${schema}`);
        await tx.unsafe(`SET LOCAL search_path TO ${schema}`);
        await tx.unsafe(`
        CREATE TABLE identities (identity_id varchar(128) PRIMARY KEY);
        CREATE TABLE commerce_profiles (commerce_profile_id varchar(128) PRIMARY KEY, owning_identity_id varchar(128) NOT NULL REFERENCES identities);
        CREATE TABLE commerce_references (identity_id varchar(128) PRIMARY KEY, commerce_reference varchar(18) NOT NULL);
        INSERT INTO identities VALUES ('a'), ('b');
        INSERT INTO commerce_profiles VALUES ('pa', 'a'), ('pb', 'b');
        INSERT INTO commerce_references VALUES ('a', '3AAAAAAAAAAAAAAAAA');
      `);
        await tx.unsafe(legacyMigration);
        await tx`SELECT set_config('pci.homepage_actor', 'local:test', true)`;
        expect(await tx`SELECT * FROM public_commerce_homepages`).toHaveLength(0);
        expect(await tx`SELECT commerce_reference FROM commerce_references`).toMatchObject([
          { commerce_reference: '3AAAAAAAAAAAAAAAAA' },
        ]);
        await tx`INSERT INTO public_commerce_homepages (identity_id, commerce_profile_id) VALUES ('a', 'pa')`;
        await expect(
          tx.savepoint(
            async (sp) =>
              sp`UPDATE public_commerce_homepages SET commerce_profile_id = 'pb' WHERE identity_id = 'a'`,
          ),
        ).rejects.toThrow();
        await expect(
          tx.savepoint(
            async (sp) =>
              sp`INSERT INTO public_commerce_homepages (identity_id, state) VALUES ('b', 'PUBLISHED')`,
          ),
        ).rejects.toThrow();
        await expect(
          tx.savepoint(
            async (sp) =>
              sp`UPDATE public_commerce_homepages SET state = 'UNKNOWN' WHERE identity_id = 'a'`,
          ),
        ).rejects.toThrow();
        await expect(
          tx.savepoint(
            async (sp) => sp`INSERT INTO public_commerce_homepages (identity_id) VALUES ('a')`,
          ),
        ).rejects.toThrow();
        await tx`UPDATE public_commerce_homepages SET state = 'PUBLISHED' WHERE identity_id = 'a'`;

        await tx.unsafe(scheduledMigration);
        const migrated = await tx<
          {
            homepage_id: string;
            identity_id: string;
            commerce_profile_id: string | null;
            state: string;
            is_default: boolean;
          }[]
        >`
          SELECT homepage_id, identity_id, commerce_profile_id, state, is_default
          FROM public_commerce_homepage_versions
          WHERE identity_id = 'a'
        `;
        expect(migrated).toHaveLength(1);
        expect(migrated[0]?.homepage_id.startsWith('legacy-')).toBe(true);
        expect(migrated[0]).toMatchObject({
          identity_id: 'a',
          commerce_profile_id: 'pa',
          state: 'PUBLISHED',
          is_default: true,
        });
        expect(
          await tx`SELECT action, actor_account_id FROM public_commerce_homepage_version_audit WHERE identity_id = 'a'`,
        ).toEqual([{ action: 'MIGRATED', actor_account_id: 'migration:0030' }]);

        await expect(
          tx.savepoint(
            async (sp) =>
              sp`INSERT INTO public_commerce_homepage_versions
                (homepage_id, identity_id, commerce_profile_id, state, is_default)
                VALUES ('other-default', 'a', 'pa', 'PUBLISHED', true)`,
          ),
        ).rejects.toThrow();
        await expect(
          tx.savepoint(
            async (sp) =>
              sp`INSERT INTO public_commerce_homepage_versions
                (homepage_id, identity_id, commerce_profile_id, state)
                VALUES ('wrong-profile', 'a', 'pb', 'PUBLISHED')`,
          ),
        ).rejects.toThrow();
        await expect(
          tx.savepoint(
            async (sp) =>
              sp`INSERT INTO public_commerce_homepage_windows
                (window_id, identity_id, homepage_id, starts_at, ends_at, time_zone)
                VALUES ('invalid-range', 'a', 'legacy-' || md5('a'), '2026-01-02T00:00:00Z', '2026-01-01T00:00:00Z', 'UTC')`,
          ),
        ).rejects.toThrow();
        await tx`INSERT INTO public_commerce_homepage_windows
          (window_id, identity_id, homepage_id, starts_at, ends_at, time_zone)
          VALUES ('window-a', 'a', 'legacy-' || md5('a'), '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z', 'UTC')`;
        await expect(
          tx.savepoint(
            async (sp) =>
              sp`INSERT INTO public_commerce_homepage_windows
                (window_id, identity_id, homepage_id, starts_at, ends_at, time_zone)
                VALUES ('overlap-a', 'a', 'legacy-' || md5('a'), '2026-01-01T12:00:00Z', '2026-01-03T00:00:00Z', 'UTC')`,
          ),
        ).rejects.toThrow();
        expect(
          await tx`SELECT action, window_id FROM public_commerce_homepage_version_audit WHERE identity_id = 'a' ORDER BY id`,
        ).toEqual([
          { action: 'MIGRATED', window_id: null },
          { action: 'WINDOW_CHANGED', window_id: 'window-a' },
        ]);
        throw rollback;
      }),
    ).rejects.toBe(rollback);
  });
});
