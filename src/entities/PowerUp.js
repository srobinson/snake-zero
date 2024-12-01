import configManager from '../config/gameConfig.js';

export class PowerUp {
    constructor(grid, obstacles = []) {
        this.grid = grid;
        this.config = configManager.getConfig().powerUps;
        this.position = this.getRandomPosition(obstacles);
        this.type = this.getRandomType();
        this.spawnTime = Date.now();
    }

    getRandomPosition(obstacles) {
        let newPosition;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            newPosition = this.grid.getRandomPosition(true);
            attempts++;

            // Check if position conflicts with any obstacles
            const hasConflict = obstacles.some(obstacle => {
                if (Array.isArray(obstacle.segments)) {
                    return obstacle.segments.some(segment => 
                        segment.x === newPosition.x && segment.y === newPosition.y
                    );
                } else if (obstacle.position) {
                    return obstacle.position.x === newPosition.x && 
                           obstacle.position.y === newPosition.y;
                }
                return false;
            });

            if (!hasConflict) {
                break;
            }
        } while (attempts < maxAttempts);

        return newPosition;
    }

    getRandomType() {
        const types = this.config.types;
        return types[Math.floor(Math.random() * types.length)];
    }

    apply(snake) {
        snake.addEffect(this.type, this.config.duration);
    }

    draw(p5) {
        const { x, y } = this.grid.toPixelCoords(this.position.x, this.position.y);
        const cellSize = this.grid.getCellSize();

        // Create a pulsing/rotating effect
        const pulseAmount = Math.sin(p5.frameCount * 0.1) * 0.2 + 0.8;
        const rotateAmount = p5.frameCount * 0.05;
        const size = cellSize * pulseAmount;
        const offset = (cellSize - size) / 2;

        p5.push();
        p5.translate(x + cellSize/2, y + cellSize/2);
        p5.rotate(rotateAmount);

        // Draw power-up
        p5.fill(this.config.colors[this.type]);
        p5.noStroke();
        this.drawStar(p5, 0, 0, size/2, size/3, 5);

        p5.pop();
    }

    drawStar(p5, x, y, radius1, radius2, npoints) {
        let angle = p5.TWO_PI / npoints;
        let halfAngle = angle/2.0;
        
        p5.beginShape();
        for (let a = 0; a < p5.TWO_PI; a += angle) {
            let sx = x + p5.cos(a) * radius2;
            let sy = y + p5.sin(a) * radius2;
            p5.vertex(sx, sy);
            sx = x + p5.cos(a+halfAngle) * radius1;
            sy = y + p5.sin(a+halfAngle) * radius1;
            p5.vertex(sx, sy);
        }
        p5.endShape(p5.CLOSE);
    }
}
