import p5 from 'p5';
import configManager from './config/gameConfig';

import { Grid } from './core/Grid';
import { DebugPanel } from './core/DebugPanel';
import { GameController } from './core/GameController';
import { GameStates } from './core/types';
import { EventSystem } from './core/EventSystem';
import { Particles } from './core/Particles';

import { Snake } from './entities/Snake';
import { Food } from './entities/Food';
import { PowerUp } from './entities/PowerUp';
import { PowerUpBadge } from './entities/PowerUpBadge';

// import { GameConfig } from './config/gameConfig';
import { GameConfig, GameEvents, PowerUpType, Position } from './config/types';
import { SnakeGame } from './types';

export default class Game implements SnakeGame {
	private config: GameConfig;
	private grid: Grid;
	private events: EventSystem;
	private stateMachine: GameController;
	private debugPanel: DebugPanel;
	public snake: Snake;
	private food: Food;
	private powerUp: PowerUp | null;
	private p5: p5 | null;
	private particles: Particles | null;
	private activePowerUps: Map<string, PowerUpBadge>;
	private activeBadges: PowerUpBadge[];
	private floatingBadges: PowerUpBadge[];
	private animationFrameId: number | null = null;
	private lastFrameTime: number = 0;

	private scoreScale: number = 1; // Base scale for animation
	private scoreWiggle: number = 0; // Wiggle offset
	private scoreAnimationTime: number = 0; // Tracks animation duration
	private readonly SCORE_ANIMATION_DURATION: number = 500; // 500ms animation

	constructor() {
		configManager.loadFromLocalStorage();
		this.config = configManager.getConfig();

		this.events = new EventSystem();
		this.stateMachine = new GameController(this);
		this.debugPanel = new DebugPanel(this);

		this.grid = new Grid(this.config);
		this.snake = new Snake(this.grid, this);
		this.food = new Food(this.grid, this);

		this.powerUp = null;
		this.p5 = null;
		this.particles = null;
		this.activePowerUps = new Map();
		this.floatingBadges = [];
		this.activeBadges = [];

		this.setupEventListeners();
		this.setupResizeHandler();
	}

	private setupEventListeners(): void {
		// Clear existing listeners first
		this.events.clear();

		// Set up event listeners
		this.events.on(GameEvents.FOOD_COLLECTED, data => {
			if (data && data.position) {
				// Get food color before respawning
				const foodColor = this.food.getColor();
				// Create food collection effect with the current food color and points
				this.particles!.createFoodEffect(
					data.position,
					foodColor,
					data.points,
					data.multiplier,
					data.foodType
				);
				// Respawn food after creating effect
				this.food.respawn([this.snake]);
			}
		});

		this.events.on(GameEvents.POWER_UP_COLLECTED, data => {
			// Create power-up collection effect at the collected power-up position
			if (data && data.position && data.powerUpType) {
				this.particles!.createPowerUpEffect(data.position, data.powerUpType);
			}
		});

		this.events.on(GameEvents.COLLISION, () => {
			this.stateMachine.transition(GameStates.GAME_OVER);
		});
	}

	private setupResizeHandler(): void {
		window.addEventListener('resize', () => {
			// Only handle resize in fullscreen mode
			if (this.config.board.preset === 'fullscreen') {
				// Update grid dimensions
				this.grid.updateDimensions();

				// Update canvas size
				if (this.p5) {
					this.p5.resizeCanvas(this.grid.getWidth(), this.grid.getHeight());
				}
			}
		});
	}

	private repositionBadges(): void {
		const cellSize = this.grid.getCellSize();
		const badgeSize = cellSize * (cellSize < 20 ? 2.0 : 1.2);
		const badgeSpacing = cellSize * 0.4;
		const margin = cellSize;

		this.activeBadges.forEach((badge, index) => {
			const newX = margin + index * (badgeSize + badgeSpacing);
			badge.setPosition(newX, margin);
		});
	}
	/**
	 * Initializes p5.js canvas and setup.
	 * @param {p5} p5 - p5.js instance
	 */
	setup(p5: p5): void {
		this.p5 = p5;
		const canvas = p5.createCanvas(this.grid.getWidth(), this.grid.getHeight());
		canvas.parent('snaked-again-container');
		this.particles = new Particles(p5, this.grid, this);
		this.startGameLoop();
	}

