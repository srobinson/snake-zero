// src/core/ParticleEffectFactory.ts

import type p5 from 'p5';
import { ParticlePool } from './ParticlePool';
import type { Particle } from '../entities/Particle';
import type { Position, FoodType } from '../config/types';
import { effectsConfig } from '../config/effectsConfig';

/**
 * Factory class for creating particle effects in the game.
 * Generates effects for food collection and power-up pickup using a ParticlePool.
 * Ensures colors from effectsConfig are applied to particles for visual variety.
 */
export class ParticleEffectFactory {
	private p5: p5; // p5.js instance for rendering
	private pool: ParticlePool; // Pool for reusing particles

	/**
	 * Initializes the factory with a p5 instance and a particle pool.
	 * @param p5Instance - p5.js instance for particle creation
	 */
	constructor(p5Instance: p5) {
		this.p5 = p5Instance;
		this.pool = new ParticlePool(p5Instance, 50); // 50 particles per type
	}

	/**
	 * Creates a particle effect for food collection at a specified position.
	 * Combines score text and burst/orbit particles with type-specific colors.
	 * @param position - Grid position where food was collected
	 * @param cellSize - Size of each grid cell for scaling
	 * @param foodType - Type of food ('regular', 'bonus', 'golden')
	 * @param score - Base score value
	 * @param multiplier - Points multiplier
	 * @returns Array of Particle instances for the effect
	 */
	public createFoodEffect(
		position: Position,
		cellSize: number,
		foodType: FoodType,
		score: number,
		multiplier: number
	): Particle[] {
		const particles: Particle[] = [];
		const centerX = position.x * cellSize + cellSize / 2; // Center X in pixels
		const centerY = position.y * cellSize + cellSize / 2; // Center Y in pixels
		const finalScore = score * multiplier; // Total score
		const config = effectsConfig.particles.food[foodType]; // Config for this food type
		const baseScale = Math.max(0.3, Math.min(1, cellSize / 40)); // Scale factor

		// Score particle with configurable color
		const scoreConfig = {
			text: finalScore.toString(),
			font: 'Bangers',
			fontSize: cellSize * (foodType === 'golden' ? 3 : 2),
			color: config.colors[0] || '#ffffff', // Use first color from config, default white
			speed: 3,
		};
		const scoreParticle = this.pool.get(cellSize, 'score', scoreConfig);
		scoreParticle.initialize(centerX, centerY, 1500);
		particles.push(scoreParticle);

		const particleCount = Math.min(40, config.count + Math.floor(finalScore / 5)); // Cap particle count

		if (foodType === 'regular') {
			for (let i = 0; i < particleCount; i++) {
				const angle = (i / particleCount) * Math.PI * 2; // Circular distribution
				const speed = config.speed * (0.8 + Math.random() * 0.4); // Random speed variation
				const burstConfig = {
					angle,
					speed,
					size:
						cellSize *
						(config.size.min + Math.random() * (config.size.max - config.size.min)) *
						baseScale,
					color:
						config.colors[Math.floor(Math.random() * config.colors.length)] ||
						'#ffffff', // Random config color
					trail: config.trail,
					glow: true,
					gravity: 0,
				};
				const burstParticle = this.pool.get(cellSize, 'burst', burstConfig);
				burstParticle.initialize(centerX, centerY, config.lifetime.max);
				particles.push(burstParticle);
			}
		} else if (foodType === 'bonus') {
			const ringCount = Math.floor(particleCount / 3); // Orbiting particles
			for (let i = 0; i < ringCount; i++) {
				const angle = (i / ringCount) * Math.PI * 2;
				const orbitConfig = {
					centerX,
					centerY,
					radius: cellSize * (1 + i * 0.2),
					speed: 0.1,
					initialAngle: angle,
					size:
						cellSize *
						(config.size.min + Math.random() * (config.size.max - config.size.min)) *
						baseScale,
					color:
						config.colors[Math.floor(Math.random() * config.colors.length)] ||
						'#ffffff', // Random config color
					trail: config.trail,
					glow: true,
				};
				const orbitParticle = this.pool.get(cellSize, 'orbit', orbitConfig);
				orbitParticle.initialize(centerX, centerY, config.lifetime.max * 1.2);
				particles.push(orbitParticle);
			}
			for (let i = 0; i < particleCount - ringCount; i++) {
				const angle = (i / (particleCount - ringCount)) * Math.PI * 2;
				const speed = config.speed * (1 + Math.random() * 0.5);
				const burstConfig = {
					angle,
					speed,
					size:
						cellSize *
						(config.size.min + Math.random() * (config.size.max - config.size.min)) *
						baseScale,
					color:
						config.colors[Math.floor(Math.random() * config.colors.length)] ||
						'#ffffff', // Random config color
					trail: config.trail,
					glow: true,
					gravity: 0,
				};
				const burstParticle = this.pool.get(cellSize, 'burst', burstConfig);
				burstParticle.initialize(centerX, centerY, config.lifetime.max);
				particles.push(burstParticle);
			}
		} else if (foodType === 'golden') {
			for (let i = 0; i < particleCount; i++) {
				const angle = (i / particleCount) * Math.PI * 2;
				const speed = config.speed * (1 + Math.random() * 0.6);
				const burstConfig = {
					angle,
					speed,
					size:
						cellSize *
						(config.size.min + Math.random() * (config.size.max - config.size.min)) *
						baseScale,
					color:
						config.colors[Math.floor(Math.random() * config.colors.length)] ||
						'#ffffff', // Random config color
					trail: config.trail,
					glow: true,
					gravity: 0,
				};
				const burstParticle = this.pool.get(cellSize, 'burst', burstConfig);
				burstParticle.initialize(centerX, centerY, config.lifetime.max);
				particles.push(burstParticle);
			}
			const orbitCount = 6;
			for (let i = 0; i < orbitCount; i++) {
				const angle = (i / orbitCount) * Math.PI * 2;
				const orbitConfig = {
					centerX,
					centerY,
					radius: cellSize * 1.5,
					speed: 0.08,
					initialAngle: angle,
					size:
						cellSize *
						(config.size.min * 0.8 +
							Math.random() * (config.size.max * 0.8 - config.size.min * 0.8)) *
						baseScale,
					color:
						config.colors[Math.floor(Math.random() * config.colors.length)] ||
						'#ffffff', // Random config color
					trail: config.trail,
					glow: true,
				};
				const orbitParticle = this.pool.get(cellSize, 'orbit', orbitConfig);
				orbitParticle.initialize(centerX, centerY, config.lifetime.max * 1.5);
				particles.push(orbitParticle);
			}
		}

		return particles;
	}

