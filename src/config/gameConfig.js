/**
 * Flat configuration structure for Snake Game
 */

// Helper to derive color variants
const deriveColors = (baseColor) => ({
    base: baseColor,
    light: adjustBrightness(baseColor, 20),
    dark: adjustBrightness(baseColor, -20),
    shadow: adjustBrightness(baseColor, -40),
});

// Helper to adjust color brightness
function adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) + percent;
    const g = ((num >> 8) & 0x00FF) + percent;
    const b = (num & 0x0000FF) + percent;
    return '#' + (0x1000000 + (r < 255 ? r < 1 ? 0 : r : 255) * 0x10000 +
        (g < 255 ? g < 1 ? 0 : g : 255) * 0x100 +
        (b < 255 ? b < 1 ? 0 : b : 255))
        .toString(16)
        .slice(1);
}

export const defaultConfig = {
    // Core Game Settings (HTML-configurable)
    mode: 'medium',              // 'small' | 'medium' | 'large' | 'fullscreen'
    difficulty: 'normal',        // 'easy' | 'normal' | 'hard'
    cellSize: 20,               // pixel size of each cell
    debug: 'none',              // 'none' | 'basic' | 'advanced'

    // Visual Settings
    backgroundColor: '#000000',
    gridColor: '#111111',
    snakeColor: '#4CAF50',      // Base color - variants derived
    foodColor: '#FF5252',
    powerUpColor: '#00ffff',
    snakeStyle: 'smooth',       // 'smooth' | 'pixelated'
    snakeDetail: 'high',        // 'low' | 'medium' | 'high'

    // Gameplay Settings
    baseSpeed: 8,               // Base movement speed
    speedProgressionEnabled: true,
    speedIncreasePerFood: 0.2,
    maxSpeed: 15,
    initialLength: 3,
    initialDirection: 'right',

    // Power-up Settings
    powerUpsEnabled: true,
    powerUpFrequency: 'normal', // 'rare' | 'normal' | 'frequent'
    powerUpStrength: 'normal',  // 'weak' | 'normal' | 'strong'
    powerUpDuration: 10000,     // milliseconds

    // Scoring
    basePoints: 10,
    comboMultiplier: 1.5,
    comboTimeWindow: 3000,      // milliseconds

    // Controls
    upKeys: ['ArrowUp', 'w'],
    downKeys: ['ArrowDown', 's'],
    leftKeys: ['ArrowLeft', 'a'],
    rightKeys: ['ArrowRight', 'd']
};

// Difficulty presets
export const difficultyPresets = {
    easy: {
        baseSpeed: 5,
        powerUpFrequency: 'frequent',
        powerUpStrength: 'weak'
    },
    normal: {
        baseSpeed: 8,
        powerUpFrequency: 'normal',
        powerUpStrength: 'normal'
    },
    hard: {
        baseSpeed: 12,
        powerUpFrequency: 'rare',
        powerUpStrength: 'strong'
    }
};

// Board size presets
export const boardPresets = {
    small: { width: 400, height: 400 },
    medium: { width: 800, height: 600 },
    large: { width: 1200, height: 800 },
    fullscreen: null  // Set dynamically
};

// Style presets based on detail level
export const stylePresets = {
    smooth: {
        high: {
            cornerRadius: 4,
            elevation: 3,
            eyeSize: 4,
            pupilSize: 2,
            tongueSpeed: 200,
            tongueWagRange: 0.2
        },
        medium: {
            cornerRadius: 3,
            elevation: 2,
            eyeSize: 3,
            pupilSize: 1.5,
            tongueSpeed: 300,
            tongueWagRange: 0.15
        },
        low: {
            cornerRadius: 2,
            elevation: 1,
            eyeSize: 2,
            pupilSize: 1,
            tongueSpeed: 400,
            tongueWagRange: 0.1
        }
    },
    pixelated: {
        high: {
            cornerRadius: 0,
            elevation: 2,
            eyeSize: 3,
            pupilSize: 1,
            tongueSpeed: 200,
            tongueWagRange: 0.2
        },
        medium: {
            cornerRadius: 0,
            elevation: 1,
            eyeSize: 2,
            pupilSize: 1,
            tongueSpeed: 300,
            tongueWagRange: 0.15
        },
        low: {
            cornerRadius: 0,
            elevation: 0,
            eyeSize: 1,
            pupilSize: 1,
            tongueSpeed: 400,
            tongueWagRange: 0.1
        }
    }
};

// Debug level presets
export const debugPresets = {
    none: {
        showFPS: false,
        showSnakeInfo: false,
        showGridInfo: false,
        showEffects: false,
        showControls: false,
        showVectors: false
    },
    basic: {
        showFPS: true,
        showSnakeInfo: true,
        showGridInfo: false,
        showEffects: false,
        showControls: true,
        showVectors: false
    },
    advanced: {
        showFPS: true,
        showSnakeInfo: true,
        showGridInfo: true,
        showEffects: true,
        showControls: true,
        showVectors: true
    }
};

// Helper to get computed style based on preferences
export function getComputedStyle(config) {
    const style = stylePresets[config.snakeStyle][config.snakeDetail];
    const colors = deriveColors(config.snakeColor);
    return { ...style, ...colors };
}

// Helper to get debug settings based on level
export function getDebugSettings(level) {
    return debugPresets[level] || debugPresets.none;
}

// Helper to get difficulty settings
export function getDifficultySettings(difficulty) {
    return difficultyPresets[difficulty] || difficultyPresets.normal;
}

// Helper to get board dimensions
export function getBoardDimensions(mode, windowWidth, windowHeight) {
    if (mode === 'fullscreen') {
        return { width: windowWidth, height: windowHeight };
    }
    return boardPresets[mode] || boardPresets.medium;
}

class ConfigManager {
    constructor() {
        this.config = { ...defaultConfig };
    }

    getConfig() {
        return this.config;
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('snakeGameConfig');
            if (saved) {
                const loadedConfig = JSON.parse(saved);
                // Apply loaded config while maintaining defaults for missing properties
                this.config = { ...this.config, ...loadedConfig };
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load configuration:', error);
            return false;
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('snakeGameConfig', JSON.stringify(this.config));
            return true;
        } catch (error) {
            console.error('Failed to save configuration:', error);
            return false;
        }
    }

    loadFromDataAttributes(element) {
        if (!element) return false;

        const dataConfig = {};
        
        // Read basic attributes
        const mode = element.getAttribute('data-mode');
        if (mode) dataConfig.mode = mode;

        const cellSize = element.getAttribute('data-cell-size');
        if (cellSize) dataConfig.cellSize = parseInt(cellSize, 10);

        const difficulty = element.getAttribute('data-difficulty');
        if (difficulty) dataConfig.difficulty = difficulty;

        const debug = element.getAttribute('data-debug');
        if (debug) dataConfig.debug = debug;

        // Only update if we have any data attributes
        if (Object.keys(dataConfig).length > 0) {
            this.config = { ...this.config, ...dataConfig };
            return true;
        }

        return false;
    }

    // Apply computed properties
    computeProperties() {
        // Apply difficulty settings
        const diffSettings = getDifficultySettings(this.config.difficulty);
        this.config = { ...this.config, ...diffSettings };

        // Apply style settings
        const styleSettings = getComputedStyle(this.config);
        this.config = { ...this.config, ...styleSettings };

        // Apply debug settings
        const debugSettings = getDebugSettings(this.config.debug);
        this.config = { ...this.config, ...debugSettings };
    }
}

export default new ConfigManager();
