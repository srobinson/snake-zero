import { effectsConfig } from '../config/effectsConfig.js';

/**
 * Individual particle for effects
 * @class
 */
class Particle {
    constructor(p5, x, y, config, cellSize) {
        this.p5 = p5;
        this.x = x;
        this.y = y;
        this.cellSize = cellSize;
        this.isActiveEffect = config.isActiveEffect || false;
        
        // Use provided angle or generate random one
        let angle;
        if (config.initialAngle !== undefined) {
            angle = config.initialAngle;
        } else {
            if (this.isActiveEffect) {
                // For active effects, favor horizontal movement
                angle = (Math.random() * Math.PI * 0.8) - (Math.PI * 0.4); // -40° to +40°
            } else {
                angle = Math.random() * Math.PI * 2; // Full 360°
            }
        }
        
        this.speed = (config.speed * cellSize / 40) * (0.8 + Math.random() * 0.4);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        // Random size within range
        const baseSize = cellSize * (config.size.min + Math.random() * (config.size.max - config.size.min));
        this.size = Math.max(2, baseSize * 0.3); // Ensure minimum visibility
        
        // Random color from palette
        this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
        
        // Random lifetime within range
        this.lifetime = config.lifetime.min + Math.random() * (config.lifetime.max - config.lifetime.min);
        this.birth = p5.millis();
        
        // Effect properties
        this.trail = config.trail || false;
        this.glow = config.glow || false;
        this.sparkle = config.sparkle || false;
        this.trailPoints = [];
        this.sparkleTime = 0;
    }

    update() {
        // Update position
        this.x += this.vx;
        
        // Apply less gravity for active effects
        if (this.isActiveEffect) {
            this.vy += 0.03 * (this.cellSize / 40); // Reduced gravity for active effects
        } else {
            this.vy += 0.1 * (this.cellSize / 40); // Normal gravity for other effects
        }
        
        this.y += this.vy;
        
        // Scale friction with cell size
        const friction = this.isActiveEffect ? 
            0.99 - (0.001 * (40 / this.cellSize)) : // Less friction for active effects
            0.98 - (0.001 * (40 / this.cellSize));  // Normal friction
            
        this.vx *= friction;
        this.vy *= friction;
        
        // Update trail
        if (this.trail) {
            this.trailPoints.push({ x: this.x, y: this.y });
            if (this.trailPoints.length > 5) {
                this.trailPoints.shift();
            }
        }
        
        // Update sparkle timing
        if (this.sparkle) {
            this.sparkleTime = (this.sparkleTime + 1) % 30;
        }
    }

    draw() {
        const p5 = this.p5;
        const age = p5.millis() - this.birth;
        const lifePercent = age / this.lifetime;
        const alpha = Math.max(0, 255 * (1 - lifePercent));
        
        p5.noStroke();
        
        // Draw trail
        if (this.trail && this.trailPoints.length > 1) {
            for (let i = 0; i < this.trailPoints.length - 1; i++) {
                const t = i / (this.trailPoints.length - 1);
                const trailAlpha = alpha * t * 0.7; // Increased trail opacity
                p5.fill(this.color + Math.floor(trailAlpha).toString(16).padStart(2, '0'));
                p5.circle(this.trailPoints[i].x, this.trailPoints[i].y, this.size * (t + 0.3)); // Made trails thicker
            }
        }
        
        // Draw glow effect
        if (this.glow) {
            const glowSize = this.size * 2.5; // Increased glow size
            const glowAlpha = alpha * 0.4; // Increased glow opacity
            p5.fill(this.color + Math.floor(glowAlpha).toString(16).padStart(2, '0'));
            p5.circle(this.x, this.y, glowSize);
            
            // Add second glow layer for more intensity
            const innerGlowSize = this.size * 1.8;
            const innerGlowAlpha = alpha * 0.6;
            p5.fill(this.color + Math.floor(innerGlowAlpha).toString(16).padStart(2, '0'));
            p5.circle(this.x, this.y, innerGlowSize);
        }
        
        // Draw main particle
        p5.fill(this.color + Math.floor(alpha).toString(16).padStart(2, '0'));
        p5.circle(this.x, this.y, this.size);
        
        // Draw sparkle effect
        if (this.sparkle && this.sparkleTime < 15) {
            const sparkleAlpha = alpha * (1 - this.sparkleTime / 15) * 0.9; // Increased sparkle opacity
            p5.stroke('#FFFFFF' + Math.floor(sparkleAlpha).toString(16).padStart(2, '0'));
            p5.strokeWeight(2); // Thicker sparkle lines
            const sparkleSize = this.size * 2; // Larger sparkles
            p5.line(this.x - sparkleSize, this.y, this.x + sparkleSize, this.y);
            p5.line(this.x, this.y - sparkleSize, this.x, this.y + sparkleSize);
            
            // Add diagonal sparkle lines for more flash
            const diagonalSize = sparkleSize * 0.7;
            p5.line(this.x - diagonalSize, this.y - diagonalSize, this.x + diagonalSize, this.y + diagonalSize);
            p5.line(this.x - diagonalSize, this.y + diagonalSize, this.x + diagonalSize, this.y - diagonalSize);
        }
    }

