import { effectsConfig } from '../config/effectsConfig.js';

/**
 * Convert number to hex string with alpha
 * @param {number} n - Number to convert to hex
 * @returns {string} Hex string
 */
function hex(n) {
    let h = Math.floor(n).toString(16);
    return h.length == 1 ? '0' + h : h;
}

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
        this.birth = p5.millis();
        this.type = config.type || 'normal';
        
        // Calculate scale factor based on cell size
        const baseScale = Math.max(0.3, Math.min(1, cellSize / 40));
        
        // Score specific properties
        if (this.type === 'score') {
            this.score = config.score;
            this.text = config.text;
            this.font = config.font;
            this.fontSize = config.fontSize * baseScale;
            this.scale = 0;
            this.targetScale = 1.3 * baseScale;
            this.rotation = p5.random(-0.2, 0.2);
            this.vy = -config.speed * baseScale;
        }
        
        // Initialize movement
        const angle = config.initialAngle !== undefined ? 
            config.initialAngle : 
            Math.random() * Math.PI * 2;
            
        this.speed = config.speed * baseScale;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = this.type === 'score' ? this.vy : Math.sin(angle) * this.speed;
        
        // Visual properties
        this.size = cellSize * (config.size.min + Math.random() * (config.size.max - config.size.min)) * baseScale;
        this.lifetime = config.lifetime.min + Math.random() * (config.lifetime.max - config.lifetime.min);
        
        // Ensure color is a valid hex color with alpha
        const color = config.colors[Math.floor(Math.random() * config.colors.length)];
        this.color = color.startsWith('#') ? color : '#ffffff';
        
        // Effect flags
        this.trail = config.trail?.enabled || false;
        this.glow = config.glow;
        this.sparkle = config.sparkle;
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
        this.rotationSpeed = config.rotationSpeed || (Math.random() * 0.1 + 0.05) * (Math.random() < 0.5 ? 1 : -1);
        
        // Orbital properties
        if (this.orbit) {
            this.orbitCenter = { x, y };
            this.orbitRadius = config.orbit.radius;
            this.orbitSpeed = config.orbit.speed;
            this.orbitAngle = angle;
        }
        
        // Apply gravity if specified
        this.gravity = config.gravity || 0;
    }

    update() {
        const p5 = this.p5;
        const age = p5.millis() - this.birth;
        const cellScale = this.cellSize / 40;

        if (this.type === 'score') {
            // Update score text animation
            this.scale = Math.min(this.targetScale, this.scale + 0.2);
            this.y += this.vy;
            this.vy *= 0.95;
        } else if (this.orbit) {
            // Update orbital motion
            this.orbitAngle += this.orbitSpeed;
            this.x = this.orbitCenter.x + Math.cos(this.orbitAngle) * this.orbitRadius;
            this.y = this.orbitCenter.y + Math.sin(this.orbitAngle) * this.orbitRadius;
        } else {
            // Update normal particle motion
            this.x += this.vx;
            this.y += this.vy;
            
            // Apply gravity and friction
            this.vy += this.gravity * cellScale;
            this.vx *= 0.98;
            this.vy *= 0.98;
        }
        
        // Update trail
        if (this.trail) {
            this.trailPoints.push({ x: this.x, y: this.y });
            if (this.trailPoints.length > this.trailLength) {
                this.trailPoints.shift();
            }
        }
        
        // Update sparkle
        if (this.sparkle) {
            this.sparkleTime = (this.sparkleTime + 0.1) % (Math.PI * 2);
        }
        
        return age < this.lifetime;
    }

    draw() {
        const p5 = this.p5;
        const age = p5.millis() - this.birth;
        const lifePercent = age / this.lifetime;
        const alpha = Math.max(0, Math.min(255, 255 * (1 - lifePercent)));
        const cellScale = this.cellSize / 40; // Base scale on 40px cell size
        
        p5.push();
        
        // Draw trail
        if (this.trail && this.trailPoints.length > 1) {
            let trailAlpha = alpha;
            for (let i = 0; i < this.trailPoints.length - 1; i++) {
                const point = this.trailPoints[i];
                const nextPoint = this.trailPoints[i + 1];
                
                // Fade trail points based on their position in the trail
                trailAlpha *= this.trailDecay;
                
                if (this.glow) {
                    p5.drawingContext.shadowBlur = 10 * cellScale;
                    p5.drawingContext.shadowColor = this.color + hex(trailAlpha);
                }
                
                p5.stroke(this.color + hex(trailAlpha));
                p5.strokeWeight(this.size * 0.5 * ((i + 1) / this.trailPoints.length));
                p5.line(point.x, point.y, nextPoint.x, nextPoint.y);
            }
        }
        
        // Draw main particle
        if (this.glow) {
            p5.drawingContext.shadowBlur = 15 * cellScale;
            p5.drawingContext.shadowColor = this.color + hex(alpha);
        }
        
        // Apply sparkle effect
        if (this.sparkle) {
            const sparkleIntensity = Math.sin(p5.millis() * 0.01 + this.sparkleTime) * 0.5 + 0.5;
            p5.drawingContext.shadowBlur = (15 + sparkleIntensity * 10) * cellScale;
        }
        
        p5.noStroke();
        p5.fill(this.color + hex(alpha));
        
        if (this.type === 'score') {
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.textSize(this.fontSize);
            if (this.font) p5.textFont(this.font);
            p5.text(this.text, this.x, this.y);
        } else {
            p5.circle(this.x, this.y, this.size);
        }
        
        p5.pop();
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

    createFoodEffect(position, color, score = 10, multiplier = 1) {
        const center = this.grid.getCellCenter(position);
        const finalScore = score * multiplier;
        const config = effectsConfig.particles.food;
        
        // Create dynamic score text effect
        const scoreParticle = new Particle(
            this.p5,
            center.x,
            center.y,
            {
                type: 'score',
                size: {
                    min: 0.8,
                    max: 1.2
                },
                lifetime: {
                    min: 1200,
                    max: 1500
                },
                speed: 3,
                colors: config.colors,
                glow: true,
                pulse: true,
                score: finalScore,
                text: finalScore.toString(),
                font: 'Bangers',
                fontSize: this.grid.cellSize * (finalScore >= 100 ? 2.5 : 2.0), // Made text much larger
                isRainbow: finalScore >= 500,
                sparkle: finalScore >= 50
            },
            this.grid.cellSize
        );
        this.particles.push(scoreParticle);

        // Create burst particles
        const particleCount = Math.min(25, config.count + Math.floor(Math.log10(finalScore) * 3));
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = config.speed * (0.8 + Math.random() * 0.4);
            
            this.particles.push(new Particle(
                this.p5,
                center.x,
                center.y,
                {
                    initialAngle: angle,
                    speed: speed * (1 + Math.log10(finalScore) * 0.2),
                    size: {
                        min: config.size.min * (1 + Math.log10(finalScore) * 0.1),
                        max: config.size.max * (1 + Math.log10(finalScore) * 0.1)
                    },
                    lifetime: {
                        min: config.lifetime.min,
                        max: config.lifetime.max
                    },
                    colors: config.colors,
                    trail: config.trail,
                    glow: config.glow,
                    sparkle: config.sparkle,
                    pulse: config.pulse,
                    rainbow: finalScore >= 500
                },
                this.grid.cellSize
            ));
        }
    }

    createPowerUpEffect(position, type) {
        const center = this.grid.getCellCenter(position);
        const config = effectsConfig.particles.powerUps[type];
        const cellSize = this.grid.getCellSize();
        
        // Create burst particles
        for (let i = 0; i < config.particleCount; i++) {
            const angle = (i / config.particleCount) * Math.PI * 2;
            
            this.particles.push(new Particle(
                this.p5,
                center.x,
                center.y,
                {
                    type: 'powerup',
                    initialAngle: angle,
                    speed: config.baseSpeed * (1 + Math.random() * config.speedVariation),
                    size: {
                        min: config.sizeRange[0] / cellSize,
                        max: config.sizeRange[1] / cellSize
                    },
                    lifetime: {
                        min: config.duration * 0.8,
                        max: config.duration
                    },
                    colors: config.colors,
                    trail: {
                        enabled: config.trail.enabled,
                        length: config.trail.length,
                        decay: config.trail.decay
                    },
                    glow: true,
                    sparkle: config.sparkle,
                    rainbow: false
                },
                cellSize
            ));
        }

        // Add orbital particles
        const orbitCount = 8;
        for (let i = 0; i < orbitCount; i++) {
            const angle = (i / orbitCount) * Math.PI * 2;
            this.particles.push(new Particle(
                this.p5,
                center.x,
                center.y,
                {
                    type: 'orbit',
                    initialAngle: angle,
                    speed: config.baseSpeed * 0.5,
                    size: {
                        min: config.sizeRange[0] * 0.8 / cellSize,
                        max: config.sizeRange[1] * 0.8 / cellSize
                    },
                    lifetime: {
                        min: config.duration * 1.2,
                        max: config.duration * 1.5
                    },
                    colors: config.colors,
                    trail: {
                        enabled: true,
                        length: 3,
                        decay: 0.92
                    },
                    glow: true,
                    sparkle: true,
                    orbit: {
                        enabled: true,
                        radius: cellSize * 1.2,
                        speed: 0.05
                    }
                },
                cellSize
            ));
        }
    }

    updateActiveEffect(type, position) {
        const now = this.p5.millis();
        const config = effectsConfig.particles.activeEffects[type];
        const lastTime = this.lastEffectTime.get(type) || 0;
        
        // Check if it's time to emit new particles
        if (now - lastTime >= config.emitInterval) {
            const center = this.grid.getCellCenter(position);
            const cellSize = this.grid.getCellSize();
            
            // Create new particles
            for (let i = 0; i < config.particleCount; i++) {
                const spreadRad = (config.spreadAngle * Math.PI / 180);
                const baseAngle = -Math.PI/2; // Upward direction
                const angle = baseAngle - (spreadRad/2) + (Math.random() * spreadRad);
                
                this.particles.push(new Particle(
                    this.p5,
                    center.x,
                    center.y,
                    {
                        type: 'active',
                        initialAngle: angle,
                        speed: config.baseSpeed * (1 + Math.random() * config.speedVariation),
                        size: {
                            min: config.sizeRange[0] / cellSize,
                            max: config.sizeRange[1] / cellSize
                        },
                        lifetime: {
                            min: config.emitInterval * 2,
                            max: config.emitInterval * 3
                        },
                        colors: config.colors,
                        trail: {
                            enabled: config.trail.enabled,
                            length: config.trail.length,
                            decay: config.trail.decay
                        },
                        glow: true,
                        sparkle: config.sparkle,
                        rainbow: false
                    },
                    cellSize
                ));
            }
            
            this.lastEffectTime.set(type, now);
        }
    }

    update() {
        // Update and draw all particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            const age = this.p5.millis() - particle.birth;
            return age < particle.lifetime;
        });
    }

    draw() {
        // Draw all particles
        for (const particle of this.particles) {
            particle.draw();
        }
    }
}
