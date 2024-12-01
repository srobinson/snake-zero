export class Grid {
    constructor(config) {
        this.config = config;
        this.backgroundColor = config.board.backgroundColor;
        this.gridColor = config.board.gridColor;
        this.lastRandomPosition = null;
        
        // Initialize dimensions
        this.updateDimensions();
    }

    calculateMaxCellSize(width, height, currentCellSize) {
        // For fullscreen, calculate max cell size based on viewport
        if (this.config.board.preset === 'fullscreen') {
            const maxWidth = Math.floor(width / Math.floor(width / currentCellSize));
            const maxHeight = Math.floor(height / Math.floor(height / currentCellSize));
            return Math.min(maxWidth, maxHeight, 50);
        }
        return 50; // Default max for windowed modes
    }

    updateDimensions() {
        // Get board dimensions from preset if specified
        const boardConfig = this.config.board;
        const { width, height, cellSize } = boardConfig.preset ? 
            boardConfig.presets[boardConfig.preset] : 
            boardConfig;

        // Calculate maximum allowed cell size
        const maxCellSize = this.calculateMaxCellSize(width, height, cellSize);
        
        // Ensure cell size is within bounds (10-maxCellSize)
        this.cellSize = Math.min(Math.max(cellSize, 10), maxCellSize);
        
        // Calculate grid dimensions
        this.cols = Math.floor(width / this.cellSize);
        this.rows = Math.floor(height / this.cellSize);
        
        // Adjust final dimensions to be divisible by cell size
        this.width = this.cols * this.cellSize;
        this.height = this.rows * this.cellSize;
    }

    updateCellSize(newSize) {
        const preset = this.config.board.preset;
        const { width, height } = this.config.board.presets[preset];
        
        // Validate size constraints
        const maxAllowedSize = this.calculateMaxCellSize(width, height, newSize);
        const validatedSize = Math.min(Math.max(newSize, 10), maxAllowedSize);
        
        if (validatedSize !== newSize) {
            return false; // Size was constrained
        }
        
        // Update the config
        this.config.board.presets[preset].cellSize = validatedSize;
        
        // Recalculate dimensions with new cell size
        this.updateDimensions();
        
        return true; // Size was updated successfully
    }

    getSize() {
        return {
            width: this.cols,
            height: this.rows,
            pixelWidth: this.width,
            pixelHeight: this.height
        };
    }

    getCellSize() {
        return this.cellSize;
    }

    getCellCenter(cell) {
        const pixelCoords = this.toPixelCoords(cell.x, cell.y);
        return {
            x: pixelCoords.x + this.cellSize / 2,
            y: pixelCoords.y + this.cellSize / 2
        };
    }

    getRandomPosition(avoidLast = true) {
        let newPosition;
        let attempts = 0;
        const maxAttempts = 50;  // Increased to give more chances to find a good position
        let tooClose = false;  

        do {
            // Use Math.random() directly for better distribution
            const x = Math.floor(Math.random() * this.cols);
            const y = Math.floor(Math.random() * this.rows);
            
            newPosition = { x, y };
            attempts++;

            // Only check for last position if avoidLast is true and we have a last position
            if (!avoidLast || !this.lastRandomPosition) {
                break;
            }

            // Try to avoid spawning in the same position or adjacent cells
            tooClose = this.lastRandomPosition && 
                Math.abs(newPosition.x - this.lastRandomPosition.x) <= 1 && 
                Math.abs(newPosition.y - this.lastRandomPosition.y) <= 1;

        } while (tooClose && attempts < maxAttempts);

        this.lastRandomPosition = newPosition;
        return newPosition;
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
    }

    drawBackground(p5) {
        p5.background(this.backgroundColor);
    }

    drawGridLines(p5) {
        // Draw grid lines
        p5.stroke(this.gridColor);
        p5.strokeWeight(1);

        // Draw vertical lines
        for (let x = 0; x <= this.cols; x++) {
            p5.line(x * this.cellSize, 0, x * this.cellSize, this.height);
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.rows; y++) {
            p5.line(0, y * this.cellSize, this.width, y * this.cellSize);
        }
    }

    draw(p5) {
        this.drawBackground(p5);
        this.drawGridLines(p5);
    }

    toPixelCoords(gridX, gridY) {
        return {
            x: gridX * this.cellSize,
            y: gridY * this.cellSize
        };
    }

    toGridCoords(pixelX, pixelY) {
        return {
            x: Math.floor(pixelX / this.cellSize),
            y: Math.floor(pixelY / this.cellSize)
        };
    }
}
