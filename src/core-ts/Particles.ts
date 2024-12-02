import p5 from 'p5';
import { effectsConfig } from '../config-ts/effectsConfig';
import type { Position, ParticleConfig, ParticleEffectsConfig, ParticleSize, ParticleLifetime, ParticleTrail, ParticleOrbit } from '../types-ts/particle';
import type { Grid } from './Grid';
import type { Game } from '../types-ts/gameTypes';

function hex(n: number): string {
    const h = Math.floor(n).toString(16);
    return h.length === 1 ? '0' + h : h;
}

class Particle {
    private p5: p5;
    private x: number;
    private y: number;
    private cellSize: number;
    private birth: number;
    private type: string;
    private vx: number;
    private vy: number;
    private speed: number;
    private size: number;
    private lifetime: number;
    private color: string;
    private trail: boolean;
    private glow: boolean;
    private sparkle: boolean;
    private pulse: boolean;
    private spiral: boolean;
    private orbit: boolean;
    private isRainbow: boolean;
    private trailPoints: Position[];
    private trailLength: number;
    private trailDecay: number;
    private sparkleTime: number;
    private pulsePhase: number;
    private spiralAngle: number;
    private rotationSpeed: number;
    private gravity: number;
    private score?: number;
    private text?: string;
    private font?: string;
    private fontSize?: number;
    private scale?: number;
    private targetScale?: number;
    private rotation?: number;
    private orbitCenter?: Position;
    private orbitRadius?: number;
    private orbitSpeed?: number;
    private orbitAngle?: number;

    constructor(p5: p5, x: number, y: number, config: ParticleConfig, cellSize: number) {
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
            this.fontSize = config.fontSize ? config.fontSize * baseScale : undefined;
            this.scale = 0;
            this.targetScale = 1.3 * baseScale;
            this.rotation = p5.random(-0.2, 0.2);
            this.vy = -(config.speed ?? 0) * baseScale;
        }
        
        // Initialize movement
        const angle = config.initialAngle !== undefined ? 
            config.initialAngle : 
            Math.random() * Math.PI * 2;
            
        this.speed = (config.speed ?? 0) * baseScale;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = this.type === 'score' ? this.vy : Math.sin(angle) * this.speed;
        
        // Visual properties
        const sizeConfig = config.size as ParticleSize;
        this.size = cellSize * (sizeConfig.min + Math.random() * (sizeConfig.max - sizeConfig.min)) * baseScale;
        const lifetimeConfig = config.lifetime as ParticleLifetime;
        this.lifetime = lifetimeConfig.min + Math.random() * (lifetimeConfig.max - lifetimeConfig.min);
        
        // Ensure color is a valid hex color with alpha
        const color = config.colors[Math.floor(Math.random() * config.colors.length)];
        this.color = color.startsWith('#') ? color : '#ffffff';
        
        // Effect flags
        const trailConfig = config.trail as ParticleTrail;
        this.trail = trailConfig?.enabled || false;
        this.glow = config.glow || false;
        this.sparkle = config.sparkle || false;
        this.pulse = config.pulse || false;
        this.spiral = config.spiral || false;
        const orbitConfig = config.orbit as ParticleOrbit;
        this.orbit = orbitConfig?.enabled || false;
        this.isRainbow = config.rainbow || false;
        
        // Effect properties
        this.trailPoints = [];
        this.trailLength = trailConfig?.length || 3;
        this.trailDecay = trailConfig?.decay || 0.95;
        this.sparkleTime = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.spiralAngle = 0;
        this.rotationSpeed = config.rotationSpeed || (Math.random() * 0.1 + 0.05) * (Math.random() < 0.5 ? 1 : -1);
        
        // Orbital properties
        if (this.orbit && orbitConfig) {
            this.orbitCenter = { x, y };
            this.orbitRadius = orbitConfig.radius;
            this.orbitSpeed = orbitConfig.speed;
            this.orbitAngle = angle;
        }
        
        // Apply gravity if specified
        this.gravity = config.gravity || 0;
    }

    update(): boolean {
        const p5 = this.p5;
        const age = p5.millis() - this.birth;
        const cellScale = this.cellSize / 40;

        if (this.type === 'score' && this.scale !== undefined && this.targetScale !== undefined) {
            // Update score text animation
            this.scale = Math.min(this.targetScale, this.scale + 0.2);
            this.y += this.vy;
            this.vy *= 0.95;
        } else if (this.orbit && this.orbitCenter && this.orbitAngle !== undefined && 
                  this.orbitRadius !== undefined && this.orbitSpeed !== undefined) {
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

    draw(): void {
        const p5 = this.p5;
        const age = p5.millis() - this.birth;
        const lifePercent = age / this.lifetime;
        const alpha = Math.max(0, Math.min(255, 255 * (1 - lifePercent)));
        const cellScale = this.cellSize / 40;
        
        p5.push();
        
        // Draw trail
        if (this.trail && this.trailPoints.length > 1) {
            let trailAlpha = alpha;
            for (let i = 0; i < this.trailPoints.length - 1; i++) {
                const point = this.trailPoints[i];
                const nextPoint = this.trailPoints[i + 1];
                
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
            if (this.fontSize) p5.textSize(this.fontSize);
            if (this.font) p5.textFont(this.font);
            p5.text(this.text || '', this.x, this.y);
        } else {
            p5.circle(this.x, this.y, this.size);
        }
        
        p5.pop();
    }
}

export class Particles {
    private p5: p5;
    private grid: Grid;
    private game: Game

    private particles: Particle[] = [];
    private activeEffects = new Map<string, Position>();
    private lastEffectTime = new Map<string, number>();

    constructor(p5: p5, grid: Grid, game: Game) {
        this.p5 = p5;
        this.grid = grid;
        this.game = game;
    }

    createFoodEffect(position: Position, color: string, score = 10, multiplier = 1): void {
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
                colors: [color],
                glow: true,
                pulse: true,
                score: finalScore,
                text: finalScore.toString(),
                font: 'Bangers',
                fontSize: this.grid.cellSize * (finalScore >= 100 ? 2.5 : 2.0),
                rainbow: finalScore >= 500,
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

    createPowerUpEffect(position: Position, type: string): void {
        const center = this.grid.getCellCenter(position);
        const config = effectsConfig.particles.powerUps[type];
        const cellSize = this.grid.cellSize;
        
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

        // Store active effect for continuous particles
        this.activeEffects.set(type, position);
        this.lastEffectTime.set(type, this.p5.millis());
    }

    updateActiveEffect(type: string, position: Position): void {
        const now = this.p5.millis();
        const config = effectsConfig.particles.activeEffects[type];
        const lastTime = this.lastEffectTime.get(type) || 0;
        
        // Check if it's time to emit new particles
        if (now - lastTime >= config.emitInterval) {
            const center = this.grid.getCellCenter(position);
            const cellSize = this.grid.cellSize;
            
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

    update(): void {
        // Update existing particles
        this.particles = this.particles.filter(particle => {
            const age = this.p5.millis() - particle.birth;
            return age < particle.lifetime && particle.update();
        });
        
        // Update active effects
        for (const [type, position] of this.activeEffects.entries()) {
            this.updateActiveEffect(type, position);
        }
    }

    draw(): void {
        for (const particle of this.particles) {
            particle.draw();
        }
    }
}
