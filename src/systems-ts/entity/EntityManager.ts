import { Entity } from '../../types-ts/commonTypes';

export class EntityManager {
    private entities: Map<string, Entity>;
    private entityTypes: Map<string, Set<string>>;

    constructor() {
        this.entities = new Map();
        this.entityTypes = new Map();
    }

    register(entity: Entity): string {
        this.entities.set(entity.id, entity);
        
        if (!this.entityTypes.has(entity.type)) {
            this.entityTypes.set(entity.type, new Set());
        }
        this.entityTypes.get(entity.type).add(entity.id);
        
        return entity.id;
    }

    remove(entityId: string): void {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        this.entityTypes.get(entity.type)?.delete(entityId);
        this.entities.delete(entityId);
    }

    getById(entityId: string): Entity | undefined {
        return this.entities.get(entityId);
    }

    getByType(type: string): Entity[] {
        const entityIds = this.entityTypes.get(type);
        if (!entityIds) return [];
        
        return Array.from(entityIds)
            .map(id => this.entities.get(id))
            .filter((entity): entity is Entity => entity !== undefined);
    }

    clear(): void {
        this.entities.clear();
        this.entityTypes.clear();
    }
}