	private startGameLoop(): void {
		const gameLoop = (currentTime: number) => {
			this.lastFrameTime = currentTime;

			// Only update if p5 is available
			if (this.p5) {
				this.update();
				this.draw();
			}

			// Continue the animation loop
			this.animationFrameId = window.requestAnimationFrame(gameLoop);
		};

		// Start the first iteration
		this.animationFrameId = window.requestAnimationFrame(gameLoop);
	}

	stopGameLoop(): void {
		if (this.animationFrameId) {
			window.cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	/**
	 * Updates game state, including snake movement, collisions, and power-ups.
	 */
	update(): void {
		if (!this.stateMachine.isInState(GameStates.PLAYING)) return;
		const currentTime = this.p5!.millis();
		this.debugPanel.update(currentTime);

		if (this.snake.update(currentTime)) {
			if (this.snake.checkCollision()) {
				this.events.emit(GameEvents.COLLISION, { position: this.snake.segments[0] });
				return;
			}
			if (this.snake.checkFoodCollision(this.food)) {
				this.snake.grow();
				const basePoints = this.food.getPoints();
				const multiplier = this.snake.getPointsMultiplier();
				const finalPoints = basePoints * multiplier;
				this.stateMachine.updateScore(finalPoints);
				this.events.emit(GameEvents.FOOD_COLLECTED, {
					position: this.food.getPosition(),
					points: basePoints,
					multiplier: multiplier,
					foodType: this.food.getType(),
				});
				this.events.emit(GameEvents.SCORE_CHANGED, {
					score: this.stateMachine.getCurrentScore(),
				});
				this.scoreAnimationTime = currentTime;
			}
			if (this.powerUp && this.snake.checkPowerUpCollision(this.powerUp)) {
				this.snake.addEffect(this.powerUp.type);
				this.applyPowerUp(this.powerUp.type, this.powerUp.position); // Updated from currentPosition
				this.events.emit(GameEvents.POWER_UP_COLLECTED, {
					powerUpType: this.powerUp.type,
					position: this.powerUp.position, // Updated from currentPosition
				});
				this.powerUp = null;
			}
		}

		const difficulty = this.config.difficulty.presets[this.config.difficulty.current];
		if (!this.powerUp && Math.random() < difficulty.powerUpChance) {
			this.powerUp = new PowerUp(this.grid, [this.snake, this.food]);
		}

		this.activeBadges = this.activeBadges.filter(badge => badge.update());
		this.repositionBadges();
		this.floatingBadges = this.floatingBadges.filter(badge => badge.update());
	}

	/**
	 * Draws the current game state based on the game state machine.
	 */
	draw(): void {
		if (this.p5) {
			this.p5.clear();

			switch (this.stateMachine.getState()) {
				case GameStates.MENU:
					this.drawMenu();
					break;
				case GameStates.PLAYING:
					this.drawGame();
					break;
				case GameStates.PAUSED:
					this.drawGame();
					this.drawPauseOverlay();
					break;
				case GameStates.GAME_OVER:
					this.drawGame();
					this.drawGameOver();
					break;
			}

			// Update and draw particles
			if (this.particles) {
				this.particles.update();
				this.particles.draw();
			}
		}
	}

	/**
	 * Draws the main game elements (snake, food, power-ups, score, debug).
	 * @private
	 */
	private drawGame(): void {
		const currentTime = this.p5!.millis();
		this.grid.drawBackground(this.p5!);
		this.grid.drawGridLines(this.p5!);

		// Draw game entities
		this.food.draw(this.p5!);
		if (this.powerUp) {
			this.powerUp.draw(this.p5!);
		}

		// Draw snake and update particle effects
		this.snake.draw(this.p5!, currentTime);
		this.particles!.update();
		this.particles!.draw();

		// Draw active powerup badges in UI
		for (const [type, badge] of this.activePowerUps) {
			if (!badge.update()) {
				this.activePowerUps.delete(type);
				continue;
			}
			badge.draw();
		}

		this.activeBadges.forEach(badge => badge.draw());
		this.floatingBadges.forEach(badge => badge.draw());

		this.drawScore();
		this.debugPanel.draw(this.p5!);
	}

	/**
	 * Draws the main menu screen.
	 * @private
	 */
	private drawMenu(): void {
		const p5 = this.p5!;
		p5.fill(255);
		p5.textSize(32);
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.text('Snake Zero', this.grid.getWidth() / 2, this.grid.getHeight() / 2 - 60);

		p5.textSize(20);
		p5.text(
			`High Score: ${this.stateMachine.getCurrentHighScore()}`,
			this.grid.getWidth() / 2,
			this.grid.getHeight() / 2
		);
		p5.text('Press SPACE to Start', this.grid.getWidth() / 2, this.grid.getHeight() / 2 + 40);

		p5.textSize(16);
		p5.text(
			'Use Arrow Keys or WASD to move',
			this.grid.getWidth() / 2,
			this.grid.getHeight() / 2 + 80
		);
	}

	/**
	 * Draws the pause overlay.
	 * @private
	 */
	private drawPauseOverlay(): void {
		const p5 = this.p5!;

		// Small pause indicator in top-right corner
		p5.fill(255);
		p5.textSize(16);
		p5.textAlign(p5.RIGHT, p5.TOP);
		p5.text('PAUSED', this.grid.getWidth() - 10, -10);
	}

	/**
	 * Draws the game over screen.
	 * @private
	 */
	private drawGameOver(): void {
		const p5 = this.p5!;
		p5.fill(0, 0, 0, 200);
		p5.rect(0, 0, this.grid.getWidth(), this.grid.getHeight());

		p5.fill(255);
		p5.textSize(32);
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.text('Game Over!', this.grid.getWidth() / 2, this.grid.getHeight() / 2 - 40);

		p5.textSize(24);
		p5.text(
			`Score: ${this.stateMachine.getCurrentHighScore()}`,
			this.grid.getWidth() / 2,
			this.grid.getHeight() / 2 + 10
		);
		if (this.stateMachine.getCurrentHighScore() === this.stateMachine.getCurrentHighScore()) {
			p5.text('New High Score!', this.grid.getWidth() / 2, this.grid.getHeight() / 2 + 40);
		}

		p5.textSize(16);
		p5.text('Press SPACE to Restart', this.grid.getWidth() / 2, this.grid.getHeight() / 2 + 80);
		p5.text('Press ESC for Menu', this.grid.getWidth() / 2, this.grid.getHeight() / 2 + 110);
	}

	/**
	 * Draws the current score.
	 * @private
	 */
	private drawScore(): void {
		const p5 = this.p5!;
		p5.push();
		p5.textFont('Press Start 2P'); // Arcade font
		p5.textAlign(p5.CENTER, p5.TOP);
		p5.textSize(80 * this.scoreScale); // Bold, scales instantly
		p5.strokeWeight(4);
		p5.stroke(0); // Black outline
		p5.fill(255, 255, 255); // Bright yellow
		p5.drawingContext.shadowBlur = 10;
		p5.drawingContext.shadowColor = 'rgba(255, 255, 0, 0.8)';

		const x = this.grid.getWidth() / 2 + this.scoreWiggle;
		const y = 20;
		p5.text(this.stateMachine.getCurrentScore(), x, y);

		// Flash effect for immediacy
		if (this.scoreAnimationTime > 0) {
			const elapsed = p5.millis() - this.scoreAnimationTime;
			if (elapsed < this.SCORE_ANIMATION_DURATION) {
				const t = elapsed / this.SCORE_ANIMATION_DURATION;
				p5.drawingContext.shadowBlur = 100;
				// Quick scale back from 2 to 1
				this.scoreScale = 1 + (2 - 1) * (1 - t * t); // Quadratic ease-out for snap
				// Intense, fast shake that decays
				this.scoreWiggle = 10 * (1 - t) * Math.sin(t * 40); // High frequency shake
			} else {
				this.scoreScale = 1;
				this.scoreWiggle = 0;
				this.scoreAnimationTime = 0;
			}
		}

		p5.drawingContext.shadowBlur = 0;
		p5.pop();
	}

	/**
	 * Handles keyboard input for the game.
	 * @param {string} key - The key that was pressed
	 * @param {boolean} [isShiftPressed=false] - Whether shift key is pressed
	 */
	handleInput(key: string, isShiftPressed: boolean = false): void {
		// Handle debug panel input first
		if (this.debugPanel.handleInput(key, isShiftPressed)) {
			return;
		}

		switch (this.stateMachine.getState()) {
			case GameStates.MENU:
				if (key === ' ') {
					this.stateMachine.transition(GameStates.PLAYING);
				}
				break;

			case GameStates.PLAYING:
				if (key === ' ') {
					this.stateMachine.transition(GameStates.PAUSED);
				} else if (key === 'Escape') {
					this.stateMachine.transition(GameStates.MENU);
				} else {
					const controls = this.config.snake.controls;
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
					this.stateMachine.transition(GameStates.PLAYING);
				} else if (key === 'Escape') {
					this.stateMachine.transition(GameStates.MENU);
				}
				break;

			case GameStates.GAME_OVER:
				if (key === ' ') {
					this.stateMachine.transition(GameStates.MENU);
				} else if (key === 'Escape') {
					this.stateMachine.transition(GameStates.MENU);
				}
				break;
		}
	}

	/**
	 * Recreates the game with current configuration.
	 * @private
	 */
	public recreate(): boolean {
		// Create new grid with updated config
		this.grid = new Grid(this.config);

		this.setup(this.p5!);

		// Reset game elements
		this.reset();

		// Resize canvas
		const preset = this.config.board.presets[this.config.board.preset];
		this.p5!.resizeCanvas(preset.width, preset.height);

		// Center canvas in container
		const container = document.getElementById('snaked-again-container');
		if (!container) return false;

		container.style.width = `${preset.width}px`;
		container.style.height = `${preset.height}px`;

		// Update container position for centering
		container.style.position = 'absolute';
		container.style.left = '50%';
		container.style.top = '50%';
		container.style.transform = 'translate(-50%, -50%)';

		return true;
	}

	/**
	 * Resets the game state.
	 * @public
	 */
	public reset(): void {
		this.snake = new Snake(this.grid, this);
		this.food = new Food(this.grid, this);
		this.powerUp = null;
		this.setupEventListeners();
	}

	/**
	 * Applies a power-up effect to the snake.
	 * @param {string} type - Power-up type
	 * @param {Position} powerUpPosition - Power-up position
	 */
	applyPowerUp(type: PowerUpType, powerUpPosition: Position): void {
		const existingBadgeIndex = this.activeBadges.findIndex(badge => badge.getType() === type);
		if (existingBadgeIndex !== -1) {
			const badge = this.activeBadges[existingBadgeIndex];
			badge.resetStartTime(); // No position change
		} else {
			this.addPowerUpBadge(type, powerUpPosition);
		}
		const position = this.snake.segments[0];
		this.particles!.createPowerUpEffect(position, type);
	}

	/**
	 * Adds a powerup badge to the UI and creates a floating badge effect.
	 * @param {string} type - Power-up type
	 * @param {Position} powerUpPosition - Power-up position
	 */
	addPowerUpBadge(type: PowerUpType, powerUpPosition: Position): void {
		const config = this.config.powerUps.badges;
		const cellSize = this.grid.getCellSize();
		const badgeSize = cellSize * (cellSize < 20 ? 2.0 : 1.2);
		const floatingBadgeSize = cellSize * (cellSize < 20 ? 2.5 : 1.8);
		const badgeSpacing = cellSize * 0.4;
		const margin = cellSize;
		const powerUpPos = this.grid.getCellCenter(powerUpPosition);

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
					duration: this.config.powerUps.effects[type].duration,
					size: badgeSize,
					hoverAmplitude: cellSize * config.hoverAmplitude,
					hoverFrequency: config.hoverFrequency || 2,
					popInDuration: config.popInDuration || 300,
					popInScale: config.popInScale || 1.2,
				},
			},
			initialX, // Starts at final x position
			margin, // y set in constructor to drop from above
			false
		);
		console.log('Badge added:', type, 'total:', this.activeBadges.length + 1);
		this.activeBadges.push(uiBadge);

