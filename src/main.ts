// src/main.ts

// Import p5.js library for rendering and input handling in instance mode
import p5 from 'p5';
// Import configuration manager to load and manage game settings
import configManager from './config/gameConfig';

// Import core game systems and utilities
import { Grid } from './core/Grid'; // Handles grid layout and spatial calculations
import { DebugPanel } from './core/DebugPanel'; // Displays debug overlay with game stats
import { GameController } from './core/GameController'; // Manages game state transitions
import { GameStates } from './core/types'; // Defines possible game states (e.g., MENU, PLAYING)
import { EventSystem } from './core/EventSystem'; // Type-safe event system for game communication
import { Particles } from './core/Particles'; // Manages particle effects for visual feedback

// Import game entities with specific behaviors
import { Snake } from './entities/Snake'; // Player-controlled snake entity
import { Food } from './entities/Food'; // Collectible food items
import { PowerUp } from './entities/PowerUp'; // Power-up items with temporary effects
import { PowerUpBadge } from './entities/PowerUpBadge'; // UI badges for active power-ups

// Import type definitions and game configuration
import {
	GameConfig,
	GameEvents,
	PowerUpType,
	Position,
	FoodType,
	FoodCollectedEventData,
	PowerUpCollectedEventData,
	CollisionEventData,
} from './config/types'; // Core types and event constants
import { SnakeGame } from './types'; // Interface defining the game implementation

/**
 * Main game class implementing the SnakeGame interface.
 * Orchestrates game logic, rendering, input handling, and event management using p5.js.
 * Manages the snake, food, power-ups, and particle effects within a grid-based environment.
 */
export default class Game implements SnakeGame {
	/** Game configuration loaded from configManager, defining settings and rules */
	private config: GameConfig;

	/** Grid instance for spatial positioning and rendering of game elements */
	private grid: Grid;

	/** Event system for broadcasting and handling game events (e.g., food collection) */
	private events: EventSystem;

	/** State machine controlling game states (MENU, PLAYING, PAUSED, GAME_OVER) */
	private stateMachine: GameController;

	/** Debug panel for displaying runtime information and controls */
	private debugPanel: DebugPanel;

	/** Snake entity, publicly accessible for external interaction */
	public snake: Snake;

	/** Current food item on the grid for the snake to collect */
	private food: Food;

	/** Current power-up item on the grid, null if none active */
	private powerUp: PowerUp | null;

	/** p5.js instance for rendering and input, null until initialized */
	private p5: p5 | null;

	/** Particle system for visual effects (e.g., food collection, power-up pickup) */
	private particles: Particles | null;

	/** Map of active power-up badges, keyed by power-up type */
	private activePowerUps: Map<string, PowerUpBadge>;

	/** Array of persistent UI badges for active power-ups */
	private activeBadges: PowerUpBadge[];

	/** Array of temporary floating badges for power-up collection effects */
	private floatingBadges: PowerUpBadge[];

	/** Animation frame ID for the custom game loop, null when stopped */
	private animationFrameId: number | null = null;

	/** Timestamp of the last rendered frame for timing calculations */
	private lastFrameTime: number = 0;

	/** Scale factor for score text animation when points are scored */
	private scoreScale: number = 1;

	/** Horizontal wiggle offset for score animation */
	private scoreWiggle: number = 0;

	/** Start time of the score animation, 0 when inactive */
	private scoreAnimationTime: number = 0;

	/** Duration of the score animation in milliseconds */
	private readonly SCORE_ANIMATION_DURATION: number = 500;

