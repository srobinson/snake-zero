/**
 * @typedef {import('./gameConfig.js').GameConfig} GameConfig
 */

import { defaultConfig } from './gameConfig.js';

/**
 * Manages game configuration with singleton pattern
 * @class
 * @description Handles configuration state and provides methods to get/set config values
 */
class ConfigManager {
    /**
     * Creates a new ConfigManager instance with default configuration
     */
    constructor() {
        /** @type {GameConfig} */
        this.config = { ...defaultConfig };
    }

    /**
     * Retrieves the current configuration
     * @returns {GameConfig} The current game configuration
     */
    getConfig() {
        return this.config;
    }

    /**
     * Replaces the entire configuration with a new one
     * @param {GameConfig} newConfig - The new configuration to set
     */
    setConfig(newConfig) {
        this.config = { ...newConfig };
    }

    /**
     * Updates parts of the configuration while preserving other values
     * @param {Partial<GameConfig>} newConfig - Partial configuration to merge with current
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

/** @type {ConfigManager} */
export const configManager = new ConfigManager();
