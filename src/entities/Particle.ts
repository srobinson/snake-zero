// Particle.ts
import type p5 from 'p5';
import type { ParticleConfigType, ParticleType } from '../config/types';
import type { TrailPoint } from '../core/types';

/**
 * Represents an individual particle with various visual and motion effects.
 * Supports different types (normal, score, powerup, orbit) with customizable behaviors:
 * - Normal: Basic particle with motion and fade
 * - Score: Text-based particle showing score values
 * - Powerup: Burst effect for power-up collection
 * - Orbit: Circular motion around a center point
 */
export class Particle {
	private p5: p5; // p5 instance for drawing and timing
	public x: number; // Current x-coordinate
	public y: number; // Current y-coordinate
	public cellSize: number; // Size of the grid cell for scaling
	private birth: number; // Timestamp of particle creation
	private type: ParticleType; // Type of particle (normal, score, powerup, orbit)
	private active: boolean; // Tracks if particle is active (for pooling)

	// Movement properties
	private vx: number = 0; // X-axis velocity
	private vy: number = 0; // Y-axis velocity
	private speed: number = 0; // Base speed magnitude
	private rotation: number = 0; // Rotation angle for visual effects

	// Visual properties
	private size: number = 0; // Current size of the particle
	private color: string = '#ffffff'; // Particle color with hex code
	private lifetime: number = 0; // Duration in milliseconds before particle expires
	private scale: number = 0; // Scaling factor for score particles
	private targetScale: number = 0; // Target scale for animation

	// Trail properties
	private trailPoints: Array<TrailPoint> = []; // Array of previous positions for trail effect
	private trailLength: number; // Maximum number of trail points
	private trailDecay: number; // Rate at which trail fades

	// Effect flags
	private trail: boolean; // Whether trail effect is enabled
	private glow: boolean; // Whether glow effect is enabled
	private sparkle: boolean; // Whether sparkle effect is enabled
	private pulse: boolean; // Whether pulse effect is enabled
	private spiral: boolean; // Whether spiral effect is enabled
	private orbit: boolean; // Whether orbit effect is enabled
	private isRainbow: boolean; // Whether rainbow color cycling is enabled

	// Sparkle and pulse properties
	private sparkleTime: number = 0; // Timer for sparkle animation
	private pulsePhase: number; // Phase offset for pulse effect
	private spiralAngle: number = 0; // Angle for spiral motion
	private rotationSpeed: number; // Speed of rotation for effects

	// Orbital properties
	private orbitCenter?: { x: number; y: number }; // Center point for orbiting particles
	private orbitRadius?: number; // Radius of orbit path
	private orbitSpeed?: number; // Speed of orbit rotation
	private orbitAngle?: number; // Current angle in orbit path

	// Gravity
	private gravity: number; // Gravity force applied to particle

	// Optional score-specific properties
	private score?: number; // Score value for text particles
	private text?: string; // Text to display for score particles
	private font?: string; // Font for score text
	private fontSize?: number; // Font size for score text

	/**
	 * Creates a new particle instance.
	 * @param p5 - p5 instance for rendering and timing
	 * @param x - Initial x-coordinate (default 0 for pooling)
	 * @param y - Initial y-coordinate (default 0 for pooling)
	 * @param config - Particle configuration (defaults to basic normal particle)
	 * @param cellSize - Grid cell size for scaling (default 1)
	 */
	constructor(
		p5: p5,
		x: number = 0,
		y: number = 0,
		config: ParticleConfigType = {
			type: 'normal',
			speed: 0,
			size: { min: 0, max: 0 },
			colors: ['#ffffff'],
		},
		cellSize: number = 1
	) {
		this.p5 = p5;
		this.x = x;
		this.y = y;
		this.cellSize = cellSize;
		this.birth = p5.millis();
		this.type = config.type || 'normal';
		this.active = false; // Inactive until initialized (for pooling)

		// Initialize properties that persist across resets
		this.trailPoints = [];
		this.trailLength = 0;
		this.trailDecay = 0;
		this.trail = false;
		this.glow = false;
		this.sparkle = false;
		this.pulse = false;
		this.spiral = false;
		this.orbit = false;
		this.isRainbow = false;
		this.sparkleTime = 0;
		this.pulsePhase = 0;
		this.spiralAngle = 0;
		this.rotationSpeed = 0;
		this.gravity = 0;

		this.initialize(config); // Set initial state
	}

