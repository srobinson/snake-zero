/**
 * @typedef {Object} ProjectileEntity
 * @property {string} id
 * @property {'projectile'} type
 * @property {Object} position
 * @property {number} damage
 * @property {number} speed
 * @property {number} lifetime
 * @property {number} createdAt
 * @property {string} [ownerId]
 */

/**
 * @typedef {Object} ProjectileConfig
 * @property {number} [damage=10] - Projectile damage
 * @property {number} [speed=5] - Projectile speed
 * @property {number} [lifetime=2000] - How long projectile exists in ms
 * @property {number} [size=5] - Projectile size for collision
 */

/**
 * @typedef {Object} EnemyBehavior
 * @property {'chaser'|'patrol'|'shooter'} type - Type of enemy behavior
 * @property {number} [detectionRange] - Range at which enemy detects player
 * @property {number} [chaseSpeed] - Speed when chasing player
 * @property {number} [patrolDistance] - Distance to patrol
 * @property {number} [shootRange] - Range at which enemy can shoot
 * @property {number} [shootCooldown] - Time between shots in ms
 */

/**
 * @typedef {Object} CombatConfig
 * @property {import('../../effects/WhipEffect.js').WhipEffect} whipEffect
 * @property {import('../../effects/DamageIndicator.js').DamageIndicator} damageIndicator
 * @property {GameEventTarget} events
 */

/**
 * @typedef {Object} Vector2D
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Entity
 * @property {string} id
 * @property {string} type
 * @property {Object} position
 * @property {number} [health]
 * @property {number} [size]
 * @property {boolean} [damaging]
 * @property {number} [damage]
 */

/**
 * @typedef {Object} PlayerEntity
 * @property {string} id
 * @property {'player'} type
 * @property {Object} position
 * @property {number} health
 * @property {Array<Object>} segments
 */

/**
 * @typedef {Object} EnemyEntity
 * @property {string} id
 * @property {'enemy'} type
 * @property {Object} position
 * @property {number} health
 * @property {EnemyBehavior} behavior
 */

/**
 * @typedef {Object} GameEventTarget
 * @property {(event: string, data: any) => void} emit
 */

/**
 * Manages combat interactions between entities including projectiles, damage, and enemy behaviors
 */
export class CombatSystem {
    /**
     * @param {import('../entity/EntityManager.js').EntityManager} entityManager - Manages game entities
     * @param {import('../physics/PhysicsSystem.js').PhysicsSystem} physicsSystem - Handles physics and movement
     * @param {{
     *   whipEffect: import('../../effects/WhipEffect.js').WhipEffect,
     *   damageIndicator: import('../../effects/DamageIndicator.js').DamageIndicator,
     *   events: GameEventTarget
     * }} config - System configuration
     */
    constructor(entityManager, physicsSystem, config) {
        this.entityManager = entityManager;
        this.physicsSystem = physicsSystem;
        this.whipEffect = config.whipEffect;
        this.damageIndicator = config.damageIndicator;
        this.events = config.events;
        /** @type {Map<string, {type: string, startTime: number, duration: number}>} */
        this.statusEffects = new Map();
        /** @type {Map<string, number>} */
        this.cooldowns = new Map();
        /** @type {Map<string, Function>} */
        this.behaviors = new Map();
    }

    /**
     * @param {number} currentTime
     * @param {PlayerEntity} player
     */
    update(currentTime, player) {
        if (!player) return;
        
        this.updateProjectiles(currentTime);
        this.updateEnemies(player, currentTime);
        this.updateStatusEffects(currentTime);
        this.updateSnakeSegmentCombat(player);
        this.checkCombatCollisions();
    }

    /**
     * @param {number} currentTime
     */
    updateProjectiles(currentTime) {
        const projectiles = this.entityManager.getByType('projectile');
        for (const projectile of projectiles) {
            if (currentTime - projectile.createdAt > projectile.lifetime) {
                this.entityManager.remove(projectile.id);
            }
        }
    }

    /**
     * @param {PlayerEntity} player
     * @param {number} currentTime
     */
    updateEnemies(player, currentTime) {
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

    /**
     * @param {number} currentTime
     */
    updateStatusEffects(currentTime) {
        for (const [entityId, effect] of this.statusEffects.entries()) {
            if (currentTime >= effect.startTime + effect.duration) {
                this.removeStatusEffect(entityId, effect.type);
            }
        }
    }

    /**
     * @param {PlayerEntity} snake
     */
    updateSnakeSegmentCombat(snake) {
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

    /**
     * @param {Entity} entity1
     * @param {Entity} entity2
     * @returns {boolean}
     */
    checkCollision(entity1, entity2) {
        const dx = entity1.position.x - entity2.position.x;
        const dy = entity1.position.y - entity2.position.y;
        const minDistance = (entity1.size || 1) + (entity2.size || 1);
        return (dx * dx + dy * dy) < (minDistance * minDistance);
    }

    /**
     * Creates a new projectile entity
     * @param {string} ownerId - ID of entity that created projectile
     * @param {{x: number, y: number}} position - Starting position
     * @param {{x: number, y: number}} direction - Normalized direction vector
     * @param {ProjectileConfig} [config={}] - Projectile configuration
     * @returns {string} ID of created projectile
     */
    createProjectile(ownerId, position, direction, config = {}) {
        const projectile = {
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

    /**
     * Applies damage to an entity with health
     * @param {string} entityId - ID of entity to damage
     * @param {number} damage - Amount of damage to apply
     * @fires ENTITY_DEFEATED when entity health reaches 0
     */
    applyDamage(entityId, damage) {
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

    /**
     * @param {string} entityId
     * @param {string} effectType
     */
    removeStatusEffect(entityId, effectType) {
        const effects = this.statusEffects.get(entityId);
        if (effects?.type === effectType) {
            this.statusEffects.delete(entityId);
        }
    }

    /**
     * @param {Object} segment
     * @param {Object} prevSegment
     * @returns {Vector2D}
     */
    calculateSegmentVelocity(segment, prevSegment) {
        return {
            x: segment.position.x - prevSegment.position.x,
            y: segment.position.y - prevSegment.position.y
        };
    }

    /**
     * @param {Vector2D} velocity
     * @param {number} [threshold=2.0]
     * @returns {boolean}
     */
    isWhipping(velocity, threshold = 2.0) {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        return speed > threshold;
    }

    /**
     * @param {Vector2D} velocity
     * @param {number} [baseDamage=5]
     * @returns {number}
     */
    calculateSegmentDamage(velocity, baseDamage = 5) {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        return Math.floor(baseDamage * speed);
    }

    checkCombatCollisions() {
        const projectiles = this.entityManager.getByType('projectile');
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
}
