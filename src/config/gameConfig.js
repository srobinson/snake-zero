import { validateConfig, deepMerge, validationRules } from './configValidator.js';
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
 * @property {string} spawn.slow - Slow spawn key
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
 * @property {Object} effects - Power-up visual effects
 * @property {Object} effects.speed - Speed power-up visual effects
 * @property {number} effects.speed.lineLength - Relative to cell size
 * @property {number} effects.speed.lineOpacity - Opacity of the line
 * @property {number} effects.speed.lineWidth - Width of the line
 * @property {Object} effects.ghost - Ghost power-up visual effects
 * @property {number} effects.ghost.opacity - Opacity of the ghost effect
 * @property {number} effects.ghost.glowRadius - Radius of the glow effect
 * @property {string} effects.ghost.glowColor - Color of the glow effect
 * @property {Object} effects.points - Points power-up visual effects
 * @property {number} effects.points.sparkleChance - Chance of sparkles appearing
 * @property {number} effects.points.sparkleSize - Relative to cell size
 * @property {number} effects.points.sparkleOpacity - Opacity of the sparkles
 * @property {Object} effects.slow - Slow power-up visual effects
 * @property {number} effects.slow.waveAmplitude - Relative to cell size
 * @property {number} effects.slow.waveFrequency - Frequency of the wave
 * @property {number} effects.slow.waveSpeed - Speed of the wave
 */

/** @typedef {Object} PowerUpEffects
 * @property {Object} speed - Speed power-up settings
 * @property {Object} ghost - Ghost power-up settings
 * @property {Object} points - Points power-up settings
 * @property {Object} slow - Slow power-up settings
 */

/** @typedef {Object} PowerUpColors
 * @property {string} speed - Speed power-up color
 * @property {string} ghost - Ghost power-up color
 * @property {string} points - Points power-up color
 * @property {string} slow - Slow power-up color
 */

/** @typedef {Object} PowerUpVisual
 * @property {number} baseSize - Size relative to cell size
 * @property {number} floatSpeed - Speed of floating animation
 * @property {number} floatAmount - Pixels to float up/down
 * @property {number} rotateSpeed - Speed of crystal rotation
 * @property {number} glowAmount - Pixel blur for glow effect
 * @property {number} shimmerCount - Number of shimmer particles
 * @property {number} shimmerSpeed - Speed of shimmer rotation
 * @property {number} shimmerSize - Size of shimmer particles
 * @property {number} energyCount - Number of energy field particles
 * @property {number} energySpeed - Speed of energy field rotation
 * @property {number} iconSize - Icon size relative to cell size
 */

/** @typedef {'speed'|'ghost'|'points'|'slow'} PowerUpType */

/** @typedef {Object} PowerUpConfig
 * @property {PowerUpType[]} types - Available power-up types
 * @property {number} spawnChance - Chance of power-up spawning
 * @property {PowerUpEffects} effects - Power-up effect configurations
 * @property {PowerUpColors} colors - Power-up colors
 * @property {PowerUpVisual} visual - Power-up visual configurations
 */

/** @typedef {Object} FoodColors
 * @property {string} primary - Primary color
 * @property {string} secondary - Secondary color
 * @property {string} highlight - Highlight color
 */

/** @typedef {Object} FoodEffects
 * @property {Object} bounceSpeed - Bounce animation speed for each food type
 * @property {number} bounceSpeed.regular - Regular food bounce speed in ms
 * @property {number} bounceSpeed.bonus - Bonus food bounce speed in ms
 * @property {number} bounceSpeed.golden - Golden food bounce speed in ms
 * @property {Object} sparkleSpeed - Sparkle animation speed for each food type
 * @property {number} sparkleSpeed.regular - Regular food sparkle speed in ms
 * @property {number} sparkleSpeed.bonus - Bonus food sparkle speed in ms
 * @property {number} sparkleSpeed.golden - Golden food sparkle speed in ms
 * @property {Object} pixelSize - Pixel size relative to cell size for each food type
 * @property {number} pixelSize.regular - Regular food pixel size
 * @property {number} pixelSize.bonus - Bonus food pixel size
 * @property {number} pixelSize.golden - Golden food pixel size
 * @property {Object} glow - Glow effect settings for each food type
 * @property {Object} outlineWeight - Outline thickness for each food type
 * @property {number} outlineWeight.regular - Regular food outline thickness
 * @property {number} outlineWeight.bonus - Bonus food outline thickness
 * @property {number} outlineWeight.golden - Golden food outline thickness
 */

