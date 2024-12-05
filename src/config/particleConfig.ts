import type { ActiveEffectParticleConfig, BaseParticleConfig, ScoreParticleConfig } from './types';

/**
 * Validate a particle configuration
 * @param config - Particle configuration to validate
 * @returns Boolean indicating if configuration is valid
 */
export function validateParticleConfig(config: BaseParticleConfig): boolean {
	// Basic validation rules
	const baseValidation =
		(typeof config.speed === 'number' ? config.speed : config.speed.min) > 0 &&
		config.size.min >= 0 &&
		config.size.max > config.size.min &&
		config.colors.length > 0;

	// Type-specific validations
	switch (config.type) {
		case 'score':
			return baseValidation && (config as ScoreParticleConfig).fontSize !== undefined;

		case 'powerup':
		case 'orbit':
			// For powerup and orbit, we'll just check basic validation
			return baseValidation;

		case 'active':
			return (
				baseValidation && (config as ActiveEffectParticleConfig).emitInterval !== undefined
			);

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
