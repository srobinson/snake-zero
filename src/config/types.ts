// src/config/types.ts

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

/** Game event types */
// export type GameEvent =
// 	| 'food_collected'
// 	| 'power_up_collected'
// 	| 'power_up_expired'
// 	| 'collision'
// 	| 'score_changed'
// 	| 'state_changed'
// 	| 'speed_changed';

/** Event data structure for different event types */
// export interface EventData {
// 	/** New score value for SCORE_CHANGED event */
// 	score?: number;
// 	/** New game state for STATE_CHANGED event */
// 	state?: any;
// 	/** New speed value for SPEED_CHANGED event */
// 	speed?: number;
// 	/** Type of power-up for POWER_UP_COLLECTED/EXPIRED events */
// 	powerUpType?: string;
// 	/** Position data for collision/collection events */
// 	position?: {
// 		x: number;
// 		y: number;
// 	};
// 	/** Points value for FOOD_COLLECTED event */
// 	points: number;
// 	/** Points multiplier for FOOD_COLLECTED event */
// 	multiplier: number;

// 	foodType: FoodType;
// }

export type GameEvent =
	| 'food_collected'
	| 'power_up_collected'
	| 'power_up_expired'
	| 'collision'
	| 'score_changed'
	| 'state_changed'
	| 'speed_changed';

// Event-specific data interfaces
export interface FoodCollectedEventData {
	position: Position;
	points: number;
	multiplier: number;
	foodType: FoodType;
}

export interface PowerUpCollectedEventData {
	powerUpType: string;
	position: Position;
}

export interface PowerUpExpiredEventData {
	powerUpType: string;
}

export interface CollisionEventData {
	position: Position;
}

export interface ScoreChangedEventData {
	score: number;
}

export interface StateChangedEventData {
	state: any; // Could refine to GameState if imported
	score?: number;
	highScore?: number;
	playTime?: number;
}

export interface SpeedChangedEventData {
	speed: number;
}

// Map events to their data types
export type EventDataMap = {
	food_collected: FoodCollectedEventData;
	power_up_collected: PowerUpCollectedEventData;
	power_up_expired: PowerUpExpiredEventData;
	collision: CollisionEventData;
	score_changed: ScoreChangedEventData;
	state_changed: StateChangedEventData;
	speed_changed: SpeedChangedEventData;
};

// Union type for all event data (for flexibility if needed)
export type EventData = EventDataMap[GameEvent];

// Type for event callbacks, parameterized by event type
export type EventCallback<T extends GameEvent = GameEvent> = (data: EventDataMap[T]) => void;

/** Game events that can be emitted */
export const GameEvents = {
	/** Emitted when food is collected by the snake */
	FOOD_COLLECTED: 'food_collected',
	/** Emitted when a power-up is collected by the snake */
	POWER_UP_COLLECTED: 'power_up_collected',
	/** Emitted when a power-up effect expires */
	POWER_UP_EXPIRED: 'power_up_expired',
	/** Emitted when a collision occurs */
	COLLISION: 'collision',
	/** Emitted when the score changes */
	SCORE_CHANGED: 'score_changed',
	/** Emitted when the game state changes */
	STATE_CHANGED: 'state_changed',
	/** Emitted when the snake's speed changes */
	SPEED_CHANGED: 'speed_changed',
} as const;

/** Type for the event callback function */
// export type EventCallback = (data: EventData) => void;

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
	powerUps: PowerUpConfig;
	/** Food configuration */
	food: FoodConfig;
	/** Optional scoring settings */
	scoring?: ScoringConfig;
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

export interface GridInterface {
	getCellSize(): number;
	getRandomPosition(avoidLast: boolean): Position;
	getCellCenter(cell: Position): Position;
	getWidth(): number;
	getHeight(): number;
}

/**
 * Represents a 2D position
 */
export interface Position {
	x: number;
	y: number;
}

/**
 * Represents grid size with dimensions in cells and pixels
 */
