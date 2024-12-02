import { FoodType, PowerUpType, Direction } from '../types-ts/commonTypes';

export interface SnakeControls {
    up: string[];
    down: string[];
    left: string[];
    right: string[];
}

export interface DebugControls {
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
    grid: {
        increaseCellSize: string;
        decreaseCellSize: string;
    };
}

export interface DebugVectors {
    color: string;
    size: number;
    opacity: number;
}

export interface DebugConfig {
    enabled: boolean;
    showFPS: boolean;
    showSnakeInfo: boolean;
    showGrid: boolean;
    showVectors: boolean;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    fontSize: number;
    padding: number;
    backgroundColor: string;
    textColor: string;
    showGridInfo: boolean;
    showEffects: boolean;
    showControls: boolean;
    shortcutKey: string | string[];
    controls: DebugControls;
    vectors: DebugVectors;
}

export interface BoardPreset {
    width: number;
    height: number;
    cellSize: number;
}

export interface BoardConfig {
    preset: string;
    cellSize: number;
    presets: Record<string, BoardPreset>;
    padding: number;
    backgroundColor: string;
    gridColor: string;
    width: number;
    height: number;
}

export interface DifficultyLevel {
    speed: number;
    growth: number;
    score: number;
}

export interface DifficultyPreset {
    baseSpeed: number;
    powerUpChance: number;
}

export interface DifficultyConfig {
    current: string;
    levels: Record<string, DifficultyLevel>;
    presets: Record<string, DifficultyPreset>;
}

export interface SpeedProgression {
    enabled: boolean;
    increasePerFood: number;
    maxSpeed: number;
    initialSpeedBoost: number;
    slowEffect: number;
}

export interface FoodColors {
    primary: string;
    secondary: string;
    highlight: string;
}

export interface FoodEffects {
    bounceSpeed: Record<FoodType, number>;
    glowIntensity: Record<FoodType, number>;
    particleCount: Record<FoodType, number>;
    pixelSize: Record<FoodType, number>;
    sparkleSpeed: Record<FoodType, number>;
    glow: Record<FoodType, number>;
}

export interface FoodConfig {
    types: FoodType[];
    spawnRate: number;
    lifetime: number;
    effects: FoodEffects;
    colors: Record<FoodType, FoodColors>;
    points: Record<FoodType, number>;
    spawnRates: Record<FoodType, number>;
}

export interface PowerUpEffect {
    duration: number;
    strength: number;
    particleCount: number;
}

export interface PowerUpConfig {
    types: PowerUpType[];
    spawnChance: number;
    effects: Record<PowerUpType, PowerUpEffect>;
    colors: Record<PowerUpType, string>;
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

export interface SnakeConfig {
    initialLength: number;
    initialDirection?: Direction;
    controls: SnakeControls;
    speedProgression: SpeedProgression;
    colors: SnakeColors;
    segments: SnakeSegmentConfig;
}

export interface PowerupBadgeConfig {
    // Add properties for PowerupBadgeConfig here
}

export interface GameConfig {
    debug: DebugConfig;
    board: BoardConfig;
    difficulty: DifficultyConfig;
    snake: SnakeConfig;
    food: FoodConfig;
    powerUps: PowerUpConfig;
    powerupBadges: PowerupBadgeConfig;
}

export interface GameData {
    config: GameConfig;
    grid: {
        updateDimensions?: () => void;
        width?: number;
        height?: number;
        cellSize?: number;
    };
}
