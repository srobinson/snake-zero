import p5 from 'p5';
import configManager from '../config-ts/gameConfig';
import { Grid } from '../core-ts/Grid';
import { Snake } from '../entities-ts/Snake';
import { Food } from '../entities-ts/Food';
import { PowerUp } from '../entities-ts/PowerUp';
import { DebugPanel } from '../core-ts/DebugPanel';
import { GameStateMachine, GameStates } from '../core-ts/GameStateMachine';
import { EventSystem, GameEvents } from '../core-ts/EventSystem';
import { Particles } from '../core-ts/Particles';
import { PowerupBadge } from '../ui-ts/PowerupBadge';
import type { GameConfig } from '../config-ts/types';
import type { Position } from '../types-ts/commonTypes';
import type { PowerUpType } from '../types-ts/powerUpTypes';
import { isValidPowerUpType } from '../types-ts/powerUpTypes';
import type { Game as IGame } from '../types-ts/gameTypes';
import type { GameState } from '../types-ts/gameStateTypes';
import type { GridGameDependencies } from '../types-ts/gridTypes';

interface EventData {
    position?: Position;
    points?: number;
    multiplier?: number;
    powerUpType?: PowerUpType;
}

export default class Game implements IGame, GridGameDependencies {
    public config: GameConfig;
    public grid: Grid;
    public events: EventSystem;
    public stateMachine: GameStateMachine;
    public debugPanel: DebugPanel;
    public snake: Snake;
    public food: Food;
    public powerUp: PowerUp | null;
    public p5: p5 | null;
    public particles: Particles | null;
    public activePowerups: Map<string, PowerupBadge>;
    public floatingBadges: PowerupBadge[];

    constructor() {
        // Load configuration first
        configManager.loadFromLocalStorage()
        this.config = configManager.getConfig();
        
        // Initialize event system first since it's needed by Grid
        this.events = new EventSystem();
        
        // Initialize game components
        this.grid = new Grid(this);
        this.stateMachine = new GameStateMachine(this);
        this.debugPanel = new DebugPanel(this);
        this.snake = new Snake(this.grid, this);
        this.food = new Food(this.grid);
        this.food.setGame(this);
        this.powerUp = null;
        this.p5 = null;
        this.particles = null;
        this.activePowerups = new Map();
        this.floatingBadges = [];
        
        this.setupEventListeners();
        this.setupResizeHandler();
    }

    private setupEventListeners(): void {
        this.events.clear();
        
        this.events.on(GameEvents.FOOD_COLLECTED, (data: EventData) => {
            if (data?.position) {
                const foodColor = this.food.getColor();
                this.particles?.createFoodEffect(data.position, foodColor, data.points || 0, data.multiplier || 1);
                this.food.respawn();
            }
        });

        this.events.on(GameEvents.POWER_UP_COLLECTED, (data: EventData) => {
            if (data?.position && data?.powerUpType && this.particles) {
                this.particles.createPowerUpEffect(data.position, data.powerUpType);
                this.addPowerupBadge(data.powerUpType, data.position);
            }
        });

        this.events.on(GameEvents.POWER_UP_EXPIRED, (data: EventData) => {
            if (data?.powerUpType) {
                this.activePowerups.delete(data.powerUpType);
            }
        });

        this.events.on(GameEvents.COLLISION, () => {
            this.stateMachine.transition(GameStates.GAME_OVER);
        });
    }

    private setupResizeHandler(): void {
        window.addEventListener('resize', () => {
            if (this.p5) {
                this.p5.resizeCanvas(window.innerWidth, window.innerHeight);
                this.grid.updateDimensions();
            }
        });
    }

    public setup(p: p5): void {
        this.p5 = p;
        const canvas = p.createCanvas(this.grid.width, this.grid.height);
        canvas.parent('snaked-again-container');
        this.particles = new Particles(p, this.grid, this.config);
        this.grid.updateDimensions();
        this.stateMachine.transition(GameStates.MENU);
    }

