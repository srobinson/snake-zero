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

/**
 * Manages a system of particles for visual effects in the game.
 * Handles creation, updating, and rendering of particles for:
 * - Food collection effects
 * - Power-up collection effects
 * - Active effect visualizations
 * Uses a particle pool to optimize performance by reusing particles.
 */
class Particles {
	private p5: p5; // p5 instance for rendering and timing
	private grid: Grid; // Game grid for positioning
	private game: SnakeGame; // Game instance for context
	private particles: Particle[]; // Active particles in the system
	private activeEffects: Map<string, EffectConfig>; // Currently active effects
	private lastEffectTime: Map<string, number>; // Last emission time for active effects
	private particlePool: ParticlePool; // Pool for reusing particles

	/**
	 * Initializes the particle system.
	 * @param p5 - p5 instance for rendering
	 * @param grid - Game grid for coordinate conversion
	 * @param game - Game instance for accessing state
	 */
	constructor(p5: p5, grid: Grid, game: SnakeGame) {
		this.p5 = p5;
		this.grid = grid;
		this.game = game;
		this.particles = [];
		this.activeEffects = new Map();
		this.lastEffectTime = new Map();
		this.particlePool = new ParticlePool(p5, grid, game, 50); // Initial pool size of 50
	}

	/**
	 * Creates a particle effect when food is collected.
	 * @param position - Grid position where food was collected
	 * @param color - Color of the food (unused in current config-based setup)
	 * @param score - Base score value of the food
	 * @param multiplier - Current points multiplier
	 * @param foodType - Type of food collected (regular, bonus, golden)
	 */
	createFoodEffect(
		position: Position,
		color: string,
		score = 10,
		multiplier = 1,
		foodType: FoodType = 'regular'
	): void {
		const center = this.grid.getCellCenter(position); // Convert grid to pixel coordinates
		const finalScore = score * multiplier; // Calculate total points
		const config = effectsConfig.particles.food[foodType]; // Get effect config for food type
		const cellSize = this.grid.getCellSize();

		// Create score text particle
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
			fontSize: cellSize * (foodType === 'golden' ? 3 : 2), // Larger for golden food
		};
		if (validateParticleConfig(scoreParticleConfig)) {
			const scoreParticle = this.particlePool.get(cellSize);
			scoreParticle.initialize(scoreParticleConfig);
			scoreParticle.x = center.x;
			scoreParticle.y = center.y;
			this.particles.push(scoreParticle);
		}

		// Calculate particle count based on score
		const particleCount = Math.min(40, config.count + Math.floor(finalScore / 5));

		// Regular food: Quick sparkle burst
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
		}
		// Bonus food: Swirling rings + burst
		else if (foodType === 'bonus') {
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
					particle.initialize(orbitConfig, center.x, center.y);
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
		}
		// Golden food: Explosive starburst + orbiting sparkles
		else if (foodType === 'golden') {
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
					particle.initialize(orbitConfig, center.x, center.y);
					particle.x = center.x;
					particle.y = center.y;
					this.particles.push(particle);
				}
			}
		}
	}

	/**
	 * Creates a power-up collection effect.
	 * @param position - Grid position of the power-up
	 * @param type - Type of power-up collected
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

		// Add orbiting particles
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
				particle.initialize(orbitParticleConfig, center.x, center.y);
				particle.x = center.x;
				particle.y = center.y;
				this.particles.push(particle);
			}
		}
	}

	/**
	 * Updates and manages active particle effects (e.g., ongoing power-up visuals).
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
			trail: { enabled: true },
			sparkle: true,
		};
		const lastTime = this.lastEffectTime.get(type) || 0;

		// Emit new particles at intervals
		if (now - lastTime >= (config.emitInterval || 500)) {
			const center = this.grid.getCellCenter(position);
			const cellSize = this.grid.getCellSize();

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

			this.lastEffectTime.set(type, now); // Update last emission time
		}
	}

	/**
	 * Updates all particles in the system, removing expired ones.
	 */
	update(): void {
		this.particles = this.particles.filter(particle => {
			const alive = particle.update();
			if (!alive) {
				this.particlePool.recycle(particle); // Return expired particles to pool
			}
			return alive;
		});
	}

	/**
	 * Draws all active particles in the system.
	 */
	draw(): void {
		for (const particle of this.particles) {
			particle.draw();
		}
	}
}

/**
 * Manages a pool of reusable Particle instances to optimize performance.
 * Reduces object creation/destruction overhead.
 */
class ParticlePool {
	private p5: p5; // p5 instance for particle creation
	private grid: Grid; // Grid for context (unused currently)
	private game: SnakeGame; // Game instance for context (unused currently)
	private pool: Particle[]; // Array of reusable particles
	private initialSize: number; // Initial number of particles in pool

	/**
	 * Creates a particle pool with an initial size.
	 * @param p5 - p5 instance for particle creation
	 * @param grid - Game grid (for future use)
	 * @param game - Game instance (for future use)
	 * @param initialSize - Number of particles to pre-allocate
	 */
	constructor(p5: p5, grid: Grid, game: SnakeGame, initialSize: number) {
		this.p5 = p5;
		this.grid = grid;
		this.game = game;
		this.initialSize = initialSize;
		this.pool = [];
		for (let i = 0; i < initialSize; i++) {
			this.pool.push(new Particle(this.p5)); // Pre-fill pool
		}
	}

	/**
	 * Retrieves a particle from the pool or creates a new one if empty.
	 * @param cellSize - Grid cell size to set on the particle
	 * @returns A ready-to-use Particle instance
	 */
	get(cellSize: number): Particle {
		if (this.pool.length === 0) {
			this.pool.push(new Particle(this.p5)); // Grow pool if depleted
		}
		const particle = this.pool.pop()!;
		particle.cellSize = cellSize; // Set cell size for scaling
		return particle;
	}

	/**
	 * Returns a particle to the pool after resetting it.
	 * @param particle - Particle to recycle
	 */
	recycle(particle: Particle): void {
		particle.reset();
		this.pool.push(particle);
	}
}

export { Particle, Particles };
