import type P5 from 'p5';
import configManager from '../config/gameConfig';
import type { FoodConfig, FoodType, FoodColors } from '../config/types.ts';
import type { SnakeGame } from '../types';
import type { Position, Obstacle, Grid } from './types';

/**
 * Represents a food item in the game that the snake can collect.
 * Food items have different geometric patterns based on their type:
 * - Regular: Mandala pattern with gentle rotation
 * - Bonus: Crystal with energy arcs
 * - Golden: Portal with reality-bending effects
 */

export class Food {
	private color: string;
	private config: FoodConfig;
	private game: SnakeGame;
	private grid: Grid;
	private lastPositions: Set<Position>;
	private position: Position;
	private spawnTime: number;
	private type: FoodType;

	constructor(grid: Grid, game: SnakeGame) {
		this.grid = grid;
		this.game = game;
		this.config = configManager.getConfig().food;
		this.type = this.getRandomType();
		this.color = this.config.colors[this.type].primary!;
		this.lastPositions = new Set();
		this.position = this.getInitialPosition();
		this.spawnTime = Date.now();
	}

	private getInitialPosition(): Position {
		let newPosition: Position;
		let attempts = 0;
		const maxAttempts = 100;
		const snakeSegments = this.game.getSnake().segments;

		do {
			newPosition = this.getRandomPosition();
			attempts++;
			const hasConflict = snakeSegments.some(segment =>
				this.arePositionsEqual(segment, newPosition)
			);
			if (!hasConflict) break;
		} while (attempts < maxAttempts);

		if (attempts >= maxAttempts) {
			// Fallback: Find first free position (rare case)
			newPosition = this.findFreePosition(snakeSegments);
		}

		return newPosition;
	}

	private findFreePosition(obstacles: Position[]): Position {
		const gridSize = this.grid.getSize();
		for (let y = 0; y < gridSize.height; y++) {
			for (let x = 0; x < gridSize.width; x++) {
				const pos = { x, y };
				if (!obstacles.some(ob => this.arePositionsEqual(ob, pos))) {
					return pos;
				}
			}
		}
		// If grid is full (extremely rare), return a default safe spot
		return { x: 0, y: 0 };
	}

	private getRandomPosition(): Position {
		return this.grid.getRandomPosition(true);
	}

	private arePositionsEqual(pos1: Position, pos2: Position): boolean {
		return pos1.x === pos2.x && pos1.y === pos2.y;
	}

	private getRandomType(): FoodType {
		const rand = Math.random();
		const rates = this.config.spawnRates;
		if (rand < rates.golden) return 'golden';
		if (rand < rates.golden + rates.bonus) return 'bonus';
		return 'regular';
	}

	public getType(): FoodType {
		return this.type;
	}

	public getPosition(): Position {
		return this.position;
	}

	public getColor(): string {
		return this.color;
	}

	public getPoints(): number {
		// Get base points for this food type
		const basePoints = this.config.points[this.type];
		const hasPointsEffect = this.game.getSnake().hasEffect('points');
		return hasPointsEffect ? basePoints * 2 : basePoints;
	}

	public get segments(): Position[] {
		return [this.position];
	}

	public respawn(obstacles: Obstacle[] = [], type?: FoodType): void {
		let newPosition: Position;
		let attempts = 0;
		const maxAttempts = 100;

		do {
			newPosition = this.getRandomPosition();
			attempts++;
			const hasConflict =
				obstacles.some(obstacle =>
					obstacle.segments.some(segment => this.arePositionsEqual(segment, newPosition))
				) ||
				Array.from(this.lastPositions).some(pos =>
					this.arePositionsEqual(pos, newPosition)
				);
			if (!hasConflict) break;
		} while (attempts < maxAttempts);

		if (attempts >= maxAttempts) {
			newPosition = this.findFreePosition(obstacles.flatMap(ob => ob.segments));
		}

		this.position = newPosition;
		this.type = type || this.getRandomType();
		this.color = this.config.colors[this.type].primary!;
		this.spawnTime = Date.now();

		this.lastPositions.add({ ...newPosition });
		if (this.lastPositions.size > 5) {
			const oldest = Array.from(this.lastPositions)[0];
			if (this.arePositionsEqual(oldest, newPosition)) {
				this.lastPositions.delete(oldest);
			} else {
				this.lastPositions.delete(Array.from(this.lastPositions)[0]);
			}
		}
	}