    public update(): void {
        if (!this.stateMachine.isInState(GameStates.PLAYING)) return;

        const currentTime = Date.now();
        
        this.debugPanel.update(currentTime);
        this.snake.update(currentTime);
        
        // Check collision with walls or self
        if (this.snake.checkCollision()) {
            this.events.emit('collision', {
                position: this.snake.getHead(),
                type: 'self'
            });
            this.stateMachine.transition(GameStates.GAME_OVER);
            return;
        }

        // Check food collision
        if (this.snake.checkFoodCollision(this.food)) {
            const foodPos = this.food.getPosition();
            this.snake.grow();
            const basePoints = this.food.getPoints();
            const multiplier = this.snake.getPointsMultiplier();
            const finalPoints = basePoints * multiplier;
            this.stateMachine.updateScore(finalPoints);
            this.events.emit(GameEvents.FOOD_COLLECTED, {
                position: foodPos,
                points: basePoints,
                multiplier: multiplier
            });
            this.food.respawn();
        }

        // Check power-up collision        
        if (this.powerUp && this.snake.checkPowerUpCollision(this.powerUp)) {
            const powerUpType = this.powerUp.getType();
            const powerUpPos = this.powerUp.getPosition();
            this.snake.addEffect(powerUpType);
            this.applyPowerup(powerUpType, powerUpPos);
            this.events.emit(GameEvents.POWER_UP_COLLECTED, {
                powerUpType,
                position: powerUpPos
            });
            this.powerUp = null;
        }

        // Spawn new power-up
        const difficulty = this.config.difficulty.presets[this.config.difficulty.current];
        if (!this.powerUp && Math.random() < difficulty.powerUpChance) {            
            this.powerUp = new PowerUp(
                this.grid,
                [this.snake, this.food]
            );
        }
    }

    public draw(): void {
        if (!this.p5) return;
        const p = this.p5;
        
        p.background(this.config.board.backgroundColor);
        
        this.grid.draw(p);
        this.food.draw(p);
        
        if (this.powerUp) {
            this.powerUp.draw(p);
        }
        
        this.snake.update(Date.now());
        this.snake.draw(p);
        
        if (this.particles) {
            this.particles.update();
            this.particles.draw();
        }
        
        for (const badge of this.activePowerups.values()) {
            badge.update();
            badge.draw();
            if (badge.isComplete()) {
                this.activePowerups.delete(badge.getType());
            }
        }
        
        for (let i = this.floatingBadges.length - 1; i >= 0; i--) {
            const badge = this.floatingBadges[i];
            badge.update();
            badge.draw();
            if (badge.isComplete()) {
                this.floatingBadges.splice(i, 1);
            }
        }
        
        this.debugPanel.draw(p);
        
        switch (this.stateMachine.getState()) {
            case GameStates.MENU:
                this.drawMenu();
                break;
            case GameStates.PAUSED:
                this.drawPauseOverlay();
                break;
            case GameStates.GAME_OVER:
                this.drawGameOver();
                break;
            default:
                this.drawScore();
                break;
        }
    }

    drawMenu(): void {
        if (!this.p5) return;
        const p = this.p5;
        
        p.fill(255);
        p.textSize(32);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('Snake Zero', this.grid.pixelWidth/2, this.grid.pixelHeight/2 - 60);
        
        p.textSize(20);
        p.text(`High Score: ${this.stateMachine.getScore()}`, this.grid.pixelWidth/2, this.grid.pixelHeight/2);
        p.text('Press SPACE to Start', this.grid.pixelWidth/2, this.grid.pixelHeight/2 + 40);
        
        p.textSize(16);
        p.text('Use Arrow Keys or WASD to move', this.grid.pixelWidth/2, this.grid.pixelHeight/2 + 80);
    }

    drawPauseOverlay(): void {
        if (!this.p5) return;
        const p = this.p5;
        
        p.fill(255);
        p.textSize(16);
        p.textAlign(p.RIGHT, p.TOP);
        p.text('PAUSED', this.grid.pixelWidth - 10, 10);
    }

    drawGameOver(): void {
        if (!this.p5) return;
        const p = this.p5;
        
        p.fill(0, 0, 0, 200);
        p.rect(0, 0, this.grid.pixelWidth, this.grid.pixelHeight);
        
        p.fill(255);
        p.textSize(32);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('Game Over!', this.grid.pixelWidth/2, this.grid.pixelHeight/2 - 40);
        
        p.textSize(24);
        p.text(`Score: ${this.stateMachine.getScore()}`, this.grid.pixelWidth/2, this.grid.pixelHeight/2 + 10);
        if (this.stateMachine.getScore() === this.stateMachine.highScore()) {
            p.text('New High Score!', this.grid.pixelWidth/2, this.grid.pixelHeight/2 + 40);
        }
        
        p.textSize(16);
        p.text('Press SPACE to Restart', this.grid.pixelWidth/2, this.grid.pixelHeight/2 + 80);
        p.text('Press ESC for Menu', this.grid.pixelWidth/2, this.grid.pixelHeight/2 + 110);
    }

    drawScore(): void {
        if (!this.p5) return;
        const p = this.p5;
        
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(20);
        p.fill(255);
        p.text(`Score: ${this.stateMachine.getScore()}`, 10, 10);
    }

    public handleKeyPress(key: string): void {
        // First try to handle with debug panel
        if (this.debugPanel.handleInput(key, this.p5?.keyIsPressed && this.p5.keyCode === this.p5.SHIFT)) {
            return;
        }

        // Then try game input
        this.handleInput(key, this.p5?.keyIsPressed && this.p5.keyCode === this.p5.SHIFT);
    }

