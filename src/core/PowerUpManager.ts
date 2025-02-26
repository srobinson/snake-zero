// src/core/PowerUpManager.ts
import type { SnakeGame } from '../types';
import {
	type PowerUpType,
	type Position,
	GameEvents,
	PowerUpCollectedEventData,
} from '../config/types';
import { PowerUp } from '../entities/PowerUp';

/**
 * Manages power-up spawning and application in Snake Zero.
 * Coordinates with EntityManager for entity state and UIManager for badges via Game.
 */
export class PowerUpManager {
	private game: SnakeGame;

	constructor(game: SnakeGame) {
		this.game = game;
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		this.game
			.getEvents()
			.on(GameEvents.POWER_UP_COLLECTED, (data: PowerUpCollectedEventData) => {
				if (data && data.position && data.powerUpType) {
					this.game
						.getParticleSystem()
						.createPowerUpEffect(data.position, data.powerUpType);
				}
			});
	}

	/**
	 * Updates power-up spawning based on game difficulty settings.
	 */
	public update(): void {
		const difficulty =
			this.game.getConfig().difficulty.presets[this.game.getConfig().difficulty.current];
		const currentPowerUp = this.game.getEntityManager().getPowerUp();
		const snake = this.game.getEntityManager().getSnake();
		const food = this.game.getEntityManager().getFood();

		if (!currentPowerUp && Math.random() < difficulty.powerUpChance && snake && food) {
			const newPowerUp = new PowerUp(this.game.getGrid(), [snake, food]);
			this.game.getEntityManager().setPowerUp(newPowerUp);
		}
	}

	/**
	 * Applies a power-up effect to the snake and triggers UI updates.
	 * @param type - Type of power-up to apply
	 * @param position - Position where power-up was collected
	 */
	public applyPowerUp(type: PowerUpType, position: Position): void {
		const snake = this.game.getEntityManager().getSnake();
		snake.addEffect(type); // Apply effect to snake
		this.game.getUIManager().addPowerUpBadge(type, position); // Add badge via UIManager
		const snakeHead = snake.segments[0];
		this.game.getParticleSystem().createPowerUpEffect(snakeHead, type); // Trigger particle effect
	}
}
