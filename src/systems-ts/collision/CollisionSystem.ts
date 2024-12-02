import { Position } from '../../types-ts/commonTypes';

export class CollisionSystem {
    private grid: any; // We'll type this properly once Grid is converted
    private cellSize: number;

    constructor(grid: any, cellSize: number) {
        this.grid = grid;
        this.cellSize = cellSize;
    }

    checkCollision(pos1: Position, pos2: Position, radius1: number, radius2: number): boolean {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const minDistance = radius1 + radius2;
        return (dx * dx + dy * dy) < (minDistance * minDistance);
    }

    isOutOfBounds(position: Position, radius: number = 0): boolean {
        const gridWidth = this.grid.width * this.cellSize;
        const gridHeight = this.grid.height * this.cellSize;
        
        return position.x - radius < 0 ||
               position.x + radius > gridWidth ||
               position.y - radius < 0 ||
               position.y + radius > gridHeight;
    }

    getRandomPosition(radius: number = 0): Position {
        const gridWidth = this.grid.width * this.cellSize;
        const gridHeight = this.grid.height * this.cellSize;
        
        return {
            x: radius + Math.random() * (gridWidth - 2 * radius),
            y: radius + Math.random() * (gridHeight - 2 * radius)
        };
    }
}
