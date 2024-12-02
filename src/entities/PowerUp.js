import configManager from '../config/gameConfig.js';
import { PowerUpTypes, isValidPowerUpType } from '../types/powerUpTypes.js';
import { PowerUpRenderer } from '../powerups/PowerUpRenderer.js';
import { powerUpConfig } from '../powerups/PowerUpConfig.js';

/**
 * @typedef {import('../types/commonTypes.js').Position} Position
 */

/**
 * @typedef {Object} Obstacle
 * @property {Array<Position>} [segments] - Array of positions representing obstacle segments
 * @property {Position} [position] - Single position representing an obstacle
 */

export class PowerUp {
    /** @type {import('../core/Grid.js').Grid} */
    #grid;

    /** @type {PowerUpRenderer} */
    #renderer;

    /** @type {import('../types/powerUpTypes.js').PowerUpConfig} */
    #config;

    /** @type {Position} */
    #position;

    /** @type {import('../types/powerUpTypes.js').PowerUpType} */
    #type;

    /** @type {number} */
    #spawnTime;

    /**
     * Creates a new PowerUp instance
     * @param {import('../core/Grid.js').Grid} grid - The game grid instance
     * @param {Array<Obstacle>} [obstacles=[]] - Array of obstacles to avoid when spawning
     */
    constructor(grid, obstacles = []) {
        this.#grid = grid;
        const gameConfig = configManager.getConfig();
        this.#config = {
            types: gameConfig.powerUps.types,
            spawnChance: gameConfig.powerUps.spawnChance,
            effects: {
                speed: { 
                    speedMultiplier: 1.5,
                    duration: gameConfig.powerUps.effects.speed.duration
                },
                ghost: { 
                    ghostMode: true,
                    duration: gameConfig.powerUps.effects.ghost.duration
                },
                points: { 
                    pointsMultiplier: 2,
                    duration: gameConfig.powerUps.effects.points.duration
                },
                slow: { 
                    slowMultiplier: 0.5,
                    duration: gameConfig.powerUps.effects.slow.duration
                }
            },
            colors: gameConfig.powerUps.colors,
            visual: powerUpConfig.visual
        };
        this.#position = this.#getRandomPosition(obstacles);
        this.#type = this.#getRandomType();
        this.#spawnTime = Date.now();
    }

    /**
     * Gets a random valid position on the grid, avoiding obstacles
     * @param {Array<Obstacle>} obstacles - Array of obstacles to avoid
     * @returns {Position} Random position coordinates
     */
    #getRandomPosition(obstacles) {
        let newPosition;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            newPosition = this.#grid.getRandomPosition(true);
            attempts++;

            // Check if position conflicts with any obstacles
            const hasConflict = obstacles.some(obstacle => {
                if (Array.isArray(obstacle.segments)) {
                    return obstacle.segments.some(segment => 
                        segment.x === newPosition.x && segment.y === newPosition.y
                    );
                } else if (obstacle.position) {
                    return obstacle.position.x === newPosition.x && 
                           obstacle.position.y === newPosition.y;
                }
                return false;
            });

            if (!hasConflict) {
                break;
            }
        } while (attempts < maxAttempts);

        return newPosition;
    }

    /**
     * Gets a random power-up type from the configured types
     * @returns {import('../types/powerUpTypes.js').PowerUpType} Random power-up type
     * @throws {Error} If no valid power-up types are configured
     */
    #getRandomType() {
        const types = this.#config.types.filter(isValidPowerUpType);
        if (types.length === 0) {
            throw new Error('No valid power-up types configured');
        }
        return types[Math.floor(Math.random() * types.length)];
    }

    /**
     * Applies the power-up effect to the snake
     * @param {import('./Snake.js').Snake} snake - The snake to apply the effect to
     * @fires Snake#power_up_collected
     * @fires Snake#power_up_started
     */
    apply(snake) {
        snake.addEffect(this.#type);
    }

    /**
     * Gets the power-up's position
     * @returns {Position} Current position
     */
    get position() {
        return { ...this.#position };
    }

    /**
     * Gets the power-up's type
     * @returns {import('../types/powerUpTypes.js').PowerUpType} Power-up type
     */
    get type() {
        return this.#type;
    }

    /**
     * Sets the power-up's type
     * @param {import('../types/powerUpTypes.js').PowerUpType} value - New power-up type
     */
    set type(value) {
        if (!isValidPowerUpType(value)) {
            throw new Error(`Invalid power-up type: ${value}`);
        }
        this.#type = value;
    }

    /**
     * Gets the power-up's spawn time
     * @returns {number} Spawn time in milliseconds
     */
    get spawnTime() {
        return this.#spawnTime;
    }

    /**
     * Draws the power-up on the canvas
     * @param {import('p5')} p5 - The p5.js instance
     */
    draw(p5) {
        // Create renderer if not exists
        if (!this.#renderer) {
            this.#renderer = new PowerUpRenderer(p5, this.#grid, powerUpConfig);
        }
        
        // Draw using renderer
        this.#renderer.draw(
            this.#position,
            this.#type,
            this.#config.colors[this.#type]
        );
    }
}
