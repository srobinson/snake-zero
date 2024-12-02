/**
 * @typedef {Object} ValidationRules
 * @property {Object} board - Board configuration validation rules
 * @property {Function} board.preset - Validates board preset value
 * @property {Function} board.width - Validates board width
 * @property {Function} board.height - Validates board height
 * @property {Function} board.cellSize - Validates cell size
 * @property {Function} board.backgroundColor - Validates background color hex code
 * @property {Function} board.gridColor - Validates grid color hex code
 * @property {Object} snake - Snake configuration validation rules
 * @property {Function} snake.initialLength - Validates initial snake length
 * @property {Function} snake.baseSpeed - Validates base speed
 * @property {Object} snake.speedProgression - Speed progression validation rules
 * @property {Function} snake.speedProgression.enabled - Validates if speed progression is enabled
 * @property {Function} snake.speedProgression.increasePerFood - Validates speed increase per food
 * @property {Function} snake.speedProgression.maxSpeed - Validates maximum speed
 * @property {Function} snake.speedProgression.initialSpeedBoost - Validates initial speed boost
 * @property {Function} snake.speedProgression.slowEffect - Validates slow effect value
 */

/**
 * Predefined validation rules for game configuration
 * @type {ValidationRules}
 */
export const validationRules = {
    board: {
        preset: (value) => ['small', 'medium', 'large', 'fullscreen'].includes(value),
        width: (value) => value > 0 && Number.isInteger(value),
        height: (value) => value > 0 && Number.isInteger(value),
        cellSize: (value) => value > 0 && Number.isInteger(value),
        backgroundColor: (value) => /^#[0-9A-Fa-f]{6}$/.test(value),
        gridColor: (value) => /^#[0-9A-Fa-f]{6}$/.test(value)
    },
    snake: {
        initialLength: (value) => value >= 2 && Number.isInteger(value),
        baseSpeed: (value) => value > 0 && value <= 20,
        speedProgression: {
            enabled: (value) => typeof value === 'boolean',
            increasePerFood: (value) => value >= 0 && value <= 1,
            maxSpeed: (value) => value > 0 && value <= 30,
            initialSpeedBoost: (value) => value > 0 && value <= 3,
            slowEffect: (value) => value > 0 && value <= 1
        }
    }
};

/**
 * Validates a configuration object against the specified rules
 * @param {Object} config - Configuration object to validate
 * @param {ValidationRules} [rules=validationRules] - Validation rules to check against
 * @returns {string[]} Array of validation error messages
 * @example
 * const config = {
 *   board: { preset: 'small', width: 20, height: 20 },
 *   snake: { initialLength: 3 }
 * };
 * const errors = validateConfig(config);
 * if (errors.length > 0) console.error(errors);
 */
export function validateConfig(config, rules = validationRules) {
    const errors = [];

    function validateObject(obj, rulesObj, path = '') {
        for (const [key, rule] of Object.entries(rulesObj)) {
            const value = obj[key];
            const currentPath = path ? `${path}.${key}` : key;

            if (typeof rule === 'function') {
                if (!rule(value)) {
                    errors.push(`Invalid value for ${currentPath}: ${value}`);
                }
            } else if (typeof rule === 'object' && value) {
                validateObject(value, rule, currentPath);
            }
        }
    }

    validateObject(config, rules);
    return errors;
}

/**
 * Deep merges two objects, creating a new object without modifying the originals
 * @param {Object} target - Target object to merge into
 * @param {Object} source - Source object to merge from
 * @returns {Object} A new object containing the merged properties
 * @example
 * const defaultConfig = { speed: 1, color: '#000' };
 * const userConfig = { speed: 2 };
 * const finalConfig = deepMerge(defaultConfig, userConfig);
 * // Result: { speed: 2, color: '#000' }
 */
export function deepMerge(target, source) {
    const result = { ...target };

    for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (result[key] && typeof result[key] === 'object') {
                result[key] = deepMerge(result[key], value);
            } else {
                result[key] = deepMerge({}, value);
            }
        } else {
            result[key] = value;
        }
    }

    return result;
}
