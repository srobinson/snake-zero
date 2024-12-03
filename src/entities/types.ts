import type { Game } from '../main';
import type { PowerUpType } from '../config/types';

// =========================================
// Common Types
// =========================================
/**
 * Represents a 2D position
 */
export interface Position {
    x: number;
    y: number;
}

// =========================================
// Grid Types
// =========================================
/**
 * Represents a grid in the game
 */
export interface Grid {
    cellSize: number;
    game?: Game;
    getRandomPosition(avoidObstacles: boolean): Position;
    getCellCenter(position: Position): Position;
    getCellSize(): number;
}

// =========================================
// Food Types
// =========================================
/**
 * Type of food that can appear in the game:
 * - regular: Basic food that increases score and length
 * - bonus: Special food with higher points and effects
 * - golden: Rare food with maximum points and special effects
 */
export type FoodType = 'regular' | 'bonus' | 'golden';

/**
 * Color scheme for food items
 */
export interface FoodColors {
    /** Main color of the food item */
    primary: string;
    /** Secondary color for patterns and effects */
    secondary: string;
    /** Highlight color for glow and particles */
    highlight: string;
}

// =========================================
// Snake Types
// =========================================
/**
 * Active effect on the snake
 */
export interface Effect {
    /** Type of power-up causing the effect */
    type: PowerUpType;
    /** Time when the effect started */
    startTime: number;
    /** Duration of the effect in milliseconds */
    duration: number;
    /** Speed boost multiplier if applicable */
    boost?: number;
    /** Score multiplier if applicable */
    multiplier?: number;
}

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

/**
 * Possible directions for snake movement
 */
export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Context for drawing operations
 */
export interface DrawingContext {
    /** Global alpha (transparency) value */
    globalAlpha: number;
}

// =========================================
// Obstacle Types
// =========================================
/**
 * Represents an obstacle in the game
 */
export interface Obstacle {
    /** Array of positions forming the obstacle */
    segments: Array<Position>;
}

// =========================================
// Particle Types
// =========================================
/**
 * Possible types of particles in the game
 */
export type ParticleType = 'normal' | 'score' | 'powerup' | 'active' | 'orbit';

/**
 * Configuration for particle trail effect
 */
export interface ParticleTrailConfig {
    enabled: boolean;
    length?: number;
    decay?: number;
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
 * Configuration for orbital particle motion
 */
export interface ParticleOrbitConfig {
    enabled: boolean;
    radius?: number;
    speed?: number;
}

/**
 * Comprehensive configuration for creating a particle
 */
export interface ParticleConfig {
    type?: ParticleType;
    initialAngle?: number;
    speed: number;
    size: ParticleSizeConfig;
    lifetime: ParticleLifetimeConfig;
    colors: string[];
    trail?: ParticleTrailConfig;
    glow?: boolean;
    sparkle?: boolean;
    pulse?: boolean;
    spiral?: boolean;
    rainbow?: boolean;
    orbit?: ParticleOrbitConfig;
    gravity?: number;
    
    // Optional score-specific properties
    score?: number;
    text?: string;
    font?: string;
    fontSize?: number;
}
