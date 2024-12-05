import p5 from 'p5';
import { ParticleConfigType, ParticleType } from '../config/types';
import { TrailPoint } from '../core/types';

export class Particle {
	private p5: p5;
	public x: number;
	public y: number;
	private cellSize: number;
	private birth: number;
	private type: ParticleType;

	// Movement properties
	private vx: number = 0;
	private vy: number = 0;
	private speed: number = 0;
	private rotation: number = 0;

	// Visual properties
	private size: number = 0;
	private color: string = '#ffffff';
	private lifetime: number = 0;
	private scale: number = 0;
	private targetScale: number = 0;

	// Trail properties
	private trailPoints: Array<TrailPoint> = [];
	private trailLength: number;
	private trailDecay: number;

	// Effect flags
	private trail: boolean;
	private glow: boolean;
	private sparkle: boolean;
	private pulse: boolean;
	private spiral: boolean;
	private orbit: boolean;
	private isRainbow: boolean;

	// Sparkle and pulse properties
	private sparkleTime: number = 0;
	private pulsePhase: number;
	private spiralAngle: number = 0;
	private rotationSpeed: number;

	// Orbital properties
	private orbitCenter?: { x: number; y: number };
	private orbitRadius?: number;
	private orbitSpeed?: number;
	private orbitAngle?: number;

	// Gravity
	private gravity: number;

	// Optional score-specific properties
	private score?: number;
	private text?: string;
	private font?: string;
	private fontSize?: number;

	constructor(p5: p5, x: number, y: number, config: ParticleConfigType, cellSize: number) {
		this.p5 = p5;
		this.x = x;
		this.y = y;
		this.cellSize = cellSize;
		this.birth = p5.millis();
		this.type = config.type || 'normal';

		// Calculate scale factor based on cell size
		const baseScale = Math.max(0.3, Math.min(1, cellSize / 40));

		// Score specific properties
		if (this.type === 'score') {
			this.score = config.score;
			this.text = config.text;
			this.font = config.font;
			this.fontSize = (config.fontSize || 0) * baseScale;
			this.scale = 0;
			this.targetScale = 1.3 * baseScale;
			this.rotation = p5.random(-0.2, 0.2);
			this.vy = -(config.speed || 0) * baseScale;
		}

		// Initialize movement
		const angle =
			config.initialAngle !== undefined ? config.initialAngle : Math.random() * Math.PI * 2;

		// Calculate speed
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

		// Visual properties
		this.size =
			cellSize *
			(config.size.min + Math.random() * (config.size.max - config.size.min)) *
			baseScale;

		// Calculate lifetime
		const lifetimeMin = config.lifetime?.min ?? 500;
		const lifetimeMax = config.lifetime?.max ?? 1500;
		this.lifetime = lifetimeMin + Math.random() * (lifetimeMax - lifetimeMin);

		// Ensure color is a valid hex color with alpha
		const color = config.colors[Math.floor(Math.random() * config.colors.length)];
		this.color = color.startsWith('#') ? color : '#ffffff';

		// Effect flags
		this.trail = config.trail?.enabled || false;
		this.glow = config.glow || false;
		this.sparkle = config.sparkle || false;
		this.pulse = config.pulse || false;
		this.spiral = config.spiral || false;
		this.orbit = config.orbit?.enabled || false;
		this.isRainbow = config.rainbow || false;

		// Effect properties
		this.trailPoints = [];
		this.trailLength = config.trail?.length || 3;
		this.trailDecay = config.trail?.decay || 0.95;
		this.sparkleTime = 0;
		this.pulsePhase = Math.random() * Math.PI * 2;
		this.spiralAngle = 0;
		this.rotationSpeed = (Math.random() * 0.1 + 0.05) * (Math.random() < 0.5 ? 1 : -1);

		// Orbital properties
		if (this.orbit) {
			this.orbitCenter = { x, y };
			this.orbitRadius = config.orbit?.radius;
			this.orbitSpeed = config.orbit?.speed;
			this.orbitAngle = angle;
		}

		// Apply gravity if specified
		this.gravity = config.gravity || 0;
	}

	update(): boolean {
		const p5 = this.p5;
		const age = p5.millis() - this.birth;

		if (this.type === 'score') {
			// Safely handle score-specific updates
			this.scale = Math.min(this.targetScale ?? 0, this.scale + 0.2);
			this.y += this.vy;
			this.vy *= 0.95;
		} else if (this.orbit) {
			// Add null checks for orbital properties
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
			// Normal particle motion with safe defaults
			this.x += this.vx;
			this.y += this.vy;

			// Apply gravity and friction
			this.vy += (this.gravity ?? 0) * (this.cellSize / 40);
			this.vx *= 0.98;
			this.vy *= 0.98;
		}

		// Safely handle trail
		if (this.trail) {
			this.trailPoints.push({ x: this.x, y: this.y });
			if (this.trailPoints.length > (this.trailLength ?? 3)) {
				this.trailPoints.shift();
			}
		}

		// Safely handle sparkle
		if (this.sparkle) {
			this.sparkleTime = (this.sparkleTime + 0.1) % (Math.PI * 2);
		}

		return age < this.lifetime;
	}

	draw(): void {
		const p5 = this.p5;
		const age = p5.millis() - this.birth;
		const lifePercent = age / this.lifetime;
		const alpha = Math.max(0, Math.min(255, 255 * (1 - lifePercent)));
		const cellScale = this.cellSize / 40;

		p5.push();

		// Safely draw trail
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

		// Safely apply glow and sparkle effects
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

		// Safely handle text rendering
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

	// Helper method for hex conversion
	private hex(n: number): string {
		const h = Math.floor(n).toString(16);
		return h.length === 1 ? '0' + h : h;
	}
}
