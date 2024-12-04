import type { GameConfig, GridInterface, GridSize, Position } from '../config/types.consolidated';

/**
 * Represents the game grid that manages the game board dimensions, cell sizes,
 * and coordinate transformations between grid and pixel spaces.
 */
export class Grid implements GridInterface {
	private config: GameConfig;
	private backgroundColor: string;
	private gridColor: string;
	private lastRandomPosition: Position | null = null;

	// Additional properties from original JS implementation
	private cols: number = 0;
	private rows: number = 0;
	private width: number = 0;
	private height: number = 0;

	private gridSize: GridSize = {
		width: 0,
		height: 0,
		pixelWidth: 0,
		pixelHeight: 0,
	};
	private cellSize: number = 20; // Default cell size

	/**
	 * Creates a new Grid instance
	 * @param config - The game configuration
	 */
	constructor(config: GameConfig) {
		this.config = config;
		this.backgroundColor = config.board.backgroundColor;
		this.gridColor = config.board.gridColor;

		// Update fullscreen preset dimensions before initializing
		if (this.config.board.preset === 'fullscreen') {
			this.config.board.presets.fullscreen = {
				...this.config.board.presets.fullscreen,
				width: window.innerWidth,
				height: window.innerHeight,
			};
		}
		// Initialize dimensions
		this.updateDimensions();
	}

	/**
	 * Calculates the maximum allowed cell size based on dimensions
	 * @param width - Grid width in pixels
	 * @param height - Grid height in pixels
	 * @param currentCellSize - Current cell size in pixels
	 * @returns Maximum allowed cell size
	 * @private
	 */
	private calculateMaxCellSize(width: number, height: number, currentCellSize: number): number {
		// For fullscreen, calculate max cell size based on viewport
		if (this.config.board.preset === 'fullscreen') {
			const maxWidth = Math.floor(width / Math.floor(width / currentCellSize));
			const maxHeight = Math.floor(height / Math.floor(height / currentCellSize));
			return Math.min(maxWidth, maxHeight, 50);
		}
		return currentCellSize; // Default max for windowed modes
	}

	/**
	 * Updates the grid dimensions based on current configuration
	 */
	public updateDimensions(): void {
		// Get board dimensions from preset if specified
		const boardConfig = this.config.board;
		// eslint-disable-next-line prefer-const
		let { width, height, cellSize } = boardConfig.preset
			? boardConfig.presets[boardConfig.preset]
			: boardConfig;
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

		// Update gridSize
		this.gridSize = {
			width: this.cols,
			height: this.rows,
			pixelWidth: this.width,
			pixelHeight: this.height,
		};
	}

	/**
	 * Gets the current grid size in both cells and pixels
	 * @returns Grid dimensions
	 */
	getSize(): GridSize {
		return this.gridSize;
	}

	/**
	 * Gets the cell size in pixels
	 */
	getCellSize(): number {
		return this.cellSize;
	}

	/**
	 * Gets the center pixel coordinates of a grid cell
	 * @param cell - Grid coordinates of the cell
	 * @returns Pixel coordinates of cell center
	 */
	getCellCenter(cell: Position): Position {
		if (!cell || typeof cell.x === 'undefined' || typeof cell.y === 'undefined') {
			console.error('Invalid cell:', cell);
			return { x: 0, y: 0 }; // Return safe default
		}

		const pixelCoords = this.toPixelCoords(cell.x, cell.y);
		if (
			!pixelCoords ||
			typeof pixelCoords.x === 'undefined' ||
			typeof pixelCoords.y === 'undefined'
		) {
			console.error('Invalid pixel coordinates for cell:', cell);
			return { x: 0, y: 0 }; // Return safe default
		}

		return {
			x: pixelCoords.x + this.cellSize / 2,
			y: pixelCoords.y + this.cellSize / 2,
		};
	}

	/**
	 * Converts grid coordinates to pixel coordinates
	 * @param x - Grid x coordinate
	 * @param y - Grid y coordinate
	 * @returns Pixel coordinates
	 */
	toPixelCoords(x: number, y: number): Position {
		return {
			x: x * this.cellSize,
			y: y * this.cellSize,
		};
	}

	/**
	 * Converts pixel coordinates to grid coordinates
	 * @param pixelX - Pixel x coordinate
	 * @param pixelY - Pixel y coordinate
	 * @returns Grid coordinates
	 */
	toGridCoords(pixelX: number, pixelY: number): Position {
		return {
			x: Math.floor(pixelX / this.cellSize),
			y: Math.floor(pixelY / this.cellSize),
		};
	}

	/**
	 * Gets a random valid position on the grid
	 * @param avoidLast - Whether to avoid the last random position
	 * @returns Random grid position
	 */
	getRandomPosition(avoidLast: boolean = true): Position {
		let newPosition: Position;
		let attempts = 0;
		const maxAttempts = 50; // Increased to give more chances to find a good position
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
			tooClose =
				this.lastRandomPosition &&
				Math.abs(newPosition.x - this.lastRandomPosition.x) <= 1 &&
				Math.abs(newPosition.y - this.lastRandomPosition.y) <= 1;
		} while (tooClose && attempts < maxAttempts);

		this.lastRandomPosition = newPosition;
		return newPosition;
	}

	/**
	 * Updates the cell size and recalculates grid dimensions
	 * @param newCellSize - The new size of each grid cell
	 * @returns boolean indicating if the update was successful
	 */
	updateCellSize(newCellSize: number): boolean {
		// Validate the new cell size
		if (newCellSize < 10 || newCellSize > 100) {
			console.warn('Cell size must be between 10 and 100 pixels');
			return false;
		}

		// Update cell size
		this.cellSize = newCellSize;

		// Recalculate grid size based on new cell size
		this.gridSize = {
			width: this.cols,
			height: this.rows,
			pixelWidth: this.cols * newCellSize,
			pixelHeight: this.rows * newCellSize,
		};

		// Update width and height
		this.width = this.gridSize.pixelWidth;
		this.height = this.gridSize.pixelHeight;

		return true;
	}

	/**
	 * Draws the background of the grid
	 * @param p5 - p5.js instance
	 */
	drawBackground(p5: import('p5')): void {
		// Set background color
		p5.background(this.backgroundColor);
	}

	/**
	 * Draws grid lines on the canvas
	 * @param p5 - p5.js instance
	 */
	drawGridLines(p5: import('p5')): void {
		p5.stroke(this.gridColor);
		p5.strokeWeight(1);

		// Vertical lines
		for (let x = 0; x <= this.cols; x++) {
			const pixelX = x * this.cellSize;
			p5.line(pixelX, 0, pixelX, this.height);
		}

		// Horizontal lines
		for (let y = 0; y <= this.rows; y++) {
			const pixelY = y * this.cellSize;
			p5.line(0, pixelY, this.width, pixelY);
		}
	}

	/**
	 * Draws the grid on the canvas
	 * @param p5 - p5.js instance
	 */
	draw(p5: import('p5')): void {
		this.drawBackground(p5);
		this.drawGridLines(p5);
	}

	/**
	 * Gets the grid width in pixels
	 */
	getWidth(): number {
		return this.width;
	}

	/**
	 * Gets the grid height in pixels
	 */
	getHeight(): number {
		return this.height;
	}
}
