export class PowerUp {
    constructor(grid, game) {
        if (!grid) throw new Error('Grid is required for PowerUp');
        if (!game) throw new Error('Game is required for PowerUp');
        
        this.grid = grid;
        this.game = game;
        this.config = game.getConfig();
        
        // Initialize position and type
        this.position = null;
        this.type = this.getRandomType();
        
        // Spawn power-up
        this.respawn();
    }

    respawn(obstacles = []) {
        let newPosition;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            newPosition = this.grid.getRandomPosition();
            attempts++;

            // Check collision with obstacles
            if (obstacles.some(obstacle => {
                if (Array.isArray(obstacle.segments)) {
                    return obstacle.segments.some(segment => 
                        segment.x === newPosition.x && segment.y === newPosition.y
                    );
                }
                return false;
            })) {
                newPosition = null;
            }
        } while (!newPosition && attempts < maxAttempts);

        if (!newPosition) {
            console.warn('Could not find valid power-up position after', maxAttempts, 'attempts');
            return false;
        }

        this.position = newPosition;
        this.type = this.getRandomType();
        return true;
    }

    getRandomType() {
        const types = this.config.powerUpTypes || ['speed'];
        return types[Math.floor(Math.random() * types.length)];
    }

    draw(p5) {
        if (!this.position) return;
        
        const cellSize = this.grid.cellSize;
        const x = this.position.x * cellSize;
        const y = this.position.y * cellSize;
        
        // Get color based on type
        const colors = {
            speed: this.config.powerUpSpeedColor || '#FFD700',
            slow: this.config.powerUpSlowColor || '#4169E1',
            ghost: this.config.powerUpGhostColor || '#7B68EE',
            points: this.config.powerUpPointsColor || '#32CD32'
        };
        
        p5.fill(colors[this.type] || '#FFD700');
        p5.noStroke();
        
        // Draw power-up with star shape
        const radius = cellSize * 0.4;
        const points = 5;
        const innerRadius = radius * 0.4;
        
        p5.push();
        p5.translate(x + cellSize/2, y + cellSize/2);
        p5.beginShape();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? radius : innerRadius;
            const angle = (i * Math.PI) / points;
            p5.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        p5.endShape(p5.CLOSE);
        p5.pop();
    }

    /**
     * Apply power-up effect to the snake
     * @param {Snake} snake - The snake to apply the effect to
     */
    apply(snake) {
        if (!snake) {
            console.error('Cannot apply power-up: snake is null');
            return;
        }

        const duration = this.config.powerUpDuration || 5000;

        switch (this.type) {
            case 'speed':
                snake.addEffect('speed', duration);
                break;
            case 'slow':
                snake.addEffect('slow', duration);
                break;
            case 'ghost':
                snake.addEffect('ghost', duration);
                break;
            case 'points':
                // Points multiplier is temporary
                snake.addEffect('points', duration);
                break;
            default:
                console.warn('Unknown power-up type:', this.type);
        }
    }
}