	/**
	 * Resets the particle to a neutral state for reuse in the pool.
	 * Called when particle expires and is returned to the pool.
	 */
	public reset(): void {
		this.x = 0;
		this.y = 0;
		this.vx = 0;
		this.vy = 0;
		this.speed = 0;
		this.rotation = 0;
		this.size = 0;
		this.color = '#ffffff';
		this.lifetime = 0;
		this.scale = 0;
		this.targetScale = 0;
		this.trailPoints = [];
		this.trailLength = 0;
		this.trailDecay = 0;
		this.trail = false;
		this.glow = false;
		this.sparkle = false;
		this.pulse = false;
		this.spiral = false;
		this.orbit = false;
		this.isRainbow = false;
		this.sparkleTime = 0;
		this.pulsePhase = 0;
		this.spiralAngle = 0;
		this.rotationSpeed = 0;
		this.orbitCenter = undefined;
		this.orbitRadius = undefined;
		this.orbitSpeed = undefined;
		this.orbitAngle = undefined;
		this.gravity = 0;
		this.score = undefined;
		this.text = undefined;
		this.font = undefined;
		this.fontSize = undefined;
		this.active = false; // Mark as inactive for reuse
	}

	/**
	 * Initializes or reinitializes the particle with new configuration.
	 * Used both at creation and when reused from the pool.
	 * @param config - Particle configuration object
	 * @param centerX - Optional x-coordinate for orbit center
	 * @param centerY - Optional y-coordinate for orbit center
	 */
	public initialize(config: ParticleConfigType, centerX?: number, centerY?: number): void {
		this.birth = this.p5.millis();
		this.type = config.type || 'normal';
		this.active = true; // Activate particle for use

		const baseScale = Math.max(0.3, Math.min(1, this.cellSize / 40)); // Scale factor based on cell size

		// Score-specific initialization
		if (this.type === 'score') {
			this.score = config.score;
			this.text = config.text;
			this.font = config.font;
			this.fontSize = (config.fontSize || 0) * baseScale;
			this.scale = 0;
			this.targetScale = 1.3 * baseScale;
			this.rotation = this.p5.random(-0.2, 0.2);
			this.vy = -(config.speed || 0) * baseScale;
		}

		// Calculate initial motion
		const angle =
			config.initialAngle !== undefined ? config.initialAngle : Math.random() * Math.PI * 2;
		const speedValue =
			typeof config.speed === 'number'
				? config.speed
				: config.speed.min + Math.random() * (config.speed.max - config.speed.min);
		this.speed = speedValue * baseScale;

		this.vx = Math.cos(angle) * this.speed;
		this.vy =
			this.type === 'score'
				? this.vy || -(config.speed || 0) * baseScale
				: Math.sin(angle) * this.speed;

		// Set size based on config and cell scaling
		this.size =
			this.cellSize *
			(config.size.min + Math.random() * (config.size.max - config.size.min)) *
			baseScale;

		// Set lifetime
		const lifetimeMin = config.lifetime?.min ?? 500;
		const lifetimeMax = config.lifetime?.max ?? 1500;
		this.lifetime = lifetimeMin + Math.random() * (lifetimeMax - lifetimeMin);

		// Randomly select color from config
		const color = config.colors[Math.floor(Math.random() * config.colors.length)];
		this.color = color.startsWith('#') ? color : '#ffffff';

		// Set effect flags
		this.trail = config.trail?.enabled || false;
		this.glow = config.glow || false;
		this.sparkle = config.sparkle || false;
		this.pulse = config.pulse || false;
		this.spiral = config.spiral || false;
		this.orbit = config.orbit?.enabled || false;
		this.isRainbow = config.rainbow || false;

		// Initialize effect properties
		this.trailPoints = [];
		this.trailLength = config.trail?.length || 3;
		this.trailDecay = config.trail?.decay || 0.95;
		this.sparkleTime = 0;
		this.pulsePhase = Math.random() * Math.PI * 2;
		this.spiralAngle = 0;
		this.rotationSpeed = (Math.random() * 0.1 + 0.05) * (Math.random() < 0.5 ? 1 : -1);

		// Set up orbiting if enabled
		if (this.orbit) {
			this.orbitCenter = { x: centerX ?? this.x, y: centerY ?? this.y }; // Use provided center or initial position
			this.orbitRadius = config.orbit?.radius;
			this.orbitSpeed = config.orbit?.speed;
			this.orbitAngle = angle;
		}

		this.gravity = config.gravity || 0; // Apply gravity if specified
	}

