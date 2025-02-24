import type { SnakeGame } from '../types';
import type { StateTransition, StateData } from './types';
import { EventSystem } from './EventSystem';
import { GameStates, GameState, ValidTransitions } from './types';
import { GameEvents } from '../config/types';
/**
 * Game state machine that handles state transitions and associated logic.
 * Manages the game's state lifecycle, including:
 * - State transitions and validation
 * - Score tracking and high score persistence
 * - Game timing and pause functionality
 */
export class GameController {
	/** Current game state */
	private state: GameState;

	/** Game start time */
	private startTime: number;

	/** Pause time */
	private pauseTime: number;

	/** Current score */
	private score: number;

	/** High score */
	private highScore: number;

	/** Game instance */
	private game: SnakeGame;

	/** Event system */
	private events: EventSystem;

	/**
	 * Creates a new GameController instance
	 * @param game - The game instance
	 */
	constructor(game: SnakeGame) {
		this.game = game;
		this.state = GameStates.MENU;
		this.startTime = 0;
		this.pauseTime = 0;
		this.score = 0;
		this.highScore = this.#loadHighScore();
		this.events = game.getEvents();
	}

	/**
	 * Validates a state transition
	 * @param transition - The transition to validate
	 * @returns Whether the transition is valid
	 */
	private validateTransition({ from, to }: StateTransition): boolean {
		return ValidTransitions[from]?.includes(to) ?? false;
	}

	/**
	 * Creates state data for event emission
	 * @param state - The state to create data for
	 * @returns State data for event
	 */
	private createStateData(state: GameState): StateData {
		const data: StateData = { state };

		switch (state) {
			case GameStates.GAME_OVER:
				data.score = this.score;
				data.highScore = this.highScore;
				data.playTime = this.getPlayTime();
				break;
			case GameStates.PAUSED:
				data.playTime = this.getPlayTime();
				break;
		}

		return data;
	}

	/**
	 * Transitions to a new state if the transition is valid
	 * @param newState - The state to transition to
	 * @returns Whether the transition was successful
	 */
	transition(newState: GameState): boolean {
		const transition: StateTransition = {
			from: this.state,
			to: newState,
		};

		if (!this.validateTransition(transition)) {
			console.warn(`Invalid state transition: ${transition.from} -> ${transition.to}`);
			return false;
		}

		// Handle state exit
		switch (this.state) {
			case GameStates.PLAYING:
				if (newState === GameStates.PAUSED) {
					this.pauseTime = Date.now();
				}
				break;
		}

		// Handle state enter
		switch (newState) {
			case GameStates.PLAYING:
				if (this.state === GameStates.MENU) {
					this.startTime = Date.now();
					this.score = 0;
					this.game.reset();
				} else if (this.state === GameStates.PAUSED) {
					const pauseDuration = Date.now() - this.pauseTime;
					this.startTime += pauseDuration;
				}
				break;
			case GameStates.GAME_OVER:
				if (this.score > this.highScore) {
					this.highScore = this.score;
					this.saveHighScore();
				}
				break;
		}

		this.state = newState;
		this.events.emit('state_changed', this.createStateData(newState));
		return true;
	}

	/**
	 * Updates the current score
	 * @param points - Points to add to the current score
	 */
	updateScore(points: number): void {
		// if (!this.isInState(GameStates.PLAYING)) return;
		// this.score += points;
		// this.events.emit(GameEvents.SCORE_CHANGED, { score: this.score });
		this.score += points;
		const highScore = parseInt(localStorage.getItem('highScore') || '0', 10);
		if (this.score > highScore) {
			localStorage.setItem('highScore', this.score.toString());
		}
	}

	/**
	 * Loads the high score from local storage
	 * @returns Stored high score or 0
	 */
	#loadHighScore(): number {
		const storedHighScore = localStorage.getItem('highScore');
		return storedHighScore ? parseInt(storedHighScore, 10) : 0;
	}

	/**
	 * Saves the high score to local storage
	 */
	private saveHighScore(): void {
		localStorage.setItem('highScore', this.highScore.toString());
	}

	/**
	 * Checks if the game is in a specific state
	 * @param state - State to check
	 * @returns True if game is in the specified state
	 */
	isInState(state: GameState): boolean {
		return this.state === state;
	}

	/**
	 * Gets the current game state
	 * @returns Current state
	 */
	getState(): GameState {
		return this.state;
	}

	/**
	 * Gets the current score
	 * @returns Current score
	 */
	getCurrentScore(): number {
		return this.score;
	}

	/**
	 * Gets the current high score
	 * @returns Current high score
	 */
	getCurrentHighScore(): number {
		return this.highScore;
	}

	/**
	 * Calculates the total play time
	 * @returns Play time in milliseconds
	 */
	getPlayTime(): number {
		if (this.state === GameStates.PLAYING) {
			return Date.now() - this.startTime;
		}
		return 0;
	}
}
