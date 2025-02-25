import type { GameConfig } from './config/types';
import type { Snake } from './entities/Snake';
import type { Grid } from './core/Grid';
import type { Food } from './entities/Food';
import type { PowerUp } from './entities/PowerUp';
import type { EventSystem } from './core/EventSystem';

/**
 * Comprehensive Game interface representing the core game state and interactions
 */
export interface SnakeGame {
	getEvents(): EventSystem;
	getSnake(): Snake;
	getGrid(): Grid;
	getFood(): Food;
	getPowerUp(): PowerUp | null;
	getConfig(): GameConfig;
	setConfig(config: GameConfig): void;
	updatePowerUp(powerUp: PowerUp | null): void;

	getCurrentScore(): number;

	// Game state methods
	recreate(): boolean;
	reset(): void;

	// Optional state management methods
	pause?(): void;
	resume?(): void;
	isPaused?(): boolean;
	isGameOver?(): boolean;

	// Optional game loop methods
	update(currentTime: number): void;
	draw(): void;
}

/**
 * Game data interface
 */
export interface GameData {
	config: GameConfig;
	grid?: {
		/** Method to update grid dimensions */
		updateDimensions?: () => void;
	};
	updateDimensions?: () => void;
}
