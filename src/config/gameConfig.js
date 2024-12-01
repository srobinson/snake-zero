export const gameConfig = {
    // Board presets (all dimensions must be divisible by default grid size)
    boardPresets: {
        small: {
            width: 400,
            height: 300,
            gridSize: 20,
            cols: 20,    // 400/20
            rows: 15,    // 300/20
        },
        medium: {
            width: 800,
            height: 600,
            gridSize: 20,
            cols: 40,    // 800/20
            rows: 30,    // 600/20
        },
        large: {
            width: 1200,
            height: 900,
            gridSize: 20,
            cols: 60,    // 1200/20
            rows: 45,    // 900/20
        },
    },

    // Active board configuration (defaults to medium)
    board: {
        preset: 'medium',  // 'small', 'medium', or 'large'
        custom: null,  // Only used for fullscreen or custom sizes
    },
    
    // Canvas settings
    canvas: {
        frameRate: 60,
        background: [0, 0, 0],  // Black background
    },
    
    // Snake settings
    snake: {
        initialLength: 3,
        baseSpeed: 8,  // Base moves per second
        initialPosition: { x: 5, y: 5 },
        initialDirection: 'right',
        growthRate: 1,  // Segments to add when eating food
        colors: {
            head: {
                normal: [50, 205, 50],     // Lime green
                ghost: [147, 112, 219, 200], // Semi-transparent purple
                speed: [255, 165, 0],      // Orange
                slow: [0, 191, 255],       // Sky blue
            },
            body: {
                normal: [34, 139, 34],     // Forest green
                ghost: [147, 112, 219, 150], // More transparent purple
            },
        },
        speedMultipliers: {
            speed: 1.5,  // Speed power-up multiplier
            slow: 0.5,   // Slow power-up multiplier
        },
        effects: {
            initialState: {
                speed: false,
                slow: false,
                ghost: false,
                double: false
            },
            duration: 5000,  // 5 seconds for all effects
        },
        turnRestriction: {
            prevent180: true,  // Prevent 180-degree turns
        },
        movement: {
            interpolation: true,  // Enable smooth movement
            interpolationSteps: 5,  // Number of steps for smooth movement
        },
    },
    
    // Food settings
    food: {
        color: [255, 50, 50],  // Red
        padding: 2,  // Padding from cell edge
        animation: {
            pulseSpeed: 0.1,
            pulseRange: [0.8, 1.2],  // Scale range for pulsing
        },
    },
    
    // Power-up settings
    powerUps: {
        spawnChance: 0.3,  // 30% chance to spawn after eating food
        duration: 5000,    // 5 seconds duration
        colors: {
            speed: [255, 165, 0],    // Orange
            slow: [0, 191, 255],     // Deep Sky Blue
            ghost: [147, 112, 219],  // Medium Purple
            double: [255, 215, 0],   // Gold
        },
        types: ['speed', 'slow', 'ghost', 'double'],
        visual: {
            pulseSpeed: 0.1,
            baseAlpha: 200,
            pulseAlpha: 55,
            starPoints: 10,
            outerRadius: 0.4,  // Relative to cell size
            innerRadius: 0.16,  // Relative to cell size
        },
        indicators: {
            type: 'radial',  // 'radial' or 'bar'
            position: 'top',  // Position of duration indicator
        },
    },
    
    // Scoring settings
    scoring: {
        basePoints: 10,     // Points for normal food
        doublePoints: 20,   // Points with double power-up
        combo: {
            multipliers: [1, 1.5, 2, 3, 4, 6, 8],  // Up to 8x
            timeoutMs: 3000,  // Time to maintain combo
            visual: {
                position: { x: 20, y: 50 },
                color: [255, 215, 0],  // Gold
                size: 24,
            },
        },
    },

    // Controls settings
    controls: {
        up: ['ArrowUp', 'w', 'W'],
        down: ['ArrowDown', 's', 'S'],
        left: ['ArrowLeft', 'a', 'A'],
        right: ['ArrowRight', 'd', 'D'],
        pause: ['p', 'P', 'Escape'],
        touch: {
            enabled: true,
            sensitivity: 50,  // Minimum swipe distance
        },
    },

    // Difficulty settings
    difficulty: {
        current: 'normal',
        levels: {
            easy: {
                snakeSpeed: 6,
                powerUpChance: 0.4,
                comboTimeout: 4000,
            },
            normal: {
                snakeSpeed: 8,
                powerUpChance: 0.3,
                comboTimeout: 3000,
            },
            hard: {
                snakeSpeed: 10,
                powerUpChance: 0.2,
                comboTimeout: 2000,
            },
        },
    },

    // Achievement settings
    achievements: {
        speedDemon: {
            name: 'Speed Demon',
            description: 'Reach max speed',
            requirement: 'maxSpeed',
        },
        comboMaster: {
            name: 'Combo Master',
            description: 'Achieve 8x multiplier',
            requirement: 'combo8x',
        },
        ghostRider: {
            name: 'Ghost Rider',
            description: 'Collect 3 ghost power-ups',
            requirement: 'ghost3',
        },
        snakeCharmer: {
            name: 'Snake Charmer',
            description: 'Reach length 30',
            requirement: 'length30',
        },
    },

    // Visual effects settings
    effects: {
        particles: {
            enabled: true,
            food: {
                count: 10,
                speed: 2,
                size: 3,
                lifetime: 500,
            },
            powerUp: {
                count: 20,
                speed: 3,
                size: 4,
                lifetime: 800,
            },
        },
        grid: {
            color: [50, 50, 50],  // Dark gray
            weight: 1,
        },
    },

    // Sound settings
    sound: {
        enabled: true,
        volume: 0.7,
        effects: {
            move: true,
            eat: true,
            powerUp: true,
            gameOver: true,
        },
        music: {
            enabled: true,
            volume: 0.5,
        },
    },
};
