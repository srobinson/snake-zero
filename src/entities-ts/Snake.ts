import { Grid } from '../core-ts/Grid';
import { PowerUpType, Effect, Position, Obstacle } from '../types-ts/commonTypes';
import type { Game } from '../types-ts/gameTypes';
import type { GameConfig } from '../config-ts/types';
import { Direction, SnakeDrawingContext, SnakeState, SnakeCollision } from '../types-ts/snakeTypes';
import type p5 from 'p5';

/**
 * Represents the snake in the game, including its movement, effects, and rendering.
 * The snake consists of segments (head and body), can move in four directions,
 * and can be affected by various power-ups.
 */
export class Snake implements Obstacle {
    private grid: Grid;
    private game: Game;
    private config: GameConfig;
    private effects: Map<PowerUpType, Effect[]>;
    private _segments: SnakeSegment[];
    private direction: Direction;
    private nextDirection: Direction;
    private lastMoveTime: number;
    private score: number;
    private growing: boolean;
    private foodEaten: number;
    private baseSpeed: number;
    private moveInterval: number;

    constructor(grid: Grid, game: Game) {
        this.grid = grid;
        this.game = game;
        this.config = game.config;
        this.effects = new Map();
        
        // Initialize base properties
        this._segments = [];
        this.direction = this.config.snake.initialDirection || 'right';
        this.nextDirection = this.direction;
        this.lastMoveTime = 0;
        this.score = 0;
        this.growing = false;
        this.foodEaten = 0;
        this.baseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
        this.moveInterval = 0;
        
        // Initialize snake segments
        this.reset();
        console.log(this);
    }

