import configManager from '../config-ts/gameConfig';
import { PowerUp } from '../entities-ts/PowerUp';
import type { Game, DebugConfig, BoardPreset } from '../types-ts/debugPanelTypes';
import type { P5CanvasInstance } from '../types-ts/commonTypes';

export class DebugPanel {
    private game: Game;
    private config: DebugConfig;
    private visible: boolean;
    private lastFrameTime: number;
    private frameCount: number;
    private fps: number;
    private fpsUpdateInterval: number;
    private lastFpsUpdate: number;

    constructor(game: Game) {
        this.game = game;
        this.config = configManager.getConfig().debug;
        this.visible = this.config.enabled;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateInterval = 500;
        this.lastFpsUpdate = 0;
    }

    public handleInput(key: string, isShiftPressed = false): boolean {
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

            // Update both the current preset and fullscreen preset
            presets[currentPreset].cellSize = newSize;
            if (currentPreset === 'fullscreen') {
                // In fullscreen, also update dimensions based on new cell size
                const { innerWidth, innerHeight } = window;
                presets.fullscreen.width = innerWidth;
                presets.fullscreen.height = innerHeight;
            }

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

            // Update both the current preset and fullscreen preset
            presets[currentPreset].cellSize = newSize;
            if (currentPreset === 'fullscreen') {
                // In fullscreen, also update dimensions based on new cell size
                const { innerWidth, innerHeight } = window;
                presets.fullscreen.width = innerWidth;
                presets.fullscreen.height = innerHeight;
            }

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
        } else if (spawnControls.slow === key) {
            this.spawnPowerUp('slow');
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
                if (size === 'small' || size === 'medium' || size === 'large' || size === 'fullscreen') {
                    this.changeBoardSize(size as BoardPreset);
                    return true;
                }
            }
        }
        
        return false;
    }

    public spawnPowerUp(type: 'speed' | 'ghost' | 'points' | 'slow'): void {
        // Create power-up with snake and food as obstacles
        const powerUp = new PowerUp(
            this.game.grid,
            [this.game.snake, this.game.food]
        );

        // Override the type if specified
        if (type) {
            powerUp.type = type;
        }

        // Assign to game
        this.game.powerUp = powerUp;
    }

    public toggle(): void {
        this.visible = !this.visible;
    }

    public update(currentTime: number): void {
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate > this.fpsUpdateInterval) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }

    public draw(p5: P5CanvasInstance): void {
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
            const effects = Array.from(this.game.snake.getEffects().entries());
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

        // Reset text size and alignment
        p5.textSize(this.config.fontSize);
        p5.textAlign(p5.LEFT, p5.TOP);

        if (this.config.showFPS) {
            p5.text(`FPS: ${this.fps}`, x + this.config.padding, currentY);
            currentY += lineHeight;
        }

        if (this.config.showSnakeInfo) {
            p5.text('Snake:', x + this.config.padding, currentY);
            currentY += lineHeight;
            p5.text(`Length: ${this.game.snake.getSegments().length}`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
            p5.text(`Direction: ${this.game.snake.getDirection()}`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
            p5.text(`Score: ${this.game.snake.getScore()}`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
        }

        if (this.config.showGridInfo) {
            p5.text('Grid:', x + this.config.padding, currentY);
            currentY += lineHeight;
            p5.text(`Size: ${this.game.grid.width}x${this.game.grid.height}`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
            p5.text(`Cell Size: ${this.game.grid.cellSize}px`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
        }

        if (this.config.showEffects) {
            p5.text('Active Effects:', x + this.config.padding, currentY);
            currentY += lineHeight;
            
            const effects = Array.from(this.game.snake.getEffects().entries());
            if (effects.length === 0) {
                p5.text('None', x + this.config.padding + 10, currentY);
                currentY += lineHeight;
            } else {
                effects.forEach(([effect, stacks]) => {
                    const timeLeft = this.game.snake.getEffectTimeRemaining(effect);
                    let effectText = `${effect}: ${(timeLeft / 1000).toFixed(1)}s`;
                    
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
            p5.text(`[1-4] Spawn PowerUps`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
            p5.text(`[Q-R] Change Board Size`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
            p5.text(`[+/-] Change Cell Size`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
        }

        p5.pop();
    }

    public changeBoardSize(preset: BoardPreset): void {
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

        // Update config and recreate game
        configManager.override(config);
        this.game.recreate();
    }
}
