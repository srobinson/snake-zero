export type PowerUpType = 'speed' | 'ghost' | 'points' | 'slow';

export interface PowerUpEffect {
    duration: number;
    startTime: number;
    type: PowerUpType;
    active: boolean;
}

export interface PowerUpColors {
    speed: string;
    ghost: string;
    points: string;
    slow: string;
}

export interface PowerUpEventData {
    type: PowerUpType;
    duration: number;
    remainingTime: number;
    active: boolean;
}

export function isValidPowerUpType(type: string): type is PowerUpType {
    return ['speed', 'ghost', 'points', 'slow'].includes(type);
}

export function createPowerUpEffect(type: PowerUpType, duration: number): PowerUpEffect {
    return {
        type,
        duration,
        startTime: Date.now(),
        active: true
    };
}

export function calculateRemainingTime(effect: PowerUpEffect): number {
    if (!effect.active) return 0;
    const elapsed = Date.now() - effect.startTime;
    return Math.max(0, effect.duration - elapsed);
}

export function createPowerUpEventData(effect: PowerUpEffect): PowerUpEventData {
    return {
        type: effect.type,
        duration: effect.duration,
        remainingTime: calculateRemainingTime(effect),
        active: effect.active
    };
}
