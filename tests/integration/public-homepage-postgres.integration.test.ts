import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';
import { PostgresPublicHomepageRepository } from '../../adapters/persistence/postgres/postgres-public-homepage-repository.js';

const databaseUrl = process.env.DEV062_INTEGRATION_DATABASE_URL;
describe.skipIf(!databaseUrl)('PostgreSQL public homepage repository', () => {
  if (databaseUrl && !new URL(databaseUrl).pathname.includes('integration'))
    throw new Error('A dedicated integration database is required.');
  const sql = postgres(databaseUrl!, { max: 3, prepare: false });
  const repository = new PostgresPublicHomepageRepository(sql);
  afterAll(async () => sql.end());

  it('enforces ownership and publication, filters services and records one event per view', async () => {
    const id = randomUUID();
    const owner = `identity-${id}`;
    const other = `other-${id}`;
    const creator = `creator-${id}`;
    const account = randomUUID();
    const profile = `profile-${id}`;
    const otherProfile = `other-profile-${id}`;
    const alphabet = '3479ACDEFHJKMNPQRTVWXY';
    const number = Array.from(
      { length: 18 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join('');
    await sql`INSERT INTO identities (identity_id) VALUES (${owner}), (${other})`;
    await sql`INSERT INTO local_auth_accounts (id, email, password_hash) VALUES (${account}, ${`${id}@example.invalid`}, 'unused')`;
    await sql`INSERT INTO local_creator_mappings (account_id, creator_id) VALUES (${account}, ${creator})`;
    await sql`INSERT INTO account_identity_memberships (membership_id, account_id, identity_id) VALUES (${randomUUID()}, ${`local:${account}`}, ${owner})`;
    await sql`INSERT INTO commerce_identities (creator_id, display_name, bio, state) VALUES (${creator}, 'Private name', 'private bio', 'published')`;
    await sql`INSERT INTO commerce_profiles (commerce_profile_id, owning_identity_id, display_name) VALUES (${profile}, ${owner}, 'Public name'), (${otherProfile}, ${other}, 'Other')`;
    await sql`INSERT INTO commerce_references (commerce_reference, identity_id, assigned_at) VALUES (${number}, ${owner}, now())`;
    expect(await repository.configuration(owner)).toEqual({
      state: 'UNPUBLISHED',
      commerceProfileId: null,
      commerceProfile: null,
    });
    await expect(
      repository.selectProfile(owner, otherProfile, `local:${account}`),
    ).rejects.toMatchObject({
      code: 'homepage_not_ready',
    });
    await repository.selectProfile(owner, profile, `local:${account}`);
    expect(await repository.configuration(owner)).toEqual({
      state: 'UNPUBLISHED',
      commerceProfileId: profile,
      commerceProfile: {
        id: profile,
        displayName: 'Public name',
        lifecycle: 'ACTIVE',
      },
    });
    await expect(
      repository.transition(owner, 'publish', 'local:another-account'),
    ).rejects.toMatchObject({
      code: 'active_identity_binding_not_found',
    });
    const view = randomUUID();
    expect(await repository.resolve(number, view)).toBeUndefined();
    expect(await repository.preview(owner)).toEqual({
      commerceReference: number,
      displayName: 'Public name',
      offerings: [],
    });
    expect(
      await sql`SELECT id FROM product_events WHERE object_id = ${creator} AND name IN ('storefront_viewed', 'creator_published')`,
    ).toHaveLength(0);
    expect(await repository.transition(owner, 'publish', `local:${account}`)).toMatchObject({
      state: 'PUBLISHED',
    });
    expect(
      await sql`SELECT id FROM product_events WHERE object_id = ${creator} AND name = 'creator_published'`,
    ).toHaveLength(0);
    expect(await repository.resolve(number, view)).toEqual({
      commerceReference: number,
      displayName: 'Public name',
      offerings: [],
    });
    await Promise.all(Array.from({ length: 8 }, () => repository.resolve(number, view)));
    expect(
      await sql`SELECT id FROM product_events WHERE name = 'storefront_viewed' AND correlation_id = ${view}`,
    ).toHaveLength(1);
    await sql`INSERT INTO service_offerings (id, creator_id, title, description, request_instructions, state) VALUES (${`published-${id}`}, ${creator}, 'Published', 'Public', '', 'published'), (${`draft-${id}`}, ${creator}, 'Draft', 'Private', '', 'draft')`;
    expect((await repository.resolve(number, randomUUID()))?.offerings).toEqual([
      { id: `published-${id}`, title: 'Published', description: 'Public' },
    ]);
    await repository.transition(owner, 'pause', `local:${account}`);
    const pausedView = randomUUID();
    expect(await repository.resolve(number, pausedView)).toBeUndefined();
    await repository.preview(owner);
    expect(
      await sql`SELECT id FROM product_events WHERE correlation_id = ${pausedView}`,
    ).toHaveLength(0);
    await repository.transition(owner, 'publish', `local:${account}`);
    await sql`UPDATE commerce_profiles SET lifecycle = 'ARCHIVED' WHERE commerce_profile_id = ${profile}`;
    expect(await repository.resolve(number, randomUUID())).toBeUndefined();
    await expect(repository.transition(owner, 'publish', `local:${account}`)).rejects.toMatchObject(
      {
        code: 'homepage_not_ready',
      },
    );
    const audit = await sql<
      {
        actor_account_id: string;
        action: string;
        homepage_id: string | null;
        window_id: string | null;
      }[]
    >`
      SELECT actor_account_id, action, homepage_id, window_id
      FROM public_commerce_homepage_version_audit
      WHERE identity_id = ${owner}
      ORDER BY id
    `;
    expect(audit).toHaveLength(6);
    expect(audit.every((row) => row.actor_account_id === `local:${account}`)).toBe(true);
    expect(audit.map((row) => row.action)).toEqual([
      'VERSION_CHANGED',
      'VERSION_CHANGED',
      'VERSION_CHANGED',
      'VERSION_CHANGED',
      'VERSION_CHANGED',
      'VERSION_CHANGED',
    ]);
    expect(audit.every((row) => row.window_id === null)).toBe(true);
  });

  it('resolves an explicitly mapped Supabase account without local-auth rows', async () => {
    const id = randomUUID();
    const owner = `identity-${id}`;
    const creator = `creator-${id}`;
    const account = `supabase:user-${id}`;
    const profile = `profile-${id}`;
    const alphabet = '3479ACDEFHJKMNPQRTVWXY';
    const number = Array.from(
      { length: 18 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join('');
    const mappedRepository = new PostgresPublicHomepageRepository(
      sql,
      new Map([[account, creator]]),
    );

    await sql`INSERT INTO identities (identity_id) VALUES (${owner})`;
    await sql`INSERT INTO account_identity_memberships (membership_id, account_id, identity_id) VALUES (${randomUUID()}, ${account}, ${owner})`;
    await sql`INSERT INTO commerce_identities (creator_id, display_name, bio, state) VALUES (${creator}, 'Supabase creator', 'Public bio', 'published')`;
    await sql`INSERT INTO commerce_profiles (commerce_profile_id, owning_identity_id, display_name) VALUES (${profile}, ${owner}, 'Supabase public name')`;
    await sql`INSERT INTO commerce_references (commerce_reference, identity_id, assigned_at) VALUES (${number}, ${owner}, now())`;
    await mappedRepository.selectProfile(owner, profile, account);
    await mappedRepository.transition(owner, 'publish', account);

    expect(await mappedRepository.resolve(number, randomUUID())).toEqual({
      commerceReference: number,
      displayName: 'Supabase public name',
      offerings: [],
    });
    expect(
      await sql`SELECT id FROM local_auth_accounts WHERE id = ${account.slice('supabase:'.length)}`,
    ).toHaveLength(0);
  });
});
