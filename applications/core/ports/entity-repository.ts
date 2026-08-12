export interface EntityRepository<Entity> {
  findById(id: string): Promise<Entity | undefined>;
  save(entity: Entity): Promise<void>;
}

export interface EntityCollectionRepository<Entity> extends EntityRepository<Entity> {
  findByOwnerId(ownerId: string): Promise<readonly Entity[]>;
}
