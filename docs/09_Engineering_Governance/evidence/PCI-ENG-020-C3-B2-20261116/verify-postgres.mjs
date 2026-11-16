import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

// Only the disposable database created for this task. Credentials stay outside Git.
const config = JSON.parse(await readFile(process.argv[2], 'utf8'));
const target = new URL(config.databaseUrl);
assert.equal(target.hostname, '127.0.0.1');
assert.equal(target.pathname, '/pci_020c3b2_b3a89685');
const { createPostgresDatabase } = await import(
  pathToFileURL(resolve('dist/adapters/persistence/postgres/postgres-database.js')).href
);
const db = createPostgresDatabase(config.databaseUrl);
try {
  const baseline = JSON.parse(await readFile(process.argv[3], 'utf8'));
  const legacy = JSON.parse(await readFile(process.argv[4], 'utf8'));
  const catalog =
    await db.client`select id,capability_catalog_item_id,risk_tier,release_scope,status,creator_selectable,publish_enabled from service_policy_templates where policy_version='v1' order by id`;
  assert.deepEqual([...catalog], baseline.catalog, 'Catalog policy must remain unchanged');
  const offerings =
    await db.client`select id,creator_id,template_id,title,description,appearance,state,policy_status from service_offerings order by created_at`;
  const scoped = offerings.find((o) => o.id === 'aa9f09c1-3b39-4228-86e8-9a43b30c78d2');
  assert(scoped);
  assert.equal(scoped.appearance.locationDescription, '北京测试活动场地');
  assert.equal(scoped.appearance.upcomingTitle, '冬季活动修订标题');
  assert.equal(scoped.state, 'draft');
  assert.equal(scoped.policy_status, 'review_required');
  const storedLegacy = offerings.find((o) => o.id === legacy.fixture.id);
  assert(storedLegacy);
  assert.deepEqual(storedLegacy.appearance, legacy.fixture.appearance);
  assert.equal(storedLegacy.title, 'C3B2 Legacy Public Fixture Edited');
  const ordinary = offerings.find((o) => o.title.startsWith('C3B2 Ordinary Offering'));
  assert(ordinary);
  assert.equal(ordinary.appearance, null);
  const requests =
    await db.client`select a.id,a.offering_id,a.state,a.request_message,f.code,f.status as fulfillment_status from commerce_actions a left join fulfillment_codes f on f.action_id=a.id order by a.created_at`;
  assert.equal(requests.length, 1);
  assert.equal(requests[0].offering_id, legacy.fixture.id);
  assert.equal(requests[0].state, 'submitted');
  assert.match(requests[0].code, /^FC-/);
  assert.equal(requests[0].fulfillment_status, 'pending');
  const [counts] =
    await db.client`select (select count(*) from operations_accounts)::int as operations_accounts,(select count(*) from operations_sessions)::int as operations_sessions,(select count(*) from creator_web_sessions)::int as bff_sessions,(select count(*) from local_auth_sessions where revoked_at is null)::int as active_upstream_sessions`;
  assert.equal(counts.operations_accounts, 0);
  assert.equal(counts.operations_sessions, 0);
  assert.equal(counts.bff_sessions, 1);
  assert.equal(counts.active_upstream_sessions, 1);
  await writeFile(
    process.argv[5],
    JSON.stringify(
      {
        at: new Date().toISOString(),
        database: target.pathname.slice(1),
        checks: {
          catalogUnchanged: true,
          scopedEditedObjectPersisted: true,
          scopedPolicyPreserved: true,
          legacyAppearancePreserved: true,
          ordinaryHasNoAppearance: true,
          originalRequestAndFulfillment: true,
          creatorOperationsSeparation: true,
        },
        offerings: [...offerings],
        requests: [...requests],
        counts,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'PASS: real PostgreSQL round-trip, preservation, policy, Request and Fulfillment assertions.',
  );
} finally {
  await db.close();
}
