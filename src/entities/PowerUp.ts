import type P5 from 'p5';
import configManager from '../config/gameConfig';
import type { PowerUpConfig, PowerUpType } from '../config/types';
import type { Obstacle, Position } from './types';
import type { Snake } from './Snake';
import type { Grid } from '../core/Grid';

/**
 * PowerUp class represents a collectible power-up in the game that provides
 * temporary effects to the snake when collected.
 */
export class PowerUp {
	position: Position;
	type: PowerUpType;

	private grid: Grid;
	private config: PowerUpConfig;
	private spawnTime: number;
	private crystalPath: Path2D | null = null;

	/**
	 * Creates a new PowerUp instance
	 * @param grid - The game grid instance
	 * @param obstacles - Array of obstacles to avoid when spawning
	 */
	constructor(grid: Grid, obstacles: Obstacle[] = []) {
		this.grid = grid;
		this.config = configManager.getConfig().powerUps;
		this.position = this.getRandomPosition(obstacles);
		this.type = this.getRandomType();
		this.spawnTime = Date.now();
		this.createCrystalPath();
	}

	private createCrystalPath(): void {
		const cellSize = this.grid.getCellSize();
		const baseSize = this.config.visual?.baseSize || 1;
		const effectScale = cellSize < 20 ? baseSize * 0.5 : baseSize;
		const glowSize = cellSize * effectScale;
		this.crystalPath = new Path2D();
		const points = 6;
		for (let i = 0; i < points; i++) {
			const angle = (i * Math.PI * 2) / points;
			const x = (Math.cos(angle) * glowSize) / 2;
			const y = (Math.sin(angle) * glowSize) / 2;
			if (i === 0) this.crystalPath.moveTo(x, y);
			else this.crystalPath.lineTo(x, y);
		}
		this.crystalPath.closePath();
	}

