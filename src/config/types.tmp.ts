// =========================================
// Consolidated Configuration Types
// =========================================

// =========================================
// Snake Configuration Types
// =========================================
/**
 * Configuration for snake segments appearance
 */
export interface SnakeSegmentConfig {
	/** Size of each segment */
	size: number;
	/** Space between segments */
	spacing: number;
	/** Radius for rounded corners */
	cornerRadius: number;
}

// =========================================
// Power-Up Configuration Types
// =========================================
/**
 * Configuration for power-up visual effects
 */
export interface PowerUpConfig {
	crystal: {
		baseSize: number;
		floatSpeed: number;
		floatAmount: number;
		rotateSpeed: number;
		glowAmount: number;
		shimmerCount: number;
		shimmerSpeed: number;
		shimmerSize: number;
		energyCount: number;
		energySpeed: number;
		energyLayers: number;
		energyLayerSpacing: number;
		energyPulseSpeed: number;
		energyPulseAmount: number;
		iconSize: number;
	};
	icons: {
		speed: string;
		ghost: string;
		points: string;
		slow: string;
	};
	visual?: {
		baseSize: number;
		floatSpeed: number;
		floatAmount: number;
		rotateSpeed: number;
		glowAmount: number;
		shimmerCount: number;
		shimmerSpeed: number;
		shimmerSize: number;
		energyCount: number;
		energySpeed: number;
		iconSize: number;
	};
}

/**
 * Configuration for power-up badges
 */
export interface BadgeConfig {
	size: number;
	duration: number;
	popInDuration: number;
	popInScale: number;
	hoverFrequency: number;
	hoverAmplitude: number;
}

// =========================================
// Particle Configuration Types
// =========================================
/**
 * Exhaustive list of possible particle types
 */
export type ParticleType =
	| 'normal' // Standard particle effect
	| 'score' // Text-based score particle
	| 'powerup' // Power-up collection particle
	| 'orbit' // Orbiting particle effect
	| 'trail' // Particle trail effect
	| 'active' // Active effect particle
	| 'sparkle'; // Decorative sparkle particle

/**
 * Base configuration for all particle types
 */
export interface BaseParticleConfig {
	/** Type of particle */
	type: ParticleType;

	/** Base speed of the particle */
	speed: number | { min: number; max: number };

	/** Size range of the particle */
	size: {
		min: number;
		max: number;
	};

	/** Lifetime range of the particle */
	lifetime?: {
		min: number;
		max: number;
	};

	/** Color palette for the particle */
	colors: string[];

	/** Optional trail configuration */
	trail?: {
		enabled: boolean;
		length?: number;
		decay?: number;
	};

	/** Visual effect toggles */
	glow?: boolean;
	sparkle?: boolean;
	pulse?: boolean;
	gravity?: number;
	rainbow?: boolean;

	// Additional properties to match Particle.ts usage
	score?: number;
	text?: string;
	font?: string;
	fontSize?: number;
	initialAngle?: number;
	spiral?: boolean;
	orbit?: {
		enabled: boolean;
		radius?: number;
		speed?: number;
	};
}

/**
 * Configuration for score-based particles
 */
export interface ScoreParticleConfig extends BaseParticleConfig {
	type: 'score';

	/** Actual score value */
	score?: number;

	/** Text to display */
	text?: string;

	/** Font for text particle */
	font?: string;

	/** Font size for text particle */
	fontSize?: number;
}

/**
 * Configuration for power-up and orbiting particles
 */
export interface PowerUpParticleConfig extends BaseParticleConfig {
	type: 'powerup' | 'orbit';

	/** Orbital motion configuration */
	orbit?: {
		enabled: boolean;
		radius?: number;
		speed?: number;
	};

	/** Initial angle of particle emission */
	initialAngle?: number;
}

/**
 * Configuration for active effect particles
 */
export interface ActiveEffectParticleConfig extends BaseParticleConfig {
	type: 'active';

	/** Emission interval for continuous effects */
	emitInterval?: number;

	/** Spread angle for particle emission */
	spreadAngle?: number;

	/** Gravity effect on particles */
	gravity?: number;

	/** Rotation speed of particles */
	rotationSpeed?: number;

	/** Initial angle of particle emission */
	initialAngle?: number;
}

/**
 * Union type of all possible particle configurations
 */
export type ParticleConfig =
	| BaseParticleConfig
	| ScoreParticleConfig
	| PowerUpParticleConfig
	| ActiveEffectParticleConfig;
