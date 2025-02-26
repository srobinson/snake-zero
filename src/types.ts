/**
 * Comprehensive Game interface representing the core game state and interactions
 */
import type p5 from 'p5';
import type { GameConfig, PowerUpType, Position } from './config/types';
import type { Snake } from './entities/Snake';
import type { Grid } from './core/Grid';
import type { Food } from './entities/Food';
import type { PowerUp } from './entities/PowerUp';
import type { EventSystem } from './core/EventSystem';
import { GameController } from './core/GameController';
import { DebugPanel } from './core/DebugPanel';
import { PowerUpBadge } from './entities/PowerUpBadge';
import { ParticleSystem } from './core/ParticleSystem';
import { InputController } from './core/InputController';
import { EntityManager } from './core/EntityManager';
import { PowerUpManager } from './core/PowerUpManager';
import { UIManager } from './core/UIManager';

/**
 * Defines the contract for the Snake Zero game implementation.
 * Specifies methods for managing game state, entities, and interactions.
 * Used by Game class and potentially other implementations (e.g., mocks for testing).
 */
export interface SnakeGame {
	/** Getter for p5 instance, used by EntityManager for timing */
	getP5(): p5 | null;

	/** Getter for EntityManager instance, used by other systems for entity access */
	getEntityManager(): EntityManager;

	/** Getter for the UI manager instance, used by other systems for UI updates */
	getUIManager(): UIManager;

	/**
	 * Retrieves the grid instance for spatial calculations or rendering.
	 * @returns The game grid
	 */
	getGrid(): Grid;

	/**
	 * Retrieves the game configuration for settings access.
	 * @returns The current game configuration
	 */
	getConfig(): GameConfig;

	/**
	 * Updates the game configuration with new settings.
	 * @param config - The new configuration to apply
	 */
	setConfig(config: GameConfig): void;

	/**
	 * Retrieves the state machine for managing game states.
	 * @returns The game controller instance
	 */
	getStateMachine(): GameController;

	/**
	 * Retrieves the debug panel for runtime information display.
	 * @returns The debug panel instance
	 */
	getDebugPanel(): DebugPanel;

	/**
	 * Retrieves the array of persistent UI badges for active power-ups.
	 * @returns Array of active badges
	 */
	getActiveBadges(): PowerUpBadge[];

	/**
	 * Retrieves the array of temporary floating badges for power-up effects.
	 * @returns Array of floating badges
	 */
	getFloatingBadges(): PowerUpBadge[];

	/**
	 * Retrieves the particle system for visual effect management.
	 * @returns The particle system instance, or null if not initialized
	 */
	getParticleSystem(): ParticleSystem;

	/**
	 * Retrieves the powerup manager for spawning and applying power-ups.
	 * @returns The powerup manager instance
	 */
	getPowerUpManager(): PowerUpManager;

	/**
	 * Retrieves the total play time accumulated during the game.
	 * @returns Play time in milliseconds
	 */
	getPlayTime(): number;

	/**
	 * Retrieves the event system for game-wide communication.
	 * @returns The event system instance
	 */
	getEvents(): EventSystem;

	/**
	 * Updates the current power-up item on the grid.
	 * @param powerUp - The new power-up or null to clear it
	 */
	updatePowerUp(powerUp: PowerUp | null): void;

	/**
	 * Retrieves the input controller for handling user inputs.
	 * @returns The input controller instance
	 */
	getInputController(): InputController;

	/**
	 * Initializes the game with a p5.js instance, setting up systems and the game loop.
	 * @param p5Instance - The p5.js instance for rendering and input
	 */
	setup(p5Instance: p5): void;

	/**
	 * Stops the game loop, halting updates and rendering.
	 */
	stopGameLoop(): void;

	/**
	 * Updates the game state, handling entity interactions and logic.
	 */
	update(): void;

	/**
	 * Recreates the game with the current configuration, resetting entities and canvas.
	 * @returns True if successful, false if the canvas container is missing
	 */
	recreate(): boolean;

	/**
	 * Resets the game state to initial conditions, recreating entities.
	 */
	reset(): void;

	/**
	 * Applies a power-up effect to the snake and updates badges.
	 * @param type - The type of power-up to apply
	 * @param powerUpPosition - Position where the power-up was collected
	 */
	applyPowerUp(type: PowerUpType, powerUpPosition: Position): void;
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
