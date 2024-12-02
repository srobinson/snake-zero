import { validateConfig } from '../configValidator';
import configManager from '../gameConfig';
import { effectsConfig } from '../effectsConfig';
import { combatConfig } from '../combatConfig';
import type { GameConfig } from '../types';

describe('Configuration System', () => {
    test('Game Config Validation', () => {
        const config = configManager.getConfig();
        expect(validateConfig(config)).toBe(true);

        // Test invalid config
        const invalidConfig = {
            ...config,
            board: {
                ...config.board,
                cellSize: 5 // Invalid: cellSize must be >= 10
            }
        };
        expect(validateConfig(invalidConfig)).toBe(false);
    });

    test('Config Override', () => {
        const originalConfig = configManager.getConfig();
        const customConfig: Partial<GameConfig> = {
            board: {
                ...originalConfig.board,
                cellSize: 25
            },
            debug: {
                ...originalConfig.debug,
                enabled: false
            },
            difficulty: {
                ...originalConfig.difficulty,
                current: 'normal'
            }
        };

        expect(configManager.override(customConfig)).toBe(true);
        expect(configManager.getConfig().board.cellSize).toBe(25);
        expect(configManager.getConfig().debug.enabled).toBe(false);
        expect(configManager.getConfig().difficulty.current).toBe('normal');
    });

    test('Effects Config Types', () => {
        // Verify particle effects have required properties
        Object.values(effectsConfig.particles).forEach(effect => {
            expect(effect).toHaveProperty('count');
            expect(effect).toHaveProperty('speed');
            expect(effect).toHaveProperty('size');
            expect(effect).toHaveProperty('lifetime');
            expect(effect).toHaveProperty('color');
        });
    });

    test('Combat Config Types', () => {
        // Verify enemy types have required properties
        Object.values(combatConfig.enemies).forEach(enemy => {
            expect(enemy.stats).toHaveProperty('health');
            expect(enemy.stats).toHaveProperty('speed');
            expect(enemy.stats).toHaveProperty('damage');
            expect(enemy).toHaveProperty('color');
            expect(enemy).toHaveProperty('behavior');
        });

        // Verify difficulty settings
        Object.values(combatConfig.difficulty).forEach(difficulty => {
            expect(difficulty.statMultipliers).toHaveProperty('health');
            expect(difficulty.statMultipliers).toHaveProperty('speed');
            expect(difficulty.statMultipliers).toHaveProperty('damage');
            expect(difficulty).toHaveProperty('spawnRate');
            expect(difficulty).toHaveProperty('maxEnemies');
        });
    });
});
