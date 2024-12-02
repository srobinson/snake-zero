// @ts-check
import configManager from '../config/gameConfig.js';

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
 * Food items have different geometric patterns based on their type:
 * - Regular: Mandala pattern with gentle rotation
 * - Bonus: Crystal with energy arcs
 * - Golden: Portal with reality-bending effects
 */
export class Food {
    constructor(grid) {
        this.grid = grid;
        /** @type {import('../config/gameConfig.js').FoodConfig} */
        this.config = configManager.getConfig().food;
        /** @type {'regular' | 'bonus' | 'golden'} */
        this.type = this.getRandomType();
        /** @type {Position} */
        this.position = this.getRandomPosition();
        /** @type {string} */
        this.color = this.config.colors[this.type].primary;
        /** @type {Set<string>} */
        this.lastPositions = new Set();
        /** @type {number} */
        this.spawnTime = Date.now();
        
        // Store reference to game instance from grid
        /** @type {import('../main.js').default|undefined} */
        this.game = grid.game;
    }

    getRandomPosition() {
        return this.grid.getRandomPosition(true);
    }

    getRandomType() {
        const rand = Math.random();
        const rates = this.config.spawnRates;
        if (rand < rates.golden) return 'golden';
        if (rand < rates.golden + rates.bonus) return 'bonus';
        return 'regular';
    }

    getPoints() {
        // Get base points for this food type
        const basePoints = this.config.points[this.type];
        
        // Apply 2x multiplier if points powerup is active
        const powerups = this.game?.snake?.effects;
        if (powerups?.has('points')) {
            return basePoints * 2;
        }
        
        return basePoints;
    }

    /**
     * Respawns the food at a new random position, avoiding obstacles
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

        // Update position and type
        this.position = newPosition;
        this.type = this.getRandomType();
        this.color = this.config.colors[this.type].primary;
        this.spawnTime = Date.now();

        // Add to recent positions (keep last 5)
        this.lastPositions.add(`${newPosition.x},${newPosition.y}`);
        if (this.lastPositions.size > 5) {
            this.lastPositions.delete(this.lastPositions.values().next().value);
        }
    }

    /**
     * Draws the food item using pixel art
     * @param {import('p5')} p5 - The p5.js instance
     */
    draw(p5) {
        const cellSize = this.grid.cellSize;
        const pixelSize = cellSize * this.config.effects.pixelSize[this.type];
        const colors = this.config.colors[this.type];
        
        // Calculate animation offsets
        const bounceOffset = Math.sin(Date.now() / this.config.effects.bounceSpeed[this.type] * Math.PI * 2) * pixelSize;
        const sparklePhase = (Date.now() / this.config.effects.sparkleSpeed[this.type]) % 1;
        
        p5.push();
        p5.translate(this.position.x * cellSize + cellSize / 2,
                    this.position.y * cellSize + cellSize / 2 + bounceOffset);

        // Add glow effect
        const glowRadius = this.config.effects.glow[this.type];
        if (glowRadius > 0) {
            p5.drawingContext.shadowBlur = glowRadius;
            p5.drawingContext.shadowColor = colors.primary;
        }
        
        switch(this.type) {
            case 'regular':
                this.drawApple(p5, pixelSize, colors);
                break;
            case 'bonus':
                this.drawCherries(p5, pixelSize, colors);
                break;
            case 'golden':
                this.drawStarFruit(p5, pixelSize, colors, sparklePhase);
                break;
        }

        // Reset glow
        p5.drawingContext.shadowBlur = 0;
        
        p5.pop();
    }

    /**
     * Draws an 8-bit style apple
     * @private
     */
    drawApple(p5, pixelSize, colors) {
        // Make the apple fill most of the cell
        const scale = 0.8;
        pixelSize *= scale;
        
        const pixels = [
            [0,0,0,1,1,0,0,0],
            [0,0,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,0,0],
            [0,0,0,1,1,0,0,0]
        ];

        const leafPixels = [
            [0,0,0,1,0,0],
            [0,0,1,1,0,0],
            [0,0,0,1,0,0]
        ];

        // Center the apple in the cell
        const offsetX = -pixels[0].length * pixelSize / 2;
        const offsetY = -pixels.length * pixelSize / 2;

        // Draw leaf
        p5.fill(colors.secondary);
        this.drawPixelArray(p5, leafPixels, pixelSize, offsetX + pixelSize * 2, offsetY - pixelSize);

        // Draw apple body
        p5.fill(colors.primary);
        this.drawPixelArray(p5, pixels, pixelSize, offsetX, offsetY);

        // Add highlight
        p5.fill(colors.highlight);
        p5.noStroke();
        p5.rect(offsetX + pixelSize * 2, offsetY + pixelSize * 2, pixelSize, pixelSize);
    }

