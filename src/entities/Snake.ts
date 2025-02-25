// Snake.ts
import type P5 from 'p5';
import configManager from '../config/gameConfig';
import type { SnakeGame } from '../types';
import type { Grid } from '../core/Grid';
import type { Food } from './Food';
import type { Effect, Obstacle, Position, PowerUpType, Direction, DrawingContext } from './types';
import { GameEvents } from '../config/types';

export class Snake implements Obstacle {
	public readonly effects: Map<PowerUpType, Effect[]>;
	public readonly segments: Position[];
	public foodEaten: number;

	private readonly grid: Grid;
	private readonly game: SnakeGame;
	private readonly config = configManager.getConfig();
	private baseSpeed: number;
	private direction: Direction;
	private growing: boolean;
	private lastMoveTime: number;
	private moveInterval: number = 0;
	private nextDirection: Direction;

	private interpolationProgress: number = 0;
	private sourcePosition: Position = { x: 0, y: 0 };
	private targetPosition: Position = { x: 0, y: 0 };
	private interpolatedSegments: Position[];

	private maxTrailLength = 5;
	private trailPositions: Position[][] = [];
	private trailPath: Path2D | null = null; // Cached trail path
	private ghostTrails: { x: number; y: number; time: number }[] = [];

	constructor(grid: Grid, game: SnakeGame) {
		this.grid = grid;
		this.game = game;
		this.effects = new Map();

		this.segments = [];
		this.direction = (this.config.snake.initialDirection as Direction) || 'right';
		this.nextDirection = this.direction;
		this.lastMoveTime = 0;
		this.growing = false;
		this.foodEaten = 0;
		this.baseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;

		this.reset();
		this.interpolatedSegments = [...this.segments];
	}

	public reset(): void {
		const gridSize = this.grid.getSize();
		const centerX = Math.floor(gridSize.width / 2);
		const centerY = Math.floor(gridSize.height / 2);

		this.segments.length = 0;
		this.segments.push({ x: centerX, y: centerY }, { x: centerX - 1, y: centerY });
		for (let i = 0; i < this.config.snake.initialLength - 2; i++) {
			this.segments.push({ x: centerX - (i + 2), y: centerY });
		}

		this.direction = (this.config.snake.initialDirection as Direction) || 'right';
		this.nextDirection = this.direction;
		this.lastMoveTime = 0;
		this.growing = false;
		this.foodEaten = 0;
		this.effects.clear();
		this.baseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
		this.trailPositions = [];
		this.trailPath = null;
	}

	public update(currentTime: number): boolean {
		this.updateEffects();

		if (!this.lastMoveTime) {
			this.lastMoveTime = currentTime;
			return false;
		}

		const elapsed = currentTime - this.lastMoveTime;
		if (elapsed < this.getMoveDelay()) {
			if (this.interpolationProgress < 1) {
				this.interpolationProgress += 0.2;
				this.interpolateSegments();
			}
			return false;
		}

		this.direction = this.nextDirection;
		const head: Position = { ...this.segments[0] };

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

		if (this.hasEffect('ghost')) {
			const segments = [head, this.segments[0]];
			const size = this.grid.getSize();
			for (const segment of segments) {
				if (segment.x < 0) segment.x = size.width - 1;
				if (segment.x >= size.width) segment.x = 0;
				if (segment.y < 0) segment.y = size.height - 1;
				if (segment.y >= size.height) segment.y = 0;
			}
		}

		this.sourcePosition = { ...this.segments[0] };
		this.targetPosition = head;
		this.interpolationProgress = 0;

		this.segments.unshift(head);
		if (!this.growing) {
			this.segments.pop();
		} else {
			this.growing = false;
		}

		if (this.hasEffect('speed')) {
			this.trailPositions.push(this.segments.map(segment => ({ ...segment })));
			if (this.trailPositions.length > this.maxTrailLength) {
				this.trailPositions.shift();
			}
			// MOVED: Trail path update to draw() where cellSize is available
		} else {
			this.trailPositions = [];
			this.trailPath = null;
		}

		this.interpolateSegments();
		this.lastMoveTime = currentTime;
		this.moveInterval = 1000 / this.getCurrentSpeed();

		return true;
	}

