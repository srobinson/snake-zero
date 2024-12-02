// @ts-check
import configManager from '../config/gameConfig.js';
import { PowerUp } from '../entities/PowerUp.js';

/** @typedef {import('../config/gameConfig.js').GameConfig} GameConfig */
/** @typedef {import('../config/gameConfig.js').BoardConfig} BoardConfig */
/** @typedef {'small' | 'medium' | 'large' | 'fullscreen'} BoardPreset */

/**
 * @typedef {Object} DebugConfig
 * @property {boolean} enabled - Whether debug mode is enabled
 * @property {string|string[]} shortcutKey - Key(s) to toggle debug panel
 * @property {number} fontSize - Font size for debug text
 * @property {string} position - Panel position ('top-left'|'top-right'|'bottom-left'|'bottom-right')
 * @property {number} padding - Padding inside debug panel
 * @property {string} backgroundColor - Panel background color
 * @property {string} textColor - Text color
 * @property {boolean} showFPS - Show FPS counter
 * @property {boolean} showSnakeInfo - Show snake stats
 * @property {boolean} showGridInfo - Show grid information
 * @property {boolean} showEffects - Show active effects
 * @property {boolean} showControls - Show debug controls
 * @property {Object} controls - Debug control key mappings
 * @property {Object} controls.grid - Grid control keys
 * @property {string} controls.grid.increaseCellSize - Key to increase cell size
 * @property {string} controls.grid.decreaseCellSize - Key to decrease cell size
 * @property {Object} controls.spawn - Power-up spawn keys
 * @property {string} controls.spawn.speed - Key to spawn speed power-up
 * @property {string} controls.spawn.ghost - Key to spawn ghost power-up
 * @property {string} controls.spawn.points - Key to spawn points power-up
 * @property {Object} controls.snake - Snake control keys
 * @property {string} controls.snake.grow - Key to grow snake
 * @property {Object} controls.board - Board size control keys
 */

/**
 * @typedef {Object} Game
 * @property {import('../core/Grid.js').Grid} grid - Game grid
 * @property {import('../entities/Snake.js').Snake} snake - Snake entity
 * @property {import('../entities/Food.js').Food} food - Food entity
 * @property {PowerUp} powerUp - Power-up entity
 * @property {Object} config - Game configuration
 * @property {() => void} recreate - Recreates the game with current config
 */

/**
 * Debug panel for development and testing.
 * Provides real-time game information and debug controls.
 * Features:
 * - FPS counter
 * - Snake statistics
 * - Grid information
 * - Active effects
 * - Debug controls
 * - Power-up spawning
 * - Grid size controls
 * @class
 */
export class DebugPanel {
    /** @type {Game} */
    game;
    
    /** @type {DebugConfig} */
    config;
    
    /** @type {boolean} */
    enabled;
    
    /** @type {boolean} */
    visible;
    
    /** @type {number} */
    lastFrameTime;
    
    /** @type {number} */
    frameCount;
    
    /** @type {number} */
    fps;
    
    /** @type {number} */
    fpsUpdateInterval;
    
    /** @type {number} */
    lastFpsUpdate;

    /**
     * Creates a new DebugPanel instance
     * @param {Game} game - The game instance to debug
     */
    constructor(game) {
        this.game = game;
        this.config = configManager.getConfig().debug;
        this.visible = this.config.enabled;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateInterval = 500;
        this.lastFpsUpdate = 0;
    }

