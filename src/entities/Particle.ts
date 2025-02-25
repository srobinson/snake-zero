// Particle.ts
import type p5 from 'p5';
import type { ParticleConfigType, ParticleType } from '../config/types';
import type { TrailPoint } from '../core/types';

export class Particle {
	private p5: p5;
	public x: number;
	public y: number;
	public cellSize: number;
	private birth: number;
	private type: ParticleType;
	private active: boolean;

	private vx: number = 0;
	private vy: number = 0;
	private speed: number = 0;
	private rotation: number = 0;

	private size: number = 0;
	private color: string = '#ffffff';
	private lifetime: number = 0;
	private scale: number = 0;
	private targetScale: number = 0;

	private trailPoints: Array<TrailPoint> = [];
	private trailLength: number;
	private trailDecay: number;

	private trail: boolean;
	private glow: boolean;
	private sparkle: boolean;
	private pulse: boolean;
	private spiral: boolean;
	private orbit: boolean;
	private isRainbow: boolean;

	private sparkleTime: number = 0;
	private pulsePhase: number;
	private spiralAngle: number = 0;
	private rotationSpeed: number;

	private orbitCenter?: { x: number; y: number };
	private orbitRadius?: number;
	private orbitSpeed?: number;
	private orbitAngle?: number;

	private gravity: number;

	private score?: number;
	private text?: string;
	private font?: string;
	private fontSize?: number;

	constructor(
		p5: p5,
		x: number = 0,
		y: number = 0,
		config: ParticleConfigType = {
			type: 'normal',
			speed: 0,
			size: { min: 0, max: 0 },
			colors: ['#ffffff'],
		},
		cellSize: number = 1
	) {
		this.p5 = p5;
		this.x = x;
		this.y = y;
		this.cellSize = cellSize;
		this.birth = p5.millis();
		this.type = config.type || 'normal';
		this.active = false;

		this.trailPoints = [];
		this.trailLength = 0;
		this.trailDecay = 0;
		this.trail = false;
		this.glow = false;
		this.sparkle = false;
		this.pulse = false;
		this.spiral = false;
		this.orbit = false;
		this.isRainbow = false;
		this.sparkleTime = 0;
		this.pulsePhase = 0;
		this.spiralAngle = 0;
		this.rotationSpeed = 0;
		this.gravity = 0;

		this.initialize(config); // Initial setup
	}

	public reset(): void {
		this.x = 0;
		this.y = 0;
		this.vx = 0;
		this.vy = 0;
		this.speed = 0;
		this.rotation = 0;
		this.size = 0;
		this.color = '#ffffff';
		this.lifetime = 0;
		this.scale = 0;
		this.targetScale = 0;
		this.trailPoints = [];
		this.trailLength = 0;
		this.trailDecay = 0;
		this.trail = false;
		this.glow = false;
		this.sparkle = false;
		this.pulse = false;
		this.spiral = false;
		this.orbit = false;
		this.isRainbow = false;
		this.sparkleTime = 0;
		this.pulsePhase = 0;
		this.spiralAngle = 0;
		this.rotationSpeed = 0;
		this.orbitCenter = undefined;
		this.orbitRadius = undefined;
		this.orbitSpeed = undefined;
		this.orbitAngle = undefined;
		this.gravity = 0;
		this.score = undefined;
		this.text = undefined;
		this.font = undefined;
		this.fontSize = undefined;
		this.active = false;
	}

	public initialize(config: ParticleConfigType, centerX?: number, centerY?: number): void {
		this.birth = this.p5.millis();
		this.type = config.type || 'normal';
		this.active = true;

		const baseScale = Math.max(0.3, Math.min(1, this.cellSize / 40));

		if (this.type === 'score') {
			this.score = config.score;
			this.text = config.text;
			this.font = config.font;
			this.fontSize = (config.fontSize || 0) * baseScale;
			this.scale = 0;
			this.targetScale = 1.3 * baseScale;
			this.rotation = this.p5.random(-0.2, 0.2);
			this.vy = -(config.speed || 0) * baseScale;
		}

		const angle =
			config.initialAngle !== undefined ? config.initialAngle : Math.random() * Math.PI * 2;
		const speedValue =
			typeof config.speed === 'number'
				? config.speed
				: config.speed.min + Math.random() * (config.speed.max - config.speed.min);
		this.speed = speedValue * baseScale;

		this.vx = Math.cos(angle) * this.speed;
		this.vy =
			this.type === 'score'
				? this.vy || -(config.speed || 0) * baseScale
				: Math.sin(angle) * this.speed;

		this.size =
			this.cellSize *
			(config.size.min + Math.random() * (config.size.max - config.size.min)) *
			baseScale;

		const lifetimeMin = config.lifetime?.min ?? 500;
		const lifetimeMax = config.lifetime?.max ?? 1500;
		this.lifetime = lifetimeMin + Math.random() * (lifetimeMax - lifetimeMin);

		const color = config.colors[Math.floor(Math.random() * config.colors.length)];
		this.color = color.startsWith('#') ? color : '#ffffff';

		this.trail = config.trail?.enabled || false;
		this.glow = config.glow || false;
		this.sparkle = config.sparkle || false;
		this.pulse = config.pulse || false;
		this.spiral = config.spiral || false;
		this.orbit = config.orbit?.enabled || false;
		this.isRainbow = config.rainbow || false;

		this.trailPoints = [];
		this.trailLength = config.trail?.length || 3;
		this.trailDecay = config.trail?.decay || 0.95;
		this.sparkleTime = 0;
		this.pulsePhase = Math.random() * Math.PI * 2;
		this.spiralAngle = 0;
		this.rotationSpeed = (Math.random() * 0.1 + 0.05) * (Math.random() < 0.5 ? 1 : -1);

		if (this.orbit) {
			// FIX: Use provided centerX, centerY for orbitCenter if available
			this.orbitCenter = { x: centerX ?? this.x, y: centerY ?? this.y };
			this.orbitRadius = config.orbit?.radius;
			this.orbitSpeed = config.orbit?.speed;
			this.orbitAngle = angle;
		}

		this.gravity = config.gravity || 0;
	}

