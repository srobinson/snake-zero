import configManager from './gameConfig';
import { EffectsConfig } from './types';

// Helper function to create lighter hue of a color
function lightenColor(hex: string, percent: number): string {
	// Convert hex to RGB
	let r = parseInt(hex.slice(1, 3), 16);
	let g = parseInt(hex.slice(3, 5), 16);
	let b = parseInt(hex.slice(5, 7), 16);

	// Convert to HSL and increase lightness
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0,
		s,
		l = (max + min) / 2;

	if (max === min) {
		h = s = 0;
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}

	l = Math.min(1, l + percent);

	// Convert back to RGB
	let r2, g2, b2;
	if (s === 0) {
		r2 = g2 = b2 = l;
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r2 = hue2rgb(p, q, h + 1 / 3);
		g2 = hue2rgb(p, q, h);
		b2 = hue2rgb(p, q, h - 1 / 3);
	}

	return `#${Math.round(r2 * 255)
		.toString(16)
		.padStart(2, '0')}${Math.round(g2 * 255)
		.toString(16)
		.padStart(2, '0')}${Math.round(b2 * 255)
		.toString(16)
		.padStart(2, '0')}`;
}

export const effectsConfig: EffectsConfig = {
	particles: {
		food: {
			regular: {
				count: 10,
				speed: 2,
				size: { min: 0.1, max: 0.2 },
				lifetime: { min: 600, max: 1000 },
				colors: ['#FF2222', '#FF4444', '#FFFFFF'],
				trail: { enabled: true, length: 3, decay: 0.95 },
				glow: true,
				sparkle: true,
				pulse: false,
			},
			bonus: {
				count: 15,
				speed: 2.5,
				size: { min: 0.15, max: 0.25 },
				lifetime: { min: 800, max: 1200 },
				colors: ['#FF22FF', '#FF66FF', '#FFFFFF'],
				trail: { enabled: true, length: 5, decay: 0.93 },
				glow: true,
				sparkle: true,
				pulse: true,
			},
			golden: {
				count: 20,
				speed: 3,
				size: { min: 0.2, max: 0.3 },
				lifetime: { min: 1000, max: 1500 },
				colors: ['#FFD700', '#FFFF44', '#FFFFFF'],
				trail: { enabled: true, length: 4, decay: 0.94 },
				glow: true,
				sparkle: true,
				pulse: true,
			},
		},
		powerUps: {
			speed: {
				duration: 1200,
				particleCount: 20,
				baseSpeed: 2.5,
				speedVariation: 1.2,
				spreadAngle: 360,
				gravity: 0.05,
				fadeRate: 0.015,
				sizeRange: [5, 10],
				rotationSpeed: 0.15,
				sparkle: true,
				colors: (() => {
					const baseColor = configManager.getConfig().powerUps.colors.speed;
					return [
						baseColor,
						lightenColor(baseColor, 0.2),
						lightenColor(baseColor, 0.4),
						'#ffffff',
					];
				})(),
				trail: {
					enabled: true,
					length: 5,
					decay: 0.95,
				},
			},
			ghost: {
				duration: 1000,
				particleCount: 24,
				baseSpeed: 2.0,
				speedVariation: 1.4,
				spreadAngle: 360,
				gravity: 0.02,
				fadeRate: 0.012,
				sizeRange: [6, 12],
				rotationSpeed: 0.1,
				sparkle: true,
				colors: (() => {
					const baseColor = configManager.getConfig().powerUps.colors.ghost;
					return [
						baseColor,
						lightenColor(baseColor, 0.2),
						lightenColor(baseColor, 0.4),
						'#ffffff',
					];
				})(),
				trail: {
					enabled: true,
					length: 6,
					decay: 0.92,
				},
			},
			points: {
				duration: 1400,
				particleCount: 28,
				baseSpeed: 2.2,
				speedVariation: 1.3,
				spreadAngle: 360,
				gravity: -0.03,
				fadeRate: 0.014,
				sizeRange: [4, 8],
				rotationSpeed: 0.12,
				sparkle: true,
				colors: (() => {
					const baseColor = configManager.getConfig().powerUps.colors.points;
					return [
						baseColor,
						lightenColor(baseColor, 0.2),
						lightenColor(baseColor, 0.4),
						'#ffffff',
					];
				})(),
				trail: {
					enabled: true,
					length: 4,
					decay: 0.94,
				},
			},
			slow: {
				duration: 1100,
				particleCount: 22,
				baseSpeed: 1.8,
				speedVariation: 1.5,
				spreadAngle: 360,
				gravity: 0.04,
				fadeRate: 0.013,
				sizeRange: [5, 9],
				rotationSpeed: 0.08,
				sparkle: true,
				colors: (() => {
					const baseColor = configManager.getConfig().powerUps.colors.slow;
					return [
						baseColor,
						lightenColor(baseColor, 0.2),
						lightenColor(baseColor, 0.4),
						'#ffffff',
					];
				})(),
				trail: {
					enabled: true,
					length: 5,
					decay: 0.93,
				},
			},
		},
		activeEffects: {
			speed: {
				particleCount: 12,
				emitInterval: 100,
				baseSpeed: 2.0,
				speedVariation: 0.8,
				spreadAngle: 30,
				gravity: 0,
				fadeRate: 0.02,
				sizeRange: [3, 6],
				rotationSpeed: 0.1,
				sparkle: true,
				colors: (() => {
					const baseColor = configManager.getConfig().powerUps.colors.speed;
					return [
						baseColor,
						lightenColor(baseColor, 0.2),
						lightenColor(baseColor, 0.4),
						'#ffffff',
					];
				})(),
				trail: {
					enabled: true,
					length: 3,
					decay: 0.96,
				},
			},
			ghost: {
				particleCount: 16,
				emitInterval: 120,
				baseSpeed: 1.5,
				speedVariation: 1.0,
				spreadAngle: 360,
				gravity: 0,
				fadeRate: 0.018,
				sizeRange: [4, 7],
				rotationSpeed: 0.08,
				sparkle: true,
				colors: (() => {
					const baseColor = configManager.getConfig().powerUps.colors.ghost;
					return [
						baseColor,
						lightenColor(baseColor, 0.2),
						lightenColor(baseColor, 0.4),
						'#ffffff',
					];
				})(),
				trail: {
					enabled: true,
					length: 4,
					decay: 0.94,
				},
			},
			points: {
				particleCount: 8,
				emitInterval: 150,
				baseSpeed: 1.8,
				speedVariation: 0.9,
				spreadAngle: 45,
				gravity: -0.02,
				fadeRate: 0.016,
				sizeRange: [3, 5],
				rotationSpeed: 0.12,
				sparkle: true,
				colors: (() => {
					const baseColor = configManager.getConfig().powerUps.colors.points;
					return [
						baseColor,
						lightenColor(baseColor, 0.2),
						lightenColor(baseColor, 0.4),
						'#ffffff',
					];
				})(),
				trail: {
					enabled: true,
					length: 3,
					decay: 0.95,
				},
			},
			slow: {
				particleCount: 10,
				emitInterval: 130,
				baseSpeed: 1.2,
				speedVariation: 1.1,
				spreadAngle: 60,
				gravity: 0.01,
				fadeRate: 0.015,
				sizeRange: [3, 6],
				rotationSpeed: 0.06,
				sparkle: true,
				colors: (() => {
					const baseColor = configManager.getConfig().powerUps.colors.slow;
					return [
						baseColor,
						lightenColor(baseColor, 0.2),
						lightenColor(baseColor, 0.4),
						'#ffffff',
					];
				})(),
				trail: {
					enabled: true,
					length: 3,
					decay: 0.95,
				},
			},
		},
	},
};
