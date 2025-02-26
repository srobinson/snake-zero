// src/entities/Snake.ts

// Import p5.js type for rendering
import type P5 from 'p5';
// Import configuration manager for game settings
import configManager from '../config/gameConfig';
// Import game and grid types for context
import type { SnakeGame } from '../types';
import type { Grid } from '../core/Grid';
// Import Food type for collision detection
import type { Food } from './Food';
// Import custom types for snake-specific data
import type { Effect, Obstacle, Position, PowerUpType, Direction, DrawingContext } from './types';
// Import game event constants
import { GameEvents, ScoreChangedEventData } from '../config/types';

/**
 * Represents the player-controlled snake entity in the game.
 * Manages movement, growth, effects (e.g., speed, ghost), collisions, and rendering.
 * Implements Obstacle interface for collision detection with other entities.
 */
export class Snake implements Obstacle {
	/** Map of active power-up effects (e.g., 'speed', 'ghost') and their stacks */
	public readonly effects: Map<PowerUpType, Effect[]>;

	/** Array of snake segment positions, starting with the head */
	public readonly segments: Position[];

	/** Total number of food items eaten by the snake */
	public foodEaten: number;

	/** Reference to the game grid for spatial calculations */
	private readonly grid: Grid;

	/** Reference to the game instance for event emission and context */
	private readonly game: SnakeGame;

	/** Game configuration loaded from configManager */
	private readonly config = configManager.getConfig();

	/** Base speed of the snake, adjusted by difficulty and progression */
	private baseSpeed: number;

	/** Current direction of snake movement */
	private direction: Direction;

	/** Flag indicating if the snake should grow on the next move */
	private growing: boolean;

	/** Timestamp of the last snake movement */
	private lastMoveTime: number;

	/** Interval between moves, derived from speed (unused but tracked) */
	private moveInterval: number = 0;

	/** Next direction to move, set by input and applied on update */
	private nextDirection: Direction;

	/** Progress of interpolation between moves (0 to 1) for smooth animation */
	private interpolationProgress: number = 0;

	/** Source position for head interpolation */
	private sourcePosition: Position = { x: 0, y: 0 };

	/** Target position for head interpolation */
	private targetPosition: Position = { x: 0, y: 0 };

	/** Interpolated segment positions for rendering smooth movement */
	private interpolatedSegments: Position[];

	/** Maximum number of trail segments for speed effect */
	private maxTrailLength = 5;

	/** Array of past segment positions for trail effects */
	private trailPositions: Position[][] = [];

	/** Cached Path2D object for rendering speed trail */
	private trailPath: Path2D | null = null;

	/** Ghost trail positions with timestamps for fading effect */
	private ghostTrails: { x: number; y: number; time: number }[] = [];

	/**
	 * Initializes a new snake instance with starting position and configuration.
	 * @param grid - Game grid for positioning and collision
	 * @param game - Game instance for event handling and context
	 */
	constructor(grid: Grid, game: SnakeGame) {
		this.grid = grid;
		this.game = game;
		this.effects = new Map(); // Initialize empty effects map

		this.segments = []; // Start with empty segments array
		this.direction = (this.config.snake.initialDirection as Direction) || 'right'; // Default direction
		this.nextDirection = this.direction; // Next direction matches initial
		this.lastMoveTime = 0; // No moves yet
		this.growing = false; // Not growing initially
		this.foodEaten = 0; // No food eaten yet
		this.baseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed; // Base speed from config

		this.reset(); // Set up initial snake state
		this.interpolatedSegments = [...this.segments]; // Copy segments for interpolation
	}

