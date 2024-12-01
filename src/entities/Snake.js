import configManager from '../config/gameConfig.js';

export class Snake {
    constructor(grid, game) {
        this.grid = grid;
        this.game = game;
        this.config = game.config;
        this.effects = new Map();
        
        // Initialize base properties
        this.segments = [];
        this.direction = this.config.snake.initialDirection || 'right';
        this.nextDirection = this.direction;
        this.lastMoveTime = 0;
        this.tongueWagTime = 0;
        this.score = 0;
        this.growing = false;
        this.foodEaten = 0;
        
        // Get initial speed from difficulty settings
        const difficultyBaseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
        this.baseSpeed = difficultyBaseSpeed;
        
        // Initialize snake segments
        this.reset();
    }

    reset() {
        const snakeConfig = this.config.snake;
        const gridSize = this.grid.getSize();
        
        // Calculate center position
        const centerX = Math.floor(gridSize.width / 2);
        const centerY = Math.floor(gridSize.height / 2);
        
        // Clear segments array
        this.segments = [];
        
        // Add head segments (always 2 cells)
        this.segments.push(
            { x: centerX, y: centerY },       // Front of head
            { x: centerX - 1, y: centerY }    // Back of head
        );
        
        // Add body segments
        let currentX = centerX - 2; // Start after head segments
        for (let i = 0; i < snakeConfig.initialLength; i++) {
            this.segments.push({ x: currentX - i, y: centerY });
        }

        // Reset other properties
        this.direction = snakeConfig.initialDirection || 'right';
        this.nextDirection = this.direction;
        this.lastMoveTime = 0;
        this.tongueWagTime = 0;
        this.score = 0;
        this.growing = false;
        this.foodEaten = 0;
        
        // Reset speed to difficulty base speed
        const difficultyBaseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
        this.baseSpeed = difficultyBaseSpeed;
        
        this.effects.clear();
    }

