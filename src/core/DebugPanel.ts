// @ts-ignore
import configManager from '../config/gameConfig';
import { PowerUp } from '../entities/PowerUp';
import { Game } from '../types/Game';
import { BoardPreset } from '../types/BoardTypes';

type DebugConfig = {
    enabled: boolean;
    shortcutKey: string | string[];
    fontSize: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    padding: number;
    backgroundColor: string;
    textColor: string;
    showFPS: boolean;
    showSnakeInfo: boolean;
    showGridInfo: boolean;
    showEffects: boolean;
    showControls: boolean;
    controls: {
        grid: {
            increaseCellSize: string;
            decreaseCellSize: string;
        };
        spawn: {
            speed: string;
            ghost: string;
            points: string;
            slow: string;
        };
        snake: {
            grow: string;
        };
        board: Record<BoardPreset, string>;
    };
};

export class DebugPanel {
    private game: Game;
    private config: DebugConfig;
    private enabled: boolean;
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
        this.enabled = this.config.enabled;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateInterval = 500;
        this.lastFpsUpdate = 0;
    }

    handleInput(key: string, isShiftPressed: boolean = false): boolean {
        const shortcuts = Array.isArray(this.config.shortcutKey) 
            ? this.config.shortcutKey 
            : [this.config.shortcutKey];
            
        if (shortcuts.includes(key)) {
            this.toggle();
            return true;
        }

        if (!this.visible) return false;

        // Grid size controls
        const gridControls = this.config.controls.grid;
        if (key === '=' || key === '+' || key === gridControls.increaseCellSize) {
            return this.adjustCellSize(5);
        } 
        else if (key === '-' || key === '_' || key === gridControls.decreaseCellSize) {
            return this.adjustCellSize(-5);
        }
        
        // Spawn power-up controls
        const spawnControls = this.config.controls.spawn;
        const powerUpTypes = ['speed', 'ghost', 'points', 'slow'] as const;
        for (const type of powerUpTypes) {
            if (spawnControls[type] === key) {
                this.spawnPowerUp(type);
                return true;
            }
        }

        // Snake controls
        const snakeControls = this.config.controls.snake;
        if (snakeControls.grow === key) {
            this.game.snake.grow();
            return true;
        }

        // Board size controls
        const boardControls = this.config.controls.board;
        const boardSizeMatch = Object.entries(boardControls).find(([_, k]) => k === key);
        if (boardSizeMatch) {
            const [size] = boardSizeMatch;
            if (['small', 'medium', 'large', 'fullscreen'].includes(size)) {
                this.changeBoardSize(size as BoardPreset);
                return true;
            }
        }
        
        return false;
    }

    private adjustCellSize(delta: number): boolean {
        const currentPreset = this.game.config.board.preset;
        const presets = this.game.config.board.presets;
        const oldSize = presets[currentPreset].cellSize;
        const newSize = oldSize + delta;

        presets[currentPreset].cellSize = newSize;
        if (currentPreset === 'fullscreen') {
            const { innerWidth, innerHeight } = window;
            presets.fullscreen.width = innerWidth;
            presets.fullscreen.height = innerHeight;
        }

        return this.game.grid.updateCellSize(newSize) && this.game.recreate();
    }

    spawnPowerUp(type: 'speed' | 'ghost' | 'points' | 'slow') {
        this.game.powerUp = new PowerUp(
            this.game.grid, 
            [this.game.snake, this.game.food]
        );
        this.game.powerUp.setType(type);
    }

    toggle() {
        this.visible = !this.visible;
    }

    update(currentTime: number) {
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate > this.fpsUpdateInterval) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }

    draw(p5: any) {
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
            p5.text(`Direction: ${snake.getDirection()}`, x + this.config.padding, currentY);
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
            p5.text(`[1] Speed PowerUp`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
            p5.text(`[2] Ghost PowerUp`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
            p5.text(`[3] Points PowerUp`, x + this.config.padding + 10, currentY);
            currentY += lineHeight;
        }

        p5.pop();
    }

    changeBoardSize(preset: BoardPreset) {
        const currentConfig = configManager.getConfig();
        const config = {
            ...currentConfig,
            board: {
                ...currentConfig.board,
                preset
            }
        };

        if (preset === 'fullscreen') {
            const cellSize = currentConfig.board.cellSize;
            config.board.width = Math.floor(window.innerWidth / cellSize);
            config.board.height = Math.floor(window.innerHeight / cellSize);
        }

        this.game.config = config;
        this.game.recreate();
    }
}