export interface GridSize {
	width: number;
	height: number;
	pixelWidth: number;
	pixelHeight: number;
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
	/** Food controls */
	food: {
		regular: string;
		bonus: string;
		golden: string;
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
		/** Number of afterimages */
		trailLength: number;
		/** Opacity of afterimages */
		trailOpacity: number;
		/** Number of ghost particles per segment */
		particleCount: number;
		/** Size of ghost particles */
		particleSize: number;
		/** Color for the spectral effect */
		spectralColor: string;
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
	colors: {
		[key: string]: FoodColorSet;
	};
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
// export interface FoodColors1 {
// 	/** Colors for regular food */
// 	regular: FoodColorSet;
// 	/** Colors for bonus food */
// 	bonus: FoodColorSet;
// 	/** Colors for golden food */
// 	golden: FoodColorSet;
// }

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
// Food Types
// =========================================
/**
 * Type of food that can appear in the game:
 * - regular: Basic food that increases score and length
 * - bonus: Special food with higher points and effects
 * - golden: Rare food with maximum points and special effects
 */
export type FoodType = 'regular' | 'bonus' | 'golden';

/**
 * Color scheme for food items
 */
export interface FoodColors {
	/** Main color of the food item */
	primary: string;
	/** Secondary color for patterns and effects */
	secondary: string;
	/** Highlight color for glow and particles */
	highlight: string;
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
		{ threshold: number; multiplier: number },
	];
	/** Bonus conditions for scoring */
	bonusConditions: [
		{ type: string; bonus: number },
		{ type: string; bonus: number },
		{ type: string; bonus: number },
	];
}

// =========================================
// Visual Effects Types
// =========================================

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
	trail: TrailConfig;
	/** Interval between particle emissions */
	emitInterval?: number;
}

/**
 * Configuration for all effects
 */
export interface EffectsConfig {
	/** Particle effects for food */
	particles: {
		food: Record<FoodType, ParticleConfig>;
		powerUps: {
			[key: string]: EffectConfig;
		};
		activeEffects: {
			[key: string]: EffectConfig;
		};
	};
}

// =========================================
// Consolidated Configuration Types
// =========================================

// =========================================
// Snake Configuration Types
// =========================================
/**
 * Configuration for snake segments appearance
 */
export interface SnakeSegmentConfig {
	/** Size of each segment */
	size: number;
	/** Space between segments */
	spacing: number;
	/** Radius for rounded corners */
	cornerRadius: number;
}

// =========================================
// Power-up Types and Configuration
// =========================================
/**
 * Available power-up types
 */
export type PowerUpType = 'speed' | 'ghost' | 'points' | 'slow';

// /**
//  * Power-ups configuration
//  */
// export interface PowerUpsConfig {
// 	/** Available power-up types */
// 	types: PowerUpType[];
// 	/** Chance of power-up spawning */
// 	spawnChance: number;
// 	/** Effect settings for each power-up type */
// 	effects: {
// 		[key: string]: any;
// 	};
// 	/** Color settings for power-ups */
// 	colors: PowerUpColors;
// 	/** Visual effect settings */
// 	visual?: PowerUpVisual;
// }

/**
 * Power-up color configuration
 */
// export interface PowerUpColors {
// 	/** Color for points power-up */
// 	points: string;
// 	/** Color for slow power-up */
// 	slow: string;
// 	/** Color for speed power-up */
// 	speed: string;
// 	/** Color for ghost power-up */
// 	ghost: string;
// 	/** Optional visual effect color */
// 	visual?: string;
// }

// Base configuration for all power-ups
export interface BasePowerUpConfig {
	/** Color settings for power-ups */
	colors: {
		[key in PowerUpType]: string;
	};

	types: PowerUpType[];
}

/**
 * Configuration for power-up visual effects
 */
export interface PowerUpConfig extends BasePowerUpConfig {
	/** Chance of power-up spawning */
	spawnChance: number;
	badges: PowerUpBadgesConfig;

	// /** Effect settings for each power-up type */
	effects: {
		speed: {
			multiplier: number;
			boost: number;
			duration: number;
		};
		ghost: {
			multiplier: number;
			boost: number;
			duration: number;
		};
		points: {
			multiplier: number;
			boost: number;
			duration: number;
		};
		slow: {
			multiplier: number;
			boost: number;
			duration: number;
		};
	};
	spawnRates?: {
		speed: number;
		ghost: number;
		points: number;
		slow: number;
	};
	/** Visual effect settings */
	visual: PowerUpVisual;
	icons: {
		speed: string;
		ghost: string;
		points: string;
		slow: string;
	};
}

