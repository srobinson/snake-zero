import { deepMerge } from './configValidator';
import { applyDataAttributes } from './dataAttributeParser';
import { GameConfig, GameData } from './types';

// Add BoardConfig type
export type BoardConfig = 'small' | 'medium' | 'large' | 'fullscreen';

// Default configuration
export const defaultConfig: GameConfig = {
	debug: {
		enabled: true,
		showFPS: true,
		showSnakeInfo: true,
		showGridInfo: true,
		showEffects: true,
		showControls: true,
		showVectors: false,
		position: 'top-right',
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		textColor: '#ffffff',
		fontSize: 14,
		padding: 10,
		shortcutKey: ['`'],
		controls: {
			spawn: {
				speed: '1',
				ghost: '2',
				points: '3',
				slow: '4',
			},
			snake: {
				grow: 's',
			},
			board: {
				small: 'q',
				medium: 'w',
				large: 'e',
				fullscreen: 'r',
			},
			grid: {
				increaseCellSize: '=',
				decreaseCellSize: '-',
			},
		},
		vectors: {
			color: '#FF5722',
			thickness: 2,
			headLength: 10,
			opacity: 0.8,
			scale: 30,
		},
	},
	board: {
		preset: 'medium',
		presets: {
			small: { width: 400, height: 400, cellSize: 20 },
			medium: { width: 800, height: 600, cellSize: 30 },
			large: { width: 1200, height: 800, cellSize: 50 },
			fullscreen: { width: window.innerWidth, height: window.innerHeight, cellSize: 60 },
		},
		width: 800,
		height: 600,
		cellSize: 20,
		backgroundColor: '#000000',
		gridColor: '#111111',
		showGrid: true,
		gridThickness: 1, // Added gridThickness property
		gridOpacity: 0.5, // Added gridOpacity property
	},
	difficulty: {
		current: 'easy',
		presets: {
			easy: {
				baseSpeed: 5,
				powerUpChance: 0.02,
			},
			normal: {
				baseSpeed: 8,
				powerUpChance: 0.01,
			},
			hard: {
				baseSpeed: 12,
				powerUpChance: 0.005,
			},
		},
	},
	snake: {
		initialLength: 3,
		initialDirection: 'right',
		baseSpeed: 8,
		speedProgression: {
			enabled: true,
			increasePerFood: 0.5,
			maxSpeed: 15,
			initialSpeedBoost: 1.5,
			slowEffect: 0.5, // Required by SpeedProgression type
		},
		segments: {
			size: 0.85,
			headSize: 1.2, // Increased for wider head
			headLength: 2, // Set to 2 cells for elongated head
			elevation: 2, // Added elevation for 3D effect
			cornerRadius: 4, // Added corner radius for smoother look
			eyeSize: 4, // Increased from 0 for visible eyes
			pupilSize: 0,
			tongueLength: 0,
			tongueWidth: 0,
			tongueSpeed: 0,
			tongueWagRange: 0,
		},
		effects: {
			speed: {
				lineLength: 0.8, // Relative to cell size
				lineOpacity: 0.5,
				lineWidth: 2,
			},
			ghost: {
				opacity: 0.7,
				glowRadius: 15,
				glowColor: '#4FC3F7', // Light blue color
				trailLength: 3, // Number of afterimages
				trailOpacity: 0.3, // Opacity of afterimages
				particleCount: 2, // Particles per segment
				particleSize: 3, // Size of ghost particles
				spectralColor: '#81D4FA', // Lighter blue for the spectral effect
			},
			points: {
				sparkleChance: 0.2,
				sparkleSize: 0.2, // Relative to cell size
				sparkleOpacity: 0.8,
			},
			slow: {
				waveAmplitude: 0.2, // Relative to cell size
				waveFrequency: 0.1,
				waveSpeed: 0.005,
			},
		},
		colors: {
			head: '#4CAF50', // Green color for the snake
			body: '#4CAF50', // Green color for the snake
			highlight: '#81C784', // Lighter green for highlights
			shadow: '#388E3C', // Darker green for shadows
			glow: 'rgba(76, 175, 80, 0.2)', // Green glow
			eyes: '#FFFFFF', // White eyes
			pupil: '#000000', // Black pupils
			tongue: '#FF0000', // Red tongue
		},
		controls: {
			up: ['ArrowUp', 'w'],
			down: ['ArrowDown', 's'],
			left: ['ArrowLeft', 'a'],
			right: ['ArrowRight', 'd'],
		},
	},
	powerUps: {
		spawnChance: 0.01,
		types: ['speed', 'ghost', 'points', 'slow'],
		spawnRates: {
			speed: 0.4,
			ghost: 0.3,
			points: 0.2,
			slow: 0.1,
		},
		icons: {
			speed: '⚡',
			ghost: '👻',
			points: '⭐',
			slow: '🐌',
		},
		badges: {
			duration: 2000,
			popInDuration: 300,
			popInScale: 1.2,
			spacing: 0.2, // Spacing as percentage of cell size
			size: 1.5, // Size as multiplier of cell size
			floatingSize: 2.0, // Floating badge size as multiplier of cell size
			hoverAmplitude: 0.08,
			hoverFrequency: 3,
			fadeOutDuration: 500,
			offsetY: -50,
		},

		effects: {
			speed: {
				multiplier: 1.0,
				boost: 1.5,
				duration: 15000, // 5 seconds in milliseconds
			},
			ghost: {
				multiplier: 1.0,
				boost: 1,
				duration: 18000, // 8 seconds in milliseconds
			},
			points: {
				multiplier: 1.0,
				boost: 2,
				duration: 110000, // 10 seconds in milliseconds
			},
			slow: {
				multiplier: 0.8,
				boost: 1.5,
				duration: 15000, // 5 seconds in milliseconds
			},
		},
		colors: {
			speed: '#ff0000',
			ghost: '#00ffff',
			points: '#ffff00',
			slow: '#FF5722',
		},
		visual: {
			baseSize: 1.6, // Size relative to cell size (increased from 0.8)
			floatSpeed: 0.05, // Speed of floating animation
			floatAmount: 5, // Pixels to float up/down
			rotateSpeed: 0.02, // Speed of crystal rotation
			glowAmount: 20, // Pixel blur for glow effect
			shimmerCount: 3, // Number of shimmer particles
			shimmerSpeed: 0.1, // Speed of shimmer rotation
			shimmerSize: 4, // Size of shimmer particles
			energyCount: 8, // Number of energy field particles
			energySpeed: 0.05, // Speed of energy field rotation
			iconSize: 0.8, // Icon size relative to cell size (increased from 0.4)
		},
	},
	food: {
		types: ['regular', 'bonus', 'golden'],
		spawnRates: {
			regular: 0.8,
			bonus: 0.15,
			golden: 0.05,
		},
		points: {
			regular: 10,
			bonus: 30,
			golden: 50,
		},
		colors: {
			regular: {
				primary: '#FF2222', // Brighter red
				secondary: '#44FF44', // Brighter green
				highlight: '#FFFFFF', // White highlight
			},
			bonus: {
				primary: '#FF22FF', // Brighter magenta
				secondary: '#44FF44', // Brighter green
				highlight: '#FFFFFF', // White highlight
			},
			golden: {
				primary: '#FFD700', // Pure gold
				secondary: '#FFFF44', // Bright yellow
				highlight: '#FFFFFF', // White highlight
			},
		},
		effects: {
			bounceSpeed: {
				regular: 1000, // ms per bounce cycle
				bonus: 1200,
				golden: 800,
			},
			sparkleSpeed: {
				regular: 0, // no sparkle
				bonus: 800, // ms per sparkle cycle
				golden: 500,
			},
			pixelSize: {
				regular: 0.125, // fraction of cell size
				bonus: 0.125,
				golden: 0.125,
			},
			outlineWeight: {
				regular: 2, // pixels
				bonus: 3,
				golden: 4,
			},
			glow: {
				regular: 10, // glow radius in pixels
				bonus: 15,
				golden: 20,
			},
		},
	},
	scoring: {
		basePoints: 10,
		multiplierIncrease: 0.1,
		multiplierRules: [
			{ threshold: 5, multiplier: 1.5 },
			{ threshold: 10, multiplier: 2.0 },
			{ threshold: 20, multiplier: 3.0 },
		],
		bonusConditions: [
			{ type: 'speed', bonus: 100 },
			{ type: 'noWalls', bonus: 50 },
			{ type: 'perfectRun', bonus: 25 },
		],
	},
};