	/**
	 * Creates a particle effect for power-up collection at a specified position.
	 * Uses burst and orbit particles with colors from the power-up config.
	 * @param position - Grid position where power-up was collected
	 * @param cellSize - Size of each grid cell for scaling
	 * @param powerUpType - Type of power-up ('speed', 'ghost', 'points', 'slow')
	 * @returns Array of Particle instances for the effect
	 */
	public createPowerUpEffect(
		position: Position,
		cellSize: number,
		powerUpType: string
	): Particle[] {
		const particles: Particle[] = [];
		const centerX = position.x * cellSize + cellSize / 2;
		const centerY = position.y * cellSize + cellSize / 2;
		const config = effectsConfig.particles.powerUps[powerUpType];
		const baseScale = Math.max(0.3, Math.min(1, cellSize / 40));

		// Burst particles for power-up effect
		for (let i = 0; i < config.particleCount; i++) {
			const angle = (i / config.particleCount) * Math.PI * 2;
			const speed = config.baseSpeed * (1 + Math.random() * config.speedVariation);
			const burstConfig = {
				angle,
				speed,
				size:
					(cellSize *
						(config.sizeRange[0] +
							Math.random() * (config.sizeRange[1] - config.sizeRange[0])) *
						baseScale) /
					cellSize,
				color: config.colors[Math.floor(Math.random() * config.colors.length)] || '#ffffff', // Random config color
				trail: { enabled: true },
				glow: true,
				gravity: 0,
			};
			const burstParticle = this.pool.get(cellSize, 'burst', burstConfig);
			burstParticle.initialize(centerX, centerY, config.duration || 1500);
			particles.push(burstParticle);
		}

		// Orbiting particles for added flair
		const orbitCount = 8;
		for (let i = 0; i < orbitCount; i++) {
			const angle = (i / orbitCount) * Math.PI * 2;
			const orbitConfig = {
				centerX,
				centerY,
				radius: cellSize * 1.2,
				speed: 0.05,
				initialAngle: angle,
				size:
					(cellSize *
						(config.sizeRange[0] * 0.8 +
							Math.random() *
								(config.sizeRange[1] * 0.8 - config.sizeRange[0] * 0.8)) *
						baseScale) /
					cellSize,
				color: config.colors[Math.floor(Math.random() * config.colors.length)] || '#ffffff', // Random config color
				trail: { enabled: true },
				glow: true,
			};
			const orbitParticle = this.pool.get(cellSize, 'orbit', orbitConfig);
			orbitParticle.initialize(centerX, centerY, (config.duration || 1500) * 1.5);
			particles.push(orbitParticle);
		}

		return particles;
	}
}
