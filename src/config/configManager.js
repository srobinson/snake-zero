import { defaultConfig } from './gameConfig.js';

class ConfigManager {
    constructor() {
        this.config = { ...defaultConfig };
    }

    getConfig() {
        return this.config;
    }

    setConfig(newConfig) {
        this.config = { ...newConfig };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

export const configManager = new ConfigManager();
