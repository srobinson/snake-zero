import { default as p5 } from 'p5';
import configManager from './config/gameConfig';
import { Grid } from './core/Grid';
import { Snake } from './entities/Snake';
import { Food } from './entities/Food';
import { PowerUp } from './entities/PowerUp';
import { DebugPanel } from './core/DebugPanel';
import { GameController, GameStates } from './core/GameController';
import { EventSystem, GameEvents } from './core/EventSystem';
import { Particles } from './core/Particles';
import { PowerupBadge } from './ui/PowerupBadge';

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate on the grid
 * @property {number} y - Y coordinate on the grid
 */

/**
 * Main game class that coordinates all game components and manages the game loop.
 * @class
 * @property {import('./config/gameConfig.js').GameConfig} config - Game configuration
 * @property {Grid} grid - Game grid system
 * @property {EventSystem} events - Event management system
 * @property {GameController} stateMachine - Game state management
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
        /** @type {GameController} */
        this.stateMachine = new GameController(this);
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
        /** @type {Map<string, PowerupBadge>} */
        this.activePowerups = new Map(); // Store active powerup badges
        /** @type {PowerupBadge[]} */
        this.floatingBadges = []; // Store floating badges
        
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
                // Create food collection effect with the current food color and points
                this.particles.createFoodEffect(data.position, foodColor, data.points, data.multiplier);
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
                const basePoints = this.food.getPoints();
                const multiplier = this.snake.getPointsMultiplier();
                const finalPoints = basePoints * multiplier;
                this.stateMachine.updateScore(finalPoints);
                this.events.emit(GameEvents.FOOD_COLLECTED, {
                    position: this.food.position,
                    points: basePoints,
                    multiplier: multiplier
                });
                this.events.emit(GameEvents.SCORE_CHANGED, {
                    score: this.stateMachine.score
                });
            }

            // Check power-up collision
            if (this.powerUp && this.snake.checkPowerUpCollision(this.powerUp)) {
                this.snake.addEffect(this.powerUp.type);
                this.applyPowerup(this.powerUp.type, this.powerUp.position);
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
     * Applies a power-up effect to the snake.
     * @param {string} type - Power-up type
     * @param {Position} powerUpPosition - Power-up position
     */
    applyPowerup(type, powerUpPosition) {
        // Get powerup duration from config
        const duration = this.config.powerUps.effects[type].duration;
        this.addPowerupBadge(type, powerUpPosition);
        
        // Create pop-in particle effect at snake's head
        const position = this.snake.segments[0];
        this.particles.createPowerUpEffect(position, type);
    }

    addPowerupBadge(type, powerUpPosition) {
        const config = this.config.powerupBadges;
        const cellSize = this.grid.getCellSize();
        
        // Scale factors based on cell size range (10-100px)
        const baseScale = Math.max(0.5, Math.min(1, cellSize / 50)); // Normalized to 50px cell size
        
        // Calculate sizes with cell-size appropriate scaling
        const badgeSize = cellSize * (cellSize < 20 ? 2.0 : 1.2); // Reduced multiplier for better fit
        const badgeSpacing = cellSize * 0.4; // Slightly reduced spacing
        const margin = cellSize;
        
        // Get powerup position in pixel coordinates
        const powerUpPos = this.grid.getCellCenter(powerUpPosition);
        
        // Create UI progress badge with effect-specific duration
        const badgeCount = this.activePowerups.size;
        const effectDuration = this.config.powerUps.effects[type].duration;
        const remainingDuration = this.snake.getEffectTimeRemaining(type);
        const uiBadge = new PowerupBadge(
            this.p5,
            type,
            {
                ...config,
                duration: remainingDuration || effectDuration, // Use remaining duration if available
                size: badgeSize,
                popInScale: 1.15, // Slightly reduced pop scale
                hoverAmplitude: cellSize * 0.08 // Reduced hover amplitude
            },
            margin + (badgeCount * (badgeSize + badgeSpacing)),
            margin,
            false // isFloating = false
        );
        this.activePowerups.set(type, uiBadge);

        // Create floating badge at collection point
        const floatingBadgeSize = cellSize * (cellSize < 20 ? 2.5 : 1.8); // Reduced floating badge size
        const floatingBadge = new PowerupBadge(
            this.p5,
            type,
            {
                ...config,
                duration: 1500,
                popInDuration: 300,
                popInScale: 1.2,
                hoverAmplitude: cellSize * 0.15,
                hoverFrequency: 3,
                size: floatingBadgeSize
            },
            powerUpPos.x,
            powerUpPos.y,
            true // isFloating = true
        );
        this.floatingBadges.push(floatingBadge);
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
        
        // Draw snake and update particle effects
        this.snake.draw(this.p5, currentTime);
        this.particles.update();
        this.particles.draw();
        
        // Draw active powerup badges in UI
        for (const [type, badge] of this.activePowerups) {
            if (!badge.update()) {
                this.activePowerups.delete(type);
                continue;
            }
            badge.draw();
        }

        // Draw floating badges at collection points
        this.floatingBadges = this.floatingBadges.filter(badge => {
            if (!badge.update()) return false;
            badge.draw();
            return true;
        });
        
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
        this.p5.textAlign(this.p5.LEFT, this.p5.TOP);
        this.p5.textSize(20);
        this.p5.fill(255);
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

// Prevent default touch behavior to avoid scrolling
document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// p5.js touch handlers
function touchStarted(event) {
    if (!game) return false;
    touchStartX = event.touches ? event.touches[0].clientX : event.clientX;
    touchStartY = event.touches ? event.touches[0].clientY : event.clientY;
    return false;
}

function touchEnded(event) {
    if (!game) return false;
    
    const touchEndX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
    const touchEndY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Only handle if we have a significant swipe
    if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE || Math.abs(deltaY) > MIN_SWIPE_DISTANCE) {
        // Determine primary direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            game.snake.setDirection(deltaX > 0 ? 'right' : 'left');
        } else {
            // Vertical swipe
            game.snake.setDirection(deltaY > 0 ? 'down' : 'up');
        }
    }
    
    return false;
}

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

    p.touchStarted = touchStarted;
    p.touchEnded = touchEnded;
});
