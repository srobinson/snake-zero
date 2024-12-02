/**
 * @typedef {import('../entity/EntityManager.js').Entity} Entity
 */

export class CollisionSystem {
    constructor(entityManager) {
        this.entityManager = entityManager;
        this.collisionRules = new Map();
    }

    registerCollision(typeA, typeB, handler) {
        const key = `${typeA}:${typeB}`;
        this.collisionRules.set(key, handler);
    }

    checkCollision(entityA, entityB) {
        return entityA.position.x === entityB.position.x && 
               entityA.position.y === entityB.position.y;
    }

    update() {
        for (const [key, handler] of this.collisionRules) {
            const [typeA, typeB] = key.split(':');
            const entitiesA = this.entityManager.getByType(typeA);
            const entitiesB = this.entityManager.getByType(typeB);

            for (const entityA of entitiesA) {
                for (const entityB of entitiesB) {
                    if (entityA.id === entityB.id) continue;
                    if (this.checkCollision(entityA, entityB)) {
                        handler(entityA, entityB);
                    }
                }
            }
        }
    }
}
