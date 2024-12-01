import { GameEvents } from './EventSystem.js';

export class Grid {
    constructor(game) {
        if (!game) throw new Error('Game is required for Grid');
        
        this.game = game;
        this.config = game.getConfig();
        
        // Validate color values
        this.backgroundColor = this.validateColor(this.config.backgroundColor) || '#FFFFFF';
        this.gridColor = this.validateColor(this.config.gridColor) || '#CCCCCC';
        this.lastRandomPosition = null;
        
        // Initialize dimensions
        this.updateDimensions();
        
        // Listen for window resize with debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = setTimeout(() => {
                try {
                    this.updateDimensions();
                } catch (error) {
                    console.error('Error updating dimensions:', error);
                }
            }, 250);
        });
    }

    calculateMaxCellSize(width, height, currentCellSize) {
        // For fullscreen, calculate max cell size based on viewport
        if (this.config.gameMode === 'fullscreen') {
            const maxWidth = Math.floor(width / Math.floor(width / currentCellSize));
            const maxHeight = Math.floor(height / Math.floor(height / currentCellSize));
            return Math.min(maxWidth, maxHeight, 50);
        }
        return 50; // Default max for windowed modes
    }

    getBoardDimensions() {
        const mode = this.config.gameMode || 'windowed';
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        switch (mode) {
            case 'fullscreen':
                return { width, height };
            case 'windowed':
            default:
                return {
                    width: Math.min(800, width - 40),  // -40 for margins
                    height: Math.min(600, height - 40)
                };
        }
    }

    updateDimensions() {
        const dimensions = this.getBoardDimensions();
        const { width, height } = dimensions;
        const cellSize = this.config.cellSize || 20;

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
        
        // Emit grid resize event
        this.game.getEvents().emit(GameEvents.GRID_RESIZED, {
            width: this.width,
            height: this.height,
            cols: this.cols,
            rows: this.rows,
            cellSize: this.cellSize
        });
    }

    updateCellSize(newSize) {
        // Validate size is a number and integer
        if (!Number.isInteger(newSize)) {
            console.warn('Cell size must be an integer');
            return this.cellSize;
        }

        // Validate size range
        if (newSize < 10 || newSize > 100) {
            console.warn('Cell size must be between 10 and 100');
            return this.cellSize;
        }
        
        const dimensions = this.getBoardDimensions();
        
        // Validate size constraints
        const maxAllowedSize = this.calculateMaxCellSize(
            dimensions.width, 
            dimensions.height, 
            newSize
        );
        const validatedSize = Math.min(Math.max(newSize, 10), maxAllowedSize);
        
        // Update config and dimensions
        this.config.cellSize = validatedSize;
        this.updateDimensions();
        
        return validatedSize;
    }

    getRandomPosition(obstacles = []) {
        let position;
        let attempts = 0;
        const maxAttempts = 100;  // Prevent infinite loops
        
        do {
            position = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
            
            // Check if position overlaps with any obstacles
            const overlaps = obstacles.some(obstacle => {
                if (Array.isArray(obstacle.segments)) {
                    return obstacle.segments.some(segment => 
                        segment.x === position.x && segment.y === position.y
                    );
                }
                return false;
            });
            
            if (!overlaps && 
                (!this.lastRandomPosition ||
                 this.lastRandomPosition.x !== position.x ||
                 this.lastRandomPosition.y !== position.y)) {
                this.lastRandomPosition = position;
                return position;
            }
            
            attempts++;
        } while (attempts < maxAttempts);
        
        console.warn('Could not find valid random position after', maxAttempts, 'attempts');
        return null;
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
    }

    draw(p5) {
        if (!p5 || typeof p5.background !== 'function' || typeof p5.stroke !== 'function' || typeof p5.strokeWeight !== 'function' || typeof p5.line !== 'function') {
            throw new Error('Invalid p5 instance');
        }
        
        // Draw background
        p5.background(this.backgroundColor);
        
        // Only draw grid if enabled in config
        if (this.config.showGrid !== false) {
            p5.stroke(this.gridColor);
            p5.strokeWeight(1);
            
            // Draw vertical lines
            for (let x = 0; x <= this.width; x += this.cellSize) {
                p5.line(x, 0, x, this.height);
            }
            
            // Draw horizontal lines
            for (let y = 0; y <= this.height; y += this.cellSize) {
                p5.line(0, y, this.width, y);
            }
        }
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
        if (!cell || typeof cell.x === 'undefined' || typeof cell.y === 'undefined') {
            console.error('Invalid cell:', cell);
            return { x: 0, y: 0 }; // Return safe default
        }
        
        if (!this.isValidPosition(cell.x, cell.y)) {
            console.error('Invalid cell coordinates:', cell);
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

    toPixelCoords(gridX, gridY) {
        if (!this.isValidPosition(gridX, gridY)) {
            console.error('Invalid grid coordinates:', { x: gridX, y: gridY });
            return null;
        }
        
        return {
            x: gridX * this.cellSize,
            y: gridY * this.cellSize
        };
    }

    toGridCoords(pixelX, pixelY) {
        // Validate input coordinates
        if (typeof pixelX !== 'number' || typeof pixelY !== 'number') {
            console.error('Invalid pixel coordinates:', { x: pixelX, y: pixelY });
            return null;
        }

        const gridX = Math.floor(pixelX / this.cellSize);
        const gridY = Math.floor(pixelY / this.cellSize);

        // Validate output coordinates
        if (!this.isValidPosition(gridX, gridY)) {
            console.warn('Pixel coordinates out of grid bounds:', { x: pixelX, y: pixelY });
            return null;
        }

        return { x: gridX, y: gridY };
    }

    validateColor(color) {
        if (!color) return null;
        // Basic validation for hex colors
        if (/^#[0-9A-F]{6}$/i.test(color)) {
            return color;
        }
        // Could add more color format validations here
        return null;
    }
}
