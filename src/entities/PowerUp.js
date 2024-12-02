import configManager from '../config/gameConfig.js';
import { PowerUpTypes, isValidPowerUpType, createPowerUpEffect } from '../types/powerUpTypes.js';

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate on the grid
 * @property {number} y - Y coordinate on the grid
 */

/**
 * @typedef {Object} Obstacle
 * @property {Array<{x: number, y: number}>} [segments] - Array of positions representing obstacle segments
 * @property {Position} [position] - Single position representing an obstacle
 */

/**
 * Represents a power-up item in the game that provides temporary effects when collected.
 * Power-ups have a position, type (e.g., 'speed', 'ghost', 'points'), and visual effects.
 * @class
 */
export class PowerUp {
    /** @type {import('../core/Grid.js').Grid} */
    #grid;

    /** @type {import('../types/powerUpTypes.js').PowerUpConfig} */
    #config;

    /** @type {Position} */
    #position;

    /** @type {import('../types/powerUpTypes.js').PowerUpType} */
    #type;

    /** @type {number} */
    #spawnTime;

    /** @type {number} */
    #pulseSpeed;

    /** @type {number} */
    #rotateSpeed;

    /**
     * Creates a new PowerUp instance
     * @param {import('../core/Grid.js').Grid} grid - The game grid instance
     * @param {Array<Obstacle>} [obstacles=[]] - Array of obstacles to avoid when spawning
     */
    constructor(grid, obstacles = []) {
        this.#grid = grid;
        const gameConfig = configManager.getConfig();
        /** @type {import('../types/powerUpTypes.js').PowerUpConfig} */
        this.#config = {
            types: gameConfig.powerUps.types,
            spawnChance: gameConfig.powerUps.spawnChance,
            duration: gameConfig.powerUps.duration,
            effects: {
                speed: { speedMultiplier: 1.5 },
                ghost: { ghostMode: true },
                points: { pointsMultiplier: 2 },
                slow: { slowMultiplier: 0.5 }
            },
            colors: {
                ...gameConfig.powerUps.colors,
                slow: '#607D8B' // Adding missing slow power-up color
            }
        };
        this.#position = this.#getRandomPosition(obstacles);
        this.#type = this.#getRandomType();
        this.#spawnTime = Date.now();
        this.#pulseSpeed = 0.1;
        this.#rotateSpeed = 0.05;
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
        snake.addEffect(this.#type, this.#config.duration);
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
     * Draws the power-up on the canvas with visual effects (pulsing and rotation)
     * @param {import('p5')} p5 - The p5.js instance
     */
    draw(p5) {
        const coords = this.#grid.toPixelCoords(this.#position.x, this.#position.y);
        const cellSize = this.#grid.getCellSize();

        // Create a pulsing/rotating effect
        const pulseAmount = Math.sin(p5.frameCount * this.#pulseSpeed) * 0.2 + 0.8;
        const rotateAmount = p5.frameCount * this.#rotateSpeed;

        p5.push();
        p5.translate(coords.x + cellSize / 2, coords.y + cellSize / 2);
        p5.rotate(rotateAmount);

        // Draw power-up shape with type-specific color
        p5.noStroke();
        p5.fill(this.#config.colors[this.#type]);

        const size = cellSize * 0.6 * pulseAmount;
        switch (this.#type) {
            case PowerUpTypes.SPEED:
                this.#drawSpeedPowerUp(p5, size);
                break;
            case PowerUpTypes.GHOST:
                this.#drawGhostPowerUp(p5, size);
                break;
            case PowerUpTypes.POINTS:
                this.#drawPointsPowerUp(p5, size);
                break;
            case PowerUpTypes.SLOW:
                this.#drawSlowPowerUp(p5, size);
                break;
        }

        p5.pop();
    }

    /**
     * Draws a speed power-up (lightning bolt)
     * @param {import('p5')} p5 - The p5.js instance
     * @param {number} size - Size of the power-up
     */
    #drawSpeedPowerUp(p5, size) {
        const points = [
            { x: -size/4, y: -size/2 },
            { x: size/4, y: -size/4 },
            { x: 0, y: 0 },
            { x: size/4, y: size/4 },
            { x: -size/4, y: size/2 }
        ];

        p5.beginShape();
        points.forEach(point => p5.vertex(point.x, point.y));
        p5.endShape(p5.CLOSE);
    }

    /**
     * Draws a ghost power-up (ghost shape)
     * @param {import('p5')} p5 - The p5.js instance
     * @param {number} size - Size of the power-up
     */
    #drawGhostPowerUp(p5, size) {
        const halfSize = size / 2;
        p5.arc(0, 0, size, size, p5.PI, 0);
        p5.rect(-halfSize, 0, size, halfSize/2);
        
        const waveHeight = size/6;
        const segments = 3;
        p5.beginShape();
        for (let i = 0; i <= segments; i++) {
            const x = -halfSize + (size * i/segments);
            const y = halfSize/2 + Math.sin(i * p5.PI) * waveHeight;
            p5.vertex(x, y);
        }
        p5.endShape();
    }

    /**
     * Draws a points power-up (star shape)
     * @param {import('p5')} p5 - The p5.js instance
     * @param {number} size - Size of the power-up
     */
    #drawPointsPowerUp(p5, size) {
        const points = 5;
        const halfSize = size / 2;
        const innerRadius = halfSize * 0.4;

        p5.beginShape();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? halfSize : innerRadius;
            const angle = (i * p5.PI) / points;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            p5.vertex(x, y);
        }
        p5.endShape(p5.CLOSE);
    }

    /**
     * Draws a slow power-up (hourglass shape)
     * @param {import('p5')} p5 - The p5.js instance
     * @param {number} size - Size of the power-up
     */
    #drawSlowPowerUp(p5, size) {
        const halfSize = size / 2;
        const neckWidth = size * 0.2;
        
        p5.beginShape();
        // Top triangle
        p5.vertex(-halfSize, -halfSize);
        p5.vertex(halfSize, -halfSize);
        p5.vertex(neckWidth/2, 0);
        p5.vertex(-neckWidth/2, 0);
        // Bottom triangle
        p5.vertex(-halfSize, halfSize);
        p5.vertex(halfSize, halfSize);
        p5.vertex(neckWidth/2, 0);
        p5.vertex(-neckWidth/2, 0);
        p5.endShape(p5.CLOSE);
    }
}
