import { PowerUpEffect, PowerUpColors } from '../types-ts/powerUpTypes';

interface CrystalConfig {
    baseSize: number;
    floatSpeed: number;
    floatAmount: number;
    rotateSpeed: number;
    glowAmount: number;
    shimmerCount: number;
    shimmerSpeed: number;
    shimmerSize: number;
    energyCount: number;
    energySpeed: number;
    energyLayers: number;
    energyLayerSpacing: number;
    energyPulseSpeed: number;
    energyPulseAmount: number;
    iconSize: number;
}

interface PowerUpIcons {
    speed: string;
    ghost: string;
    points: string;
    slow: string;
}

export interface PowerUpConfig {
    crystal: CrystalConfig;
    icons: PowerUpIcons;
    size: number;
    duration: number;
    spawnInterval: number;
    maxActive: number;
    effects: PowerUpEffect[];
    colors: PowerUpColors;
}

export const powerUpConfig: PowerUpConfig = {
    crystal: {
        baseSize: 1.6,      // Size relative to cell size
        floatSpeed: 0.05,   // Speed of floating animation
        floatAmount: 5,     // Pixels to float up/down
        rotateSpeed: 0.02,  // Speed of crystal rotation
        glowAmount: 20,     // Pixel blur for glow effect
        shimmerCount: 5,    // Increased number of shimmer particles
        shimmerSpeed: 0.15, // Increased shimmer rotation speed
        shimmerSize: 5,     // Slightly larger shimmer particles
        energyCount: 12,    // Increased number of energy field particles
        energySpeed: 0.08,  // Increased energy field rotation speed
        energyLayers: 2,    // Number of orbital layers
        energyLayerSpacing: 8, // Pixels between layers
        energyPulseSpeed: 0.03, // Speed of pulsing effect
        energyPulseAmount: 0.2, // Amount of size variation in pulse
        iconSize: 0.8       // Icon size relative to cell size
    },
    icons: {
        speed: '⚡',
        ghost: '👻',
        points: '⭐',
        slow: '🐌'
    },
    size: 20,
    duration: 5000,
    spawnInterval: 10000,
    maxActive: 3,
    effects: [], // This will be populated from game config
    colors: {
        speed: '#FFD700',
        ghost: '#4B0082',
        points: '#00FF00',
        slow: '#FF4500'
    }
};
