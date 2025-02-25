// ParticleBehaviors.ts
import type p5 from 'p5';
import type { Particle } from './Particle';

/**
 * Defines motion behavior for a particle.
 */
export interface IMotion {
	/**
	 * Updates the particle's position.
	 * @param particle - The particle to move
	 */
	update(particle: Particle): void;
}

/**
 * Defines rendering behavior for a particle.
 */
export interface IRender {
	/**
	 * Renders the particle with its visual effects.
	 * @param p5 - p5 instance for drawing
	 * @param particle - The particle to render
	 * @param age - Time elapsed since particle creation
	 */
	render(p5: p5, particle: Particle, age: number): void;
}
