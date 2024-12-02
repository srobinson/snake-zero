import { Grid } from '../core-ts/Grid';
import { Position, FoodType } from '../types-ts/commonTypes';
import type { Game } from '../types-ts/gameTypes';
import type { FoodConfig } from '../config-ts/types';
import type { FoodDrawingContext, FoodDrawingConfig, Obstacle } from '../types-ts/foodTypes';
import type p5 from 'p5';

/**
 * Represents a food item in the game that the snake can collect.
 * Food items have different geometric patterns based on their type:
 * - Regular: Mandala pattern with gentle rotation
 * - Bonus: Crystal with energy arcs
 * - Golden: Portal with reality-bending effects
 */
export class Food implements Obstacle {
    private grid: Grid;
    private config: FoodConfig;
    private type: FoodType;
    private _position: Position;
    private color: string;
    private lastPositions: Set<string>;
    private spawnTime: number;

    constructor(grid: Grid) {
        this.grid = grid;
        const gridGame = grid.getGame();
        this.config = gridGame.getConfig().food;
        this.type = this.getRandomType();
        this._position = this.getRandomPosition();
        this.color = this.config.colors[this.type].primary;
        this.lastPositions = new Set();
        this.spawnTime = Date.now();
    }

    private getRandomPosition(): Position {
        return this.grid.getRandomPosition(true);
    }

    private getRandomType(): FoodType {
        const rand = Math.random();
        const rates = this.config.spawnRates;
        if (rand < rates['golden']) return 'golden';
        if (rand < rates['golden'] + rates['bonus']) return 'bonus';
        return 'regular';
    }

    public getPoints(): number {
        const basePoints = this.config.points[this.type];
        
        // Apply 2x multiplier if points powerup is active
        const snake = this.grid.getGame().snake;
        if (snake && snake.hasEffect('points')) {
            return basePoints * 2;
        }
        
        return basePoints;
    }

    public getColor(): string {
        return this.color;
    }

    // Public getter for position
    public getPosition(): Position {
        return { ...this._position };
    }

    public setGame(game: Game): void {
        // Removed this.game = game;
    }

    public respawn(obstacles: Array<Obstacle> = []): void {
        let newPosition: Position;
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
        this._position = newPosition;
        this.type = this.getRandomType();
        this.color = this.config.colors[this.type].primary;
        this.spawnTime = Date.now();

        // Add to recent positions (keep last 5)
        this.lastPositions.add(`${newPosition.x},${newPosition.y}`);
        if (this.lastPositions.size > 5) {
            this.lastPositions.delete(this.lastPositions.values().next().value);
        }
    }

    public draw(p5: p5): void {
        const cellSize = this.grid.cellSize;
        const pixelSize = cellSize * this.config.effects.pixelSize[this.type];
        const colors = this.config.colors[this.type];
        
        // Calculate animation offsets
        const bounceOffset = Math.sin(Date.now() / this.config.effects.bounceSpeed[this.type] * Math.PI * 2) * pixelSize;
        const sparklePhase = (Date.now() / this.config.effects.sparkleSpeed[this.type]) % 1;
        
        p5.push();
        p5.translate(this._position.x * cellSize + cellSize / 2,
                    this._position.y * cellSize + cellSize / 2 + bounceOffset);

        // Add glow effect
        const glowRadius = this.config.effects.glow[this.type];
        if (glowRadius > 0) {
            p5.drawingContext.shadowBlur = glowRadius;
            p5.drawingContext.shadowColor = colors.primary;
        }
        
        const context: FoodDrawingContext = { p5, pixelSize, colors, sparklePhase };
        
        switch(this.type) {
            case 'regular':
                this.drawApple(context);
                break;
            case 'bonus':
                this.drawCherries(context);
                break;
            case 'golden':
                this.drawStarFruit(context);
                break;
        }

        // Reset glow
        p5.drawingContext.shadowBlur = 0;
        
        p5.pop();
    }

    private drawApple(context: FoodDrawingContext): void {
        const { p5, pixelSize: basePixelSize, colors } = context;
        
        // Make the apple fill most of the cell
        const scale = 0.8;
        const pixelSize = basePixelSize * scale;
        
        console.log(pixelSize);
        
        
        const pixels: number[][] = [
            [0,0,0,1,1,0,0,0],
            [0,0,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,0,0],
            [0,0,0,1,1,0,0,0]
        ];

        const leafPixels: number[][] = [
            [0,0,0,1,0,0],
            [0,0,1,1,0,0],
            [0,0,0,1,0,0]
        ];

        // Center the apple in the cell
        const offsetX = -pixels[0].length * pixelSize / 2;
        const offsetY = -pixels.length * pixelSize / 2;

        // Draw leaf
        p5.fill(colors.secondary);
        this.drawPixelArray(context, { pixels: leafPixels, scale, offsetX: offsetX + pixelSize * 2, offsetY: offsetY - pixelSize });

        // Draw apple body
        p5.fill(colors.primary);
        this.drawPixelArray(context, { pixels, scale, offsetX, offsetY });

        // Add highlight
        p5.fill(colors.highlight);
        p5.noStroke();
        p5.rect(offsetX + pixelSize * 2, offsetY + pixelSize * 2, pixelSize, pixelSize);
    }

    private drawCherries(context: FoodDrawingContext): void {
        const { p5, pixelSize: basePixelSize, colors } = context;
        
        // Make the cherries fill most of the cell
        const scale = 0.9;
        const pixelSize = basePixelSize * scale;
        
        const cherryPixels: number[][] = [
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
        this.drawPixelArray(context, { pixels: cherryPixels, scale, offsetX, offsetY });
        this.drawPixelArray(context, { pixels: cherryPixels, scale, offsetX: offsetX + pixelSize * 6, offsetY });

        // Add highlights
        p5.fill(colors.highlight);
        p5.rect(offsetX + pixelSize, offsetY + pixelSize, pixelSize, pixelSize);
        p5.rect(offsetX + pixelSize * 7, offsetY + pixelSize, pixelSize, pixelSize);
    }

    private drawStarFruit(context: FoodDrawingContext): void {
        const { p5, pixelSize: basePixelSize, colors, sparklePhase } = context;
        
        // Make the star fill most of the cell
        const scale = 0.9;
        const pixelSize = basePixelSize * scale;
        
        const starPixels: number[][] = [
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
        this.drawPixelArray(context, { pixels: starPixels, scale, offsetX, offsetY });

        // Add sparkle effect
        if (sparklePhase && sparklePhase < 0.5) {
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

    private drawPixelArray(context: FoodDrawingContext, config: FoodDrawingConfig): void {
        const { p5, pixelSize } = context;
        const { pixels, offsetX = 0, offsetY = 0 } = config;
        
        // Draw outline if enabled
        if (this.config.effects.glowIntensity[this.type] > 0) {
            p5.stroke(0);
            p5.strokeWeight(this.config.effects.glowIntensity[this.type]);
        } else {
            p5.noStroke();
        }

        for (let y = 0; y < pixels.length; y++) {
            for (let x = 0; x < pixels[y].length; x++) {
                if (pixels[y][x]) {
                    p5.rect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
                }
            }
        }
    }

    // Implement the Obstacle interface
    public get segments(): Array<Position> {
        return [{ ...this._position }];
    }
}