    public reset(): void {
        const snakeConfig = this.config.snake;
        const gridSize = this.grid.getSize();
        
        // Calculate center position
        const centerX = Math.floor(gridSize.width / 2);
        const centerY = Math.floor(gridSize.height / 2);
        
        // Clear segments array
        this._segments = [];
        
        // Add head segments (always 2 cells)
        this._segments.push(
            { x: centerX, y: centerY, angle: 0, direction: this.direction },       // Front of head
            { x: centerX - 1, y: centerY, angle: 0, direction: this.direction }    // Back of head
        );
        
        // Add body segments
        let currentX = centerX - 2; // Start after head segments
        for (let i = 0; i < snakeConfig.initialLength - 1; i++) {  // -1 because head is now 2 cells
            this._segments.push({ x: currentX - i, y: centerY, angle: 0, direction: this.direction });
        }

        // Reset other properties
        this.direction = snakeConfig.initialDirection || 'right';
        this.nextDirection = this.direction;
        this.lastMoveTime = 0;
        this.score = 0;
        this.growing = false;
        this.foodEaten = 0;
        
        // Reset speed to difficulty base speed
        const difficultyBaseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
        this.baseSpeed = difficultyBaseSpeed;
        
        this.effects.clear();
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
        const head = { ...this._segments[0] };

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
        this._segments.unshift(head);
        if (!this.growing) {
            this._segments.pop();
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
        
        // Update speed if progression is enabled
        if (this.config.snake.speedProgression.enabled) {
            const speedConfig = this.config.snake.speedProgression;
            const speedIncrease = speedConfig.increasePerFood;
            const maxSpeed = speedConfig.maxSpeed;
            
            this.baseSpeed = Math.min(this.baseSpeed + speedIncrease, maxSpeed);
            this.game.events.emit('speed_changed', { speed: this.baseSpeed });
        }
    }

    public updateEffects(): void {
        const currentTime = Date.now();
        let effectsChanged = false;

        for (const [type, effects] of this.effects) {
            // Remove expired effects
            const activeEffects = effects.filter(effect => {
                const elapsed = currentTime - effect.startTime;
                return elapsed < effect.duration;
            });

            if (activeEffects.length !== effects.length) {
                effectsChanged = true;
                if (activeEffects.length === 0) {
                    this.effects.delete(type);
                    this.game.events.emit('power_up_expired', { powerUpType: type });
                } else {
                    this.effects.set(type, activeEffects);
                }
            }
        }

        if (effectsChanged) {
            // Update speed when effects change
            const newSpeed = this.getCurrentSpeed();
            this.game.events.emit('speed_changed', { speed: newSpeed });
        }
    }

    public addEffect(type: PowerUpType): void {
        console.log("addEffect");
        
        const effectConfig = this.config.powerUps.effects[type];
        console.log("effectConfig", effectConfig);
        
        if (!effectConfig) return;

        const effect: Effect = {
            type,
            startTime: Date.now(),
            duration: effectConfig.duration,
            active: true
        };

        if (type === 'speed' || type === 'slow') {
            effect.boost = effectConfig.strength;
        } else if (type === 'points') {
            effect.multiplier = effectConfig.strength;
        }

        const existingEffects = this.effects.get(type) || [];
        this.effects.set(type, [...existingEffects, effect]);

        // Emit event for new effect
        this.game.events.emit('power_up_collected', { powerUpType: type });
    }

    public getCurrentSpeed(): number {
        let speed = this.baseSpeed;

        // Apply speed effects
        const speedEffects = this.effects.get('speed');
        if (speedEffects) {
            for (const effect of speedEffects) {
                if (effect.boost) speed *= effect.boost;
            }
        }

        // Apply slow effects
        const slowEffects = this.effects.get('slow');
        if (slowEffects) {
            for (const effect of slowEffects) {
                if (effect.boost) speed *= effect.boost;
            }
        }

        // Apply speed progression
        if (this.config.snake.speedProgression.enabled) {
            const progression = this.config.snake.speedProgression;
            const speedIncrease = this.foodEaten * progression.increasePerFood;
            speed += speedIncrease;
            speed = Math.min(speed, progression.maxSpeed);
        }

        return Math.max(1, speed); // Ensure minimum speed of 1
    }

    public getPointsMultiplier(): number {
        let multiplier = 1;

        const pointsEffects = this.effects.get('points');
        if (pointsEffects) {
            for (const effect of pointsEffects) {
                if (effect.multiplier) multiplier *= effect.multiplier;
            }
        }

        return multiplier;
    }

    public hasEffect(type: PowerUpType): boolean {
        const effects = this.effects.get(type);
        return effects !== undefined && effects.length > 0;
    }

    public getEffectTimeRemaining(type: PowerUpType): number {
        const effects = this.effects.get(type);
        if (!effects || effects.length === 0) return 0;

        const currentTime = Date.now();
        let maxRemaining = 0;

        for (const effect of effects) {
            const elapsed = currentTime - effect.startTime;
            const remaining = Math.max(0, effect.duration - elapsed);
            maxRemaining = Math.max(maxRemaining, remaining);
        }

        return maxRemaining;
    }

    public getMoveDelay(): number {
        return 1000 / this.getCurrentSpeed();
    }

    public checkFoodCollision(food: { getPosition(): Position }): boolean {
        if (!food) return false;
        
        const head = this._segments[0];
        const foodPos = food.getPosition();
        return head.x === foodPos.x && head.y === foodPos.y;
    }

    public checkPowerUpCollision(powerUp: { getPosition(): Position }): boolean {
        if (!powerUp) return false;
        const head = this._segments[0];
        const powerUpPos = powerUp.getPosition();
        return head.x === powerUpPos.x && head.y === powerUpPos.y;
    }


    public getHead(): SnakeSegment {
        return this._segments[0];
    }

    public getState(): SnakeState {
        return {
            position: this.getHead(),
            direction: this.direction,
            length: this._segments.length,
            speed: this.getCurrentSpeed(),
            growing: this.growing,
            score: this.score,
            effects: this.effects,
            foodEaten: this.foodEaten,
            baseSpeed: this.baseSpeed,
            lastMoveTime: this.lastMoveTime,
            nextDirection: this.nextDirection
        };
    }

    public checkCollision(): boolean {
        const size = this.grid.getSize();

        // Check wall collision if not ghost
        if (!this.hasEffect('ghost')) {
            // Check wall collision for both head segments
            const frontHead = this._segments[0];
            const backHead = this._segments[1];
            
            if (frontHead.x < 0 || frontHead.x >= size.width || frontHead.y < 0 || frontHead.y >= size.height ||
                backHead.x < 0 || backHead.x >= size.width || backHead.y < 0 || backHead.y >= size.height) {
                return true;
            }

            // Check self collision (start from segment 2 since 0,1 are head)
            return this._segments.slice(2).some(segment => 
                (segment.x === frontHead.x && segment.y === frontHead.y) ||
                (segment.x === backHead.x && segment.y === backHead.y)
            );
        } else {
            // In ghost mode, wrap both head segments around the edges
            const frontHead = this._segments[0];
            const backHead = this._segments[1];
            
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

    public draw(p5: p5): void {
        // Draw snake segments
        for (let i = this._segments.length - 1; i >= 0; i--) {
            const segment = this._segments[i];
            const isHead = i === 0;
            
            if (isHead) {
                this.drawHead(p5, segment, this.grid.cellSize);
            } else {
                // Draw body segment
                const x = segment.x * this.grid.cellSize + this.grid.cellSize / 2;
                const y = segment.y * this.grid.cellSize + this.grid.cellSize / 2;
                
                p5.push();
                p5.translate(x, y);
                
                p5.fill(this.config.snake.colors.body);
                p5.noStroke();
                const size = this.config.snake.segments.size * this.grid.cellSize;
                p5.rect(-size/2, -size/2, size, size, this.config.snake.segments.cornerRadius);
                
                p5.pop();
            }
        }
    }

    private drawHead(p5: p5, pos: Position, cellSize: number): void {
        const config = this.config.snake;
        const headWidth = cellSize * config.segments.headSize;
        const headLength = cellSize * 2; // Make head 2 cells long
        const x = pos.x * cellSize + cellSize / 2;
        const y = pos.y * cellSize + cellSize / 2;
        
        p5.push();
        p5.translate(x, y);
        
        // Draw head shadow
        p5.fill(config.colors.shadow);
        p5.noStroke();
        
        const shadowOffset = config.segments.elevation;
        
        switch(this.direction) {
            case 'left':
                p5.rect(
                    -headLength/2 + shadowOffset,
                    -headWidth/2 + shadowOffset,
                    headLength,
                    headWidth,
                    config.segments.cornerRadius
                );
                break;
            case 'right':
                p5.rect(
                    -headLength/2 + shadowOffset,
                    -headWidth/2 + shadowOffset,
                    headLength,
                    headWidth,
                    config.segments.cornerRadius
                );
                break;
            case 'up':
                p5.rect(
                    -headWidth/2 + shadowOffset,
                    -headLength/2 + shadowOffset,
                    headWidth,
                    headLength,
                    config.segments.cornerRadius
                );
                break;
            case 'down':
                p5.rect(
                    -headWidth/2 + shadowOffset,
                    -headLength/2 + shadowOffset,
                    headWidth,
                    headLength,
                    config.segments.cornerRadius
                );
                break;
        }
        
        // Draw main head shape
        p5.fill(config.colors.head);
        switch(this.direction) {
            case 'left':
                p5.rect(
                    -headLength/2,
                    -headWidth/2,
                    headLength,
                    headWidth,
                    config.segments.cornerRadius
                );
                break;
            case 'right':
                p5.rect(
                    -headLength/2,
                    -headWidth/2,
                    headLength,
                    headWidth,
                    config.segments.cornerRadius
                );
                break;
            case 'up':
                p5.rect(
                    -headWidth/2,
                    -headLength/2,
                    headWidth,
                    headLength,
                    config.segments.cornerRadius
                );
                break;
            case 'down':
                p5.rect(
                    -headWidth/2,
                    -headLength/2,
                    headWidth,
                    headLength,
                    config.segments.cornerRadius
                );
                break;
        }
        
        this.drawEyes(p5, 0, 0, headWidth, headLength);
        p5.pop();
    }

    private drawEyes(p5: p5, x: number, y: number, headWidth: number, headLength: number): void {
        const config = this.config.snake;
        const eyeSize = headWidth * 0.3; 
        const eyeOffset = headWidth * 0.2;
        const pupilSize = eyeSize * 0.5; 
        
        // Draw eyes
        p5.fill(config.colors.eyes);
        p5.noStroke();
        
        switch(this.direction) {
            case 'left':
                p5.circle(x - headLength/4, y - eyeOffset, eyeSize);
                p5.circle(x - headLength/4, y + eyeOffset, eyeSize);
                // Draw pupils
                p5.fill(config.colors.pupil);
                p5.circle(x - headLength/4 - pupilSize/4, y - eyeOffset, pupilSize);
                p5.circle(x - headLength/4 - pupilSize/4, y + eyeOffset, pupilSize);
                break;
            case 'right':
                p5.circle(x + headLength/4, y - eyeOffset, eyeSize);
                p5.circle(x + headLength/4, y + eyeOffset, eyeSize);
                // Draw pupils
                p5.fill(config.colors.pupil);
                p5.circle(x + headLength/4 + pupilSize/4, y - eyeOffset, pupilSize);
                p5.circle(x + headLength/4 + pupilSize/4, y + eyeOffset, pupilSize);
                break;
            case 'up':
                p5.circle(x - eyeOffset, y - headLength/4, eyeSize);
                p5.circle(x + eyeOffset, y - headLength/4, eyeSize);
                // Draw pupils
                p5.fill(config.colors.pupil);
                p5.circle(x - eyeOffset, y - headLength/4 - pupilSize/4, pupilSize);
                p5.circle(x + eyeOffset, y - headLength/4 - pupilSize/4, pupilSize);
                break;
            case 'down':
                p5.circle(x - eyeOffset, y + headLength/4, eyeSize);
                p5.circle(x + eyeOffset, y + headLength/4, eyeSize);
                // Draw pupils
                p5.fill(config.colors.pupil);
                p5.circle(x - eyeOffset, y + headLength/4 + pupilSize/4, pupilSize);
                p5.circle(x + eyeOffset, y + headLength/4 + pupilSize/4, pupilSize);
                break;
        }
        
        // Draw tongue
        const tongueLength = headWidth * 0.4; 
        const tongueWidth = headWidth * 0.15; 
        const tongueWag = Math.sin(Date.now() * config.segments.tongueSpeed) * config.segments.tongueWagRange;
        
        p5.fill(config.colors.tongue);
        p5.push();
        p5.translate(x, y);
        p5.rotate(tongueWag + (this.direction === 'up' ? -Math.PI/2 : 
                              this.direction === 'down' ? Math.PI/2 :
                              this.direction === 'left' ? Math.PI : 0));
        
        p5.beginShape();
        p5.vertex(headLength/2, 0);
        p5.vertex(headLength/2 + tongueLength * 0.6, -tongueWidth/2);
        p5.vertex(headLength/2 + tongueLength, 0);
        p5.vertex(headLength/2 + tongueLength * 0.6, tongueWidth/2);
        p5.endShape(p5.CLOSE);
        p5.pop();
    }

    // Implement the Obstacle interface with a public getter
    public get segments(): Array<Position> {
        return this._segments.map(segment => ({ x: segment.x, y: segment.y }));
    }

    // Public getters for DebugPanel
    public getSegments(): SnakeSegment[] {
        return this._segments;
    }

    public getDirection(): Direction {
        return this.direction;
    }

    public getScore(): number {
        return this.score;
    }

    public getEffects(): Map<PowerUpType, Effect[]> {
        return this.effects;
    }
}

interface SnakeSegment extends Position {
    angle: number;
    direction: Direction;
}
