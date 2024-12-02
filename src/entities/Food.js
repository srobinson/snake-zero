import configManager from '../config/gameConfig.js';

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate on the grid
 * @property {number} y - Y coordinate on the grid
 */

/**
 * @typedef {Object} Obstacle
 * @property {Array<{x: number, y: number}>} segments - Array of positions representing obstacle segments
 */

/**
 * Represents a food item in the game that the snake can collect.
 * Food items have a position on the grid, a color, and maintain a history
 * of recent positions to prevent spawning in the same place repeatedly.
 * @class
 */
export class Food {
    /**
     * Creates a new Food instance
     * @param {import('../core/Grid.js').Grid} grid - The game grid instance
     */
    constructor(grid) {
        /** @type {import('../core/Grid.js').Grid} */
        this.grid = grid;
        /** @type {import('../config/gameConfig.js').FoodConfig} */
        this.config = configManager.getConfig().food;
        /** @type {Position} */
        this.position = this.getRandomPosition();
        /** @type {string} */
        this.color = this.getRandomColor();
        /** @type {Set<string>} */
        this.lastPositions = new Set(); // Keep track of recent positions
    }

    /**
     * Gets a random valid position on the grid
     * @returns {Position} Random position coordinates
     */
    getRandomPosition() {
        return this.grid.getRandomPosition(true);
    }

    /**
     * Gets a random color from the configured colors array.
     * Ensures the same color is not chosen twice in a row if possible.
     * @returns {string} Hex color code
     */
    getRandomColor() {
        const colors = this.config.colors;
        const lastColor = this.color;
        let newColor;
        
        // Avoid same color twice in a row
        do {
            newColor = colors[Math.floor(Math.random() * colors.length)];
        } while (newColor === lastColor && colors.length > 1);
        
        return newColor;
    }

    /**
     * Respawns the food at a new random position, avoiding obstacles and recent positions.
     * Also updates the food's color and maintains a history of recent positions.
     * @param {Array<Obstacle>} [obstacles=[]] - Array of obstacles to avoid when spawning
     */
    respawn(obstacles = []) {
        let newPosition;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            newPosition = this.getRandomPosition();
            attempts++;

            // Check if position conflicts with any obstacles or recent positions
            const hasConflict = obstacles.some(obstacle => {
                if (Array.isArray(obstacle.segments)) {
                    return obstacle.segments.some(segment => 
                        segment.x === newPosition.x && segment.y === newPosition.y
                    );
                }
                return false;
            }) || this.lastPositions.has(`${newPosition.x},${newPosition.y}`);

            if (!hasConflict) {
                break;
            }
        } while (attempts < maxAttempts);

        // Update position and color
        this.position = newPosition;
        this.color = this.getRandomColor();

        // Add to recent positions (keep last 5)
        this.lastPositions.add(`${newPosition.x},${newPosition.y}`);
        if (this.lastPositions.size > 5) {
            this.lastPositions.delete(this.lastPositions.values().next().value);
        }
    }

    /**
     * Draws the food item on the canvas with visual effects (pulsing and rotation).
     * @param {import('p5')} p5 - The p5.js instance
     */
    draw(p5) {
        const { x, y } = this.grid.toPixelCoords(this.position.x, this.position.y);
        const cellSize = this.grid.getCellSize();
        
        // Draw food with a slight pulse effect
        const pulseAmount = Math.sin(Date.now() / 200) * 0.1 + 0.9;
        const size = cellSize * 0.8 * pulseAmount;
        
        p5.push();
        p5.translate(x + cellSize/2, y + cellSize/2);
        p5.rotate(Date.now() / 1000); // Slow rotation
        
        p5.fill(this.color);
        p5.noStroke();
        p5.rectMode(p5.CENTER);
        p5.rect(0, 0, size, size, size * 0.2);
        
        p5.pop();
    }
}
