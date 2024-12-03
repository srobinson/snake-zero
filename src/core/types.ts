import p5 from 'p5';

// =========================================
// Particle Types
// =========================================
/**
 * Exhaustive list of possible particle types
 */
export type ParticleType = 
    | 'normal'     // Standard particle effect
    | 'score'      // Text-based score particle
    | 'powerup'    // Power-up collection particle
    | 'orbit'      // Orbiting particle effect
    | 'trail'      // Particle trail effect
    | 'active'     // Active effect particle
    | 'sparkle';   // Decorative sparkle particle

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

/**
 * Validate a particle configuration
 * @param config - Particle configuration to validate
 * @returns Boolean indicating if configuration is valid
 */
export function validateParticleConfig(config: ParticleConfig): boolean {
    // Basic validation rules
    const baseValidation = 
        (typeof config.speed === 'number' ? config.speed : config.speed.min) > 0 &&
        config.size.min >= 0 &&
        config.size.max > config.size.min &&
        config.colors.length > 0;
    
    // Type-specific validations
    switch (config.type) {
        case 'score':
            return baseValidation && 
                (config as ScoreParticleConfig).fontSize !== undefined;
        
        case 'powerup':
        case 'orbit':
            // For powerup and orbit, we'll just check basic validation
            return baseValidation;
        
        case 'active':
            return baseValidation && 
                (config as ActiveEffectParticleConfig).emitInterval !== undefined;
        
        default:
            return baseValidation;
    }
}

/**
 * Safely get a particle configuration with default values
 * @param config - Partial particle configuration
 * @returns Fully formed particle configuration
 */
export function getParticleConfig(config: Partial<ParticleConfig>): ParticleConfig {
    const defaultConfig: BaseParticleConfig = {
        type: 'normal',
        speed: 1,
        size: { min: 0.1, max: 0.2 },
        colors: ['#ffffff'],
        trail: { enabled: false },
        glow: false,
        sparkle: false,
        pulse: false,
        gravity: 0,
        rainbow: false
    };

    return {
        ...defaultConfig,
        ...config
    } as ParticleConfig;
}

/**
 * Represents a single point in a particle's trail
 */
export interface TrailPoint {
    x: number;
    y: number;
}

/**
 * Configuration for a particle's size range
 */
export interface ParticleSizeConfig {
    min: number;
    max: number;
}

/**
 * Configuration for particle lifetime
 */
export interface ParticleLifetimeConfig {
    min: number;
    max: number;
}

/**
 * Configuration for particle trail effect
 */
export interface ParticleTrailConfig {
    enabled: boolean;
    length?: number;
    decay?: number;
}

/**
 * Configuration for orbital particle motion
 */
export interface ParticleOrbitConfig {
    enabled: boolean;
    radius?: number;
    speed?: number;
}

/**
 * Represents the configuration for creating a food effect particle
 */
export interface FoodEffectConfig {
    count: number;
    speed: number;
    size: ParticleSizeConfig;
    lifetime: ParticleLifetimeConfig;
    colors: string[];
    trail: ParticleTrailConfig;
    glow: boolean;
    sparkle: boolean;
    pulse: boolean;
}

/**
 * Represents the configuration for creating a power-up effect particle
 */
export interface PowerUpEffectConfig {
    particleCount: number;
    baseSpeed: number;
    speedVariation: number;
    sizeRange: [number, number];
    duration: number;
    colors: string[];
    trail: ParticleTrailConfig;
    sparkle: boolean;
}

/**
 * Represents the configuration for creating an active effect particle
 */
export interface ActiveEffectConfig {
    emitInterval: number;
    particleCount: number;
    baseSpeed: number;
    speedVariation: number;
    sizeRange: [number, number];
    spreadAngle: number;
    colors: string[];
    trail: ParticleTrailConfig;
    sparkle: boolean;
}