	/**
	 * Updates the particle's position and state.
	 * @returns Whether the particle is still alive (within lifetime)
	 */
	update(): boolean {
		if (!this.active) return false; // Skip if inactive

		const p5 = this.p5;
		const age = p5.millis() - this.birth;

		// Handle movement based on particle type
		if (this.type === 'score') {
			this.scale = Math.min(this.targetScale ?? 0, this.scale + 0.2); // Animate scale for score text
			this.y += this.vy;
			this.vy *= 0.95; // Apply friction
		} else if (this.orbit) {
			if (
				this.orbitCenter &&
				this.orbitRadius !== undefined &&
				this.orbitSpeed !== undefined
			) {
				this.orbitAngle = (this.orbitAngle ?? 0) + this.orbitSpeed;
				this.x = this.orbitCenter.x + Math.cos(this.orbitAngle) * this.orbitRadius;
				this.y = this.orbitCenter.y + Math.sin(this.orbitAngle) * this.orbitRadius;
			}
		} else {
			this.x += this.vx;
			this.y += this.vy;
			this.vy += (this.gravity ?? 0) * (this.cellSize / 40); // Apply gravity
			this.vx *= 0.98; // Apply friction
			this.vy *= 0.98;
		}

		// Update trail if enabled
		if (this.trail) {
			this.trailPoints.push({ x: this.x, y: this.y });
			if (this.trailPoints.length > (this.trailLength ?? 3)) {
				this.trailPoints.shift();
			}
		}

		// Update sparkle animation
		if (this.sparkle) {
			this.sparkleTime = (this.sparkleTime + 0.1) % (Math.PI * 2);
		}

		return age < this.lifetime; // Return alive status
	}

	/**
	 * Renders the particle with its effects.
	 */
	draw(): void {
		if (!this.active) return; // Skip if inactive

		const p5 = this.p5;
		const age = p5.millis() - this.birth;
		const lifePercent = age / this.lifetime;
		const alpha = Math.max(0, Math.min(255, 255 * (1 - lifePercent))); // Fade out over lifetime
		const cellScale = this.cellSize / 40; // Scaling factor for effects

		p5.push();

		// Draw trail effect
		if (this.trail && this.trailPoints.length > 1) {
			let trailAlpha = alpha;
			for (let i = 0; i < this.trailPoints.length - 1; i++) {
				const point = this.trailPoints[i];
				const nextPoint = this.trailPoints[i + 1];
				trailAlpha *= this.trailDecay ?? 0.95; // Fade trail segments

				if (this.glow) {
					p5.drawingContext.shadowBlur = 10 * cellScale;
					p5.drawingContext.shadowColor = this.color + this.hex(trailAlpha);
				}

				p5.stroke(this.color + this.hex(trailAlpha));
				p5.strokeWeight(this.size * 0.5 * ((i + 1) / this.trailPoints.length));
				p5.line(point.x, point.y, nextPoint.x, nextPoint.y);
			}
		}

		// Apply glow effect
		if (this.glow) {
			p5.drawingContext.shadowBlur = 15 * cellScale;
			p5.drawingContext.shadowColor = this.color + this.hex(alpha);
		}

		// Apply sparkle effect
		if (this.sparkle) {
			const sparkleIntensity = Math.sin(p5.millis() * 0.01 + this.sparkleTime) * 0.5 + 0.5;
			p5.drawingContext.shadowBlur = (15 + sparkleIntensity * 10) * cellScale;
		}

		p5.noStroke();
		p5.fill(this.color + this.hex(alpha));

		// Render based on particle type
		if (this.type === 'score') {
			p5.textAlign(p5.CENTER, p5.CENTER);
			p5.textSize(this.fontSize ?? 12);
			if (this.font) p5.textFont(this.font);
			if (this.text) p5.text(this.text, this.x, this.y);
		} else {
			p5.circle(this.x, this.y, this.size); // Draw circular particle
		}

		p5.pop();
	}

	/**
	 * Converts a number to a two-digit hexadecimal string for alpha values.
	 * @param n - Number to convert
	 * @returns Hex string (e.g., 'FF' for 255)
	 */
	private hex(n: number): string {
		const h = Math.floor(n).toString(16);
		return h.length === 1 ? '0' + h : h;
	}
}
