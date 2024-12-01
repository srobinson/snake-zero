import configManager from '../config/gameConfig.js';

export class Snake {
    constructor(grid, game) {
        this.grid = grid;
        this.game = game;
        this.config = configManager.getConfig();
        
        // Initialize base properties
        this.baseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed || 5;
        this.effects = new Map(); // type -> [{startTime, duration, multiplier}]
        this.lastMoveTime = 0;
        this.foodEaten = 0;
        
        // Initialize game state
        this.reset();
    }

    reset() {
        // Initialize snake position
        this.segments = [{
            x: Math.floor(this.grid.getSize().width / 4),
            y: Math.floor(this.grid.getSize().height / 2)
        }];

        // Add initial segments
        for (let i = 1; i < this.config.snake.initialLength; i++) {
            this.segments.push({
                x: this.segments[0].x - i,
                y: this.segments[0].y
            });
        }

        // Reset movement state
        this.direction = 'right';
        this.nextDirection = 'right';
        this.growing = false;
        
        // Reset timing and speed
        this.lastMoveTime = 0;
        this.moveInterval = 1000 / this.getCurrentSpeed();
        this.currentSpeed = this.getCurrentSpeed();
        this.foodEaten = 0;
        
        // Clear effects
        this.effects.clear();
    }

    update(currentTime) {
        // Update effects first
        this.updateEffects();

        // Check if it's time to move
        if (!this.lastMoveTime) {
            this.lastMoveTime = currentTime;
            return false;
        }

        const elapsed = currentTime - this.lastMoveTime;
        if (elapsed < this.moveInterval) {
            return false;
        }

        // Update direction and move
        this.direction = this.nextDirection;
        const head = { ...this.segments[0] };

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

    setDirection(newDirection) {
        // Prevent 180-degree turns
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (this.direction !== opposites[newDirection]) {
            this.nextDirection = newDirection;
        }
    }

    grow() {
        this.growing = true;
        if (this.config.snake.speedProgression.enabled) {
            this.foodEaten++;
            // Calculate new speed with progression using difficulty preset's baseSpeed
            const difficultyBaseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
            this.baseSpeed = Math.min(
                difficultyBaseSpeed + (this.foodEaten * this.config.snake.speedProgression.increasePerFood),
                this.config.snake.speedProgression.maxSpeed
            );
        }
    }

    checkCollision() {
        const head = this.segments[0];
        const size = this.grid.getSize();

        // Check wall collision if not ghost
        if (!this.hasEffect('ghost')) {
            // Check wall collision
            if (head.x < 0 || head.x >= size.width || head.y < 0 || head.y >= size.height) {
                return true;
            }

            // Check self collision
            return this.segments.slice(1).some(segment => 
                segment.x === head.x && segment.y === head.y
            );
        } else {
            // In ghost mode, only wrap around the edges
            if (head.x < 0) head.x = size.width - 1;
            if (head.x >= size.width) head.x = 0;
            if (head.y < 0) head.y = size.height - 1;
            if (head.y >= size.height) head.y = 0;
            return false; // No collisions in ghost mode
        }
    }

    checkFoodCollision(food) {
        if (!food) return false;
        const head = this.segments[0];
        return head.x === food.position.x && head.y === food.position.y;
    }

    checkPowerUpCollision(powerUp) {
        if (!powerUp) return false;
        const head = this.segments[0];
        return head.x === powerUp.position.x && head.y === powerUp.position.y;
    }

    addEffect(type) {
        const now = Date.now();
        const config = this.config.powerUps.effects[type];
        const duration = this.config.powerUps.duration;
        
        if (!this.effects.has(type)) {
            this.effects.set(type, []);
        }
        
        const stacks = this.effects.get(type);
        
        // Add new effect
        switch (type) {
            case 'speed':
                if (stacks.length < config.maxStacks) {
                    stacks.push({
                        startTime: now,
                        duration: duration,
                        boost: config.boost
                    });
                } else {
                    // Refresh duration of last stack
                    stacks[stacks.length - 1].startTime = now;
                }
                break;
                
            case 'ghost':
                stacks.push({
                    startTime: now,
                    duration: duration
                });
                break;
                
            case 'points':
                const currentMultiplier = stacks.length > 0 ? 
                    stacks[stacks.length - 1].multiplier : 1;
                const newMultiplier = Math.min(
                    config.stackType === 'multiplicative' ? 
                        currentMultiplier * config.multiplier : 
                        currentMultiplier + config.multiplier,
                    config.maxMultiplier
                );
                
                stacks.push({
                    startTime: now,
                    duration: duration,
                    multiplier: newMultiplier
                });
                break;
        }
    }

    updateEffects() {
        const now = Date.now();
        
        // Update each effect type
        for (const [type, stacks] of this.effects.entries()) {
            // Remove expired effects
            while (stacks.length > 0 && 
                   now > stacks[0].startTime + stacks[0].duration) {
                stacks.shift();
            }
            
            // Remove empty effect types
            if (stacks.length === 0) {
                this.effects.delete(type);
            }
        }
    }

    getCurrentSpeed() {
        this.updateEffects();
        
        // Calculate speed boost from active effects
        const speedStacks = this.effects.get('speed') || [];
        const totalBoost = speedStacks.reduce((acc, effect) => acc * effect.boost, 1);
        
        return this.baseSpeed * totalBoost;
    }

    getPointsMultiplier() {
        this.updateEffects();
        
        const pointsStacks = this.effects.get('points') || [];
        return pointsStacks.length > 0 ? 
            pointsStacks[pointsStacks.length - 1].multiplier : 1;
    }

    hasEffect(type) {
        this.updateEffects();
        return this.effects.has(type);
    }

    getEffectTimeRemaining(type) {
        this.updateEffects();
        
        const stacks = this.effects.get(type);
        if (!stacks || stacks.length === 0) return 0;
        
        const now = Date.now();
        return Math.max(0, ...stacks.map(effect => 
            effect.startTime + effect.duration - now
        ));
    }

    draw(p5) {
        // Draw snake segments
        this.segments.forEach((segment, index) => {
            const pos = this.grid.getCellCenter(segment);
            p5.fill(index === 0 ? this.config.snake.colors.head : this.config.snake.colors.body);
            p5.noStroke();
            const size = this.grid.getCellSize(); 
            p5.rect(pos.x - size/2, pos.y - size/2, size, size);
        });

        // Draw speed vector if debug panel is visible
        const debugConfig = configManager.getConfig().debug;
        if (debugConfig.showVectors && this.game.debugPanel.visible) {
            this.drawSpeedVector(p5);
        }
    }

    drawSpeedVector(p5) {
        const head = this.segments[0];
        const headPos = this.grid.getCellCenter(head);
        const speed = this.getCurrentSpeed();
        const vectorConfig = configManager.getConfig().debug.vectors;
        
        // Get direction vector
        let dx = 0, dy = 0;
        switch(this.direction) {
            case 'right': dx = 1; break;
            case 'left': dx = -1; break;
            case 'up': dy = -1; break;
            case 'down': dy = 1; break;
        }

        // Calculate vector end point
        const vectorLength = speed * vectorConfig.scale;
        const endX = headPos.x + dx * vectorLength;
        const endY = headPos.y + dy * vectorLength;

        // Draw vector line
        p5.push();
        p5.stroke(vectorConfig.color);
        p5.strokeWeight(vectorConfig.thickness);
        p5.fill(vectorConfig.color);

        // Draw main line
        p5.line(headPos.x, headPos.y, endX, endY);

        // Draw arrowhead
        const angle = Math.atan2(dy, dx);
        const headLength = vectorConfig.headLength;
        p5.translate(endX, endY);
        p5.rotate(angle);
        p5.triangle(0, 0, 
                   -headLength, -headLength/2, 
                   -headLength, headLength/2);

        // Draw speed text
        p5.rotate(-angle);
        p5.noStroke();
        p5.textAlign(p5.CENTER, p5.BOTTOM);
        p5.textSize(12);
        p5.text(`${speed.toFixed(1)} cells/s`, 0, -5);
        
        p5.pop();
    }
}