	/**
	 * Resets the snake to its initial state, positioning it at the grid center.
	 * Clears effects, segments, and resets speed and direction.
	 */
	public reset(): void {
		const gridSize = this.grid.getSize();
		const centerX = Math.floor(gridSize.width / 2); // Center X of grid
		const centerY = Math.floor(gridSize.height / 2); // Center Y of grid

		this.segments.length = 0; // Clear existing segments
		// Initialize snake with head at center and body extending left
		this.segments.push({ x: centerX, y: centerY }, { x: centerX - 1, y: centerY });
		for (let i = 0; i < this.config.snake.initialLength - 2; i++) {
			this.segments.push({ x: centerX - (i + 2), y: centerY });
		}

		this.direction = (this.config.snake.initialDirection as Direction) || 'right'; // Reset direction
		this.nextDirection = this.direction; // Sync next direction
		this.lastMoveTime = 0; // Reset move timer
		this.growing = false; // Reset growth flag
		this.foodEaten = 0; // Reset food count
		this.effects.clear(); // Clear all effects
		this.baseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed; // Reset speed
		this.trailPositions = []; // Clear speed trail
		this.trailPath = null; // Clear cached trail path
	}

	/**
	 * Updates the snake’s position and state based on elapsed time.
	 * Moves the snake, updates effects, and handles interpolation for smooth animation.
	 * @param currentTime - Current time in milliseconds
	 * @returns True if the snake moved, false if waiting for next move interval
	 */
	public update(currentTime: number): boolean {
		this.updateEffects(); // Refresh active effects (e.g., remove expired ones)

		// Initialize last move time on first update
		if (!this.lastMoveTime) {
			this.lastMoveTime = currentTime;
			return false;
		}

		const elapsed = currentTime - this.lastMoveTime; // Time since last move
		if (elapsed < this.getMoveDelay()) {
			// If not enough time has passed, update interpolation for smooth movement
			if (this.interpolationProgress < 1) {
				this.interpolationProgress += 0.2; // Increment progress (0 to 1)
				this.interpolateSegments(); // Update interpolated positions
			}
			return false; // No move yet
		}

		// Apply next direction and move the snake
		this.direction = this.nextDirection;
		const head: Position = { ...this.segments[0] }; // Copy current head position

		// Update head position based on direction
		switch (this.direction) {
			case 'up':
				head.y--;
				break;
			case 'down':
				head.y++;
				break;
			case 'left':
				head.x--;
				break;
			case 'right':
				head.x++;
				break;
		}

		// Handle ghost effect: wrap around grid edges
		if (this.hasEffect('ghost')) {
			const segments = [head, this.segments[0]]; // Check both head and next segment
			const size = this.grid.getSize();
			for (const segment of segments) {
				if (segment.x < 0) segment.x = size.width - 1; // Wrap left to right
				if (segment.x >= size.width) segment.x = 0; // Wrap right to left
				if (segment.y < 0) segment.y = size.height - 1; // Wrap top to bottom
				if (segment.y >= size.height) segment.y = 0; // Wrap bottom to top
			}
		}

		// Set up interpolation for head movement
		this.sourcePosition = { ...this.segments[0] };
		this.targetPosition = head;
		this.interpolationProgress = 0;

		// Update segments: add new head, remove tail if not growing
		this.segments.unshift(head);
		if (!this.growing) {
			this.segments.pop(); // Remove tail if not growing
		} else {
			this.growing = false; // Reset growth flag after growing
		}

		// Update speed trail if active
		if (this.hasEffect('speed')) {
			this.trailPositions.push(this.segments.map(segment => ({ ...segment }))); // Record current segments
			if (this.trailPositions.length > this.maxTrailLength) {
				this.trailPositions.shift(); // Limit trail length
			}
			// Trail path updated in draw() where cellSize is available
		} else {
			this.trailPositions = []; // Clear trail when speed effect ends
			this.trailPath = null;
		}

		this.interpolateSegments(); // Update interpolated rendering positions
		this.lastMoveTime = currentTime; // Update last move time
		this.moveInterval = 1000 / this.getCurrentSpeed(); // Recalculate move interval

		return true; // Indicate a move occurred
	}

