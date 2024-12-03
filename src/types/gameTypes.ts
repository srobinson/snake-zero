import type { Game } from '../main';

/**
 * Represents a 2D position
 */
export interface Position {
    x: number;
    y: number;
}

/**
 * Represents a grid in the game
 */
export interface Grid {
    cellSize: number;
    game?: Game;
    getRandomPosition(avoidObstacles: boolean): Position;
    getCellCenter(position: Position): Position;
    getCellSize(): number;
}
