import { Entity, Vector2D, GameEventTarget } from '../../types-ts/commonTypes';
import { EntityManager } from '../entity/EntityManager';
import { PhysicsSystem } from '../physics/PhysicsSystem';
import { WhipEffect } from '../../effects/WhipEffect';
import { DamageIndicator } from '../../effects/DamageIndicator';
import { ProjectileConfig, ProjectileEntity } from '../../types-ts/combatTypes';

interface StatusEffect {
    type: string;
    startTime: number;
    duration: number;
}

interface PlayerEntity extends Entity {
    type: 'player';
    health: number;
    segments: SnakeSegment[];
}

interface SnakeSegment extends Entity {
    position: Vector2D;
    damaging?: boolean;
    damage?: number;
}

interface CombatConfig {
    whipEffect: WhipEffect;
    damageIndicator: DamageIndicator;
    events: GameEventTarget;
}

export class CombatSystem {
    private entityManager: EntityManager;
    private physicsSystem: PhysicsSystem;
    private whipEffect: WhipEffect;
    private damageIndicator: DamageIndicator;
    private events: GameEventTarget;
    private statusEffects: Map<string, StatusEffect>;
    private cooldowns: Map<string, number>;
    private behaviors: Map<string, Function>;

    constructor(entityManager: EntityManager, physicsSystem: PhysicsSystem, config: CombatConfig) {
        this.entityManager = entityManager;
        this.physicsSystem = physicsSystem;
        this.whipEffect = config.whipEffect;
        this.damageIndicator = config.damageIndicator;
        this.events = config.events;
        this.statusEffects = new Map();
        this.cooldowns = new Map();
        this.behaviors = new Map();
    }

    update(currentTime: number, player: PlayerEntity): void {
        if (!player) return;
        
        this.updateProjectiles(currentTime);
        this.updateEnemies(player, currentTime);
        this.updateStatusEffects(currentTime);
        this.updateSnakeSegmentCombat(player);
        this.checkCombatCollisions();
    }

    private updateProjectiles(currentTime: number): void {
        const projectiles = this.entityManager.getByType('projectile') as ProjectileEntity[];
        for (const projectile of projectiles) {
            if (currentTime - projectile.createdAt > projectile.lifetime) {
                this.entityManager.remove(projectile.id);
            }
        }
    }

    private updateEnemies(player: PlayerEntity, currentTime: number): void {
        const enemies = this.entityManager.getByType('enemy');
        for (const enemy of enemies) {
            if (enemy.behavior) {
                const behaviorFn = this.behaviors.get(enemy.behavior.type);
                if (behaviorFn) {
                    behaviorFn(enemy, player, currentTime);
                }
            }
        }
    }

    private updateStatusEffects(currentTime: number): void {
        for (const [entityId, effect] of this.statusEffects.entries()) {
            if (currentTime >= effect.startTime + effect.duration) {
                this.removeStatusEffect(entityId, effect.type);
            }
        }
    }

    private updateSnakeSegmentCombat(snake: PlayerEntity): void {
        if (!snake.segments || snake.segments.length < 2) return;
        
        for (let i = 1; i < snake.segments.length; i++) {
            const segment = snake.segments[i];
            const prevSegment = snake.segments[i - 1];
            const velocity = this.calculateSegmentVelocity(segment, prevSegment);
            
            if (this.isWhipping(velocity)) {
                segment.damaging = true;
                segment.damage = this.calculateSegmentDamage(velocity);
                this.whipEffect.createTrail(segment.id, segment.position, velocity);
                
                if (this.events) {
                    this.events.emit('SEGMENT_WHIP', {
                        position: segment.position,
                        velocity: velocity,
                        damage: segment.damage
                    });
                }
            } else {
                segment.damaging = false;
                segment.damage = 0;
            }
        }
    }

    private checkCollision(entity1: Entity, entity2: Entity): boolean {
        const dx = entity1.position.x - entity2.position.x;
        const dy = entity1.position.y - entity2.position.y;
        const minDistance = (entity1.size ?? 1) + (entity2.size ?? 1);
        return (dx * dx + dy * dy) < (minDistance * minDistance);
    }

    createProjectile(ownerId: string, position: Vector2D, direction: Vector2D, config: ProjectileConfig = {}): string {
        const projectile: ProjectileEntity = {
            id: `projectile-${Date.now()}`,
            type: 'projectile',
            position: { ...position },
            damage: config.damage ?? 10,
            speed: config.speed ?? 5,
            lifetime: config.lifetime ?? 2000,
            createdAt: Date.now(),
            ownerId,
            size: config.size ?? 5
        };

        this.physicsSystem.setVelocity(projectile.id, {
            x: direction.x * projectile.speed,
            y: direction.y * projectile.speed
        });

        return this.entityManager.register(projectile);
    }

    applyDamage(entityId: string, damage: number): void {
        const entity = this.entityManager.getById(entityId);
        if (!entity?.health) return;

        entity.health = Math.max(0, entity.health - damage);
        this.damageIndicator.create(entity.position, damage);
        
        if (damage > 0) {
            this.whipEffect.createImpact(entity.position, damage);
        }

        if (entity.health <= 0) {
            this.events?.emit('ENTITY_DEFEATED', {
                position: entity.position,
                type: entity.type
            });
            this.entityManager.remove(entityId);
        }
    }

    removeStatusEffect(entityId: string, effectType: string): void {
        const effects = this.statusEffects.get(entityId);
        if (effects?.type === effectType) {
            this.statusEffects.delete(entityId);
        }
    }

    private calculateSegmentVelocity(segment: SnakeSegment, prevSegment: SnakeSegment): Vector2D {
        return {
            x: segment.position.x - prevSegment.position.x,
            y: segment.position.y - prevSegment.position.y
        };
    }

    private isWhipping(velocity: Vector2D, threshold: number = 2.0): boolean {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        return speed > threshold;
    }

    private calculateSegmentDamage(velocity: Vector2D, baseDamage: number = 5): number {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        return Math.floor(baseDamage * speed);
    }

    private checkCombatCollisions(): void {
        const projectiles = this.entityManager.getByType('projectile') as ProjectileEntity[];
        const combatEntities = [...this.entityManager.getByType('enemy'), ...this.entityManager.getByType('player')];
        
        for (const projectile of projectiles) {
            for (const entity of combatEntities) {
                if (projectile.ownerId !== entity.id && this.checkCollision(projectile, entity)) {
                    this.applyDamage(entity.id, projectile.damage);
                    this.entityManager.remove(projectile.id);
                }
            }
        }
    }

    clear(): void {
        this.statusEffects.clear();
        this.cooldowns.clear();
        this.behaviors.clear();
    }
}
