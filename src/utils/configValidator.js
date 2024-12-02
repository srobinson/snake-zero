/**
 * Configuration validation rules
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
 * Validates a configuration object against the rules
 * @param {Object} config - Configuration object to validate
 * @param {Object} rules - Validation rules
 * @returns {Array} Array of validation errors
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
 * Deep merges two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
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
