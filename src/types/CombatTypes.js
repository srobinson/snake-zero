/**
 * @typedef {Object} ChaserBehavior
 * @property {'chaser'} type - Behavior type identifier
 * @property {number} detectionRange - Range at which enemy detects player
 * @property {number} chaseSpeed - Speed while chasing player
 * @property {number} wanderSpeed - Speed while wandering
 */

/**
 * @typedef {Object} PatrolBehavior
 * @property {'patrol'} type - Behavior type identifier
 * @property {number} patrolDistance - Distance to patrol
 * @property {number} patrolSpeed - Movement speed while patrolling
 * @property {Object} patrolState - Current patrol state
 * @property {number} patrolState.direction - Current patrol direction
 * @property {import('../systems/physics/PhysicsSystem.js').Vector2D} patrolState.startPos - Starting position for patrol
 */

/**
 * @typedef {Object} ShooterBehavior
 * @property {'shooter'} type - Behavior type identifier
 * @property {number} shootRange - Range at which enemy can shoot
 * @property {number} shootCooldown - Time between shots in milliseconds
 * @property {number} projectileSpeed - Speed of fired projectiles
 * @property {number} projectileDamage - Damage dealt by projectiles
 */

export const BehaviorTypes = {
    CHASER: 'chaser',
    PATROL: 'patrol',
    SHOOTER: 'shooter'
};