	public draw(p5: P5): void {
		const cellSize = this.grid.getCellSize();
		const pixelSize = cellSize * this.config.effects.pixelSize[this.type];
		const colors: FoodColors = this.config.colors[this.type];

		// Calculate animation offsets
		const bounceOffset =
			Math.sin((Date.now() / this.config.effects.bounceSpeed[this.type]) * Math.PI * 2) *
			pixelSize;
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

		switch (this.type) {
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

	private drawApple(p5: P5, pixelSize: number, colors: FoodColors): void {
		// Make the apple fill most of the cell
		const scale = 0.8;
		pixelSize *= scale;

		const pixels = [
			[0, 0, 0, 1, 1, 0, 0, 0],
			[0, 0, 1, 1, 1, 1, 0, 0],
			[0, 1, 1, 1, 1, 1, 1, 0],
			[1, 1, 1, 1, 1, 1, 1, 1],
			[1, 1, 1, 1, 1, 1, 1, 1],
			[0, 1, 1, 1, 1, 1, 1, 0],
			[0, 0, 1, 1, 1, 1, 0, 0],
			[0, 0, 0, 1, 1, 0, 0, 0],
		];

		const leafPixels = [
			[0, 0, 0, 1, 0, 0],
			[0, 0, 1, 1, 0, 0],
			[0, 0, 0, 1, 0, 0],
		];

		// Center the apple in the cell
		const offsetX = (-pixels[0].length * pixelSize) / 2;
		const offsetY = (-pixels.length * pixelSize) / 2;

		// Draw leaf
		p5.fill(colors.secondary);
		this.drawPixelArray(
			p5,
			leafPixels,
			pixelSize,
			offsetX + pixelSize * 2,
			offsetY - pixelSize
		);

		// Draw apple body
		p5.fill(colors.primary);
		this.drawPixelArray(p5, pixels, pixelSize, offsetX, offsetY);

		// Add highlight
		p5.fill(colors.highlight);
		p5.noStroke();
		p5.rect(offsetX + pixelSize * 2, offsetY + pixelSize * 2, pixelSize, pixelSize);
	}

	private drawCherries(p5: P5, pixelSize: number, colors: FoodColors): void {
		// Make the cherries fill most of the cell
		const scale = 0.9;
		pixelSize *= scale;

		const cherryPixels = [
			[0, 1, 1, 0],
			[1, 1, 1, 1],
			[1, 1, 1, 1],
			[0, 1, 1, 0],
		];

		// Center the cherries in the cell
		const totalWidth = 10 * pixelSize; // Total width of both cherries
		const offsetX = -totalWidth / 2;
		const offsetY = (-cherryPixels.length * pixelSize) / 2;

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

	private drawStarFruit(
		p5: P5,
		pixelSize: number,
		colors: FoodColors,
		sparklePhase: number
	): void {
		// Make the star fill most of the cell
		const scale = 0.9;
		pixelSize *= scale;

		const starPixels = [
			[0, 0, 0, 1, 0, 0, 0],
			[0, 0, 1, 1, 1, 0, 0],
			[0, 1, 1, 1, 1, 1, 0],
			[1, 1, 1, 1, 1, 1, 1],
			[0, 1, 1, 1, 1, 1, 0],
			[0, 0, 1, 1, 1, 0, 0],
			[0, 0, 0, 1, 0, 0, 0],
		];

		// Center the star in the cell
		const offsetX = (-starPixels[0].length * pixelSize) / 2;
		const offsetY = (-starPixels.length * pixelSize) / 2;

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

	private drawPixelArray(
		p5: P5,
		pixels: number[][],
		size: number,
		offsetX: number = 0,
		offsetY: number = 0
	): void {
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