/** @typedef {Object} FoodConfig
 * @property {Array<'regular'|'bonus'|'golden'>} types - Available food types
 * @property {Object} spawnRates - Spawn probability for each food type
 * @property {number} spawnRates.regular - Regular food spawn rate
 * @property {number} spawnRates.bonus - Bonus food spawn rate
 * @property {number} spawnRates.golden - Golden food spawn rate
 * @property {Object} points - Point values for each food type
 * @property {number} points.regular - Regular food points
 * @property {number} points.bonus - Bonus food points
 * @property {number} points.golden - Golden food points
 * @property {Object} colors - Color configurations for each food type
 * @property {Object} colors.regular - Regular food colors
 * @property {string} colors.regular.primary - Primary color
 * @property {string} colors.regular.secondary - Secondary color
 * @property {string} colors.regular.highlight - Highlight color
 * @property {Object} colors.bonus - Bonus food colors
 * @property {string} colors.bonus.primary - Primary color
 * @property {string} colors.bonus.secondary - Secondary color
 * @property {string} colors.bonus.highlight - Highlight color
 * @property {Object} colors.golden - Golden food colors
 * @property {string} colors.golden.primary - Primary color
 * @property {string} colors.golden.secondary - Secondary color
 * @property {string} colors.golden.highlight - Highlight color
 * @property {FoodEffects} effects - Visual effects for food types
 */

/** @typedef {Object} ScoringConfig
 * @property {number} basePoints - Base points awarded for collecting food
 * @property {number} multiplierIncrease - How much the multiplier increases per food collected
 * @property {Array<{threshold: number, multiplier: number}>} multiplierRules - Rules for score multipliers
 * @property {Array<{type: string, bonus: number}>} bonusConditions - Conditions for bonus points
 */

/**
 * @typedef {Object} PowerupBadgeConfig
 * @property {number} duration - Duration of the badge effect
 * @property {number} popInDuration - Duration of the pop-in animation
 * @property {number} popInScale - Scale factor for pop-in animation
 * @property {number} spacing - Spacing between badges as percentage of cell size
 * @property {number} size - Size multiplier relative to cell size
 * @property {number} floatingSize - Size multiplier for floating badges
 * @property {number} hoverAmplitude - Amplitude of hover animation
 * @property {number} hoverFrequency - Frequency of hover animation
 * @property {number} fadeOutDuration - Duration of fade out animation
 * @property {number} offsetY - Vertical offset from reference position
 */

/** @typedef {Object} GameConfig
 * @property {DebugConfig} debug - Debug settings
 * @property {BoardConfig} board - Board configuration
 * @property {DifficultyConfig} difficulty - Difficulty settings
 * @property {SnakeConfig} snake - Snake configuration
 * @property {PowerUpConfig} powerUps - Power-up settings
 * @property {FoodConfig} food - Food configuration
 * @property {ScoringConfig} scoring - Scoring configuration
 * @property {PowerupBadgeConfig} powerupBadges - Power-up badge settings
 */

/** @typedef {Object} PartialGameConfig
 * @property {PartialBoardConfig} [board]
 * @property {PartialDifficultyConfig} [difficulty]
 */

