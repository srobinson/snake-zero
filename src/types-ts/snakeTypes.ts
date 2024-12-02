import { Position, Effect, PowerUpType } from './commonTypes';
import type { Game } from './gameTypes';
import type p5 from 'p5';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface SnakeColors {
    head: string;
    body: string;
    highlight: string;
    shadow: string;
    glow: string;
    eyes: string;
    pupil: string;
    tongue: string;
}

export interface SnakeSegmentConfig {
    size: number;
    headSize: number;
    headLength: number;
    elevation: number;
    cornerRadius: number;
    eyeSize: number;
    pupilSize: number;
    tongueLength: number;
    tongueWidth: number;
    tongueSpeed: number;
    tongueWagRange: number;
}

export interface SnakeDrawingContext {
    p5: p5;
    position: Position;
    angle: number;
    isHead: boolean;
    config: SnakeSegmentConfig;
    colors: SnakeColors;
    cellSize: number;
    time: number;
    currentSpeed: number;
    effects: Map<PowerUpType, Effect[]>;
}

export interface SnakeState {
    position: Position;
    direction: Direction;
    length: number;
    speed: number;
    effects: Map<PowerUpType, Effect[]>;
    score: number;
    growing: boolean;
    foodEaten: number;
    baseSpeed: number;
    lastMoveTime: number;
    nextDirection: Direction;
}

export interface SnakeCollision {
    type: 'wall' | 'self' | 'food' | 'powerup';
    position: Position;
}

export interface SnakeSegment extends Position {
    angle: number;
    direction: Direction;
}