	/**
	 * Initializes the game with configuration, core systems, and entities.
	 * Sets up the initial state without starting the rendering loop.
	 */
	constructor() {
		// Load configuration from local storage or defaults
		configManager.loadFromLocalStorage();
		this.config = configManager.getConfig();

		// Initialize core game systems
		this.events = new EventSystem(); // Event system for game-wide communication
		this.stateMachine = new GameController(this); // State machine tied to this game instance
		this.debugPanel = new DebugPanel(this); // Debug panel referencing this game

		// Set up the game grid and initial entities
		this.grid = new Grid(this.config); // Grid based on config dimensions
		this.snake = new Snake(this.grid, this); // Snake starting at grid center
		this.food = new Food(this.grid, this); // Initial food item

		// Initialize nullable properties
		this.powerUp = null; // No power-up active initially
		this.p5 = null; // p5 instance set in setup()
		this.particles = null; // Particles initialized in setup()
		this.activePowerUps = new Map(); // Map for tracking power-up badges
		this.floatingBadges = []; // List for floating badge effects
		this.activeBadges = []; // List for persistent UI badges

		// Configure event listeners and resize handling
		this.setupEventListeners();
		this.setupResizeHandler();
	}

	/**
	 * Sets up event listeners for key game events like food collection and collisions.
	 * Clears existing listeners to prevent duplicates and ensure clean state.
	 */
	private setupEventListeners(): void {
		this.events.clear(); // Remove any prior listeners to avoid stacking

		// Listener for food collection: triggers particle effect and food respawn
		this.events.on(GameEvents.FOOD_COLLECTED, (data: FoodCollectedEventData) => {
			if (data && data.position) {
				// Create particle effect for food collection
				this.particles!.createFoodEffect(
					data.position,
					data.foodType,
					data.points,
					data.multiplier
				);
				// Respawn food after effect to avoid overlap
				this.food.respawn([this.snake]);
			}
		});

		// Listener for power-up collection: triggers particle effect
		this.events.on(GameEvents.POWER_UP_COLLECTED, (data: PowerUpCollectedEventData) => {
			if (data && data.position && data.powerUpType) {
				this.particles!.createPowerUpEffect(data.position, data.powerUpType);
			}
		});

		// Listener for collision: transitions to game over state
		this.events.on(GameEvents.COLLISION, (_data: CollisionEventData) => {
			this.stateMachine.transition(GameStates.GAME_OVER);
		});
	}

	/**
	 * Configures window resize handling for fullscreen mode.
	 * Adjusts grid and canvas dimensions dynamically when the window size changes.
	 */
	private setupResizeHandler(): void {
		window.addEventListener('resize', () => {
			// Only handle resize in fullscreen mode to match window size
			if (this.config.board.preset === 'fullscreen') {
				this.grid.updateDimensions(); // Recalculate grid dimensions
				if (this.p5) {
					this.p5.resizeCanvas(this.grid.getWidth(), this.grid.getHeight()); // Resize canvas
				}
			}
		});
	}

	/**
	 * Repositions UI badges for active power-ups based on grid cell size.
	 * Ensures badges are evenly spaced along the top of the screen.
	 */
	private repositionBadges(): void {
		const cellSize = this.grid.getCellSize();
		const badgeSize = cellSize * (cellSize < 20 ? 2.0 : 1.2); // Scale badge size for readability
		const badgeSpacing = cellSize * 0.4; // Space between badges
		const margin = cellSize; // Margin from screen edges

		this.activeBadges.forEach((badge, index) => {
			const newX = margin + index * (badgeSize + badgeSpacing); // Calculate horizontal position
			badge.setPosition(newX, margin); // Update badge position
		});
	}

	/**
	 * Initializes the p5.js canvas and starts the game loop.
	 * Called by p5’s setup function to prepare the rendering environment.
	 * @param p5Instance - p5.js instance for rendering and input handling
	 */
	public setup(p5Instance: p5): void {
		this.p5 = p5Instance; // Store p5 instance for rendering
		const canvas = p5Instance.createCanvas(this.grid.getWidth(), this.grid.getHeight()); // Create canvas
		canvas.parent('snaked-again-container'); // Attach to DOM container
		this.particles = new Particles(p5Instance, this); // Initialize particle system
		this.startGameLoop(); // Begin custom animation loop
	}

