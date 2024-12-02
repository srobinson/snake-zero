import { EventSystem } from './EventSystem';
import type { GameState, Game, StateData } from '../types-ts/gameStateTypes';

export const GameStates = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
} as const;

const VALID_TRANSITIONS: Record<GameState, GameState[]> = {
    [GameStates.MENU]: [GameStates.PLAYING],
    [GameStates.PLAYING]: [GameStates.PAUSED, GameStates.GAME_OVER],
    [GameStates.PAUSED]: [GameStates.PLAYING, GameStates.MENU],
    [GameStates.GAME_OVER]: [GameStates.MENU]
} as const;

/**
 * Game state machine that handles state transitions and associated logic.
 * Manages the game's state lifecycle, including:
 * - State transitions and validation
 * - Score tracking and high score persistence
 * - Game timing and pause functionality
 */
export class GameStateMachine {
    #state: GameState;
    #startTime: number;
    #pauseTime: number;
    #score: number;
    #highScore: number;
    #game: Game;
    #events: EventSystem;

    constructor(game: Game) {
        this.#game = game;
        this.#state = GameStates.MENU;
        this.#startTime = 0;
        this.#pauseTime = 0;
        this.#score = 0;
        this.#highScore = this.#loadHighScore();
        this.#events = game.events;
    }

    /**
     * Transitions to a new state if the transition is valid
     */
    public transition(newState: GameState): boolean {
        // Check if transition is valid
        const validTransitions = VALID_TRANSITIONS[this.#state];
        if (!validTransitions?.includes(newState)) {
            console.warn(`Invalid state transition: ${this.#state} -> ${newState}`);
            return false;
        }

        // Handle state-specific logic
        switch (newState) {
            case GameStates.PLAYING:
                if (this.#state === GameStates.MENU) {
                    this.#game.reset();
                    this.#score = 0;
                    this.#startTime = Date.now();
                } else if (this.#state === GameStates.PAUSED) {
                    // Adjust start time to account for pause duration
                    const pauseDuration = Date.now() - this.#pauseTime;
                    this.#startTime += pauseDuration;
                }
                break;

            case GameStates.PAUSED:
                this.#pauseTime = Date.now();
                break;

            case GameStates.GAME_OVER:
                if (this.#score > this.#highScore) {
                    this.#highScore = this.#score;
                    this.#saveHighScore();
                }
                break;

            case GameStates.MENU:
                // Reset game state when returning to menu
                this.#score = 0;
                this.#startTime = 0;
                this.#pauseTime = 0;
                break;
        }

        // Update state and emit event
        this.#state = newState;
        this.#events.emit('state_changed', { 
            state: newState,
            score: this.#score,
            highScore: this.#highScore,
            playTime: this.getPlayTime()
        });

        return true;
    }

    /**
     * Updates the current score
     */
    public updateScore(points: number): void {
        if (this.#state !== GameStates.PLAYING) return;
        
        this.#score += points;
        this.#events.emit('score_changed', { score: this.#score });
    }

    /**
     * Gets the current play time in milliseconds.
     * If the game is paused, returns the time until pause.
     */
    public getPlayTime(): number {
        if (this.#state === GameStates.MENU) return 0;
        if (this.#state === GameStates.PAUSED) return this.#pauseTime - this.#startTime;
        return Date.now() - this.#startTime;
    }

    /**
     * Gets the current game state
     */
    public getState(): GameState {
        return this.#state;
    }

    /**
     * Checks if the game is in a specific state
     */
    public isInState(state: GameState): boolean {
        return this.#state === state;
    }

    /**
     * Gets the current score
     */
    public getScore(): number {
        return this.#score;
    }

    /**
     * Gets the current high score
     */
    public highScore(): number {
        return this.#highScore;
    }

    #loadHighScore(): number {
        try {
            const savedScore = localStorage.getItem('highScore');
            return savedScore ? parseInt(savedScore, 10) : 0;
        } catch (error) {
            console.warn('Failed to load high score:', error);
            return 0;
        }
    }

    #saveHighScore(): void {
        try {
            localStorage.setItem('highScore', this.#highScore.toString());
        } catch (error) {
            console.warn('Failed to save high score:', error);
        }
    }
}
