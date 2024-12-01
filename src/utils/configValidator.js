/**
 * Configuration validation rules
 */
export const validationRules = {
    // Display settings
    gameMode: (value) => ['windowed', 'fullscreen'].includes(value),
    cellSize: (value) => value >= 10 && value <= 50 && Number.isInteger(value),
    showGrid: (value) => typeof value === 'boolean',
    backgroundColor: (value) => /^#[0-9A-Fa-f]{6}$/.test(value),
    gridColor: (value) => /^#[0-9A-Fa-f]{6}$/.test(value),
    
    // Snake settings
    snakeColor: (value) => /^#[0-9A-Fa-f]{6}$/.test(value),
    snakeHeadColor: (value) => /^#[0-9A-Fa-f]{6}$/.test(value),
    initialDirection: (value) => ['up', 'down', 'left', 'right'].includes(value),
    initialLength: (value) => value >= 2 && value <= 10 && Number.isInteger(value),
    allowWallPhasing: (value) => typeof value === 'boolean',
    
    // Speed settings
    baseSpeed: (value) => value >= 1 && value <= 15 && Number.isFinite(value),
    minSpeed: (value) => value >= 1 && value <= 15 && Number.isFinite(value),
    maxSpeed: (value) => value >= 1 && value <= 15 && Number.isFinite(value),
    enableSpeedProgression: (value) => typeof value === 'boolean',
    speedProgressionThreshold: (value) => value >= 1 && value <= 50 && Number.isInteger(value),
    speedProgressionIncrease: (value) => value >= 0.1 && value <= 2.0 && Number.isFinite(value),
    maxSpeedMultiplier: (value) => value >= 1 && value <= 5 && Number.isFinite(value),
    
    // Food settings
    foodColors: (value) => Array.isArray(value) && value.every(color => /^#[0-9A-Fa-f]{6}$/.test(color)),
    basePoints: (value) => value >= 1 && value <= 100 && Number.isInteger(value),
    specialFoodEnabled: (value) => typeof value === 'boolean',
    foodValues: (value) => Array.isArray(value) && value.every(v => Number.isInteger(v) && v >= 1),
    foodWeights: (value) => Array.isArray(value) && value.every(w => Number.isFinite(w) && w >= 0),
    
    // Power-up settings
    powerUpEnabled: (value) => typeof value === 'boolean',
    powerUpTypes: (value) => Array.isArray(value) && value.every(type => ['speed', 'slow', 'ghost', 'points'].includes(type)),
    powerUpDuration: (value) => value >= 1000 && value <= 30000 && Number.isInteger(value),
    powerUpSpawnChance: (value) => value >= 0 && value <= 1 && Number.isFinite(value),
    powerUpSpeedColor: (value) => /^#[0-9A-Fa-f]{6}$/.test(value),
    powerUpSlowColor: (value) => /^#[0-9A-Fa-f]{6}$/.test(value),
    powerUpGhostColor: (value) => /^#[0-9A-Fa-f]{6}$/.test(value),
    powerUpPointsColor: (value) => /^#[0-9A-Fa-f]{6}$/.test(value),
    powerUpSpeedMultiplier: (value) => value >= 1 && value <= 3 && Number.isFinite(value),
    powerUpPointsMultiplier: (value) => value >= 1 && value <= 5 && Number.isFinite(value),
    
    // Combo settings
    comboTimeWindow: (value) => value >= 500 && value <= 5000 && Number.isInteger(value),
    comboMultiplier: (value) => value >= 1 && value <= 3 && Number.isFinite(value),
    
    // Debug settings
    debug: (value) => typeof value === 'boolean',
    debugLevel: (value) => value >= 1 && value <= 3 && Number.isInteger(value)
};

/**
 * Validates a configuration object against the rules
 * @param {Object} config - Configuration object to validate
 * @returns {Object} Validation result with errors and warnings
 */
export function validateConfig(config) {
    const result = {
        isValid: true,
        errors: [],
        warnings: []
    };

    // Check for required properties
    const requiredProps = [
        'gameMode',
        'cellSize',
        'backgroundColor',
        'snakeColor',
        'baseSpeed',
        'initialLength'
    ];

    for (const prop of requiredProps) {
        if (!(prop in config)) {
            result.errors.push(`Missing required property: ${prop}`);
            result.isValid = false;
        }
    }

    // Validate each property
    for (const [key, value] of Object.entries(config)) {
        const rule = validationRules[key];
        if (rule) {
            try {
                if (!rule(value)) {
                    result.errors.push(`Invalid value for ${key}: ${value}`);
                    result.isValid = false;
                }
            } catch (error) {
                result.errors.push(`Error validating ${key}: ${error.message}`);
                result.isValid = false;
            }
        } else {
            result.warnings.push(`Unknown configuration property: ${key}`);
        }
    }

    // Check for logical conflicts
    if (config.minSpeed > config.maxSpeed) {
        result.errors.push('minSpeed cannot be greater than maxSpeed');
        result.isValid = false;
    }

    if (config.baseSpeed < config.minSpeed || config.baseSpeed > config.maxSpeed) {
        result.errors.push('baseSpeed must be between minSpeed and maxSpeed');
        result.isValid = false;
    }

    if (config.foodValues && config.foodWeights && 
        config.foodValues.length !== config.foodWeights.length) {
        result.errors.push('foodValues and foodWeights arrays must have the same length');
        result.isValid = false;
    }

    return result;
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
