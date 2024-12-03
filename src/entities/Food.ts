import configManager from '../config/gameConfig';
import type { FoodConfig } from '../config/types';
import type { Game } from '../main';
import type { Position, Obstacle, Grid, FoodType, FoodColors } from './types';

/**
 * Represents a food item in the game that the snake can collect.
 * Food items have different geometric patterns based on their type:
 * - Regular: Mandala pattern with gentle rotation
 * - Bonus: Crystal with energy arcs
 * - Golden: Portal with reality-bending effects
 */

export class Food {
    private grid: Grid;
    private config: FoodConfig;
    private type: FoodType;
    private position: Position;
    private color: string;
    private lastPositions: Set<string>;
    private spawnTime: number;
    private game?: Game;

    constructor(grid: Grid) {
        this.grid = grid;
        this.config = configManager.getConfig().food;
        this.type = this.getRandomType();
        this.position = this.getRandomPosition();
        // Ensure color exists with type assertion since we know these colors are defined in config
        this.color = this.config.colors[this.type].primary!;
        this.lastPositions = new Set();
        this.spawnTime = Date.now();
        this.game = grid.game;
    }

    private getRandomPosition(): Position {
        return this.grid.getRandomPosition(true);
    }

    private getRandomType(): FoodType {
        const rand = Math.random();
        const rates = this.config.spawnRates;
        if (rand < rates.golden) return 'golden';
        if (rand < rates.golden + rates.bonus) return 'bonus';
        return 'regular';
    }

    public getPoints(): number {
        // Get base points for this food type
        const basePoints = this.config.points[this.type];
        
        // Apply 2x multiplier if points powerup is active
        const powerups = this.game?.snake?.effects;
        if (powerups?.has('points')) {
            return basePoints * 2;
        }
        
        return basePoints;
    }

    public get segments(): Position[] {
        return [this.position];
    }

    public respawn(obstacles: Obstacle[] = []): void {
        let newPosition: Position;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            newPosition = this.getRandomPosition();
            attempts++;

            // Check if position conflicts with any obstacles or recent positions
            const hasConflict = obstacles.some(obstacle => 
                obstacle.segments.some(segment => 
                    segment.x === newPosition.x && segment.y === newPosition.y
                )
            ) || this.lastPositions.has(`${newPosition.x},${newPosition.y}`);

            if (!hasConflict) {
                break;
            }
        } while (attempts < maxAttempts);

        // Update position and type
        this.position = newPosition;
        this.type = this.getRandomType();
        // Ensure color exists with type assertion
        this.color = this.config.colors[this.type].primary!;
        this.spawnTime = Date.now();

        // Add to recent positions (keep last 5)
        this.lastPositions.add(`${newPosition.x},${newPosition.y}`);
        if (this.lastPositions.size > 5) {
            if (this.lastPositions.has(`${this.position.x},${this.position.y}`)) {
                this.lastPositions.delete(`${this.position.x},${this.position.y}`);
            }
        }
    }

    public draw(p5: any): void {
        const cellSize = this.grid.cellSize;
        const pixelSize = cellSize * this.config.effects.pixelSize[this.type];
        const colors: FoodColors = this.config.colors[this.type];

        // Calculate animation offsets
        const bounceOffset = Math.sin(Date.now() / this.config.effects.bounceSpeed[this.type] * Math.PI * 2) * pixelSize;
        const sparklePhase = (Date.now() / this.config.effects.sparkleSpeed[this.type]) % 1;
        
        p5.push();
        p5.translate(
            this.position.x * cellSize + cellSize / 2,
            this.position.y * cellSize + cellSize / 2 + bounceOffset
        );

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

    private drawApple(p5: any, pixelSize: number, colors: FoodColors): void {
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

    private drawCherries(p5: any, pixelSize: number, colors: FoodColors): void {
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

    private drawStarFruit(p5: any, pixelSize: number, colors: FoodColors, sparklePhase: number): void {
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

    private drawPixelArray(p5: any, pixels: number[][], size: number, offsetX: number = 0, offsetY: number = 0): void {
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
