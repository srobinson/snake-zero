import { default as p5 } from 'p5';
import configManager from './config/gameConfig.js';
import { Grid } from './core/Grid.js';
import { Snake } from './entities/Snake.js';
import { Food } from './entities/Food.js';
import { PowerUp } from './entities/PowerUp.js';
import { DebugPanel } from './core/DebugPanel.js';
import { GameStateMachine, GameStates } from './core/GameStateMachine.js';
import { EventSystem, GameEvents } from './core/EventSystem.js';
import { Particles } from './core/Particles.js';

/**
 * Main game class that coordinates all game components and manages the game loop.
 * @class
 * @property {import('./config/gameConfig.js').GameConfig} config - Game configuration
 * @property {Grid} grid - Game grid system
 * @property {EventSystem} events - Event management system
 * @property {GameStateMachine} stateMachine - Game state management
 * @property {DebugPanel} debugPanel - Debug information panel
 * @property {Snake} snake - Snake entity
 * @property {Food} food - Food entity
 * @property {PowerUp|null} powerUp - Current power-up entity
 * @property {p5} p5 - p5.js instance
 * @property {Particles} particles - Particle effects system
 */
export default class Game {
    /**
     * Creates a new Game instance.
     * @constructor
     */
    constructor() {
        // Load configuration first
        configManager.loadFromLocalStorage();
        /** @type {import('./config/gameConfig.js').GameConfig} */
        this.config = configManager.getConfig();
        
        // Initialize game components
        /** @type {Grid} */
        this.grid = new Grid(this.config);
        /** @type {EventSystem} */
        this.events = new EventSystem();
        /** @type {GameStateMachine} */
        this.stateMachine = new GameStateMachine(this);
        /** @type {DebugPanel} */
        this.debugPanel = new DebugPanel(this);
        /** @type {Snake} */
        this.snake = new Snake(this.grid, this);
        /** @type {Food} */
        this.food = new Food(this.grid);
        /** @type {PowerUp|null} */
        this.powerUp = null;
        /** @type {p5|null} */
        this.p5 = null;
        /** @type {Particles} */
        this.particles = null;
        
        this.setupEventListeners();
        this.setupResizeHandler();
    }

    /**
     * Sets up game event listeners for food collection and collisions.
     * @private
     */
    setupEventListeners() {
        // Clear existing listeners first
        this.events.clear();
        
        // Set up event listeners
        this.events.on(GameEvents.FOOD_COLLECTED, (data) => {
            if (data && data.position) {
                // Get food color before respawning
                const foodColor = this.food.color;
                // Create food collection effect with the current food color
                this.particles.createFoodEffect(data.position, foodColor);
                // Respawn food after creating effect
                this.food.respawn([this.snake]);
            }
        });

        this.events.on(GameEvents.POWER_UP_COLLECTED, (data) => {
            // Create power-up collection effect at the collected power-up position
            if (data && data.position && data.powerUpType) {
                this.particles.createPowerUpEffect(data.position, data.powerUpType);
            }
        });

        this.events.on(GameEvents.COLLISION, () => {
            this.stateMachine.transition(GameStates.GAME_OVER);
        });
    }

    /**
     * Sets up window resize handler for fullscreen mode.
     * @private
     */
    setupResizeHandler() {
        window.addEventListener('resize', () => {
            // Only handle resize in fullscreen mode
            if (this.config.board.preset === 'fullscreen') {
                // Update grid dimensions
                this.grid.updateDimensions();
                
                // Update canvas size
                if (this.p5) {
                    this.p5.resizeCanvas(this.grid.width, this.grid.height);
                }
            }
        });
    }

    /**
     * Initializes p5.js canvas and setup.
     * @param {p5} p5 - p5.js instance
     */
    setup(p5) {
        this.p5 = p5;
        const canvas = p5.createCanvas(this.grid.width, this.grid.height);
        canvas.parent('snaked-again-container');
        this.particles = new Particles(p5, this.grid, this);
    }

