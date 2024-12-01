import { default as p5 } from 'p5';
import { Grid } from './core/Grid.js';
import { Snake } from './entities/Snake.js';
import { Food } from './entities/Food.js';
import { PowerUp } from './entities/PowerUp.js';
import { DebugPanel } from './core/DebugPanel.js';
import { GameStateMachine, GameStates } from './core/GameStateMachine.js';
import { EventSystem, GameEvents } from './core/EventSystem.js';

// Default game configuration with flat structure
const defaultConfig = {
    // Display settings
    gameMode: 'windowed',
    cellSize: 20,
    showGrid: true,
    backgroundColor: '#FFFFFF',
    gridColor: '#CCCCCC',
    
    // Snake settings
    snakeColor: '#4CAF50',
    snakeHeadColor: '#388E3C',
    initialDirection: 'right',
    initialLength: 3,
    allowWallPhasing: false,
    
    // Speed settings
    baseSpeed: 5,
    minSpeed: 1,
    maxSpeed: 15,
    enableSpeedProgression: true,
    speedProgressionThreshold: 10,
    speedProgressionIncrease: 0.5,
    maxSpeedMultiplier: 3,
    
    // Food settings
    foodColors: ['#E91E63', '#9C27B0', '#673AB7'],
    basePoints: 10,
    specialFoodEnabled: true,
    foodValues: [1, 2, 3],
    foodWeights: [70, 20, 10],
    
    // Power-up settings
    powerUpEnabled: true,
    powerUpTypes: ['speed', 'slow', 'ghost', 'points'],
    powerUpDuration: 5000,
    powerUpSpawnChance: 0.01,
    powerUpSpeedColor: '#FFD700',
    powerUpSlowColor: '#4169E1',
    powerUpGhostColor: '#7B68EE',
    powerUpPointsColor: '#32CD32',
    powerUpSpeedMultiplier: 2,
    powerUpPointsMultiplier: 3,
    
    // Combo settings
    comboTimeWindow: 2000,
    comboMultiplier: 1.5,
    
    // Debug settings
    debug: false,
    debugLevel: 1
};

export class Game {
    constructor() {
        // Load configuration
        this.config = { ...defaultConfig };
        
        // Try to load from data attributes
        const container = document.getElementById('game-container');
        if (container) {
            this.loadConfigFromDataAttributes(container);
        }
        
        // Try to load from localStorage
        this.loadConfigFromLocalStorage();
        
        // Initialize game state
        this.score = 0;
        this.highScore = 0;
        this.paused = false;
        
        // Initialize game components
        this.events = new EventSystem();
        this.stateMachine = new GameStateMachine(this);
        this.grid = new Grid(this);
        this.debugPanel = new DebugPanel(this);
        this.snake = new Snake(this.grid, this);
        this.food = new Food(this.grid, this);
        this.powerUp = null;
        
        this.setupEventListeners();
    }

    // Required game interface methods
    getConfig() { return this.config; }
    getEvents() { return this.events; }
    getState() { return this.stateMachine.getState(); }
    getScore() { return this.score; }
    getHighScore() { return this.highScore; }
    getGrid() { return this.grid; }
    getSnake() { return this.snake; }
    getFood() { return this.food; }
    getPowerUp() { return this.powerUp; }
    getDebugPanel() { return this.debugPanel; }
    isPaused() { return this.paused; }

    setup(p5) {
        this.p5 = p5;
        const canvas = p5.createCanvas(this.grid.width, this.grid.height);
        canvas.parent('game-container');
        
        // Set initial drawing settings
        p5.noStroke();
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(16);
    }

    update() {
        if (!this.stateMachine.isInState(GameStates.PLAYING)) return;

        const currentTime = this.p5.millis();
        
        // Update debug panel if enabled
        if (this.config.debug) {
            this.debugPanel.update(currentTime);
        }
        
        // Update snake
        if (this.snake.update(currentTime)) {
            // Check collisions after movement
            if (this.snake.checkCollision()) {
                this.events.emit(GameEvents.COLLISION);
                return;
            }

            // Check food collision
            if (this.snake.checkFoodCollision(this.food)) {
                this.snake.grow(this.config.growthRate);
                const points = this.config.basePoints * this.snake.getPointsMultiplier();
                this.stateMachine.updateScore(points);
                this.events.emit(GameEvents.FOOD_COLLECTED);
                this.events.emit(GameEvents.SCORE_CHANGED, this.stateMachine.score);
            }

            // Check power-up collision
            if (this.powerUp && this.snake.checkPowerUpCollision(this.powerUp)) {
                this.powerUp.apply(this.snake);
                this.events.emit(GameEvents.POWER_UP_COLLECTED, this.powerUp.type);
                this.powerUp = null;
            }
        }

        // Try to spawn power-up if enabled
        if (this.config.powerUpEnabled && !this.powerUp && Math.random() < this.config.powerUpSpawnChance) {
            const obstacles = [this.snake, this.food];
            this.powerUp = new PowerUp(this.grid, this);
            this.powerUp.respawn(obstacles);
        }
    }

    draw() {
        // Clear and draw grid
        this.grid.draw(this.p5);

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

        // Draw score
        this.drawScore();
        
        // Draw debug info if enabled
        if (this.config.debug) {
            this.debugPanel.draw(this.p5);
        }
    }

