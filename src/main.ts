import p5 from 'p5';
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

interface Position {
    x: number;
    y: number;
}

export default class Game {
    private config: any;
    private grid: Grid;
    private events: EventSystem;
    private stateMachine: GameController;
    private debugPanel: DebugPanel;
    private snake: Snake;
    private food: Food;
    private powerUp: PowerUp | null;
    private p5: p5 | null;
    private particles: Particles | null;
    private activePowerups: Map<string, PowerupBadge>;
    private floatingBadges: PowerupBadge[];

    constructor() {
        configManager.initializeConfig();
        this.config = configManager.getConfig();
        
        this.grid = new Grid(this.config);
        this.events = new EventSystem();
        this.stateMachine = new GameController(this);
        this.debugPanel = new DebugPanel(this);
        this.snake = new Snake(this.grid, this);
        this.food = new Food(this.grid);
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
        
        this.events.on(GameEvents.FOOD_COLLECTED, (data) => {
            if (data && data.position) {
                const foodColor = this.food.color || 'default';
                this.particles?.createFoodEffect(data.position, foodColor, data.points, data.multiplier);
                this.food.respawn([this.snake]);
            }
        });

        this.events.on(GameEvents.POWER_UP_COLLECTED, (data) => {
            if (data && data.position && data.powerUpType) {
                this.particles?.createPowerUpEffect(data.position, data.powerUpType);
            }
        });

        this.events.on(GameEvents.COLLISION, () => {
            this.stateMachine.transition(GameStates.GAME_OVER);
        });
    }

    private setupResizeHandler(): void {
        window.addEventListener('resize', () => {
            if (this.config.board.preset === 'fullscreen') {
                this.grid.updateDimensions?.();
                
                if (this.p5) {
                    this.p5.resizeCanvas(this.grid.width || 0, this.grid.height || 0);
                }
            }
        });
    }

    setup(p5Instance: p5): void {
        this.p5 = p5Instance;
        const canvas = p5Instance.createCanvas(this.grid.width, this.grid.height);
        canvas.parent('snaked-again-container');
        this.particles = new Particles(p5Instance, this.grid, this);
    }

