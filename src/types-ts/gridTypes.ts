import type { GameConfig } from '../config-ts/types';
import type { EventSystem } from '../core-ts/EventSystem';
import type { Snake } from '../entities-ts/Snake';
import type p5 from 'p5';

/**
 * Interface defining the Game dependencies needed by Grid
 */
export interface GridGameDependencies {
    getConfig(): GameConfig;
    getEvents(): EventSystem;
    snake: Snake;
    p5: p5;
}