    isAlive() {
        return this.p5.millis() - this.birth < this.lifetime;
    }
}

/**
 * Particle system for visual effects
 * @class
 */
export class Particles {
    constructor(p5, grid, game) {
        this.p5 = p5;
        this.grid = grid;
        this.game = game;
        this.particles = [];
        this.activeEffects = new Map();
        this.lastEffectTime = new Map();
    }

    createFoodEffect(position, foodColor) {
        const center = this.grid.getCellCenter(position);
        const config = {
            ...effectsConfig.particles.food,
            colors: [
                foodColor,     // Main food color (3 times for 60% chance)
                foodColor,
                foodColor,
                '#FFFFFF',     // Pure white (20% chance)
                '#FFFFFFBB'    // Semi-transparent white (20% chance)
            ]
        };
        
        // Create particles with the food color
        const particleCount = config.count || 12;
        for (let i = 0; i < particleCount; i++) {
            // Create a new particle with the combined config
            const particle = new Particle(
                this.p5,
                center.x,
                center.y,
                config,
                this.grid.cellSize
            );
            
            // Ensure sparkle effect for food particles
            particle.sparkle = true;
            particle.glow = true;
            
            this.particles.push(particle);
        }
    }

    createPowerUpEffect(position, type) {
        const center = this.grid.getCellCenter(position);
        const config = effectsConfig.particles.powerUps[type];
        
        if (config.explosion) {
            // Create explosion effect
            for (let ring = 0; ring < 3; ring++) {
                const ringParticles = config.count / 3;
                for (let i = 0; i < ringParticles; i++) {
                    const delay = ring * 100; // Stagger the rings
                    setTimeout(() => {
                        this.particles.push(
                            new Particle(
                                this.p5,
                                center.x,
                                center.y,
                                config,
                                this.grid.cellSize
                            )
                        );
                    }, delay);
                }
            }
        } else {
            // Create normal particle effect
            for (let i = 0; i < config.count; i++) {
                this.particles.push(
                    new Particle(
                        this.p5,
                        center.x,
                        center.y,
                        config,
                        this.grid.cellSize
                    )
                );
            }
        }
    }

    updateActiveEffect(type, position) {
        const config = {
            ...effectsConfig.particles.activeEffects[type],
            isActiveEffect: true // Mark as active effect
        };
        const now = this.p5.millis();
        
        if (!this.lastEffectTime.has(type) || 
            now - this.lastEffectTime.get(type) >= config.interval) {
            const center = this.grid.getCellCenter(position);
            const direction = this.game.snake.direction;
            
            for (let i = 0; i < config.count; i++) {
                // Determine angle range based on snake direction
                let angleRange;
                let baseAngle;
                
                if (direction === 'up' || direction === 'down') {
                    angleRange = Math.PI * 0.5; // 90 degrees
                    baseAngle = direction === 'up' ? -Math.PI/2 : Math.PI/2;
                } else {
                    angleRange = Math.PI * 0.8; // 144 degrees for horizontal
                    baseAngle = direction === 'left' ? Math.PI : 0;
                }
                
                // Calculate random angle within the appropriate range
                const angle = baseAngle + (Math.random() * angleRange - angleRange/2);
                
                const particle = new Particle(
                    this.p5,
                    center.x,
                    center.y,
                    {
                        ...config,
                        initialAngle: angle
                    },
                    this.grid.cellSize
                );
                
                this.particles.push(particle);
            }
            
            this.lastEffectTime.set(type, now);
        }
    }

    update() {
        // Update and draw all particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.isAlive();
        });
    }

    draw() {
        // Draw all particles
        for (const particle of this.particles) {
            particle.draw();
        }
    }
}