	/**
	 * Starts the custom game loop using requestAnimationFrame.
	 * Provides smooth updates and rendering, bypassing p5’s default loop.
	 */
	private startGameLoop(): void {
		const gameLoop = (currentTime: number) => {
			this.lastFrameTime = currentTime; // Track last frame time

			// Update and render only if p5 is initialized
			if (this.p5) {
				this.update(); // Update game state
				this.draw(); // Render current frame
			}

			// Schedule next frame
			this.animationFrameId = window.requestAnimationFrame(gameLoop);
		};

		// Initiate the first frame
		this.animationFrameId = window.requestAnimationFrame(gameLoop);
	}

	/**
	 * Stops the game loop by canceling the animation frame request.
	 * Cleans up resources when the game ends or is paused externally.
	 */
	public stopGameLoop(): void {
		if (this.animationFrameId) {
			window.cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null; // Clear frame ID
		}
	}

	/**
	 * Updates the game state during the PLAYING state.
	 * Manages snake movement, collisions, power-up spawning, and badge updates.
	 */
	public update(): void {
		if (!this.stateMachine.isInState(GameStates.PLAYING)) return; // Skip unless in PLAYING state
		const currentTime = this.p5!.millis(); // Current time for timing logic
		this.debugPanel.update(currentTime); // Update debug stats

		// Update snake and check for interactions
		if (this.snake.update(currentTime)) {
			if (this.snake.checkCollision()) {
				// Emit collision event if snake hits wall or self
				this.events.emit(GameEvents.COLLISION, {
					position: this.snake.segments[0], // Only position is needed
				});
				return;
			}
			if (this.snake.checkFoodCollision(this.food)) {
				this.snake.grow(); // Grow snake on food collection
				const basePoints = this.food.getPoints();
				const multiplier = this.snake.getPointsMultiplier();
				const finalPoints = basePoints * multiplier;
				this.stateMachine.updateScore(finalPoints); // Update score
				this.events.emit(GameEvents.FOOD_COLLECTED, {
					position: this.food.getPosition(),
					points: basePoints,
					multiplier,
					foodType: this.food.getType(),
				});
				this.scoreAnimationTime = currentTime; // Start score animation
			}
			if (this.powerUp && this.snake.checkPowerUpCollision(this.powerUp)) {
				this.snake.addEffect(this.powerUp.type); // Apply power-up effect
				this.applyPowerUp(this.powerUp.type, this.powerUp.position);
				this.events.emit(GameEvents.POWER_UP_COLLECTED, {
					powerUpType: this.powerUp.type,
					position: this.powerUp.position,
				});
				this.powerUp = null; // Remove collected power-up
			}
		}

		// Randomly spawn power-up based on difficulty settings
		const difficulty = this.config.difficulty.presets[this.config.difficulty.current];
		if (!this.powerUp && Math.random() < difficulty.powerUpChance) {
			this.powerUp = new PowerUp(this.grid, [this.snake, this.food]);
		}

		// Update and filter badges (remove expired ones)
		this.activeBadges = this.activeBadges.filter(badge => badge.update());
		this.repositionBadges();
		this.floatingBadges = this.floatingBadges.filter(badge => badge.update());
	}

	/**
	 * Renders the current game state based on the state machine.
	 * Draws the grid, entities, UI elements, and particles as needed.
	 */
	public draw(): void {
		if (!this.p5) return; // Skip rendering if p5 isn’t initialized

		this.p5.clear(); // Clear canvas for new frame

		// Render based on current game state
		switch (this.stateMachine.getState()) {
			case GameStates.MENU:
				this.drawMenu(); // Show menu screen
				break;
			case GameStates.PLAYING:
				this.drawGame(); // Render active gameplay
				break;
			case GameStates.PAUSED:
				this.drawGame(); // Draw game with pause overlay
				this.drawPauseOverlay();
				break;
			case GameStates.GAME_OVER:
				this.drawGame(); // Draw game with game over screen
				this.drawGameOver();
				break;
		}

		// Always update and draw particles if initialized
		if (this.particles) {
			this.particles.update();
			this.particles.draw();
		}
	}

