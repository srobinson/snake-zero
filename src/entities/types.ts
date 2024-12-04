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

// import type { SnakeGame } from '../types';
import type { PowerUpType } from '../config/types.consolidated.ts';

// =========================================
// Grid Types
// =========================================
/**
 * Represents a grid in the game
 */
export interface Grid {
	// game: SnakeGame;
	getRandomPosition(avoidObstacles: boolean): Position;
	getCellCenter(position: Position): Position;
	getCellSize(): number;
	getWidth(): number;
	getHeight(): number;
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
	boost: number;
	/** Score multiplier if applicable */
	multiplier?: number;
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
