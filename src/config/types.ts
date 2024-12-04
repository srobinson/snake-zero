// =========================================
// Core Types
// =========================================
export type BoardPreset = 'small' | 'medium' | 'large' | 'fullscreen';

/**
 * Main game data structure containing configuration and grid
 */
export interface GameData {
    /** Game configuration settings */
    config: GameConfig;
    /** Grid-related functionality */
    grid?: {
        /** Method to update grid dimensions */
        updateDimensions?: () => void;
    };
}

// =========================================
// Window Types
// =========================================
/**
 * Extend the global Window interface to include game data
 */
declare global {
    interface Window {
        /** Global game instance */
        game?: GameData;
    }
}

/**
 * Custom window type with game data
 */
export type CustomWindow = Window & {
    /** Global game instance */
    game?: GameData;
};

// =========================================
// Validation Types
// =========================================
/**
 * Result of a configuration validation
 */
export interface ValidationResult {
    /** Whether the validation passed */
    valid: boolean;
    /** List of error messages */
    errors: string[];
    /** List of warning messages */
    warnings: string[];
    /** Additional validation details */
    details: object;
}

/**
 * Single validation rule for configuration
 */
export interface ValidationRule {
    /** Function to validate a value */
    validate: (value: unknown) => boolean;
    /** Error message when validation fails */
    message: string;
    /** Whether this rule is required */
    required: boolean;
}

/**
 * Collection of validation rules
 */
export interface ValidationRules {
    /** Map of property names to validation rules */
    [key: string]: ValidationRule | ValidationRules;
}

// =========================================
// Game Configuration Types
// =========================================
/**
 * Main game configuration
 */
export interface GameConfig {
    /** Debug settings */
    debug: DebugConfig;
    /** Board configuration */
    board: BoardConfig;
    /** Difficulty settings */
    difficulty: DifficultyConfig;
    /** Snake configuration */
    snake: SnakeConfig;
    /** Power-ups settings */
    powerUps: PowerUpsConfig;
    /** Food configuration */
    food: FoodConfig;
    /** Optional scoring settings */
    scoring?: ScoringConfig;
    /** Optional power-up badge settings */
    powerupBadges?: PowerupBadgesConfig;
}

// =========================================
// Board Configuration
// =========================================
/**
 * Configuration for the game board
 */
export interface BoardConfig {
    /** Currently selected board preset */
    preset: BoardPreset;
    /** Available board presets */
    presets: {
        [key: string]: {
            width: number;
            height: number;
            cellSize: number;
        };
    };
    /** Width of the board in cells */
    width: number;
    /** Height of the board in cells */
    height: number;
    /** Size of each cell in pixels */
    cellSize: number;
    /** Background color of the board */
    backgroundColor: string;
    /** Grid line color */
    gridColor: string;
    /** Whether to show grid lines */
    showGrid: boolean;
    /** Grid line thickness */
    gridThickness: number;
    /** Grid line opacity */
    gridOpacity: number;
}

// =========================================
// Debug Configuration
// =========================================
/**
 * Configuration for debug features
 */
export interface DebugConfig {
    /** Whether debug mode is enabled */
    enabled: boolean;
    /** Show FPS counter */
    showFPS: boolean;
    /** Show snake information */
    showSnakeInfo: boolean;
    /** Show grid information */
    showGridInfo: boolean;
    /** Show visual effects information */
    showEffects: boolean;
    /** Show control information */
    showControls: boolean;
    /** Show direction vectors */
    showVectors: boolean;
    /** Position of debug panel */
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    /** Background color of debug panel */
    backgroundColor: string;
    /** Text color in debug panel */
    textColor: string;
    /** Font size in debug panel */
    fontSize: number;
    /** Padding around debug panel */
    padding: number;
    /** Key to toggle debug panel */
    shortcutKey: string[];
    /** Debug control bindings */
    controls: DebugControls;
    /** Vector visualization settings */
    vectors: DebugVectors;
}

/**
 * Debug control key bindings
 */
