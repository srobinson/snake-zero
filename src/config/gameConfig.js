import { validateConfig, deepMerge, validationRules } from '../utils/configValidator.js';
import { applyDataAttributes } from '../utils/dataAttributeParser.js';

// Type definitions
/** @typedef {Object} SnakeControls
 * @property {string[]} up - Keys for moving up
 * @property {string[]} down - Keys for moving down
 * @property {string[]} left - Keys for moving left
 * @property {string[]} right - Keys for moving right
 */

/** @typedef {Object} DebugControls
 * @property {Object} spawn - Spawn control keys
 * @property {string} spawn.speed - Speed spawn key
 * @property {string} spawn.ghost - Ghost spawn key
 * @property {string} spawn.points - Points spawn key
 * @property {Object} snake - Snake control keys
 * @property {string} snake.grow - Grow snake key
 * @property {Object} board - Board control keys
 * @property {string} board.small - Small board key
 * @property {string} board.medium - Medium board key
 * @property {string} board.large - Large board key
 * @property {string} board.fullscreen - Fullscreen board key
 * @property {Object} grid - Grid control keys
 * @property {string} grid.increaseCellSize - Increase cell size key
 * @property {string} grid.decreaseCellSize - Decrease cell size key
 */

/** @typedef {Object} DebugVectors
 * @property {string} color - Vector color
 * @property {number} thickness - Vector line thickness
 * @property {number} headLength - Vector head length
 * @property {number} opacity - Vector opacity
 * @property {number} scale - Vector scale in pixels per unit of speed
 */

/** @typedef {Object} DebugConfig
 * @property {boolean} enabled - Enable debug mode
 * @property {boolean} showFPS - Show FPS counter
 * @property {boolean} showSnakeInfo - Show snake information
 * @property {boolean} showGridInfo - Show grid information
 * @property {boolean} showEffects - Show visual effects
 * @property {boolean} showControls - Show control information
 * @property {boolean} showVectors - Show direction vectors
 * @property {'top-right'|'top-left'|'bottom-right'|'bottom-left'} position - Debug panel position
 * @property {string} backgroundColor - Debug panel background color
 * @property {string} textColor - Debug text color
 * @property {number} fontSize - Debug text size
 * @property {number} padding - Debug panel padding
 * @property {string[]} shortcutKey - Keys to toggle debug panel
 * @property {DebugControls} controls - Debug control keybindings
 * @property {DebugVectors} vectors - Vector visualization settings
 */

/** @typedef {Object} BoardPreset
 * @property {number} width - Board width in pixels
 * @property {number} height - Board height in pixels
 * @property {number} cellSize - Size of each grid cell
 */

/** @typedef {Object} BoardConfig
 * @property {'small'|'medium'|'large'|'fullscreen'} preset - Board size preset
 * @property {Object.<string, BoardPreset>} presets - Predefined board configurations
 * @property {number} width - Board width in pixels
 * @property {number} height - Board height in pixels
 * @property {number} cellSize - Size of each grid cell
 * @property {string} backgroundColor - Board background color
 * @property {string} gridColor - Grid line color
 */

/** @typedef {Object} DifficultyPreset
 * @property {number} baseSpeed - Base movement speed
 * @property {number} powerUpChance - Chance of power-up spawning
 */

/** @typedef {Object} DifficultyConfig
 * @property {'easy'|'normal'|'hard'} current - Current difficulty level
 * @property {Object.<string, DifficultyPreset>} presets - Difficulty preset configurations
 */

/** @typedef {Object} SnakeColors
 * @property {string} head - Head color
 * @property {string} body - Body color
 * @property {string} highlight - Highlight color
 * @property {string} shadow - Shadow color
 * @property {string} glow - Glow effect color
 * @property {string} eyes - Eyes color
 * @property {string} pupil - Pupil color
 * @property {string} tongue - Tongue color
 */

/** @typedef {Object} SnakeSegments
 * @property {number} size - Body segment size relative to cell
 * @property {number} headSize - Head size relative to cell
 * @property {number} headLength - Length of the snake's head
 * @property {number} elevation - Elevation/height of the snake segments
 * @property {number} cornerRadius - Radius for rounded corners
 * @property {number} eyeSize - Size of the snake's eyes
 * @property {number} pupilSize - Size of the snake's pupils
 * @property {number} tongueLength - Length of the snake's tongue
 * @property {number} tongueWidth - Width of the snake's tongue
 * @property {number} tongueSpeed - Speed of tongue animation
 * @property {number} tongueWagRange - Range of tongue wagging motion
 */

