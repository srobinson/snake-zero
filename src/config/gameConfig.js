import { validateConfig, deepMerge } from '../utils/configValidator.js';

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
        shortcutKey: 'd', // backtick key
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
        current: 'normal',  // easy, normal, hard
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
        initialLength: 4,
        baseSpeed: 5,  // cells per second (will be overridden by difficulty)
        speedProgression: {
            enabled: true,
            increasePerFood: 0.2,    // Speed increase per food eaten
            maxSpeed: 15,            // Maximum speed cap
            initialSpeedBoost: 1.5,  // Multiplier for speed power-up
            slowEffect: 0.5          // Multiplier for slow power-up
        },
        colors: {
            head: '#4CAF50',
            body: '#388E3C'
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
        this.config = { ...defaultConfig };
        const errors = validateConfig(this.config);
        if (errors.length > 0) {
            console.error('Default configuration validation errors:', errors);
        }
    }

    getConfig() {
        return this.config;
    }

    override(customConfig) {
        // Validate the custom config first
        const errors = validateConfig(customConfig);
        if (errors.length > 0) {
            console.error('Custom configuration validation errors:', errors);
            return false;
        }

        // Deep merge the configurations
        this.config = deepMerge(this.config, customConfig);
        return true;
    }

    reset() {
        this.config = { ...defaultConfig };
    }

    // Add configuration persistence
    saveToLocalStorage() {
        try {
            localStorage.setItem('snakeGameConfig', JSON.stringify(this.config));
            return true;
        } catch (error) {
            console.error('Failed to save configuration:', error);
            return false;
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('snakeGameConfig');
            if (saved) {
                const config = JSON.parse(saved);
                const errors = validateConfig(config);
                if (errors.length === 0) {
                    this.config = config;
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Failed to load configuration:', error);
            return false;
        }
    }
}

export default new ConfigManager();
