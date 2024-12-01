import { default as p5 } from 'p5';
import configManager from './config/gameConfig.js';
import { Grid } from './core/Grid.js';
import { Snake } from './entities/Snake.js';
import { Food } from './entities/Food.js';
import { PowerUp } from './entities/PowerUp.js';
import { DebugPanel } from './core/DebugPanel.js';
import { GameStateMachine, GameStates } from './core/GameStateMachine.js';
import { EventSystem, GameEvents } from './core/EventSystem.js';

class Game {
    constructor() {
        // Load configuration first
        configManager.loadFromLocalStorage();
        this.config = configManager.getConfig();
        
        // Initialize game components
        this.grid = new Grid(this.config);
        this.events = new EventSystem();
        this.stateMachine = new GameStateMachine(this);
        this.debugPanel = new DebugPanel(this);
        this.snake = new Snake(this.grid, this);
        this.food = new Food(this.grid);
        this.powerUp = null;
        
        this.setupEventListeners();
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

    setup(p5) {
        this.p5 = p5;
        const canvas = p5.createCanvas(this.grid.width, this.grid.height);
        canvas.parent('game-container');
    }

    update() {
        if (!this.stateMachine.isInState(GameStates.PLAYING)) return;

        const currentTime = this.p5.millis();
        
        // Update debug panel
        this.debugPanel.update(currentTime);
        
        // Update snake
        if (this.snake.update(currentTime)) {
            // Check collisions after movement
            if (this.snake.checkCollision()) {
                this.events.emit(GameEvents.COLLISION);
                return;
            }

            // Check food collision
            if (this.snake.checkFoodCollision(this.food)) {
                this.snake.grow();
                const points = this.config.scoring.basePoints * this.snake.getPointsMultiplier();
                this.stateMachine.updateScore(points);
                this.events.emit(GameEvents.FOOD_COLLECTED);
                this.events.emit(GameEvents.SCORE_CHANGED, this.stateMachine.score);
            }

            // Check power-up collision
            if (this.powerUp && this.snake.checkPowerUpCollision(this.powerUp)) {
                this.snake.addEffect(this.powerUp.type);
                this.events.emit(GameEvents.POWER_UP_COLLECTED, this.powerUp.type);
                this.powerUp = null;
            }
        }

        // Spawn power-up based on difficulty settings
        const difficulty = this.config.difficulty.presets[this.config.difficulty.current];
        if (!this.powerUp && Math.random() < difficulty.powerUpChance) {
            this.powerUp = new PowerUp(this.grid, [this.snake, this.food]);
        }
    }

    draw() {
        // Draw background
        this.grid.drawBackground(this.p5);

        switch (this.stateMachine.getState()) {
            case GameStates.MENU:
                this.drawMenu();
                break;
            case GameStates.PLAYING:
            case GameStates.PAUSED:
                this.drawGame();
                if (this.stateMachine.isInState(GameStates.PAUSED)) {
                    this.drawPauseOverlay();
                }
                break;
            case GameStates.GAME_OVER:
                this.drawGame();
                this.drawGameOver();
                break;
        }
    }

    drawGame() {
        this.grid.drawGridLines(this.p5);
        // Draw game entities
        this.food.draw(this.p5);
        if (this.powerUp) {
            this.powerUp.draw(this.p5);
        }
        this.snake.draw(this.p5);
                
        this.drawScore();
        this.debugPanel.draw(this.p5);
    }

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

    drawPauseOverlay() {
        const p5 = this.p5;
        
        // Small pause indicator in top-right corner
        p5.fill(255);
        p5.textSize(16);
        p5.textAlign(p5.RIGHT, p5.TOP);
        p5.text('PAUSED', this.grid.width - 10, 10);
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

    drawScore() {
        this.p5.fill(255);
        this.p5.noStroke();
        this.p5.textSize(20);
        this.p5.textAlign(this.p5.LEFT, this.p5.TOP);
        this.p5.text(`Score: ${this.stateMachine.score}`, 10, 10);
    }

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
        const container = document.getElementById('game-container');
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

function touchStarted(event) {
    if (event.touches && event.touches[0]) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
    return false;
}

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
