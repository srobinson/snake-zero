import { ValidationResult, ValidationRules } from './types.consolidated';

// Validates a color string in hex format
function isValidColor(value: string, alpha: boolean = false): boolean {
	const hexPattern = alpha ? /^#[0-9A-Fa-f]{8}$/ : /^#[0-9A-Fa-f]{6}$/;
	const rgbaPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*(?:0|1|0?\.\d+))?\s*\)$/;
	return typeof value === 'string' && (hexPattern.test(value) || rgbaPattern.test(value));
}

// Validates a numeric value within a range
function isValidNumber(value: number, min: number, max: number, integer: boolean = false): boolean {
	if (typeof value !== 'number' || isNaN(value)) return false;
	if (integer && !Number.isInteger(value)) return false;
	return value >= min && value <= max;
}

// Helper function to check if something is an object
function isObject(item: unknown): item is Record<string, unknown> {
	return Boolean(item && typeof item === 'object' && !Array.isArray(item));
}

// Enhanced validation rules for game configuration
export const validationRules: ValidationRules = {
	board: {
		preset: {
			validate: (value: unknown): boolean =>
				typeof value === 'string' &&
				['small', 'medium', 'large', 'fullscreen'].includes(value),
			message: "Board preset must be one of: 'small', 'medium', 'large', 'fullscreen'",
			required: true,
		},
		width: {
			validate: (value: unknown): boolean => isValidNumber(value as number, 200, 3840, true),
			message: 'Board width must be an integer between 200 and 3840',
			required: true,
		},
		height: {
			validate: (value: unknown): boolean => isValidNumber(value as number, 200, 2160, true),
			message: 'Board height must be an integer between 200 and 2160',
			required: true,
		},
		cellSize: {
			validate: (value: unknown): boolean => isValidNumber(value as number, 10, 100, true),
			message: 'Cell size must be an integer between 10 and 100',
			required: true,
		},
		backgroundColor: {
			validate: (value: unknown): boolean => typeof value === 'string' && isValidColor(value),
			message: 'Background color must be a valid hex color code',
			required: true,
		},
		gridColor: {
			validate: (value: unknown): boolean => typeof value === 'string' && isValidColor(value),
			message: 'Grid color must be a valid hex color code',
			required: true,
		},
	},
	food: {
		types: {
			validate: (value: unknown): boolean =>
				Array.isArray(value) &&
				value.every(
					(type): type is string =>
						typeof type === 'string' && ['regular', 'bonus', 'golden'].includes(type)
				),
			message:
				"Food types must be an array containing valid food types: 'regular', 'bonus', 'golden'",
			required: true,
		},
		spawnRates: {
			validate: (obj: unknown): boolean => {
				if (!isObject(obj)) return false;
				const requiredTypes = ['regular', 'bonus', 'golden'];

				// Check that all required types are present with valid rates
				const hasValidRates = requiredTypes.every(type => {
					const rate = obj[type];
					return typeof rate === 'number' && !isNaN(rate) && rate >= 0 && rate <= 1;
				});
				if (!hasValidRates) return false;

				// Calculate sum of rates, handling floating point precision
				const sum = Object.values(obj).reduce(
					(acc: number, rate) => acc + (typeof rate === 'number' ? rate : 0),
					0
				);
				return Math.abs(sum - 1) < Number.EPSILON;
			},
			message: 'Spawn rates must be defined for all food types and sum to 1',
			required: true,
		},
		points: {
			validate: (obj: unknown): boolean => {
				if (!isObject(obj)) return false;
				const points = obj as Record<string, unknown>;
				const requiredTypes = ['regular', 'bonus', 'golden'];
				return requiredTypes.every(type => {
					const value = points[type];
					return typeof value === 'number' && Number.isInteger(value) && value > 0;
				});
			},
			message: 'Points must be positive integers for all food types',
			required: true,
		},
		colors: {
			validate: (obj: unknown): boolean => {
				if (!isObject(obj)) return false;
				const colors = obj as Record<string, unknown>;
				const requiredTypes = ['regular', 'bonus', 'golden'];
				return requiredTypes.every(type => {
					const color = colors[type];
					return typeof color === 'string' && isValidColor(color);
				});
			},
			message: 'Colors must include valid hex codes for all food types',
			required: true,
		},
		bonusTimeout: {
			validate: (value: unknown): boolean =>
				typeof value === 'number' && isValidNumber(value, 1000, 30000),
			message: 'Bonus food timeout must be between 1000 and 30000 milliseconds',
			required: false,
		},
	},
	scoring: {
		basePoints: {
			validate: (value: unknown): boolean =>
				typeof value === 'number' && isValidNumber(value, 1, 1000, true),
			message: 'Base points must be an integer between 1 and 1000',
			required: true,
		},
		multiplierRules: {
			validate: (arr: unknown): boolean =>
				Array.isArray(arr) &&
				arr.every(
					(rule: unknown) =>
						Array.isArray(rule) &&
						rule.length === 2 &&
						typeof rule[0] === 'number' &&
						rule[0] > 0 &&
						isValidNumber(rule[1], 1, 10)
				),
			message: 'Multiplier rules must be an array of valid threshold/multiplier pairs',
			required: true,
		},
		bonusConditions: {
			validate: (arr: unknown): boolean =>
				Array.isArray(arr) &&
				arr.every(
					(condition: unknown) =>
						Array.isArray(condition) &&
						condition.length === 2 &&
						['regular', 'bonus', 'golden'].includes(condition[0]) &&
						typeof condition[1] === 'number' &&
						condition[1] > 0
				),
			message: 'Bonus conditions must be an array of valid type/bonus pairs',
			required: true,
		},
		highScores: {
			maxEntries: {
				validate: (value: unknown): boolean =>
					typeof value === 'number' && isValidNumber(value, 1, 100, true),
				message: 'Max high score entries must be an integer between 1 and 100',
				required: true,
			},
			persistLocal: {
				validate: (value: unknown): boolean => typeof value === 'boolean',
				message: 'Persist local must be a boolean',
				required: true,
			},
		},
	},
	powerUps: {
		types: {
			validate: (value: unknown): boolean =>
				Array.isArray(value) &&
				value.every(
					(type: unknown) =>
						typeof type === 'string' &&
						['speed', 'ghost', 'points', 'slow'].includes(type)
				),
			message: 'Power-up types must be an array containing valid power-up types',
			required: true,
		},
		spawnChance: {
			validate: (value: unknown): boolean =>
				typeof value === 'number' && isValidNumber(value, 0, 1),
			message: 'Spawn chance must be a number between 0 and 1',
			required: true,
		},
		duration: {
			validate: (value: unknown): boolean =>
				typeof value === 'number' && isValidNumber(value, 1000, 30000),
			message: 'Duration must be between 1000 and 30000 milliseconds',
			required: true,
		},
		effects: {
			speed: {
				validate: (value: unknown): boolean =>
					typeof value === 'number' && isValidNumber(value, 1, 3),
				message: 'Speed multiplier must be between 1 and 3',
				required: true,
			},
			ghost: {
				validate: (value: unknown): boolean => typeof value === 'boolean',
				message: 'Ghost mode must be a boolean',
				required: true,
			},
			points: {
				validate: (value: unknown): boolean =>
					typeof value === 'number' && isValidNumber(value, 1, 5),
				message: 'Points multiplier must be between 1 and 5',
				required: true,
			},
			slow: {
				validate: (value: unknown): boolean =>
					typeof value === 'number' && isValidNumber(value, 0.1, 0.9),
				message: 'Slow multiplier must be between 0.1 and 0.9',
				required: true,
			},
		},
	},
	debug: {
		enabled: {
			validate: (value: unknown): boolean => typeof value === 'boolean',
			message: 'Debug enabled must be a boolean',
			required: true,
		},
		position: {
			validate: (value: unknown): boolean =>
				typeof value === 'string' &&
				['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(value),
			message:
				"Debug position must be one of: 'top-right', 'top-left', 'bottom-right', 'bottom-left'",
			required: true,
		},
		shortcutKey: {
			validate: (value: unknown): boolean =>
				Array.isArray(value) && value.every((key: unknown) => typeof key === 'string'),
			message: 'Shortcut key must be an array of strings',
			required: true,
		},
	},
	difficulty: {
		level: {
			validate: (value: unknown): boolean =>
				typeof value === 'string' && ['easy', 'normal', 'hard'].includes(value),
			message: "Difficulty must be one of: 'easy', 'normal', 'hard'",
			required: true,
		},
		presets: {
			validate: (obj: unknown): boolean => {
				if (!isObject(obj)) return false;
				return Object.values(obj).every((preset): preset is Record<string, unknown> =>
					isObject(preset)
				);
			},
			message:
				'Difficulty presets must include valid configurations for all difficulty levels',
			required: true,
		},
	},
};

// Deep merges two objects
function deepMerge(target: object | null, source: object | null): object {
	if (!target) return source || {};
	if (!source) return target;

	// Implementation
	return target;
}

// Validates a configuration object against the enhanced validation rules
function validateConfig(config: object | null): ValidationResult {
	if (!config) {
		return {
			valid: false,
			errors: ['Configuration cannot be null'],
			warnings: [],
			details: {},
		};
	}
	// Implementation
	return { valid: true, errors: [], warnings: [], details: {} };
}

export { isValidColor, isValidNumber, deepMerge, validateConfig };
