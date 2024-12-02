import { validateConfig, deepMerge, validationRules } from '../utils/configValidator.js';
import { applyDataAttributes } from '../utils/dataAttributeParser.js';

export const defaultConfig = {
    debug: {
        enabled: true,  // Enable debug mode by default
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
        shortcutKey: ['`', 'd'], // Toggle debug panel visibility
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
                increaseCellSize: '=',  // Must hold shift and press =
                decreaseCellSize: '-'   // Must hold shift and press -
            }
        },
        vectors: {
            color: '#FF5722',
            thickness: 2,
            headLength: 10,
            opacity: 0.8,
            scale: 30  // pixels per unit of speed
        }
    },
    board: {
        preset: 'medium',  // small, medium, large
        presets: {
            small: { width: 400, height: 400, cellSize: 20 },  // 20x20
            medium: { width: 800, height: 600, cellSize: 20 }, // 30x20
            large: { width: 1200, height: 800, cellSize: 20 },   // 40x30
            fullscreen: { width: window.innerWidth, height: window.innerHeight, cellSize: 20 }
        },
        width: 800,  // Default to medium size
        height: 600,
        cellSize: 20,
        backgroundColor: '#000000',
        gridColor: '#111111'
    },
    difficulty: {
        current: 'easy',  // easy, normal, hard
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
        initialLength: 3,  // Initial body segments (excluding head)
        initialDirection: 'right',
        baseSpeed: 8,     // Base movement speed
        speedProgression: {
            enabled: true,
            increasePerFood: 0.2,    // Speed increase per food eaten
            maxSpeed: 15,            // Maximum speed cap
            initialSpeedBoost: 1.5,  // Multiplier for speed power-up
            slowEffect: 0.5          // Multiplier for slow power-up
        },
        colors: {
            head: '#4CAF50',          // Vibrant green
            body: '#2E7D32',          // Darker green base
            highlight: '#A5D6A7',      // Soft mint highlight
            shadow: '#1B5E20',         // Deep forest shadow
            glow: 'rgba(76, 175, 80, 0.2)',  // Subtle green glow
            eyes: '#FFFFFF',           // White eyes
            pupil: '#000000',          // Black pupils
            tongue: '#FF0000'          // Red tongue
        },
        segments: {
            size: 0.85,               // Body segment size relative to cell size
            headSize: 0.95,           // Head size relative to cell size
            headLength: 2,            // Head length in cells
            elevation: 3,             // Pixels to offset shadow for depth
            cornerRadius: 4,          // Pixels for rounded corners
            eyeSize: 4,              // Eye radius in pixels
            pupilSize: 2,            // Pupil radius in pixels
            tongueWidth: 0.1,         // Tongue width relative to cell size
            tongueLength: 0.6,        // Tongue length relative to cell size
            tongueWagRange: 0.2,      // Maximum tongue wag range relative to cell size
            tongueSpeed: 200         // Milliseconds per tongue wag cycle
        },
        controls: {
            up: ['ArrowUp', 'w', 'W'],
            down: ['ArrowDown', 's', 'S'],
            left: ['ArrowLeft', 'a', 'A'],
            right: ['ArrowRight', 'd', 'D']
        }
    },
    food: {
        colors: ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF'],
        spawnRate: 1,  // food items per second
        value: 10      // score value
    },
    powerUps: {
        types: ['speed', 'ghost', 'points'],
        spawnChance: 0.01,
        duration: 10000, // 10 seconds base duration
        effects: {
            speed: {
                boost: 1.2,      // 20% speed increase per stack
                maxStacks: 3,    // Maximum 3x speed boost
                stackDuration: true  // Durations add up
            },
            ghost: {
                stackDuration: true  // Durations add up
            },
            points: {
                multiplier: 2,       // Base 2x multiplier
                maxMultiplier: 8,    // Cap at 8x points
                stackType: 'multiplicative',  // 2x -> 4x -> 8x
                stackDuration: true  // Durations add up
            }
        },
        colors: {
            speed: '#ff0000',
            ghost: '#00ffff',
            points: '#ffff00'
        }
    },
    scoring: {
        basePoints: 10,
        comboMultiplier: 1.5,
        comboTimeWindow: 3000  // milliseconds
    }
};

class ConfigManager {
    constructor() {
        // Initialize configuration sources
        this.sources = {
            default: null,
            localStorage: null,
            dataAttributes: null
        };
        
        // Load configurations in order of increasing priority
        this.loadDefaultConfig();
        this.loadFromLocalStorage();
        this.loadFromDataAttributes();
        
        // Merge configurations according to priority
        this.mergeConfigurations();
    }

    loadDefaultConfig() {
        this.sources.default = { ...defaultConfig };
        this.config = { ...defaultConfig };
    }

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

    loadFromDataAttributes() {
        const container = document.getElementById('snaked-again-container');
        if (!container) return;

        const dataConfig = applyDataAttributes(this.config, container);
        if (!dataConfig) return;

        // Store valid data attributes config
        this.sources.dataAttributes = dataConfig;
        
        // Update grid dimensions immediately if game exists
        if (window.game && window.game.grid) {
            window.game.grid.updateDimensions();
        }
    }

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

    getConfig() {
        return this.config;
    }

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

    reset() {
        // Clear all sources except default
        this.sources.localStorage = null;
        this.sources.dataAttributes = null;
        
        // Reset to default configuration
        this.config = { ...this.sources.default };
        
        // Clear localStorage
        localStorage.removeItem('snakeGameConfig');
    }

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

    getDifferenceFromDefault() {
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