/** @typedef {Object} SpeedProgression
 * @property {boolean} enabled - Whether speed progression is enabled
 * @property {number} increasePerFood - Speed increase per food eaten
 * @property {number} maxSpeed - Maximum speed cap
 * @property {number} initialSpeedBoost - Speed power-up multiplier
 * @property {number} slowEffect - Slow power-up multiplier
 */

/** @typedef {Object} SnakeConfig
 * @property {number} initialLength - Starting length of snake
 * @property {'up'|'down'|'left'|'right'} initialDirection - Starting direction
 * @property {number} baseSpeed - Base movement speed
 * @property {SpeedProgression} speedProgression - Speed increase settings
 * @property {SnakeColors} colors - Snake color scheme
 * @property {SnakeSegments} segments - Snake segment size settings
 * @property {SnakeControls} controls - Snake movement controls
 */

/** @typedef {Object} PowerUpEffects
 * @property {Object} speed - Speed power-up settings
 * @property {Object} ghost - Ghost power-up settings
 * @property {Object} points - Points power-up settings
 */

/** @typedef {Object} PowerUpColors
 * @property {string} speed - Speed power-up color
 * @property {string} ghost - Ghost power-up color
 * @property {string} points - Points power-up color
 */

/** @typedef {'speed'|'ghost'|'points'|'slow'} PowerUpType */

/** @typedef {Object} PowerUpConfig
 * @property {PowerUpType[]} types - Available power-up types
 * @property {number} spawnChance - Chance of power-up spawning
 * @property {number} duration - Base duration of power-ups
 * @property {PowerUpEffects} effects - Power-up effect configurations
 * @property {PowerUpColors} colors - Power-up colors
 */

/** @typedef {Object} FoodConfig
 * @property {Object} colors - Food color configuration
 * @property {string[]} colors - Array of food colors
 */

/** @typedef {Object} ScoringConfig
 * @property {number} basePoints - Base points awarded for collecting food
 * @property {number} multiplierIncrease - How much the multiplier increases per food collected
 */

/** @typedef {Object} GameConfig
 * @property {DebugConfig} debug - Debug settings
 * @property {BoardConfig} board - Board configuration
 * @property {DifficultyConfig} difficulty - Difficulty settings
 * @property {SnakeConfig} snake - Snake configuration
 * @property {PowerUpConfig} powerUps - Power-up settings
 * @property {FoodConfig} food - Food configuration
 * @property {ScoringConfig} scoring - Scoring configuration
 */

/**
 * @typedef {Object} GameData
 * @property {GameConfig} config - Game configuration
 * @property {Object} grid - Game grid object
 * @property {Function} [grid.updateDimensions] - Update grid dimensions
 */

/**
 * Augment the global Window interface
 * @global
 * @typedef {Window & { game?: GameData }} CustomWindow
 */

/**
 * Global window reference with game type
 * @type {CustomWindow}
 */
const win = window;

/**
 * @type {GameConfig}
 */