	/**
	 * Renders the main gameplay visuals: grid, entities, badges, score, and debug panel.
	 */
	private drawGame(): void {
		const currentTime = this.p5!.millis();
		this.grid.drawBackground(this.p5!); // Draw grid background
		this.grid.drawGridLines(this.p5!); // Draw grid lines if enabled

		// Render game entities
		this.food.draw(this.p5!);
		if (this.powerUp) {
			this.powerUp.draw(this.p5!); // Draw power-up if present
		}

		// Draw snake and handle particle effects
		this.snake.draw(this.p5!, currentTime);
		this.particles!.update();
		this.particles!.draw();

		// Draw UI badges for active power-ups
		for (const [type, badge] of this.activePowerUps) {
			if (!badge.update()) {
				this.activePowerUps.delete(type); // Remove expired badges
				continue;
			}
			badge.draw();
		}

		// Render all persistent and floating badges
		this.activeBadges.forEach(badge => badge.draw());
		this.floatingBadges.forEach(badge => badge.draw());

		this.drawScore(); // Render animated score
		this.debugPanel.draw(this.p5!); // Render debug overlay
	}

	/**
	 * Renders the main menu screen with title, high score, and instructions.
	 */
	private drawMenu(): void {
		const p5 = this.p5!;
		p5.fill(255); // White text
		p5.textSize(32);
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.text('Snake Zero', this.grid.getWidth() / 2, this.grid.getHeight() / 2 - 60); // Title

		p5.textSize(20);
		p5.text(
			`High Score: ${this.stateMachine.getCurrentHighScore()}`,
			this.grid.getWidth() / 2,
			this.grid.getHeight() / 2
		); // Display high score
		p5.text('Press SPACE to Start', this.grid.getWidth() / 2, this.grid.getHeight() / 2 + 40); // Start prompt

		p5.textSize(16);
		p5.text(
			'Use Arrow Keys or WASD to move',
			this.grid.getWidth() / 2,
			this.grid.getHeight() / 2 + 80
		); // Control instructions
	}

	/**
	 * Renders a minimal pause overlay in the top-right corner.
	 */
	private drawPauseOverlay(): void {
		const p5 = this.p5!;
		p5.fill(255); // White text
		p5.textSize(16);
		p5.textAlign(p5.RIGHT, p5.TOP);
		p5.text('PAUSED', this.grid.getWidth() - 10, -10); // Small pause indicator
	}

	/**
	 * Renders the game over screen with final score and restart options.
	 */
	private drawGameOver(): void {
		const p5 = this.p5!;
		p5.fill(0, 0, 0, 200); // Semi-transparent black overlay
		p5.rect(0, 0, this.grid.getWidth(), this.grid.getHeight());

		p5.fill(255); // White text
		p5.textSize(32);
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.text('Game Over!', this.grid.getWidth() / 2, this.grid.getHeight() / 2 - 40); // Game over message

		p5.textSize(24);
		p5.text(
			`Score: ${this.stateMachine.getCurrentScore()}`,
			this.grid.getWidth() / 2,
			this.grid.getHeight() / 2 + 10
		); // Final score
		if (this.stateMachine.getCurrentScore() === this.stateMachine.getCurrentHighScore()) {
			p5.text('New High Score!', this.grid.getWidth() / 2, this.grid.getHeight() / 2 + 40); // High score notice
		}

		p5.textSize(16);
		p5.text('Press SPACE to Restart', this.grid.getWidth() / 2, this.grid.getHeight() / 2 + 80); // Restart prompt
		p5.text('Press ESC for Menu', this.grid.getWidth() / 2, this.grid.getHeight() / 2 + 110); // Menu prompt
	}

