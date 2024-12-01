export class Snake {
    constructor(grid, game) {
        if (!grid) throw new Error('Grid is required for Snake');
        if (!game) throw new Error('Game is required for Snake');
        
        this.grid = grid;
        this.game = game;
        this.config = game.getConfig();
        
        // Initialize snake properties
        this.segments = [];
        this.direction = this.config.initialDirection || 'right';
        this.nextDirection = this.direction;
        this.lastMoveTime = 0;
        this.effects = new Map();
        this.score = 0;
        
        // Set initial speed
        this.baseSpeed = this.config.baseSpeed || 5;
        this.speedMultiplier = 1;
        
        // Initialize snake position
        this.initialize();
    }

    initialize() {
        this.segments = [];
        const center = {
            x: Math.floor(this.grid.cols / 2),
            y: Math.floor(this.grid.rows / 2)
        };

        // Create initial snake segments
        const initialLength = this.config.initialLength || 3;
        for (let i = 0; i < initialLength; i++) {
            this.segments.unshift({
                x: center.x - i,
                y: center.y
            });
        }

        // Reset direction and effects
        this.direction = this.config.initialDirection || 'right';
        this.nextDirection = this.direction;
        this.effects.clear();
        
        // Reset speed
        this.baseSpeed = this.config.baseSpeed || 5;
        this.speedMultiplier = 1;
    }

    getCurrentSpeed() {
        let speed = this.baseSpeed * this.speedMultiplier;

        // Apply speed progression if enabled
        if (this.config.enableSpeedProgression) {
            const scoreThreshold = this.config.speedProgressionThreshold || 10;
            const speedIncrease = this.config.speedProgressionIncrease || 0.5;
            const maxSpeedMultiplier = this.config.maxSpeedMultiplier || 3;
            
            const score = this.game.getScore();
            const progressionLevel = Math.floor(score / scoreThreshold);
            const progressionMultiplier = 1 + (progressionLevel * speedIncrease);
            speed *= Math.min(progressionMultiplier, maxSpeedMultiplier);
        }

        // Apply speed effects
        const speedEffect = this.effects.get('speed');
        if (speedEffect) {
            speed *= this.config.powerUpSpeedMultiplier || 1.5;
        }
        const slowEffect = this.effects.get('slow');
        if (slowEffect) {
            speed *= 0.5;
        }

        // Ensure speed stays within bounds
        const minSpeed = this.config.minSpeed || 1;
        const maxSpeed = this.config.maxSpeed || 15;
        return Math.min(Math.max(speed, minSpeed), maxSpeed);
    }

    update(currentTime) {
        const moveInterval = 1000 / this.getCurrentSpeed();
        if (currentTime - this.lastMoveTime < moveInterval) {
            return false;
        }

        // Update snake position
        const head = this.segments[0];
        const newHead = { ...head };

        // Update direction
        this.direction = this.nextDirection;

        // Calculate new head position
        switch (this.direction) {
            case 'up':
                newHead.y--;
                break;
            case 'down':
                newHead.y++;
                break;
            case 'left':
                newHead.x--;
                break;
            case 'right':
                newHead.x++;
                break;
        }

        // Handle wall collision
        if (!this.grid.isValidPosition(newHead.x, newHead.y)) {
            if (this.config.allowWallPhasing) {
                // Wrap around
                newHead.x = (newHead.x + this.grid.cols) % this.grid.cols;
                newHead.y = (newHead.y + this.grid.rows) % this.grid.rows;
            } else {
                return false;
            }
        }

        // Update segments
        this.segments.unshift(newHead);
        this.segments.pop();

        // Update move time
        this.lastMoveTime = currentTime;

        // Update effects
        this.updateEffects(currentTime);

        return true;
    }

    draw(p5) {
        // Draw snake body
        for (let i = this.segments.length - 1; i > 0; i--) {
            const segment = this.segments[i];
            const cellSize = this.grid.cellSize;
            
            p5.fill(this.config.snakeColor || '#4CAF50');
            p5.noStroke();
            
            // Draw body segment
            p5.rect(
                segment.x * cellSize,
                segment.y * cellSize,
                cellSize,
                cellSize,
                cellSize * 0.2
            );
        }

        // Draw snake head
        const head = this.segments[0];
        const cellSize = this.grid.cellSize;
        
        // Head color
        p5.fill(this.config.snakeHeadColor || '#388E3C');
        p5.noStroke();
        
        // Draw head
        p5.rect(
            head.x * cellSize,
            head.y * cellSize,
            cellSize,
            cellSize,
            cellSize * 0.3
        );
        
        // Draw eyes
        const eyeSize = cellSize * 0.15;
        const eyeOffset = cellSize * 0.25;
        p5.fill('#000000');
        
        switch (this.direction) {
            case 'right':
                p5.ellipse(head.x * cellSize + cellSize * 0.7, head.y * cellSize + eyeOffset, eyeSize);
                p5.ellipse(head.x * cellSize + cellSize * 0.7, head.y * cellSize + cellSize - eyeOffset, eyeSize);
                break;
            case 'left':
                p5.ellipse(head.x * cellSize + cellSize * 0.3, head.y * cellSize + eyeOffset, eyeSize);
                p5.ellipse(head.x * cellSize + cellSize * 0.3, head.y * cellSize + cellSize - eyeOffset, eyeSize);
                break;
            case 'up':
                p5.ellipse(head.x * cellSize + eyeOffset, head.y * cellSize + cellSize * 0.3, eyeSize);
                p5.ellipse(head.x * cellSize + cellSize - eyeOffset, head.y * cellSize + cellSize * 0.3, eyeSize);
                break;
            case 'down':
                p5.ellipse(head.x * cellSize + eyeOffset, head.y * cellSize + cellSize * 0.7, eyeSize);
                p5.ellipse(head.x * cellSize + cellSize - eyeOffset, head.y * cellSize + cellSize * 0.7, eyeSize);
                break;
        }
    }

    handleInput(key) {
        const newDirection = this.getDirectionFromKey(key);
        if (newDirection && this.isValidDirectionChange(newDirection)) {
            this.nextDirection = newDirection;
        }
    }

    getDirectionFromKey(key) {
        // Support both arrow keys and WASD
        switch (key.toLowerCase()) {
            case 'arrowup':
            case 'w':
                return 'up';
            case 'arrowdown':
            case 's':
                return 'down';
            case 'arrowleft':
            case 'a':
                return 'left';
            case 'arrowright':
            case 'd':
                return 'right';
            default:
                return null;
        }
    }

    isValidDirectionChange(newDirection) {
        // Prevent 180-degree turns
        if (
            (this.direction === 'up' && newDirection === 'down') ||
            (this.direction === 'down' && newDirection === 'up') ||
            (this.direction === 'left' && newDirection === 'right') ||
            (this.direction === 'right' && newDirection === 'left')
        ) {
            return false;
        }
        return true;
    }

    checkCollision() {
        const head = this.segments[0];
        
        // Check for collision with own body
        for (let i = 4; i < this.segments.length; i++) {
            if (head.x === this.segments[i].x && head.y === this.segments[i].y) {
                return true;
            }
        }

        // Check for wall collision if wall phasing is disabled
        if (!this.config.allowWallPhasing) {
            if (!this.grid.isValidPosition(head.x, head.y)) {
                return true;
            }
        }

        return false;
    }

    checkFoodCollision(food) {
        const head = this.segments[0];
        return head.x === food.position.x && head.y === food.position.y;
    }

    checkPowerUpCollision(powerUp) {
        const head = this.segments[0];
        return head.x === powerUp.position.x && head.y === powerUp.position.y;
    }

    grow(amount = 1) {
        const tail = this.segments[this.segments.length - 1];
        for (let i = 0; i < amount; i++) {
            this.segments.push({ ...tail });
        }
        this.score++;
    }

    addEffect(type, duration = 5000) {
        const effect = {
            startTime: Date.now(),
            duration: duration
        };

        // Add effect-specific properties
        switch (type) {
            case 'speed':
                effect.boost = this.config.powerUpSpeedMultiplier || 1.5;
                break;
            case 'slow':
                effect.boost = 0.5;
                break;
            case 'ghost':
                effect.active = true;
                break;
            case 'points':
                effect.multiplier = this.config.powerUpPointsMultiplier || 2;
                break;
        }

        this.effects.set(type, effect);
    }

    updateEffects(currentTime) {
        for (const [type, effect] of this.effects.entries()) {
            if (currentTime - effect.startTime >= effect.duration) {
                this.effects.delete(type);
            }
        }
    }

    getPointsMultiplier() {
        let multiplier = 1;
        
        // Check for points power-up
        const pointsEffect = this.effects.get('points');
        if (pointsEffect) {
            multiplier *= pointsEffect.multiplier;
        }
        
        // Check for speed power-up
        const speedEffect = this.effects.get('speed');
        if (speedEffect) {
            multiplier *= this.config.powerUpPointsMultiplier || 2;
        }
        
        return multiplier;
    }

    getEffectTimeRemaining(type) {
        const effect = this.effects.get(type);
        if (!effect) return 0;
        
        const elapsed = Date.now() - effect.startTime;
        return Math.max(0, effect.duration - elapsed);
    }
}