export interface DebugControls {
    /** Power-up spawn controls */
    spawn: {
        /** Key to spawn speed power-up */
        speed: string;
        /** Key to spawn ghost power-up */
        ghost: string;
        /** Key to spawn points power-up */
        points: string;
        /** Key to spawn slow power-up */
        slow: string;
    };
    /** Snake controls */
    snake: {
        /** Key to grow snake */
        grow: string;
    };
    /** Board size controls */
    board: {
        /** Key for small board */
        small: string;
        /** Key for medium board */
        medium: string;
        /** Key for large board */
        large: string;
        /** Key for fullscreen board */
        fullscreen: string;
    };
    /** Grid controls */
    grid: {
        /** Key to increase cell size */
        increaseCellSize: string;
        /** Key to decrease cell size */
        decreaseCellSize: string;
    };
}

/**
 * Debug vector visualization settings
 */
export interface DebugVectors {
    /** Color of vector lines */
    color: string;
    /** Thickness of vector lines */
    thickness: number;
    /** Length of vector arrow heads */
    headLength: number;
    /** Opacity of vectors */
    opacity: number;
    /** Scale factor for vectors */
    scale: number;
}

// =========================================
// Snake Configuration
// =========================================
/**
 * Configuration for snake behavior and appearance
 */
export interface SnakeConfig {
    /** Initial length of the snake */
    initialLength: number;
    /** Initial direction of movement */
    initialDirection: 'right';
    /** Base movement speed */
    baseSpeed: number;
    /** Speed progression settings */
    speedProgression: SpeedProgression;
    /** Segment appearance settings */
    segments: SnakeSegments;
    /** Visual effect settings */
    effects: SnakeEffects;
    /** Color settings */
    colors: SnakeColors;
    /** Control settings */
    controls: SnakeControls;
}

/**
 * Snake segment appearance configuration
 */
export interface SnakeSegments {
    /** Size of regular segments */
    size: number;
    /** Size of the head segment */
    headSize: number;
    /** Length of the head segment */
    headLength: number;
    /** Elevation effect height */
    elevation: number;
    /** Corner rounding radius */
    cornerRadius: number;
    /** Size of snake eyes */
    eyeSize: number;
    /** Size of snake pupils */
    pupilSize: number;
    /** Length of snake tongue */
    tongueLength: number;
    /** Width of snake tongue */
    tongueWidth: number;
    /** Speed of tongue animation */
    tongueSpeed: number;
    /** Range of tongue movement */
    tongueWagRange: number;
}

/**
 * Snake visual effects configuration
 */
export interface SnakeEffects {
    /** Speed effect settings */
    speed: {
        /** Length of speed lines */
        lineLength: number;
        /** Opacity of speed lines */
        lineOpacity: number;
        /** Width of speed lines */
        lineWidth: number;
    };
    /** Ghost effect settings */
    ghost: {
        /** Overall opacity when ghosted */
        opacity: number;
        /** Radius of glow effect */
        glowRadius: number;
        /** Color of glow effect */
        glowColor: string;
    };
    /** Points effect settings */
    points: {
        /** Chance of sparkle appearing */
        sparkleChance: number;
        /** Size of sparkle particles */
        sparkleSize: number;
        /** Opacity of sparkles */
        sparkleOpacity: number;
    };
    /** Slow effect settings */
    slow: {
        /** Amplitude of wave effect */
        waveAmplitude: number;
        /** Frequency of wave effect */
        waveFrequency: number;
        /** Speed of wave animation */
        waveSpeed: number;
    };
}

/**
 * Snake color configuration
 */
export interface SnakeColors {
    /** Color of snake head */
    head: string;
    /** Color of snake body */
    body: string;
    /** Highlight color for effects */
    highlight: string;
    /** Shadow color for depth */
    shadow: string;
    /** Glow effect color */
    glow: string;
    /** Color of snake eyes */
    eyes: string;
    /** Color of snake pupils */
    pupil: string;
    /** Color of snake tongue */
    tongue: string;
}

