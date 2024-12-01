import p5 from 'p5';
import configManager from './config/configManager.js';
import { getActiveBoardConfig } from './utils/boardConfig.js';
import { GameState } from './state/GameState';
import { Snake } from './entities/Snake';
import { Food } from './entities/Food';
import { PowerUp } from './entities/PowerUp';
import { Grid } from './core/Grid';

let gameState;
let snake;
let food;
let powerUp;
let grid;
let lastFrameTime = 0;
let canvas;
let boardConfig;
let p5Instance;
let isFullscreen = false;

// Track time for snake movement
let lastMoveTime = 0;

// Allow external config override
export function setGameConfig(customConfig) {
    configManager.override(customConfig);
    if (p5Instance) {
        p5Instance.setup(); // This will trigger setupCanvas and initializeGame
    }
}

// Export the sketch function for use in SnakedAgain class
export function sketch(p) {
    p5Instance = p;  // Store p5 instance for external access
    
    // Track keyboard state
    let currentKey = null;

    p.setup = () => {
        setupCanvas();
        initializeGame();
    };

    p.keyPressed = () => {
        handleKeyInput(p.key);
        return false; // Prevent default
    };

    p.draw = () => {
        const currentTime = p.millis();
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;

        // Clear the canvas
        p.background(0);

        // Update game state
        if (gameState.isPlaying()) {
            // Move snake based on time elapsed
            if (currentTime - lastMoveTime >= 1000 / configManager.getConfig().snake.baseSpeed) {
                snake.move();
                lastMoveTime = currentTime;
            }

            // Check collisions
            if (snake.checkCollision()) {
                gameState.gameOver();
            }

            // Check food collision
            if (snake.checkFoodCollision(food)) {
                snake.grow();
                food.respawn();
            }

            // Check power-up collision
            if (powerUp && snake.checkPowerUpCollision(powerUp)) {
                powerUp.apply(snake);
                powerUp = null;
            }

            // Spawn power-up
            if (!powerUp && Math.random() < configManager.getConfig().powerUps.spawnChance) {
                powerUp = new PowerUp(grid);
            }
        }

        // Draw game elements
        grid.draw(p);
        food.draw(p);
        if (powerUp) {
            powerUp.draw(p);
        }
        snake.draw(p);

        // Draw game over screen
        if (gameState.isGameOver()) {
            drawGameOver();
        }
    };

    function setupCanvas() {
        let dimensions;
        
        if (isFullscreen) {
            // Fullscreen mode: use viewport dimensions
            const gridSize = 20;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const cols = Math.floor(viewportWidth / gridSize);
            const rows = Math.floor(viewportHeight / gridSize);
            dimensions = {
                width: cols * gridSize,
                height: rows * gridSize,
                gridSize,
                cols,
                rows
            };
        } else {
            // Use configured dimensions
            dimensions = configManager.getBoardDimensions();
        }
        
        // Create canvas with calculated dimensions
        canvas = p.createCanvas(dimensions.width, dimensions.height);
        canvas.parent('game-container');
        
        if (isFullscreen) {
            document.getElementById('game-container').classList.add('snaked-again-fullscreen');
            canvas.elt.classList.add('fullscreen');
        } else {
            document.getElementById('game-container').classList.remove('snaked-again-fullscreen');
            canvas.elt.classList.remove('fullscreen');
        }

        // Update board config
        boardConfig = dimensions;
    }

    function initializeGame() {
        // Initialize game state
        gameState = new GameState();
        
        // Create game grid
        grid = new Grid(boardConfig);
        
        // Create snake
        const config = configManager.getConfig();
        snake = new Snake(
            grid,
            config.snake.initialPosition,
            config.snake.initialDirection,
            config.snake.initialLength
        );
        
        // Create initial food
        food = new Food(grid);
        
        // Reset power-up
        powerUp = null;
        
        // Reset game state
        gameState.reset();
    }

    function handleKeyInput(key) {
        const controls = configManager.getConfig().controls;
        
        if (controls.up.includes(key)) {
            snake.setDirection('up');
        } else if (controls.down.includes(key)) {
            snake.setDirection('down');
        } else if (controls.left.includes(key)) {
            snake.setDirection('left');
        } else if (controls.right.includes(key)) {
            snake.setDirection('right');
        }
    }

    function drawGameOver() {
        p.fill(255);
        p.textSize(32);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('Game Over!', p.width/2, p.height/2);
        p.textSize(16);
        p.text('Press any key to restart', p.width/2, p.height/2 + 40);
    }
}
