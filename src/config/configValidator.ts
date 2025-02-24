// configValidator.ts
import { ValidationResult, ValidationRules, ValidationRule } from './types';

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

// Type guard to check if a rule is a ValidationRule
function isValidationRule(rule: ValidationRule | ValidationRules): rule is ValidationRule {
	return typeof (rule as ValidationRule).validate === 'function';
}

// Enhanced validation rules
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
		showGrid: {
			validate: (value: unknown): boolean => typeof value === 'boolean',
			message: 'Show grid must be a boolean',
			required: true,
		},
		gridThickness: {
			validate: (value: unknown): boolean => isValidNumber(value as number, 1, 10, true),
			message: 'Grid thickness must be an integer between 1 and 10',
			required: true,
		},
		gridOpacity: {
			validate: (value: unknown): boolean => isValidNumber(value as number, 0, 1),
			message: 'Grid opacity must be a number between 0 and 1',
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
				const hasValidRates = requiredTypes.every(type => {
					const rate = obj[type];
					return typeof rate === 'number' && !isNaN(rate) && rate >= 0 && rate <= 1;
				});
				if (!hasValidRates) return false;
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
					const colorSet = colors[type];
					if (!isObject(colorSet)) return false;
					const { primary, secondary, highlight } = colorSet as Record<string, unknown>;
					return (
						typeof primary === 'string' &&
						isValidColor(primary) &&
						typeof secondary === 'string' &&
						isValidColor(secondary) &&
						typeof highlight === 'string' &&
						isValidColor(highlight)
					);
				});
			},
			message:
				'Colors must include valid hex codes for primary, secondary, and highlight for all food types',
			required: true,
		},
		effects: {
			bounceSpeed: {
				validate: (obj: unknown): boolean => {
					if (!isObject(obj)) return false;
					const speeds = obj as Record<string, unknown>;
					const requiredTypes = ['regular', 'bonus', 'golden'];
					return requiredTypes.every(
						type =>
							typeof speeds[type] === 'number' &&
							isValidNumber(speeds[type] as number, 0, 5000, true)
					);
				},
				message: 'Bounce speeds must be integers between 0 and 5000 for all food types',
				required: true,
			},
			sparkleSpeed: {
				validate: (obj: unknown): boolean => {
					if (!isObject(obj)) return false;
					const speeds = obj as Record<string, unknown>;
					const requiredTypes = ['regular', 'bonus', 'golden'];
					return requiredTypes.every(
						type =>
							typeof speeds[type] === 'number' &&
							isValidNumber(speeds[type] as number, 0, 5000, true)
					);
				},
				message: 'Sparkle speeds must be integers between 0 and 5000 for all food types',
				required: true,
			},
			pixelSize: {
				validate: (obj: unknown): boolean => {
					if (!isObject(obj)) return false;
					const sizes = obj as Record<string, unknown>;
					const requiredTypes = ['regular', 'bonus', 'golden'];
					return requiredTypes.every(
						type =>
							typeof sizes[type] === 'number' &&
							isValidNumber(sizes[type] as number, 0, 1)
					);
				},
				message: 'Pixel sizes must be numbers between 0 and 1 for all food types',
				required: true,
			},
			outlineWeight: {
				validate: (obj: unknown): boolean => {
					if (!isObject(obj)) return false;
					const weights = obj as Record<string, unknown>;
					const requiredTypes = ['regular', 'bonus', 'golden'];
					return requiredTypes.every(
						type =>
							typeof weights[type] === 'number' &&
							isValidNumber(weights[type] as number, 0, 10, true)
					);
				},
				message: 'Outline weights must be integers between 0 and 10 for all food types',
				required: true,
			},
			glow: {
				validate: (obj: unknown): boolean => {
					if (!isObject(obj)) return false;
					const glows = obj as Record<string, unknown>;
					const requiredTypes = ['regular', 'bonus', 'golden'];
					return requiredTypes.every(
						type =>
							typeof glows[type] === 'number' &&
							isValidNumber(glows[type] as number, 0, 50, true)
					);
				},
				message: 'Glow values must be integers between 0 and 50 for all food types',
				required: true,
			},
		},
	},
	scoring: {
		basePoints: {
			validate: (value: unknown): boolean => isValidNumber(value as number, 1, 1000, true),
			message: 'Base points must be an integer between 1 and 1000',
			required: true,
		},
		multiplierIncrease: {
			validate: (value: unknown): boolean => isValidNumber(value as number, 0, 1),
			message: 'Multiplier increase must be a number between 0 and 1',
			required: true,
		},
		multiplierRules: {
			validate: (arr: unknown): boolean =>
				Array.isArray(arr) &&
				arr.every(
					(rule: unknown) =>
						isObject(rule) &&
						typeof (rule as any).threshold === 'number' &&
						isValidNumber((rule as any).threshold, 1, 100, true) &&
						typeof (rule as any).multiplier === 'number' &&
						isValidNumber((rule as any).multiplier, 1, 10)
				),
			message: 'Multiplier rules must be an array of valid threshold/multiplier pairs',
			required: true,
		},
		bonusConditions: {
			validate: (arr: unknown): boolean =>
				Array.isArray(arr) &&
				arr.every(
					(condition: unknown) =>
						isObject(condition) &&
						typeof (condition as any).type === 'string' &&
						typeof (condition as any).bonus === 'number' &&
						isValidNumber((condition as any).bonus, 0, 1000, true)
				),
			message: 'Bonus conditions must be an array of valid type/bonus pairs',
			required: true,
		},
	},
	powerUps: {
		types: {
			validate: (value: unknown): boolean =>
				Array.isArray(value) &&
				value.length > 0 &&
				value.every(
					(type: unknown) =>
						typeof type === 'string' &&
						['speed', 'ghost', 'points', 'slow'].includes(type)
				),
			message: 'Power-up types must be a non-empty array containing valid power-up types',
			required: true,
		},
		spawnChance: {
			validate: (value: unknown): boolean => isValidNumber(value as number, 0, 1),
			message: 'Spawn chance must be a number between 0 and 1',
			required: true,
		},
		spawnRates: {
			validate: (obj: unknown): boolean => {
				if (!obj) return true; // Optional field
				if (!isObject(obj)) return false;
				const requiredTypes = ['speed', 'ghost', 'points', 'slow'];
				const hasValidRates = requiredTypes.every(type => {
					const rate = obj[type];
					return typeof rate === 'number' && !isNaN(rate) && rate >= 0 && rate <= 1;
				});
				if (!hasValidRates) return false;
				const sum = Object.values(obj).reduce(
					(acc: number, rate) => acc + (typeof rate === 'number' ? rate : 0),
					0
				);
				return Math.abs(sum - 1) < Number.EPSILON;
			},
			message: 'Spawn rates must sum to 1 if defined for all power-up types',
			required: false,
		},
		effects: {
			speed: {
				multiplier: {
					validate: (value: unknown): boolean => isValidNumber(value as number, 0, 2),
					message: 'Speed multiplier must be between 0 and 2',
					required: true,
				},
				boost: {
					validate: (value: unknown): boolean => isValidNumber(value as number, 0, 5),
					message: 'Speed boost must be between 0 and 5',
					required: true,
				},
				duration: {
					validate: (value: unknown): boolean =>
						isValidNumber(value as number, 1000, 30000, true),
					message: 'Speed duration must be an integer between 1000 and 30000',
					required: true,
				},
			},
			ghost: {
				multiplier: {
					validate: (value: unknown): boolean => isValidNumber(value as number, 0, 2),
					message: 'Ghost multiplier must be between 0 and 2',
					required: true,
				},
				boost: {
					validate: (value: unknown): boolean => isValidNumber(value as number, 0, 5),
					message: 'Ghost boost must be between 0 and 5',
					required: true,
				},
				duration: {
					validate: (value: unknown): boolean =>
						isValidNumber(value as number, 1000, 30000, true),
					message: 'Ghost duration must be an integer between 1000 and 30000',
					required: true,
				},
			},
			points: {
				multiplier: {
					validate: (value: unknown): boolean => isValidNumber(value as number, 0, 5),
					message: 'Points multiplier must be between 0 and 5',
					required: true,
				},
				boost: {
					validate: (value: unknown): boolean => isValidNumber(value as number, 0, 5),
					message: 'Points boost must be between 0 and 5',
					required: true,
				},
				duration: {
					validate: (value: unknown): boolean =>
						isValidNumber(value as number, 1000, 30000, true),
					message: 'Points duration must be an integer between 1000 and 30000',
					required: true,
				},
			},
			slow: {
				multiplier: {
					validate: (value: unknown): boolean => isValidNumber(value as number, 0.1, 1),
					message: 'Slow multiplier must be between 0.1 and 1',
					required: true,
				},
				boost: {
					validate: (value: unknown): boolean => isValidNumber(value as number, 0, 5),
					message: 'Slow boost must be between 0 and 5',
					required: true,
				},
				duration: {
					validate: (value: unknown): boolean =>
						isValidNumber(value as number, 1000, 30000, true),
					message: 'Slow duration must be an integer between 1000 and 30000',
					required: true,
				},
			},
		},
		// Add more powerUps subfields (badges, visual, etc.) as needed
	},
	debug: {
		enabled: {
			validate: (value: unknown): boolean => typeof value === 'boolean',
			message: 'Debug enabled must be a boolean',
			required: true,
		},
		showFPS: {
			validate: (value: unknown): boolean => typeof value === 'boolean',
			message: 'Show FPS must be a boolean',
			required: true,
		},
		showSnakeInfo: {
			validate: (value: unknown): boolean => typeof value === 'boolean',
			message: 'Show snake info must be a boolean',
			required: true,
		},
		showGridInfo: {
			validate: (value: unknown): boolean => typeof value === 'boolean',
			message: 'Show grid info must be a boolean',
			required: true,
		},
		showEffects: {
			validate: (value: unknown): boolean => typeof value === 'boolean',
			message: 'Show effects must be a boolean',
			required: true,
		},
		showControls: {
			validate: (value: unknown): boolean => typeof value === 'boolean',
			message: 'Show controls must be a boolean',
			required: true,
		},
		showVectors: {
			validate: (value: unknown): boolean => typeof value === 'boolean',
			message: 'Show vectors must be a boolean',
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
		backgroundColor: {
			validate: (value: unknown): boolean =>
				typeof value === 'string' && isValidColor(value, true),
			message: 'Debug background color must be a valid hex or rgba color code',
			required: true,
		},
		textColor: {
			validate: (value: unknown): boolean => typeof value === 'string' && isValidColor(value),
			message: 'Debug text color must be a valid hex color code',
			required: true,
		},
		fontSize: {
			validate: (value: unknown): boolean => isValidNumber(value as number, 8, 50, true),
			message: 'Font size must be an integer between 8 and 50',
			required: true,
		},
		padding: {
			validate: (value: unknown): boolean => isValidNumber(value as number, 0, 50, true),
			message: 'Padding must be an integer between 0 and 50',
			required: true,
		},
		shortcutKey: {
			validate: (value: unknown): boolean =>
				(Array.isArray(value) && value.every((key: unknown) => typeof key === 'string')) ||
				typeof value === 'string',
			message: 'Shortcut key must be a string or array of strings',
			required: true,
		},
		// Add controls subfields as needed
	},
	difficulty: {
		current: {
			validate: (value: unknown): boolean =>
				typeof value === 'string' && ['easy', 'normal', 'hard'].includes(value),
			message: "Difficulty must be one of: 'easy', 'normal', 'hard'",
			required: true,
		},
		presets: {
			easy: {
				baseSpeed: {
					validate: (value: unknown): boolean =>
						isValidNumber(value as number, 1, 20, true),
					message: 'Easy base speed must be an integer between 1 and 20',
					required: true,
				},
				powerUpChance: {
					validate: (value: unknown): boolean => isValidNumber(value as number, 0, 1),
					message: 'Easy power-up chance must be between 0 and 1',
					required: true,
				},
			},
			normal: {
				baseSpeed: {
					validate: (value: unknown): boolean =>
						isValidNumber(value as number, 1, 20, true),
					message: 'Normal base speed must be an integer between 1 and 20',
					required: true,
				},
				powerUpChance: {
					validate: (value: unknown): boolean => isValidNumber(value as number, 0, 1),
					message: 'Normal power-up chance must be between 0 and 1',
					required: true,
				},
			},
			hard: {
				baseSpeed: {
					validate: (value: unknown): boolean =>
						isValidNumber(value as number, 1, 20, true),
					message: 'Hard base speed must be an integer between 1 and 20',
					required: true,
				},
				powerUpChance: {
					validate: (value: unknown): boolean => isValidNumber(value as number, 0, 1),
					message: 'Hard power-up chance must be between 0 and 1',
					required: true,
				},
			},
		},
	},
	effectsConfig: {
		particles: {
			food: {
				regular: {
					validate: validateParticleConfig,
					message: 'Regular food particle config must be valid',
					required: true,
				},
				bonus: {
					validate: validateParticleConfig,
					message: 'Bonus food particle config must be valid',
					required: true,
				},
				golden: {
					validate: validateParticleConfig,
					message: 'Golden food particle config must be valid',
					required: true,
				},
			},
			powerUps: {
				validate: (obj: unknown): boolean =>
					isObject(obj) &&
					Object.values(obj).every(val => validateParticleConfig(val as any)),
				message: 'Power-up particle configs must all be valid',
				required: true,
			},
			activeEffects: {
				validate: (obj: unknown): boolean =>
					isObject(obj) &&
					Object.values(obj).every(val => validateParticleConfig(val as any)),
				message: 'Active effect particle configs must all be valid',
				required: true,
			},
		},
	},
};