    drawGame() {
        // Draw game entities
        this.food.draw(this.p5);
        if (this.powerUp) {
            this.powerUp.draw(this.p5);
        }
        this.snake.draw(this.p5);
    }

    drawScore() {
        const p5 = this.p5;
        p5.fill(255);
        p5.textSize(24);
        p5.text(`Score: ${this.stateMachine.score}`, this.grid.width/2, 30);
        p5.textSize(16);
        p5.text(`High Score: ${this.stateMachine.highScore}`, this.grid.width/2, 60);
    }

    drawMenu() {
        const p5 = this.p5;
        p5.fill(0, 0, 0, 200);
        p5.rect(0, 0, this.grid.width, this.grid.height);
        
        p5.fill(255);
        p5.textSize(48);
        p5.text('Snake Zero', this.grid.width/2, this.grid.height/2 - 60);
        
        p5.textSize(24);
        p5.text('Press SPACE to Start', this.grid.width/2, this.grid.height/2 + 20);
        p5.textSize(16);
        p5.text('Use Arrow Keys or WASD to move', this.grid.width/2, this.grid.height/2 + 60);
    }

    drawPauseOverlay() {
        const p5 = this.p5;
        p5.fill(0, 0, 0, 200);
        p5.rect(0, 0, this.grid.width, this.grid.height);
        
        p5.fill(255);
        p5.textSize(32);
        p5.text('Paused', this.grid.width/2, this.grid.height/2 - 20);
        
        p5.textSize(16);
        p5.text('Press SPACE to Resume', this.grid.width/2, this.grid.height/2 + 20);
        p5.text('Press ESC for Menu', this.grid.width/2, this.grid.height/2 + 50);
    }

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

    handleInput(key, isShiftPressed = false) {
        if (this.stateMachine.isInState(GameStates.PLAYING)) {
            this.snake.handleInput(key);
            if (key === ' ') {
                this.stateMachine.transition(GameStates.PAUSED);
            }
        } else if (key === ' ') {
            if (this.stateMachine.isInState(GameStates.MENU)) {
                this.stateMachine.transition(GameStates.PLAYING);
            } else if (this.stateMachine.isInState(GameStates.PAUSED)) {
                this.stateMachine.transition(GameStates.PLAYING);
            } else if (this.stateMachine.isInState(GameStates.GAME_OVER)) {
                this.recreate();
                this.stateMachine.transition(GameStates.PLAYING);
            }
        }
        
        // Debug mode toggle
        if (isShiftPressed && key === 'D') {
            this.config.debug = !this.config.debug;
            localStorage.setItem('snakeConfig', JSON.stringify(this.config));
        }
    }

    recreate() {
        this.snake = new Snake(this.grid, this);
        this.food = new Food(this.grid, this);
        this.powerUp = null;
        this.stateMachine.resetScore();
        this.setupEventListeners();
    }

    reset() {
        this.score = 0;
        this.paused = false;
        this.snake.initialize();
        this.food.respawn([this.snake]);
        this.powerUp = null;
        this.events.emit(GameEvents.SCORE_CHANGED, this.score);
    }

    setupEventListeners() {
        // Clear existing listeners first
        this.events.clear();
        
        // Set up event listeners
        this.events.on(GameEvents.FOOD_COLLECTED, () => {
            // Pass snake as obstacle to avoid spawning on it
            this.food.respawn([this.snake]);
        });

        this.events.on(GameEvents.COLLISION, () => {
            this.stateMachine.transition(GameStates.GAME_OVER);
        });
    }

    loadConfigFromLocalStorage() {
        try {
            const storedConfig = localStorage.getItem('snakeConfig');
            if (storedConfig) {
                const config = JSON.parse(storedConfig);
                // Merge with defaults, keeping only valid keys
                Object.keys(defaultConfig).forEach(key => {
                    if (config.hasOwnProperty(key)) {
                        this.config[key] = config[key];
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load config from localStorage:', error);
        }
    }

    loadConfigFromDataAttributes(element) {
        if (!element) return;

        // Load mode
        const mode = element.getAttribute('data-mode');
        if (mode) {
            this.config.gameMode = mode;
        }

        // Load cell size
        const cellSize = element.getAttribute('data-cell-size');
        if (cellSize) {
            this.config.cellSize = parseInt(cellSize, 10);
        }

        // Load difficulty
        const difficulty = element.getAttribute('data-difficulty');
        if (difficulty) {
            this.config.difficulty = difficulty;
        }

        // Load debug mode
        const debug = element.getAttribute('data-debug');
        if (debug) {
            this.config.debug = debug === 'true';
        }
    }
}

let game;
let touchStartX = 0;
let touchStartY = 0;
const MIN_SWIPE_DISTANCE = 30;

function touchStarted(event) {
    if (!event || !event.touches || !event.touches[0]) {
        console.warn('Invalid touch event');
        return false;
    }
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    return false;
}

function touchEnded(event) {
    if (!event || !event.changedTouches || !event.changedTouches[0]) {
        console.warn('Invalid touch event');
        return false;
    }

    if (!game) {
        console.warn('Game not initialized');
        return false;
    }

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

        // Handle debug panel toggle
        if (key === '`') {
            game.debugPanel.toggle();
            return;
        }

        game.handleInput(key, isShiftPressed);
    };

    p.touchStarted = () => {
        touchStarted(event);
    };

    p.touchEnded = () => {
        touchEnded(event);
    };
});