		const floatingBadge = new PowerUpBadge(
			this.p5!,
			type,
			{
				...this.config.powerUps,
				badges: {
					...config,
					duration: 1500,
					size: floatingBadgeSize,
					hoverAmplitude: cellSize * config.hoverAmplitude,
					hoverFrequency: config.hoverFrequency || 2,
				},
			},
			powerUpPos.x,
			powerUpPos.y,
			true
		);
		this.floatingBadges.push(floatingBadge);

		this.repositionBadges(); // Sets targetX, no drop needed here
	}

	getSnake(): Snake {
		return this.snake;
	}

	getGrid(): Grid {
		return this.grid;
	}

	getFood(): Food {
		return this.food;
	}

	getPowerUp(): PowerUp | null {
		return this.powerUp;
	}

	getConfig(): GameConfig {
		return this.config;
	}

	setConfig(config: GameConfig): void {
		this.config = config;
	}

	getCurrentScore(): number {
		return this.stateMachine.getCurrentHighScore();
	}

	getCurrentHighScore(): number {
		return this.stateMachine.getCurrentHighScore();
	}

	getPlayTime(): number {
		return this.stateMachine.getPlayTime();
	}

	getEvents(): EventSystem {
		return this.events;
	}

	updatePowerUp(powerUp: PowerUp | null): void {
		this.powerUp = powerUp;
	}
}

