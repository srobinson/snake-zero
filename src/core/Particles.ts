import p5 from 'p5';
import { Grid } from '../entities/types';
import type { SnakeGame } from '../types';
import { effectsConfig } from '../config/effectsConfig';
import { Particle } from '../entities/Particle';
import {
	EffectConfig,
	ScoreParticleConfig,
	PowerUpParticleConfig,
	ActiveEffectParticleConfig,
	Position,
} from '../config/types.consolidated';
import { validateParticleConfig } from '../config/utils.tmp';

class Particles {
	private p5: p5;
	private grid: Grid;
	private game: SnakeGame;
	private particles: Particle[];
	private activeEffects: Map<string, EffectConfig>;
	private lastEffectTime: Map<string, number>;

	constructor(p5: p5, grid: Grid, game: SnakeGame) {
		this.p5 = p5;
		this.grid = grid;
		this.game = game;
		this.particles = [];
		this.activeEffects = new Map();
		this.lastEffectTime = new Map();
	}

	/**
	 * Creates a particle effect when food is collected
	 * @param position - Grid position where the food was collected
	 * @param color - Color of the food that was collected
	 * @param score - Base score value of the food (before multipliers)
	 * @param multiplier - Current points multiplier from active effects
	 */
	createFoodEffect(position: Position, color: string, score = 10, multiplier = 1): void {
		const center = this.grid.getCellCenter(position);
		const finalScore = score * multiplier;
		const config = effectsConfig.particles.food;

		// Create dynamic score text effect
		const scoreParticleConfig: ScoreParticleConfig = {
			type: 'score',
			speed: 3,
			size: {
				min: 0.8,
				max: 1.2,
			},
			lifetime: config.lifetime || {
				min: 1200,
				max: 1500,
			},
			colors: config.colors || ['#ffffff'],
			trail: {
				enabled: false,
			},
			glow: true,
			sparkle: false,
			pulse: true,
			score: finalScore,
			text: finalScore.toString(),
			font: 'Bangers',
			fontSize: this.grid.getCellSize() * (finalScore >= 100 ? 2.5 : 2.0),
		};

		// Validate configuration before creating particle
		if (validateParticleConfig(scoreParticleConfig)) {
			const scoreParticle = new Particle(
				this.p5,
				center.x,
				center.y,
				scoreParticleConfig,
				this.grid.getCellSize()
			);
			this.particles.push(scoreParticle);
		}

		// Create burst particles
		const particleCount = Math.min(25, config.count + Math.floor(Math.log10(finalScore) * 3));

		for (let i = 0; i < particleCount; i++) {
			const angle = (i / particleCount) * Math.PI * 2;
			const speed = config.speed * (0.8 + Math.random() * 0.4);

			const burstParticleConfig: PowerUpParticleConfig = {
				type: 'powerup',
				initialAngle: angle,
				speed: speed * (1 + Math.log10(finalScore) * 0.2),
				size: {
					min: config.size.min * (1 + Math.log10(finalScore) * 0.1),
					max: config.size.max * (1 + Math.log10(finalScore) * 0.1),
				},
				lifetime: config.lifetime || {
					min: 1000,
					max: 1500,
				},
				colors: config.colors || ['#ffffff'],
				trail: {
					enabled: true,
				},
				glow: true,
				sparkle: true,
				pulse: true,
			};

			// Validate configuration before creating particle
			if (validateParticleConfig(burstParticleConfig)) {
				this.particles.push(
					new Particle(
						this.p5,
						center.x,
						center.y,
						burstParticleConfig,
						this.grid.getCellSize()
					)
				);
			}
		}
	}

