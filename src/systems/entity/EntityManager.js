/**
 * @typedef {Object} Entity
 * @property {string} id
 * @property {string} type
 * @property {Object} position
 * @property {number} position.x
 * @property {number} position.y
 * @property {Object} [state]
 * @property {string} [enemyType]
 * @property {number} [health]
 * @property {Object} [behavior]
 * @property {('wrap'|'bounce'|'stop'|'destroy')} [boundaryBehavior]
 * @property {number} [speed]
 * @property {number} [damage]
 */

export class EntityManager {
    constructor() {
        this.entities = new Map();
        this.entityTypes = new Map();
    }

    register(entity) {
        const id = entity.id || crypto.randomUUID();
        this.entities.set(id, { ...entity, id });
        if (!this.entityTypes.has(entity.type)) {
            this.entityTypes.set(entity.type, new Set());
        }
        this.entityTypes.get(entity.type).add(id);
        return id;
    }

    remove(id) {
        const entity = this.entities.get(id);
        if (entity) {
            this.entityTypes.get(entity.type)?.delete(id);
            this.entities.delete(id);
        }
    }

    getByType(type) {
        const typeSet = this.entityTypes.get(type);
        if (!typeSet) return [];
        return Array.from(typeSet)
            .map(id => this.entities.get(id))
            .filter(Boolean);
    }

    getById(id) {
        return this.entities.get(id);
    }

    update(id, updates) {
        const entity = this.entities.get(id);
        if (!entity) return false;

        if (updates.type && updates.type !== entity.type) {
            this.entityTypes.get(entity.type)?.delete(id);
            if (!this.entityTypes.has(updates.type)) {
                this.entityTypes.set(updates.type, new Set());
            }
            this.entityTypes.get(updates.type).add(id);
        }

        Object.assign(entity, updates);
        return true;
    }

    getInRange(position, range) {
        return Array.from(this.entities.values()).filter(entity => {
            const dx = entity.position.x - position.x;
            const dy = entity.position.y - position.y;
            return Math.sqrt(dx * dx + dy * dy) <= range;
        });
    }

    clear() {
        this.entities.clear();
        this.entityTypes.clear();
    }
}