	public setDirection(newDirection: Direction): void {
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
		const basePoints = this.game.getFood().getPoints();
		const multiplier = this.getPointsMultiplier();
		this.game.getEvents().emit(GameEvents.SCORE_CHANGED, { score: basePoints * multiplier });

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

	private updateEffects(): void {
		const currentTime = Date.now();
		for (const [type, effects] of this.effects.entries()) {
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
		const speedEffects = this.effects.get('speed');
		if (speedEffects) {
			for (const effect of speedEffects) {
				if (effect.boost) speed *= effect.boost;
			}
		}
		return speed;
	}

	public getPointsMultiplier(): number {
		const pointsEffects = this.effects.get('points');
		return pointsEffects && pointsEffects.length > 0 ? (pointsEffects[0].multiplier ?? 1) : 1;
	}

	public checkCollision(): boolean {
		const size = this.grid.getSize();
		if (!this.hasEffect('ghost')) {
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
			return this.segments
				.slice(2)
				.some(
					segment =>
						(segment.x === frontHead.x && segment.y === frontHead.y) ||
						(segment.x === backHead.x && segment.y === backHead.y)
				);
		} else {
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
			return false;
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

		if (this.hasEffect('speed')) {
			this.updateTrailPath(cellSize); // MOVED: Update trail path here with cellSize
			this.drawSpeedTrail(p5, cellSize);
		}
		if (this.hasEffect('ghost')) {
			this.drawGhostTrail(p5, cellSize);
		}

		for (let i = this.interpolatedSegments.length - 1; i >= 1; i--) {
			this.drawBodySegment(p5, this.interpolatedSegments[i], cellSize, i);
			this.drawSegmentEffects(p5, this.interpolatedSegments[i], i, time, cellSize);
		}
		this.drawHead(p5, this.interpolatedSegments[0], cellSize);
		this.drawSegmentEffects(p5, this.interpolatedSegments[0], 0, time, cellSize);

		this.resetEffects(p5);
	}

	private hexToRgb(hex: string): [number, number, number] {
		hex = hex.replace(/^#/, '');
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
			const spectralColor = this.hexToRgb(this.config.snake.effects.ghost.glowColor);

			this.ghostTrails = this.ghostTrails.filter(trail => time - trail.time < 500);
			if (Math.random() < 0.3) {
				this.ghostTrails.push({ x: pos.x, y: pos.y, time });
			}

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
			p5.fill(spectralColor[0], spectralColor[1], spectralColor[2], ghostAlpha * 255);
		} else {
			const color = this.hexToRgb(this.config.snake.colors.body);
			const segmentCount = this.segments.length;
			const opacity = Math.max(0.4, 1 - (index / segmentCount) * 0.6);
			p5.fill(color[0], color[1], color[2], opacity * 255);
		}

		p5.noStroke();
		p5.rect(
			pos.x * cellSize,
			pos.y * cellSize,
			cellSize,
			cellSize,
			this.config.snake.segments.cornerRadius
		);
		p5.pop();
	}

	private drawHead(p5: P5, pos: Position, cellSize: number): void {
		p5.push();
		if (this.hasEffect('ghost')) {
			const time = Date.now();
			const pulseRate = 0.002;
			const ghostAlpha = 0.6 + 0.2 * Math.sin(time * pulseRate);
			const spectralColor = this.hexToRgb(this.config.snake.effects.ghost.glowColor);

			const particleCount = this.config.snake.effects.ghost.particleCount * 2;
			const particleSize = this.config.snake.effects.ghost.particleSize;
			for (let i = 0; i < particleCount; i++) {
				const angle = time * 0.005 + (i * Math.PI * 2) / particleCount;
				const radius = 6 + Math.sin(time * 0.003 + i) * 3;
				const px = pos.x * cellSize + cellSize / 2 + Math.cos(angle) * radius;
				const py = pos.y * cellSize + cellSize / 2 + Math.sin(angle) * radius;
				p5.fill(spectralColor[0], spectralColor[1], spectralColor[2], ghostAlpha * 255);
				p5.ellipse(px, py, particleSize);
			}

			p5.noStroke();
			p5.fill(spectralColor[0], spectralColor[1], spectralColor[2], ghostAlpha * 255);
		} else {
			const color = this.hexToRgb(this.config.snake.colors.head);
			p5.fill(color[0], color[1], color[2]);
		}

		p5.noStroke();
		p5.rect(
			pos.x * cellSize,
			pos.y * cellSize,
			cellSize,
			cellSize,
			this.config.snake.segments.cornerRadius
		);

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
		const eyeColor = this.hexToRgb(this.config.snake.colors.eyes);
		const pupilColor = this.hexToRgb(this.config.snake.colors.pupil);
		const eyeSize = this.config.snake.segments.eyeSize;
		const pupilSize = this.config.snake.segments.pupilSize || eyeSize * 0.5;
		const direction = this.direction;

		const centerX = x + headWidth / 2;
		const centerY = y + headLength / 2;
		const eyeSpacing = headWidth * 0.25;

		let leftEyeX = centerX - eyeSpacing;
		let rightEyeX = centerX + eyeSpacing;
		let leftEyeY = centerY;
		let rightEyeY = centerY;

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

		p5.fill(eyeColor[0], eyeColor[1], eyeColor[2], alpha * 255);
		p5.noStroke();
		p5.ellipse(leftEyeX, leftEyeY, eyeSize);
		p5.ellipse(rightEyeX, rightEyeY, eyeSize);

		if (pupilSize > 0) {
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

		if (this.hasEffect('points')) {
			const phase = (time / 500 + index * 0.2) % 1;
			const baseSize = cellSize * (0.8 + 0.3 * Math.sin(phase * Math.PI * 2));
			const size = this.hasEffect('speed')
				? baseSize * Math.max(0.4, 1 - index * 0.05)
				: baseSize;

			let outerColor, innerColor;
			if (this.hasEffect('ghost')) {
				const segmentCount = this.segments.length;
				const opacityFactor = Math.max(0.6, 1 - (index / segmentCount) * 0.4);
				outerColor = [60, 100, 255, 220 * opacityFactor];
				innerColor = [100, 150, 255, 250 * opacityFactor];
			} else {
				outerColor = [255, 215, 0, 150];
				innerColor = [255, 255, 0, 200];
			}

			p5.noFill();
			p5.stroke(outerColor);
			p5.strokeWeight(6);
			this.drawStar(p5, 0, 0, size * 0.4, size * 0.8, 5);

			p5.stroke(innerColor);
			p5.strokeWeight(3);
			this.drawStar(p5, 0, 0, size * 0.3, size * 0.7, 5);

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
		if (!this.trailPath) this.updateTrailPath(cellSize);
		p5.push();
		p5.noStroke();
		p5.fill(255, 50, 50, 150);
		p5.drawingContext.fill(this.trailPath!);
		p5.pop();
	}

	private updateTrailPath(cellSize: number): void {
		this.trailPath = new Path2D();
		for (let i = 0; i < this.trailPositions.length; i++) {
			const segments = this.trailPositions[i];
			for (let j = 0; j < segments.length; j++) {
				const segment = segments[j];
				const stretchX = cellSize * 1.1;
				const stretchY = cellSize * 1.1;
				this.trailPath.rect(
					segment.x * cellSize - (stretchX - cellSize) / 2,
					segment.y * cellSize - (stretchY - cellSize) / 2,
					stretchX,
					stretchY
				);
			}
		}
	}

	private drawGhostTrail(p5: P5, cellSize: number): void {
		const time = Date.now();
		const pulseRate = 0.002;

		for (let i = 2; i < this.interpolatedSegments.length; i++) {
			const segment = this.interpolatedSegments[i];
			const ghostAlpha =
				(0.3 + 0.1 * Math.sin(time * pulseRate + i * 0.2)) *
				(1 - i / this.interpolatedSegments.length);

			p5.push();
			p5.noStroke();
			p5.fill(200, 200, 255, ghostAlpha * 100);
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

	private applyGhostEffect(p5: P5): void {
		(p5.drawingContext as DrawingContext).globalAlpha = this.hasEffect('speed') ? 0.7 : 0.5;
	}

	private resetEffects(p5: P5): void {
		(p5.drawingContext as DrawingContext).globalAlpha = 1.0;
	}

	public getDirection(): Direction {
		return this.direction;
	}

	private interpolateSegments(): void {
		if (!this.sourcePosition || !this.targetPosition) return;
		this.interpolatedSegments = this.segments.map((segment, index) => {
			if (index === 0) {
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

	private easeInOutQuad(t: number): number {
		return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
	}
}
