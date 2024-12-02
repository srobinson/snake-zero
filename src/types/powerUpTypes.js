/**
 * @typedef {'speed'|'ghost'|'points'|'slow'} PowerUpType
 */

/**
 * @typedef {Object} PowerUpEffect
 * @property {number} duration - Duration of the effect in milliseconds
 * @property {number} startTime - Time when the effect started
 * @property {PowerUpType} type - Type of power-up
 * @property {boolean} active - Whether the effect is currently active
 */

/**
 * @typedef {Object} PowerUpColors
 * @property {string} speed - Color for speed power-up
 * @property {string} ghost - Color for ghost power-up
 * @property {string} points - Color for points power-up
 * @property {string} slow - Color for slow power-up
 */

/**
 * @typedef {Object} PowerUpEffectConfig
 * @property {number} [speedMultiplier] - Speed multiplier for speed power-up
 * @property {boolean} [ghostMode] - Ghost mode enabled for ghost power-up
 * @property {number} [pointsMultiplier] - Points multiplier for points power-up
 * @property {number} [slowMultiplier] - Speed reduction for slow power-up
 */

/**
 * @typedef {Object} PowerUpConfig
 * @property {PowerUpType[]} types - Available power-up types
 * @property {number} spawnChance - Chance of spawning a power-up (0-1)
 * @property {number} duration - Default duration of power-up effects
 * @property {Record<PowerUpType, PowerUpEffectConfig>} effects - Effect configurations per type
 * @property {PowerUpColors} colors - Colors for each power-up type
 */

/**
 * @typedef {Object} PowerUpEventData
 * @property {PowerUpType} type - Type of power-up
 * @property {number} duration - Duration of the effect
 * @property {boolean} active - Whether the effect is active
 * @property {number} remainingTime - Time remaining for the effect
 */

export const PowerUpTypes = /** @type {const} */ ({
    SPEED: 'speed',
    GHOST: 'ghost',
    POINTS: 'points',
    SLOW: 'slow'
});

/**
 * @type {Record<PowerUpType, PowerUpEffectConfig>}
 */
export const DefaultEffectConfigs = {
    speed: {
        speedMultiplier: 1.5
    },
    ghost: {
        ghostMode: true
    },
    points: {
        pointsMultiplier: 2.0
    },
    slow: {
        slowMultiplier: 0.5
    }
};

/**
 * Validates a power-up type
 * @param {string} type - Type to validate
 * @returns {type is PowerUpType} Whether the type is valid
 */
export function isValidPowerUpType(type) {
    return Object.values(PowerUpTypes).includes(/** @type {PowerUpType} */ (type));
}

/**
 * Creates a new power-up effect
 * @param {PowerUpType} type - Type of power-up
 * @param {number} duration - Duration of the effect
 * @returns {PowerUpEffect} New power-up effect
 */
export function createPowerUpEffect(type, duration) {
    return {
        type,
        duration,
        startTime: Date.now(),
        active: true
    };
}

/**
 * Calculates remaining time for a power-up effect
 * @param {PowerUpEffect} effect - Power-up effect
 * @returns {number} Remaining time in milliseconds
 */
export function calculateRemainingTime(effect) {
    if (!effect.active) return 0;
    const elapsed = Date.now() - effect.startTime;
    return Math.max(0, effect.duration - elapsed);
}

/**
 * Creates power-up event data
 * @param {PowerUpEffect} effect - Power-up effect
 * @returns {PowerUpEventData} Event data
 */
export function createPowerUpEventData(effect) {
    return {
        type: effect.type,
        duration: effect.duration,
        active: effect.active,
        remainingTime: calculateRemainingTime(effect)
    };
}
