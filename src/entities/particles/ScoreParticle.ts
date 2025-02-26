// src/entities/particles/ScoreParticle.ts
import type p5 from 'p5';
import { Particle } from '../Particle';
import type { IMotion, IRender } from '../ParticleBehaviors';

class ScoreMotion implements IMotion {
	private vy: number;
	private scale: number;
	private targetScale: number;

	constructor(speed: number, cellSize: number) {
		const baseScale = Math.max(0.3, Math.min(1, cellSize / 40));
		this.vy = -speed * baseScale;
		this.scale = 0;
		this.targetScale = 1.3 * baseScale;
	}

	update(particle: Particle): void {
		particle.y += this.vy;
		this.vy *= 0.95;
		this.scale = Math.min(this.targetScale, this.scale + 0.2);
		particle['scale'] = this.scale; // Temp hack—could make public
	}
}

class ScoreRender implements IRender {
	private text: string;
	private font: string;
	private fontSize: number;
	private color: string;

	constructor(config: { text: string; font: string; fontSize: number; color: string }) {
		this.text = config.text;
		this.font = config.font;
		this.fontSize = config.fontSize;
		this.color = config.color;
	}

	render(p5: p5, particle: Particle, age: number): void {
		const alpha = Math.max(0, Math.min(255, 255 * (1 - age / particle['lifetime'])));
		p5.push();
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.textSize(this.fontSize * (particle['scale'] || 1));
		p5.textFont(this.font);
		p5.fill(`${this.color}${p5.hex(Math.floor(alpha), 2)}`); // Use config color with alpha
		p5.text(this.text, particle.x, particle.y);
		p5.pop();
	}
}

export class ScoreParticle extends Particle {
	private motion: ScoreMotion;
	private renderBehavior: ScoreRender;

	constructor(
		p5: p5,
		cellSize: number,
		config: { text: string; font: string; fontSize: number; color: string; speed: number }
	) {
		super(p5, cellSize);
		this.motion = new ScoreMotion(config.speed, cellSize);
		this.renderBehavior = new ScoreRender(config);
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
		text: string;
		font: string;
		fontSize: number;
		color: string;
		speed: number;
	}): void {
		this.motion = new ScoreMotion(config.speed, this.cellSize);
		this.renderBehavior = new ScoreRender(config);
	}
}