    public handleInput(key: string, isShiftPressed: boolean): boolean {
        switch (key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.snake.setDirection('up');
                return true;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.snake.setDirection('down');
                return true;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.snake.setDirection('left');
                return true;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.snake.setDirection('right');
                return true;
            case ' ':
                if (this.stateMachine.getState() === GameStates.MENU) {
                    this.stateMachine.transition(GameStates.PLAYING);
                } else if (this.stateMachine.getState() === GameStates.GAME_OVER) {
                    this.reset();
                    this.stateMachine.transition(GameStates.MENU);
                }
                return true;
            case 'p':
            case 'P':
                if (this.stateMachine.getState() === GameStates.PLAYING) {
                    this.stateMachine.transition(GameStates.PAUSED);
                } else if (this.stateMachine.getState() === GameStates.PAUSED) {
                    this.stateMachine.transition(GameStates.PLAYING);
                }
                return true;
            case 'Escape':
                if (this.stateMachine.getState() === GameStates.GAME_OVER) {
                    this.reset();
                    this.stateMachine.transition(GameStates.MENU);
                }
                return true;
            default:
                return false;
        }
    }

    public reset(): void {
        this.snake = new Snake(this.grid, this);
        this.food = new Food(this.grid);
        this.food.setGame(this);
        this.powerUp = null;
        if (this.particles) {
            this.particles.update();
        }
        this.activePowerups.clear();
        this.floatingBadges = [];
        this.setupEventListeners();
    }

    public getState(): GameState {
        return this.stateMachine.getState();
    }

    public getEvents(): EventSystem {
        return this.events;
    }

    public getConfig(): GameConfig {
        return this.config;
    }

    public recreate(): void {
        this.reset();
        this.grid.updateDimensions();
    }

    // Methods required by GridGameDependencies interface
    public applyPowerup(type: string, powerUpPosition: Position): void {
        const powerUpType = type as PowerUpType;
        if (!isValidPowerUpType(powerUpType)) {
            console.warn(`Invalid power-up type: ${type}`);
            return;
        }
        // Get powerup duration from config
        const duration = this.config.powerUps.effects[powerUpType].duration;
        this.addPowerupBadge(powerUpType, powerUpPosition);
        
        // Create pop-in particle effect at snake's head
        const segments = this.snake.getSegments();
        const position = segments[0];
        this.particles?.createPowerUpEffect(position, powerUpType);
    }

    public addPowerupBadge(type: string, powerUpPosition: Position): void {
        const powerUpType = type as PowerUpType;
        if (!isValidPowerUpType(powerUpType)) {
            console.warn(`Invalid power-up type: ${type}`);
            return;
        }
        if (!this.p5) return;
        
        const config = this.config.powerupBadges || {};
        const cellSize = this.grid.cellSize;
        
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
        const effectDuration = this.config.powerUps.effects[powerUpType].duration;
        const remainingDuration = this.snake.getEffectTimeRemaining(powerUpType);
        const uiBadge = new PowerupBadge(
            this.p5,
            powerUpType,
            {
                ...config,
                duration: remainingDuration || effectDuration, // Use remaining duration if available
                size: badgeSize,
                popInDuration: 300,
                popInScale: 1.15,
                spacing: 0.2,
                floatingSize: 2.0,
                hoverAmplitude: cellSize * 0.08,
                hoverFrequency: 3,
                fadeOutDuration: 500,
                offsetY: -50
            },
            margin + (badgeCount * (badgeSize + badgeSpacing)),
            margin,
            false // isFloating = false
        );
        this.activePowerups.set(powerUpType, uiBadge);

        // Create floating badge at collection point
        const floatingBadgeSize = cellSize * (cellSize < 20 ? 2.5 : 1.8); // Reduced floating badge size
        const floatingBadge = new PowerupBadge(
            this.p5,
            powerUpType,
            {
                ...config,
                duration: 1500,
                popInDuration: 300,
                popInScale: 1.2,
                spacing: 0.2,
                size: floatingBadgeSize,
                floatingSize: 2.0,
                hoverAmplitude: cellSize * 0.15,
                hoverFrequency: 3,
                fadeOutDuration: 500,
                offsetY: -50
            },
            powerUpPos.x,
            powerUpPos.y,
            true // isFloating = true
        );
        this.floatingBadges.push(floatingBadge);
    }

    public drawGame(): void {
        // Drawing handled in draw()
    }

    public addFloatingBadge(badge: PowerupBadge): void {
        this.floatingBadges.push(badge);
    }
}

// Initialize p5.js and create game instance
const game = new Game();

new p5((p: p5) => {
    p.setup = () => {
        game.setup(p);
    };

    p.draw = () => {
        game.update();
        game.draw();
    };

    p.keyPressed = () => {
        game.handleKeyPress(p.key);
        return false; // Prevent default browser behavior
    };
});
