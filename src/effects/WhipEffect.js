/**
 * @typedef {import('../systems/physics/PhysicsSystem.js').Vector2D} Vector2D
 */

export class WhipEffect {
    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    constructor(ctx) {
        this.ctx = ctx;
        /** @type {Map<string, {position: Vector2D, velocity: Vector2D, alpha: number, size: number}>} */
        this.activeEffects = new Map();
    }

    /**
     * Creates a new whip trail effect
     * @param {string} segmentId 
     * @param {Vector2D} position 
     * @param {Vector2D} velocity 
     */
    createTrail(segmentId, position, velocity) {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        this.activeEffects.set(segmentId, {
            position: { ...position },
            velocity: { 
                x: velocity.x / speed,
                y: velocity.y / speed
            },
            alpha: 1.0,
            size: Math.min(20, speed * 3)
        });
    }

    /**
     * Creates an impact effect at the hit location
     * @param {Vector2D} position 
     * @param {number} damage 
     */
    createImpact(position, damage) {
        // Generate particles in a circular pattern
        const particleCount = Math.min(10, Math.floor(damage / 2));
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 2;
            const id = `impact_${Date.now()}_${i}`;
            
            this.activeEffects.set(id, {
                position: { ...position },
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                alpha: 1.0,
                size: 4 + Math.random() * 4
            });
        }
    }

    /**
     * Updates all active effects
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        const fadeRate = deltaTime * 0.001; // Convert to seconds
        
        for (const [id, effect] of this.activeEffects.entries()) {
            // Update position
            effect.position.x += effect.velocity.x * deltaTime * 0.1;
            effect.position.y += effect.velocity.y * deltaTime * 0.1;
            
            // Fade out
            effect.alpha -= fadeRate * 2;
            effect.size *= 0.95;
            
            // Remove if fully faded
            if (effect.alpha <= 0 || effect.size <= 1) {
                this.activeEffects.delete(id);
            }
        }
    }

    /**
     * Renders all active effects
     */
    render() {
        for (const effect of this.activeEffects.values()) {
            this.ctx.save();
            
            // Set up gradient
            const gradient = this.ctx.createRadialGradient(
                effect.position.x, effect.position.y, 0,
                effect.position.x, effect.position.y, effect.size
            );
            
            gradient.addColorStop(0, `rgba(255, 200, 50, ${effect.alpha})`);
            gradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
            
            // Draw effect
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(
                effect.position.x,
                effect.position.y,
                effect.size,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
}
