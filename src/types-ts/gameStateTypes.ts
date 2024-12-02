import type { EventSystem } from '../core-ts/EventSystem';

export type GameState = 'menu' | 'playing' | 'paused' | 'game_over';

export interface StateTransition {
    from: GameState;
    to: GameState;
}

export interface StateData {
    state: GameState;
    score?: number;
    highScore?: number;
    playTime?: number;
}

export interface Game {
    reset: () => void;
    events: EventSystem;
}

export type GameStateType = 'playing' | 'paused' | 'gameover';

export interface ScoringConfig {
    comboTimeWindow: number;  // Time window in milliseconds for combo scoring
    comboMultiplier: number;  // Multiplier applied to points for each combo level
}

export interface ScoreResult {
    points: number;  // Points earned from the scoring action
    combo: number;   // Current combo level after the scoring action
}

export interface GameConfig {
    scoring: ScoringConfig;
}