// Global variables
let game: Game;
let touchStartX = 0;
let touchStartY = 0;
const MIN_SWIPE_DISTANCE = 30;

// Prevent default touch behavior to avoid scrolling
document.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

// p5.js touch handlers
function touchStarted(event: TouchEvent | MouseEvent): boolean {
	if (!game) return false;

	const clientX = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
	const clientY = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;

	// Store touch start coordinates
	touchStartX = clientX;
	touchStartY = clientY;

	// Prevent default touch behavior
	event.preventDefault();

	return false;
}

function touchEnded(event: TouchEvent | MouseEvent): boolean {
	if (!game) return false;

	const clientX = event instanceof TouchEvent ? event.changedTouches[0].clientX : event.clientX;
	const clientY = event instanceof TouchEvent ? event.changedTouches[0].clientY : event.clientY;

	const deltaX = clientX - touchStartX;
	const deltaY = clientY - touchStartY;

	if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE || Math.abs(deltaY) > MIN_SWIPE_DISTANCE) {
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			game.snake.setDirection(deltaX > 0 ? 'right' : 'left');
		} else {
			game.snake.setDirection(deltaY > 0 ? 'down' : 'up');
		}
	}

	// Prevent default touch behavior
	event.preventDefault();

	return false;
}

// Initialize p5.js in instance mode
new p5((p: p5) => {
	p.setup = () => {
		game = new Game();
		game.setup(p);
	};

	p.draw = () => {
		// Intentionally left empty as we're using RequestAnimationFrame
	};

	p.keyPressed = () => {
		if (!game) return;

		const key = p.key;
		const isShiftPressed = p.keyIsDown(p.SHIFT);

		// Prevent browser zoom
		if ((key === '=' || key === '-') && isShiftPressed) {
			(window.event as Event).preventDefault();
		}

		// Let debug panel handle all input
		game.handleInput(key, isShiftPressed);
	};

	p.touchStarted = touchStarted;
	p.touchEnded = touchEnded;
});
