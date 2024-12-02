// @ts-check
import configManager from '../config/gameConfig.js';

/**
 * @typedef {import('../config/gameConfig.js').FoodColors} FoodColors
 * @typedef {import('../config/gameConfig.js').FoodEffects} FoodEffects
 * @typedef {import('../config/gameConfig.js').FoodConfig} FoodConfig
 */

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
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
     * @type {FoodConfig}
     */
    config;

    /**
     * Creates a new Food instance
     * @param {import('../core/Grid.js').Grid} grid - The game grid instance
     */
    constructor(grid) {
        this.grid = grid;
        /** @type {FoodConfig} */
        this.config = configManager.getConfig().food;
        /** @type {'regular' | 'bonus' | 'golden'} */
        this.type = this.getRandomType();
        /** @type {Position} */
        this.position = this.getRandomPosition();
        /** @type {string} */
        this.color = this.getRandomColor();
        /** @type {Set<string>} */
        this.lastPositions = new Set(); // Keep track of recent positions
        /** @type {number} */
        this.spawnTime = Date.now();
    }

    /**
     * Gets a random valid position on the grid
     * @returns {Position} Random position coordinates
     */
    getRandomPosition() {
        return this.grid.getRandomPosition(true);
    }

    /**
     * Gets a random type based on rarity
     * @returns {'regular' | 'bonus' | 'golden'} Food type
     */
    getRandomType() {
        const rand = Math.random();
        const rates = this.config.spawnRates;
        if (rand < rates.golden) return 'golden';
        if (rand < rates.golden + rates.bonus) return 'bonus';
        return 'regular';
    }

    /**
     * Gets color configuration for the current type
     * @returns {string} Primary color for the current type
     */
    getRandomColor() {
        const colors = this.config.colors[this.type];
        return colors.primary;
    }

    /**
     * Gets points value based on type
     * @returns {number} Points value
     */
    getPoints() {
        return this.config.points[this.type];
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
        this.type = this.getRandomType();
        this.spawnTime = Date.now();

        // Add to recent positions (keep last 5)
        this.lastPositions.add(`${newPosition.x},${newPosition.y}`);
        if (this.lastPositions.size > 5) {
            this.lastPositions.delete(this.lastPositions.values().next().value);
        }
    }

    /**
     * Draws particles around the food
     * @param {import('p5')} p5 - The p5.js instance
     * @param {number} x - Center X coordinate
     * @param {number} y - Center Y coordinate
     * @param {number} size - Size of food
     * @private
     */
    drawParticles(p5, x, y, size) {
        const time = Date.now() - this.spawnTime;
        const particleCount = this.config.effects.particleCount[this.type];
        
        p5.push();
        p5.translate(x, y);
        
        // Draw orbiting particles
        for (let i = 0; i < particleCount; i++) {
            const angle = (time * this.config.effects.particleSpeed + (i / particleCount) * Math.PI * 2);
            const orbitSize = size * 1.5;
            const px = Math.cos(angle) * orbitSize;
            const py = Math.sin(angle) * orbitSize;
            const particleSize = size * 0.2;
            
            // Particle glow
            p5.drawingContext.shadowBlur = 10;
            p5.drawingContext.shadowColor = this.config.colors[this.type].glow;
            p5.fill(this.config.colors[this.type].primary);
            p5.noStroke();
            p5.circle(px, py, particleSize);
        }
        
        p5.pop();
    }

    /**
     * Draws the food item on the canvas with visual effects
     * @param {import('p5')} p5 - The p5.js instance
     */
    draw(p5) {
        const { x, y } = this.grid.toPixelCoords(this.position.x, this.position.y);
        const cellSize = this.grid.getCellSize();
        const time = Date.now() - this.spawnTime;
        
        // Base size varies by type
        const baseSize = cellSize * (this.type === 'golden' ? 0.9 : this.type === 'bonus' ? 0.85 : 0.8);
        
        // Pulse effect varies by type
        const pulseSpeed = this.config.effects.pulseSpeed[this.type];
        const pulseAmount = Math.sin(time / pulseSpeed) * 0.1 + 0.9;
        const size = baseSize * pulseAmount;
        
        // Center coordinates
        const centerX = x + cellSize/2;
        const centerY = y + cellSize/2;
        
        // Draw particles first
        this.drawParticles(p5, centerX, centerY, size);
        
        // Main food shape
        p5.push();
        p5.translate(centerX, centerY);
        
        // Rotation speed varies by type
        const rotateSpeed = this.type === 'golden' ? 0.002 : this.type === 'bonus' ? 0.001 : 0.0005;
        p5.rotate(time * rotateSpeed);
        
        // Glow effect
        p5.drawingContext.shadowBlur = this.config.effects.glowAmount[this.type];
        p5.drawingContext.shadowColor = this.config.colors[this.type].glow;
        
        p5.fill(this.config.colors[this.type].primary);
        p5.noStroke();
        
        // Different shapes for different types
        if (this.type === 'golden') {
            // Star shape for golden food
            this.drawStar(p5, 0, 0, size * 0.4, size * 0.8, 5);
        } else if (this.type === 'bonus') {
            // Diamond shape for bonus food
            p5.beginShape();
            p5.vertex(0, -size/2);
            p5.vertex(size/2, 0);
            p5.vertex(0, size/2);
            p5.vertex(-size/2, 0);
            p5.endShape(p5.CLOSE);
        } else {
            // Rounded square for regular food
            p5.rectMode(p5.CENTER);
            p5.rect(0, 0, size, size, size * 0.2);
        }
        
        p5.pop();
    }

    /**
     * Draws a star shape
     * @param {import('p5')} p5 - The p5.js instance
     * @param {number} x - Center X coordinate
     * @param {number} y - Center Y coordinate
     * @param {number} radius1 - Inner radius
     * @param {number} radius2 - Outer radius
     * @param {number} npoints - Number of points
     * @private
     */
    drawStar(p5, x, y, radius1, radius2, npoints) {
        let angle = Math.PI * 2 / npoints;
        let halfAngle = angle / 2.0;
        p5.beginShape();
        for (let a = 0; a < Math.PI * 2; a += angle) {
            let sx = x + Math.cos(a) * radius2;
            let sy = y + Math.sin(a) * radius2;
            p5.vertex(sx, sy);
            sx = x + Math.cos(a + halfAngle) * radius1;
            sy = y + Math.sin(a + halfAngle) * radius1;
            p5.vertex(sx, sy);
        }
        p5.endShape(p5.CLOSE);
    }
}
