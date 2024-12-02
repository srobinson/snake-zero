/**
 * @typedef {Object} GridSize
 * @property {number} width - Width of the grid in cells
 * @property {number} height - Height of the grid in cells
 * @property {number} pixelWidth - Width of the grid in pixels
 * @property {number} pixelHeight - Height of the grid in pixels
 */

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * Represents the game grid that manages the game board dimensions, cell sizes,
 * and coordinate transformations between grid and pixel spaces.
 * @class
 */
export class Grid {
    /**
     * Creates a new Grid instance
     * @param {import('../config/gameConfig.js').GameConfig} config - The game configuration
     */
    constructor(config) {
        this.config = config;
        this.backgroundColor = config.board.backgroundColor;
        this.gridColor = config.board.gridColor;
        this.lastRandomPosition = null;
        
        // Update fullscreen preset dimensions before initializing
        if (this.config.board.preset === 'fullscreen') {
            this.config.board.presets.fullscreen = {
                ...this.config.board.presets.fullscreen,
                width: window.innerWidth,
                height: window.innerHeight
            };
        }
        
        // Initialize dimensions
        this.updateDimensions();
    }

    /**
     * Calculates the maximum allowed cell size based on dimensions
     * @param {number} width - Grid width in pixels
     * @param {number} height - Grid height in pixels
     * @param {number} currentCellSize - Current cell size in pixels
     * @returns {number} Maximum allowed cell size
     * @private
     */
    calculateMaxCellSize(width, height, currentCellSize) {
        // For fullscreen, calculate max cell size based on viewport
        if (this.config.board.preset === 'fullscreen') {
            const maxWidth = Math.floor(width / Math.floor(width / currentCellSize));
            const maxHeight = Math.floor(height / Math.floor(height / currentCellSize));
            return Math.min(maxWidth, maxHeight, 50);
        }
        return 50; // Default max for windowed modes
    }

    /**
     * Updates the grid dimensions based on current configuration
     */
    updateDimensions() {
        // Get board dimensions from preset if specified
        const boardConfig = this.config.board;
        let { width, height, cellSize } = boardConfig.preset ? 
            boardConfig.presets[boardConfig.preset] : 
            boardConfig;

        // Handle fullscreen mode
        if (boardConfig.preset === 'fullscreen') {
            width = window.innerWidth;
            height = window.innerHeight;
            // Update the preset dimensions
            boardConfig.presets.fullscreen.width = width;
            boardConfig.presets.fullscreen.height = height;
        }

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

    /**
     * Updates the cell size and recalculates grid dimensions
     * @param {number} newSize - New cell size in pixels
     * @returns {boolean} True if size was updated successfully, false if constrained
     */
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

    /**
     * Gets the current grid size in both cells and pixels
     * @returns {GridSize} Grid dimensions
     */
    getSize() {
        return {
            width: this.cols,
            height: this.rows,
            pixelWidth: this.width,
            pixelHeight: this.height
        };
    }

    /**
     * Gets the current cell size in pixels
     * @returns {number} Cell size in pixels
     */
    getCellSize() {
        return this.cellSize;
    }

    /**
     * Gets the center pixel coordinates of a grid cell
     * @param {Position} cell - Grid coordinates of the cell
     * @returns {Position} Pixel coordinates of cell center
     */
    getCellCenter(cell) {
        if (!cell || typeof cell.x === 'undefined' || typeof cell.y === 'undefined') {
            console.error('Invalid cell:', cell);
            return { x: 0, y: 0 }; // Return safe default
        }
        
        const pixelCoords = this.toPixelCoords(cell.x, cell.y);
        if (!pixelCoords || typeof pixelCoords.x === 'undefined' || typeof pixelCoords.y === 'undefined') {
            console.error('Invalid pixel coordinates for cell:', cell);
            return { x: 0, y: 0 }; // Return safe default
        }
        
        return {
            x: pixelCoords.x + this.cellSize / 2,
            y: pixelCoords.y + this.cellSize / 2
        };
    }

    /**
     * Gets a random valid position on the grid
     * @param {boolean} [avoidLast=true] - Whether to avoid the last random position
     * @returns {Position} Random grid position
     */
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

    /**
     * Checks if a grid position is within bounds
     * @param {number} x - X coordinate in grid space
     * @param {number} y - Y coordinate in grid space
     * @returns {boolean} True if position is valid
     */
    isValidPosition(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
    }

    /**
     * Draws the grid background
     * @param {import('p5')} p5 - The p5.js instance
     */
    drawBackground(p5) {
        p5.background(this.backgroundColor);
    }

    /**
     * Draws the grid lines
     * @param {import('p5')} p5 - The p5.js instance
     */
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

    /**
     * Draws the complete grid
     * @param {import('p5')} p5 - The p5.js instance
     */
    draw(p5) {
        this.drawBackground(p5);
        this.drawGridLines(p5);
    }

    /**
     * Converts grid coordinates to pixel coordinates
     * @param {number} gridX - X coordinate in grid space
     * @param {number} gridY - Y coordinate in grid space
     * @returns {Position} Coordinates in pixel space
     */
    toPixelCoords(gridX, gridY) {
        return {
            x: gridX * this.cellSize,
            y: gridY * this.cellSize
        };
    }

    /**
     * Converts pixel coordinates to grid coordinates
     * @param {number} pixelX - X coordinate in pixel space
     * @param {number} pixelY - Y coordinate in pixel space
     * @returns {Position} Coordinates in grid space
     */
    toGridCoords(pixelX, pixelY) {
        return {
            x: Math.floor(pixelX / this.cellSize),
            y: Math.floor(pixelY / this.cellSize)
        };
    }
}
