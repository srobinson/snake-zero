/**
 * @typedef {Object} Vector2D
 * @property {number} x
 * @property {number} y
 */

export class PhysicsSystem {
    /**
     * @param {import('../entity/EntityManager.js').EntityManager} entityManager 
     */
    constructor(entityManager) {
        this.entityManager = entityManager;
        /** @type {Map<string, Vector2D>} */
        this.velocities = new Map();
        /** @type {Map<string, Vector2D>} */
        this.impulses = new Map();
        /** @type {{width: number, height: number}} */
        this.boundaries = { width: 0, height: 0 };
    }

    /**
     * Sets the game boundaries
     * @param {number} width 
     * @param {number} height 
     */
    setBoundaries(width, height) {
        this.boundaries = { width, height };
    }

    /**
     * Sets velocity for an entity
     * @param {string} entityId 
     * @param {Vector2D|null} velocity 
     */
    setVelocity(entityId, velocity) {
        if (velocity === null) {
            this.velocities.delete(entityId);
        } else {
            this.velocities.set(entityId, { ...velocity });
        }
    }

    /**
     * Gets current velocity of an entity
     * @param {string} entityId 
     * @returns {Vector2D|undefined}
     */
    getVelocity(entityId) {
        return this.velocities.get(entityId);
    }

    /**
     * Applies an impulse force to an entity
     * @param {string} entityId 
     * @param {Vector2D} force 
     */
    applyImpulse(entityId, force) {
        if (!this.impulses.has(entityId)) {
            this.impulses.set(entityId, { x: 0, y: 0 });
        }
        const impulse = this.impulses.get(entityId);
        impulse.x += force.x;
        impulse.y += force.y;
    }

    /**
     * Clears impulse forces for an entity
     * @param {string} entityId 
     */
    clearImpulses(entityId) {
        this.impulses.delete(entityId);
    }

    /**
     * Removes an entity from the physics system
     * @param {string} entityId 
     */
    removeEntity(entityId) {
        this.velocities.delete(entityId);
        this.impulses.delete(entityId);
    }

    /**
     * Updates physics state for all entities
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds

        for (const [entityId, velocity] of this.velocities) {
            const entity = this.entityManager.getById(entityId);
            if (!entity) {
                this.removeEntity(entityId);
                continue;
            }

            // Apply impulse forces
            const impulse = this.impulses.get(entityId);
            if (impulse) {
                velocity.x += impulse.x;
                velocity.y += impulse.y;
                // Clear impulse after applying
                this.clearImpulses(entityId);
            }

            // Update position
            const newPos = {
                x: entity.position.x + velocity.x * dt,
                y: entity.position.y + velocity.y * dt
            };

            // Handle boundaries based on entity behavior
            const boundaryBehavior = entity.boundaryBehavior || 'wrap';
            const handled = this.handleBoundaryCollision(entity, newPos, velocity, boundaryBehavior);
            
            if (!handled) {
                entity.position = newPos;
            }
        }
    }

    /**
     * Handles collision with boundaries
     * @private
     * @param {Entity} entity 
     * @param {Vector2D} newPos 
     * @param {Vector2D} velocity 
     * @param {'wrap'|'bounce'|'stop'|'destroy'} behavior 
     * @returns {boolean} True if position was modified
     */
    handleBoundaryCollision(entity, newPos, velocity, behavior) {
        const outOfBounds = newPos.x < 0 || newPos.x >= this.boundaries.width ||
                           newPos.y < 0 || newPos.y >= this.boundaries.height;
        
        if (!outOfBounds) return false;

        switch (behavior) {
            case 'wrap':
                // Wrap around to opposite side
                entity.position = {
                    x: ((newPos.x % this.boundaries.width) + this.boundaries.width) % this.boundaries.width,
                    y: ((newPos.y % this.boundaries.height) + this.boundaries.height) % this.boundaries.height
                };
                return true;

            case 'bounce':
                // Bounce off boundaries with some energy loss
                const damping = 0.8;
                if (newPos.x < 0 || newPos.x >= this.boundaries.width) {
                    velocity.x *= -damping;
                    entity.position.x = newPos.x < 0 ? 0 : this.boundaries.width - 1;
                }
                if (newPos.y < 0 || newPos.y >= this.boundaries.height) {
                    velocity.y *= -damping;
                    entity.position.y = newPos.y < 0 ? 0 : this.boundaries.height - 1;
                }
                return true;

            case 'stop':
                // Stop at boundaries
                entity.position = {
                    x: Math.max(0, Math.min(newPos.x, this.boundaries.width - 1)),
                    y: Math.max(0, Math.min(newPos.y, this.boundaries.height - 1))
                };
                if (newPos.x < 0 || newPos.x >= this.boundaries.width) velocity.x = 0;
                if (newPos.y < 0 || newPos.y >= this.boundaries.height) velocity.y = 0;
                return true;

            case 'destroy':
                // Remove entity when it hits boundaries
                this.entityManager.remove(entity.id);
                this.removeEntity(entity.id);
                return true;
        }

        return false;
    }

    /**
     * Calculates distance between two points
     * @param {Vector2D} a 
     * @param {Vector2D} b 
     * @returns {number}
     */
    static distance(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Normalizes a vector
     * @param {Vector2D} vector 
     * @returns {Vector2D}
     */
    static normalize(vector) {
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (magnitude === 0) return { x: 0, y: 0 };
        return {
            x: vector.x / magnitude,
            y: vector.y / magnitude
        };
    }
}
