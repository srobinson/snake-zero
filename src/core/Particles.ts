// Particles.ts
import type p5 from 'p5';
import type { SnakeGame } from '../types';
import type {
	ActiveEffectParticleConfig,
	EffectConfig,
	FoodType,
	Position,
	PowerUpParticleConfig,
	ScoreParticleConfig,
} from '../config/types';
import type { Grid } from '../entities/types';
import { Particle } from '../entities/Particle';
import { effectsConfig } from '../config/effectsConfig';
import { validateParticleConfig } from '../config/particleConfig';

class Particles {
	private p5: p5;
	private grid: Grid;
	private game: SnakeGame;
	private particles: Particle[];
	private activeEffects: Map<string, EffectConfig>;
	private lastEffectTime: Map<string, number>;
	private particlePool: ParticlePool;

	constructor(p5: p5, grid: Grid, game: SnakeGame) {
		this.p5 = p5;
		this.grid = grid;
		this.game = game;
		this.particles = [];
		this.activeEffects = new Map();
		this.lastEffectTime = new Map();
		this.particlePool = new ParticlePool(p5, grid, game, 50);
	}

	createFoodEffect(
		position: Position,
		color: string,
		score = 10,
		multiplier = 1,
		foodType: FoodType = 'regular'
	): void {
		const center = this.grid.getCellCenter(position);
		const finalScore = score * multiplier;
		const config = effectsConfig.particles.food[foodType];
		const cellSize = this.grid.getCellSize();

		const scoreParticleConfig: ScoreParticleConfig = {
			type: 'score',
			speed: 3,
			size: { min: 0.8, max: 1.2 },
			lifetime: { min: 1200, max: 1500 },
			colors: ['#ffffff'],
			trail: { enabled: false },
			glow: true,
			sparkle: false,
			pulse: true,
			score: finalScore,
			text: finalScore.toString(),
			font: 'Bangers',
			fontSize: cellSize * (foodType === 'golden' ? 3 : 2),
		};
		if (validateParticleConfig(scoreParticleConfig)) {
			const scoreParticle = this.particlePool.get(cellSize);
			scoreParticle.initialize(scoreParticleConfig);
			scoreParticle.x = center.x;
			scoreParticle.y = center.y;
			this.particles.push(scoreParticle);
		}

		const particleCount = Math.min(40, config.count + Math.floor(finalScore / 5));

		if (foodType === 'regular') {
			for (let i = 0; i < particleCount; i++) {
				const angle = (i / particleCount) * Math.PI * 2;
				const speed = config.speed * (0.8 + Math.random() * 0.4);
				const burstConfig: PowerUpParticleConfig = {
					type: 'powerup',
					initialAngle: angle,
					speed,
					size: config.size,
					lifetime: config.lifetime,
					colors: config.colors,
					trail: config.trail,
					glow: true,
					sparkle: true,
					pulse: false,
				};
				if (validateParticleConfig(burstConfig)) {
					const particle = this.particlePool.get(cellSize);
					particle.initialize(burstConfig);
					particle.x = center.x;
					particle.y = center.y;
					this.particles.push(particle);
				}
			}
		} else if (foodType === 'bonus') {
			const ringCount = Math.floor(particleCount / 3);
			for (let i = 0; i < ringCount; i++) {
				const angle = (i / ringCount) * Math.PI * 2;
				const orbitConfig: PowerUpParticleConfig = {
					type: 'orbit',
					initialAngle: angle,
					speed: config.speed * 0.5,
					size: config.size,
					lifetime: { min: config.lifetime.min * 1.2, max: config.lifetime.max * 1.2 },
					colors: config.colors,
					trail: config.trail,
					glow: true,
					sparkle: true,
					pulse: true,
					orbit: {
						enabled: true,
						radius: cellSize * (1 + i * 0.2),
						speed: 0.1,
					},
				};
				if (validateParticleConfig(orbitConfig)) {
					const particle = this.particlePool.get(cellSize);
					particle.initialize(orbitConfig, center.x, center.y); // FIX: Pass center for orbiting
					particle.x = center.x;
					particle.y = center.y;
					this.particles.push(particle);
				}
			}
			for (let i = 0; i < particleCount - ringCount; i++) {
				const angle = (i / (particleCount - ringCount)) * Math.PI * 2;
				const burstConfig: PowerUpParticleConfig = {
					type: 'powerup',
					initialAngle: angle,
					speed: config.speed * (1 + Math.random() * 0.5),
					size: config.size,
					lifetime: config.lifetime,
					colors: config.colors,
					trail: config.trail,
					glow: true,
					sparkle: true,
					pulse: true,
				};
				if (validateParticleConfig(burstConfig)) {
					const particle = this.particlePool.get(cellSize);
					particle.initialize(burstConfig);
					particle.x = center.x;
					particle.y = center.y;
					this.particles.push(particle);
				}
			}
		} else if (foodType === 'golden') {
			for (let i = 0; i < particleCount; i++) {
				const angle = (i / particleCount) * Math.PI * 2;
				const speed = config.speed * (1 + Math.random() * 0.6);
				const burstConfig: PowerUpParticleConfig = {
					type: 'powerup',
					initialAngle: angle,
					speed,
					size: config.size,
					lifetime: config.lifetime,
					colors: config.colors,
					trail: config.trail,
					glow: true,
					sparkle: true,
					pulse: true,
				};
				if (validateParticleConfig(burstConfig)) {
					const particle = this.particlePool.get(cellSize);
					particle.initialize(burstConfig);
					particle.x = center.x;
					particle.y = center.y;
					this.particles.push(particle);
				}
			}
			const orbitCount = 6;
			for (let i = 0; i < orbitCount; i++) {
				const angle = (i / orbitCount) * Math.PI * 2;
				const orbitConfig: PowerUpParticleConfig = {
					type: 'orbit',
					initialAngle: angle,
					speed: config.speed * 0.4,
					size: { min: config.size.min * 0.8, max: config.size.max * 0.8 },
					lifetime: { min: config.lifetime.min * 1.5, max: config.lifetime.max * 1.5 },
					colors: config.colors,
					trail: config.trail,
					glow: true,
					sparkle: true,
					pulse: true,
					orbit: { enabled: true, radius: cellSize * 1.5, speed: 0.08 },
				};
				if (validateParticleConfig(orbitConfig)) {
					const particle = this.particlePool.get(cellSize);
					particle.initialize(orbitConfig, center.x, center.y); // FIX: Pass center for orbiting
					particle.x = center.x;
					particle.y = center.y;
					this.particles.push(particle);
				}
			}
		}
	}