export const defaultConfig = {
    debug: {
        enabled: true,
        showFPS: true,
        showSnakeInfo: true,
        showGridInfo: true,
        showEffects: true,
        showControls: true,
        showVectors: false,
        position: 'top-right',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        textColor: '#ffffff',
        fontSize: 14,
        padding: 10,
        shortcutKey: ['`', 'd'],
        controls: {
            spawn: {
                speed: '1',
                ghost: '2',
                points: '3'
            },
            snake: {
                grow: 's'
            },
            board: {
                small: 'q',
                medium: 'w',
                large: 'e',
                fullscreen: 'r'
            },
            grid: {
                increaseCellSize: '=',
                decreaseCellSize: '-'
            }
        },
        vectors: {
            color: '#FF5722',
            thickness: 2,
            headLength: 10,
            opacity: 0.8,
            scale: 30
        }
    },
    board: {
        preset: 'medium',
        presets: {
            small: { width: 400, height: 400, cellSize: 20 },
            medium: { width: 800, height: 600, cellSize: 20 },
            large: { width: 1200, height: 800, cellSize: 20 },
            fullscreen: { width: window.innerWidth, height: window.innerHeight, cellSize: 20 }
        },
        width: 800,
        height: 600,
        cellSize: 20,
        backgroundColor: '#000000',
        gridColor: '#111111'
    },
    difficulty: {
        current: 'easy',
        presets: {
            easy: {
                baseSpeed: 5,
                powerUpChance: 0.02
            },
            normal: {
                baseSpeed: 8,
                powerUpChance: 0.01
            },
            hard: {
                baseSpeed: 12,
                powerUpChance: 0.005
            }
        }
    },
    snake: {
        initialLength: 3,
        initialDirection: 'right',
        baseSpeed: 8,
        speedProgression: {
            enabled: true,
            increasePerFood: 0.2,
            maxSpeed: 15,
            initialSpeedBoost: 1.5,
            slowEffect: 0.5
        },
        colors: {
            head: '#4CAF50',
            body: '#2E7D32',
            highlight: '#A5D6A7',
            shadow: '#1B5E20',
            glow: 'rgba(76, 175, 80, 0.2)',
            eyes: '#FFFFFF',
            pupil: '#000000',
            tongue: '#FF0000'
        },
        segments: {
            size: 0.85,
            headSize: 0.95,
            headLength: 1,
            elevation: 0,
            cornerRadius: 0,
            eyeSize: 0,
            pupilSize: 0,
            tongueLength: 0,
            tongueWidth: 0,
            tongueSpeed: 0,
            tongueWagRange: 0
        },
        controls: {
            up: ['ArrowUp', 'w', 'W'],
            down: ['ArrowDown', 's', 'S'],
            left: ['ArrowLeft', 'a', 'A'],
            right: ['ArrowRight', 'd', 'D']
        }
    },
    powerUps: {
        types: ['speed', 'ghost', 'points'],
        spawnChance: 0.01,
        duration: 10000,
        effects: {
            speed: {
                multiplier: 1.5,
                duration: 5000
            },
            ghost: {
                duration: 8000
            },
            points: {
                multiplier: 2,
                duration: 10000
            }
        },
        colors: {
            speed: '#ff0000',
            ghost: '#00ffff',
            points: '#ffff00'
        }
    },
    food: {
        colors: ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3']
    },
    scoring: {
        basePoints: 10,
        multiplierIncrease: 0.1
    }
};

// Initialize the game object with proper typing
/** @type {GameData} */
const gameObject = {
    config: defaultConfig,
    grid: {
        updateDimensions: () => {}  // Default empty function
    }
};

// Initialize window.game if it doesn't exist
win.game = win.game || gameObject;

/**
 * Deep recursive comparison of objects
 * @param {Object} current - Current object
 * @param {Object} def - Default object to compare against
 * @param {string} [path=''] - Current path in object hierarchy
 * @returns {Object} Object containing only the differences
 */
function compareObjects(current, def, path = '') {
    /** @type {Object} */
    const diff = {};
    
    for (const key in current) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in def)) {
            diff[key] = current[key];
            continue;
        }

        const currentValue = current[key];
        const defaultValue = def[key];

        if (typeof currentValue === 'object' && currentValue !== null &&
            typeof defaultValue === 'object' && defaultValue !== null) {
            const nestedDiff = compareObjects(currentValue, defaultValue, currentPath);
            if (Object.keys(nestedDiff).length > 0) {
                diff[key] = nestedDiff;
            }
        } else if (currentValue !== defaultValue) {
            diff[key] = currentValue;
        }
    }

    return diff;
}

/**
 * Configuration manager class for handling game settings
 * @class
 */
