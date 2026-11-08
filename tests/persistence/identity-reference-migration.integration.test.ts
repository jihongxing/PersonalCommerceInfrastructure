import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';

const databaseUrl = process.env.LOCAL_AUTH_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)('Identity C number migration', () => {
  const sql = postgres(databaseUrl!, { max: 1, prepare: false });
  afterAll(async () => sql.end());

  async function fixture(conflict: boolean) {
    const schema = `dev061_${randomUUID().replaceAll('-', '')}`;
    await sql.unsafe(`CREATE SCHEMA ${schema}`);
    await sql.begin(async (tx) => {
      await tx.unsafe(`SET LOCAL search_path TO ${schema}`);
      await tx.unsafe(`CREATE TABLE identities (identity_id varchar(128) PRIMARY KEY);
        CREATE TABLE commerce_profiles (commerce_profile_id varchar(128) PRIMARY KEY, owning_identity_id varchar(128) NOT NULL);
        CREATE TABLE commerce_references (commerce_reference varchar(18) PRIMARY KEY, commerce_profile_id varchar(128) NOT NULL UNIQUE, lifecycle varchar(32) NOT NULL, assigned_at timestamptz NOT NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
        INSERT INTO identities VALUES ('owner');
        INSERT INTO commerce_profiles VALUES ('profile-a', 'owner'), ('profile-b', 'owner');
        INSERT INTO commerce_references VALUES ('3AAAAAAAAAAAAAAAAA', 'profile-a', 'ASSIGNED', now(), now(), now());`);
      if (conflict)
        await tx.unsafe(
          "INSERT INTO commerce_references VALUES ('4AAAAAAAAAAAAAAAAA', 'profile-b', 'ASSIGNED', now(), now(), now())",
        );
    });
    return schema;
  }

  it('preserves historical reference and profile during migration', async () => {
    const schema = await fixture(false);
    const migration = await readFile(
      'database/migrations/0028_identity_owned_commerce_reference.sql',
      'utf8',
    );
    await sql.begin(async (tx) => {
      await tx.unsafe(`SET LOCAL search_path TO ${schema}`);
      await tx.unsafe(migration);
      const rows = await tx.unsafe(
        'SELECT commerce_reference, commerce_profile_id, identity_id FROM commerce_references',
      );
      expect(rows).toMatchObject([
        {
          commerce_reference: '3AAAAAAAAAAAAAAAAA',
          commerce_profile_id: 'profile-a',
          identity_id: 'owner',
        },
      ]);
    });
  });

  it('rolls back all schema changes when an Identity owns multiple historical numbers', async () => {
    const schema = await fixture(true);
    const migration = await readFile(
      'database/migrations/0028_identity_owned_commerce_reference.sql',
      'utf8',
    );
    await expect(
      sql.begin(async (tx) => {
        await tx.unsafe(`SET LOCAL search_path TO ${schema}`);
        await tx.unsafe(migration);
      }),
    ).rejects.toThrow('multiple historical references');
    const rows = await sql.unsafe(
      `SELECT commerce_reference, commerce_profile_id FROM ${schema}.commerce_references ORDER BY commerce_reference`,
    );
    expect(rows).toHaveLength(2);
    const columns =
      await sql`select column_name from information_schema.columns where table_schema = ${schema} and table_name = 'commerce_references' and column_name = 'identity_id'`;
    expect(columns).toHaveLength(0);
  });
});
