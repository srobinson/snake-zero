import { ParticleType } from '../core/types';

/**
 * Base configuration for all particle types
 */
export interface BaseParticleConfig {
    type: ParticleType;
    speed: number | { min: number; max: number };
    size: { min: number; max: number };
    lifetime: { min: number; max: number };
    colors: string[];
    trail: {
        enabled: boolean;
        length?: number;
        decay?: number;
    };
    glow: boolean;
    sparkle: boolean;
    pulse: boolean;

    // Optional advanced properties
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
    gravity?: number;
    rainbow?: boolean;
}

/**
 * Configuration for score-based particles
 */
export interface ScoreParticleConfig extends BaseParticleConfig {
    type: 'score';
}

/**
 * Configuration for power-up and orbiting particles
 */
export interface PowerUpParticleConfig extends BaseParticleConfig {
    type: 'powerup' | 'orbit';
}

/**
 * Configuration for active effect particles
 */
export interface ActiveEffectParticleConfig extends BaseParticleConfig {
    type: 'active';
}

/**
 * Union type for all possible particle configurations
 */
export type ParticleConfig = 
    | ScoreParticleConfig 
    | PowerUpParticleConfig 
    | ActiveEffectParticleConfig;

/**
 * Validate particle configuration
 * @param config - Particle configuration to validate
 * @returns Boolean indicating if the configuration is valid
 */
export function validateParticleConfig(config: ParticleConfig): boolean {
    // Basic validation rules
    const baseValidation = 
        (typeof config.speed === 'number' ? config.speed > 0 : config.speed.min > 0) &&
        config.size.min >= 0 &&
        config.size.max > config.size.min &&
        config.colors.length > 0;

    // Type-specific validations can be added here if needed
    switch (config.type) {
        case 'score':
        case 'powerup':
        case 'orbit':
        case 'active':
            return baseValidation;
        
        default:
            return baseValidation;
    }
}

/**
 * Default particle configuration
 */
export const defaultParticleConfig: BaseParticleConfig = {
    type: 'normal',
    speed: 1,
    size: { min: 0.1, max: 0.2 },
    lifetime: { min: 1, max: 2 },
    colors: ['#ffffff'],
    trail: { enabled: false },
    glow: false,
    sparkle: false,
    pulse: false
};