	update(): boolean {
		if (!this.active) return false;

		const p5 = this.p5;
		const age = p5.millis() - this.birth;

		if (this.type === 'score') {
			this.scale = Math.min(this.targetScale ?? 0, this.scale + 0.2);
			this.y += this.vy;
			this.vy *= 0.95;
		} else if (this.orbit) {
			if (
				this.orbitCenter &&
				this.orbitRadius !== undefined &&
				this.orbitSpeed !== undefined
			) {
				this.orbitAngle = (this.orbitAngle ?? 0) + this.orbitSpeed;
				this.x = this.orbitCenter.x + Math.cos(this.orbitAngle) * this.orbitRadius;
				this.y = this.orbitCenter.y + Math.sin(this.orbitAngle) * this.orbitRadius;
			}
		} else {
			this.x += this.vx;
			this.y += this.vy;
			this.vy += (this.gravity ?? 0) * (this.cellSize / 40);
			this.vx *= 0.98;
			this.vy *= 0.98;
		}

		if (this.trail) {
			this.trailPoints.push({ x: this.x, y: this.y });
			if (this.trailPoints.length > (this.trailLength ?? 3)) {
				this.trailPoints.shift();
			}
		}

		if (this.sparkle) {
			this.sparkleTime = (this.sparkleTime + 0.1) % (Math.PI * 2);
		}

		return age < this.lifetime;
	}

	draw(): void {
		if (!this.active) return;

		const p5 = this.p5;
		const age = p5.millis() - this.birth;
		const lifePercent = age / this.lifetime;
		const alpha = Math.max(0, Math.min(255, 255 * (1 - lifePercent)));
		const cellScale = this.cellSize / 40;

		p5.push();

		if (this.trail && this.trailPoints.length > 1) {
			let trailAlpha = alpha;
			for (let i = 0; i < this.trailPoints.length - 1; i++) {
				const point = this.trailPoints[i];
				const nextPoint = this.trailPoints[i + 1];
				trailAlpha *= this.trailDecay ?? 0.95;

				if (this.glow) {
					p5.drawingContext.shadowBlur = 10 * cellScale;
					p5.drawingContext.shadowColor = this.color + this.hex(trailAlpha);
				}

				p5.stroke(this.color + this.hex(trailAlpha));
				p5.strokeWeight(this.size * 0.5 * ((i + 1) / this.trailPoints.length));
				p5.line(point.x, point.y, nextPoint.x, nextPoint.y);
			}
		}

		if (this.glow) {
			p5.drawingContext.shadowBlur = 15 * cellScale;
			p5.drawingContext.shadowColor = this.color + this.hex(alpha);
		}

		if (this.sparkle) {
			const sparkleIntensity = Math.sin(p5.millis() * 0.01 + this.sparkleTime) * 0.5 + 0.5;
			p5.drawingContext.shadowBlur = (15 + sparkleIntensity * 10) * cellScale;
		}

		p5.noStroke();
		p5.fill(this.color + this.hex(alpha));

		if (this.type === 'score') {
			p5.textAlign(p5.CENTER, p5.CENTER);
			p5.textSize(this.fontSize ?? 12);
			if (this.font) p5.textFont(this.font);
			if (this.text) p5.text(this.text, this.x, this.y);
		} else {
			p5.circle(this.x, this.y, this.size);
		}

		p5.pop();
	}

	private hex(n: number): string {
		const h = Math.floor(n).toString(16);
		return h.length === 1 ? '0' + h : h;
	}
}
