// src/main.ts

// Import p5.js library for rendering and input handling in instance mode
import p5 from 'p5';
// Import configuration manager to load and manage game settings
import configManager from './config/gameConfig';

// Import core game systems and utilities
import { Grid } from './core/Grid'; // Manages grid layout and spatial calculations
import { DebugPanel } from './core/DebugPanel'; // Displays debug overlay with game stats
import { GameController } from './core/GameController'; // Manages game state transitions
import { GameStates } from './core/types'; // Defines game states
import { EventSystem } from './core/EventSystem'; // Type-safe event system for game communication
import { ParticleSystem } from './core/ParticleSystem'; // Manages particle effects for visuals
import { GameRenderer } from './core/GameRenderer'; // Handles all rendering responsibilities
import { InputController } from './core/InputController'; // Processes user input (keyboard/touch)

// Import game entities with specific behaviors
import { PowerUp } from './entities/PowerUp'; // Temporary power-up items
import { PowerUpBadge } from './entities/PowerUpBadge'; // UI badges for active power-ups

// Import type definitions and game configuration
import {
	GameConfig,
	PowerUpType,
	Position,
	FoodCollectedEventData,
	PowerUpCollectedEventData,
	CollisionEventData,
	GameEvents,
} from './config/types'; // Core types and event constants
import { SnakeGame } from './types'; // Interface defining the game implementation
import { EntityManager } from './core/EntityManager';
import { UIManager } from './core/UIManager';
import { PowerUpManager } from './core/PowerUpManager';

/**
 * Main game class implementing the SnakeGame interface.
 * Coordinates game logic, entity updates, and system interactions.
 * Delegates rendering to GameRenderer and input to InputController.
 */
export default class Game implements SnakeGame {
	/** Game configuration loaded from configManager, defining rules and settings */
	private config: GameConfig;

	/** Grid instance for spatial positioning of game elements */
	private grid: Grid;

	/** Event system for broadcasting and handling game events (e.g., collisions) */
	private events: EventSystem;

	/** State machine controlling game states (MENU, PLAYING, PAUSED, GAME_OVER) */
	private stateMachine: GameController;

	/** Renderer for drawing game visuals and UI, initialized in setup() */
	private renderer: GameRenderer;

	/** Debug panel for displaying runtime stats and debug controls */
	private debugPanel: DebugPanel;

	/** Input controller for processing keyboard and touch inputs */
	private inputController: InputController;

	/** Entity manager for snake, food, and power-ups */
	private entityManager: EntityManager;

	/** UI manager for handling power-up badges and floating effects */
	private uiManager: UIManager;

	/** Power-up manager for spawning and applying power-ups */
	private powerUpManager: PowerUpManager;

	/** Current power-up item on the grid, null if none active */
	private powerUp: PowerUp | null;

	/** p5.js instance for timing and canvas management, null until initialized */
	private p5: p5 | null;

	/** Particle system for visual effects (e.g., food collection sparkles) */
	private particleSystem: ParticleSystem | null;

	/** Map of active power-up badges, keyed by power-up type for quick lookup */
	private activePowerUps: Map<string, PowerUpBadge>;

	/** Animation frame ID for the custom game loop, null when stopped */
	private animationFrameId: number | null = null;

	/** Timestamp of the last rendered frame for timing calculations */
	private lastFrameTime: number = 0;

	/**
	 * Initializes the game with configuration, systems, and entities.
	 * Sets up the initial state without starting the game loop.
	 */
	constructor() {
		// Load game configuration from local storage or defaults
		configManager.loadFromLocalStorage();
		this.config = configManager.getConfig();

		// Initialize core systems
		this.events = new EventSystem();
		this.stateMachine = new GameController(this);
		this.debugPanel = new DebugPanel(this);
		this.inputController = new InputController(this); // Input handling delegated

		// Initialize nullable properties
		this.powerUp = null;
		this.p5 = null;
		this.particleSystem = null;
		this.renderer = null!;
		this.activePowerUps = new Map();

		this.grid = new Grid(this.config);
		this.entityManager = new EntityManager(this, this.grid);
		this.entityManager.initialize();
		this.uiManager = new UIManager(this.p5!, this);
		this.powerUpManager = new PowerUpManager(this);

		// Configure event listeners and resize handling
		this.setupEventListeners();
		this.setupResizeHandler();
	}

