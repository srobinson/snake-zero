/**
 * Configuration for visual effects and animations
 */
export const effectsConfig = {
    particles: {
        food: {
            count: 15,
            speed: 5,
            size: { min: 0.2, max: 0.35 },
            lifetime: { min: 800, max: 1200 },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#FF4500'],
            trail: true,
            glow: true,
            sparkle: true
        },
        powerUps: {
            speed: {
                count: 35,
                speed: 10,
                size: { min: 0.15, max: 0.3 },
                lifetime: { min: 1000, max: 1500 },
                colors: ['#00FF00', '#32CD32', '#98FB98', '#7FFF00'],
                trail: true,
                sparkle: true,
                explosion: true,
                glow: true
            },
            ghost: {
                count: 40,
                speed: 3,
                size: { min: 0.25, max: 0.4 },
                lifetime: { min: 1500, max: 2000 },
                colors: ['#E6E6FA', '#9370DB', '#8A2BE2', '#4B0082'],
                trail: true,
                glow: true,
                explosion: false,
                sparkle: true
            },
            points: {
                count: 30,
                speed: 8,
                size: { min: 0.2, max: 0.35 },
                lifetime: { min: 1200, max: 1800 },
                colors: ['#FFD700', '#FFA500', '#FF4500', '#DAA520'],
                trail: true,
                sparkle: true,
                glow: true,
                explosion: true
            },
            slow: {
                count: 35,
                speed: 2.5,
                size: { min: 0.25, max: 0.4 },
                lifetime: { min: 1800, max: 2400 },
                colors: ['#87CEEB', '#00BFFF', '#1E90FF', '#4169E1'],
                trail: true,
                glow: true,
                explosion: false,
                sparkle: true
            }
        },
        activeEffects: {
            speed: {
                count: 8,
                speed: 4,
                size: { min: 0.15, max: 0.25 },
                lifetime: { min: 600, max: 800 },
                colors: ['#00FF00', '#32CD32', '#7FFF00', '#98FB98'],
                trail: true,
                sparkle: true,
                glow: true,
                interval: 60
            },
            ghost: {
                count: 12,
                speed: 2,
                size: { min: 0.2, max: 0.35 },
                lifetime: { min: 800, max: 1000 },
                colors: ['#E6E6FA', '#9370DB', '#8A2BE2', '#4B0082'],
                glow: true,
                sparkle: true,
                trail: true,
                interval: 80
            },
            points: {
                count: 6,
                speed: 3,
                size: { min: 0.15, max: 0.25 },
                lifetime: { min: 500, max: 700 },
                colors: ['#FFD700', '#FFA500', '#DAA520', '#FF4500'],
                sparkle: true,
                glow: true,
                trail: true,
                interval: 100
            },
            slow: {
                count: 15,
                speed: 1.5,
                size: { min: 0.2, max: 0.3 },
                lifetime: { min: 1000, max: 1400 },
                colors: ['#87CEEB', '#00BFFF', '#4169E1', '#1E90FF'],
                trail: true,
                glow: true,
                sparkle: true,
                interval: 120
            }
        }
    }
};
