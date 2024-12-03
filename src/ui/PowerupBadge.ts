import p5 from 'p5';
import configManager from '../config/gameConfig';
import { powerUpConfig } from '../config/powerUpConfig';

interface BadgeConfig {
    size: number;
    duration: number;
    popInDuration: number;
    popInScale: number;
    hoverFrequency: number;
    hoverAmplitude: number;
}

type PowerUpType = 'speed' | 'ghost' | 'points' | 'slow';

interface Badge {
    color: string;
    icon: string;
}

export class PowerupBadge {
    private p5: p5;
    private type: PowerUpType;
    private config: BadgeConfig;
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

    constructor(p5: p5, type: PowerUpType, config: BadgeConfig, x: number, y: number, isFloating: boolean) {
        this.p5 = p5;
        this.type = type;
        this.config = config;
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.isFloating = isFloating;
        this.startTime = Date.now();
        this.size = config.size;
        this.alpha = 255;
        this.scale = 0;
        this.baseScale = config.popInScale;
        this.currentScale = this.baseScale;
        
        const gameConfig = configManager.getConfig();
        
        // Define badge colors and icons
        this.badges = {
            speed: { color: gameConfig.powerUps.colors.speed, icon: powerUpConfig.icons.speed },
            ghost: { color: gameConfig.powerUps.colors.ghost, icon: powerUpConfig.icons.ghost },
            points: { color: gameConfig.powerUps.colors.points, icon: powerUpConfig.icons.points },
            slow: { color: gameConfig.powerUps.colors.slow, icon: powerUpConfig.icons.slow }
        };
    }

    update(): boolean {
        const elapsed = Date.now() - this.startTime;
        const remaining = this.config.duration - elapsed; // Duration is already in milliseconds

        // Pop-in animation
        if (elapsed < this.config.popInDuration) {
            const progress = elapsed / this.config.popInDuration;
            this.scale = this.p5.lerp(0, this.baseScale, this.easeOutBack(progress));
        } else {
            // Throb animation for floating badges
            if (this.isFloating) {
                const throbSpeed = 0.006;
                const throbAmount = 0.15;
                this.scale = this.baseScale + Math.sin(elapsed * throbSpeed) * throbAmount;
            } else {
                this.scale = this.baseScale;
            }
        }

        // Hover animation for floating badges
        if (this.isFloating) {
            const hoverOffset = Math.sin(elapsed * 0.001 * this.config.hoverFrequency) * this.config.hoverAmplitude;
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
        const progress = Math.max(0, Math.min(1, 1 - (elapsed / this.config.duration))); // Clamp between 0 and 1

        p5.push();
        p5.translate(this.x, this.y);
        p5.scale(this.scale);

        // Draw badge background with glow
        p5.drawingContext.shadowBlur = 20;
        p5.drawingContext.shadowColor = badge.color;
        p5.noStroke();
        p5.fill(badge.color + this.hex(Math.floor(this.alpha)));
        p5.circle(0, 0, this.size);
        p5.drawingContext.shadowBlur = 0;

        // Draw progress ring (only for UI badges)
        if (!this.isFloating) {
            p5.noFill();
            p5.stroke(255, this.alpha);
            p5.strokeWeight(3);
            p5.arc(0, 0, this.size + 5, this.size + 5, -p5.HALF_PI, -p5.HALF_PI + (p5.TWO_PI * progress));
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
