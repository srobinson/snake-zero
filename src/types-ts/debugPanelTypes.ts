import type { Grid } from '../core-ts/Grid';
import type { Snake } from '../entities-ts/Snake';
import type { Food } from '../entities-ts/Food';
import type { PowerUp } from '../entities-ts/PowerUp';
import type { GameConfig } from '../config-ts/types';

export type BoardPreset = 'small' | 'medium' | 'large' | 'fullscreen';

export interface DebugConfig {
    enabled: boolean;
    shortcutKey: string | string[];
    fontSize: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    padding: number;
    backgroundColor: string;
    textColor: string;
    showFPS: boolean;
    showSnakeInfo: boolean;
    showGridInfo: boolean;
    showEffects: boolean;
    showControls: boolean;
    showGrid: boolean;
    showVectors: boolean;
    vectors: {
        color: string;
        size: number;
        opacity: number;
    };
    controls: {
        grid: {
            increaseCellSize: string;
            decreaseCellSize: string;
        };
        spawn: {
            speed: string;
            ghost: string;
            points: string;
            slow: string;
        };
        snake: {
            grow: string;
        };
        board: {
            small: string;
            medium: string;
            large: string;
            fullscreen: string;
        };
    };
}

export interface Game {
    grid: Grid;
    snake: Snake;
    food: Food;
    powerUp: PowerUp;
    config: GameConfig;
    recreate: () => void;
}