	/**
	 * Sets the snake’s next direction, preventing 180-degree turns.
	 * @param newDirection - Desired direction ('up', 'down', 'left', 'right')
	 */
	public setDirection(newDirection: Direction): void {
		const opposites: Record<Direction, Direction> = {
			up: 'down',
			down: 'up',
			left: 'right',
			right: 'left',
		};
		// Only allow direction change if not opposite to current direction
		if (this.direction !== opposites[newDirection]) {
			this.nextDirection = newDirection;
		}
	}

	/**
	 * Grows the snake by setting the growing flag and updates speed if configured.
	 * Emits a SCORE_CHANGED event with the new score.
	 */
	public grow(): void {
		this.growing = true;
		this.foodEaten = (this.foodEaten || 0) + 1;
		const basePoints = this.game.getEntityManager().getFood().getPoints();
		const multiplier = this.getPointsMultiplier();
		const scoreData: ScoreChangedEventData = { score: basePoints * multiplier };
		this.game.getEvents().emit(GameEvents.SCORE_CHANGED, scoreData);

		if (this.config.snake.speedProgression.enabled) {
			const difficultyBaseSpeed =
				this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
			const speedIncrease =
				this.foodEaten * this.config.snake.speedProgression.increasePerFood;
			this.baseSpeed = Math.min(
				difficultyBaseSpeed + speedIncrease,
				this.config.snake.speedProgression.maxSpeed
			);
		}
	}

	/**
	 * Updates the snake’s active effects, removing expired ones.
	 */
	private updateEffects(): void {
		const currentTime = Date.now();
		for (const [type, effects] of this.effects.entries()) {
			const activeEffects = effects.filter(
				effect => currentTime - effect.startTime < effect.duration
			); // Keep only non-expired effects
			if (activeEffects.length > 0) {
				this.effects.set(type, activeEffects); // Update effect list
			} else {
				this.effects.delete(type); // Remove effect type if no active effects
			}
		}
	}

	/**
	 * Checks if a specific power-up effect is active on the snake.
	 * @param type - Power-up type to check (e.g., 'speed', 'ghost')
	 * @returns True if the effect is active
	 */
	public hasEffect(type: PowerUpType): boolean {
		return this.effects.has(type) && this.effects.get(type)!.length > 0;
	}

	/**
	 * Calculates the remaining time for a specific effect.
	 * @param type - Power-up type to check
	 * @returns Remaining time in milliseconds, or 0 if effect isn’t active
	 */
	public getEffectTimeRemaining(type: PowerUpType): number {
		const effects = this.effects.get(type);
		if (!effects || effects.length === 0) return 0; // No active effects
		const currentTime = Date.now();
		return Math.max(...effects.map(effect => effect.startTime + effect.duration - currentTime)); // Longest remaining time
	}

	/**
	 * Calculates the delay between snake moves based on current speed.
	 * @returns Delay in milliseconds
	 */
	private getMoveDelay(): number {
		return 1000 / this.getCurrentSpeed(); // Convert speed (cells/sec) to delay (ms)
	}

	/**
	 * Calculates the snake’s current speed, factoring in effects.
	 * @returns Speed in cells per second
	 */
	public getCurrentSpeed(): number {
		let speed = this.baseSpeed; // Start with base speed
		const speedEffects = this.effects.get('speed');
		if (speedEffects) {
			for (const effect of speedEffects) {
				if (effect.boost) speed *= effect.boost; // Apply speed boost
			}
		}
		return speed;
	}

	/**
	 * Calculates the current points multiplier from effects.
	 * @returns Multiplier value (defaults to 1 if no points effect)
	 */
	public getPointsMultiplier(): number {
		const pointsEffects = this.effects.get('points');
		return pointsEffects && pointsEffects.length > 0 ? (pointsEffects[0].multiplier ?? 1) : 1;
	}

