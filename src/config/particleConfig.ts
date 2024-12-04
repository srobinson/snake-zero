import { BaseParticleConfig } from './types.consolidated';

/**
 * Validate particle configuration
 * @param config - Particle configuration to validate
 * @returns Boolean indicating if the configuration is valid
 */
export function validateParticleConfig(config: BaseParticleConfig): boolean {
	// Basic validation rules
	const baseValidation =
		(typeof config.speed === 'number' ? config.speed > 0 : config.speed.min > 0) &&
		config.size.min >= 0 &&
		config.size.max > config.size.min &&
		config.colors.length > 0;

	// Type-specific validations can be added here if needed
	switch (config.type) {
		case 'score':
		case 'powerup':
		case 'orbit':
		case 'active':
			return baseValidation;

		default:
			return baseValidation;
	}
}

/**
 * Default particle configuration
 */
export const defaultParticleConfig: BaseParticleConfig = {
	type: 'normal',
	speed: 1,
	size: { min: 0.1, max: 0.2 },
	lifetime: { min: 1, max: 2 },
	colors: ['#ffffff'],
	trail: { enabled: false },
	glow: false,
	sparkle: false,
	pulse: false,
};
