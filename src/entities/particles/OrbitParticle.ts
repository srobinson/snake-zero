// src/entities/particles/OrbitParticle.ts
import type p5 from 'p5';
import { Particle } from '../Particle';
import type { IMotion, IRender } from '../ParticleBehaviors';
import type { TrailPoint } from '../../core/types';

class OrbitMotion implements IMotion {
	private center: { x: number; y: number };
	private radius: number;
	private speed: number;
	private angle: number;

	constructor(
		centerX: number,
		centerY: number,
		radius: number,
		speed: number,
		initialAngle: number
	) {
		this.center = { x: centerX, y: centerY };
		this.radius = radius;
		this.speed = speed;
		this.angle = initialAngle;
	}

	update(particle: Particle): void {
		this.angle += this.speed;
		particle.x = this.center.x + Math.cos(this.angle) * this.radius;
		particle.y = this.center.y + Math.sin(this.angle) * this.radius;
	}
}

class OrbitRender implements IRender {
	private size: number;
	private color: string;
	private trail: boolean;
	private trailPoints: TrailPoint[];
	private trailLength: number;
	private trailDecay: number;
	private glow: boolean;

	constructor(config: {
		size: number;
		color: string;
		trail?: { enabled: boolean; length?: number; decay?: number };
		glow?: boolean;
	}) {
		this.size = config.size;
		this.color = config.color;
		this.trail = config.trail?.enabled || false;
		this.trailPoints = [];
		this.trailLength = config.trail?.length || 3;
		this.trailDecay = config.trail?.decay || 0.95;
		this.glow = config.glow || false;
	}

	updateTrail(particle: Particle): void {
		if (!this.trail) return;
		this.trailPoints.push({ x: particle.x, y: particle.y });
		if (this.trailPoints.length > this.trailLength) {
			this.trailPoints.shift();
		}
	}

	render(p5: p5, particle: Particle, age: number): void {
		const alpha = Math.max(0, Math.min(255, 255 * (1 - age / particle['lifetime'])));
		const cellScale = particle.cellSize / 40;
		this.updateTrail(particle);

		p5.push();

		if (this.trail && this.trailPoints.length > 1) {
			let trailAlpha = alpha;
			for (let i = 0; i < this.trailPoints.length - 1; i++) {
				const point = this.trailPoints[i];
				const nextPoint = this.trailPoints[i + 1];
				trailAlpha *= this.trailDecay;
				if (this.glow) {
					p5.drawingContext.shadowBlur = 10 * cellScale;
					p5.drawingContext.shadowColor = `${this.color}${p5.hex(Math.floor(trailAlpha), 2)}`;
				}
				p5.stroke(`${this.color}${p5.hex(Math.floor(trailAlpha), 2)}`); // Use config color
				p5.strokeWeight(this.size * 0.5 * ((i + 1) / this.trailPoints.length));
				p5.line(point.x, point.y, nextPoint.x, nextPoint.y);
			}
		}

		if (this.glow) {
			p5.drawingContext.shadowBlur = 15 * cellScale;
			p5.drawingContext.shadowColor = `${this.color}${p5.hex(Math.floor(alpha), 2)}`;
		}

		p5.noStroke();
		p5.fill(`${this.color}${p5.hex(Math.floor(alpha), 2)}`); // Use config color
		p5.circle(particle.x, particle.y, this.size);

		p5.pop();
	}
}

export class OrbitParticle extends Particle {
	private motion: OrbitMotion;
	private renderBehavior: OrbitRender;

	constructor(
		p5: p5,
		cellSize: number,
		config: {
			centerX: number;
			centerY: number;
			radius: number;
			speed: number;
			initialAngle: number;
			size: number;
			color: string;
			trail?: { enabled: boolean; length?: number; decay?: number };
			glow?: boolean;
		}
	) {
		super(p5, cellSize);
		this.motion = new OrbitMotion(
			config.centerX,
			config.centerY,
			config.radius,
			config.speed,
			config.initialAngle
		);
		this.renderBehavior = new OrbitRender(config);
	}

	update(): boolean {
		const alive = super.update();
		if (alive) this.motion.update(this);
		return alive;
	}

	render(): void {
		const age = this.p5.millis() - this['birth'];
		this.renderBehavior.render(this.p5, this, age);
	}

	reinitialize(config: {
		centerX: number;
		centerY: number;
		radius: number;
		speed: number;
		initialAngle: number;
		size: number;
		color: string;
		trail?: { enabled: boolean; length?: number; decay?: number };
		glow?: boolean;
	}): void {
		this.motion = new OrbitMotion(
			config.centerX,
			config.centerY,
			config.radius,
			config.speed,
			config.initialAngle
		);
		this.renderBehavior = new OrbitRender(config);
	}
}
