import type { EntityCollectionRepository } from '../../applications/core/ports/entity-repository.js';

import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryEntityCollectionRepository<Entity>
  implements EntityCollectionRepository<Entity>, TransactionParticipant
{
  private entities = new Map<string, Entity>();

  public constructor(
    private readonly getId: (entity: Entity) => string,
    private readonly getOwnerId: (entity: Entity) => string,
  ) {}

  public findById(id: string): Promise<Entity | undefined> {
    const entity = this.entities.get(id);
    return Promise.resolve(entity === undefined ? undefined : structuredClone(entity));
  }

  public findByOwnerId(ownerId: string): Promise<readonly Entity[]> {
    return Promise.resolve(
      structuredClone(
        [...this.entities.values()].filter((entity) => this.getOwnerId(entity) === ownerId),
      ),
    );
  }

  public save(entity: Entity): Promise<void> {
    this.entities.set(this.getId(entity), structuredClone(entity));
    return Promise.resolve();
  }

  public createSnapshot(): unknown {
    return structuredClone(this.entities);
  }

  public restoreSnapshot(snapshot: unknown): void {
    if (!(snapshot instanceof Map)) {
      throw new TypeError('Entity repository snapshot must be a Map.');
    }

    this.entities = structuredClone(snapshot) as Map<string, Entity>;
  }
}