/**
 * Snake control configuration
 */
export interface SnakeControls {
    /** Keys for moving up */
    up: string[];
    /** Keys for moving down */
    down: string[];
    /** Keys for moving left */
    left: string[];
    /** Keys for moving right */
    right: string[];
}

/**
 * Snake speed progression settings
 */
export interface SpeedProgression {
    /** Whether speed increases over time */
    enabled: boolean;
    /** Speed increase per food eaten */
    increasePerFood: number;
    /** Maximum possible speed */
    maxSpeed: number;
    /** Initial speed boost amount */
    initialSpeedBoost: number;
    /** Speed reduction from slow effect */
    slowEffect: number;
}

// =========================================
// Power-up Types and Configuration
// =========================================
/**
 * Available power-up types
 */
export type PowerUpType = 'speed' | 'ghost' | 'points' | 'slow';

/**
 * Power-ups configuration
 */
export interface PowerUpsConfig {
    /** Available power-up types */
    types: PowerUpType[];
    /** Chance of power-up spawning */
    spawnChance: number;
    /** Effect settings for each power-up type */
    effects: {
        [key: string]: any;
    };
    /** Color settings for power-ups */
    colors: PowerUpColors;
    /** Visual effect settings */
    visual?: PowerUpVisual;
}

/**
 * Power-up color configuration
 */
export interface PowerUpColors {
    /** Color for points power-up */
    points: string;
    /** Color for slow power-up */
    slow: string;
    /** Color for speed power-up */
    speed: string;
    /** Color for ghost power-up */
    ghost: string;
    /** Optional visual effect color */
    visual?: string;
}

/**
 * Power-up visual effects configuration
 */
export interface PowerUpVisual {
    /** Base size of power-up */
    baseSize: number;
    /** Speed of floating animation */
    floatSpeed: number;
    /** Amount of floating movement */
    floatAmount: number;
    /** Speed of rotation */
    rotateSpeed: number;
    /** Intensity of glow effect */
    glowAmount: number;
    /** Number of shimmer particles */
    shimmerCount: number;
    /** Speed of shimmer animation */
    shimmerSpeed: number;
    /** Size of shimmer particles */
    shimmerSize: number;
    /** Number of energy particles */
    energyCount: number;
    /** Speed of energy animation */
    energySpeed: number;
    /** Size of power-up icon */
    iconSize: number;
}

// =========================================
// Food Configuration
// =========================================
/**
 * Configuration for food items
 */
export interface FoodConfig {
    /** Types of food available */
    types: Array<'regular' | 'bonus' | 'golden'>;
    /** Spawn rates for each food type */
    spawnRates: FoodRates;
    /** Point values for each food type */
    points: FoodRates;
    /** Color settings for each food type */
    colors: FoodColors;
    /** Visual effect settings for food */
    effects: FoodEffects;
}

/**
 * Food spawn and point rates
 */
export interface FoodRates {
    /** Rate for regular food */
    regular: number;
    /** Rate for bonus food */
    bonus: number;
    /** Rate for golden food */
    golden: number;
}

/**
 * Food color settings
 */
export interface FoodColors {
    /** Colors for regular food */
    regular: FoodColorSet;
    /** Colors for bonus food */
    bonus: FoodColorSet;
    /** Colors for golden food */
    golden: FoodColorSet;
}

/**
 * Food color set
 */
export interface FoodColorSet {
    /** Primary color */
    primary: string;
    /** Secondary color */
    secondary: string;
    /** Highlight color */
    highlight: string;
}

/**
 * Food visual effects
 */
export interface FoodEffects {
    /** Speed of bouncing effect */
    bounceSpeed: FoodRates;
    /** Speed of sparkling effect */
    sparkleSpeed: FoodRates;
    /** Size of pixel effect */
    pixelSize: FoodRates;
    /** Weight of outline effect */
    outlineWeight: FoodRates;
    /** Intensity of glow effect */
    glow: FoodRates;
}

// =========================================
// Difficulty Configuration
// =========================================
/**
 * Configuration for game difficulty
 */
