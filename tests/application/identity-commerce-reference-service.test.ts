import { describe, expect, it } from 'vitest';
import { InMemoryIdentityCommerceReferenceRepository } from '../../adapters/in-memory/in-memory-identity-commerce-reference-repository.js';
import { createCommerceReference } from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import { createIdentityCommerceReferenceService } from '../../applications/canonical-commerce-reference/identity-commerce-reference-service.js';

describe('Identity Commerce Reference allocation', () => {
  it('returns one stable reference during concurrent initialization', async () => {
    const repository = new InMemoryIdentityCommerceReferenceRepository();
    let next = 0;
    const service = createIdentityCommerceReferenceService(repository, {
      generate: () => createCommerceReference(`${next++ % 2 ? '4' : '3'}${'A'.repeat(17)}`),
    });
    const results = await Promise.all(
      Array.from({ length: 20 }, () => service.ensure('identity-a')),
    );
    expect(new Set(results).size).toBe(1);
    expect(await service.ensure('identity-a')).toBe(results[0]);
  });

  it('retries a number collision for another Identity', async () => {
    const values = ['3', '3', '4'];
    const service = createIdentityCommerceReferenceService(
      new InMemoryIdentityCommerceReferenceRepository(),
      {
        generate: () => createCommerceReference(`${values.shift()}${'A'.repeat(17)}`),
      },
    );
    expect(await service.ensure('identity-a')).toBe(`3${'A'.repeat(17)}`);
    expect(await service.ensure('identity-b')).toBe(`4${'A'.repeat(17)}`);
  });

  it('propagates storage failures and permits a later retry', async () => {
    const repository = new InMemoryIdentityCommerceReferenceRepository();
    let failed = false;
    const service = createIdentityCommerceReferenceService(
      {
        find: (id) => repository.find(id),
        tryAssign: async (...args) => {
          if (!failed) {
            failed = true;
            throw new Error('database unavailable');
          }
          return repository.tryAssign(args[0], args[1]);
        },
      },
      { generate: () => createCommerceReference(`3${'A'.repeat(17)}`) },
    );
    await expect(service.ensure('identity-a')).rejects.toThrow('database unavailable');
    await expect(service.ensure('identity-a')).resolves.toBe(`3${'A'.repeat(17)}`);
  });
});
