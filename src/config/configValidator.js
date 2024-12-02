/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the validation passed
 * @property {string[]} errors - Array of error messages
 * @property {string[]} warnings - Array of warning messages
 * @property {Object} details - Detailed validation information
 */

/**
 * Validates a color string in hex format
 * @param {string} value - Color value to validate
 * @param {boolean} [alpha=false] - Whether to allow alpha channel
 * @returns {boolean} Whether the color is valid
 */
function isValidColor(value, alpha = false) {
    const hexPattern = alpha ? /^#[0-9A-Fa-f]{8}$/ : /^#[0-9A-Fa-f]{6}$/;
    const rgbaPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*(?:0|1|0?\.\d+))?\s*\)$/;
    return typeof value === 'string' && (hexPattern.test(value) || rgbaPattern.test(value));
}

/**
 * Validates a numeric value within a range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {boolean} [integer=false] - Whether the value must be an integer
 * @returns {boolean} Whether the value is valid
 */
function isValidNumber(value, min, max, integer = false) {
    if (typeof value !== 'number' || isNaN(value)) return false;
    if (integer && !Number.isInteger(value)) return false;
    return value >= min && value <= max;
}

/**
 * Enhanced validation rules for game configuration
 * @type {Object}
 */
export const validationRules = {
    board: {
        preset: {
            validate: (value) => ['small', 'medium', 'large', 'fullscreen'].includes(value),
            message: "Board preset must be one of: 'small', 'medium', 'large', 'fullscreen'",
            required: true
        },
        width: {
            validate: (value) => isValidNumber(value, 200, 3840, true),
            message: "Board width must be an integer between 200 and 3840",
            required: true
        },
        height: {
            validate: (value) => isValidNumber(value, 200, 2160, true),
            message: "Board height must be an integer between 200 and 2160",
            required: true
        },
        cellSize: {
            validate: (value) => isValidNumber(value, 10, 100, true),
            message: "Cell size must be an integer between 10 and 100",
            required: true
        },
        backgroundColor: {
            validate: (value) => isValidColor(value),
            message: "Background color must be a valid hex color code",
            required: true
        },
        gridColor: {
            validate: (value) => isValidColor(value),
            message: "Grid color must be a valid hex color code",
            required: true
        }
    },
    food: {
        types: {
            validate: (value) => Array.isArray(value) && value.every(type => 
                ['regular', 'bonus', 'golden'].includes(type)
            ),
            message: "Food types must be an array containing valid food types: 'regular', 'bonus', 'golden'",
            required: true
        },
        spawnRates: {
            validate: (obj) => {
                if (!obj || typeof obj !== 'object') return false;
                const requiredTypes = ['regular', 'bonus', 'golden'];
                
                // Check that all required types are present with valid rates
                const hasValidRates = requiredTypes.every(type => {
                    const rate = obj[type];
                    return typeof rate === 'number' && !isNaN(rate) && rate >= 0 && rate <= 1;
                });
                if (!hasValidRates) return false;

                // Calculate sum of rates, handling floating point precision
                const sum = Object.values(obj).reduce((acc, rate) => acc + (typeof rate === 'number' ? rate : 0), 0);
                return Math.abs(sum - 1) < Number.EPSILON;
            },
            message: "Spawn rates must be defined for all food types and sum to 1",
            required: true
        },
        points: {
            validate: (obj) => {
                const requiredTypes = ['regular', 'bonus', 'golden'];
                return (
                    obj && 
                    typeof obj === 'object' &&
                    requiredTypes.every(type => 
                        typeof obj[type] === 'number' && 
                        obj[type] > 0 && 
                        Number.isInteger(obj[type])
                    )
                );
            },
            message: "Points must be positive integers for all food types",
            required: true
        },
        colors: {
            validate: (obj) => {
                const requiredTypes = ['regular', 'bonus', 'golden'];
                return (
                    obj && 
                    typeof obj === 'object' &&
                    requiredTypes.every(type => obj[type] && isValidColor(obj[type]))
                );
            },
            message: "Colors must include valid hex codes for all food types",
            required: true
        },
        bonusTimeout: {
            validate: (value) => isValidNumber(value, 1000, 30000),
            message: "Bonus food timeout must be between 1000 and 30000 milliseconds",
            required: false
        }
    },
    scoring: {
        basePoints: {
            validate: (value) => isValidNumber(value, 1, 1000, true),
            message: "Base points must be an integer between 1 and 1000",
            required: true
        },
        multiplierRules: {
            validate: (arr) => 
                Array.isArray(arr) && 
                arr.every(rule => 
                    typeof rule === 'object' &&
                    typeof rule.threshold === 'number' &&
                    rule.threshold > 0 &&
                    typeof rule.multiplier === 'number' &&
                    rule.multiplier >= 1
                ),
            message: "Multiplier rules must be an array of valid threshold/multiplier pairs",
            required: true
        },
        bonusConditions: {
            validate: (arr) => 
                Array.isArray(arr) && 
                arr.every(condition => 
                    typeof condition === 'object' &&
                    typeof condition.type === 'string' &&
                    ['speed', 'noWalls', 'perfectRun'].includes(condition.type) &&
                    typeof condition.bonus === 'number' &&
                    condition.bonus > 0
                ),
            message: "Bonus conditions must be an array of valid type/bonus pairs",
            required: true
        },
        highScores: {
            maxEntries: {
                validate: (value) => isValidNumber(value, 1, 100, true),
                message: "Max high score entries must be an integer between 1 and 100",
                required: true
            },
            persistLocal: {
                validate: (value) => typeof value === 'boolean',
                message: "Persist local must be a boolean",
                required: true
            }
        }
    },
    powerUps: {
        types: {
            validate: (value) => Array.isArray(value) && value.every(type => 
                ['speed', 'ghost', 'points', 'slow'].includes(type)
            ),
            message: "Power-up types must be an array containing valid power-up types",
            required: true
        },
        spawnChance: {
            validate: (value) => isValidNumber(value, 0, 1),
            message: "Spawn chance must be a number between 0 and 1",
            required: true
        },
        duration: {
            validate: (value) => isValidNumber(value, 1000, 30000),
            message: "Duration must be between 1000 and 30000 milliseconds",
            required: true
        },
        effects: {
            required: true,
            speed: {
                speedMultiplier: {
                    validate: (value) => isValidNumber(value, 1, 3),
                    message: "Speed multiplier must be between 1 and 3",
                    required: true
                }
            },
            ghost: {
                ghostMode: {
                    validate: (value) => typeof value === 'boolean',
                    message: "Ghost mode must be a boolean",
                    required: true
                }
            },
            points: {
                pointsMultiplier: {
                    validate: (value) => isValidNumber(value, 1, 5),
                    message: "Points multiplier must be between 1 and 5",
                    required: true
                }
            },
            slow: {
                slowMultiplier: {
                    validate: (value) => isValidNumber(value, 0.1, 0.9),
                    message: "Slow multiplier must be between 0.1 and 0.9",
                    required: true
                }
            }
        },
        colors: {
            validate: (obj) => {
                const requiredTypes = ['speed', 'ghost', 'points', 'slow'];
                return (
                    obj && 
                    typeof obj === 'object' &&
                    requiredTypes.every(type => obj[type] && isValidColor(obj[type]))
                );
            },
            message: "Colors must include valid hex codes for all power-up types",
            required: true
        }
    },
    debug: {
        enabled: {
            validate: (value) => typeof value === 'boolean',
            message: "Debug enabled must be a boolean",
            required: true
        },
        position: {
            validate: (value) => ['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(value),
            message: "Debug position must be one of: 'top-right', 'top-left', 'bottom-right', 'bottom-left'",
            required: true
        },
        shortcutKey: {
            validate: (value) => Array.isArray(value) && value.every(key => typeof key === 'string'),
            message: "Shortcut key must be an array of strings",
            required: true
        }
    },
    difficulty: {
        current: {
            validate: (value) => ['easy', 'normal', 'hard'].includes(value),
            message: "Difficulty must be one of: 'easy', 'normal', 'hard'",
            required: true
        },
        presets: {
            validate: (obj) => {
                const requiredPresets = ['easy', 'normal', 'hard'];
                return (
                    obj && 
                    typeof obj === 'object' &&
                    requiredPresets.every(preset => 
                        obj[preset] && 
                        typeof obj[preset].baseSpeed === 'number' &&
                        typeof obj[preset].powerUpChance === 'number'
                    )
                );
            },
            message: "Difficulty presets must include valid configurations for all difficulty levels",
            required: true
        }
    }
};

/**
 * Deep merges two objects
 * @param {Object} target - Target object to merge into
 * @param {Object} source - Source object to merge from
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Validates a configuration object against the enhanced validation rules
 * @param {Object} config - Configuration object to validate
 * @param {Object} [rules=validationRules] - Validation rules to check against
 * @param {boolean} [isPartialUpdate=false] - Whether this is a partial config update
 * @returns {ValidationResult} Validation result object
 */
export function validateConfig(config, rules = validationRules, isPartialUpdate = false) {
    const result = {
        valid: true,
        errors: [],
        warnings: [],
        details: {}
    };

    function validateObject(obj, rulesObj, path = '') {
        // Skip validation for missing objects in partial updates
        if (!obj && isPartialUpdate) {
            return;
        }

        // First check if required object is missing (only for full config)
        if (!obj && !isPartialUpdate && Object.values(rulesObj).some(rule => rule.required)) {
            result.valid = false;
            result.errors.push(`${path}: Required configuration section is missing`);
            return;
        }

        for (const [key, rule] of Object.entries(rulesObj)) {
            const value = obj?.[key];
            const currentPath = path ? `${path}.${key}` : key;

            // Skip validation for optional fields that are not present
            if (value === undefined && !rule.required) {
                continue;
            }

            // Skip validation for missing required fields in partial updates
            if (value === undefined && isPartialUpdate) {
                continue;
            }

            // Required field is missing (only for full config)
            if (value === undefined && rule.required && !isPartialUpdate) {
                result.valid = false;
                result.errors.push(`${currentPath}: Required field is missing`);
                result.details[currentPath] = {
                    value,
                    valid: false,
                    message: 'Required field is missing'
                };
                continue;
            }

            // For required fields or present optional fields, validate the value
            if (value !== undefined && rule.validate) {
                if (!rule.validate(value)) {
                    result.valid = false;
                    result.errors.push(`${currentPath}: ${rule.message}`);
                    result.details[currentPath] = {
                        value,
                        valid: false,
                        message: rule.message
                    };
                }
            } else if (typeof rule === 'object' && !rule.validate && value !== undefined) {
                // For nested objects, validate if required or if value exists
                validateObject(value, rule, currentPath);
            }
        }
    }

    // Validate each section separately
    for (const [section, sectionRules] of Object.entries(rules)) {
        validateObject(config[section], sectionRules, section);
    }

    return result;
}

/**
 * Creates a type guard function for a specific configuration type
 * @template T
 * @param {string} typeName - Name of the type to guard
 * @param {Object} schema - Validation schema for the type
 * @returns {function(any): boolean} Type guard function
 */
export function createTypeGuard(typeName, schema) {
    return (value) => {
        const result = validateConfig({ [typeName]: value }, { [typeName]: schema });
        return result.valid;
    };
}
