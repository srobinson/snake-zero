import configManager from '../config/gameConfig.js';
import { PowerUp } from '../entities/PowerUp.js';

export class DebugPanel {
    constructor(game) {
        this.game = game;
        this.config = configManager.getConfig().debug;
        this.enabled = this.config.enabled;
        this.visible = this.enabled; // Make panel visible if debug is enabled
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateInterval = 500; // Update FPS every 500ms
        this.lastFpsUpdate = 0;
    }

    handleInput(key, isShiftPressed = false) {
        if (key === this.config.shortcutKey) {
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
            const size = Object.entries(boardControls).find(([_, k]) => k === key)[0];
            this.changeBoardSize(size);
            return true;
        }
        
        return false;
    }

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

    toggle() {
        this.visible = !this.visible;
    }

    update(currentTime) {
        if (!this.enabled) return;

        // Update FPS calculation
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
            this.lastFpsUpdate = currentTime;
            this.frameCount = 0;
        }
    }

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
        if (this.config.showGridInfo) height += lineHeight * 2;
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
            p5.text(`Snake Length: ${snake.segments.length}`, x + this.config.padding, currentY);
            currentY += lineHeight;
            p5.text(`Direction: ${snake.direction}`, x + this.config.padding, currentY);
            currentY += lineHeight;
            p5.text(`Base Speed: ${snake.baseSpeed.toFixed(1)}`, x + this.config.padding, currentY);
            currentY += lineHeight;
            p5.text(`Food Eaten: ${snake.foodEaten}`, x + this.config.padding, currentY);
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

    changeBoardSize(preset) {
        // Update config
        const config = configManager.getConfig();
        config.board.preset = preset;

        // Update fullscreen dimensions if needed
        if (preset === 'fullscreen') {
            config.board.presets.fullscreen.width = window.innerWidth;
            config.board.presets.fullscreen.height = window.innerHeight;
        }

        // Recreate game with new size
        this.game.recreate();
    }
}
