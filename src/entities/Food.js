import configManager from '../config/gameConfig.js';

export class Food {
    constructor(grid) {
        this.grid = grid;
        this.config = configManager.getConfig().food;
        this.position = this.getRandomPosition();
        this.color = this.getRandomColor();
        this.lastPositions = new Set(); // Keep track of recent positions
    }

    getRandomPosition() {
        return this.grid.getRandomPosition(true);
    }

    getRandomColor() {
        const colors = this.config.colors;
        const lastColor = this.color;
        let newColor;
        
        // Avoid same color twice in a row
        do {
            newColor = colors[Math.floor(Math.random() * colors.length)];
        } while (newColor === lastColor && colors.length > 1);
        
        return newColor;
    }

    respawn(obstacles = []) {
        let newPosition;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            newPosition = this.getRandomPosition();
            attempts++;

            // Check if position conflicts with any obstacles or recent positions
            const hasConflict = obstacles.some(obstacle => {
                if (Array.isArray(obstacle.segments)) {
                    return obstacle.segments.some(segment => 
                        segment.x === newPosition.x && segment.y === newPosition.y
                    );
                }
                return false;
            }) || this.lastPositions.has(`${newPosition.x},${newPosition.y}`);

            if (!hasConflict) {
                break;
            }
        } while (attempts < maxAttempts);

        // Update position and color
        this.position = newPosition;
        this.color = this.getRandomColor();

        // Add to recent positions (keep last 5)
        this.lastPositions.add(`${newPosition.x},${newPosition.y}`);
        if (this.lastPositions.size > 5) {
            this.lastPositions.delete(this.lastPositions.values().next().value);
        }
    }

    draw(p5) {
        const { x, y } = this.grid.toPixelCoords(this.position.x, this.position.y);
        const cellSize = this.grid.getCellSize();
        
        // Draw food with a slight pulse effect
        const pulseAmount = Math.sin(Date.now() / 200) * 0.1 + 0.9;
        const size = cellSize * 0.8 * pulseAmount;
        
        p5.push();
        p5.translate(x + cellSize/2, y + cellSize/2);
        p5.rotate(Date.now() / 1000); // Slow rotation
        
        p5.fill(this.color);
        p5.noStroke();
        p5.rectMode(p5.CENTER);
        p5.rect(0, 0, size, size, size * 0.2);
        
        p5.pop();
    }
}
