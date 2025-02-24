import type P5 from 'p5';
import type { GameConfig, SnakeConfig, PowerUpType } from '../config/types.ts';
import type { SnakeGame } from '../types';
import type { Grid } from '../core/Grid';
import type { Position, Effect, Direction, DrawingContext } from './types';
import configManager from '../config/gameConfig';
import { GameEvents } from '../config/types';
import { Food } from '../entities/Food';

/**
 * Snake class representing the player-controlled snake in the game.
 */
export class Snake {
	public readonly effects: Map<PowerUpType, Effect[]>;
	public readonly segments: Position[];
	public foodEaten: number;
	public score: number;

	private readonly grid: Grid;
	private readonly game: SnakeGame;
	private readonly config: GameConfig;
	private baseSpeed: number;
	private direction: Direction;
	private growing: boolean;
	private lastMoveTime: number;
	private moveInterval: number = 0;
	private nextDirection: Direction;
	private snakeConfig: SnakeConfig;

	// New interpolation properties with definite initialization
	private interpolationProgress: number = 0;
	private sourcePosition: Position = { x: 0, y: 0 };
	private targetPosition: Position = { x: 0, y: 0 };
	private interpolatedSegments: Position[];

	private maxTrailLength = 5; // Number of frames to keep in the trail
	private trailPositions: Position[][] = [];
	private ghostTrails: { x: number; y: number; time: number }[] = [];

	constructor(grid: Grid, game: SnakeGame) {
		this.grid = grid;
		this.game = game;
		this.config = configManager.getConfig();
		this.effects = new Map();

		// Initialize base properties
		this.segments = [];
		this.direction = (this.config.snake.initialDirection as Direction) || 'right';
		this.nextDirection = this.direction;
		this.lastMoveTime = 0;
		this.score = 0;
		this.growing = false;
		this.foodEaten = 0;
		this.baseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
		this.snakeConfig = this.config.snake;

		// Initialize snake segments
		this.reset();

		// Initialize interpolated segments
		this.interpolatedSegments = [...this.segments];
	}

	public reset(): void {
		const gridSize = this.grid.getSize();

		// Calculate center position
		const centerX = Math.floor(gridSize.width / 2);
		const centerY = Math.floor(gridSize.height / 2);

		// Clear segments array
		this.segments.length = 0;

		// Add head segments (always 2 cells)
		this.segments.push(
			{ x: centerX, y: centerY }, // Front of head
			{ x: centerX - 1, y: centerY } // Back of head
		);

		// Add initial body segments based on config
		for (let i = 0; i < this.snakeConfig.initialLength - 2; i++) {
			this.segments.push({ x: centerX - (i + 2), y: centerY });
		}

		// Reset properties
		this.direction = (this.snakeConfig.initialDirection as Direction) || 'right';
		this.nextDirection = this.direction;
		this.lastMoveTime = 0;
		this.score = 0;
		this.growing = false;
		this.foodEaten = 0;
		this.effects.clear();
		this.baseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
	}

	public update(currentTime: number): boolean {
		// Update effects first
		this.updateEffects();

		// Check if it's time to move
		if (!this.lastMoveTime) {
			this.lastMoveTime = currentTime;
			return false;
		}

		const elapsed = currentTime - this.lastMoveTime;
		if (elapsed < this.getMoveDelay()) {
			// Continue interpolation even when not moving
			if (this.interpolationProgress < 1) {
				this.interpolationProgress += 0.2;
				this.interpolateSegments();
			}
			return false;
		}

		// Update direction and move
		this.direction = this.nextDirection;
		const head: Position = { ...this.segments[0] };

		// Calculate new head position
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

		// Handle wrapping in ghost mode
		const size = this.grid.getSize();
		if (this.hasEffect('ghost')) {
			// Wrap both head segments
			const segments = [head, this.segments[0]]; // New head and current front head
			for (const segment of segments) {
				if (segment.x < 0) segment.x = size.width - 1;
				if (segment.x >= size.width) segment.x = 0;
				if (segment.y < 0) segment.y = size.height - 1;
				if (segment.y >= size.height) segment.y = 0;
			}
		}

		// Store current position for interpolation
		this.sourcePosition = { ...this.segments[0] };
		this.targetPosition = head;
		this.interpolationProgress = 0;

		// Update segments
		this.segments.unshift(head);
		if (!this.growing) {
			this.segments.pop();
		}
		this.growing = false;

		// After updating segments
		if (this.hasEffect('speed')) {
			// Add current positions to the trail
			this.trailPositions.push(this.segments.map(segment => ({ ...segment })));
			if (this.trailPositions.length > this.maxTrailLength) {
				this.trailPositions.shift();
			}
		} else {
			// Clear trail when speed effect is not active
			this.trailPositions = [];
		}

		// Interpolate segments
		this.interpolateSegments();

		// Update move timing
		this.lastMoveTime = currentTime;
		this.moveInterval = 1000 / this.getCurrentSpeed();

		return true;
	}

