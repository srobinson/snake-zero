import { PowerUp } from '../entities/PowerUp.js';

export class DebugPanel {
    constructor(game) {
        if (!game) throw new Error('Game is required for DebugPanel');
        
        this.game = game;
        this.config = game.getConfig();
        this.visible = this.config.debug || false;
        this.level = this.config.debugLevel || 1;
        this.lastUpdate = 0;
        this.fps = 0;
        this.frameCount = 0;
    }

    toggle() {
        this.visible = !this.visible;
    }

    handleInput(key, isShiftPressed) {
        if (!this.visible) return;

        switch (key.toLowerCase()) {
            // Grid controls
            case 'g':
                if (isShiftPressed) {
                    const cellSize = this.game.getGrid().cellSize;
                    if (cellSize < 50) {
                        this.game.getGrid().updateCellSize(cellSize + 5);
                    }
                } else {
                    const cellSize = this.game.getGrid().cellSize;
                    if (cellSize > 10) {
                        this.game.getGrid().updateCellSize(cellSize - 5);
                    }
                }
                break;

            // Speed controls
            case 's':
                if (isShiftPressed) {
                    const currentSpeed = this.game.getSnake().getCurrentSpeed();
                    if (currentSpeed < (this.config.maxSpeed || 15)) {
                        this.game.getSnake().baseSpeed = Math.min(currentSpeed + 1, this.config.maxSpeed || 15);
                    }
                } else {
                    const currentSpeed = this.game.getSnake().getCurrentSpeed();
                    if (currentSpeed > (this.config.minSpeed || 1)) {
                        this.game.getSnake().baseSpeed = Math.max(currentSpeed - 1, this.config.minSpeed || 1);
                    }
                }
                break;

            // Food controls
            case 'f':
                this.game.getFood().respawn([this.game.getSnake()]);
                break;

            // Power-up controls
            case 'p':
                if (this.game.getPowerUp()) {
                    this.game.setPowerUp(null);
                } else {
                    const powerUp = new PowerUp(this.game.getGrid(), this.game);
                    this.game.setPowerUp(powerUp);
                }
                break;

            // Debug level controls
            case 'd':
                if (isShiftPressed) {
                    this.level = Math.min(this.level + 1, 3);
                } else {
                    this.level = Math.max(this.level - 1, 1);
                }
                break;
        }
    }

    update(currentTime) {
        if (!this.visible) return;

        // Update FPS counter
        this.frameCount++;
        const timeDiff = currentTime - this.lastUpdate;
        
        if (timeDiff >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / timeDiff);
            this.frameCount = 0;
            this.lastUpdate = currentTime;
        }
    }

    draw(p5) {
        if (!this.visible) return;

        const padding = 10;
        let y = padding;
        const lineHeight = 20;

        // Semi-transparent background
        p5.fill(0, 0, 0, 180);
        p5.noStroke();
        p5.rect(0, 0, 300, this.level * 6 * lineHeight + padding * 2);

        // Text settings
        p5.fill(255);
        p5.textSize(12);
        p5.textAlign(p5.LEFT, p5.TOP);

        // Basic info (Level 1)
        this.drawLine(p5, `Grid: ${this.game.getGrid().cols}x${this.game.getGrid().rows} (${this.game.getGrid().cellSize}px)`, padding, y);
        y += lineHeight;
        
        this.drawLine(p5, `Snake Length: ${this.game.getSnake().segments.length}`, padding, y);
        y += lineHeight;
        
        this.drawLine(p5, `Snake Speed: ${this.game.getSnake().getCurrentSpeed().toFixed(2)}`, padding, y);
        y += lineHeight;

        if (this.game.getPowerUp()) {
            this.drawLine(p5, `Power-up: ${this.game.getPowerUp().type}`, padding, y);
            y += lineHeight;
        }

        // Additional info (Level 2)
        if (this.level >= 2) {
            this.drawLine(p5, `FPS: ${p5.frameRate().toFixed(1)}`, padding, y);
            y += lineHeight;
            
            this.drawLine(p5, `Score: ${this.game.getScore()}`, padding, y);
            y += lineHeight;
            
            this.drawLine(p5, `High Score: ${this.game.getHighScore()}`, padding, y);
            y += lineHeight;
        }

        // Advanced info (Level 3)
        if (this.level >= 3) {
            const snake = this.game.getSnake();
            this.drawLine(p5, 'Active Effects:', padding, y);
            y += lineHeight;
            
            for (const [type, effect] of snake.effects) {
                const remaining = snake.getEffectTimeRemaining(type);
                if (remaining > 0) {
                    this.drawLine(p5, `  ${type}: ${(remaining / 1000).toFixed(1)}s`, padding, y);
                    y += lineHeight;
                }
            }
        }
    }

    drawLine(p5, text, x, y) {
        p5.text(text, x, y);
    }
}