	/**
	 * Creates a power-up collection effect
	 * @param position - Grid position of the power-up
	 * @param type - Type of power-up
	 */
	createPowerUpEffect(position: Position, type: string): void {
		const center = this.grid.getCellCenter(position);
		const config = effectsConfig.particles.powerUps[type];
		const cellSize = this.grid.getCellSize();

		// Create burst particles
		for (let i = 0; i < config.particleCount; i++) {
			const angle = (i / config.particleCount) * Math.PI * 2;

			const powerUpParticleConfig: PowerUpParticleConfig = {
				type: 'powerup',
				initialAngle: angle,
				speed: config.baseSpeed * (1 + Math.random() * config.speedVariation),
				size: {
					min: config.sizeRange[0] / cellSize,
					max: config.sizeRange[1] / cellSize,
				},
				lifetime: config.duration
					? {
							min: config.duration * 0.8,
							max: config.duration,
						}
					: {
							min: 1000,
							max: 1500,
						},
				colors: config.colors || ['#ffffff'],
				trail: {
					enabled: true,
				},
				glow: true,
				sparkle: true,
				pulse: false,
			};

			// Validate configuration before creating particle
			if (validateParticleConfig(powerUpParticleConfig)) {
				this.particles.push(
					new Particle(this.p5, center.x, center.y, powerUpParticleConfig, cellSize)
				);
			}
		}

		// Add orbital particles
		const orbitCount = 8;

		for (let i = 0; i < orbitCount; i++) {
			const angle = (i / orbitCount) * Math.PI * 2;

			const orbitParticleConfig: PowerUpParticleConfig = {
				type: 'orbit',
				initialAngle: angle,
				speed: config.baseSpeed * 0.5,
				size: {
					min: (config.sizeRange[0] * 0.8) / cellSize,
					max: (config.sizeRange[1] * 0.8) / cellSize,
				},
				lifetime: config.duration
					? {
							min: config.duration * 1.2,
							max: config.duration * 1.5,
						}
					: {
							min: 1000,
							max: 1500,
						},
				colors: config.colors || ['#ffffff'],
				trail: {
					enabled: true,
				},
				glow: true,
				sparkle: true,
				pulse: false,
				orbit: {
					enabled: true,
					radius: cellSize * 1.2,
					speed: 0.05,
				},
			};

			// Validate configuration before creating particle
			if (validateParticleConfig(orbitParticleConfig)) {
				this.particles.push(
					new Particle(this.p5, center.x, center.y, orbitParticleConfig, cellSize)
				);
			}
		}
	}

	/**
	 * Updates and manages active particle effects
	 * @param type - Type of active effect
	 * @param position - Grid position of the effect
	 */
	updateActiveEffect(type: string, position: Position): void {
		const now = this.p5.millis();
		const activeEffects = effectsConfig.particles.activeEffects || {};
		const config = activeEffects[type] || {
			emitInterval: 500,
			particleCount: 10,
			baseSpeed: 2,
			speedVariation: 0.5,
			sizeRange: [5, 10],
			spreadAngle: 45,
			colors: ['#ffffff'],
			trail: {
				enabled: true,
			},
			sparkle: true,
		};
		const lastTime = this.lastEffectTime.get(type) || 0;

		// Check if it's time to emit new particles
		if (now - lastTime >= (config.emitInterval || 500)) {
			const center = this.grid.getCellCenter(position);
			const cellSize = this.grid.getCellSize();

			// Create new particles
			for (let i = 0; i < (config.particleCount || 10); i++) {
				const spreadRad = ((config.spreadAngle || 45) * Math.PI) / 180;
				const baseAngle = -Math.PI / 2; // Upward direction
				const angle = baseAngle - spreadRad / 2 + Math.random() * spreadRad;

				const activeEffectParticleConfig: ActiveEffectParticleConfig = {
					type: 'active',
					initialAngle: angle,
					speed:
						(config.baseSpeed || 2) *
						(1 + Math.random() * (config.speedVariation || 0.5)),
					size: {
						min: (config.sizeRange?.[0] || 5) / cellSize,
						max: (config.sizeRange?.[1] || 10) / cellSize,
					},
					lifetime: {
						min: (config.emitInterval || 500) * 2,
						max: (config.emitInterval || 500) * 3,
					},
					colors: config.colors || ['#ffffff'],
					trail: {
						enabled: true,
					},
					glow: true,
					sparkle: true,
					pulse: false,
				};

				// Validate configuration before creating particle
				if (validateParticleConfig(activeEffectParticleConfig)) {
					this.particles.push(
						new Particle(
							this.p5,
							center.x,
							center.y,
							activeEffectParticleConfig,
							cellSize
						)
					);
				}
			}

			this.lastEffectTime.set(type, now);
		}
	}

	/**
	 * Updates all particles in the system
	 */
	update(): void {
		// Update and draw all particles
		this.particles = this.particles.filter(particle => {
			return particle.update();
		});
	}

	/**
	 * Draws all particles in the system
	 */
	draw(): void {
		// Draw all particles
		for (const particle of this.particles) {
			particle.draw();
		}
	}
}

export { Particle, Particles };