	/**
	 * Gets a random valid position on the grid, avoiding obstacles
	 * @param obstacles - Array of obstacles to avoid
	 * @returns Random position coordinates
	 */
	private getRandomPosition(obstacles: Obstacle[]): Position {
		let newPosition: Position;
		let attempts = 0;
		const maxAttempts = 100;

		do {
			newPosition = this.grid.getRandomPosition(true);
			attempts++;

			// Check if position conflicts with any obstacles
			const hasConflict = obstacles.some(obstacle => {
				if (Array.isArray(obstacle.segments)) {
					return obstacle.segments.some(
						segment => segment.x === newPosition.x && segment.y === newPosition.y
					);
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
	 * @returns Random power-up type
	 * @throws {Error} If no valid power-up types are configured
	 */
	private getRandomType(): PowerUpType {
		const config = this.config;
		const types = config.types;
		if (types.length === 0) return 'speed';

		// Weighted random selection
		if (config.spawnRates) {
			const rand = Math.random();
			let cumulative = 0;
			for (const type of types) {
				cumulative += config.spawnRates[type] || 0;
				if (rand < cumulative) return type as PowerUpType;
			}
		}
		// Fallback to uniform if no spawnRates or sum < 1
		return types[Math.floor(Math.random() * types.length)] as PowerUpType;
	}

	/**
	 * Applies the power-up effect to the snake
	 * @param snake - The snake to apply the effect to
	 * @fires Snake#power_up_collected
	 * @fires Snake#power_up_started
	 */
	apply(snake: Snake): void {
		snake.addEffect(this.type);
	}

	/**
	 * Sets the power-up's type
	 * @param type The type of power-up to set
	 */
	setType(type: PowerUpType): void {
		this.type = type;
	}

	/**
	 * Gets the power-up's spawn time
	 */
	get powerUpSpawnTime(): number {
		return this.spawnTime;
	}

	/**
	 * Draws the power-up on the canvas
	 * @param p5 - The p5.js instance
	 */
	draw(p5: P5): void {
		const color = this.config.colors[this.type];
		const coords = this.grid.toPixelCoords(this.position.x, this.position.y);
		const cellSize = this.grid.getCellSize();
		const center = { x: coords.x + cellSize / 2, y: coords.y + cellSize / 2 };

		// Get size from configuration
		const baseSize = this.config.visual?.baseSize || 1;
		const effectScale = cellSize < 20 ? baseSize * 0.5 : baseSize;
		const floatAmplitude = Math.min(2, cellSize * 0.1);
		const floatOffset = Math.sin(p5.frameCount * 0.05) * floatAmplitude;
		const glowSize = cellSize * effectScale;
		const iconSize = cellSize * (this.config.visual?.iconSize || 0.5);

		p5.push();
		p5.translate(center.x, center.y + floatOffset);

		// Draw outer glow
		p5.drawingContext.shadowBlur = Math.min(10, cellSize * 0.2);
		p5.drawingContext.shadowColor = color;

		// Draw crystal backdrop (hexagonal)
		p5.noStroke();
		p5.fill(color + '33'); // Semi-transparent
		p5.drawingContext.fill(this.crystalPath!);
		// this.#drawCrystal(p5, glowSize);

		// Draw inner icon
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.textSize(iconSize);
		p5.fill(255, 230); // Slightly transparent white
		p5.text(this.config.icons[this.type], 0, 0);

		// Draw shimmering effect with scaled particles
		this.#drawShimmer(p5, cellSize * (this.config.visual?.baseSize || 1));

		// Draw energy field
		this.#drawEnergyField(p5, cellSize * (this.config.visual?.baseSize || 1), color);

		p5.pop();
	}

	/**
	 * Draws the crystal hexagonal shape
	 * @param p5 - The p5.js instance
	 * @param size - Size of the crystal
	 */
	#drawCrystal(p5: P5, size: number): void {
		const points = 6;
		p5.beginShape();
		for (let i = 0; i < points; i++) {
			const angle = (i * p5.TWO_PI) / points - p5.frameCount * 0.01; // Negative for reverse rotation
			const x = (Math.cos(angle) * size) / 2;
			const y = (Math.sin(angle) * size) / 2;
			p5.vertex(x, y);
		}
		p5.endShape(p5.CLOSE);
	}

	/**
	 * Draws rotating shimmer points
	 * @param p5 - The p5.js instance
	 * @param size - Size of the shimmer area
	 */
	#drawShimmer(p5: P5, size: number): void {
		const shimmerCount = 5;
		for (let i = 0; i < shimmerCount; i++) {
			const angle = (p5.frameCount * 0.02 + (i * p5.TWO_PI) / shimmerCount) % p5.TWO_PI;
			const x = Math.cos(angle) * size * 0.3;
			const y = Math.sin(angle) * size * 0.3;

			p5.fill(255, 150);
			p5.circle(x, y, 4);
		}
	}

	/**
	 * Draws an energy field effect around the crystal
	 * @param p5 - The p5.js instance
	 * @param size - Size of the energy field
	 * @param color - Color of the energy field
	 */
	#drawEnergyField(p5: P5, size: number, color: string): void {
		const particleCount = 8;
		const time = p5.frameCount * 0.05;

		// Add glow effect
		p5.drawingContext.shadowBlur = size * 0.1;
		p5.drawingContext.shadowColor = color;

		// Draw solid orbital particles with pulse
		p5.fill(color + 'AA');
		p5.noStroke();

		for (let i = 0; i < particleCount; i++) {
			const angle = (i / particleCount) * p5.TWO_PI;
			const x = Math.cos(angle + time) * size * 0.6;
			const y = Math.sin(angle + time) * size * 0.6;

			// Add subtle pulse effect
			const pulse = 1 + Math.sin(time * 2 + i) * 0.2;
			const particleSize = size * 0.12 * pulse;

			p5.circle(x, y, particleSize);
		}

		// Reset shadow for other rendering
		p5.drawingContext.shadowBlur = 0;
	}
}