// Initialize the game object with proper typing
const gameObject: GameData = {
	config: defaultConfig,
	grid: {
		updateDimensions: () => {}, // Default empty function
	},
};

// Initialize window.game if it doesn't exist
window.game = window.game || gameObject;

class ConfigManager {
	private sources: {
		default: GameConfig | null;
		localStorage: GameConfig | null;
		dataAttributes: GameConfig | null;
	};
	private config: Partial<GameConfig>;

	constructor() {
		this.sources = {
			default: null,
			localStorage: null,
			dataAttributes: null,
		};

		this.config = {};

		this.loadDefaultConfig();
		this.loadFromLocalStorage();
		this.loadFromDataAttributes();
		this.mergeConfigurations();
	}

	private loadDefaultConfig(): void {
		this.sources.default = defaultConfig;
	}

	public loadFromLocalStorage(): void {
		const storedConfig = localStorage.getItem('gameConfig');
		if (storedConfig) {
			this.sources.localStorage = JSON.parse(storedConfig);
		}
	}

	private loadFromDataAttributes(): void {
		const container = document.getElementById('snaked-again-container');
		if (!container) return;

		// Use default config as base instead of empty this.config
		const dataConfig = applyDataAttributes(this.sources.default || {}, container);
		if (!dataConfig) return;

		// Store valid data attributes config
		this.sources.dataAttributes = dataConfig as GameConfig;

		// Update grid dimensions immediately if game exists
		if (window.game?.grid?.updateDimensions) {
			window.game.grid.updateDimensions();
		}
	}

	private mergeConfigurations(): void {
		// First merge default with localStorage
		const mergedConfig = deepMerge(this.sources.default, this.sources.localStorage);
		// Then merge with dataAttributes
		this.config = deepMerge(mergedConfig, this.sources.dataAttributes) as GameConfig;
	}

	public reset(): void {
		localStorage.removeItem('gameConfig');
		this.loadDefaultConfig();
		this.mergeConfigurations();
	}

	public savePersistentSettings(configChanges: Partial<GameConfig>): void {
		this.config = { ...this.config, ...configChanges };
		this.saveToLocalStorage();
	}

	public getConfig(): GameConfig {
		return this.config as GameConfig;
	}

	public saveToLocalStorage(): boolean {
		try {
			localStorage.setItem('gameConfig', JSON.stringify(this.config));
			return true;
		} catch (error) {
			console.error('Failed to save configuration to local storage:', error);
			return false;
		}
	}

	public getConfigurationSources(): {
		default: GameConfig | null;
		localStorage: GameConfig | null;
		dataAttributes: GameConfig | null;
	} {
		return this.sources;
	}
}

export default new ConfigManager();
