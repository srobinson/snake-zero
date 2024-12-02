import configManager from '../config/gameConfig.js';

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate on the grid
 * @property {number} y - Y coordinate on the grid
 */

/**
 * @typedef {Object} Effect
 * @property {import('../config/gameConfig.js').PowerUpType} type - Type of effect
 * @property {number} startTime - Time when effect started
 * @property {number} duration - Duration of effect in milliseconds
 * @property {number} [boost] - Speed boost multiplier for speed effects
 * @property {number} [multiplier] - Points multiplier for points effects
 */

/**
 * @typedef {Object} SnakeSegmentConfig
 * @property {number} size - Body segment size relative to cell
 * @property {number} headSize - Head size relative to cell
 * @property {number} headLength - Length of the snake's head
 * @property {number} elevation - Elevation/height of the snake segments
 * @property {number} cornerRadius - Radius for rounded corners
 * @property {number} eyeSize - Size of the snake's eyes
 * @property {number} pupilSize - Size of the snake's pupils
 * @property {number} tongueLength - Length of the snake's tongue
 * @property {number} tongueWidth - Width of the snake's tongue
 * @property {number} tongueSpeed - Speed of tongue animation
 * @property {number} tongueWagRange - Range of tongue wagging motion
 */

/**
 * @typedef {import('../main.js').default} Game
 */

/**
 * Represents the snake in the game, including its movement, effects, and rendering.
 * The snake consists of segments (head and body), can move in four directions,
 * and can be affected by various power-ups.
 * @class
 */
export class Snake {
    /**
     * Creates a new Snake instance
     * @param {import('../core/Grid.js').Grid} grid - The game grid instance
     * @param {Game} game - The game instance
     */
    constructor(grid, game) {
        /** @type {import('../core/Grid.js').Grid} */
        this.grid = grid;
        /** @type {Game} */
        this.game = game;
        /** @type {import('../config/gameConfig.js').GameConfig} */
        this.config = game.config;
        /** @type {Map<import('../config/gameConfig.js').PowerUpType, Effect[]>} */
        this.effects = new Map();
        
        // Initialize base properties
        /** @type {Position[]} */
        this.segments = [];
        /** @type {'up'|'down'|'left'|'right'} */
        this.direction = this.config.snake.initialDirection || 'right';
        /** @type {'up'|'down'|'left'|'right'} */
        this.nextDirection = this.direction;
        /** @type {number} */
        this.lastMoveTime = 0;
        /** @type {number} */
        this.score = 0;
        /** @type {boolean} */
        this.growing = false;
        /** @type {number} */
        this.foodEaten = 0;
        /** @type {number} */
        this.baseSpeed = this.config.difficulty.presets[this.config.difficulty.current].baseSpeed;
        
        // Initialize snake segments
        this.reset();
    }