// Type definitions for partial configurations
/** @typedef {Partial<BoardConfig>} PartialBoardConfig */
/** @typedef {Partial<DifficultyConfig>} PartialDifficultyConfig */

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
        shortcutKey: ['`'],  
        controls: {
            spawn: {
                speed: '1',
                ghost: '2',
                points: '3',
                slow: '4',
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
            increasePerFood: 0.5,
            maxSpeed: 15,
            initialSpeedBoost: 1.5,
            slowEffect: 0.5  // Required by SpeedProgression type
        },
        segments: {
            size: 0.85,
            headSize: 1.2,  // Increased for wider head
            headLength: 2,  // Set to 2 cells for elongated head
            elevation: 2,  // Added elevation for 3D effect
            cornerRadius: 4,  // Added corner radius for smoother look
            eyeSize: 4,  // Increased from 0 for visible eyes
            pupilSize: 0,
            tongueLength: 0,
            tongueWidth: 0,
            tongueSpeed: 0,
            tongueWagRange: 0
        },
        effects: {
            speed: {
                lineLength: 0.8,    // Relative to cell size
                lineOpacity: 0.5,
                lineWidth: 2
            },
            ghost: {
                opacity: 0.7,
                glowRadius: 15,
                glowColor: 'cyan'
            },
            points: {
                sparkleChance: 0.2,
                sparkleSize: 0.2,   // Relative to cell size
                sparkleOpacity: 0.8
            },
            slow: {
                waveAmplitude: 0.2, // Relative to cell size
                waveFrequency: 0.1,
                waveSpeed: 0.005
            }
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
        controls: {
            up: ['ArrowUp', 'w'],
            down: ['ArrowDown', 's'],
            left: ['ArrowLeft', 'a'],
            right: ['ArrowRight', 'd']
        }
    },
    powerUps: {
        types: ['speed', 'ghost', 'points', 'slow'],  
        spawnChance: 0.01,
        effects: {
            speed: {
                speedMultiplier: 1.5,
                ghostMode: false,
                pointsMultiplier: 1.0,
                slowMultiplier: 1.0,
                duration: 5000  // 5 seconds in milliseconds
            },
            ghost: {
                speedMultiplier: 1.0,
                ghostMode: true,
                pointsMultiplier: 1.0,
                slowMultiplier: 1.0,
                duration: 8000  // 8 seconds in milliseconds
            },
            points: {
                speedMultiplier: 1.0,
                ghostMode: false,
                pointsMultiplier: 2.0,
                slowMultiplier: 1.0,
                duration: 10000  // 10 seconds in milliseconds
            },
            slow: {
                speedMultiplier: 1.0,
                ghostMode: false,
                pointsMultiplier: 1.0,
                slowMultiplier: 0.5,
                duration: 5000  // 5 seconds in milliseconds
            }
        },
        colors: {
            speed: '#ff0000',
            ghost: '#00ffff',
            points: '#ffff00',
            slow: '#FF5722'
        },
        visual: {
            baseSize: 1.6,      // Size relative to cell size (increased from 0.8)
            floatSpeed: 0.05,   // Speed of floating animation
            floatAmount: 5,     // Pixels to float up/down
            rotateSpeed: 0.02,  // Speed of crystal rotation
            glowAmount: 20,     // Pixel blur for glow effect
            shimmerCount: 3,    // Number of shimmer particles
            shimmerSpeed: 0.1,  // Speed of shimmer rotation
            shimmerSize: 4,     // Size of shimmer particles
            energyCount: 8,     // Number of energy field particles
            energySpeed: 0.05,  // Speed of energy field rotation
            iconSize: 0.8       // Icon size relative to cell size (increased from 0.4)
        }
    },
    food: {
        types: ['regular', 'bonus', 'golden'],
        spawnRates: {
            regular: 0.8,
            bonus: 0.15,
            golden: 0.05
        },
        points: {
            regular: 10,
            bonus: 30,
            golden: 50
        },
        colors: {
            regular: {
                primary: '#FF2222',    // Brighter red
                secondary: '#44FF44',   // Brighter green
                highlight: '#FFFFFF'    // White highlight
            },
            bonus: {
                primary: '#FF22FF',    // Brighter magenta
                secondary: '#44FF44',   // Brighter green
                highlight: '#FFFFFF'    // White highlight
            },
            golden: {
                primary: '#FFD700',    // Pure gold
                secondary: '#FFFF44',   // Bright yellow
                highlight: '#FFFFFF'    // White highlight
            }
        },
        effects: {
            bounceSpeed: {
                regular: 1000,  // ms per bounce cycle
                bonus: 1200,
                golden: 800
            },
            sparkleSpeed: {
                regular: 0,     // no sparkle
                bonus: 800,     // ms per sparkle cycle
                golden: 500
            },
            pixelSize: {
                regular: 0.125,     // fraction of cell size
                bonus: 0.125,
                golden: 0.125
            },
            outlineWeight: {
                regular: 2,     // pixels
                bonus: 3,
                golden: 4
            },
            glow: {
                regular: 10,    // glow radius in pixels
                bonus: 15,
                golden: 20
            }
        }
    },
    scoring: {
        basePoints: 10,
        multiplierIncrease: 0.1,
        multiplierRules: [
            { threshold: 5, multiplier: 1.5 },
            { threshold: 10, multiplier: 2.0 },
            { threshold: 20, multiplier: 3.0 }
        ],
        bonusConditions: [
            { type: 'speed', bonus: 100 },
            { type: 'noWalls', bonus: 50 },
            { type: 'perfectRun', bonus: 25 }
        ]
    },
    powerupBadges: {
        duration: 2000,
        popInDuration: 300,
        popInScale: 1.2,
        spacing: 0.2,        // Spacing as percentage of cell size
        size: 1.5,          // Size as multiplier of cell size
        floatingSize: 2.0,  // Floating badge size as multiplier of cell size
        hoverAmplitude: 2,
        hoverFrequency: 3,
        fadeOutDuration: 500,
        offsetY: -50
    },
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
        
        /** @type {PartialGameConfig} */
        this.config = {
            board: {
                preset: 'medium',  // Can be customized via data-snake-board-size
                cellSize: 20,     // Can be customized via data-snake-cell-size
                presets: JSON.parse(JSON.stringify(defaultConfig.board.presets))  // Required for data attributes
            },
            difficulty: {
                current: 'normal'  // Can be customized via data-snake-difficulty
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
        // Deep copy the default config to sources.default
        this.sources.default = JSON.parse(JSON.stringify(defaultConfig));
        
        // Initialize config with required fields
        this.config = {
            board: {
                preset: 'medium',
                cellSize: 20,
                presets: JSON.parse(JSON.stringify(defaultConfig.board.presets))
            },
            difficulty: {
                current: 'normal'
            }
        };
    }

    /**
     * Load configuration from local storage
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('snakeGameConfig');
            if (!saved) return;

            const savedConfig = JSON.parse(saved);

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
     * Order: default (lowest) -> localStorage -> data attributes -> runtime changes (highest)
     */
    mergeConfigurations() {
        this.config = JSON.parse(JSON.stringify(this.sources.default));
        
        if (this.sources.localStorage) {
            this.config = deepMerge(this.config, this.sources.localStorage);
        }
        
        if (this.sources.dataAttributes) {
            this.config = deepMerge(this.config, this.sources.dataAttributes);
        }
    }

    /**
     * Reset the configuration to its default state
     */
    reset() {
        // Clear all configuration sources
        this.sources.localStorage = null;
        this.sources.dataAttributes = null;
        
        // Reset to default configuration using deep copy
        this.config = JSON.parse(JSON.stringify(this.sources.default));
        
        // Clear localStorage
        localStorage.removeItem('snakeGameConfig');
    }

    /**
     * Save persistent settings (board preset, cell size, difficulty) to localStorage
     * @param {Partial<GameConfig>} configChanges Changes to be persisted
     * @private
     */
    savePersistentSettings(configChanges) {
        // Get existing storage config
        let storageConfig;
        try {
            const savedConfig = localStorage.getItem('snakeGameConfig');
            storageConfig = savedConfig ? JSON.parse(savedConfig) : {};
        } catch (error) {
            console.error('Failed to load existing configuration:', error);
            storageConfig = {};
        }

        // Handle board changes
        if (configChanges.board) {
            if (!storageConfig.board) storageConfig.board = {};
            
            // Save board preset if changed
            if (configChanges.board.preset) {
                storageConfig.board.preset = configChanges.board.preset;
            }
            
            // Save cell size if changed
            if (configChanges.board.cellSize !== undefined) {
                storageConfig.board.cellSize = configChanges.board.cellSize;
            }
        }

        // Handle difficulty changes
        if (configChanges.difficulty?.current) {
            if (!storageConfig.difficulty) storageConfig.difficulty = {};
            storageConfig.difficulty.current = configChanges.difficulty.current;
        }

        // Save to localStorage
        try {
            localStorage.setItem('snakeGameConfig', JSON.stringify(storageConfig));
        } catch (error) {
            console.error('Failed to save configuration:', error);
        }
    }

    /**
     * Override the current configuration with a custom configuration
     * This method handles runtime changes which take highest priority
     * @param {Partial<GameConfig>} customConfig Custom configuration to override with
     * @returns {boolean} Whether the override was successful
     */
    override(customConfig) {
        // Deep copy the custom config to prevent reference sharing
        const configCopy = JSON.parse(JSON.stringify(customConfig));
        
        // Validate custom configuration as a partial update
        const validationResult = validateConfig(configCopy, validationRules, true);
        if (validationResult.errors.length > 0) {
            console.error('Custom configuration validation errors:', validationResult.errors);
            return false;
        }

        // For board preset changes, apply preset values
        if (configCopy.board?.preset) {
            const preset = configCopy.board.preset;
            const defaultPreset = this.sources.default.board.presets[preset];
            
            configCopy.board = {
                ...this.config.board,
                preset,
                width: defaultPreset.width,
                height: defaultPreset.height,
                cellSize: defaultPreset.cellSize,
                ...configCopy.board
            };
        }

        // Apply changes to runtime config
        this.config = deepMerge(this.config, configCopy);

        // Save persistent settings
        this.savePersistentSettings(configCopy);
        
        return true;
    }

    /**
     * Get the current configuration
     * @returns {GameConfig} Current configuration
     */
    getConfig() {
        // Ensure we have a complete config by merging with defaults
        return deepMerge(JSON.parse(JSON.stringify(defaultConfig)), this.config);
    }

    /**
     * Save the current configuration to local storage
     * @returns {boolean} Whether the save was successful
     */
    saveToLocalStorage() {
        try {
            if (this.sources.localStorage) {
                // Create a clean copy before saving
                const cleanConfig = JSON.parse(JSON.stringify(this.sources.localStorage));
                localStorage.setItem('snakeGameConfig', JSON.stringify(cleanConfig));
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
     * Get the configuration sources
     * @returns {Object} Configuration sources
     */
    getConfigurationSources() {
        return this.sources;
    }
}

export default new ConfigManager();
