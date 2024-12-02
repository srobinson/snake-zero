import type { P5CanvasInstance } from './commonTypes';
import type { PowerUpType } from './powerUpTypes';

export interface PowerupBadgeConfig {
    duration: number;
    popInDuration: number;
    popInScale: number;
    spacing: number;
    size: number;
    floatingSize: number;
    hoverAmplitude: number;
    hoverFrequency: number;
    fadeOutDuration: number;
    offsetY: number;
}

export interface BadgeStyle {
    color: string;
    icon: string;
}

export interface BadgeCollection {
    speed: BadgeStyle;
    ghost: BadgeStyle;
    points: BadgeStyle;
    slow: BadgeStyle;
}

export interface PowerupBadgeProps {
    p5: P5CanvasInstance;
    type: PowerUpType;
    config: PowerupBadgeConfig;
    x: number;
    y: number;
    isFloating: boolean;
}