	/**
	 * Renders the current score with animation effects (scale and wiggle) when updated.
	 */
	private drawScore(): void {
		const p5 = this.p5!;
		p5.push(); // Save drawing state
		p5.textFont('Press Start 2P'); // Arcade-style font
		p5.textAlign(p5.CENTER, p5.TOP);
		p5.textSize(80 * this.scoreScale); // Animated text size
		p5.strokeWeight(4);
		p5.stroke(0); // Black outline for contrast
		p5.fill(255, 255, 255); // White fill
		p5.drawingContext.shadowBlur = 10;
		p5.drawingContext.shadowColor = 'rgba(255, 255, 0, 0.8)'; // Yellow glow effect

		const x = this.grid.getWidth() / 2 + this.scoreWiggle; // Center with wiggle offset
		const y = 20; // Top position
		p5.text(this.stateMachine.getCurrentScore(), x, y); // Draw current score

		// Animate score when points are added (scale up and wiggle)
		if (this.scoreAnimationTime > 0) {
			const elapsed = p5.millis() - this.scoreAnimationTime;
			if (elapsed < this.SCORE_ANIMATION_DURATION) {
				const t = elapsed / this.SCORE_ANIMATION_DURATION;
				p5.drawingContext.shadowBlur = 100; // Intense glow during animation
				this.scoreScale = 1 + (2 - 1) * (1 - t * t); // Quadratic ease-out from 2x to 1x
				this.scoreWiggle = 10 * (1 - t) * Math.sin(t * 40); // Fast, decaying shake
			} else {
				this.scoreScale = 1; // Reset scale
				this.scoreWiggle = 0; // Reset wiggle
				this.scoreAnimationTime = 0; // End animation
			}
		}

		p5.drawingContext.shadowBlur = 0; // Clear glow effect
		p5.pop(); // Restore drawing state
	}

	/**
	 * Handles keyboard input for game controls and state transitions.
	 * @param key - The key pressed by the user
	 * @param isShiftPressed - Whether the Shift key is held (default: false)
	 */
	public handleInput(key: string, isShiftPressed: boolean = false): void {
		// Let debug panel handle input first (e.g., debug shortcuts)
		if (this.debugPanel.handleInput(key, isShiftPressed)) {
			return;
		}

		// Handle input based on current game state
		switch (this.stateMachine.getState()) {
			case GameStates.MENU:
				if (key === ' ') {
					this.stateMachine.transition(GameStates.PLAYING); // Start game
				}
				break;

			case GameStates.PLAYING:
				if (key === ' ') {
					this.stateMachine.transition(GameStates.PAUSED); // Pause game
				} else if (key === 'Escape') {
					this.stateMachine.transition(GameStates.MENU); // Return to menu
				} else {
					const controls = this.config.snake.controls;
					// Handle snake movement controls
					if (controls.up.includes(key)) {
						this.snake.setDirection('up');
					} else if (controls.down.includes(key)) {
						this.snake.setDirection('down');
					} else if (controls.left.includes(key)) {
						this.snake.setDirection('left');
					} else if (controls.right.includes(key)) {
						this.snake.setDirection('right');
					}
				}
				break;

			case GameStates.PAUSED:
				if (key === ' ') {
					this.stateMachine.transition(GameStates.PLAYING); // Resume game
				} else if (key === 'Escape') {
					this.stateMachine.transition(GameStates.MENU); // Return to menu
				}
				break;

			case GameStates.GAME_OVER:
				if (key === ' ') {
					this.stateMachine.transition(GameStates.MENU); // Restart via menu
				} else if (key === 'Escape') {
					this.stateMachine.transition(GameStates.MENU); // Back to menu
				}
				break;
		}
	}

	/**
	 * Recreates the game with the current configuration, resizing the canvas and resetting entities.
	 * Used for board size changes or full resets.
	 * @returns True if recreation succeeds, false if container is missing
	 */
	public recreate(): boolean {
		this.grid = new Grid(this.config); // Recreate grid with updated config
		this.setup(this.p5!); // Reinitialize canvas and particles

		this.reset(); // Reset game entities to initial state

		// Resize canvas to match new grid dimensions
		const preset = this.config.board.presets[this.config.board.preset];
		this.p5!.resizeCanvas(preset.width, preset.height);

		// Center the canvas in its container
		const container = document.getElementById('snaked-again-container');
		if (!container) return false; // Fail if container isn’t found

		container.style.width = `${preset.width}px`;
		container.style.height = `${preset.height}px`;
		container.style.position = 'absolute';
		container.style.left = '50%';
		container.style.top = '50%';
		container.style.transform = 'translate(-50%, -50%)'; // Center horizontally and vertically

		return true;
	}

