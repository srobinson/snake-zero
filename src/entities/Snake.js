import { gameConfig } from '../config/gameConfig.js';

export class Snake {
    constructor(grid) {
        if (!grid) {
            throw new Error('Grid is required for Snake initialization');
        }
        
        this.grid = grid;
        const { x, y } = gameConfig.snake.initialPosition;
        this.segments = Array(gameConfig.snake.initialLength).fill().map((_, i) => ({
            x: x - i,
            y
        }));
        this.direction = gameConfig.snake.initialDirection;
        this.nextDirection = gameConfig.snake.initialDirection;
        this.growing = false;
        
        // Add power-up properties
        this.activeEffects = { ...gameConfig.snake.effects.initialState };
        this.effectTimers = {};
        this.baseSpeed = gameConfig.snake.baseSpeed;
    }

    move() {
        if (!this.grid || !this.segments.length) {
            return;
        }

        this.direction = this.nextDirection;
        
        // Calculate new head position
        const head = { ...this.segments[0] };
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
            default: return;
        }

        // Handle ghost mode wrap-around
        const gridSize = this.grid.getSize();
        if (!gridSize) {
            return;
        }

        if (this.activeEffects.ghost) {
            if (head.x < 0) head.x = gridSize.width - 1;
            if (head.x >= gridSize.width) head.x = 0;
            if (head.y < 0) head.y = gridSize.height - 1;
            if (head.y >= gridSize.height) head.y = 0;
        }

        // Update segments
        this.segments.unshift(head);
        if (!this.growing) {
            this.segments.pop();
        }
        this.growing = false;

        // Update power-up timers
        this.updateEffects();
    }

    checkCollision() {
        if (!this.grid || !this.segments.length) {
            return true;
        }

        const head = this.segments[0];
        const gridSize = this.grid.getSize();
        
        if (!gridSize) {
            return true;
        }

        // Skip boundary collision in ghost mode
        if (!this.activeEffects.ghost) {
            if (head.x < 0 || head.x >= gridSize.width || 
                head.y < 0 || head.y >= gridSize.height) {
                return true;
            }
        }

        // Check self-collision
        return this.segments.slice(1).some(segment => 
            segment.x === head.x && segment.y === head.y
        );
    }

    checkFoodCollision(food) {
        if (!food || !this.segments.length) {
            return false;
        }

        const head = this.segments[0];
        return head.x === food.position.x && head.y === food.position.y;
    }

    checkPowerUpCollision(powerUp) {
        if (!powerUp || !this.segments.length) {
            return false;
        }

        const head = this.segments[0];
        return head.x === powerUp.position.x && head.y === powerUp.position.y;
    }

    grow() {
        this.growing = true;
    }

    setDirection(newDirection) {
        // Prevent 180-degree turns
        if (gameConfig.snake.turnRestriction.prevent180) {
            if (
                (this.direction === 'up' && newDirection === 'down') ||
                (this.direction === 'down' && newDirection === 'up') ||
                (this.direction === 'left' && newDirection === 'right') ||
                (this.direction === 'right' && newDirection === 'left')
            ) {
                return;
            }
        }
        this.nextDirection = newDirection;
    }

    applyPowerUp(effect) {
        if (!effect || !effect.type || !effect.duration) {
            return;
        }

        if (gameConfig.powerUps.types.includes(effect.type)) {
            this.activeEffects[effect.type] = true;
            this.effectTimers[effect.type] = Date.now() + effect.duration;
        }
    }

    updateEffects() {
        const now = Date.now();
        for (const [effect, timer] of Object.entries(this.effectTimers)) {
            if (timer && now >= timer) {
                this.activeEffects[effect] = false;
                delete this.effectTimers[effect];
            }
        }
    }

    getSpeed() {
        let speed = this.baseSpeed;
        if (this.activeEffects.speed) {
            speed *= gameConfig.snake.speedMultipliers.speed;
        }
        if (this.activeEffects.slow) {
            speed *= gameConfig.snake.speedMultipliers.slow;
        }
        return speed;
    }

    draw(p) {
        if (!this.segments.length) return;

        // Draw snake segments
        this.segments.forEach((segment, index) => {
            const pos = this.grid.toPixel(segment.x, segment.y);
            const size = this.grid.cellSize;

            // Set color based on segment type and effects
            if (index === 0) {
                // Head colors
                if (this.activeEffects.ghost) {
                    p.fill(...gameConfig.snake.colors.head.ghost);
                } else if (this.activeEffects.speed) {
                    p.fill(...gameConfig.snake.colors.head.speed);
                } else if (this.activeEffects.slow) {
                    p.fill(...gameConfig.snake.colors.head.slow);
                } else {
                    p.fill(...gameConfig.snake.colors.head.normal);
                }
            } else {
                // Body colors
                if (this.activeEffects.ghost) {
                    p.fill(...gameConfig.snake.colors.body.ghost);
                } else {
                    p.fill(...gameConfig.snake.colors.body.normal);
                }
            }

            // Draw segment
            p.noStroke();
            p.rect(pos.x, pos.y, size, size);
        });
    }
}