    /**
     * Draws pixel art cherries
     * @private
     */
    drawCherries(p5, pixelSize, colors) {
        // Make the cherries fill most of the cell
        const scale = 0.9;
        pixelSize *= scale;
        
        const cherryPixels = [
            [0,1,1,0],
            [1,1,1,1],
            [1,1,1,1],
            [0,1,1,0]
        ];

        // Center the cherries in the cell
        const totalWidth = 10 * pixelSize; // Total width of both cherries
        const offsetX = -totalWidth / 2;
        const offsetY = -cherryPixels.length * pixelSize / 2;

        // Draw stem
        p5.stroke(colors.secondary);
        p5.strokeWeight(pixelSize);
        p5.noFill();
        p5.beginShape();
        p5.vertex(offsetX + pixelSize * 3, offsetY - pixelSize);
        p5.vertex(offsetX + pixelSize * 5, offsetY - pixelSize * 2);
        p5.vertex(offsetX + pixelSize * 7, offsetY - pixelSize);
        p5.endShape();

        // Draw cherries
        p5.fill(colors.primary);
        p5.noStroke();
        this.drawPixelArray(p5, cherryPixels, pixelSize, offsetX, offsetY);
        this.drawPixelArray(p5, cherryPixels, pixelSize, offsetX + pixelSize * 6, offsetY);

        // Add highlights
        p5.fill(colors.highlight);
        p5.rect(offsetX + pixelSize, offsetY + pixelSize, pixelSize, pixelSize);
        p5.rect(offsetX + pixelSize * 7, offsetY + pixelSize, pixelSize, pixelSize);
    }

    /**
     * Draws pixel art star fruit with sparkle effect
     * @private
     */
    drawStarFruit(p5, pixelSize, colors, sparklePhase) {
        // Make the star fill most of the cell
        const scale = 0.9;
        pixelSize *= scale;
        
        const starPixels = [
            [0,0,0,1,0,0,0],
            [0,0,1,1,1,0,0],
            [0,1,1,1,1,1,0],
            [1,1,1,1,1,1,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0],
            [0,0,0,1,0,0,0]
        ];

        // Center the star in the cell
        const offsetX = -starPixels[0].length * pixelSize / 2;
        const offsetY = -starPixels.length * pixelSize / 2;

        // Draw star body
        p5.fill(colors.primary);
        this.drawPixelArray(p5, starPixels, pixelSize, offsetX, offsetY);

        // Add sparkle effect
        if (sparklePhase < 0.5) {
            const sparkleOpacity = Math.sin(sparklePhase * Math.PI);
            p5.fill(colors.highlight);
            p5.noStroke();
            const alpha = p5.map(sparkleOpacity, 0, 1, 0, 255);
            p5.drawingContext.globalAlpha = alpha / 255;
            p5.rect(offsetX + pixelSize * 3, offsetY + pixelSize * 3, pixelSize, pixelSize);
            p5.rect(offsetX + pixelSize * 4, offsetY + pixelSize * 4, pixelSize, pixelSize);
            p5.drawingContext.globalAlpha = 1;
        }
    }

    /**
     * Helper to draw pixel arrays
     * @private
     */
    drawPixelArray(p5, pixels, size, offsetX = 0, offsetY = 0) {
        const outlineWeight = this.config.effects.outlineWeight[this.type];
        
        // Draw outline first if enabled
        if (outlineWeight > 0) {
            p5.stroke(0);
            p5.strokeWeight(outlineWeight);
        } else {
            p5.noStroke();
        }

        for (let y = 0; y < pixels.length; y++) {
            for (let x = 0; x < pixels[y].length; x++) {
                if (pixels[y][x]) {
                    p5.rect(offsetX + x * size, offsetY + y * size, size, size);
                }
            }
        }
    }
}
