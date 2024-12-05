import p5 from 'p5';
import type { PowerUpConfig } from '../config/types';

type PowerUpType = 'speed' | 'ghost' | 'points' | 'slow';

interface Badge {
	color: string;
	icon: string;
}

export class PowerUpBadge {
	private p5: p5;
	private config: PowerUpConfig;
	private type: PowerUpType;
	private x: number;
	private y: number;
	private baseY: number;
	private isFloating: boolean;
	private startTime: number;
	private size: number;
	private alpha: number;
	private scale: number;
	private baseScale: number;
	private currentScale: number;
	private badges: Record<PowerUpType, Badge>;

	resetStartTime(): void {
		this.startTime = Date.now();
	}

	constructor(
		p5: p5,
		type: PowerUpType,
		runtimeCconfig: PowerUpConfig,
		x: number,
		y: number,
		isFloating: boolean
	) {
		this.p5 = p5;
		this.type = type;
		this.x = x;
		this.y = y;
		this.baseY = y;
		this.isFloating = isFloating;
		this.startTime = Date.now();
		this.alpha = 255;
		this.scale = 0;
		this.config = runtimeCconfig;
		this.baseScale = this.config.badges.popInScale;
		this.size = this.config.badges.size;
		this.currentScale = this.baseScale;

		// Define badge colors and icons
		this.badges = {
			speed: {
				color: runtimeCconfig.colors.speed,
				icon: runtimeCconfig.icons.speed,
			},
			ghost: {
				color: runtimeCconfig.colors.ghost,
				icon: runtimeCconfig.icons.ghost,
			},
			points: {
				color: runtimeCconfig.colors.points,
				icon: runtimeCconfig.icons.points,
			},
			slow: { color: runtimeCconfig.colors.slow, icon: runtimeCconfig.icons.slow },
		};
	}

	update(): boolean {
		const elapsed = Date.now() - this.startTime;
		const remaining = this.config.badges.duration - elapsed;

		// Pop-in animation
		if (elapsed < this.config.badges.popInDuration) {
			const progress = elapsed / this.config.badges.popInDuration;
			this.scale = this.p5.lerp(0, this.baseScale, this.easeOutBack(progress));
		} else {
			// Subtle motion for non-floating badges
			if (!this.isFloating) {
				// Gentle vertical bounce
				const bounceSpeed = 0.004;
				const bounceAmount = this.size * 0.05;
				const verticalOffset = Math.sin(elapsed * bounceSpeed) * bounceAmount;
				this.y = this.baseY + verticalOffset;

				// Subtle scale variation
				const scaleVariation = 0.05;
				this.scale = this.baseScale + Math.sin(elapsed * 0.003) * scaleVariation;
			}
			// Existing floating badge animation
			else {
				const throbSpeed = 0.006;
				const throbAmount = 0.15;
				this.scale = this.baseScale + Math.sin(elapsed * throbSpeed) * throbAmount;
			}
		}

		// Hover animation for floating badges
		if (this.isFloating) {
			const hoverOffset =
				Math.sin(elapsed * 0.001 * this.config.badges.hoverFrequency) *
				this.config.badges.hoverAmplitude;
			this.y = this.baseY + hoverOffset;
		}

		// Fade out when almost expired
		const fadeOutDuration = 500; // 500ms fade out
		if (remaining < fadeOutDuration) {
			this.alpha = Math.max(0, (remaining / fadeOutDuration) * 255);
		}

		return remaining > 0;
	}

	draw(): void {
		const p5 = this.p5;
		const badge = this.badges[this.type];
		const elapsed = Date.now() - this.startTime;
		const progress = Math.max(0, Math.min(1, 1 - elapsed / this.config.badges.duration)); // Clamp between 0 and 1

		p5.push();
		p5.translate(this.x, this.y);
		p5.scale(this.scale);

		// Pulsing glow effect for non-floating badges
		if (!this.isFloating) {
			const glowIntensity = Math.sin(elapsed * 0.005) * 10 + 10;
			p5.drawingContext.shadowBlur = glowIntensity;
			p5.drawingContext.shadowColor = badge.color;
		} else {
			p5.drawingContext.shadowBlur = 20;
			p5.drawingContext.shadowColor = badge.color;
		}

		p5.noStroke();
		p5.fill(badge.color + this.hex(Math.floor(this.alpha)));
		p5.circle(0, 0, this.size);
		p5.drawingContext.shadowBlur = 0;

		// Improved progress ring animation for UI badges
		if (!this.isFloating) {
			p5.noFill();
			p5.stroke(255, this.alpha * 0.7);
			p5.strokeWeight(3);

			// Animated progress ring with slight pulsing
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

		// Draw icon
		p5.noStroke();
		p5.fill(255, this.alpha);
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.textSize(this.size * 0.5);
		p5.text(badge.icon, 0, 0);

		p5.pop();
	}

	// Easing function for pop animation
	private easeOutBack(x: number): number {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
	}

	// Convert number to hex string with alpha
	private hex(n: number): string {
		const h = Math.max(0, Math.min(255, n)).toString(16);
		return h.length === 1 ? '0' + h : h;
	}
}