	public setDirection(newDirection: Direction): void {
		// Prevent 180-degree turns
		const opposites: Record<Direction, Direction> = {
			up: 'down',
			down: 'up',
			left: 'right',
			right: 'left',
		};

		if (this.direction !== opposites[newDirection]) {
			this.nextDirection = newDirection;
		}
	}

	public grow(): void {
		this.growing = true;
		this.foodEaten = (this.foodEaten || 0) + 1;
		// this.score += Math.round(10 * this.getPointsMultiplier());
		const newSegment = { ...this.segments[this.segments.length - 1] };
		this.segments.push(newSegment);
		const basePoints = this.game.getFood().getPoints();
		const multiplier = this.getPointsMultiplier();
		this.game.getEvents().emit(GameEvents.SCORE_CHANGED, { score: basePoints * multiplier });

		if (this.snakeConfig.speedProgression.enabled) {
			// Get current difficulty base speed
			const difficultyBaseSpeed =
				this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;

			// Calculate speed increase
			const speedIncrease =
				this.foodEaten * this.snakeConfig.speedProgression.increasePerFood;

			// Apply speed increase with maximum cap
			this.baseSpeed = Math.min(
				difficultyBaseSpeed + speedIncrease,
				this.snakeConfig.speedProgression.maxSpeed
			);
		}
	}

	private updateEffects(): void {
		const currentTime = Date.now();

		// Check each effect type
		for (const [type, effects] of this.effects.entries()) {
			// Remove expired effects
			const activeEffects = effects.filter(
				effect => currentTime - effect.startTime < effect.duration
			);

			if (activeEffects.length > 0) {
				this.effects.set(type, activeEffects);
			} else {
				this.effects.delete(type);
			}
		}
	}

	public hasEffect(type: PowerUpType): boolean {
		return this.effects.has(type) && this.effects.get(type)!.length > 0;
	}

	public getEffectTimeRemaining(type: PowerUpType): number {
		const effects = this.effects.get(type);
		if (!effects || effects.length === 0) return 0;

		const currentTime = Date.now();
		return Math.max(...effects.map(effect => effect.startTime + effect.duration - currentTime));
	}

	private getMoveDelay(): number {
		return 1000 / this.getCurrentSpeed();
	}

	public getCurrentSpeed(): number {
		let speed = this.baseSpeed;

		// Apply speed effects
		const speedEffects = this.effects.get('speed');
		if (speedEffects) {
			for (const effect of speedEffects) {
				if (effect.boost) {
					speed *= effect.boost;
				}
			}
		}

		return speed;
	}

	public getPointsMultiplier(): number {
		let multiplier = 1;

		// Apply points effects
		const pointsEffects = this.effects.get('points');
		if (pointsEffects) {
			for (const effect of pointsEffects) {
				if (effect.multiplier) {
					multiplier *= effect.multiplier;
				}
			}
		}

		return multiplier;
	}

