/**
 * @typedef {import('../systems/physics/PhysicsSystem.js').Vector2D} Vector2D
 */

export class DamageIndicator {
    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    constructor(ctx) {
        this.ctx = ctx;
        /** @type {Array<{position: Vector2D, damage: number, alpha: number, offsetY: number}>} */
        this.indicators = [];
    }

    /**
     * Creates a new damage indicator
     * @param {Vector2D} position 
     * @param {number} damage 
     */
    create(position, damage) {
        this.indicators.push({
            position: { ...position },
            damage: Math.floor(damage),
            alpha: 1.0,
            offsetY: 0
        });
    }

    /**
     * Updates all damage indicators
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        const fadeRate = deltaTime * 0.001; // Convert to seconds
        
        for (let i = this.indicators.length - 1; i >= 0; i--) {
            const indicator = this.indicators[i];
            
            // Float upward
            indicator.offsetY -= deltaTime * 0.05;
            
            // Fade out
            indicator.alpha -= fadeRate;
            
            // Remove if fully faded
            if (indicator.alpha <= 0) {
                this.indicators.splice(i, 1);
            }
        }
    }

    /**
     * Renders all damage indicators
     */
    render() {
        this.ctx.save();
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (const indicator of this.indicators) {
            // Create shadow effect
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            // Draw damage number
            this.ctx.fillStyle = `rgba(255, ${Math.max(0, 255 - indicator.damage * 2)}, 0, ${indicator.alpha})`;
            this.ctx.fillText(
                indicator.damage.toString(),
                indicator.position.x,
                indicator.position.y + indicator.offsetY
            );
        }
        
        this.ctx.restore();
    }
}
