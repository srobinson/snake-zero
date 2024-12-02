import { validationRules, validateConfig, createTypeGuard } from '../../src/config/configValidator.js';

describe('Configuration Validator', () => {
    describe('validateConfig', () => {
        it('should validate a minimal valid config', () => {
            const minimalConfig = {
                board: {
                    preset: 'small',
                    width: 800,
                    height: 600,
                    cellSize: 20,
                    backgroundColor: '#000000',
                    gridColor: '#222222'
                }
            };

            const result = validateConfig(minimalConfig, { board: validationRules.board });
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should validate deeply nested config', () => {
            const powerUpConfig = {
                powerUps: {
                    types: ['speed', 'ghost', 'points', 'slow'],
                    spawnChance: 0.3,
                    duration: 5000,
                    effects: {
                        speed: {
                            speedMultiplier: 2
                        },
                        ghost: {
                            ghostMode: true
                        },
                        points: {
                            pointsMultiplier: 3
                        },
                        slow: {
                            slowMultiplier: 0.5
                        }
                    },
                    colors: {
                        speed: '#ff0000',
                        ghost: '#00ff00',
                        points: '#0000ff',
                        slow: '#ffff00'
                    }
                }
            };

            const result = validateConfig(powerUpConfig, { powerUps: validationRules.powerUps });
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should collect all nested validation errors', () => {
            const invalidConfig = {
                board: {
                    preset: 'invalid',
                    width: 100,  // too small
                    height: 100, // too small
                    cellSize: 5, // too small
                    backgroundColor: 'not-a-color',
                    gridColor: 'also-not-a-color'
                }
            };

            const result = validateConfig(invalidConfig, { board: validationRules.board });
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(6); // One error for each invalid field
            expect(result.errors).toContain("board.preset: Board preset must be one of: 'small', 'medium', 'large', 'fullscreen'");
            expect(result.errors).toContain("board.width: Board width must be an integer between 200 and 3840");
            expect(result.errors).toContain("board.height: Board height must be an integer between 200 and 2160");
            expect(result.errors).toContain("board.cellSize: Cell size must be an integer between 10 and 100");
            expect(result.errors).toContain("board.backgroundColor: Background color must be a valid hex color code");
            expect(result.errors).toContain("board.gridColor: Grid color must be a valid hex color code");
        });

        it('should handle optional fields correctly', () => {
            const configWithOptionalField = {
                food: {
                    types: ['regular', 'bonus', 'golden'],
                    spawnRates: {
                        regular: 0.7,
                        bonus: 0.2,
                        golden: 0.1
                    },
                    points: {
                        regular: 10,
                        bonus: 30,
                        golden: 50
                    },
                    colors: {
                        regular: '#ff0000',
                        bonus: '#00ff00',
                        golden: '#ffff00'
                    }
                    // bonusTimeout is optional and not included
                }
            };

            const foodRules = {
                food: {
                    types: {
                        required: true,
                        validate: (value) => Array.isArray(value) && value.length > 0,
                        message: 'Food types must be a non-empty array'
                    },
                    spawnRates: {
                        required: true,
                        validate: (value) => {
                            const rates = Object.values(value);
                            return rates.length > 0 && Math.abs(rates.reduce((a, b) => a + b, 0) - 1) < 0.0001;
                        },
                        message: 'Spawn rates must be defined for all food types and sum to 1'
                    },
                    points: {
                        required: true,
                        validate: (value) => {
                            return Object.values(value).every(points => Number.isInteger(points) && points > 0);
                        },
                        message: 'Points must be positive integers'
                    },
                    colors: {
                        required: true,
                        validate: (value) => {
                            return Object.values(value).every(color => /^#[0-9A-Fa-f]{6}$/.test(color));
                        },
                        message: 'Colors must be valid hex color codes'
                    },
                    bonusTimeout: {
                        required: false,
                        validate: (value) => {
                            return value === undefined || (Number.isInteger(value) && value >= 1000 && value <= 30000);
                        },
                        message: 'Bonus food timeout must be between 1000 and 30000 milliseconds'
                    }
                }
            };

            const result = validateConfig(configWithOptionalField, foodRules);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should validate optional fields when present', () => {
            const configWithInvalidOptionalField = {
                food: {
                    types: ['regular', 'bonus', 'golden'],
                    spawnRates: {
                        regular: 0.7,
                        bonus: 0.2,
                        golden: 0.1
                    },
                    points: {
                        regular: 10,
                        bonus: 30,
                        golden: 50
                    },
                    colors: {
                        regular: '#ff0000',
                        bonus: '#00ff00',
                        golden: '#ffff00'
                    },
                    bonusTimeout: 500  // Less than minimum 1000
                }
            };

            const foodRules = {
                food: {
                    types: {
                        required: true,
                        validate: (value) => Array.isArray(value) && value.length > 0,
                        message: 'Food types must be a non-empty array'
                    },
                    spawnRates: {
                        required: true,
                        validate: (value) => {
                            const rates = Object.values(value);
                            return rates.length > 0 && Math.abs(rates.reduce((a, b) => a + b, 0) - 1) < 0.0001;
                        },
                        message: 'Spawn rates must be defined for all food types and sum to 1'
                    },
                    points: {
                        required: true,
                        validate: (value) => {
                            return Object.values(value).every(points => Number.isInteger(points) && points > 0);
                        },
                        message: 'Points must be positive integers'
                    },
                    colors: {
                        required: true,
                        validate: (value) => {
                            return Object.values(value).every(color => /^#[0-9A-Fa-f]{6}$/.test(color));
                        },
                        message: 'Colors must be valid hex color codes'
                    },
                    bonusTimeout: {
                        required: false,
                        validate: (value) => {
                            return value === undefined || (Number.isInteger(value) && value >= 1000 && value <= 30000);
                        },
                        message: 'Bonus food timeout must be between 1000 and 30000 milliseconds'
                    }
                }
            };

            const result = validateConfig(configWithInvalidOptionalField, foodRules);
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('food.bonusTimeout: Bonus food timeout must be between 1000 and 30000 milliseconds');
        });
    });

    describe('createTypeGuard', () => {
        it('should create a working type guard function', () => {
            const isPowerUpConfig = createTypeGuard('powerUps', validationRules.powerUps);
            
            const validConfig = {
                types: ['speed', 'ghost'],
                spawnChance: 0.3,
                duration: 5000,
                effects: {
                    speed: {
                        speedMultiplier: 2
                    },
                    ghost: {
                        ghostMode: true
                    },
                    points: {
                        pointsMultiplier: 3
                    },
                    slow: {
                        slowMultiplier: 0.5
                    }
                },
                colors: {
                    speed: '#ff0000',
                    ghost: '#00ff00',
                    points: '#0000ff',
                    slow: '#ffff00'
                }
            };

            const invalidConfig = {
                types: ['invalid'],
                spawnChance: 2,  // > 1
                duration: 500    // < 1000
            };

            expect(isPowerUpConfig(validConfig)).toBe(true);
            expect(isPowerUpConfig(invalidConfig)).toBe(false);
        });
    });
});