	/**
	 * Resets the game state to initial conditions, recreating entities and listeners.
	 */
	public reset(): void {
		this.snake = new Snake(this.grid, this); // New snake instance
		this.food = new Food(this.grid, this); // New food instance
		this.powerUp = null; // Clear any active power-up
		this.setupEventListeners(); // Rebind event listeners
	}

	/**
	 * Applies a power-up effect to the snake and triggers a particle effect.
	 * Updates or adds a badge for the power-up.
	 * @param type - Type of power-up to apply
	 * @param powerUpPosition - Position where power-up was collected
	 */
	public applyPowerUp(type: PowerUpType, powerUpPosition: Position): void {
		const existingBadgeIndex = this.activeBadges.findIndex(badge => badge.getType() === type);
		if (existingBadgeIndex !== -1) {
			const badge = this.activeBadges[existingBadgeIndex];
			badge.resetStartTime(); // Refresh existing badge duration
		} else {
			this.addPowerUpBadge(type, powerUpPosition); // Add new badge if none exists
		}
		const position = this.snake.segments[0]; // Use snake head for effect
		this.particles!.createPowerUpEffect(position, type); // Trigger power-up particle effect
	}

	/**
	 * Adds a power-up badge to the UI and creates a floating badge effect at the collection point.
	 * @param type - Type of power-up for the badge
	 * @param powerUpPosition - Position where power-up was collected
	 */
	public addPowerUpBadge(type: PowerUpType, powerUpPosition: Position): void {
		const config = this.config.powerUps.badges;
		const cellSize = this.grid.getCellSize();
		const badgeSize = cellSize * (cellSize < 20 ? 2.0 : 1.2); // UI badge size
		const floatingBadgeSize = cellSize * (cellSize < 20 ? 2.5 : 1.8); // Floating badge size
		const badgeSpacing = cellSize * 0.4; // Spacing between UI badges
		const margin = cellSize; // Margin from screen edge
		const powerUpPos = this.grid.getCellCenter(powerUpPosition); // Center of power-up cell

		// Create UI badge at calculated position
		const initialX = margin + this.activeBadges.length * (badgeSize + badgeSpacing);
		const uiBadge = new PowerUpBadge(
			this.p5!,
			type,
			{
				...this.config.powerUps,
				colors: this.config.powerUps.colors,
				icons: this.config.powerUps.icons,
				effects: this.config.powerUps.effects,
				badges: {
					...config,
					duration: this.config.powerUps.effects[type].duration, // Duration from config
					size: badgeSize,
					hoverAmplitude: cellSize * config.hoverAmplitude,
					hoverFrequency: config.hoverFrequency || 2,
					popInDuration: config.popInDuration || 300,
					popInScale: config.popInScale || 1.2,
				},
			},
			initialX, // Horizontal position based on badge count
			margin, // Vertical position at top
			false // Not floating
		);
		this.activeBadges.push(uiBadge);

		// Create floating badge at power-up position
		const floatingBadge = new PowerUpBadge(
			this.p5!,
			type,
			{
				...this.config.powerUps,
				badges: {
					...config,
					duration: 1500, // Short duration for floating effect
					size: floatingBadgeSize,
					hoverAmplitude: cellSize * config.hoverAmplitude,
					hoverFrequency: config.hoverFrequency || 2,
				},
			},
			powerUpPos.x, // Start at power-up’s x position
			powerUpPos.y, // Start at power-up’s y position
			true // Floating badge
		);
		this.floatingBadges.push(floatingBadge);

		this.repositionBadges(); // Update badge positions
	}

	/** Getter for the snake instance */
	public getSnake(): Snake {
		return this.snake;
	}

	/** Getter for the grid instance */
	public getGrid(): Grid {
		return this.grid;
	}

	/** Getter for the food instance */
	public getFood(): Food {
		return this.food;
	}

	/** Getter for the current power-up */
	public getPowerUp(): PowerUp | null {
		return this.powerUp;
	}