export interface DifficultyConfig {
    /** Current difficulty level */
    current: 'easy' | 'normal' | 'hard';
    /** Preset difficulty levels */
    presets: Record<string, DifficultyPreset>;
}

/**
 * Preset difficulty level
 */
export interface DifficultyPreset {
    /** Base movement speed */
    baseSpeed: number;
    /** Chance of power-up spawning */
    powerUpChance: number;
}

// =========================================
// Scoring Configuration
// =========================================
/**
 * Configuration for scoring system
 */
export interface ScoringConfig {
    /** Base points for each food item */
    basePoints: number;
    /** Multiplier increase per level */
    multiplierIncrease: number;
    /** Multiplier rules for scoring */
    multiplierRules: [
        { threshold: number; multiplier: number },
        { threshold: number; multiplier: number },
        { threshold: number; multiplier: number }
    ];
    /** Bonus conditions for scoring */
    bonusConditions: [
        { type: string; bonus: number },
        { type: string; bonus: number },
        { type: string; bonus: number }
    ];
}

// =========================================
// Power-up Badges Configuration
// =========================================
/**
 * Configuration for power-up badges
 */
export interface PowerupBadgesConfig {
    /** Duration of badge display */
    duration: number;
    /** Duration of pop-in animation */
    popInDuration: number;
    /** Scale factor for pop-in animation */
    popInScale: number;
    /** Spacing between badges */
    spacing: number;
    /** Size of badges */
    size: number;
    /** Size of floating badges */
    floatingSize: number;
    /** Amplitude of hover animation */
    hoverAmplitude: number;
    /** Frequency of hover animation */
    hoverFrequency: number;
    /** Duration of fade-out animation */
    fadeOutDuration: number;
    /** Offset of badges on Y-axis */
    offsetY: number;
}

// =========================================
// Visual Effects Types
// =========================================
/**
 * Configuration for particle effects
 */
export interface ParticleConfig {
    /** Number of particles */
    count: number;
    /** Speed of particles */
    speed: number;
    /** Size range of particles */
    size: {
        min: number;
        max: number;
    };
    /** Lifetime range of particles */
    lifetime?: {
        min: number;
        max: number;
    };
    /** Colors of particles */
    colors?: string[];
    /** Color of particles */
    color?: string;
    /** Whether particles leave a trail */
    trail?: boolean;
    /** Whether particles have a glow effect */
    glow?: boolean;
    /** Whether particles sparkle */
    sparkle?: boolean;
    /** Whether particles pulse */
    pulse?: boolean;
    /** Whether particles have a rainbow effect */
    rainbow?: boolean;
}

/**
 * Configuration for trail effects
 */
export interface TrailConfig {
    /** Whether trail is enabled */
    enabled: boolean;
    /** Length of trail */
    length: number;
    /** Decay rate of trail */
    decay: number;
}

/**
 * Configuration for effects
 */
export interface EffectConfig {
    /** Duration of effect */
    duration?: number;
    /** Number of particles in effect */
    particleCount: number;
    /** Base speed of particles */
    baseSpeed: number;
    /** Variation in particle speed */
    speedVariation: number;
    /** Spread angle of particles */
    spreadAngle: number;
    /** Gravity applied to particles */
    gravity: number;
    /** Rate of particle fade-out */
    fadeRate: number;
    /** Size range of particles */
    sizeRange: [number, number];
    /** Rotation speed of particles */
    rotationSpeed: number;
    /** Whether particles sparkle */
    sparkle: boolean;
    /** Colors of particles */
    colors: string[];
    /** Trail configuration */
    trail?: TrailConfig;
    /** Interval between particle emissions */
    emitInterval?: number;
}

/**
 * Configuration for all effects
 */
export interface EffectsConfig {
    /** Particle effects for food */
    particles: {
        food: ParticleConfig;
        powerUps: {
            [key: string]: EffectConfig;
        };
        activeEffects: {
            [key: string]: EffectConfig;
        };
    };
}