	/**
	 * Checks for collisions with walls or self, handling ghost effect wrapping.
	 * @returns True if a collision occurs, false otherwise
	 */
	public checkCollision(): boolean {
		const size = this.grid.getSize();
		if (!this.hasEffect('ghost')) {
			// Without ghost effect: check bounds and self-collision
			const frontHead = this.segments[0];
			const backHead = this.segments[1];
			if (
				frontHead.x < 0 ||
				frontHead.x >= size.width ||
				frontHead.y < 0 ||
				frontHead.y >= size.height ||
				backHead.x < 0 ||
				backHead.x >= size.width ||
				backHead.y < 0 ||
				backHead.y >= size.height
			) {
				return true; // Out of bounds
			}
			return this.segments
				.slice(2)
				.some(
					segment =>
						(segment.x === frontHead.x && segment.y === frontHead.y) ||
						(segment.x === backHead.x && segment.y === backHead.y)
				); // Self-collision
		}
		// With ghost effect: no collisions, handled in update()
		return false;
	}

	/**
	 * Checks if the snake’s head collides with food.
	 * @param food - Food instance to check against
	 * @returns True if head overlaps food position
	 */
	public checkFoodCollision(food: Food): boolean {
		if (!food) return false;
		const head = this.segments[0];
		return head.x === food.getPosition().x && head.y === food.getPosition().y;
	}

	/**
	 * Checks if the snake’s head collides with a power-up.
	 * @param powerUp - Power-up instance to check against
	 * @returns True if head overlaps power-up position
	 */
	public checkPowerUpCollision(powerUp: any): boolean {
		if (!powerUp) return false;
		const head = this.segments[0];
		return head.x === powerUp.position.x && head.y === powerUp.position.y;
	}

	/**
	 * Adds a power-up effect to the snake with its duration and properties.
	 * @param type - Power-up type to add (e.g., 'speed', 'ghost')
	 */
	public addEffect(type: PowerUpType): void {
		if (!this.effects.has(type)) {
			this.effects.set(type, []); // Initialize effect list if new
		}
		const config = this.config.powerUps.effects[type];
		const effect: Effect = {
			type,
			startTime: Date.now(),
			duration: config.duration,
			boost: config.boost, // Speed boost if applicable
			multiplier: config.multiplier, // Points multiplier if applicable
		};
		this.effects.get(type)!.push(effect); // Add effect to stack
	}

	/**
	 * Renders the snake and its effects (trail, ghost) on the canvas.
	 * @param p5 - p5.js instance for drawing
	 * @param time - Current time in milliseconds for animations
	 */
	public draw(p5: P5, time: number): void {
		const cellSize = this.grid.getCellSize();

		// Draw speed trail if active
		if (this.hasEffect('speed')) {
			this.updateTrailPath(cellSize); // Update trail path with current cell size
			this.drawSpeedTrail(p5, cellSize);
		}
		// Draw ghost trail if active
		if (this.hasEffect('ghost')) {
			this.drawGhostTrail(p5, cellSize);
		}

		// Draw body segments from tail to head (excluding head)
		for (let i = this.interpolatedSegments.length - 1; i >= 1; i--) {
			this.drawBodySegment(p5, this.interpolatedSegments[i], cellSize, i);
			this.drawSegmentEffects(p5, this.interpolatedSegments[i], i, time, cellSize);
		}
		// Draw head separately
		this.drawHead(p5, this.interpolatedSegments[0], cellSize);
		this.drawSegmentEffects(p5, this.interpolatedSegments[0], 0, time, cellSize);

		this.resetEffects(p5); // Restore drawing context
	}