    /**
     * Updates game state, including snake movement, collisions, and power-ups.
     */
    update() {
        if (!this.stateMachine.isInState(GameStates.PLAYING)) return;

        const currentTime = this.p5.millis();
        
        // Update debug panel
        this.debugPanel.update(currentTime);
        
        // Update snake
        if (this.snake.update(currentTime)) {
            // Update grid illumination
            this.grid.updateIllumination(this.snake);
            
            // Check collisions after movement
            if (this.snake.checkCollision()) {
                this.events.emit(GameEvents.COLLISION, {
                    position: this.snake.segments[0] // Head position
                });
                return;
            }

            // Check food collision
            if (this.snake.checkFoodCollision(this.food)) {
                this.snake.grow();
                const points = this.config.scoring.basePoints * this.snake.getPointsMultiplier();
                this.stateMachine.updateScore(points);
                this.events.emit(GameEvents.FOOD_COLLECTED, {
                    position: this.food.position
                });
                this.events.emit(GameEvents.SCORE_CHANGED, {
                    score: this.stateMachine.score
                });
            }

            // Check power-up collision
            if (this.powerUp && this.snake.checkPowerUpCollision(this.powerUp)) {
                this.snake.addEffect(this.powerUp.type);
                this.events.emit(GameEvents.POWER_UP_COLLECTED, {
                    powerUpType: this.powerUp.type,
                    position: this.powerUp.position
                });
                this.powerUp = null;
            }
        }

        // Spawn power-up based on difficulty settings
        const difficulty = this.config.difficulty.presets[this.config.difficulty.current];
        if (!this.powerUp && Math.random() < difficulty.powerUpChance) {
            this.powerUp = new PowerUp(this.grid, [this.snake, this.food]);
        }
    }