export class ConfigManager {
    /**
     * Initialize configuration sources
     */
    constructor() {
        /** @type {{ default: GameConfig | null, localStorage: GameConfig | null, dataAttributes: GameConfig | null }} */
        this.sources = {
            default: null,
            localStorage: null,
            dataAttributes: null
        };
        
        /** @type {GameConfig} */
        this.config = {
            debug: {
                enabled: false,
                showFPS: false,
                showSnakeInfo: false,
                showGridInfo: false,
                showEffects: false,
                showControls: false,
                showVectors: false,
                position: 'top-right',
                backgroundColor: '#000000',
                textColor: '#ffffff',
                fontSize: 12,
                padding: 10,
                shortcutKey: ['F3'],
                controls: {
                    spawn: {
                        speed: 'KeyS',
                        ghost: 'KeyG',
                        points: 'KeyP'
                    },
                    snake: {
                        grow: 'KeyR'
                    },
                    board: {
                        small: 'Digit1',
                        medium: 'Digit2',
                        large: 'Digit3',
                        fullscreen: 'KeyF'
                    },
                    grid: {
                        increaseCellSize: 'Equal',
                        decreaseCellSize: 'Minus'
                    }
                },
                vectors: {
                    color: '#ff0000',
                    thickness: 2,
                    headLength: 10,
                    opacity: 0.7,
                    scale: 20
                }
            },
            board: {
                preset: 'medium',
                presets: {
                    small: { width: 400, height: 300, cellSize: 20 },
                    medium: { width: 800, height: 600, cellSize: 20 },
                    large: { width: 1200, height: 900, cellSize: 20 }
                },
                width: 800,
                height: 600,
                cellSize: 20,
                backgroundColor: '#ffffff',
                gridColor: '#e0e0e0'
            },
            difficulty: {
                current: 'normal',
                presets: {
                    easy: { baseSpeed: 3, powerUpChance: 0.3 },
                    normal: { baseSpeed: 5, powerUpChance: 0.2 },
                    hard: { baseSpeed: 7, powerUpChance: 0.1 }
                }
            },
            snake: {
                initialLength: 3,
                initialDirection: 'right',
                baseSpeed: 5,
                speedProgression: {
                    enabled: false,
                    increasePerFood: 0.1,
                    maxSpeed: 10,
                    initialSpeedBoost: 1.5,
                    slowEffect: 0.5
                },
                colors: {
                    head: '#4CAF50',
                    body: '#81C784',
                    highlight: '#A5D6A7',
                    shadow: '#2E7D32',
                    glow: '#B9F6CA',
                    eyes: '#FFFFFF',
                    pupil: '#000000',
                    tongue: '#FF1744'
                },
                segments: {
                    size: 0.8,
                    headSize: 1,
                    headLength: 1,
                    elevation: 0,
                    cornerRadius: 0,
                    eyeSize: 0,
                    pupilSize: 0,
                    tongueLength: 0,
                    tongueWidth: 0,
                    tongueSpeed: 0,
                    tongueWagRange: 0
                },
                controls: {
                    up: ['ArrowUp', 'KeyW'],
                    down: ['ArrowDown', 'KeyS'],
                    left: ['ArrowLeft', 'KeyA'],
                    right: ['ArrowRight', 'KeyD']
                }
            },
            powerUps: {
                types: ['speed', 'ghost', 'points'],
                spawnChance: 0.2,
                duration: 5000,
                effects: {
                    speed: {},
                    ghost: {},
                    points: {}
                },
                colors: {
                    speed: '#FFD700',
                    ghost: '#4527A0',
                    points: '#00BCD4'
                }
            },
            food: {
                colors: ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3']
            },
            scoring: {
                basePoints: 10,
                multiplierIncrease: 0.1
            }
        };
        
        // Load configurations in order of increasing priority
        this.loadDefaultConfig();
        this.loadFromLocalStorage();
        this.loadFromDataAttributes();
        
        // Merge configurations according to priority
        this.mergeConfigurations();
    }

    /**
     * Load default configuration
     */
    loadDefaultConfig() {
        this.sources.default = { ...defaultConfig };
        this.config = { ...defaultConfig };
    }

    /**
     * Load configuration from local storage
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('snakeGameConfig');
            if (!saved) return;

            const savedConfig = JSON.parse(saved);
            
            // Validate saved configuration
            const errors = validateConfig(savedConfig);
            if (errors.length > 0) {
                console.warn('Saved configuration validation errors:', errors);
                return;
            }

            // Store valid localStorage config
            this.sources.localStorage = savedConfig;
        } catch (error) {
            console.error('Failed to load configuration from localStorage:', error);
        }
    }

    /**
     * Load configuration from data attributes
     */
    loadFromDataAttributes() {
        const container = document.getElementById('snaked-again-container');
        if (!container) return;

        const dataConfig = applyDataAttributes(this.config, container);
        if (!dataConfig) return;

        // Store valid data attributes config
        this.sources.dataAttributes = dataConfig;
        
        // Update grid dimensions immediately if game exists
        const typedWindow = /** @type {CustomWindow} */ (window);
        if (typedWindow.game?.grid?.updateDimensions) {
            typedWindow.game.grid.updateDimensions();
        }
    }

