// src/core/ParticlePool.ts
import type p5 from 'p5';
import { Particle } from '../entities/Particle';
import { ScoreParticle } from '../entities/particles/ScoreParticle';
import { BurstParticle } from '../entities/particles/BurstParticle';
import { OrbitParticle } from '../entities/particles/OrbitParticle';

/**
 * Manages pools of reusable Particle instances by type for performance optimization.
 * Supports specific particle types (score, burst, orbit) with separate pools.
 */
export class ParticlePool {
	private p5: p5; // p5 instance for particle creation
	private pools: Map<string, Particle[]>; // Map of particle type to pool array

	/**
	 * Creates a particle pool with separate sub-pools for each type.
	 * @param p5 - p5 instance for particle creation
	 * @param initialSize - Initial number of particles per type (default: 50)
	 */
	constructor(p5: p5, initialSize: number = 50) {
		this.p5 = p5;
		this.pools = new Map<string, Particle[]>();

		// Initialize pools for each particle type
		this.pools.set('score', []);
		this.pools.set('burst', []);
		this.pools.set('orbit', []);

		// Pre-allocate particles for each type
		for (let i = 0; i < initialSize; i++) {
			this.pools.get('score')!.push(
				new ScoreParticle(this.p5, 1, {
					text: '',
					font: 'Arial',
					fontSize: 12,
					color: '#ffffff',
					speed: 3,
				})
			);
			this.pools.get('burst')!.push(
				new BurstParticle(this.p5, 1, {
					angle: 0,
					speed: 0,
					size: 0,
					color: '#ffffff',
				})
			);
			this.pools.get('orbit')!.push(
				new OrbitParticle(this.p5, 1, {
					centerX: 0,
					centerY: 0,
					radius: 0,
					speed: 0,
					initialAngle: 0,
					size: 0,
					color: '#ffffff',
				})
			);
		}
	}

	/**
	 * Retrieves a particle from the appropriate pool or creates a new one if empty.
	 * Updates the particle with the provided configuration.
	 * @param cellSize - Grid cell size to set on the particle
	 * @param type - Particle type to fetch ('score', 'burst', 'orbit')
	 * @param config - Configuration specific to the particle type
	 * @returns A configured Particle instance of the specified type
	 */
	get(cellSize: number, type: 'score', config: ScoreConfig): ScoreParticle;
	get(cellSize: number, type: 'burst', config: BurstConfig): BurstParticle;
	get(cellSize: number, type: 'orbit', config: OrbitConfig): OrbitParticle;
	get(
		cellSize: number,
		type: 'score' | 'burst' | 'orbit',
		config: ScoreConfig | BurstConfig | OrbitConfig
	): Particle {
		const pool = this.pools.get(type);
		if (!pool) throw new Error(`Unknown particle type: ${type}`);

		let particle: Particle;
		if (pool.length === 0) {
			// Create a new particle of the correct type if pool is empty
			switch (type) {
				case 'score':
					particle = new ScoreParticle(this.p5, cellSize, config as ScoreConfig);
					break;
				case 'burst':
					particle = new BurstParticle(this.p5, cellSize, config as BurstConfig);
					break;
				case 'orbit':
					particle = new OrbitParticle(this.p5, cellSize, config as OrbitConfig);
					break;
				default:
					throw new Error(`Unsupported particle type: ${type}`);
			}
			pool.push(particle);
		}

		particle = pool.pop()!;
		particle.cellSize = cellSize;

		// Reinitialize with new config using subclass-specific method
		switch (type) {
			case 'score':
				(particle as ScoreParticle).reinitialize(config as ScoreConfig);
				break;
			case 'burst':
				(particle as BurstParticle).reinitialize(config as BurstConfig);
				break;
			case 'orbit':
				(particle as OrbitParticle).reinitialize(config as OrbitConfig);
				break;
		}

		return particle;
	}

	/**
	 * Returns a particle to its type-specific pool after resetting it.
	 * @param particle - Particle to recycle
	 */
	recycle(particle: Particle): void {
		particle.reset();
		let type: string;
		if (particle instanceof ScoreParticle) type = 'score';
		else if (particle instanceof BurstParticle) type = 'burst';
		else if (particle instanceof OrbitParticle) type = 'orbit';
		else throw new Error('Unknown particle instance type');
		const pool = this.pools.get(type);
		if (pool) pool.push(particle);
	}
}

// Config interfaces (could move to a shared types file)
interface ScoreConfig {
	text: string;
	font: string;
	fontSize: number;
	color: string;
	speed: number;
}

interface BurstConfig {
	angle: number;
	speed: number;
	size: number;
	color: string;
	trail?: { enabled: boolean; length?: number; decay?: number };
	glow?: boolean;
	gravity?: number;
}

interface OrbitConfig {
	centerX: number;
	centerY: number;
	radius: number;
	speed: number;
	initialAngle: number;
	size: number;
	color: string;
	trail?: { enabled: boolean; length?: number; decay?: number };
	glow?: boolean;
}