	/** Getter for the game configuration */
	public getConfig(): GameConfig {
		return this.config;
	}

	/** Setter for the game configuration */
	public setConfig(config: GameConfig): void {
		this.config = config;
	}

	/** Getter for the current score */
	public getCurrentScore(): number {
		return this.stateMachine.getCurrentScore();
	}

	/** Getter for the high score */
	public getCurrentHighScore(): number {
		return this.stateMachine.getCurrentHighScore();
	}

	/** Getter for the total play time */
	public getPlayTime(): number {
		return this.stateMachine.getPlayTime();
	}

	/** Getter for the event system */
	public getEvents(): EventSystem {
		return this.events;
	}

	/** Setter for the current power-up */
	public updatePowerUp(powerUp: PowerUp | null): void {
		this.powerUp = powerUp;
	}
}

// Global variables for touch controls
let game: Game; // Global reference to the game instance
let touchStartX = 0; // X-coordinate of touch start
let touchStartY = 0; // Y-coordinate of touch start
const MIN_SWIPE_DISTANCE = 30; // Minimum distance for a swipe to register movement

// Prevent default touch behavior to avoid scrolling or zooming
document.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

/**
 * Handles touch start events for mobile controls.
 * Records the starting touch position for swipe detection.
 * @param event - Touch or mouse event from p5
 * @returns False to prevent default behavior
 */
function touchStarted(event: TouchEvent | MouseEvent): boolean {
	if (!game) return false; // Ignore if game isn’t initialized

	// Extract client coordinates from touch or mouse event
	const clientX = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
	const clientY = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;

	// Store touch start position
	touchStartX = clientX;
	touchStartY = clientY;

	event.preventDefault(); // Prevent default browser behavior
	return false;
}

/**
 * Handles touch end events to detect swipes for mobile snake control.
 * Updates snake direction based on swipe direction and distance.
 * @param event - Touch or mouse event from p5
 * @returns False to prevent default behavior
 */
function touchEnded(event: TouchEvent | MouseEvent): boolean {
	if (!game) return false; // Ignore if game isn’t initialized

	// Extract client coordinates from touch or mouse event
	const clientX = event instanceof TouchEvent ? event.changedTouches[0].clientX : event.clientX;
	const clientY = event instanceof TouchEvent ? event.changedTouches[0].clientY : event.clientY;

	// Calculate swipe distance
	const deltaX = clientX - touchStartX;
	const deltaY = clientY - touchStartY;

	// Detect swipe direction if distance exceeds threshold
	if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE || Math.abs(deltaY) > MIN_SWIPE_DISTANCE) {
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			// Horizontal swipe
			game.snake.setDirection(deltaX > 0 ? 'right' : 'left');
		} else {
			// Vertical swipe
			game.snake.setDirection(deltaY > 0 ? 'down' : 'up');
		}
	}

	event.preventDefault(); // Prevent default browser behavior
	return false;
}

// Initialize p5.js in instance mode with game setup and input handling
new p5((p: p5) => {
	/**
	 * p5.js setup function: initializes the game and canvas.
	 */
	p.setup = () => {
		game = new Game(); // Create global game instance
		game.setup(p); // Set up canvas and start game loop
	};

	/**
	 * p5.js draw function: intentionally empty as we use requestAnimationFrame.
	 */
	p.draw = () => {
		// Left empty—game loop handled by startGameLoop for precise control
	};

	/**
	 * p5.js keyPressed function: handles keyboard input events.
	 */
	p.keyPressed = () => {
		if (!game) return; // Ignore if game isn’t initialized

		const key = p.key; // Get pressed key
		const isShiftPressed = p.keyIsDown(p.SHIFT); // Check Shift key state

		// Prevent browser zoom on Shift + =/-
		if ((key === '=' || key === '-') && isShiftPressed) {
			(window.event as Event).preventDefault();
		}

		// Delegate input handling to game instance
		game.handleInput(key, isShiftPressed);
	};

	// Assign touch handlers for mobile controls
	p.touchStarted = touchStarted;
	p.touchEnded = touchEnded;
});