	createPowerUpEffect(position: Position, type: string): void {
		const center = this.grid.getCellCenter(position);
		const config = effectsConfig.particles.powerUps[type];
		const cellSize = this.grid.getCellSize();

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
					? { min: config.duration * 0.8, max: config.duration }
					: { min: 1000, max: 1500 },
				colors: config.colors || ['#ffffff'],
				trail: { enabled: true },
				glow: true,
				sparkle: true,
				pulse: false,
			};
			if (validateParticleConfig(powerUpParticleConfig)) {
				const particle = this.particlePool.get(cellSize);
				particle.initialize(powerUpParticleConfig);
				particle.x = center.x;
				particle.y = center.y;
				this.particles.push(particle);
			}
		}

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
					? { min: config.duration * 1.2, max: config.duration * 1.5 }
					: { min: 1000, max: 1500 },
				colors: config.colors || ['#ffffff'],
				trail: { enabled: true },
				glow: true,
				sparkle: true,
				pulse: false,
				orbit: { enabled: true, radius: cellSize * 1.2, speed: 0.05 },
			};
			if (validateParticleConfig(orbitParticleConfig)) {
				const particle = this.particlePool.get(cellSize);
				particle.initialize(orbitParticleConfig, center.x, center.y); // FIX: Pass center for orbiting
				particle.x = center.x;
				particle.y = center.y;
				this.particles.push(particle);
			}
		}
	}

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
			trail: { enabled: true },
			sparkle: true,
		};
		const lastTime = this.lastEffectTime.get(type) || 0;

		if (now - lastTime >= (config.emitInterval || 500)) {
			const center = this.grid.getCellCenter(position);
			const cellSize = this.grid.getCellSize();

			for (let i = 0; i < (config.particleCount || 10); i++) {
				const spreadRad = ((config.spreadAngle || 45) * Math.PI) / 180;
				const baseAngle = -Math.PI / 2;
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
					trail: { enabled: true },
					glow: true,
					sparkle: true,
					pulse: false,
				};

				if (validateParticleConfig(activeEffectParticleConfig)) {
					const particle = this.particlePool.get(cellSize);
					particle.initialize(activeEffectParticleConfig);
					particle.x = center.x;
					particle.y = center.y;
					this.particles.push(particle);
				}
			}

			this.lastEffectTime.set(type, now);
		}
	}

	update(): void {
		this.particles = this.particles.filter(particle => {
			const alive = particle.update();
			if (!alive) {
				this.particlePool.recycle(particle);
			}
			return alive;
		});
	}

	draw(): void {
		for (const particle of this.particles) {
			particle.draw();
		}
	}
}

class ParticlePool {
	private p5: p5;
	private grid: Grid;
	private game: SnakeGame;
	private pool: Particle[];
	private initialSize: number;

	constructor(p5: p5, grid: Grid, game: SnakeGame, initialSize: number) {
		this.p5 = p5;
		this.grid = grid;
		this.game = game;
		this.initialSize = initialSize;
		this.pool = [];
		for (let i = 0; i < initialSize; i++) {
			this.pool.push(new Particle(this.p5));
		}
	}

	get(cellSize: number): Particle {
		if (this.pool.length === 0) {
			this.pool.push(new Particle(this.p5));
		}
		const particle = this.pool.pop()!;
		particle.cellSize = cellSize;
		return particle;
	}

	recycle(particle: Particle): void {
		particle.reset();
		this.pool.push(particle);
	}
}

export { Particle, Particles };
