// src/core/Particles.ts

import type p5 from 'p5';
import type { SnakeGame } from '../types';
import type { Position, FoodType } from '../config/types';
import { Particle } from '../entities/Particle';
import { ParticleEffectFactory } from './ParticleEffectFactory';

/**
 * Manages particle effects in the game, such as food collection and power-up pickup visuals.
 * Delegates particle creation to a factory and handles their lifecycle (update, render, recycle).
 */
export class Particles {
	/** p5.js instance for rendering and timing particle effects */
	private p5: p5;

	/** Game instance providing context (e.g., grid size) */
	private game: SnakeGame;

	/** Array of active particles currently being displayed */
	private particles: Particle[];

	/** Factory for creating specific particle effects */
	private factory: ParticleEffectFactory;

	/**
	 * Initializes the particle system with p5 and game context.
	 * @param p5Instance - p5.js instance for rendering
	 * @param gameInstance - Game instance implementing SnakeGame
	 */
	constructor(p5Instance: p5, gameInstance: SnakeGame) {
		this.p5 = p5Instance;
		this.game = gameInstance;
		this.particles = []; // Start with no active particles
		this.factory = new ParticleEffectFactory(p5Instance); // Factory for creating effects
	}

	/**
	 * Creates a particle effect for food collection at a specified position.
	 * Adds the resulting particles to the active list for rendering.
	 * @param position - Grid position where food was collected
	 * @param foodType - Type of food collected (e.g., 'regular', 'bonus', 'golden')
	 * @param score - Base score value of the food
	 * @param multiplier - Multiplier applied to the score
	 */
	public createFoodEffect(
		position: Position,
		foodType: FoodType,
		score: number,
		multiplier: number
	): void {
		const cellSize = this.game.getGrid().getCellSize(); // Get grid cell size for scaling
		const newParticles = this.factory.createFoodEffect(
			position,
			cellSize,
			foodType,
			score,
			multiplier
		);
		this.particles.push(...newParticles); // Add new particles to active list
	}

	/**
	 * Creates a particle effect for power-up collection at a specified position.
	 * Adds the resulting particles to the active list for rendering.
	 * @param position - Grid position where power-up was collected
	 * @param powerUpType - Type of power-up collected (e.g., 'speed', 'ghost')
	 */
	public createPowerUpEffect(position: Position, powerUpType: string): void {
		const cellSize = this.game.getGrid().getCellSize(); // Get grid cell size for scaling
		const newParticles = this.factory.createPowerUpEffect(position, cellSize, powerUpType);
		this.particles.push(...newParticles); // Add new particles to active list
	}

	/**
	 * Updates all active particles, removing expired ones and recycling them to the pool.
	 */
	public update(): void {
		this.particles = this.particles.filter(particle => {
			const alive = particle.update(); // Check if particle is still active
			if (!alive) this.factory['pool'].recycle(particle); // Recycle expired particles
			return alive; // Keep only active particles
		});
	}

	/**
	 * Renders all active particles on the canvas.
	 */
	public draw(): void {
		for (const particle of this.particles) {
			particle.render(); // Draw each particle
		}
	}
}