    /**
     * Resets the snake to its initial state at the center of the grid
     */
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
        for (let i = 0; i < snakeConfig.initialLength - 1; i++) {  // -1 because head is now 2 cells
            this.segments.push({ x: currentX - i, y: centerY });
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

    /**
     * Updates the snake's position and state
     * @param {number} currentTime - Current game time in milliseconds
     * @returns {boolean} Whether the snake moved this update
     */
    update(currentTime) {
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

    /**
     * Sets the snake's direction, preventing 180-degree turns
     * @param {'up'|'down'|'left'|'right'} newDirection - New direction to set
     */
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

    /**
     * Makes the snake grow by one segment and updates score/speed
     */
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

    /**
     * Checks if the snake has collided with walls or itself
     * @returns {boolean} True if collision detected, false otherwise
     */
    checkCollision() {
        const head = this.segments[0];
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

    /**
     * Checks if the snake's head is colliding with food
     * @param {import('./Food.js').Food} food - Food item to check collision with
     * @returns {boolean} True if collision detected, false otherwise
     */
    checkFoodCollision(food) {
        if (!food) return false;
        const head = this.segments[0];
        return head.x === food.position.x && head.y === food.position.y;
    }

    /**
     * Checks if the snake's head is colliding with a power-up
     * @param {import('./PowerUp.js').PowerUp} powerUp - Power-up to check collision with
     * @returns {boolean} True if collision detected, false otherwise
     */
    checkPowerUpCollision(powerUp) {
        if (!powerUp) return false;
        const head = this.segments[0];
        return head.x === powerUp.position.x && head.y === powerUp.position.y;
    }

    /**
     * Updates active effects, removing expired ones
     */
    updateEffects() {
        const now = Date.now();
        
        // Update each effect type
        for (const [type, stacks] of this.effects.entries()) {
            // Remove expired effects
            while (stacks.length > 0) {
                const effect = stacks[0];
                if (now <= effect.startTime + effect.duration) break;
                stacks.shift();
            }
            
            // Remove empty effect types
            if (stacks.length === 0) {
                this.effects.delete(type);
            }
        }
    }

    /**
     * Adds a power-up effect to the snake
     * @param {import('../config/gameConfig.js').PowerUpType} type - The type of effect to add
     */
    addEffect(type) {
        const now = Date.now();
        const effectConfig = this.config.powerUps.effects[type];
        
        // Ensure we have a valid duration from the config
        if (!effectConfig || typeof effectConfig.duration !== 'number') {
            console.error(`Invalid effect config for type: ${type}`);
            return;
        }

        const effect = {
            type,
            startTime: now,
            duration: effectConfig.duration,
            active: true
        };
        
        // Add effect-specific properties
        switch(type) {
            case 'speed':
                effect.boost = effectConfig.speedMultiplier || this.config.snake.speedProgression.initialSpeedBoost;
                break;
            case 'ghost':
                break;
            case 'points':
                effect.multiplier = effectConfig.pointsMultiplier || 2;
                break;
            case 'slow':
                effect.multiplier = effectConfig.slowMultiplier || 0.5;
                break;
        }
        
        // Initialize or get the effect stack
        if (!this.effects.has(type)) {
            this.effects.set(type, []);
        }
        
        this.effects.get(type).push(effect);
    }

    /**
     * Gets the snake's current speed including all active effects
     * @returns {number} Current speed in cells per second
     */
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

    /**
     * Gets the current points multiplier from active effects
     * @returns {number} Current points multiplier
     */
    getPointsMultiplier() {
        this.updateEffects();
        
        const pointsStacks = this.effects.get('points') || [];
        return pointsStacks.length > 0 ? 
            pointsStacks[pointsStacks.length - 1].multiplier : 1;
    }

    /**
     * Checks if a specific effect is currently active
     * @param {import('../config/gameConfig.js').PowerUpType} type - Type of effect to check
     * @returns {boolean} True if effect is active, false otherwise
     */
    hasEffect(type) {
        this.updateEffects();
        return this.effects.has(type);
    }

    /**
     * Gets the remaining time for a specific effect
     * @param {import('../config/gameConfig.js').PowerUpType} type - Type of effect to check
     * @returns {number} Remaining time in milliseconds, 0 if effect not active
     */
    getEffectTimeRemaining(type) {
        const stacks = this.effects.get(type);
        if (!stacks || stacks.length === 0) return 0;
        
        const now = Date.now();
        const effect = stacks[stacks.length - 1]; // Get most recent effect
        return Math.max(0, (effect.startTime + effect.duration) - now);
    }

    /**
     * Gets the delay between moves based on current speed
     * @returns {number} Delay in milliseconds
     */
    getMoveDelay() {
        return 1000 / this.getCurrentSpeed();
    }

    /**
     * Draws the snake on the canvas
     * @param {import('p5')} p5 - The p5.js instance
     * @param {number} time - Current game time in milliseconds
     */
    draw(p5, time) {
        const config = this.config.snake;
        const cellSize = this.grid.getCellSize();

        if (!this.segments || this.segments.length === 0) {
            console.error('No segments to draw');
            return;
        }

        // Start drawing with powerup effects
        p5.push();
        this.applyGhostEffect(p5);

        // Draw body segments first (from tail to neck)
        for (let i = this.segments.length - 1; i >= 2; i--) {
            const segment = this.segments[i];
            if (!segment || typeof segment.x === 'undefined' || typeof segment.y === 'undefined') {
                console.error('Invalid segment:', segment, 'at index:', i);
                continue;
            }

            let pos = this.grid.getCellCenter(segment);
            if (!pos || typeof pos.x === 'undefined' || typeof pos.y === 'undefined') {
                console.error('Invalid position:', pos, 'for segment:', segment);
                continue;
            }

            pos = this.drawSegmentEffects(p5, pos, i, time, cellSize);
            this.drawBodySegment(p5, pos, cellSize);
        }

        // Draw head (2 segments)
        if (this.segments.length >= 2) {
            // Draw back of head (second segment)
            const backHead = this.segments[1];
            let backPos = this.grid.getCellCenter(backHead);
            this.drawBodySegment(p5, backPos, cellSize);

            // Draw front of head (first segment)
            const frontHead = this.segments[0];
            let frontPos = this.grid.getCellCenter(frontHead);
            this.drawHead(p5, frontPos, cellSize);
        }
        
        // Reset powerup effects
        this.resetEffects(p5);
        p5.pop();
    }

    /**
     * Draws a body segment
     * @param {import('p5')} p5 - The p5.js instance
     * @param {{x: number, y: number}} pos - Segment position
     * @param {number} cellSize - Size of a grid cell
     * @private
     */
    drawBodySegment(p5, pos, cellSize) {
        const config = this.config.snake;
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
    }

    /**
     * Draws the snake's head
     * @param {import('p5')} p5 - The p5.js instance
     * @param {{x: number, y: number}} pos - Head position
     * @param {number} cellSize - Size of a grid cell
     * @private
     */
    drawHead(p5, pos, cellSize) {
        const config = this.config.snake;
        const headWidth = cellSize * config.segments.headSize;
        const headLength = cellSize * 2; // Make head 2 cells long
        const x = pos.x;
        const y = pos.y;
        
        // Draw head shadow
        p5.fill(config.colors.shadow);
        p5.noStroke();
        
        switch(this.direction) {
            case 'left':
                p5.rect(
                    x - headLength/2 + config.segments.elevation,
                    y - headWidth/2 + config.segments.elevation,
                    headLength,
                    headWidth,
                    config.segments.cornerRadius
                );
                break;
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
                p5.rect(
                    x - headWidth/2 + config.segments.elevation,
                    y - headLength/2 + config.segments.elevation,
                    headWidth,
                    headLength,
                    config.segments.cornerRadius
                );
                break;
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
                p5.rect(
                    x - headLength/2,
                    y - headWidth/2,
                    headLength,
                    headWidth,
                    config.segments.cornerRadius
                );
                break;
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
                p5.rect(
                    x - headWidth/2,
                    y - headLength/2,
                    headWidth,
                    headLength,
                    config.segments.cornerRadius
                );
                break;
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
        
        this.drawEyes(p5, x, y, headWidth, headLength);
    }

    /**
     * Draws the snake's eyes
     * @param {import('p5')} p5 - The p5.js instance
     * @param {number} x - X coordinate of the eye center
     * @param {number} y - Y coordinate of the eye center
     * @param {number} headWidth - Width of the snake's head
     * @param {number} headLength - Length of the snake's head
     * @private
     */
    drawEyes(p5, x, y, headWidth, headLength) {
        const config = this.config.snake;
        const eyeSize = config.segments.eyeSize;
        const pupilSize = config.segments.pupilSize;
        const eyeOffsetX = headWidth * 0.15;
        const eyeOffsetY = headWidth * 0.15;
        let leftEye, rightEye;
        
        switch(this.direction) {
            case 'left':
                leftEye = { x: x - headLength/4, y: y - eyeOffsetY };
                rightEye = { x: x - headLength/4, y: y + eyeOffsetY };
                break;
            case 'right':
                leftEye = { x: x + headLength/4, y: y - eyeOffsetY };
                rightEye = { x: x + headLength/4, y: y + eyeOffsetY };
                break;
            case 'up':
                leftEye = { x: x - eyeOffsetX, y: y - headLength/4 };
                rightEye = { x: x + eyeOffsetX, y: y - headLength/4 };
                break;
            case 'down':
                leftEye = { x: x - eyeOffsetX, y: y + headLength/4 };
                rightEye = { x: x + eyeOffsetX, y: y + headLength/4 };
                break;
        }
        
        // Draw eye whites
        p5.fill(config.colors.eyes);
        p5.noStroke();
        p5.circle(leftEye.x, leftEye.y, eyeSize);
        p5.circle(rightEye.x, rightEye.y, eyeSize);
        
        // Draw pupils
        if (pupilSize > 0) {
            p5.fill(config.colors.pupil);
            p5.circle(leftEye.x, leftEye.y, pupilSize);
            p5.circle(rightEye.x, rightEye.y, pupilSize);
        }
    }

    /**
     * Draws powerup effects for a body segment
     * @param {import('p5')} p5 - The p5.js instance
     * @param {Position} pos - Segment position
     * @param {number} index - Segment index
     * @param {number} time - Current game time
     * @param {number} cellSize - Size of a grid cell
     * @private
     */
    drawSegmentEffects(p5, pos, index, time, cellSize) {
        const config = this.config.snake;
        const hasSpeed = this.hasEffect('speed');
        const hasPoints = this.hasEffect('points');
        const hasSlow = this.hasEffect('slow');

        // Speed effect: add speed lines
        if (hasSpeed) {
            const speedEffect = config.effects.speed;
            const angle = this.direction === 'left' || this.direction === 'right' ? 0 : Math.PI/2;
            const lineLength = cellSize * speedEffect.lineLength;
            p5.push();
            p5.translate(pos.x, pos.y);
            p5.rotate(angle);
            p5.stroke(255, 255, 255, speedEffect.lineOpacity * 255);
            p5.strokeWeight(speedEffect.lineWidth);
            p5.line(-lineLength/2, 0, lineLength/2, 0);
            p5.pop();
        }

        // Points effect: add sparkles
        if (hasPoints && Math.random() < config.effects.points.sparkleChance) {
            const pointsEffect = config.effects.points;
            const sparkSize = cellSize * pointsEffect.sparkleSize;
            p5.push();
            p5.translate(pos.x, pos.y);
            p5.noStroke();
            p5.fill(255, 255, 0, pointsEffect.sparkleOpacity * 255);
            this.drawStar(p5, 0, 0, sparkSize * 0.4, sparkSize, 5);
            p5.pop();
        }

        // Slow effect: add wavy motion
        if (hasSlow) {
            const slowEffect = config.effects.slow;
            pos.x += Math.sin((time * slowEffect.waveSpeed) + (index * slowEffect.waveFrequency)) 
                    * (cellSize * slowEffect.waveAmplitude);
        }

        return pos;
    }

    /**
     * Helper function to draw a star shape
     * @param {import('p5')} p5 - The p5.js instance
     * @param {number} x - X coordinate of the star center
     * @param {number} y - Y coordinate of the star center
     * @param {number} radius1 - Inner radius of star points
     * @param {number} radius2 - Outer radius of star points
     * @param {number} npoints - Number of star points
     */
    drawStar(p5, x, y, radius1, radius2, npoints) {
        let angle = Math.PI * 2 / npoints;
        let halfAngle = angle / 2.0;
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

    /**
     * Applies ghost effect to the drawing context
     * @param {import('p5')} p5 - The p5.js instance
     * @private
     */
    applyGhostEffect(p5) {
        if (this.hasEffect('ghost')) {
            const ghostEffect = this.config.snake.effects.ghost;
            p5.drawingContext.globalAlpha = ghostEffect.opacity;
            p5.drawingContext.shadowBlur = ghostEffect.glowRadius;
            p5.drawingContext.shadowColor = ghostEffect.glowColor;
        }
    }

    /**
     * Resets any applied effects to the drawing context
     * @param {import('p5')} p5 - The p5.js instance
     * @private
     */
    resetEffects(p5) {
        p5.drawingContext.globalAlpha = 1;
        p5.drawingContext.shadowBlur = 0;
    }

    /**
     * Draws a speed vector for debugging
     * @param {import('p5')} p5 - The p5.js instance
     */
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
