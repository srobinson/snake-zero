import { gameConfig } from '../config/gameConfig.js';

export class Food {
    constructor(grid) {
        this.grid = grid;
        this.position = this.getRandomPosition();
    }

    draw(p) {
        const pos = this.grid.toPixel(this.position.x, this.position.y);
        p.fill(...gameConfig.food.color);
        p.noStroke();
        const size = this.grid.cellSize - gameConfig.food.padding;
        p.circle(pos.x + size/2, pos.y + size/2, size);
    }

    getRandomPosition() {
        return {
            x: Math.floor(Math.random() * this.grid.cols),
            y: Math.floor(Math.random() * this.grid.rows)
        };
    }

    respawn() {
        this.position = this.getRandomPosition();
    }
}
