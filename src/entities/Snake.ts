import type P5 from 'p5';
import configManager from '../config/gameConfig';
import type { GameConfig, SnakeConfig, PowerUpType } from '../config/types';
import type { Grid } from '../core/Grid';
import type { Game } from '../main';
import type {
    Position,
    Effect,
    SnakeSegmentConfig,
    Direction,
    DrawingContext
} from './types';

/**
 * Snake class representing the player-controlled snake in the game.
 */
export class Snake {
    private readonly grid: Grid;
    private readonly game: Game;
    private readonly config: GameConfig;
    public readonly effects: Map<PowerUpType, Effect[]>;
    public readonly segments: Position[];
    private direction: Direction;
    private nextDirection: Direction;
    private lastMoveTime: number;
    public score: number;
    private growing: boolean;
    public foodEaten: number;
    private baseSpeed: number;
    private moveInterval: number = 0;
    private snakeConfig: SnakeConfig;

    constructor(grid: Grid, game: Game) {
        
        this.grid = grid;
        this.game = game;
        this.config = configManager.getConfig();
        this.effects = new Map();
        
        // Initialize base properties
        this.segments = [];
        this.direction = this.config.snake.initialDirection as Direction || 'right';
        this.nextDirection = this.direction;
        this.lastMoveTime = 0;
        this.score = 0;
        this.growing = false;
        this.foodEaten = 0;
        this.baseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
        this.snakeConfig = this.config.snake;
        
        // Initialize snake segments
        this.reset();
    }

    public reset(): void {
        const gridSize = this.grid.getSize();
        
        // Calculate center position
        const centerX = Math.floor(gridSize.width / 2);
        const centerY = Math.floor(gridSize.height / 2);
        
        // Clear segments array
        this.segments.length = 0;
        
        // Add head segments (always 2 cells)
        this.segments.push(
            { x: centerX, y: centerY },       // Front of head
            { x: centerX - 1, y: centerY }    // Back of head
        );
        
        // Add initial body segments based on config
        for (let i = 0; i < this.snakeConfig.initialLength - 2; i++) {
            this.segments.push({ x: centerX - (i + 2), y: centerY });
        }
        
        // Reset properties
        this.direction = this.snakeConfig.initialDirection as Direction || 'right';
        this.nextDirection = this.direction;
        this.lastMoveTime = 0;
        this.score = 0;
        this.growing = false;
        this.foodEaten = 0;
        this.effects.clear();
        this.baseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
    }

    public update(currentTime: number): boolean {
        // Update effects first
        this.updateEffects();

        // Check if it's time to move
        if (!this.lastMoveTime) {
            this.lastMoveTime = currentTime;
            return false;
        }

        const elapsed = currentTime - this.lastMoveTime;
        if (elapsed < this.getMoveDelay()) {
            return false;
        }

        // Update direction and move
        this.direction = this.nextDirection;
        const head: Position = { ...this.segments[0] };

        // Calculate new head position
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Handle wrapping in ghost mode
        const size = this.grid.getSize();
        if (this.hasEffect('ghost')) {
            if (head.x < 0) head.x = size.width - 1;
            if (head.x >= size.width) head.x = 0;
            if (head.y < 0) head.y = size.height - 1;
            if (head.y >= size.height) head.y = 0;
        }

        // Update segments
        this.segments.unshift(head);
        if (!this.growing) {
            this.segments.pop();
        }
        this.growing = false;

        // Update move timing
        this.lastMoveTime = currentTime;
        this.moveInterval = 1000 / this.getCurrentSpeed();

        return true;
    }

    public setDirection(newDirection: Direction): void {
        // Prevent 180-degree turns
        const opposites: Record<Direction, Direction> = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (this.direction !== opposites[newDirection]) {
            this.nextDirection = newDirection;
        }
    }

    public grow(): void {
        this.growing = true;
        this.foodEaten = (this.foodEaten || 0) + 1;
        this.score += Math.round(10 * this.getPointsMultiplier());
        
        if (this.snakeConfig.speedProgression.enabled) {
            // Get current difficulty base speed
            const difficultyBaseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
            
            // Calculate speed increase
            const speedIncrease = this.foodEaten * this.snakeConfig.speedProgression.increasePerFood;
            
            // Apply speed increase with maximum cap
            this.baseSpeed = Math.min(
                difficultyBaseSpeed + speedIncrease,
                this.snakeConfig.speedProgression.maxSpeed
            );
        }
    }

    private updateEffects(): void {
        const currentTime = Date.now();
        
        // Check each effect type
        for (const [type, effects] of this.effects.entries()) {
            // Remove expired effects
            const activeEffects = effects.filter(effect => 
                currentTime - effect.startTime < effect.duration
            );
            
            if (activeEffects.length > 0) {
                this.effects.set(type, activeEffects);
            } else {
                this.effects.delete(type);
            }
        }
    }

