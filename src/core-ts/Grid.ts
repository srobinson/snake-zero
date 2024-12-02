import { Position } from '../types-ts/commonTypes';
import type { GameConfig, BoardConfig, BoardPreset } from '../config-ts/types';
import type p5 from 'p5';
import type { GridGameDependencies } from '../types-ts/gridTypes';

interface GridSize {
    width: number;
    height: number;
    pixelWidth: number;
    pixelHeight: number;
}

interface GridCell {
    x: number;
    y: number;
    entities: Set<string>;
}

interface ExtendedBoardConfig extends BoardConfig {
    backgroundColor: string;
    gridColor: string;
    showGrid: boolean;
}

export interface IGrid {
    width: number;
    height: number;
    cellSize: number;
    p5: p5;
    getSize(): { width: number; height: number };
}

export class Grid implements IGrid {
    private readonly config: GameConfig & { board: ExtendedBoardConfig };
    private readonly game: GridGameDependencies;
    private backgroundColor: string;
    private gridColor: string;
    private lastRandomPosition: Position | null;
    private _width: number = 0;
    private _height: number = 0;
    private _cellSize: number = 0;
    private cols: number = 0;
    private rows: number = 0;
    private cells: Map<string, GridCell>;
    private entityCells: Map<string, string>;
    private _p5: p5;

    constructor(game: GridGameDependencies) {
        this.game = game;
        this.config = game.getConfig() as GameConfig & { board: ExtendedBoardConfig };
        this.backgroundColor = this.config.board.backgroundColor;
        this.gridColor = this.config.board.gridColor;
        this.lastRandomPosition = null;
        this.cells = new Map();
        this.entityCells = new Map();
        this._p5 = game.p5;
        
        // Update fullscreen preset dimensions before initializing
        if (this.config.board.preset === 'fullscreen') {
            this.config.board.presets.fullscreen = {
                ...this.config.board.presets.fullscreen,
                width: window.innerWidth,
                height: window.innerHeight
            };
        }

        console.log(game);
        
        
        // Initialize dimensions
        this.updateDimensions();
    }

    private calculateMaxCellSize(width: number, height: number, currentCellSize: number): number {
        // For fullscreen, calculate max cell size based on viewport
        if (this.config.board.preset === 'fullscreen') {
            const maxWidth = Math.floor(width / Math.floor(width / currentCellSize));
            const maxHeight = Math.floor(height / Math.floor(height / currentCellSize));
            return Math.min(maxWidth, maxHeight, 50);
        }
        return 50; // Default max for windowed modes
    }

    public updateDimensions(): void {
        // Get board dimensions from preset if specified
        const boardConfig = this.config.board;
        const preset = boardConfig.presets[boardConfig.preset];
        let { width, height, cellSize } = preset;

        // Convert grid dimensions to pixel dimensions
        width = width * cellSize;
        height = height * cellSize;

        // Handle fullscreen mode
        if (boardConfig.preset === 'fullscreen') {
            preset.width = window.innerWidth;
            preset.height = window.innerHeight;
            width = window.innerWidth;
            height = window.innerHeight;
        }

        // Calculate maximum allowed cell size
        const maxCellSize = this.calculateMaxCellSize(width, height, cellSize);
        
        // Ensure cell size is within bounds (10-maxCellSize)
        this._cellSize = Math.min(Math.max(cellSize, 10), maxCellSize);
        
        // Calculate grid dimensions
        this.cols = Math.floor(width / this._cellSize);
        this.rows = Math.floor(height / this._cellSize);
        
        // Adjust final dimensions to be divisible by cell size
        this._width = this.cols * this._cellSize;
        this._height = this.rows * this._cellSize;
    }

    public updateCellSize(newSize: number): boolean {
        const preset = this.config.board.preset;
        const currentPreset = this.config.board.presets[preset];
        
        // Validate size constraints
        const maxAllowedSize = this.calculateMaxCellSize(currentPreset.width, currentPreset.height, newSize);
        const validatedSize = Math.min(Math.max(newSize, 10), maxAllowedSize);
        
        if (validatedSize !== newSize) {
            return false; // Size was constrained
        }
        
        // Update the config
        currentPreset.cellSize = validatedSize;
        
        // Recalculate dimensions with new cell size
        this.updateDimensions();
        
        return true; // Size was updated successfully
    }

    public getRandomPosition(avoidLast: boolean = true): Position {
        let newPosition: Position;
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

    public isValidPosition(position: Position): boolean {
        return position.x >= 0 && position.x < this.cols && 
               position.y >= 0 && position.y < this.rows;
    }

    public getCellCenter(cell: Position): Position {
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
            x: pixelCoords.x + this._cellSize / 2,
            y: pixelCoords.y + this._cellSize / 2
        };
    }

    public toPixelCoords(gridX: number, gridY: number): Position {
        return {
            x: gridX * this._cellSize,
            y: gridY * this._cellSize
        };
    }

    public toGridCoords(pixelX: number, pixelY: number): Position {
        return {
            x: Math.floor(pixelX / this._cellSize),
            y: Math.floor(pixelY / this._cellSize)
        };
    }

    private drawBackground(p5: p5): void {
        p5.background(this.backgroundColor);
    }

    private drawGridLines(p5: p5): void {
        p5.stroke(this.gridColor);
        p5.strokeWeight(1);

        // Draw vertical lines
        for (let x = 0; x <= this.cols; x++) {
            p5.line(x * this._cellSize, 0, x * this._cellSize, this._height);
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.rows; y++) {
            p5.line(0, y * this._cellSize, this._width, y * this._cellSize);
        }
    }

    public draw(p5: p5): void {
        this.drawBackground(p5);
        this.drawGridLines(p5);
    }

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }

    get cellSize(): number {
        return this._cellSize;
    }

    public get pixelWidth(): number {
        return this._width;
    }

    public get pixelHeight(): number {
        return this._height;
    }

    public get size(): GridSize {
        return {
            width: this.cols,
            height: this.rows,
            pixelWidth: this._width,
            pixelHeight: this._height
        };
    }

    public getSize(): { width: number; height: number } {
        return { width: this.cols, height: this.rows };
    }

    public getGame(): GridGameDependencies {
        return this.game;
    }

    public get p5(): p5 {
        return this._p5;
    }

    public addEntity(entityId: string, position: Position): void {
        const key = `${position.x},${position.y}`;
        let cell = this.cells.get(key);
        
        if (!cell) {
            cell = { x: position.x, y: position.y, entities: new Set() };
            this.cells.set(key, cell);
        }
        
        cell.entities.add(entityId);
        this.entityCells.set(entityId, key);
    }

    public removeEntity(entityId: string): void {
        const key = this.entityCells.get(entityId);
        if (key) {
            const cell = this.cells.get(key);
            if (cell) {
                cell.entities.delete(entityId);
                if (cell.entities.size === 0) {
                    this.cells.delete(key);
                }
            }
            this.entityCells.delete(entityId);
        }
    }

    public getEntitiesAt(position: Position): Set<string> {
        const key = `${position.x},${position.y}`;
        const cell = this.cells.get(key);
        return cell ? cell.entities : new Set();
    }

    public moveEntity(entityId: string, from: Position, to: Position): void {
        this.removeEntity(entityId);
        this.addEntity(entityId, to);
    }
}