    /**
     * Handles debug keyboard input
     * @param {string} key - The key pressed
     * @param {boolean} [isShiftPressed=false] - Whether shift is held
     * @returns {boolean} True if the key was handled
     */
    handleInput(key, isShiftPressed = false) {
        // Support both single key and array of keys for shortcuts
        const shortcuts = Array.isArray(this.config.shortcutKey) ? 
            this.config.shortcutKey : 
            [this.config.shortcutKey];
            
        if (shortcuts.includes(key)) {
            this.toggle();
            return true;
        }

        if (!this.visible) return false;

        // Handle cell size controls
        const gridControls = this.config.controls.grid;
        if (key === '=' || key === '+' || key === gridControls.increaseCellSize) {
            const currentPreset = this.game.config.board.preset;
            const presets = this.game.config.board.presets;
            const oldSize = presets[currentPreset].cellSize;
            const newSize = oldSize + 5;

            // Only update if the size change was successful
            if (this.game.grid.updateCellSize(newSize)) {
                this.game.recreate();
                return true;
            }
        } 
        else if (key === '-' || key === '_' || key === gridControls.decreaseCellSize) {
            const currentPreset = this.game.config.board.preset;
            const presets = this.game.config.board.presets;
            const oldSize = presets[currentPreset].cellSize;
            const newSize = oldSize - 5;

            // Only update if the size change was successful
            if (this.game.grid.updateCellSize(newSize)) {
                this.game.recreate();
                return true;
            }
        }
        
        // Check spawn controls
        const spawnControls = this.config.controls.spawn;
        if (spawnControls.speed === key) {
            this.spawnPowerUp('speed');
            return true;
        } else if (spawnControls.ghost === key) {
            this.spawnPowerUp('ghost');
            return true;
        } else if (spawnControls.points === key) {
            this.spawnPowerUp('points');
            return true;
        }

        // Check snake controls
        const snakeControls = this.config.controls.snake;
        if (snakeControls.grow === key) {
            this.game.snake.grow();
            return true;
        }

        // Check board size controls
        const boardControls = this.config.controls.board;
        if (Object.values(boardControls).includes(key)) {
            const sizeEntry = Object.entries(boardControls).find(([_, k]) => k === key);
            if (sizeEntry) {
                const [size] = sizeEntry;
                // Validate that size is a valid BoardPreset
                if (size === 'small' || size === 'medium' || size === 'large' || size === 'fullscreen') {
                    /** @type {BoardPreset} */
                    const boardSize = size;
                    this.changeBoardSize(boardSize);
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Spawns a power-up of specified type
     * @param {'speed'|'ghost'|'points'} type - Type of power-up to spawn
     */
    spawnPowerUp(type) {
        // Create power-up with snake and food as obstacles
        this.game.powerUp = new PowerUp(
            this.game.grid, 
            [this.game.snake, this.game.food]
        );

        // Override the type if specified
        if (type) {
            this.game.powerUp.type = type;
        }
    }

    /**
     * Toggles debug panel visibility
     */
    toggle() {
        this.visible = !this.visible;
    }

    /**
     * Updates debug panel state
     * @param {number} currentTime - Current game time in milliseconds
     */
    update(currentTime) {
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate > this.fpsUpdateInterval) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }

    /**
     * Draws the debug panel
     * @param {import('p5')} p5 - p5.js instance
     */
    draw(p5) {
        if (!this.visible) return;

        p5.push();
        
        // Set text properties
        p5.textSize(this.config.fontSize);
        p5.textAlign(p5.LEFT, p5.TOP);
        
        // Calculate position and size
        const x = this.config.position.includes('right') ? 
            p5.width - 200 - this.config.padding : 
            this.config.padding;
        
        const y = this.config.position.includes('bottom') ? 
            p5.height - 200 - this.config.padding : 
            this.config.padding;

        // Pre-calculate height based on visible sections
        let height = this.config.padding;
        const lineHeight = this.config.fontSize * 1.5;
        
        // Add extra height for speed display
        height += lineHeight * 2;
        
        if (this.config.showFPS) height += lineHeight;
        if (this.config.showSnakeInfo) height += lineHeight * 4;
        if (this.config.showGridInfo) height += lineHeight * 3;
        if (this.config.showEffects) {
            height += lineHeight;
            const effects = Array.from(this.game.snake.effects.entries());
            height += (effects.length || 1) * lineHeight;
        }
        if (this.config.showControls) height += lineHeight * 4;
        
        height += this.config.padding;
        
        // Draw background
        p5.fill(this.config.backgroundColor);
        p5.noStroke();
        p5.rect(x, y, 200, height);
        
        // Draw text
        p5.fill(this.config.textColor);
        let currentY = y + this.config.padding;

        // Draw current speed prominently at the top
        const speed = this.game.snake.getCurrentSpeed();
        p5.textSize(this.config.fontSize * 1.5);
        p5.textAlign(p5.CENTER);
        p5.text(`${speed.toFixed(1)} cells/sec`, x + 100, currentY);
        currentY += lineHeight * 1.5;
        
        // Reset text properties for regular debug info
        p5.textSize(this.config.fontSize);
        p5.textAlign(p5.LEFT);
        p5.stroke(this.config.textColor);
        p5.strokeWeight(0.5);
        p5.line(x + 10, currentY, x + 190, currentY);
        p5.noStroke();
        currentY += lineHeight * 0.5;

        if (this.config.showFPS) {
            p5.text(`FPS: ${Math.round(this.fps)}`, x + this.config.padding, currentY);
            currentY += lineHeight;
        }

        if (this.config.showSnakeInfo) {
            const snake = this.game.snake;
            const currentSpeed = snake.getCurrentSpeed ? snake.getCurrentSpeed() : this.game.config.snake.baseSpeed;
            
            p5.text(`Snake Length: ${snake.segments.length}`, x + this.config.padding, currentY);
            currentY += lineHeight;
            p5.text(`Direction: ${snake.direction}`, x + this.config.padding, currentY);
            currentY += lineHeight;
            p5.text(`Speed: ${currentSpeed.toFixed(1)}`, x + this.config.padding, currentY);
            currentY += lineHeight;
            p5.text(`Score: ${snake.score}`, x + this.config.padding, currentY);
            currentY += lineHeight;
        }

        if (this.config.showGridInfo) {
            const size = this.game.grid.getSize();
            const currentPreset = this.game.config.board.preset;
            const cellSize = this.game.config.board.presets[currentPreset].cellSize;
            p5.text(`Grid: ${size.width}x${size.height}`, x + this.config.padding, currentY);
            currentY += lineHeight;
            p5.text(`Cell Size: ${cellSize}px`, x + this.config.padding, currentY);
            currentY += lineHeight;
            p5.text(`Board Size: ${currentPreset}`, x + this.config.padding, currentY);
            currentY += lineHeight;
        }

        if (this.config.showEffects) {
            p5.text('Active Effects:', x + this.config.padding, currentY);
            currentY += lineHeight;
            const effects = Array.from(this.game.snake.effects.entries());
            if (effects.length === 0) {
                p5.text('None', x + this.config.padding + 10, currentY);
                currentY += lineHeight;
            } else {
                effects.forEach(([effect, stacks]) => {
                    const timeLeft = this.game.snake.getEffectTimeRemaining(effect) / 1000;
                    let effectText = `${effect}: ${timeLeft.toFixed(1)}s`;
                    
                    if (effect === 'points') {
                        effectText += ` (${this.game.snake.getPointsMultiplier()}x)`;
                    } else if (effect === 'speed') {
                        effectText += ` (${stacks.length}x)`;
                    }
                    
                    p5.text(effectText, x + this.config.padding + 10, currentY);
                    currentY += lineHeight;
                });
            }
        }

        if (this.config.showControls) {
            p5.text('Debug Controls:', x + this.config.padding, currentY);
            currentY += lineHeight;
            p5.text(`[1] Speed PowerUp`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
            p5.text(`[2] Ghost PowerUp`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
            p5.text(`[3] Points PowerUp`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
        }

        p5.pop();
    }

    /**
     * Changes the game board size
     * @param {'small' | 'medium' | 'large' | 'fullscreen'} preset - The preset to use
     */
    changeBoardSize(preset) {
        // Start with current config to maintain required fields
        const currentConfig = configManager.getConfig();
        const config = {
            ...currentConfig,
            board: {
                ...currentConfig.board,
                preset
            }
        };

        if (preset === 'fullscreen') {
            // Calculate dimensions based on window size and cell size
            const cellSize = currentConfig.board.cellSize;
            config.board.width = Math.floor(window.innerWidth / cellSize);
            config.board.height = Math.floor(window.innerHeight / cellSize);
        }

        // configManager.updateRuntime(config);
        this.game.config = config;

        // Recreate game with new size
        this.game.recreate();
    }
}
