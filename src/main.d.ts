import type P5 from 'p5';
import type { Snake } from './entities/Snake';
import type { Grid } from './core/Grid';
import type { GameConfig } from './config/gameConfig';
import type { PowerUp } from './entities/PowerUp';
import type { Particles } from './core/Particles';

export interface Game {
    readonly config: GameConfig;
    readonly snake: Snake;
    readonly grid: Grid;
    readonly powerUp: PowerUp | null;
    readonly particles: Particles | null;
    readonly p5: P5 | null;
    
    reset(): void;
    pause(): void;
    resume(): void;
    isPaused(): boolean;
    isGameOver(): boolean;
    update(currentTime: number): void;
    draw(): void;
}
