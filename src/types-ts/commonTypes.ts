import type { GameConfig } from '../config-ts/types';
import type { GameState } from './gameStateTypes';
import type p5 from 'p5';

export type { GameConfig };

export interface Vector2D {
    x: number;
    y: number;
}

export interface Position extends Vector2D {}

export interface Obstacle {
    segments: Array<Position>;
}

export interface Effect {
    type: PowerUpType;
    startTime: number;
    duration: number;
    active: boolean;
    boost?: number;
    multiplier?: number;
}

export type PowerUpType = 'speed' | 'ghost' | 'points' | 'slow';
export type FoodType = 'regular' | 'bonus' | 'golden';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Entity {
    id: string;
    type: string;
    position: Vector2D;
    active: boolean;
}

export type GameEvent = 'food_collected' | 'power_up_collected' | 'power_up_expired' | 
                       'collision' | 'score_changed' | 'state_changed' | 'speed_changed' |
                       'fpsUpdated' | 'foodEaten' | 'snakeDied' | 'powerUpStarted' | 'powerUpEnded';

export interface EventData {
    score?: number;
    state?: GameState;
    speed?: number;
    powerUpType?: PowerUpType;
    position?: Position;
    points?: number;
    multiplier?: number;
    highScore?: number;
    playTime?: number;
    type?: 'wall' | 'self' | 'food' | 'powerup';
    fps?: number;
    foodEntity?: Entity;  // Added for foodEaten event
    snakeId?: string;
    effect?: Effect;
    duration?: number;
}

export interface GameEventTarget {
    on(event: GameEvent, callback: (data: EventData) => void): void;
    off(event: GameEvent, callback: (data: EventData) => void): void;
    emit(event: GameEvent, data: EventData): void;
}

export type P5CanvasInstance = p5;

export interface GameData {
    config: GameConfig;
    grid: {
        width?: number;
        height?: number;
        cellSize?: number;
        updateDimensions?: () => void;
    };
    width?: number;
    height?: number;
    cellSize?: number;
    updateDimensions?: () => void;
}
