// =========================================
// Particle Types
// =========================================

/**
 * Represents a single point in a particle's trail
 */
export interface TrailPoint {
	x: number;
	y: number;
}

/** Possible game states */
export type GameState = 'menu' | 'playing' | 'paused' | 'game_over';

/** State transition definition */
export interface StateTransition {
	/** Source state */
	from: GameState;
	/** Target state */
	to: GameState;
}

/** State data for various game states */
export interface StateData {
	/** Current game state */
	state: GameState;
	/** Current score (for GAME_OVER) */
	score?: number;
	/** High score (for GAME_OVER) */
	highScore?: number;
	/** Play time in ms (for PAUSED/GAME_OVER) */
	playTime?: number;
}

/** Possible game states */
export const GameStates = {
	/** Main menu state */
	MENU: 'menu',
	/** Active game state */
	PLAYING: 'playing',
	/** Paused game state */
	PAUSED: 'paused',
	/** Game over state */
	GAME_OVER: 'game_over',
} as const;

/** Valid state transitions map */
export const ValidTransitions: Record<GameState, GameState[]> = {
	[GameStates.MENU]: [GameStates.PLAYING],
	[GameStates.PLAYING]: [GameStates.PAUSED, GameStates.GAME_OVER],
	[GameStates.PAUSED]: [GameStates.PLAYING, GameStates.MENU],
	[GameStates.GAME_OVER]: [GameStates.MENU],
};
