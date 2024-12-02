import type { GameConfig } from './types';

interface ValidationRule {
    type: string;
    required?: boolean;
    min?: number;
    max?: number;
    values?: any[];
    properties?: Record<string, ValidationRule>;
    items?: ValidationRule;
}

export const validationRules: Record<string, ValidationRule> = {
    debug: {
        type: 'object',
        required: true,
        properties: {
            enabled: { type: 'boolean' },
            showFPS: { type: 'boolean' },
            showSnakeInfo: { type: 'boolean' },
            showGrid: { type: 'boolean' },
            showVectors: { type: 'boolean' },
            controls: {
                type: 'object',
                properties: {
                    spawn: {
                        type: 'object',
                        properties: {
                            speed: { type: 'string' },
                            ghost: { type: 'string' },
                            points: { type: 'string' },
                            slow: { type: 'string' }
                        }
                    },
                    snake: {
                        type: 'object',
                        properties: {
                            grow: { type: 'string' }
                        }
                    },
                    board: {
                        type: 'object',
                        properties: {
                            small: { type: 'string' },
                            medium: { type: 'string' },
                            large: { type: 'string' },
                            fullscreen: { type: 'string' }
                        }
                    },
                    grid: {
                        type: 'object',
                        properties: {
                            increaseCellSize: { type: 'string' },
                            decreaseCellSize: { type: 'string' }
                        }
                    }
                }
            },
            vectors: {
                type: 'object',
                properties: {
                    color: { type: 'string' },
                    size: { type: 'number', min: 1 },
                    opacity: { type: 'number', min: 0, max: 1 }
                }
            }
        }
    },
    board: {
        type: 'object',
        required: true,
        properties: {
            preset: { type: 'string', values: ['small', 'medium', 'large', 'fullscreen'] },
            cellSize: { type: 'number', min: 10, max: 50 },
            presets: {
                type: 'object',
                properties: {
                    small: {
                        type: 'object',
                        properties: {
                            width: { type: 'number', min: 10 },
                            height: { type: 'number', min: 10 },
                            cellSize: { type: 'number', min: 10 }
                        }
                    },
                    medium: {
                        type: 'object',
                        properties: {
                            width: { type: 'number', min: 15 },
                            height: { type: 'number', min: 15 },
                            cellSize: { type: 'number', min: 10 }
                        }
                    },
                    large: {
                        type: 'object',
                        properties: {
                            width: { type: 'number', min: 20 },
                            height: { type: 'number', min: 20 },
                            cellSize: { type: 'number', min: 10 }
                        }
                    },
                    fullscreen: {
                        type: 'object',
                        properties: {
                            width: { type: 'number', min: window.innerWidth },
                            height: { type: 'number', min: window.innerHeight },
                            cellSize: { type: 'number', min: 20 }
                        }
                    }
                }
            },
            padding: { type: 'number', min: 0 }
        }
    },
    difficulty: {
        type: 'object',
        required: true,
        properties: {
            current: { type: 'string', values: ['easy', 'normal', 'hard'] },
            levels: {
                type: 'object',
                properties: {
                    easy: {
                        type: 'object',
                        properties: {
                            speed: { type: 'number', min: 0.5 },
                            growth: { type: 'number', min: 1 },
                            score: { type: 'number', min: 1 }
                        }
                    },
                    normal: {
                        type: 'object',
                        properties: {
                            speed: { type: 'number', min: 1 },
                            growth: { type: 'number', min: 1 },
                            score: { type: 'number', min: 1 }
                        }
                    },
                    hard: {
                        type: 'object',
                        properties: {
                            speed: { type: 'number', min: 1.5 },
                            growth: { type: 'number', min: 2 },
                            score: { type: 'number', min: 2 }
                        }
                    }
                }
            }
        }
    }
};

export function validateConfig(config: Partial<GameConfig>, rules: Record<string, ValidationRule> = validationRules): boolean {
    try {
        validateObject(config, rules);
        return true;
    } catch (error) {
        console.error('Config validation failed:', error);
        return false;
    }
}

function validateObject(obj: any, rules: Record<string, ValidationRule>, path: string = ''): void {
    if (typeof obj !== 'object' || obj === null) {
        throw new Error(`Expected object at ${path || 'root'}`);
    }

    // Check required properties
    for (const [key, rule] of Object.entries(rules)) {
        if (rule.required && !(key in obj)) {
            throw new Error(`Missing required property: ${path ? `${path}.${key}` : key}`);
        }
    }

    // Validate each property
    for (const [key, value] of Object.entries(obj)) {
        const rule = rules[key];
        if (!rule) continue;

        const currentPath = path ? `${path}.${key}` : key;
        validateValue(value, rule, currentPath);
    }
}

function validateValue(value: any, rule: ValidationRule, path: string): void {
    switch (rule.type) {
        case 'object':
            if (rule.properties) {
                validateObject(value, rule.properties, path);
            }
            break;

        case 'array':
            if (!Array.isArray(value)) {
                throw new Error(`Expected array at ${path}`);
            }
            if (rule.items) {
                value.forEach((item, index) => {
                    validateValue(item, rule.items!, `${path}[${index}]`);
                });
            }
            break;

        case 'string':
            if (typeof value !== 'string') {
                throw new Error(`Expected string at ${path}`);
            }
            if (rule.values && !rule.values.includes(value)) {
                throw new Error(`Invalid value at ${path}. Expected one of: ${rule.values.join(', ')}`);
            }
            break;

        case 'number':
            if (typeof value !== 'number') {
                throw new Error(`Expected number at ${path}`);
            }
            if (rule.min !== undefined && value < rule.min) {
                throw new Error(`Value at ${path} must be >= ${rule.min}`);
            }
            if (rule.max !== undefined && value > rule.max) {
                throw new Error(`Value at ${path} must be <= ${rule.max}`);
            }
            break;

        case 'boolean':
            if (typeof value !== 'boolean') {
                throw new Error(`Expected boolean at ${path}`);
            }
            break;

        default:
            throw new Error(`Unknown type ${rule.type} at ${path}`);
    }
}

export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
    if (!sources.length) return target;

    const source = sources.shift();
    if (!source) return target;

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                deepMerge(target[key] as object, source[key] as object);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return deepMerge(target, ...sources);
}

function isObject(item: any): item is object {
    return item && typeof item === 'object' && !Array.isArray(item);
}
