/** Position on the grid */
export interface Position {
    x: number;
    y: number;
}

/** Size range for particles */
export interface ParticleSize {
    min: number;
    max: number;
}

/** Lifetime range for particles */
export interface ParticleLifetime {
    min: number;
    max: number;
}

/** Trail configuration for particles */
export interface ParticleTrail {
    enabled: boolean;
    length: number;
    decay: number;
}

/** Orbit configuration for particles */
export interface ParticleOrbit {
    enabled: boolean;
    radius: number;
    speed: number;
}

/** Configuration for individual particles */
export interface ParticleConfig {
    /** Type of particle */
    type?: 'normal' | 'score' | 'powerup' | 'orbit' | 'active';
    /** Initial angle in radians */
    initialAngle?: number;
    /** Movement speed */
    speed?: number;
    /** Size or size range */
    size?: number | ParticleSize;
    /** Lifetime range */
    lifetime?: ParticleLifetime;
    /** Array of possible colors */
    colors: string[];
    /** Trail configuration */
    trail?: ParticleTrail;
    /** Whether particle glows */
    glow?: boolean;
    /** Whether particle sparkles */
    sparkle?: boolean;
    /** Whether particle pulses */
    pulse?: boolean;
    /** Whether particle spirals */
    spiral?: boolean;
    /** Orbit configuration */
    orbit?: ParticleOrbit;
    /** Whether particle has rainbow effect */
    rainbow?: boolean;
    /** Rotation speed */
    rotationSpeed?: number;
    /** Gravity effect */
    gravity?: number;
    /** Score value for score particles */
    score?: number;
    /** Text for score particles */
    text?: string;
    /** Font for score particles */
    font?: string;
    /** Font size for score particles */
    fontSize?: number;
}

/** Configuration for particle effects */
export interface ParticleEffect {
    /** Number of particles to emit */
    particleCount: number;
    /** Base movement speed */
    baseSpeed: number;
    /** Speed variation factor */
    speedVariation: number;
    /** Min and max particle size */
    sizeRange: [number, number];
    /** Duration of effect */
    duration: number;
    /** Array of possible colors */
    colors: string[];
    /** Trail configuration */
    trail: ParticleTrail;
    /** Whether particles sparkle */
    sparkle: boolean;
    /** Angle of particle spread */
    spreadAngle?: number;
    /** Time between particle emissions */
    emitInterval?: number;
}

/** Configuration for all particle effects */
export interface ParticleEffectsConfig {
    /** Food particle configuration */
    food: {
        count: number;
        speed: number;
        size: ParticleSize;
        lifetime: ParticleLifetime;
        colors: string[];
        trail: ParticleTrail;
        glow: boolean;
        sparkle: boolean;
    };
    /** Power-up effect configurations */
    powerUps: {
        [key: string]: ParticleEffect;
    };
    /** Active effect configurations */
    activeEffects: {
        [key: string]: ParticleEffect;
    };
}
