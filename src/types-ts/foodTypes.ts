import type { Position } from './commonTypes';
import type p5 from 'p5';

export type FoodPixelArray = number[][];

export interface FoodDrawingContext {
    p5: p5;
    pixelSize: number;
    colors: {
        primary: string;
        secondary: string;
        highlight: string;
    };
    sparklePhase?: number;
}

export interface FoodDrawingConfig {
    scale: number;
    pixels: FoodPixelArray;
    offsetX: number;
    offsetY: number;
}

export interface Obstacle {
    segments: Array<Position>;
}