// export interface PowerUpBadgeConfig extends BasePowerUpConfig {}

/**
 * Configuration for power-up badges
 */
// export interface BadgeConfig {
// 	size: number;
// 	duration: number;
// 	popInDuration: number;
// 	popInScale: number;
// 	hoverFrequency: number;
// 	hoverAmplitude: number;
// 	spacing: number;
// 	floatingSize: number;
// }

// =========================================
// Power-up Badges Configuration
// =========================================
/**
 * Configuration for power-up badges
 */
export interface PowerUpBadgesConfig {
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
// Particle Configuration Types
// =========================================
/**
 * Exhaustive list of possible particle types
 */
export type ParticleType =
	| 'normal' // Standard particle effect
	| 'score' // Text-based score particle
	| 'powerup' // Power-up collection particle
	| 'orbit' // Orbiting particle effect
	| 'trail' // Particle trail effect
	| 'active' // Active effect particle
	| 'sparkle'; // Decorative sparkle particle

/**
 * Configuration for score-based particles
 */
export interface ScoreParticleConfig extends BaseParticleConfig {
	type: 'score';
}

/**
 * Configuration for power-up and orbiting particles
 */
export interface PowerUpParticleConfig extends BaseParticleConfig {
	type: 'powerup' | 'orbit';
}

/**
 * Configuration for active effect particles
 */
export interface ActiveEffectParticleConfig extends BaseParticleConfig {
	type: 'active';
}

/**
 * Union type of all possible particle configurations
 */
export type ParticleConfigType =
	| BaseParticleConfig
	| ScoreParticleConfig
	| PowerUpParticleConfig
	| ActiveEffectParticleConfig;

/**
 * Base configuration for all particle types
 */
export interface BaseParticleConfig {
	/** Type of particle */
	type: ParticleType;

	/** Base speed of the particle */
	speed: number | { min: number; max: number };

	/** Size range of the particle */
	size: {
		min: number;
		max: number;
	};

	/** Lifetime range of the particle */
	lifetime?: {
		min: number;
		max: number;
	};

	/** Color palette for the particle */
	colors: string[];

	/** Optional trail configuration */
	trail?: {
		enabled: boolean;
		length?: number;
		decay?: number;
	};

	/** Visual effect toggles */
	glow?: boolean;
	sparkle?: boolean;
	pulse?: boolean;
	gravity?: number;
	rainbow?: boolean;

	// Additional properties to match Particle.ts usage
	score?: number;
	text?: string;
	font?: string;
	fontSize?: number;
	initialAngle?: number;
	spiral?: boolean;
	orbit?: {
		enabled: boolean;
		radius?: number;
		speed?: number;
	};
}

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
	lifetime: {
		min: number;
		max: number;
	};
	/** Colors of particles */
	colors: string[];
	/** Color of particles */
	color?: string;
	/** Whether particles leave a trail */
	trail?: {
		enabled: boolean;
		length: number;
		decay: number;
	};
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
 * Configuration for score-based particles
 */
export interface ScoreParticleConfig extends BaseParticleConfig {
	type: 'score';

	/** Actual score value */
	score?: number;

	/** Text to display */
	text?: string;

	/** Font for text particle */
	font?: string;

	/** Font size for text particle */
	fontSize?: number;
}

/**
 * Configuration for power-up and orbiting particles
 */
export interface PowerUpParticleConfig extends BaseParticleConfig {
	type: 'powerup' | 'orbit';

	/** Orbital motion configuration */
	orbit?: {
		enabled: boolean;
		radius?: number;
		speed?: number;
	};

	/** Initial angle of particle emission */
	initialAngle?: number;
}

/**
 * Configuration for active effect particles
 */
export interface ActiveEffectParticleConfig extends BaseParticleConfig {
	type: 'active';

	/** Emission interval for continuous effects */
	emitInterval?: number;

	/** Spread angle for particle emission */
	spreadAngle?: number;

	/** Gravity effect on particles */
	gravity?: number;

	/** Rotation speed of particles */
	rotationSpeed?: number;

	/** Initial angle of particle emission */
	initialAngle?: number;
}
