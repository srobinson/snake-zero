export class Grid {
    constructor(boardConfig) {
        this.width = boardConfig.width;
        this.height = boardConfig.height;
        this.cellSize = boardConfig.gridSize;
        this.cols = boardConfig.cols || Math.floor(this.width / this.cellSize);
        this.rows = boardConfig.rows || Math.floor(this.height / this.cellSize);
        
        // Validate grid dimensions
        if (this.width % this.cellSize !== 0 || this.height % this.cellSize !== 0) {
            console.warn('Grid dimensions should be divisible by cell size for optimal rendering');
        }
    }

    getSize() {
        return {
            width: this.cols,
            height: this.rows
        };
    }

    isWithinBounds(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
    }

    toPixel(gridX, gridY) {
        return {
            x: gridX * this.cellSize,
            y: gridY * this.cellSize
        };
    }

    toGrid(pixelX, pixelY) {
        return {
            x: Math.floor(pixelX / this.cellSize),
            y: Math.floor(pixelY / this.cellSize)
        };
    }

    draw(p) {
        p.stroke(50);
        p.strokeWeight(1);
        
        // Draw vertical lines
        for (let x = 0; x <= this.width; x += this.cellSize) {
            p.line(x, 0, x, this.height);
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.height; y += this.cellSize) {
            p.line(0, y, this.width, y);
        }
    }
}
