import { gameConfig as defaultConfig } from './gameConfig.js';

class ConfigManager {
    constructor() {
        this.config = JSON.parse(JSON.stringify(defaultConfig)); // Deep clone default config
    }

    // Deep merge of source into target
    #mergeDeep(target, source) {
        for (const key in source) {
            if (source[key] instanceof Object && key in target && target[key] !== null) {
                target[key] = target[key] || {};
                this.#mergeDeep(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }

    // Override default config with custom settings
    override(customConfig) {
        this.config = this.#mergeDeep(this.config, customConfig);
        return this.config;
    }

    // Get current config
    getConfig() {
        return this.config;
    }

    // Get board dimensions based on current config
    getBoardDimensions() {
        const { board, boardPresets } = this.config;
        
        // Use preset if specified
        if (board.preset && boardPresets[board.preset]) {
            const preset = boardPresets[board.preset];
            // Ensure dimensions are valid
            if (preset.width % preset.gridSize === 0 && 
                preset.height % preset.gridSize === 0) {
                return preset;
            }
        }
        
        // Use custom dimensions if specified
        if (board.custom && board.custom.width && board.custom.height) {
            const { width, height, gridSize = 20 } = board.custom;
            // Ensure dimensions are divisible by grid size
            const adjustedWidth = Math.floor(width / gridSize) * gridSize;
            const adjustedHeight = Math.floor(height / gridSize) * gridSize;
            
            return {
                width: adjustedWidth,
                height: adjustedHeight,
                gridSize,
                cols: adjustedWidth / gridSize,
                rows: adjustedHeight / gridSize
            };
        }
        
        // Fallback to medium preset if no valid configuration
        return boardPresets.medium;
    }
}

// Create singleton instance
const configManager = new ConfigManager();
export default configManager;
