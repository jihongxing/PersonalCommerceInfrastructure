import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

const profile = {
  displayName: 'Dancer One',
  bio: 'Private dance lessons',
  socialLinks: [],
};

const activeServers = new Set<FastifyInstance>();

async function createTestApiServer(
  dependencies?: Parameters<typeof createApiServer>[0],
): Promise<FastifyInstance> {
  const server = await createApiServer(dependencies);
  activeServers.add(server);
  return server;
}

afterEach(async () => {
  const servers = [...activeServers];
  activeServers.clear();
  await Promise.all(servers.map(async (server) => server.close()));
});

function responseJson<T>(response: { readonly body: string }): T {
  return JSON.parse(response.body) as T;
}

describe('Creator Identity API', () => {
  it('creates, reads, edits and adds a Capability for the authenticated Creator', async () => {
    const server = await createTestApiServer();
    const headers = {
      authorization: 'Bearer test-creator-token',
    };

    const created = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity',
      headers,
      payload: { profile },
    });

    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      creatorId: 'creator-test-1',
      profile,
      capabilityIds: [],
      state: 'draft',
    });

    const updated = await server.inject({
      method: 'PATCH',
      url: '/api/v1/creator/identity',
      headers,
      payload: {
        profile: {
          ...profile,
          displayName: 'Updated Dancer',
        },
      },
    });

    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      profile: {
        displayName: 'Updated Dancer',
      },
      state: 'draft',
    });

    const capability = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity/capabilities',
      headers,
      payload: {
        name: 'Private Dance Lesson',
        description: 'One-on-one dance instruction',
      },
    });

    expect(capability.statusCode).toBe(201);
    expect(capability.json()).toMatchObject({
      creatorId: 'creator-test-1',
      capabilityIds: ['capability-1'],
      capabilities: [
        {
          id: 'capability-1',
          name: 'Private Dance Lesson',
        },
      ],
    });

    const fetched = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/identity',
      headers,
    });

    expect(fetched.statusCode).toBe(200);
    expect(fetched.json()).toMatchObject({
      profile: {
        displayName: 'Updated Dancer',
      },
      capabilityIds: ['capability-1'],
      state: 'draft',
    });
  });

  it('creates, lists and updates a Creator-owned Service Offering draft', async () => {
    const server = await createTestApiServer();
    const headers = {
      authorization: 'Bearer test-creator-token',
    };

    await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity',
      headers,
      payload: { profile },
    });

    const capability = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity/capabilities',
      headers,
      payload: {
        name: 'Private Dance Lesson',
        description: 'One-on-one dance instruction',
      },
    });
    const capabilityResponse = responseJson<{ readonly capabilityIds: readonly string[] }>(
      capability,
    );
    const capabilityId = capabilityResponse.capabilityIds[0];
    expect(capabilityId).toBeDefined();

    const created = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/offerings',
      headers,
      payload: {
        capabilityIds: [capabilityId],
        title: 'Private Dance Lesson',
        description: 'One hour of one-on-one dance instruction.',
        availabilityDescription: 'Weekends by request.',
        requestInstructions: 'Share your preferred time and experience level.',
      },
    });

    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      creatorId: 'creator-test-1',
      capabilityIds: [capabilityId],
      state: 'draft',
      availabilityDescription: 'Weekends by request.',
      missingPublishConditions: [],
    });

    const createdOffering = responseJson<{ readonly id: string }>(created);
    const offeringId = createdOffering.id;
    const listed = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/offerings',
      headers,
    });

    expect(listed.statusCode).toBe(200);
    const listedOfferings = responseJson<{ readonly offerings: readonly unknown[] }>(listed);
    expect(listedOfferings.offerings).toHaveLength(1);

    const updated = await server.inject({
      method: 'PATCH',
      url: `/api/v1/creator/offerings/${offeringId}`,
      headers,
      payload: {
        capabilityIds: [capabilityId],
        title: 'Updated Private Dance Lesson',
        description: 'Updated service description.',
        availabilityDescription: 'Weekday evenings by request.',
        requestInstructions: 'Share your preferred evening.',
      },
    });

    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      id: offeringId,
      title: 'Updated Private Dance Lesson',
      state: 'draft',
      availabilityDescription: 'Weekday evenings by request.',
    });
  });

  it('allows an incomplete Draft Offering but rejects an unknown Capability', async () => {
    const server = await createTestApiServer();
    const headers = {
      authorization: 'Bearer test-creator-token',
    };

    await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity',
      headers,
      payload: { profile },
    });

    const incomplete = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/offerings',
      headers,
      payload: {
        capabilityIds: [],
        title: 'Private Dance Lesson',
        description: '',
        requestInstructions: '',
      },
    });

    expect(incomplete.statusCode).toBe(201);
    expect(incomplete.json()).toMatchObject({
      state: 'draft',
      missingPublishConditions: [
        'description',
        'capability',
        'availability',
        'request_instructions',
      ],
    });

    const invalidCapability = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/offerings',
      headers,
      payload: {
        capabilityIds: ['not-owned'],
        title: 'Private Dance Lesson',
        description: 'One-on-one dance instruction.',
        availabilityDescription: 'Weekends by request.',
        requestInstructions: 'Share your preferred time.',
      },
    });

    expect(invalidCapability.statusCode).toBe(400);
    expect(invalidCapability.json()).toMatchObject({
      error: {
        category: 'validation',
        code: 'service_offering_capability_invalid',
      },
    });
  });

  it('persists Appearance metadata on the existing Offering and exposes it as public Upcoming data', async () => {
    const server = await createTestApiServer();
    const headers = { authorization: 'Bearer test-creator-token' };

    await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity',
      headers,
      payload: { profile },
    });
    const capability = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity/capabilities',
      headers,
      payload: {
        name: 'Convention Appearance',
        description: 'Guest appearances for conventions and brands.',
      },
    });
    const capabilityId = responseJson<{ readonly capabilityIds: readonly string[] }>(capability)
      .capabilityIds[0];

    const created = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/offerings',
      headers,
      payload: {
        capabilityIds: [capabilityId],
        title: 'Shanghai Convention Guest Appearance',
        description: 'Convention guest and brand appearance.',
        availabilityDescription: 'Date and scope require Creator confirmation.',
        requestInstructions: 'Provide organizer, venue, date, and scope.',
        appearance: {
          appearanceType: 'convention',
          startsOn: '2026-08-20',
          locationDescription: 'Shanghai New International Expo Centre',
          buyerType: 'organizer',
          pricingRule: 'Quoted by duration and scope.',
          requestCallToAction: 'Submit appearance request',
          upcomingTitle: 'Shanghai Convention guest appearance',
        },
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      appearance: {
        appearanceType: 'convention',
        startsOn: '2026-08-20',
        buyerType: 'organizer',
      },
    });

    const offeringId = responseJson<{ readonly id: string }>(created).id;
    expect(
      (
        await server.inject({
          method: 'POST',
          url: `/api/v1/creator/offerings/${offeringId}/publish`,
          headers,
        })
      ).statusCode,
    ).toBe(200);

    const publicOffering = await server.inject({
      method: 'GET',
      url: `/api/v1/public/offerings/${offeringId}`,
    });
    expect(publicOffering.statusCode).toBe(200);
    expect(publicOffering.json()).toMatchObject({
      offering: {
        id: offeringId,
        title: 'Shanghai Convention Guest Appearance',
        appearance: {
          upcomingTitle: 'Shanghai Convention guest appearance',
          locationDescription: 'Shanghai New International Expo Centre',
        },
      },
    });
  });

  it('publishes an eligible Offering and distinguishes generated from distributed Asset', async () => {
    const server = await createTestApiServer();
    const headers = {
      authorization: 'Bearer test-creator-token',
    };

    await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity',
      headers,
      payload: { profile },
    });
    const capability = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity/capabilities',
      headers,
      payload: {
        name: 'Private Dance Lesson',
        description: 'One-on-one dance instruction',
      },
    });
    const capabilityId = responseJson<{ readonly capabilityIds: readonly string[] }>(capability)
      .capabilityIds[0];
    const created = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/offerings',
      headers,
      payload: {
        capabilityIds: [capabilityId],
        title: 'Private Dance Lesson',
        description: 'One hour of one-on-one dance instruction.',
        availabilityDescription: 'Weekends by request.',
        requestInstructions: 'Share your preferred time.',
      },
    });
    const offeringId = responseJson<{ readonly id: string }>(created).id;

    const published = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/offerings/${offeringId}/publish`,
      headers,
    });
    expect(published.statusCode).toBe(200);
    expect(published.json()).toMatchObject({
      offering: { id: offeringId, state: 'published' },
      distributionAsset: {
        offeringId,
        state: 'generated',
      },
    });

    const distributed = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/offerings/${offeringId}/distribution`,
      headers,
    });
    expect(distributed.statusCode).toBe(200);
    expect(distributed.json()).toMatchObject({
      offeringId,
      state: 'distributed',
    });

    const unpublished = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/offerings/${offeringId}/unpublish`,
      headers,
    });
    expect(unpublished.statusCode).toBe(200);
    expect(unpublished.json()).toMatchObject({
      id: offeringId,
      state: 'unpublished',
    });
  });

  it('serves a public Offering, accepts an anonymous Customer Request, and blocks new Requests after Unpublish', async () => {
    const server = await createTestApiServer();
    const headers = {
      authorization: 'Bearer test-creator-token',
    };

    await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity',
      headers,
      payload: { profile },
    });
    const capability = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity/capabilities',
      headers,
      payload: {
        name: 'Private Dance Lesson',
        description: 'One-on-one dance instruction',
      },
    });
    const capabilityId = responseJson<{ readonly capabilityIds: readonly string[] }>(capability)
      .capabilityIds[0];
    const created = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/offerings',
      headers,
      payload: {
        capabilityIds: [capabilityId],
        title: 'Private Dance Lesson',
        description: 'One hour of one-on-one dance instruction.',
        availabilityDescription: 'Weekends by request.',
        requestInstructions: 'Share your preferred time.',
      },
    });
    const offeringId = responseJson<{ readonly id: string }>(created).id;
    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/offerings/${offeringId}/publish`,
      headers,
    });

    const publicOffering = await server.inject({
      method: 'GET',
      url: `/api/v1/public/offerings/${offeringId}`,
    });
    expect(publicOffering.statusCode).toBe(200);
    expect(publicOffering.json()).toMatchObject({
      creator: {
        displayName: 'Dancer One',
        capabilityNames: ['Private Dance Lesson'],
      },
      offering: {
        id: offeringId,
        requestInstructions: 'Share your preferred time.',
      },
    });

    const submitted = await server.inject({
      method: 'POST',
      url: `/api/v1/public/offerings/${offeringId}/requests`,
      payload: {
        contactName: 'Buyer One',
        contactMethod: 'buyer@example.test',
        requestMessage: 'I would like a weekend lesson.',
      },
    });
    expect(submitted.statusCode).toBe(201);
    expect(submitted.json()).toMatchObject({ state: 'submitted' });

    const duplicate = await server.inject({
      method: 'POST',
      url: `/api/v1/public/offerings/${offeringId}/requests`,
      payload: {
        contactName: 'Buyer One',
        contactMethod: 'buyer@example.test',
        requestMessage: 'I would like a weekend lesson.',
      },
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json()).toMatchObject({
      error: { code: 'duplicate_unresolved_customer_request' },
    });

    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/offerings/${offeringId}/unpublish`,
      headers,
    });
    const unavailable = await server.inject({
      method: 'POST',
      url: `/api/v1/public/offerings/${offeringId}/requests`,
      payload: {
        contactName: 'Buyer Two',
        contactMethod: 'buyer-two@example.test',
        requestMessage: 'I would like a weekday lesson.',
      },
    });
    expect(unavailable.statusCode).toBe(422);
    expect(unavailable.json()).toMatchObject({
      error: { code: 'service_offering_unavailable' },
    });
  });

  it('lists and decides owned Submitted Requests, including after Unpublish, with protected terminal outcomes', async () => {
    const server = await createTestApiServer({
      authContextProvider: new InMemoryAuthContextProvider([
        {
          accessToken: 'test-creator-token',
          actor: { kind: 'creator', creatorId: 'creator-test-1' },
        },
        {
          accessToken: 'other-creator-token',
          actor: { kind: 'creator', creatorId: 'creator-test-2' },
        },
      ]),
    });
    const headers = {
      authorization: 'Bearer test-creator-token',
    };

    await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity',
      headers,
      payload: { profile },
    });
    const capability = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity/capabilities',
      headers,
      payload: {
        name: 'Private Dance Lesson',
        description: 'One-on-one dance instruction',
      },
    });
    const capabilityId = responseJson<{ readonly capabilityIds: readonly string[] }>(capability)
      .capabilityIds[0];
    const created = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/offerings',
      headers,
      payload: {
        capabilityIds: [capabilityId],
        title: 'Private Dance Lesson',
        description: 'One hour of one-on-one dance instruction.',
        availabilityDescription: 'Weekends by request.',
        requestInstructions: 'Share your preferred time.',
      },
    });
    const offeringId = responseJson<{ readonly id: string }>(created).id;
    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/offerings/${offeringId}/publish`,
      headers,
    });

    const submitted = await server.inject({
      method: 'POST',
      url: `/api/v1/public/offerings/${offeringId}/requests`,
      payload: {
        contactName: 'Buyer One',
        contactMethod: 'buyer@example.test',
        requestMessage: 'I would like a weekend lesson.',
      },
    });
    expect(submitted.statusCode).toBe(201);
    const submittedAction = responseJson<{
      readonly actionId: string;
      readonly resultAccessToken: string;
    }>(submitted);

    const listed = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/requests',
      headers,
    });
    expect(listed.statusCode).toBe(200);
    const listedRequests = responseJson<{
      readonly requests: readonly {
        readonly action: {
          readonly id: string;
          readonly requestMessage: string;
          readonly state: string;
        };
        readonly customer: {
          readonly contactName: string;
          readonly contactMethod: string;
        };
        readonly offering: {
          readonly id: string;
          readonly title: string;
        };
      }[];
    }>(listed);
    expect(listedRequests.requests).toHaveLength(1);
    expect(listedRequests.requests[0]).toMatchObject({
      action: {
        id: submittedAction.actionId,
        requestMessage: 'I would like a weekend lesson.',
        state: 'submitted',
      },
      customer: {
        contactName: 'Buyer One',
        contactMethod: 'buyer@example.test',
      },
      offering: {
        id: offeringId,
        title: 'Private Dance Lesson',
      },
    });

    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/offerings/${offeringId}/unpublish`,
      headers,
    });
    const unauthorized = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/requests/${submittedAction.actionId}/confirm`,
      headers: { authorization: 'Bearer other-creator-token' },
    });
    expect(unauthorized.statusCode).toBe(403);
    expect(unauthorized.json()).toMatchObject({
      error: { code: 'commerce_action_not_owned' },
    });

    const confirmed = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/requests/${submittedAction.actionId}/confirm`,
      headers,
    });
    expect(confirmed.statusCode).toBe(200);
    expect(confirmed.json()).toMatchObject({
      actionId: submittedAction.actionId,
      state: 'confirmed',
      resultAccessToken: submittedAction.resultAccessToken,
    });

    const repeated = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/requests/${submittedAction.actionId}/decline`,
      headers,
    });
    expect(repeated.statusCode).toBe(409);
    expect(repeated.json()).toMatchObject({
      error: { code: 'commerce_action_already_decided' },
    });

    const result = await server.inject({
      method: 'GET',
      url: `/api/v1/public/requests/${submittedAction.resultAccessToken}`,
    });
    expect(result.statusCode).toBe(200);
    const customerResult = responseJson<{
      readonly actionId: string;
      readonly resultAccessToken: string;
      readonly state: string;
      readonly message: string;
    }>(result);
    expect(customerResult).toMatchObject({
      actionId: submittedAction.actionId,
      resultAccessToken: submittedAction.resultAccessToken,
      state: 'confirmed',
      fulfillmentCode: { status: 'pending' },
    });
    expect(customerResult.message).toMatch(/records only the Creator's response/);

    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/offerings/${offeringId}/publish`,
      headers,
    });
    const secondSubmitted = await server.inject({
      method: 'POST',
      url: `/api/v1/public/offerings/${offeringId}/requests`,
      payload: {
        contactName: 'Buyer Two',
        contactMethod: 'buyer-two@example.test',
        requestMessage: 'I would like a weekday lesson.',
      },
    });
    const secondAction = responseJson<{ readonly actionId: string }>(secondSubmitted);
    const declined = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/requests/${secondAction.actionId}/decline`,
      headers,
    });
    expect(declined.statusCode).toBe(200);
    expect(declined.json()).toMatchObject({
      actionId: secondAction.actionId,
      state: 'declined',
    });
  });

  it('rejects missing authentication and invalid identity input', async () => {
    const server = await createTestApiServer();

    const missingAuth = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/identity',
    });
    expect(missingAuth.statusCode).toBe(401);
    expect(missingAuth.json()).toMatchObject({
      error: {
        category: 'authentication',
        code: 'missing_authorization',
      },
    });

    const invalidInput = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity',
      headers: { authorization: 'Bearer test-creator-token' },
      payload: {
        profile: {
          displayName: '',
          bio: '',
          socialLinks: [],
        },
      },
    });
    expect(invalidInput.statusCode).toBe(400);
    expect(invalidInput.json()).toMatchObject({
      error: {
        category: 'validation',
        code: 'request_validation_failed',
      },
    });
  });

  it('records idempotent external payment and fulfillment facts for a confirmed Request', async () => {
    const server = await createTestApiServer();
    const creatorHeaders = { authorization: 'Bearer test-creator-token' };
    const operationsHeaders = { authorization: 'Bearer test-operations-token' };

    await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity',
      headers: creatorHeaders,
      payload: { profile },
    });
    const capability = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity/capabilities',
      headers: creatorHeaders,
      payload: { name: 'Private Lesson', description: 'One-on-one instruction' },
    });
    const capabilityId = responseJson<{ readonly capabilityIds: readonly string[] }>(capability)
      .capabilityIds[0];
    const offering = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/offerings',
      headers: creatorHeaders,
      payload: {
        capabilityIds: [capabilityId],
        title: 'Private Lesson',
        description: 'One-on-one instruction',
        availabilityDescription: 'Weekends',
        requestInstructions: 'Share preferred time',
      },
    });
    const offeringId = responseJson<{ readonly id: string }>(offering).id;
    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/offerings/${offeringId}/publish`,
      headers: creatorHeaders,
    });
    const submitted = await server.inject({
      method: 'POST',
      url: `/api/v1/public/offerings/${offeringId}/requests`,
      payload: {
        contactName: 'Buyer',
        contactMethod: 'buyer-cr06@example.test',
        requestMessage: 'I would like this lesson.',
      },
    });
    const actionId = responseJson<{ readonly actionId: string }>(submitted).actionId;

    const beforeConfirm = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/requests/${actionId}/external-payment`,
      headers: operationsHeaders,
      payload: {
        evidenceReference: 'local://payment-before-confirm',
        occurredAt: '2026-08-14T12:00:00.000Z',
      },
    });
    expect(beforeConfirm.statusCode).toBe(409);

    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/requests/${actionId}/confirm`,
      headers: creatorHeaders,
    });
    const payment = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/requests/${actionId}/external-payment`,
      headers: operationsHeaders,
      payload: {
        evidenceReference: 'local://payment-evidence',
        occurredAt: '2026-08-14T12:00:00.000Z',
      },
    });
    expect(payment.statusCode).toBe(200);
    expect(payment.json()).toMatchObject({
      actionId,
      type: 'external_paid_verified',
      recordedBy: 'pilot-operator-test-1',
    });

    const repeatedPayment = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/requests/${actionId}/external-payment`,
      headers: operationsHeaders,
      payload: {
        evidenceReference: 'local://different-evidence',
        occurredAt: '2026-08-14T12:30:00.000Z',
      },
    });
    expect(repeatedPayment.statusCode).toBe(200);
    expect(repeatedPayment.json()).toEqual(payment.json());

    const fulfillment = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/requests/${actionId}/fulfillment`,
      headers: operationsHeaders,
      payload: {
        evidenceReference: 'local://fulfillment-evidence',
        occurredAt: '2026-08-14T13:00:00.000Z',
      },
    });
    expect(fulfillment.statusCode).toBe(200);
    expect(fulfillment.json()).toMatchObject({
      actionId,
      type: 'fulfillment_observed',
      recordedBy: 'pilot-operator-test-1',
    });

    const invalidToken = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/requests/${actionId}/fulfillment`,
      headers: { authorization: 'Bearer wrong-operations-token' },
      payload: {
        evidenceReference: 'local://unauthorized',
        occurredAt: '2026-08-14T13:00:00.000Z',
      },
    });
    expect(invalidToken.statusCode).toBe(401);
  });
});