    update(): void {
        if (!this.stateMachine.isInState(GameStates.PLAYING)) return;

        const currentTime = this.p5?.millis() ?? 0;
        
        this.debugPanel.update(currentTime);
        
        if (this.snake.update(currentTime)) {
            if (this.snake.checkCollision()) {
                this.events.emit(GameEvents.COLLISION, {
                    position: this.snake.segments[0]
                });
                return;
            }

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
                    score: this.stateMachine.getCurrentScore()
                });
            }

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

        const difficulty = this.config.difficulty.presets[this.config.difficulty.current];
        if (!this.powerUp && Math.random() < difficulty.powerUpChance) {
            this.powerUp = new PowerUp(this.grid, [this.snake, this.food]);
        }
    }

    draw(): void {
        if (!this.p5) return;

        this.p5.background(220);

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
                this.drawGameOver();
                break;
        }
    }

    private drawGame(): void {
        this.snake.draw(this.p5!);
        this.food.draw(this.p5!);
        if (this.powerUp) this.powerUp.draw(this.p5!);
        this.drawScore();
        this.debugPanel.draw(this.p5!);
    }

    private drawMenu(): void {
        // Implement menu drawing logic
        this.p5?.textSize(32);
        this.p5?.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5?.text('SNAKED AGAIN', this.p5.width / 2, this.p5.height / 2 - 50);
        this.p5?.textSize(16);
        this.p5?.text('Press SPACE to Start', this.p5.width / 2, this.p5.height / 2 + 50);
    }

    private drawPauseOverlay(): void {
        this.p5?.fill(0, 100);
        this.p5?.rect(0, 0, this.p5.width, this.p5.height);
        this.p5?.fill(255);
        this.p5?.textSize(32);
        this.p5?.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5?.text('PAUSED', this.p5.width / 2, this.p5.height / 2);
    }

    private drawGameOver(): void {
        this.p5?.fill(0, 100);
        this.p5?.rect(0, 0, this.p5.width, this.p5.height);
        this.p5?.fill(255);
        this.p5?.textSize(32);
        this.p5?.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5?.text('GAME OVER', this.p5.width / 2, this.p5.height / 2 - 50);
        this.p5?.textSize(16);
        this.p5?.text(`Score: ${this.stateMachine.getCurrentScore()}`, this.p5.width / 2, this.p5.height / 2);
        this.p5?.text('Press SPACE to Return to Menu', this.p5.width / 2, this.p5.height / 2 + 50);
    }

    private drawScore(): void {
        this.p5?.textSize(16);
        this.p5?.textAlign(this.p5.LEFT, this.p5.TOP);
        this.p5?.text(`Score: ${this.stateMachine.getCurrentScore()}`, 10, 10);
    }

    handleInput(key: string, isShiftPressed: boolean = false): void {
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

    recreate(): boolean {
        // Save current state
        const wasPlaying = this.stateMachine.isInState(GameStates.PLAYING);
        
        // Create new grid with updated config
        this.grid = new Grid(this.config);
        
        // Reset game elements
        this.reset();

        // Resize canvas
        const preset = this.config.board.presets[this.config.board.preset];
        this.p5?.resizeCanvas(preset.width, preset.height);

        // Center canvas in container
        const container = document.getElementById('snaked-again-container');
        if (container) {
            container.style.width = `${preset.width}px`;
            container.style.height = `${preset.height}px`;
            container.style.position = 'absolute';
            container.style.left = '50%';
            container.style.top = '50%';
            container.style.transform = 'translate(-50%, -50%)';
        }

        // Restore state if was playing
        if (wasPlaying) {
            this.stateMachine.transition(GameStates.PLAYING);
        }

        return true;
    }

    reset(): void {
        this.snake = new Snake(this.grid, this);
        this.food = new Food(this.grid);
        this.powerUp = null;
        this.setupEventListeners();
    }

    applyPowerup(type: string, powerUpPosition: { x: number, y: number }): void {
        // Implement powerup application logic
        const duration = this.config.powerUps.effects[type].duration;
        this.addPowerupBadge(type, powerUpPosition);
    }

    addPowerupBadge(type: string, powerUpPosition: { x: number, y: number }): void {
        // Implement badge creation logic
    }

    getSnake(): Snake {
        return this.snake;
    }

    getGrid(): Grid {
        return this.grid;
    }

    getFood(): Food {
        return this.food;
    }

    getPowerUp(): PowerUp | null {
        return this.powerUp;
    }

    getConfig(): any {
        return this.config;
    }

    getCurrentScore(): number {
        return this.stateMachine.getCurrentScore();
    }

    getCurrentHighScore(): number {
        return this.stateMachine.getCurrentHighScore();
    }

    getPlayTime(): number {
        return this.stateMachine.getPlayTime();
    }
}

// Global variables
let game: Game;
let touchStartX = 0;
let touchStartY = 0;
const MIN_SWIPE_DISTANCE = 30;

// Prevent default touch behavior to avoid scrolling
document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// p5.js touch handlers
function touchStarted(event: TouchEvent | MouseEvent): boolean {
    if (!game) return false;
    
    const clientX = event instanceof TouchEvent 
        ? event.touches[0].clientX 
        : event.clientX;
    const clientY = event instanceof TouchEvent 
        ? event.touches[0].clientY 
        : event.clientY;

    // Store touch start coordinates
    touchStartX = clientX;
    touchStartY = clientY;

    // Prevent default touch behavior
    event.preventDefault();

    return false;
}

function touchEnded(event: TouchEvent | MouseEvent): boolean {
    if (!game) return false;
    
    const clientX = event instanceof TouchEvent 
        ? event.changedTouches[0].clientX 
        : event.clientX;
    const clientY = event instanceof TouchEvent 
        ? event.changedTouches[0].clientY 
        : event.clientY;

    const deltaX = clientX - touchStartX;
    const deltaY = clientY - touchStartY;
    
    if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE || Math.abs(deltaY) > MIN_SWIPE_DISTANCE) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            game.snake.setDirection(deltaX > 0 ? 'right' : 'left');
        } else {
            game.snake.setDirection(deltaY > 0 ? 'down' : 'up');
        }
    }
    
    // Prevent default touch behavior
    event.preventDefault();

    return false;
}

// Initialize p5.js in instance mode
new p5((p: p5) => {
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