    /**
     * Merge configurations according to priority
     */
    mergeConfigurations() {
        // Start with default configuration
        this.config = { ...this.sources.default };

        // Merge localStorage config (middle priority)
        if (this.sources.localStorage) {
            this.config = deepMerge(this.config, this.sources.localStorage);
        }

        // Merge data attributes config (highest priority)
        if (this.sources.dataAttributes) {
            this.config = deepMerge(this.config, this.sources.dataAttributes);
        }

        // Final validation of merged configuration
        const errors = validateConfig(this.config);
        if (errors.length > 0) {
            console.error('Final configuration validation errors:', errors);
            // Fallback to default configuration
            this.config = { ...this.sources.default };
            console.warn('Falling back to default configuration');
        }
    }

    /**
     * Get the current configuration
     * @returns {GameConfig} Current configuration
     */
    getConfig() {
        return this.config;
    }

    /**
     * Override the current configuration with a custom configuration
     * @param {GameConfig} customConfig Custom configuration to override with
     * @returns {boolean} Whether the override was successful
     */
    override(customConfig) {
        // Validate custom configuration
        const errors = validateConfig(customConfig);
        if (errors.length > 0) {
            console.error('Custom configuration validation errors:', errors);
            return false;
        }

        // Apply override with highest priority
        this.config = deepMerge(this.config, customConfig);
        return true;
    }

    /**
     * Reset the configuration to its default state
     */
    reset() {
        // Clear all sources except default
        this.sources.localStorage = null;
        this.sources.dataAttributes = null;
        
        // Reset to default configuration
        this.config = { ...this.sources.default };
        
        // Clear localStorage
        localStorage.removeItem('snakeGameConfig');
    }

    /**
     * Save the current configuration to local storage
     * @returns {boolean} Whether the save was successful
     */
    saveToLocalStorage() {
        try {
            // Only save non-default values
            const diffConfig = this.getDifferenceFromDefault();
            if (Object.keys(diffConfig).length > 0) {
                localStorage.setItem('snakeGameConfig', JSON.stringify(diffConfig));
            } else {
                localStorage.removeItem('snakeGameConfig');
            }
            return true;
        } catch (error) {
            console.error('Failed to save configuration:', error);
            return false;
        }
    }

    /**
     * Get the difference between the current configuration and the default configuration
     * @returns {Partial<GameConfig>} Difference between current and default configurations
     */
    getDifferenceFromDefault() {
        /** @type {Partial<GameConfig>} */
        const diff = {};
        
        const compareObjects = (current, def, path = '') => {
            for (const key in current) {
                const currentValue = current[key];
                const defaultValue = def[key];
                const newPath = path ? `${path}.${key}` : key;

                if (typeof currentValue === 'object' && currentValue !== null &&
                    typeof defaultValue === 'object' && defaultValue !== null) {
                    const subDiff = compareObjects(currentValue, defaultValue, newPath);
                    if (Object.keys(subDiff).length > 0) {
                        diff[key] = subDiff;
                    }
                } else if (currentValue !== defaultValue) {
                    if (!path) {
                        diff[key] = currentValue;
                    } else {
                        let target = diff;
                        const parts = path.split('.');
                        parts.forEach((part, index) => {
                            if (index === parts.length - 1) {
                                target[key] = currentValue;
                            } else {
                                target[part] = target[part] || {};
                                target = target[part];
                            }
                        });
                    }
                }
            }
            return diff;
        };

        return compareObjects(this.config, this.sources.default);
    }

    /**
     * Get the configuration sources
     * @returns {Object} Configuration sources
     */
    getConfigurationSources() {
        return {
            default: this.sources.default,
            localStorage: this.sources.localStorage,
            dataAttributes: this.sources.dataAttributes,
            final: this.config
        };
    }
}

export default new ConfigManager();
