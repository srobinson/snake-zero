import type { P5CanvasInstance } from './commonTypes';
import type { GameConfig } from '../config-ts/types';
import type { Grid } from '../core-ts/Grid';
import type { Snake } from '../entities-ts/Snake';
import type { Food } from '../entities-ts/Food';
import type { PowerUp } from '../entities-ts/PowerUp';
import type { EventSystem } from '../core-ts/EventSystem';
import type { GameStateMachine } from '../core-ts/GameStateMachine';
import type { DebugPanel } from '../core-ts/DebugPanel';
import type { Particles } from '../core-ts/Particles';
import type { PowerupBadge } from '../ui-ts/PowerupBadge';

export interface Position {
    x: number;
    y: number;
}

export interface EventData {
    type?: string;
    [key: string]: any;
}

export interface Game {
    config: GameConfig;
    grid: Grid;
    events: EventSystem;
    stateMachine: GameStateMachine;
    debugPanel: DebugPanel;
    snake: Snake;
    food: Food;
    powerUp: PowerUp | null;
    p5: P5CanvasInstance | null;
    particles: Particles | null;
    activePowerups: Map<string, PowerupBadge>;
    floatingBadges: PowerupBadge[];
    
    setup(p5: P5CanvasInstance): void;
    update(): void;
    applyPowerup(type: string, powerUpPosition: Position): void;
    addPowerupBadge(type: string, powerUpPosition: Position): void;
    draw(): void;
    drawGame(): void;
    drawMenu(): void;
    drawPauseOverlay(): void;
    drawGameOver(): void;
    drawScore(): void;
    handleInput(key: string, isShiftPressed: boolean): boolean;
    recreate(): void;
    reset(): void;
}

export interface TouchEventData {
    preventDefault: () => void;
    touches?: { clientX: number; clientY: number }[];
    changedTouches?: { clientX: number; clientY: number }[];
}
