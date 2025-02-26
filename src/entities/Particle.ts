// Particle.ts
import type p5 from 'p5';

/**
 * Base class for all particles, managing core lifecycle and pooling.
 * Subclasses define specific motion and rendering behaviors.
 */
export abstract class Particle {
	protected p5: p5; // p5 instance for rendering and timing
	public x: number; // Current x-coordinate
	public y: number; // Current y-coordinate
	public cellSize: number; // Grid cell size for scaling
	private birth: number; // Timestamp of particle creation
	private lifetime: number; // Duration in milliseconds
	private active: boolean; // Tracks if particle is active

	/**
	 * Creates a base particle instance.
	 * @param p5 - p5 instance for rendering
	 * @param cellSize - Grid cell size for scaling
	 */
	constructor(p5: p5, cellSize: number) {
		this.p5 = p5;
		this.x = 0;
		this.y = 0;
		this.cellSize = cellSize;
		this.birth = p5.millis() || 0;
		this.lifetime = 0;
		this.active = false;
	}

	/**
	 * Resets the particle for reuse in the pool.
	 */
	reset(): void {
		this.x = 0;
		this.y = 0;
		this.lifetime = 0;
		this.active = false;
	}

	/**
	 * Initializes the particle with position and lifetime.
	 * @param x - Initial x-coordinate
	 * @param y - Initial y-coordinate
	 * @param lifetime - Duration in milliseconds
	 */
	initialize(x: number, y: number, lifetime: number): void {
		this.x = x;
		this.y = y;
		this.birth = this.p5.millis();
		this.lifetime = lifetime;
		this.active = true;
	}

	/**
	 * Updates the particle's state.
	 * @returns Whether the particle is still alive
	 */
	update(): boolean {
		if (!this.active) return false;
		return this.p5.millis() - this.birth < this.lifetime;
	}

	/**
	 * Renders the particle—must be implemented by subclasses.
	 */
	abstract render(): void;
}
