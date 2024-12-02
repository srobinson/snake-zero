import { Entity, Vector2D } from '../../types-ts/commonTypes';
import { EntityManager } from '../entity/EntityManager';

type BoundaryBehavior = 'wrap' | 'bounce' | 'stop' | 'destroy';

interface PhysicsEntity extends Entity {
    boundaryBehavior?: BoundaryBehavior;
}

export class PhysicsSystem {
    private entityManager: EntityManager;
    private velocities: Map<string, Vector2D>;
    private impulses: Map<string, Vector2D>;
    private boundaries: { width: number; height: number };

    constructor(entityManager: EntityManager) {
        this.entityManager = entityManager;
        this.velocities = new Map();
        this.impulses = new Map();
        this.boundaries = { width: 0, height: 0 };
    }

    setBoundaries(width: number, height: number): void {
        this.boundaries = { width, height };
    }

    setVelocity(entityId: string, velocity: Vector2D | null): void {
        if (velocity === null) {
            this.velocities.delete(entityId);
        } else {
            this.velocities.set(entityId, { ...velocity });
        }
    }

    getVelocity(entityId: string): Vector2D | undefined {
        return this.velocities.get(entityId);
    }

    applyImpulse(entityId: string, force: Vector2D): void {
        if (!this.impulses.has(entityId)) {
            this.impulses.set(entityId, { x: 0, y: 0 });
        }
        const impulse = this.impulses.get(entityId);
        if (impulse) {
            impulse.x += force.x;
            impulse.y += force.y;
        }
    }

    clearImpulses(entityId: string): void {
        this.impulses.delete(entityId);
    }

    removeEntity(entityId: string): void {
        this.velocities.delete(entityId);
        this.impulses.delete(entityId);
    }

    update(deltaTime: number): void {
        const dt = deltaTime / 1000; // Convert to seconds

        for (const [entityId, velocity] of this.velocities) {
            const entity = this.entityManager.getById(entityId) as PhysicsEntity;
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

    private handleBoundaryCollision(
        entity: PhysicsEntity,
        newPos: Vector2D,
        velocity: Vector2D,
        behavior: BoundaryBehavior
    ): boolean {
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

    static distance(a: Vector2D, b: Vector2D): number {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static normalize(vector: Vector2D): Vector2D {
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (magnitude === 0) return { x: 0, y: 0 };
        return {
            x: vector.x / magnitude,
            y: vector.y / magnitude
        };
    }

    clear(): void {
        this.velocities.clear();
        this.impulses.clear();
    }
}