	/**
	 * Initializes p5.js, particle system, renderer, and input controller.
	 * Starts the game loop after setup.
	 * @param p5Instance - p5.js instance for rendering and input
	 */
	public setup(p5Instance: p5): void {
		this.p5 = p5Instance;
		this.uiManager = new UIManager(this.p5, this);
		this.powerUpManager = new PowerUpManager(this);
		this.renderer = new GameRenderer(p5Instance, this);
		this.particleSystem = new ParticleSystem(p5Instance, this);
		this.renderer.setup(); // Set up the canvas
		this.inputController.setup(p5Instance); // Set up input listeners
		this.startGameLoop(); // Begin custom animation loop
	}

	/**
	 * Starts the custom game loop using requestAnimationFrame.
	 * Updates game state and renders each frame.
	 */
	private startGameLoop(): void {
		const gameLoop = (currentTime: number) => {
			this.lastFrameTime = currentTime;
			if (this.p5) {
				this.update(); // Update game logic
				this.renderer.render(); // Render visuals
			}
			this.animationFrameId = window.requestAnimationFrame(gameLoop);
		};
		this.animationFrameId = window.requestAnimationFrame(gameLoop);
	}

	/**
	 * Stops the game loop by canceling the animation frame request.
	 * Used when the game ends or is paused externally.
	 */
	public stopGameLoop(): void {
		if (this.animationFrameId) {
			window.cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	public getEntityManager(): EntityManager {
		return this.entityManager;
	}

	public getUIManager(): UIManager {
		return this.uiManager;
	}

	/**
	 * Updates game state during the PLAYING state.
	 * Manages snake movement, collisions, power-up spawning, and badge updates.
	 */
	public update(): void {
		this.entityManager.update(); // Delegate entity updates
		this.debugPanel.update(this.p5!.millis());
		this.uiManager.update();
		this.powerUpManager.update();
	}

	/**
	 * Sets up event listeners for key game events.
	 * Clears existing listeners to avoid duplicates.
	 */
	private setupEventListeners(): void {
		this.events.clear();
		// Food collection: triggers particle effect and food respawn
		this.events.on(GameEvents.FOOD_COLLECTED, (data: FoodCollectedEventData) => {
			if (data && data.position) {
				this.particleSystem!.createFoodEffect(
					data.position,
					data.foodType,
					data.points,
					data.multiplier
				);
				this.entityManager.getFood().respawn([this.entityManager.getSnake()]);
			}
		});
		// Power-up collection: triggers particle effect
		this.events.on(GameEvents.POWER_UP_COLLECTED, (data: PowerUpCollectedEventData) => {
			if (data && data.position && data.powerUpType) {
				this.particleSystem!.createPowerUpEffect(data.position, data.powerUpType);
			}
		});
		// Collision: transitions to game over state
		this.events.on(GameEvents.COLLISION, (_data: CollisionEventData) => {
			this.stateMachine.transition(GameStates.GAME_OVER);
		});
	}

	/**
	 * Configures window resize handling for fullscreen mode.
	 * Adjusts grid and canvas dimensions on window resize.
	 */
	private setupResizeHandler(): void {
		window.addEventListener('resize', () => {
			if (this.config.board.preset === 'fullscreen') {
				this.grid.updateDimensions();
				if (this.p5) {
					this.p5.resizeCanvas(this.grid.getWidth(), this.grid.getHeight());
				}
			}
		});
	}

	/**
	 * Recreates the game with current configuration, resetting entities and canvas.
	 * Used for board size changes or full game resets.
	 * @returns True if successful, false if container is missing
	 */
	public recreate(): boolean {
		this.grid = new Grid(this.config);
		this.setup(this.p5!); // Reinitialize systems
		this.reset();

		const preset = this.config.board.presets[this.config.board.preset];
		this.p5!.resizeCanvas(preset.width, preset.height);

		const container = document.getElementById('snaked-again-container');
		if (!container) return false;
		container.style.width = `${preset.width}px`;
		container.style.height = `${preset.height}px`;
		container.style.position = 'absolute';
		container.style.left = '50%';
		container.style.top = '50%';
		container.style.transform = 'translate(-50%, -50%)';
		return true;
	}

	/**
	 * Resets game state to initial conditions.
	 * Recreates entities and rebinds event listeners.
	 */
	public reset(): void {
		this.entityManager.reset();
	}

	/**
	 * Applies a power-up effect to the snake and updates badges.
	 * Triggers a particle effect at the snake’s head.
	 * @param type - Type of power-up to apply
	 * @param powerUpPosition - Position where power-up was collected
	 */
	public applyPowerUp(type: PowerUpType, powerUpPosition: Position): void {
		const existingBadgeIndex = this.uiManager
			.getActiveBadges()
			.findIndex(badge => badge.getType() === type);

		if (existingBadgeIndex !== -1) {
			this.uiManager.getActiveBadges()[existingBadgeIndex].resetStartTime();
		} else {
			this.uiManager.addPowerUpBadge(type, powerUpPosition);
		}
		const position = this.entityManager.getSnake().segments[0];
		this.particleSystem!.createPowerUpEffect(position, type);
	}

	/**
	 * Retrieves the power-up manager for power-up spawning and application.
	 * @returns The power-up manager instance
	 */
	public getPowerUpManager(): PowerUpManager {
		return this.powerUpManager;
	}

	/** Getter for the grid instance */
	public getGrid(): Grid {
		return this.grid;
	}

	/** Getter for the game configuration */
	public getConfig(): GameConfig {
		return this.config;
	}

	/** Setter for the game configuration */
	public setConfig(config: GameConfig): void {
		this.config = config;
	}

	/** Getter for the state machine */
	public getStateMachine(): GameController {
		return this.stateMachine;
	}

	/** Getter for the debug panel */
	public getDebugPanel(): DebugPanel {
		return this.debugPanel;
	}

	/** Getter for active power-up badges */
	public getActiveBadges(): PowerUpBadge[] {
		return this.uiManager.getActiveBadges();
	}

	/** Getter for floating power-up badges */
	public getFloatingBadges(): PowerUpBadge[] {
		return this.uiManager.getFloatingBadges();
	}

	/** Getter for the particle system */
	public getParticleSystem(): ParticleSystem {
		return this.particleSystem!;
	}

	/** Getter for total play time */
	public getPlayTime(): number {
		return this.stateMachine.getPlayTime();
	}

	/** Getter for the event system */
	public getEvents(): EventSystem {
		return this.events;
	}

	/** Setter for the current power-up */
	public updatePowerUp(powerUp: PowerUp | null): void {
		this.entityManager.setPowerUp(powerUp);
	}

	/** Getter for the input controller */
	public getInputController(): InputController {
		return this.inputController;
	}

	/** Getter for p5 instance, used by EntityManager for timing */
	public getP5(): p5 | null {
		return this.p5;
	}
}

/** Global reference to the game instance for p5.js integration */
let game: Game;

// Initialize p5.js in instance mode with game setup and input delegation
new p5((p: p5) => {
	/**
	 * p5.js setup function: creates and initializes the game instance.
	 */
	p.setup = () => {
		game = new Game();
		game.setup(p);
	};

	/**
	 * p5.js draw function: empty as the custom game loop handles updates and rendering.
	 */
	p.draw = () => {};

	/**
	 * p5.js keyPressed function: delegates keyboard input to InputController.
	 */
	p.keyPressed = () => {
		if (!game) return; // Guard against uninitialized game
		const key = p.key;
		const isShiftPressed = p.keyIsDown(p.SHIFT);
		if ((key === '=' || key === '-') && isShiftPressed) {
			(window.event as Event).preventDefault();
		}
		game.getInputController().handleKeyPress(key, isShiftPressed);
	};

	/**
	 * p5.js touchStarted function: delegates touch start events to InputController.
	 * Explicitly types the event as TouchEvent | MouseEvent to match InputController.
	 */
	p.touchStarted = (event: TouchEvent | MouseEvent) => {
		if (!game) return false; // Guard against uninitialized game
		return game.getInputController().touchStarted(event);
	};

	/**
	 * p5.js touchEnded function: delegates touch end events to InputController.
	 * Explicitly types the event as TouchEvent | MouseEvent to match InputController.
	 */
	p.touchEnded = (event: TouchEvent | MouseEvent) => {
		if (!game) return false; // Guard against uninitialized game
		return game.getInputController().touchEnded(event);
	};
});