	public checkCollision(): boolean {
		const size = this.grid.getSize();

		// Check wall collision if not ghost
		if (!this.hasEffect('ghost')) {
			// Check wall collision for both head segments
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
				return true;
			}

			// Check self collision (start from segment 2 since 0,1 are head)
			return this.segments
				.slice(2)
				.some(
					segment =>
						(segment.x === frontHead.x && segment.y === frontHead.y) ||
						(segment.x === backHead.x && segment.y === backHead.y)
				);
		} else {
			// In ghost mode, wrap both head segments around the edges
			const frontHead = this.segments[0];
			const backHead = this.segments[1];

			if (frontHead.x < 0) frontHead.x = size.width - 1;
			if (frontHead.x >= size.width) frontHead.x = 0;
			if (frontHead.y < 0) frontHead.y = size.height - 1;
			if (frontHead.y >= size.height) frontHead.y = 0;

			if (backHead.x < 0) backHead.x = size.width - 1;
			if (backHead.x >= size.width) backHead.x = 0;
			if (backHead.y < 0) backHead.y = size.height - 1;
			if (backHead.y >= size.height) backHead.y = 0;

			return false; // No collisions in ghost mode
		}
	}

	public checkFoodCollision(food: Food): boolean {
		if (!food) return false;
		const head = this.segments[0];
		return head.x === food.getPosition().x && head.y === food.getPosition().y;
	}

	public checkPowerUpCollision(powerUp: any): boolean {
		if (!powerUp) return false;
		const head = this.segments[0];
		return head.x === powerUp.position.x && head.y === powerUp.position.y;
	}

	public addEffect(type: PowerUpType): void {
		if (!this.effects.has(type)) {
			this.effects.set(type, []);
		}

		const config = this.config.powerUps.effects[type];

		const effect: Effect = {
			type,
			startTime: Date.now(),
			duration: config.duration,
			boost: config.boost,
			multiplier: config.multiplier,
		};

		this.effects.get(type)!.push(effect);
	}

	public draw(p5: P5, time: number): void {
		const cellSize = this.grid.getCellSize();

		// Draw speed trail first (as bottom layer)
		if (this.hasEffect('speed')) {
			this.drawSpeedTrail(p5, cellSize);
		}

		// Draw ghost trail if ghost effect is active
		if (this.hasEffect('ghost')) {
			this.drawGhostTrail(p5, cellSize);
		}

		// Draw body segments (in reverse to layer properly)
		for (let i = this.interpolatedSegments.length - 1; i >= 1; i--) {
			this.drawBodySegment(p5, this.interpolatedSegments[i], cellSize, i);
			this.drawSegmentEffects(p5, this.interpolatedSegments[i], i, time, cellSize);
		}

		// Draw head
		this.drawHead(p5, this.interpolatedSegments[0], cellSize);
		this.drawSegmentEffects(p5, this.interpolatedSegments[0], 0, time, cellSize);

		// Reset any effects
		this.resetEffects(p5);
	}

	private hexToRgb(hex: string): [number, number, number] {
		// Remove the hash at the start if it exists
		hex = hex.replace(/^#/, '');

		// Parse the hex values
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);

		return [r, g, b];
	}

	private drawBodySegment(p5: P5, pos: Position, cellSize: number, index: number = 0): void {
		p5.push();

		if (this.hasEffect('ghost')) {
			const time = Date.now();
			const pulseRate = 0.002;
			const ghostAlpha = 0.6 + 0.2 * Math.sin(time * pulseRate);
			const spectralColor = this.hexToRgb(this.snakeConfig.effects.ghost.spectralColor);

			// Draw ghost trail
			this.ghostTrails = this.ghostTrails.filter(trail => time - trail.time < 500);
			if (Math.random() < 0.3) {
				// Only store some positions for a more ethereal effect
				this.ghostTrails.push({ x: pos.x, y: pos.y, time });
			}

			// Draw trails
			this.ghostTrails.forEach((trail, index) => {
				const trailAge = (time - trail.time) / 500;
				const trailAlpha = (1 - trailAge) * this.snakeConfig.effects.ghost.trailOpacity;

				p5.noStroke();
				p5.fill(spectralColor[0], spectralColor[1], spectralColor[2], trailAlpha * 255);
				p5.rect(
					trail.x * cellSize,
					trail.y * cellSize,
					cellSize,
					cellSize,
					this.snakeConfig.segments.cornerRadius
				);
			});

			// Draw ghost particles
			const particleCount = this.snakeConfig.effects.ghost.particleCount;
			const particleSize = this.snakeConfig.effects.ghost.particleSize;

			for (let i = 0; i < particleCount; i++) {
				const angle = time * 0.005 + (i * Math.PI * 2) / particleCount;
				const radius = 4 + Math.sin(time * 0.003) * 2;
				const px = pos.x * cellSize + cellSize / 2 + Math.cos(angle) * radius;
				const py = pos.y * cellSize + cellSize / 2 + Math.sin(angle) * radius;

				p5.fill(spectralColor[0], spectralColor[1], spectralColor[2], ghostAlpha * 255);
				p5.ellipse(px, py, particleSize);
			}

			// Draw main segment with spectral effect
			p5.noStroke();
			p5.fill(spectralColor[0], spectralColor[1], spectralColor[2], ghostAlpha * 255);
		} else {
			const color = this.hexToRgb(this.snakeConfig.colors.body);
			const segmentCount = this.segments.length;
			// Apply diminishing opacity based on segment position
			const opacity = Math.max(0.4, 1 - (index / segmentCount) * 0.6);
			p5.fill(color[0], color[1], color[2], opacity * 255);
		}

		p5.noStroke();
		p5.rect(
			pos.x * cellSize,
			pos.y * cellSize,
			cellSize,
			cellSize,
			this.snakeConfig.segments.cornerRadius
		);
		p5.pop();
	}

	private drawHead(p5: P5, pos: Position, cellSize: number): void {
		p5.push();

		if (this.hasEffect('ghost')) {
			const time = Date.now();
			const pulseRate = 0.002;
			const ghostAlpha = 0.6 + 0.2 * Math.sin(time * pulseRate);
			const spectralColor = this.hexToRgb(this.snakeConfig.effects.ghost.spectralColor);

			// Draw ghost particles around head
			const particleCount = this.snakeConfig.effects.ghost.particleCount * 2; // More particles for head
			const particleSize = this.snakeConfig.effects.ghost.particleSize;

			for (let i = 0; i < particleCount; i++) {
				const angle = time * 0.005 + (i * Math.PI * 2) / particleCount;
				const radius = 6 + Math.sin(time * 0.003 + i) * 3;
				const px = pos.x * cellSize + cellSize / 2 + Math.cos(angle) * radius;
				const py = pos.y * cellSize + cellSize / 2 + Math.sin(angle) * radius;

				p5.fill(spectralColor[0], spectralColor[1], spectralColor[2], ghostAlpha * 255);
				p5.ellipse(px, py, particleSize);
			}

			// Draw main head with spectral effect
			p5.noStroke();
			p5.fill(spectralColor[0], spectralColor[1], spectralColor[2], ghostAlpha * 255);
		} else {
			const color = this.hexToRgb(this.snakeConfig.colors.head);
			p5.fill(color[0], color[1], color[2]);
		}

		// Draw the head
		p5.noStroke();
		p5.rect(
			pos.x * cellSize,
			pos.y * cellSize,
			cellSize,
			cellSize,
			this.snakeConfig.segments.cornerRadius
		);

		// Draw eyes with adjusted alpha for ghost effect
		const eyeAlpha = this.hasEffect('ghost') ? 0.85 : 1.0;
		this.drawEyes(p5, pos.x * cellSize, pos.y * cellSize, cellSize, cellSize, eyeAlpha);

		p5.pop();
	}

	private drawEyes(
		p5: P5,
		x: number,
		y: number,
		headWidth: number,
		headLength: number,
		alpha: number = 1.0
	): void {
		const eyeColor = this.hexToRgb(this.snakeConfig.colors.eyes);
		const pupilColor = this.hexToRgb(this.snakeConfig.colors.pupil);
		const eyeSize = this.snakeConfig.segments.eyeSize;
		const pupilSize = this.snakeConfig.segments.pupilSize || eyeSize * 0.5;
		const direction = this.direction;

		// Base positions for eyes (centered in the head)
		const centerX = x + headWidth / 2;
		const centerY = y + headLength / 2;
		const eyeSpacing = headWidth * 0.25;

		// Calculate eye positions based on direction
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

		if (pupilSize > 0) {
			// Draw pupils with offset based on direction
			p5.fill(pupilColor[0], pupilColor[1], pupilColor[2], alpha * 255);
			let pupilOffsetX = 0;
			let pupilOffsetY = 0;
			const pupilOffset = eyeSize * 0.2;

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

	private drawSegmentEffects(
		p5: P5,
		pos: Position,
		index: number,
		time: number,
		cellSize: number
	): void {
		p5.push();
		p5.translate(pos.x * cellSize + cellSize / 2, pos.y * cellSize + cellSize / 2);

		// Draw points effect
		if (this.hasEffect('points')) {
			const phase = (time / 500 + index * 0.2) % 1;
			const baseSize = cellSize * (0.8 + 0.3 * Math.sin(phase * Math.PI * 2));

			// Adjust size based on speed effect
			const size = this.hasEffect('speed')
				? baseSize * Math.max(0.4, 1 - index * 0.05) // More gradual size decrease
				: baseSize;

			// Determine star colors based on ghost effect
			let outerColor, innerColor;
			if (this.hasEffect('ghost')) {
				// Brighter blue colors with higher opacity for better visibility
				const segmentCount = this.segments.length;
				const opacityFactor = Math.max(0.6, 1 - (index / segmentCount) * 0.4);
				outerColor = [60, 100, 255, 220 * opacityFactor]; // Brighter blue
				innerColor = [100, 150, 255, 250 * opacityFactor]; // Even brighter blue
			} else {
				outerColor = [255, 215, 0, 150]; // Golden color
				innerColor = [255, 255, 0, 200]; // Brighter yellow
			}

			// Outer glow
			p5.noFill();
			p5.stroke(outerColor);
			p5.strokeWeight(6);
			this.drawStar(p5, 0, 0, size * 0.4, size * 0.8, 5);

			// Inner star
			p5.stroke(innerColor);
			p5.strokeWeight(3);
			this.drawStar(p5, 0, 0, size * 0.3, size * 0.7, 5);

			// Add extra stars for speed effect
			if (this.hasEffect('speed')) {
				const trailPhase = (time / 400 + index * 0.3) % 1;
				const trailSize = size * 0.6;
				const orbitRadius = cellSize * 0.3 * (1 + Math.sin(trailPhase * Math.PI));

				p5.stroke(outerColor.map((c, i) => (i === 3 ? c * 0.7 : c)));
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

		p5.pop();
	}

	private drawStar(
		p5: P5,
		x: number,
		y: number,
		radius1: number,
		radius2: number,
		npoints: number
	): void {
		const angle = (Math.PI * 2) / npoints;
		const halfAngle = angle / 2.0;

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

	private drawSpeedTrail(p5: P5, cellSize: number): void {
		for (let i = 0; i < this.trailPositions.length; i++) {
			const alpha =
				((i + 1) / this.trailPositions.length) * this.snakeConfig.effects.speed.lineOpacity;
			p5.push();
			p5.noStroke();

			const segments = this.trailPositions[i];
			const trailColor = [255, 50, 50]; // Red color for speed trail

			for (let j = 0; j < segments.length; j++) {
				const segment = segments[j];
				const segmentProgress = j / segments.length;
				const segmentAlpha = alpha * (1 - segmentProgress * 0.5); // Fade out towards tail

				p5.fill(trailColor[0], trailColor[1], trailColor[2], segmentAlpha * 255);

				// Draw the segment with a slight stretch effect
				const stretchX = cellSize * 1.1;
				const stretchY = cellSize * 1.1;

				p5.rect(
					segment.x * cellSize - (stretchX - cellSize) / 2,
					segment.y * cellSize - (stretchY - cellSize) / 2,
					stretchX,
					stretchY,
					this.snakeConfig.segments.cornerRadius
				);
			}
			p5.pop();
		}
	}

	private drawGhostTrail(p5: P5, cellSize: number): void {
		const time = Date.now();
		const pulseRate = 0.002;

		// Draw a subtle ethereal trail
		for (let i = 2; i < this.interpolatedSegments.length; i++) {
			const segment = this.interpolatedSegments[i];
			const ghostAlpha =
				(0.3 + 0.1 * Math.sin(time * pulseRate + i * 0.2)) *
				(1 - i / this.interpolatedSegments.length); // Fade out based on distance from head

			p5.push();
			p5.noStroke();
			p5.fill(200, 200, 255, ghostAlpha * 100);
			p5.rect(
				segment.x * cellSize,
				segment.y * cellSize,
				cellSize,
				cellSize,
				this.snakeConfig.segments.cornerRadius
			);
			p5.pop();
		}
	}

	private applyGhostEffect(p5: P5): void {
		if (this.hasEffect('speed')) {
			// More visible ghost effect when speed is active
			(p5.drawingContext as DrawingContext).globalAlpha = 0.7;
		} else {
			(p5.drawingContext as DrawingContext).globalAlpha = 0.5;
		}
	}

	private resetEffects(p5: P5): void {
		(p5.drawingContext as DrawingContext).globalAlpha = 1.0;
	}

	public drawSpeedVector(p5: P5): void {
		const head = this.segments[0];
		const cellSize = this.grid.getCellSize();
		const speed = this.getCurrentSpeed();

		p5.push();
		p5.translate(head.x * cellSize + cellSize / 2, head.y * cellSize + cellSize / 2);

		// Draw speed indicator
		p5.stroke(255, 255, 0);
		p5.strokeWeight(2);
		p5.noFill();
		p5.line(0, 0, speed * 10, 0);
		p5.ellipse(speed * 10, 0, 5);

		p5.pop();
	}

	public getDirection(): Direction {
		return this.direction;
	}

	// New method for interpolating segments
	private interpolateSegments(): void {
		// Only interpolate if we have a source and target
		if (!this.sourcePosition || !this.targetPosition) return;

		// Create a copy of segments for interpolation
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
			return segment;
		});
	}

	// Easing function for smoother interpolation
	private easeInOutQuad(t: number): number {
		return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
	}
}