// Helper function to validate ParticleConfig
function validateParticleConfig(config: unknown): boolean {
	if (!isObject(config)) return false;
	const c = config as Record<string, unknown>;

	return (
		typeof c.count === 'number' &&
		isValidNumber(c.count, 1, 100, true) &&
		typeof c.speed === 'number' &&
		isValidNumber(c.speed, 0, 10) &&
		isObject(c.size) &&
		isValidNumber((c.size as any).min, 0, 10) &&
		isValidNumber((c.size as any).max, (c.size as any).min, 10) &&
		Array.isArray(c.colors) &&
		c.colors.every((color: unknown) => typeof color === 'string' && isValidColor(color)) &&
		(c.trail === undefined ||
			(isObject(c.trail) && typeof (c.trail as any).enabled === 'boolean')) &&
		(c.glow === undefined || typeof c.glow === 'boolean') &&
		(c.sparkle === undefined || typeof c.sparkle === 'boolean') &&
		(c.pulse === undefined || typeof c.pulse === 'boolean')
	);
}

// Fully implemented deepMerge
function deepMerge(target: object | null, source: object | null): object {
	if (!target) return source || {};
	if (!source) return target;

	const output = { ...target };
	for (const key in source) {
		if (isObject(source[key]) && isObject(target[key])) {
			output[key] = deepMerge(target[key] as object, source[key] as object);
		} else {
			output[key] = source[key];
		}
	}
	return output;
}

// Fully implemented validateConfig
function validateConfig(config: object | null): ValidationResult {
	if (!config) {
		return {
			valid: false,
			errors: ['Configuration cannot be null'],
			warnings: [],
			details: {},
		};
	}

	const result: ValidationResult = { valid: true, errors: [], warnings: [], details: {} };

	const checkRules = (rules: ValidationRules, obj: object, path: string = '') => {
		for (const [key, rule] of Object.entries(rules)) {
			const fullPath = path ? `${path}.${key}` : key;
			const value = (obj as any)[key];

			if (isValidationRule(rule)) {
				if (rule.required && value === undefined) {
					result.errors.push(`${fullPath} is required`);
					result.valid = false;
				} else if (value !== undefined && !rule.validate(value)) {
					result.errors.push(`${fullPath}: ${rule.message}`);
					result.valid = false;
				}
			} else if (isObject(rule) && isObject(value)) {
				checkRules(rule, value, fullPath);
			}
		}
	};

	checkRules(validationRules, config);
	return result;
}

export { isValidColor, isValidNumber, deepMerge, validateConfig };
