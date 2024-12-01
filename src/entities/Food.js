export class Food {
    constructor(grid, game) {
        if (!grid) throw new Error('Grid is required for Food');
        if (!game) throw new Error('Game is required for Food');
        
        this.grid = grid;
        this.game = game;
        this.config = game.getConfig();
        
        // Initialize position
        this.position = null;
        this.value = 1;
        this.color = null;
        
        // Spawn initial food
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
            console.warn('Could not find valid food position after', maxAttempts, 'attempts');
            return false;
        }

        this.position = newPosition;
        
        // Determine food value and color based on config weights
        const values = this.config.foodValues || [1];
        const weights = this.config.foodWeights || [100];
        const colors = this.config.foodColors || ['#E91E63'];
        
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                this.value = values[i];
                this.color = colors[i];
                break;
            }
        }

        return true;
    }

    draw(p5) {
        if (!this.position) return;
        
        const cellSize = this.grid.cellSize;
        
        p5.fill(this.color || '#E91E63');
        p5.noStroke();
        
        // Draw food with rounded corners
        p5.rect(
            this.position.x * cellSize,
            this.position.y * cellSize,
            cellSize,
            cellSize,
            cellSize * 0.3
        );
        
        // Draw value text if > 1
        if (this.value > 1) {
            p5.fill(255);
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.textSize(cellSize * 0.5);
            p5.text(
                this.value,
                this.position.x * cellSize + cellSize / 2,
                this.position.y * cellSize + cellSize / 2
            );
        }
    }
}