    public hasEffect(type: PowerUpType): boolean {
        return this.effects.has(type) && this.effects.get(type)!.length > 0;
    }

    public getEffectTimeRemaining(type: PowerUpType): number {
        const effects = this.effects.get(type);
        if (!effects || effects.length === 0) return 0;
        
        const currentTime = Date.now();
        return Math.max(...effects.map(effect => 
            effect.startTime + effect.duration - currentTime
        ));
    }

    private getMoveDelay(): number {
        return 1000 / this.getCurrentSpeed();
    }

    public getCurrentSpeed(): number {
        let speed = this.baseSpeed;
        
        // Apply speed effects
        const speedEffects = this.effects.get('speed');
        if (speedEffects) {
            for (const effect of speedEffects) {
                if (effect.boost) {
                    speed *= effect.boost;
                }
            }
        }
        
        return speed;
    }

    public getPointsMultiplier(): number {
        let multiplier = 1;
        
        // Apply points effects
        const pointsEffects = this.effects.get('points');
        if (pointsEffects) {
            for (const effect of pointsEffects) {
                if (effect.multiplier) {
                    multiplier *= effect.multiplier;
                }
            }
        }
        
        return multiplier;
    }

    public checkCollision(): boolean {
        const size = this.grid.getSize();

        // Check wall collision if not ghost
        if (!this.hasEffect('ghost')) {
            // Check wall collision for both head segments
            const frontHead = this.segments[0];
            const backHead = this.segments[1];
            
            if (frontHead.x < 0 || frontHead.x >= size.width || frontHead.y < 0 || frontHead.y >= size.height ||
                backHead.x < 0 || backHead.x >= size.width || backHead.y < 0 || backHead.y >= size.height) {
                return true;
            }

            // Check self collision (start from segment 2 since 0,1 are head)
            return this.segments.slice(2).some(segment => 
                (segment.x === frontHead.x && segment.y === frontHead.y) ||
                (segment.x === backHead.x && segment.y === backHead.y)
            );
        } else {
            // In ghost mode, wrap both head segments around the edges
            const frontHead = this.segments[0];
            const backHead = this.segments[1];
            
            if (frontHead.x < 0) frontHead.x = size.width - 1;
            if (frontHead.x >= size.width) frontHead.x = 0;
            if (frontHead.y < 0) frontHead.y = size.height - 1;
            if (frontHead.y >= size.height) frontHead.y = 0;
            
            if (backHead.x < 0) backHead.x = size.width - 1;
            if (backHead.x >= size.width) backHead.x = 0;
            if (backHead.y < 0) backHead.y = size.height - 1;
            if (backHead.y >= size.height) backHead.y = 0;
            
            return false; // No collisions in ghost mode
        }
    }

    public checkFoodCollision(food: any): boolean {
        if (!food) return false;
        const head = this.segments[0];
        return head.x === food.position.x && head.y === food.position.y;
    }

    public checkPowerUpCollision(powerUp: any): boolean {
        if (!powerUp) return false;
        const head = this.segments[0];
        return head.x === powerUp.position.x && head.y === powerUp.position.y;
    }

    public addEffect(type: PowerUpType): void {
        if (!this.effects.has(type)) {
            this.effects.set(type, []);
        }
        
        const effect: Effect = {
            type,
            startTime: Date.now(),
            duration: this.config.powerUps.effects[type].duration,
            boost: type === 'speed' ? this.config.powerUps.effects.speed.boost : undefined,
            multiplier: type === 'points' ? this.config.powerUps.effects.points.multiplier : undefined
        };
        
        this.effects.get(type)!.push(effect);
    }

    public draw(p5: P5, time: number): void {
        const cellSize = this.grid.getCellSize();
        
        // Draw body segments (in reverse to layer properly)
        for (let i = this.segments.length - 1; i >= 2; i--) {
            this.drawBodySegment(p5, this.segments[i], cellSize);
            this.drawSegmentEffects(p5, this.segments[i], i, time, cellSize);
        }
        
        // Draw head (both segments)
        this.drawHead(p5, this.segments[0], cellSize);
        this.drawHead(p5, this.segments[1], cellSize);
        
        // Draw effects for head segments
        this.drawSegmentEffects(p5, this.segments[0], 0, time, cellSize);
        this.drawSegmentEffects(p5, this.segments[1], 1, time, cellSize);
    }

