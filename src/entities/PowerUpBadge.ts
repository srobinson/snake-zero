// PowerUpBadge.ts
import type P5 from 'p5';
import type { PowerUpConfig, PowerUpType } from '../config/types';

interface Badge {
	color: string;
	icon: string;
}

export class PowerUpBadge {
	private p5: P5;
	private config: PowerUpConfig;
	private type: PowerUpType;
	private x: number;
	private y: number;
	private baseX: number;
	private baseY: number;
	private isFloating: boolean;
	private startTime: number;
	private size: number;
	private alpha: number;
	private scale: number;
	private baseScale: number;
	private badges: Record<PowerUpType, Badge>;
	private targetX: number;
	private targetY: number;
	private animStartX: number;
	private animStartY: number;
	private animStartTime: number | null;
	private readonly ANIM_DURATION: number = 400;
	private floatOffset: number;

	constructor(
		p5: P5,
		type: PowerUpType,
		runtimeConfig: PowerUpConfig,
		x: number,
		y: number,
		isFloating: boolean
	) {
		this.p5 = p5;
		this.type = type;
		this.config = runtimeConfig;
		this.x = x;
		this.y = isFloating ? y : y - this.config.badges.size * 3;
		this.baseX = x;
		this.baseY = y;
		this.isFloating = isFloating;
		this.startTime = Date.now();
		this.size = this.config.badges.size;
		this.alpha = 255;
		this.baseScale = this.isFloating ? this.config.badges.popInScale : 1;
		this.scale = 0;
		this.targetX = x;
		this.targetY = y;
		this.animStartX = x;
		this.animStartY = this.y;
		this.animStartTime = Date.now();
		this.floatOffset = Math.random() * Math.PI * 2;
		this.badges = {
			speed: { color: runtimeConfig.colors.speed, icon: runtimeConfig.icons.speed },
			ghost: { color: runtimeConfig.colors.ghost, icon: runtimeConfig.icons.ghost },
			points: { color: runtimeConfig.colors.points, icon: runtimeConfig.icons.points },
			slow: { color: runtimeConfig.colors.slow, icon: runtimeConfig.icons.slow },
		};
	}

	public getType(): PowerUpType {
		return this.type;
	}

	public setPosition(x: number, y: number): void {
		if (!this.isFloating) {
			if (this.x !== x || this.y !== y) {
				// Trigger animation if either changes
				console.log(
					`setPosition: ${this.type} from x:${this.x} y:${this.y} to x:${x} y:${y}`
				); // Debug
				this.animStartX = this.x;
				this.animStartY = this.y;
				this.targetX = x;
				this.targetY = y;
				this.animStartTime = Date.now();
			}
		} else {
			this.x = x;
			this.y = y;
		}
		this.baseX = x;
		this.baseY = y;
	}

	resetStartTime(): void {
		this.startTime = Date.now();
		this.alpha = 255;
		this.scale = this.isFloating ? 0 : this.baseScale;
	}

	update(): boolean {
		const elapsed = Date.now() - this.startTime;
		const remaining = this.config.badges.duration - elapsed;

		// Animate position
		if (this.animStartTime !== null) {
			const animElapsed = Date.now() - this.animStartTime;
			if (animElapsed < this.ANIM_DURATION) {
				const t = animElapsed / this.ANIM_DURATION;
				const easedT = this.easeOutBack(t);
				this.x = this.animStartX + (this.targetX - this.animStartX) * easedT;
				this.y = this.animStartY + (this.targetY - this.animStartY) * easedT;
				console.log(`Animating ${this.type}: x:${this.x} y:${this.y} t:${t}`); // Debug
			} else {
				this.x = this.targetX;
				this.y = this.targetY;
				this.animStartTime = null;
				console.log(`Animation complete ${this.type}: x:${this.x} y:${this.y}`); // Debug
			}
		}

		// Floating only applies after initial animation
		if (this.animStartTime === null) {
			const floatSpeed = 0.002;
			const floatAmplitudeX = this.size * 0.1;
			const floatAmplitudeY = this.size * 0.15;
			this.x =
				this.baseX + Math.sin(elapsed * floatSpeed + this.floatOffset) * floatAmplitudeX;
			this.y =
				this.baseY + Math.cos(elapsed * floatSpeed + this.floatOffset) * floatAmplitudeY;
		}

		if (elapsed < this.config.badges.popInDuration) {
			const progress = elapsed / this.config.badges.popInDuration;
			this.scale = this.p5.lerp(0, this.baseScale, this.easeOutBack(progress));
		} else {
			if (!this.isFloating) {
				const scaleVariation = 0.03;
				this.scale = this.baseScale + Math.sin(elapsed * 0.003) * scaleVariation;
			} else {
				const throbSpeed = 0.006;
				const throbAmount = 0.15;
				this.scale = this.baseScale + Math.sin(elapsed * throbSpeed) * throbAmount;
			}
		}

		if (this.isFloating) {
			const hoverOffset =
				Math.sin(elapsed * 0.001 * this.config.badges.hoverFrequency) *
				this.config.badges.hoverAmplitude;
			this.y += hoverOffset;
		}

		const fadeOutDuration = 500;
		if (remaining < fadeOutDuration) {
			this.alpha = Math.max(0, (remaining / fadeOutDuration) * 255);
		}

		return remaining > 0;
	}

	draw(): void {
		const p5 = this.p5;
		const badge = this.badges[this.type];
		const elapsed = Date.now() - this.startTime;
		const progress = Math.max(0, Math.min(1, 1 - elapsed / this.config.badges.duration));

		p5.push();
		p5.translate(this.x, this.y);
		p5.scale(this.scale);

		p5.drawingContext.shadowBlur = this.isFloating ? 20 : Math.sin(elapsed * 0.005) * 10 + 10;
		p5.drawingContext.shadowColor = badge.color;

		p5.noStroke();
		p5.fill(badge.color + this.hex(Math.floor(this.alpha)));
		p5.circle(0, 0, this.size);
		p5.drawingContext.shadowBlur = 0;

		if (!this.isFloating) {
			p5.noFill();
			p5.stroke(255, this.alpha * 0.7);
			p5.strokeWeight(3);
			const pulseOffset = Math.sin(elapsed * 0.01) * 2;
			p5.arc(
				0,
				0,
				this.size + 5 + pulseOffset,
				this.size + 5 + pulseOffset,
				-p5.HALF_PI,
				-p5.HALF_PI + p5.TWO_PI * progress
			);
		}

		p5.noStroke();
		p5.fill(255, this.alpha);
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.textSize(this.size * 0.5);
		p5.text(badge.icon, 0, 0);

		p5.pop();
	}

	private easeOutBack(t: number): number {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
	}

	private hex(n: number): string {
		const h = Math.max(0, Math.min(255, n)).toString(16);
		return h.length === 1 ? '0' + h : h;
	}
}
