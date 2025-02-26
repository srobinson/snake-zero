// src/core/EntityManager.ts
import type { SnakeGame } from '../types';
import type {
	GameConfig,
	FoodCollectedEventData,
	PowerUpCollectedEventData,
	CollisionEventData,
} from '../config/types';
import { GameStates } from './types';
import { GameEvents } from '../config/types';
import { Snake } from '../entities/Snake';
import { Food } from '../entities/Food';
import { PowerUp } from '../entities/PowerUp';
import { Grid } from './Grid';

/**
 * Manages game entities (snake, food, power-ups) and their interactions in Snake Zero.
 * Handles entity updates, collision detection, and spawning logic within the game grid.
 */
export class EntityManager {
	/** Reference to the game instance for event emission and configuration access */
	private game: SnakeGame;

	/** Grid instance for spatial positioning and spawning */
	private grid: Grid;

	/** Game configuration for difficulty and entity settings */
	private config: GameConfig;

	/** Player-controlled snake entity */
	public snake: Snake;

	/** Collectible food item on the grid */
	private food: Food;

	/** Current power-up item, null if none is active */
	private powerUp: PowerUp | null;

	/**
	 * Initializes the entity manager with a game instance and grid.
	 * Creates initial entities (snake, food).
	 * @param game - The game instance for context and events
	 * @param grid - The grid for spatial management
	 */
	constructor(game: SnakeGame, grid: Grid) {
		this.game = game;
		this.grid = grid;
		this.config = game.getConfig();

		// Initialized after construction to ensure game is fully set
		this.food = null!;
		this.powerUp = null;
		this.snake = null!;

		this.setupEventListeners();
	}

	/**
	 * Initializes all entities after the manager is constructed.
	 * Ensures Game.entityManager is fully set before entities access it.
	 */
	public initialize(): void {
		this.snake = new Snake(this.grid, this.game);
		this.food = new Food(this.grid, this.game); // Safe to call getEntityManager() now
	}

	private setupEventListeners(): void {
		const events = this.game.getEvents();
		events.on(GameEvents.FOOD_COLLECTED, (data: FoodCollectedEventData) => {
			if (data && data.position) {
				this.game
					.getParticleSystem()
					.createFoodEffect(data.position, data.foodType, data.points, data.multiplier);
				this.food?.respawn([this.snake]);
			}
		});
		events.on(GameEvents.COLLISION, (_data: CollisionEventData) => {
			this.game.getStateMachine().transition(GameStates.GAME_OVER);
		});
	}

	/**
	 * Updates all entities and checks for interactions during the PLAYING state.
	 * Emits events for collisions, food collection, and power-up pickups.
	 */
	public update(): void {
		if (!this.game.getStateMachine().isInState(GameStates.PLAYING)) return;
		const currentTime = this.game.getP5()!.millis();

		if (this.snake.update(currentTime)) {
			// Check for snake collision with walls or self
			if (this.snake.checkCollision()) {
				this.game
					.getEvents()
					.emit(GameEvents.COLLISION, { position: this.snake.segments[0] });
				return;
			}

			// Handle food collection
			if (this.snake.checkFoodCollision(this.food)) {
				this.snake.grow();
				const basePoints = this.food.getPoints();
				const multiplier = this.snake.getPointsMultiplier();
				const finalPoints = basePoints * multiplier;
				this.game.getStateMachine().updateScore(finalPoints);
				this.game.getEvents().emit(GameEvents.FOOD_COLLECTED, {
					position: this.food.getPosition(),
					points: basePoints,
					multiplier,
					foodType: this.food.getType(),
				});
			}

			// Handle power-up collection
			if (this.powerUp && this.snake.checkPowerUpCollision(this.powerUp)) {
				this.snake.addEffect(this.powerUp.type);
				this.game.applyPowerUp(this.powerUp.type, this.powerUp.position);
				this.game.getEvents().emit(GameEvents.POWER_UP_COLLECTED, {
					powerUpType: this.powerUp.type,
					position: this.powerUp.position,
				});
				this.powerUp = null;
			}
		}

		// Randomly spawn a power-up based on difficulty settings
		const difficulty = this.config.difficulty.presets[this.config.difficulty.current];
		if (!this.powerUp && Math.random() < difficulty.powerUpChance) {
			this.powerUp = new PowerUp(this.grid, [this.snake, this.food]);
		}
	}

	/**
	 * Resets all entities to their initial state.
	 * Recreates snake and food, clears power-up.
	 */
	public reset(): void {
		this.snake = new Snake(this.grid, this.game);
		this.food = new Food(this.grid, this.game);
		this.powerUp = null;
	}

	/** Getter for the snake entity */
	public getSnake(): Snake {
		return this.snake;
	}

	/** Getter for the food entity */
	public getFood(): Food {
		return this.food;
	}

	/** Getter for the current power-up */
	public getPowerUp(): PowerUp | null {
		return this.powerUp;
	}

	/** Setter for the current power-up */
	public setPowerUp(powerUp: PowerUp | null): void {
		this.powerUp = powerUp;
	}
}
