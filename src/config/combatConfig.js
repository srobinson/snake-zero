/**
 * @typedef {Object} DifficultySettings
 * @property {number} spawnRateMultiplier - Multiplier for enemy spawn rate
 * @property {number} healthMultiplier - Multiplier for enemy health
 * @property {number} damageMultiplier - Multiplier for enemy damage
 * @property {number} speedMultiplier - Multiplier for enemy speed
 * @property {number} maxEnemiesMultiplier - Multiplier for maximum enemies
 */

/**
 * @typedef {Object} ProjectileConfig
 * @property {number} damage - Base damage of projectiles
 * @property {number} speed - Speed of projectiles
 * @property {number} lifetime - How long projectiles last (ms)
 * @property {number} size - Size of projectiles relative to cell
 * @property {string} color - Color of projectiles
 * @property {Object} effects - Visual effects for projectiles
 */

/**
 * @typedef {Object} ShooterBehavior
 * @property {number} shootRange - Maximum shooting range
 * @property {number} shootCooldown - Time between shots in ms
 * @property {number} projectileSpeed - Speed of projectiles
 */

/**
 * @typedef {Object} PatrolBehavior
 * @property {number} patrolRange - Range of patrol movement
 * @property {number} patrolSpeed - Speed of patrol movement
 */

/**
 * @typedef {Object} ChaserBehavior
 * @property {number} aggroRange - Range at which enemy starts chasing
 * @property {number} retreatHealth - Health percentage to trigger retreat
 */

/**
 * @typedef {('chase'|'patrol'|'shoot')} BehaviorType
 */

/**
 * @typedef {Object} EnemyTypeConfig
 * @property {number} health - Health multiplier
 * @property {number} speed - Speed multiplier
 * @property {number} damage - Damage multiplier
 * @property {string} color - Enemy color
 * @property {BehaviorType} behaviorType - Type of behavior
 * @property {(ChaserBehavior|PatrolBehavior|ShooterBehavior)} behavior - Behavior configuration
 */

/**
 * @typedef {Object} EnemyConfig
 * @property {number} baseHealth - Base health points
 * @property {number} baseSpeed - Base movement speed
 * @property {number} baseDamage - Base damage dealt to player
 * @property {number} spawnRate - Enemies per minute
 * @property {number} maxEnemies - Maximum enemies at once
 * @property {Object.<string, EnemyTypeConfig>} types - Configuration for different enemy types
 * @property {Object.<string, DifficultySettings>} difficulty - Difficulty settings
 */

/**
 * @typedef {Object} CombatConfig
 * @property {ProjectileConfig} projectiles - Projectile settings
 * @property {EnemyConfig} enemies - Enemy settings
 * @property {Object} difficulty - Difficulty-based adjustments
 */

/** @type {CombatConfig} */
export const combatConfig = {
    projectiles: {
        damage: 1,
        speed: 8,
        lifetime: 2000,
        size: 0.3,
        color: '#FF5555',
        effects: {
            trail: {
                enabled: true,
                length: 3,
                opacity: 0.6,
                color: '#FF8888'
            },
            impact: {
                enabled: true,
                radius: 1,
                duration: 300,
                particles: 8,
                color: '#FF3333'
            }
        }
    },
    enemies: {
        baseHealth: 100,
        baseSpeed: 2,
        baseDamage: 10,
        spawnRate: 30, // enemies per minute
        maxEnemies: 10,
        types: {
            chaser: {
                health: 1.0,
                speed: 1.2,
                damage: 1.0,
                color: '#ff0000',
                behaviorType: 'chase',
                behavior: {
                    aggroRange: 10,
                    retreatHealth: 0.3
                }
            },
            patrol: {
                health: 1.5,
                speed: 0.8,
                damage: 1.2,
                color: '#ff6600',
                behaviorType: 'patrol',
                behavior: {
                    patrolRange: 5,
                    patrolSpeed: 1.0
                }
            },
            shooter: {
                health: 2.0,
                speed: 0.6,
                damage: 1.5,
                color: '#cc00ff',
                behaviorType: 'shoot',
                behavior: {
                    shootRange: 8,
                    shootCooldown: 2000,
                    projectileSpeed: 4
                }
            }
        },
        difficulty: {
            easy: {
                spawnRateMultiplier: 0.8,
                healthMultiplier: 0.8,
                damageMultiplier: 0.8,
                speedMultiplier: 0.8,
                maxEnemiesMultiplier: 0.7
            },
            normal: {
                spawnRateMultiplier: 1.0,
                healthMultiplier: 1.0,
                damageMultiplier: 1.0,
                speedMultiplier: 1.0,
                maxEnemiesMultiplier: 1.0
            },
            hard: {
                spawnRateMultiplier: 1.2,
                healthMultiplier: 1.2,
                damageMultiplier: 1.2,
                speedMultiplier: 1.2,
                maxEnemiesMultiplier: 1.3
            }
        }
    },
    difficulty: {
        easy: {
            enemyHealthMultiplier: 0.8,
            enemySpeedMultiplier: 0.8,
            enemyDamageMultiplier: 0.8,
            spawnRateMultiplier: 0.7,
            maxEnemiesMultiplier: 0.7
        },
        normal: {
            enemyHealthMultiplier: 1.0,
            enemySpeedMultiplier: 1.0,
            enemyDamageMultiplier: 1.0,
            spawnRateMultiplier: 1.0,
            maxEnemiesMultiplier: 1.0
        },
        hard: {
            enemyHealthMultiplier: 1.2,
            enemySpeedMultiplier: 1.2,
            enemyDamageMultiplier: 1.2,
            spawnRateMultiplier: 1.3,
            maxEnemiesMultiplier: 1.3
        }
    }
};