	/**
	 * Converts a hex color string to RGB values.
	 * @param hex - Hex color string (e.g., '#FF0000')
	 * @returns Array of [red, green, blue] values
	 */
	private hexToRgb(hex: string): [number, number, number] {
		hex = hex.replace(/^#/, ''); // Remove # prefix
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		return [r, g, b];
	}

	/**
	 * Draws a single body segment with effects like ghost fading.
	 * @param p5 - p5.js instance for drawing
	 * @param pos - Position of the segment
	 * @param cellSize - Size of each grid cell
	 * @param index - Index of the segment in the snake
	 */
	private drawBodySegment(p5: P5, pos: Position, cellSize: number, index: number = 0): void {
		p5.push(); // Save drawing state
		if (this.hasEffect('ghost')) {
			const time = Date.now();
			const pulseRate = 0.002; // Pulse frequency
			const ghostAlpha = 0.6 + 0.2 * Math.sin(time * pulseRate); // Pulsing alpha
			const spectralColor = this.hexToRgb(this.config.snake.effects.ghost.glowColor);

			// Update ghost trails for animation
			this.ghostTrails = this.ghostTrails.filter(trail => time - trail.time < 500); // Remove old trails
			if (Math.random() < 0.3) {
				this.ghostTrails.push({ x: pos.x, y: pos.y, time }); // Add new trail point
			}

			// Draw ghost trails
			this.ghostTrails.forEach((trail, index) => {
				const trailAge = (time - trail.time) / 500;
				const trailAlpha = (1 - trailAge) * this.config.snake.effects.ghost.trailOpacity;
				p5.noStroke();
				p5.fill(spectralColor[0], spectralColor[1], spectralColor[2], trailAlpha * 255);
				p5.rect(
					trail.x * cellSize,
					trail.y * cellSize,
					cellSize,
					cellSize,
					this.config.snake.segments.cornerRadius
				);
			});

			p5.noStroke();
			p5.fill(spectralColor[0], spectralColor[1], spectralColor[2], ghostAlpha * 255); // Ghostly color
		} else {
			const color = this.hexToRgb(this.config.snake.colors.body);
			const segmentCount = this.segments.length;
			const opacity = Math.max(0.4, 1 - (index / segmentCount) * 0.6); // Fade toward tail
			p5.fill(color[0], color[1], color[2], opacity * 255);
		}

		// Draw the segment rectangle
		p5.noStroke();
		p5.rect(
			pos.x * cellSize,
			pos.y * cellSize,
			cellSize,
			cellSize,
			this.config.snake.segments.cornerRadius
		);
		p5.pop(); // Restore drawing state
	}

	/**
	 * Draws the snake’s head with eyes and optional ghost effects.
	 * @param p5 - p5.js instance for drawing
	 * @param pos - Position of the head
	 * @param cellSize - Size of each grid cell
	 */
	private drawHead(p5: P5, pos: Position, cellSize: number): void {
		p5.push(); // Save drawing state
		if (this.hasEffect('ghost')) {
			const time = Date.now();
			const pulseRate = 0.002;
			const ghostAlpha = 0.6 + 0.2 * Math.sin(time * pulseRate); // Pulsing transparency
			const spectralColor = this.hexToRgb(this.config.snake.effects.ghost.glowColor);

			// Draw orbiting particles for ghost effect
			const particleCount = this.config.snake.effects.ghost.particleCount * 2;
			const particleSize = this.config.snake.effects.ghost.particleSize;
			for (let i = 0; i < particleCount; i++) {
				const angle = time * 0.005 + (i * Math.PI * 2) / particleCount;
				const radius = 6 + Math.sin(time * 0.003 + i) * 3; // Pulsing radius
				const px = pos.x * cellSize + cellSize / 2 + Math.cos(angle) * radius;
				const py = pos.y * cellSize + cellSize / 2 + Math.sin(angle) * radius;
				p5.fill(spectralColor[0], spectralColor[1], spectralColor[2], ghostAlpha * 255);
				p5.ellipse(px, py, particleSize);
			}

			p5.noStroke();
			p5.fill(spectralColor[0], spectralColor[1], spectralColor[2], ghostAlpha * 255); // Ghostly head
		} else {
			const color = this.hexToRgb(this.config.snake.colors.head);
			p5.fill(color[0], color[1], color[2]); // Normal head color
		}

		// Draw head rectangle
		p5.noStroke();
		p5.rect(
			pos.x * cellSize,
			pos.y * cellSize,
			cellSize,
			cellSize,
			this.config.snake.segments.cornerRadius
		);

		// Draw eyes with direction-aware positioning
		const eyeAlpha = this.hasEffect('ghost') ? 0.85 : 1.0; // Slightly transparent for ghost
		this.drawEyes(p5, pos.x * cellSize, pos.y * cellSize, cellSize, cellSize, eyeAlpha);

		p5.pop(); // Restore drawing state
	}

	/**
	 * Draws the snake’s eyes on the head, oriented by direction.
	 * @param p5 - p5.js instance for drawing
	 * @param x - X position of the head in pixels
	 * @param y - Y position of the head in pixels
	 * @param headWidth - Width of the head (cell size)
	 * @param headLength - Length of the head (cell size)
	 * @param alpha - Opacity of the eyes (default 1.0)
	 */
	private drawEyes(
		p5: P5,
		x: number,
		y: number,
		headWidth: number,
		headLength: number,
		alpha: number = 1.0
	): void {
		const eyeColor = this.hexToRgb(this.config.snake.colors.eyes); // Eye color from config
		const pupilColor = this.hexToRgb(this.config.snake.colors.pupil); // Pupil color from config
		const eyeSize = this.config.snake.segments.eyeSize; // Eye size
		const pupilSize = this.config.snake.segments.pupilSize || eyeSize * 0.5; // Pupil size or half eye
		const direction = this.direction;

		// Calculate eye positions based on head center and direction
		const centerX = x + headWidth / 2;
		const centerY = y + headLength / 2;
		const eyeSpacing = headWidth * 0.25;

		let leftEyeX = centerX - eyeSpacing;
		let rightEyeX = centerX + eyeSpacing;
		let leftEyeY = centerY;
		let rightEyeY = centerY;

		// Adjust eye positions based on direction
		switch (direction) {
			case 'up':
				leftEyeY = centerY - headLength * 0.15;
				rightEyeY = centerY - headLength * 0.15;
				break;
			case 'down':
				leftEyeY = centerY + headLength * 0.15;
				rightEyeY = centerY + headLength * 0.15;
				break;
			case 'left':
				leftEyeX = centerX - headWidth * 0.15;
				rightEyeX = centerX - headWidth * 0.15;
				leftEyeY = centerY - eyeSpacing;
				rightEyeY = centerY + eyeSpacing;
				break;
			case 'right':
				leftEyeX = centerX + headWidth * 0.15;
				rightEyeX = centerX + headWidth * 0.15;
				leftEyeY = centerY - eyeSpacing;
				rightEyeY = centerY + eyeSpacing;
				break;
		}

		// Draw eyes
		p5.fill(eyeColor[0], eyeColor[1], eyeColor[2], alpha * 255);
		p5.noStroke();
		p5.ellipse(leftEyeX, leftEyeY, eyeSize);
		p5.ellipse(rightEyeX, rightEyeY, eyeSize);

		// Draw pupils if configured
		if (pupilSize > 0) {
			p5.fill(pupilColor[0], pupilColor[1], pupilColor[2], alpha * 255);
			let pupilOffsetX = 0;
			let pupilOffsetY = 0;
			const pupilOffset = eyeSize * 0.2; // Offset pupils toward direction

			switch (direction) {
				case 'up':
					pupilOffsetY = -pupilOffset;
					break;
				case 'down':
					pupilOffsetY = pupilOffset;
					break;
				case 'left':
					pupilOffsetX = -pupilOffset;
					break;
				case 'right':
					pupilOffsetX = pupilOffset;
					break;
			}

			p5.ellipse(leftEyeX + pupilOffsetX, leftEyeY + pupilOffsetY, pupilSize);
			p5.ellipse(rightEyeX + pupilOffsetX, rightEyeY + pupilOffsetY, pupilSize);
		}
	}

	/**
	 * Draws additional effects on a segment (e.g., points stars).
	 * @param p5 - p5.js instance for drawing
	 * @param pos - Position of the segment
	 * @param index - Index of the segment
	 * @param time - Current time for animation
	 * @param cellSize - Size of each grid cell
	 */
	private drawSegmentEffects(
		p5: P5,
		pos: Position,
		index: number,
		time: number,
		cellSize: number
	): void {
		p5.push(); // Save drawing state
		p5.translate(pos.x * cellSize + cellSize / 2, pos.y * cellSize + cellSize / 2); // Center on segment

		// Draw starry effect for points power-up
		if (this.hasEffect('points')) {
			const phase = (time / 500 + index * 0.2) % 1; // Animation phase per segment
			const baseSize = cellSize * (0.8 + 0.3 * Math.sin(phase * Math.PI * 2)); // Pulsing size
			const size = this.hasEffect('speed')
				? baseSize * Math.max(0.4, 1 - index * 0.05)
				: baseSize; // Scale with speed

			// Colors vary with ghost effect
			let outerColor: number[], innerColor: number[];
			if (this.hasEffect('ghost')) {
				const segmentCount = this.segments.length;
				const opacityFactor = Math.max(0.6, 1 - (index / segmentCount) * 0.4);
				outerColor = [60, 100, 255, 220 * opacityFactor]; // Blue outer star
				innerColor = [100, 150, 255, 250 * opacityFactor]; // Light blue inner star
			} else {
				outerColor = [255, 215, 0, 150]; // Gold outer star
				innerColor = [255, 255, 0, 200]; // Yellow inner star
			}

			p5.noFill();
			p5.stroke(outerColor);
			p5.strokeWeight(6);
			this.drawStar(p5, 0, 0, size * 0.4, size * 0.8, 5); // Outer star

			p5.stroke(innerColor);
			p5.strokeWeight(3);
			this.drawStar(p5, 0, 0, size * 0.3, size * 0.7, 5); // Inner star

			// Additional orbiting star for speed effect
			if (this.hasEffect('speed')) {
				const trailPhase = (time / 400 + index * 0.3) % 1;
				const trailSize = size * 0.6;
				const orbitRadius = cellSize * 0.3 * (1 + Math.sin(trailPhase * Math.PI));
				p5.stroke(outerColor.map((c, i) => (i === 3 ? c * 0.7 : c))); // Slightly faded outer color
				p5.strokeWeight(2);
				this.drawStar(
					p5,
					Math.cos(trailPhase * Math.PI * 2) * orbitRadius,
					Math.sin(trailPhase * Math.PI * 2) * orbitRadius,
					trailSize * 0.2,
					trailSize * 0.4,
					5
				);
			}
		}

		p5.pop(); // Restore drawing state
	}

	/**
	 * Draws a star shape at a given position with inner and outer radii.
	 * @param p5 - p5.js instance for drawing
	 * @param x - X position of star center
	 * @param y - Y position of star center
	 * @param radius1 - Inner radius of star points
	 * @param radius2 - Outer radius of star points
	 * @param npoints - Number of points on the star
	 */
	private drawStar(
		p5: P5,
		x: number,
		y: number,
		radius1: number,
		radius2: number,
		npoints: number
	): void {
		const angle = (Math.PI * 2) / npoints; // Angle between points
		const halfAngle = angle / 2.0; // Half angle for inner points

		p5.beginShape();
		for (let a = 0; a < Math.PI * 2; a += angle) {
			let sx = x + Math.cos(a) * radius2; // Outer point X
			let sy = y + Math.sin(a) * radius2; // Outer point Y
			p5.vertex(sx, sy);
			sx = x + Math.cos(a + halfAngle) * radius1; // Inner point X
			sy = y + Math.sin(a + halfAngle) * radius1; // Inner point Y
			p5.vertex(sx, sy);
		}
		p5.endShape(p5.CLOSE); // Close the star shape
	}

	/**
	 * Draws the speed trail effect using cached trail positions.
	 * @param p5 - p5.js instance for drawing
	 * @param cellSize - Size of each grid cell
	 */
	private drawSpeedTrail(p5: P5, cellSize: number): void {
		if (!this.trailPath) this.updateTrailPath(cellSize); // Ensure trail path is updated
		p5.push();
		p5.noStroke();
		p5.fill(255, 50, 50, 150); // Red trail with transparency
		p5.drawingContext.fill(this.trailPath!); // Draw cached trail path
		p5.pop();
	}

	/**
	 * Updates the cached Path2D object for the speed trail based on trail positions.
	 * @param cellSize - Size of each grid cell
	 */
	private updateTrailPath(cellSize: number): void {
		this.trailPath = new Path2D(); // Create new path
		for (let i = 0; i < this.trailPositions.length; i++) {
			const segments = this.trailPositions[i];
			for (let j = 0; j < segments.length; j++) {
				const segment = segments[j];
				const stretchX = cellSize * 1.1; // Slightly stretched X for trail
				const stretchY = cellSize * 1.1; // Slightly stretched Y for trail
				this.trailPath.rect(
					segment.x * cellSize - (stretchX - cellSize) / 2,
					segment.y * cellSize - (stretchY - cellSize) / 2,
					stretchX,
					stretchY
				); // Add segment to trail path
			}
		}
	}

	/**
	 * Draws a fading ghost trail behind the snake’s body.
	 * @param p5 - p5.js instance for drawing
	 * @param cellSize - Size of each grid cell
	 */
	private drawGhostTrail(p5: P5, cellSize: number): void {
		const time = Date.now();
		const pulseRate = 0.002; // Pulse frequency for animation

		// Draw fading trail for body segments (excluding head)
		for (let i = 2; i < this.interpolatedSegments.length; i++) {
			const segment = this.interpolatedSegments[i];
			const ghostAlpha =
				(0.3 + 0.1 * Math.sin(time * pulseRate + i * 0.2)) *
				(1 - i / this.interpolatedSegments.length); // Fade based on position

			p5.push();
			p5.noStroke();
			p5.fill(200, 200, 255, ghostAlpha * 100); // Light blue with fading alpha
			p5.rect(
				segment.x * cellSize,
				segment.y * cellSize,
				cellSize,
				cellSize,
				this.config.snake.segments.cornerRadius
			);
			p5.pop();
		}
	}

	/**
	 * Applies ghost effect transparency to the drawing context (unused).
	 * @param p5 - p5.js instance for drawing
	 */
	private applyGhostEffect(p5: P5): void {
		(p5.drawingContext as DrawingContext).globalAlpha = this.hasEffect('speed') ? 0.7 : 0.5;
	}

	/**
	 * Resets drawing context effects after rendering.
	 * @param p5 - p5.js instance for drawing
	 */
	private resetEffects(p5: P5): void {
		(p5.drawingContext as DrawingContext).globalAlpha = 1.0; // Restore full opacity
	}

	/**
	 * Retrieves the current direction of the snake.
	 * @returns Current direction ('up', 'down', 'left', 'right')
	 */
	public getDirection(): Direction {
		return this.direction;
	}

	/**
	 * Interpolates segment positions for smooth animation between moves.
	 */
	private interpolateSegments(): void {
		if (!this.sourcePosition || !this.targetPosition) return;
		this.interpolatedSegments = this.segments.map((segment, index) => {
			if (index === 0) {
				// Interpolate head position
				return {
					x:
						this.sourcePosition.x +
						(this.targetPosition.x - this.sourcePosition.x) *
							this.easeInOutQuad(this.interpolationProgress),
					y:
						this.sourcePosition.y +
						(this.targetPosition.y - this.sourcePosition.y) *
							this.easeInOutQuad(this.interpolationProgress),
				};
			}
			return segment; // Other segments remain static until next move
		});
	}

	/**
	 * Applies an ease-in-out quadratic function for smooth interpolation.
	 * @param t - Progress value between 0 and 1
	 * @returns Interpolated value for smooth motion
	 */
	private easeInOutQuad(t: number): number {
		return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
	}
}