    private drawBodySegment(p5: P5, pos: Position, cellSize: number): void {
        const segmentConfig = this.snakeConfig.segments;
        const size = cellSize * segmentConfig.size;
        
        p5.push();
        if (this.hasEffect('ghost')) {
            this.applyGhostEffect(p5);
        }
        
        p5.translate(pos.x * cellSize + cellSize / 2, pos.y * cellSize + cellSize / 2);
        p5.noStroke();
        p5.fill(this.snakeConfig.colors.body);
        p5.rect(-size / 2, -size / 2, size, size, segmentConfig.cornerRadius);
        
        this.resetEffects(p5);
        p5.pop();
    }

    private drawHead(p5: P5, pos: Position, cellSize: number): void {
        const segmentConfig = this.snakeConfig.segments;
        const headSize = cellSize * segmentConfig.size;
        const headLength = cellSize * segmentConfig.size;
        
        p5.push();
        if (this.hasEffect('ghost')) {
            this.applyGhostEffect(p5);
        }
        
        p5.translate(pos.x * cellSize + cellSize / 2, pos.y * cellSize + cellSize / 2);
        
        // Rotate based on direction
        let rotation = 0;
        switch (this.direction) {
            case 'up': rotation = -Math.PI / 2; break;
            case 'down': rotation = Math.PI / 2; break;
            case 'left': rotation = Math.PI; break;
            case 'right': rotation = 0; break;
        }
        p5.rotate(rotation);
        
        // Draw head shape
        p5.noStroke();
        p5.fill(this.snakeConfig.colors.head);
        p5.rect(-headSize / 2, -headSize / 2, headLength, headSize, segmentConfig.cornerRadius);
        
        // Draw eyes
        this.drawEyes(p5, 0, 0, headSize, headLength);
        
        this.resetEffects(p5);
        p5.pop();
    }

    private drawEyes(p5: P5, x: number, y: number, headWidth: number, headLength: number): void {
        const segmentConfig = this.snakeConfig.segments;
        const eyeSize = headWidth * 0.2;
        const pupilSize = eyeSize * 0.5;
        const eyeOffset = headWidth * 0.2;
        
        // Draw eye whites
        p5.fill(255);
        p5.ellipse(x + headLength * 0.3, y - eyeOffset, eyeSize);
        p5.ellipse(x + headLength * 0.3, y + eyeOffset, eyeSize);
        
        // Draw pupils
        p5.fill(0);
        p5.ellipse(x + headLength * 0.35, y - eyeOffset, pupilSize);
        p5.ellipse(x + headLength * 0.35, y + eyeOffset, pupilSize);
    }

    private drawSegmentEffects(p5: P5, pos: Position, index: number, time: number, cellSize: number): void {
        p5.push();
        p5.translate(pos.x * cellSize + cellSize / 2, pos.y * cellSize + cellSize / 2);
        
        // Draw speed effect
        if (this.hasEffect('speed')) {
            const phase = (time / 500 + index * 0.2) % 1;
            const size = cellSize * (0.5 + 0.2 * Math.sin(phase * Math.PI * 2));
            
            p5.noFill();
            p5.stroke(255, 255, 0, 100);
            p5.strokeWeight(2);
            this.drawStar(p5, 0, 0, size * 0.4, size * 0.8, 5);
        }
        
        p5.pop();
    }

    private drawStar(p5: P5, x: number, y: number, radius1: number, radius2: number, npoints: number): void {
        const angle = Math.PI * 2 / npoints;
        const halfAngle = angle / 2.0;
        
        p5.beginShape();
        for (let a = 0; a < Math.PI * 2; a += angle) {
            let sx = x + Math.cos(a) * radius2;
            let sy = y + Math.sin(a) * radius2;
            p5.vertex(sx, sy);
            sx = x + Math.cos(a + halfAngle) * radius1;
            sy = y + Math.sin(a + halfAngle) * radius1;
            p5.vertex(sx, sy);
        }
        p5.endShape(p5.CLOSE);
    }

    private applyGhostEffect(p5: P5): void {
        (p5.drawingContext as DrawingContext).globalAlpha = 0.5;
    }

    private resetEffects(p5: P5): void {
        (p5.drawingContext as DrawingContext).globalAlpha = 1.0;
    }

    public drawSpeedVector(p5: P5): void {
        const head = this.segments[0];
        const cellSize = this.grid.getCellSize();
        const speed = this.getCurrentSpeed();
        
        p5.push();
        p5.translate(head.x * cellSize + cellSize / 2, head.y * cellSize + cellSize / 2);
        
        // Draw speed indicator
        p5.stroke(255, 255, 0);
        p5.strokeWeight(2);
        p5.noFill();
        p5.line(0, 0, speed * 10, 0);
        p5.ellipse(speed * 10, 0, 5);
        
        p5.pop();
    }

    public getDirection(): Direction {
        return this.direction;
    }
}
