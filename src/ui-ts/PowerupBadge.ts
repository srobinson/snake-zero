import configManager from '../config/gameConfig.js';
import { powerUpConfig } from '../powerups/PowerUpConfig.js';
import type { P5CanvasInstance } from '../types-ts/commonTypes';
import type { PowerUpType } from '../types-ts/powerUpTypes';
import type { PowerupBadgeConfig, BadgeCollection } from '../types-ts/powerupBadgeTypes';

export class PowerupBadge {
    private p5: P5CanvasInstance;
    private type: PowerUpType;
    private config: PowerupBadgeConfig;
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
    private badges: BadgeCollection;

    constructor(p5: P5CanvasInstance, type: PowerUpType, config: PowerupBadgeConfig, x: number, y: number, isFloating: boolean) {
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

    public update(): boolean {
        const elapsed = Date.now() - this.startTime;
        const remaining = this.config.duration - elapsed;

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
            const hoverSpeed = 0.004;
            const hoverAmount = 5;
            this.y = this.baseY + Math.sin(elapsed * hoverSpeed) * hoverAmount;
        }

        // Fade out animation
        if (!this.isFloating && remaining < this.config.fadeOutDuration) {
            this.alpha = (remaining / this.config.fadeOutDuration) * 255;
            if (this.alpha <= 0) {
                return true; // Remove the badge
            }
        }

        return false;
    }

    public isComplete(): boolean {
        return this.update();
    }

    public getType(): PowerUpType {
        return this.type;
    }

    public draw(): void {
        const badge = this.badges[this.type];
        if (!badge) return;

        this.p5.push();
        this.p5.translate(this.x, this.y);
        this.p5.scale(this.scale);

        // Draw badge background
        const color = badge.color + this.hex(this.alpha);
        this.p5.fill(color);
        this.p5.noStroke();
        this.p5.rect(-this.size/2, -this.size/2, this.size, this.size, 5);

        // Draw icon
        this.p5.fill(255, this.alpha);
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.textSize(24);
        this.p5.text(badge.icon, 0, 2);

        this.p5.pop();
    }

    private easeOutBack(x: number): number {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    private hex(n: number): string {
        const h = Math.floor(n).toString(16);
        return h.length === 1 ? '0' + h : h;
    }
}
