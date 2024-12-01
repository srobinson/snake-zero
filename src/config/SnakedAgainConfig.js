import { gameConfig } from './gameConfig.js';

/**
 * Configuration builder for Snaked Again game
 */
export class SnakedAgainConfig {
    #config = {};

    /**
     * Create a new configuration builder
     */
    constructor() {
        // Start with a deep clone of the default configuration
        this.#config = JSON.parse(JSON.stringify(gameConfig));
    }

    /**
     * Use fullscreen mode with specified grid size
     * @param {number} gridSize - Size of each grid cell
     * @returns {SnakedAgainConfig}
     */
    useFullscreen(gridSize = 20) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const cols = Math.floor(width / gridSize);
        const rows = Math.floor(height / gridSize);

        this.#config.board = {
            preset: null,
            custom: {
                width: cols * gridSize, // Ensure width is divisible by gridSize
                height: rows * gridSize, // Ensure height is divisible by gridSize
                gridSize,
                cols,
                rows
            }
        };
        return this;
    }

    /**
     * Use a preset board size
     * @param {'small' | 'medium' | 'large'} preset - Preset size to use
     * @returns {SnakedAgainConfig}
     */
    usePreset(preset = 'medium') {
        if (!['small', 'medium', 'large'].includes(preset)) {
            throw new Error('Invalid preset. Use "small", "medium", or "large"');
        }

        const presetConfig = this.#config.boardPresets[preset];
        if (!presetConfig) {
            throw new Error(`Preset ${preset} not found in configuration`);
        }

        this.#config.board = {
            preset,
            custom: null
        };
        return this;
    }

    /**
     * Use custom board dimensions
     * @param {number} width - Board width
     * @param {number} height - Board height
     * @param {number} gridSize - Size of each grid cell
     * @returns {SnakedAgainConfig}
     */
    useCustomBoard(width, height, gridSize = 20) {
        // Ensure dimensions are divisible by gridSize
        const adjustedWidth = Math.floor(width / gridSize) * gridSize;
        const adjustedHeight = Math.floor(height / gridSize) * gridSize;
        const cols = adjustedWidth / gridSize;
        const rows = adjustedHeight / gridSize;

        this.#config.board = {
            preset: null,
            custom: {
                width: adjustedWidth,
                height: adjustedHeight,
                gridSize,
                cols,
                rows
            }
        };
        return this;
    }

    /**
     * Set snake speed
     * @param {number} speed - Moves per second
     * @returns {SnakedAgainConfig}
     */
    setSnakeSpeed(speed = gameConfig.snake.baseSpeed) {
        this.#config.snake.baseSpeed = speed;
        return this;
    }

    /**
     * Set initial snake length
     * @param {number} length - Initial number of segments
     * @returns {SnakedAgainConfig}
     */
    setInitialLength(length = gameConfig.snake.initialLength) {
        this.#config.snake.initialLength = length;
        return this;
    }

    /**
     * Set power-up spawn chance
     * @param {number} chance - Chance between 0 and 1
     * @returns {SnakedAgainConfig}
     */
    setPowerUpChance(chance = gameConfig.powerUps.spawnChance) {
        this.#config.powerUps.spawnChance = chance;
        return this;
    }

    /**
     * Get the current configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        // If using a preset, get the board dimensions from presets
        if (this.#config.board.preset) {
            const preset = this.#config.boardPresets[this.#config.board.preset];
            this.#config.board.custom = null; // Ensure custom is null when using preset
            return {
                ...this.#config,
                boardConfig: preset // Add the actual board dimensions
            };
        }

        // If using custom dimensions, use those
        if (this.#config.board.custom) {
            return {
                ...this.#config,
                boardConfig: this.#config.board.custom
            };
        }

        // Fallback to medium preset if no valid configuration
        const mediumPreset = this.#config.boardPresets.medium;
        this.#config.board = {
            preset: 'medium',
            custom: null
        };
        return {
            ...this.#config,
            boardConfig: mediumPreset
        };
    }
}