    /**
     * Draws the current game state based on the game state machine.
     */
    draw() {
        if (this.p5) {
            this.update();
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
    drawGame() {
        const currentTime = this.p5.millis();
        this.grid.drawBackground(this.p5);
        this.grid.drawGridLines(this.p5);
        
        // Draw game entities
        this.food.draw(this.p5);
        if (this.powerUp) {
            this.powerUp.draw(this.p5);
        }
        
        // Update active power-up effects
        if (this.snake.effects.size > 0) {
            const snakeHead = this.snake.segments[0];
            for (const [type, _] of this.snake.effects.entries()) {
                this.particles.updateActiveEffect(type, snakeHead);
            }
        }
        
        this.snake.draw(this.p5, currentTime);
        
        // Update particle effects
        this.particles.update();
        
        this.drawScore();
        this.debugPanel.draw(this.p5);
    }

    /**
     * Draws the main menu screen.
     * @private
     */
    drawMenu() {
        const p5 = this.p5;
        p5.fill(255);
        p5.textSize(32);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.text('Snake Zero', this.grid.width/2, this.grid.height/2 - 60);
        
        p5.textSize(20);
        p5.text(`High Score: ${this.stateMachine.highScore}`, this.grid.width/2, this.grid.height/2);
        p5.text('Press SPACE to Start', this.grid.width/2, this.grid.height/2 + 40);
        
        p5.textSize(16);
        p5.text('Use Arrow Keys or WASD to move', this.grid.width/2, this.grid.height/2 + 80);
    }

    /**
     * Draws the pause overlay.
     * @private
     */
    drawPauseOverlay() {
        const p5 = this.p5;
        
        // Small pause indicator in top-right corner
        p5.fill(255);
        p5.textSize(16);
        p5.textAlign(p5.RIGHT, p5.TOP);
        p5.text('PAUSED', this.grid.width - 10, 10);
    }

    /**
     * Draws the game over screen.
     * @private
     */
    drawGameOver() {
        const p5 = this.p5;
        p5.fill(0, 0, 0, 200);
        p5.rect(0, 0, this.grid.width, this.grid.height);
        
        p5.fill(255);
        p5.textSize(32);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.text('Game Over!', this.grid.width/2, this.grid.height/2 - 40);
        
        p5.textSize(24);
        p5.text(`Score: ${this.stateMachine.score}`, this.grid.width/2, this.grid.height/2 + 10);
        if (this.stateMachine.score === this.stateMachine.highScore) {
            p5.text('New High Score!', this.grid.width/2, this.grid.height/2 + 40);
        }
        
        p5.textSize(16);
        p5.text('Press SPACE to Restart', this.grid.width/2, this.grid.height/2 + 80);
        p5.text('Press ESC for Menu', this.grid.width/2, this.grid.height/2 + 110);
    }

    /**
     * Draws the current score.
     * @private
     */
    drawScore() {
        this.p5.fill(255);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.LEFT, this.p5.TOP);
        this.p5.text(`Score: ${this.stateMachine.score}`, 10, 10, this.p5.millis());
    }

    /**
     * Handles keyboard input for game controls.
     * @param {string} key - Key pressed
     * @param {boolean} isShiftPressed - Whether shift key is held
     * @returns {boolean} Whether the input was handled
     */
    handleInput(key, isShiftPressed) {
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
     */
    recreate() {
        // Save current state
        const wasPlaying = this.stateMachine.isInState(GameStates.PLAYING);
        
        // Create new grid with updated config
        this.grid = new Grid(this.config);
        
        // Reset game elements
        this.reset();

        // Resize canvas
        const preset = this.config.board.presets[this.config.board.preset];
        this.p5.resizeCanvas(preset.width, preset.height);

        // Center canvas in container
        const container = document.getElementById('snaked-again-container');
        container.style.width = preset.width + 'px';
        container.style.height = preset.height + 'px';

        // Update container position for centering
        container.style.position = 'absolute';
        container.style.left = '50%';
        container.style.top = '50%';
        container.style.transform = 'translate(-50%, -50%)';

        // Restore state if was playing
        if (wasPlaying) {
            this.stateMachine.transition(GameStates.PLAYING);
        }
    }

    /**
     * Resets the game state.
     */
    reset() {
        this.snake = new Snake(this.grid, this);
        this.food = new Food(this.grid);
        this.powerUp = null;
        this.setupEventListeners();
    }
}

let game;
let touchStartX = 0;
let touchStartY = 0;
const MIN_SWIPE_DISTANCE = 30;

/**
 * Handles touch start event.
 * @param {Event & { touches?: TouchList }} event - Touch event from browser
 * @returns {boolean} Whether the event was handled
 */
function touchStarted(event) {
    if (event.touches && event.touches[0]) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
    return false;
}

/**
 * Handles touch end event.
 * @param {Event & { changedTouches?: TouchList }} event - Touch event from browser
@param {Event & { touches?: TouchList }} event@param {Event & { touches?: TouchList }} event * @returns {boolean} Whether the event was handled
 */
function touchEnded(event) {
    if (!event.changedTouches || !event.changedTouches[0]) return false;

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE && Math.abs(deltaY) < MIN_SWIPE_DISTANCE) {
        return false;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
            game.handleInput('ArrowRight');
        } else {
            game.handleInput('ArrowLeft');
        }
    } else {
        // Vertical swipe
        if (deltaY > 0) {
            game.handleInput('ArrowDown');
        } else {
            game.handleInput('ArrowUp');
        }
    }
    return false;
}

// Prevent default touch behavior to avoid scrolling
document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// Initialize p5.js in instance mode
new p5((p) => {
    p.setup = () => {
        game = new Game();
        game.setup(p);
    };

    p.draw = () => {
        game.update();
        game.draw();
    };

    p.keyPressed = () => {
        if (!game) return;

        const key = p.key;
        const isShiftPressed = p.keyIsDown(p.SHIFT);

        // Prevent browser zoom
        if ((key === '=' || key === '-') && isShiftPressed) {
            p.preventDefault();
        }

        // Let debug panel handle all input
        game.handleInput(key, isShiftPressed);
    };

    p.touchStarted = () => {
        touchStarted(event);
    };

    p.touchEnded = () => {
        touchEnded(event);
    };
});
