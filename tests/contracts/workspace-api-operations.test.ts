import { expect, it } from 'vitest';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

// Preserves the backend-only contract assertion from the retired browser foundation suite.
it('preserves registered VS-01 operations alongside governed VS-02 operations', async () => {
  const server = await createApiServer();
  try {
    const response = await server.inject({ method: 'GET', url: '/openapi.json' });
    expect(response.statusCode).toBe(200);
    const spec = response.json<{
      paths: Record<string, Record<string, { operationId?: string }>>;
    }>();
    const operations = new Map(
      Object.entries(spec.paths).flatMap(([path, methods]) =>
        Object.entries(methods).map(([method, operation]) => [
          `${method.toUpperCase()} ${path}`,
          operation.operationId,
        ]),
      ),
    );
    const expected = {
      'GET /api/v1/operations/admin/scenarios': 'listOperationsScenarios',
      'PATCH /api/v1/operations/admin/scenarios': 'changeOperationsScenarioIntake',
      'GET /api/v1/creator/confirmed-requests': 'listCreatorConfirmedRequests',
      'GET /api/v1/creator/identity': 'getCreatorIdentity',
      'GET /api/v1/creator/offerings': 'listCreatorServiceOfferings',
      'GET /api/v1/creator/requests': 'listCreatorSubmittedRequests',
      'GET /api/v1/public/offerings/{offeringId}': 'getPublicServiceOffering',
      'GET /api/v1/public/requests/{resultAccessToken}': 'getCustomerRequestResult',
      'PATCH /api/v1/creator/identity': 'updateCreatorIdentity',
      'PATCH /api/v1/creator/offerings/{offeringId}': 'updateCreatorServiceOffering',
      'POST /api/v1/creator/identity': 'createCreatorIdentity',
      'POST /api/v1/creator/identity/capabilities': 'addCreatorCapability',
      'POST /api/v1/creator/offerings': 'createCreatorServiceOffering',
      'POST /api/v1/creator/offerings/{offeringId}/distribution':
        'recordCreatorExternalDistribution',
      'POST /api/v1/creator/offerings/{offeringId}/publish': 'publishCreatorServiceOffering',
      'POST /api/v1/creator/offerings/{offeringId}/unpublish': 'unpublishCreatorServiceOffering',
      'POST /api/v1/creator/requests/{actionId}/confirm': 'confirmCreatorRequest',
      'POST /api/v1/creator/requests/{actionId}/decline': 'declineCreatorRequest',
      'POST /api/v1/public/offerings/{offeringId}/requests': 'submitCustomerRequest',
      'GET /api/v1/creator/wallet': 'getCreatorEarningsWallet',
      'POST /api/v1/creator/paid-orders': 'createPaidServiceOrder',
    };
    for (const [route, id] of Object.entries(expected))
      expect(operations.get(route), route).toBe(id);
  } finally {
    await server.close();
  }
});