    update(currentTime) {
        // Update tongue animation
        const config = this.config.snake;
        const tongueWagTime = currentTime % config.segments.tongueSpeed;
        this.tongueWagTime = (tongueWagTime / config.segments.tongueSpeed) * Math.PI * 2;

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
        this.foodEaten = (this.foodEaten || 0) + 1;
        this.score += Math.round(10 * this.getPointsMultiplier());
        
        if (this.config.snake.speedProgression.enabled) {
            // Get current difficulty base speed
            const difficultyBaseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
            
            // Calculate speed increase
            const speedIncrease = this.foodEaten * this.config.snake.speedProgression.increasePerFood;
            
            // Apply speed increase with maximum cap
            this.baseSpeed = Math.min(
                difficultyBaseSpeed + speedIncrease,
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
        const config = this.config.snake.speedProgression;
        
        let effect = {
            type,
            startTime: now,
            duration: this.config.powerUps.duration
        };
        
        // Add effect-specific properties
        switch(type) {
            case 'speed':
                effect.boost = config.initialSpeedBoost;
                break;
            case 'slow':
                effect.boost = config.slowEffect;
                break;
            case 'points':
                effect.multiplier = 2;
                break;
        }
        
        // Initialize or get the effect stack
        if (!this.effects.has(type)) {
            this.effects.set(type, []);
        }
        
        this.effects.get(type).push(effect);
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
        
        // Ensure we have a valid base speed
        if (typeof this.baseSpeed !== 'number' || isNaN(this.baseSpeed)) {
            const difficultyBaseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
            this.baseSpeed = difficultyBaseSpeed;
        }
        
        // Calculate speed boost from active effects
        const speedStacks = this.effects.get('speed') || [];
        const totalBoost = speedStacks.reduce((acc, effect) => acc * effect.boost, 1);
        
        // Return current speed with minimum of 1
        return Math.max(1, this.baseSpeed * totalBoost);
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

    getMoveDelay() {
        return 1000 / this.getCurrentSpeed();
    }

    draw(p5, time) {
        const config = this.config.snake;
        const cellSize = this.grid.getCellSize();
        const tongueWagTime = time % config.segments.tongueSpeed;
        const tongueWagPhase = (tongueWagTime / config.segments.tongueSpeed) * Math.PI * 2;
        const tongueWag = Math.sin(tongueWagPhase) * config.segments.tongueWagRange;

        // Draw snake segments
        if (!this.segments || this.segments.length === 0) {
            console.error('No segments to draw');
            return;
        }

        this.segments.forEach((segment, index) => {
            if (!segment || typeof segment.x === 'undefined' || typeof segment.y === 'undefined') {
                console.error('Invalid segment:', segment, 'at index:', index);
                return;
            }

            const pos = this.grid.getCellCenter(segment);
            if (!pos || typeof pos.x === 'undefined' || typeof pos.y === 'undefined') {
                console.error('Invalid position:', pos, 'for segment:', segment);
                return;
            }

            const isHead = index < config.segments.headLength;
            const isHeadFront = index === 0;
            const isHeadBack = index === 1;
            
            // Special handling for head segments
            if (isHead) {
                if (isHeadFront) {
                    const headWidth = cellSize * config.segments.headSize;
                    const headLength = cellSize * config.segments.headSize * 2;
                    let x = pos.x, y = pos.y;
                    
                    // Adjust position based on direction
                    switch(this.direction) {
                        case 'left':
                            x += cellSize/2;
                            break;
                        case 'right':
                            x -= cellSize/2;
                            break;
                        case 'up':
                            y += cellSize/2;
                            break;
                        case 'down':
                            y -= cellSize/2;
                            break;
                    }
                    
                    // Draw head shadow
                    p5.fill(config.colors.shadow);
                    p5.noStroke();
                    
                    // Draw elongated head shadow
                    switch(this.direction) {
                        case 'left':
                        case 'right':
                            p5.rect(
                                x - headLength/2 + config.segments.elevation,
                                y - headWidth/2 + config.segments.elevation,
                                headLength,
                                headWidth,
                                config.segments.cornerRadius
                            );
                            break;
                        case 'up':
                        case 'down':
                            p5.rect(
                                x - headWidth/2 + config.segments.elevation,
                                y - headLength/2 + config.segments.elevation,
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
                        case 'right':
                            p5.rect(
                                x - headLength/2,
                                y - headWidth/2,
                                headLength,
                                headWidth,
                                config.segments.cornerRadius
                            );
                            break;
                        case 'up':
                        case 'down':
                            p5.rect(
                                x - headWidth/2,
                                y - headLength/2,
                                headWidth,
                                headLength,
                                config.segments.cornerRadius
                            );
                            break;
                    }
                    
                    // Draw head highlights
                    p5.fill(config.colors.highlight);
                    switch(this.direction) {
                        case 'left':
                        case 'right':
                            // Top edge highlight
                            p5.rect(
                                x - headLength/2,
                                y - headWidth/2,
                                headLength,
                                2,
                                config.segments.cornerRadius
                            );
                            break;
                        case 'up':
                        case 'down':
                            // Left edge highlight
                            p5.rect(
                                x - headWidth/2,
                                y - headLength/2,
                                2,
                                headLength,
                                config.segments.cornerRadius
                            );
                            break;
                    }

                    // Draw eyes
                    const eyeOffsetX = headWidth * 0.15;
                    const eyeOffsetY = headWidth * 0.15;
                    let leftEye, rightEye;
                    
                    switch(this.direction) {
                        case 'up':
                            leftEye = {x: x - eyeOffsetX, y: y - headLength/4};
                            rightEye = {x: x + eyeOffsetX, y: y - headLength/4};
                            break;
                        case 'down':
                            leftEye = {x: x + eyeOffsetX, y: y + headLength/4};
                            rightEye = {x: x - eyeOffsetX, y: y + headLength/4};
                            break;
                        case 'left':
                            leftEye = {x: x - headLength/4, y: y - eyeOffsetY};
                            rightEye = {x: x - headLength/4, y: y + eyeOffsetY};
                            break;
                        case 'right':
                            leftEye = {x: x + headLength/4, y: y - eyeOffsetY};
                            rightEye = {x: x + headLength/4, y: y + eyeOffsetY};
                            break;
                    }
                    
                    // Draw eye whites
                    p5.fill(config.colors.eyes);
                    p5.circle(leftEye.x, leftEye.y, config.segments.eyeSize * 2);
                    p5.circle(rightEye.x, rightEye.y, config.segments.eyeSize * 2);
                    
                    // Draw pupils
                    p5.fill(config.colors.pupil);
                    p5.circle(leftEye.x, leftEye.y, config.segments.pupilSize * 2);
                    p5.circle(rightEye.x, rightEye.y, config.segments.pupilSize * 2);
                    
                    // Draw tongue
                    const isMoving = time - this.lastMoveTime < this.getMoveDelay() * 0.5;
                    const tongueWag = isMoving ? 
                        tongueWag : 0;
                    
                    let tongueStart, tongueControl1, tongueControl2, tongueEnd;
                    
                    switch(this.direction) {
                        case 'up':
                            tongueStart = {x: x, y: y - headLength/2};
                            tongueControl1 = {x: x + tongueWag/2, y: tongueStart.y - config.segments.tongueLength * 0.4};
                            tongueControl2 = {x: x + tongueWag, y: tongueStart.y - config.segments.tongueLength * 0.7};
                            tongueEnd = {x: x + tongueWag, y: tongueStart.y - config.segments.tongueLength};
                            break;
                        case 'down':
                            tongueStart = {x: x, y: y + headLength/2};
                            tongueControl1 = {x: x + tongueWag/2, y: tongueStart.y + config.segments.tongueLength * 0.4};
                            tongueControl2 = {x: x + tongueWag, y: tongueStart.y + config.segments.tongueLength * 0.7};
                            tongueEnd = {x: x + tongueWag, y: tongueStart.y + config.segments.tongueLength};
                            break;
                        case 'left':
                            tongueStart = {x: x - headLength/2, y: y};
                            tongueControl1 = {x: tongueStart.x - config.segments.tongueLength * 0.4, y: y + tongueWag/2};
                            tongueControl2 = {x: tongueStart.x - config.segments.tongueLength * 0.7, y: y + tongueWag};
                            tongueEnd = {x: tongueStart.x - config.segments.tongueLength, y: y + tongueWag};
                            break;
                        case 'right':
                            tongueStart = {x: x + headLength/2, y: y};
                            tongueControl1 = {x: tongueStart.x + config.segments.tongueLength * 0.4, y: y + tongueWag/2};
                            tongueControl2 = {x: tongueStart.x + config.segments.tongueLength * 0.7, y: y + tongueWag};
                            tongueEnd = {x: tongueStart.x + config.segments.tongueLength, y: y + tongueWag};
                            break;
                    }
                    
                    // Draw curved tongue
                    p5.stroke(config.colors.tongue);
                    p5.strokeWeight(config.segments.tongueWidth);
                    p5.noFill();
                    
                    // Main tongue curve
                    p5.beginShape();
                    p5.vertex(tongueStart.x, tongueStart.y);
                    p5.bezierVertex(
                        tongueControl1.x, tongueControl1.y,
                        tongueControl2.x, tongueControl2.y,
                        tongueEnd.x, tongueEnd.y
                    );
                    p5.endShape();
                    
                    // Fork ends
                    const forkLength = config.segments.tongueLength * 0.3;
                    const forkAngle = Math.PI / 6; // 30 degrees
                    
                    const dx = tongueEnd.x - tongueControl2.x;
                    const dy = tongueEnd.y - tongueControl2.y;
                    const angle = Math.atan2(dy, dx);
                    
                    const fork1End = {
                        x: tongueEnd.x + Math.cos(angle + forkAngle) * forkLength,
                        y: tongueEnd.y + Math.sin(angle + forkAngle) * forkLength
                    };
                    
                    const fork2End = {
                        x: tongueEnd.x + Math.cos(angle - forkAngle) * forkLength,
                        y: tongueEnd.y + Math.sin(angle - forkAngle) * forkLength
                    };
                    
                    p5.line(tongueEnd.x, tongueEnd.y, fork1End.x, fork1End.y);
                    p5.line(tongueEnd.x, tongueEnd.y, fork2End.x, fork2End.y);
                    
                    p5.noStroke();
                }
            } else {
                // Draw body segments as before
                const segmentSize = cellSize * config.segments.size;
                
                // Draw shadow
                p5.fill(config.colors.shadow);
                p5.noStroke();
                p5.rect(
                    pos.x - segmentSize/2 + config.segments.elevation,
                    pos.y - segmentSize/2 + config.segments.elevation,
                    segmentSize,
                    segmentSize,
                    config.segments.cornerRadius
                );
                
                // Draw main segment
                p5.fill(config.colors.body);
                p5.rect(
                    pos.x - segmentSize/2,
                    pos.y - segmentSize/2,
                    segmentSize,
                    segmentSize,
                    config.segments.cornerRadius
                );
                
                // Draw highlights
                p5.fill(config.colors.highlight);
                p5.rect(
                    pos.x - segmentSize/2,
                    pos.y - segmentSize/2,
                    segmentSize,
                    2,
                    config.segments.cornerRadius
                );
                p5.rect(
                    pos.x - segmentSize/2,
                    pos.y - segmentSize/2,
                    2,
                    segmentSize,
                    config.segments.cornerRadius
                );
            }
        });
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
