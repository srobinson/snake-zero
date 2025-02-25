// src/core/GameController.ts
import type { SnakeGame } from '../types';
import type { StateTransition, StateData } from './types';
import { EventSystem } from './EventSystem';
import { GameStates, GameState, ValidTransitions } from './types';
import { GameEvents, ScoreChangedEventData, StateChangedEventData } from '../config/types';

/**
 * Game state machine managing state transitions and core game metrics.
 * Tracks scores, high scores, and play time, emitting type-safe events.
 */
export class GameController {
	private state: GameState;
	private startTime: number;
	private pauseTime: number;
	private score: number;
	private highScore: number;
	private game: SnakeGame;
	private events: EventSystem;

	constructor(game: SnakeGame) {
		this.game = game;
		this.state = GameStates.MENU;
		this.startTime = 0;
		this.pauseTime = 0;
		this.score = 0;
		this.highScore = this.#loadHighScore();
		this.events = game.getEvents();
	}

	private validateTransition({ from, to }: StateTransition): boolean {
		return ValidTransitions[from]?.includes(to) ?? false;
	}

	private createStateData(state: GameState): StateChangedEventData {
		const data: StateChangedEventData = { state };
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

	public transition(newState: GameState): boolean {
		const transition: StateTransition = { from: this.state, to: newState };
		if (!this.validateTransition(transition)) {
			console.warn(`Invalid state transition: ${transition.from} -> ${transition.to}`);
			return false;
		}

		switch (this.state) {
			case GameStates.PLAYING:
				if (newState === GameStates.PAUSED) {
					this.pauseTime = Date.now();
				}
				break;
		}

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
		this.events.emit(GameEvents.STATE_CHANGED, this.createStateData(newState));
		return true;
	}

	public updateScore(points: number): void {
		this.score += points;
		const highScore = parseInt(localStorage.getItem('highScore') || '0', 10);
		if (this.score > highScore) {
			localStorage.setItem('highScore', this.score.toString());
		}
		const scoreData: ScoreChangedEventData = { score: this.score };
		this.events.emit(GameEvents.SCORE_CHANGED, scoreData);
	}

	#loadHighScore(): number {
		const storedHighScore = localStorage.getItem('highScore');
		return storedHighScore ? parseInt(storedHighScore, 10) : 0;
	}

	private saveHighScore(): void {
		localStorage.setItem('highScore', this.highScore.toString());
	}

	public isInState(state: GameState): boolean {
		return this.state === state;
	}

	public getState(): GameState {
		return this.state;
	}

	public getCurrentScore(): number {
		return this.score;
	}

	public getCurrentHighScore(): number {
		return this.highScore;
	}

	public getPlayTime(): number {
		if (this.state === GameStates.PLAYING) {
			return Date.now() - this.startTime;
		}
		return 0;
	}
}
