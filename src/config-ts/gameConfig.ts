import { validateConfig, deepMerge } from './configValidator';
import type { GameConfig } from './types';
import { applyDataAttributes } from '../utils-ts/dataAttributeParser';

export const defaultConfig: GameConfig = {
    debug: {
        enabled: true,
        showFPS: true,
        showSnakeInfo: true,
        showGrid: false,
        showVectors: false,
        position: 'top-right',
        fontSize: 12,
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        textColor: '#ffffff',
        showGridInfo: true,
        showEffects: true,
        showControls: true,
        shortcutKey: '`',
        controls: {
            spawn: {
                speed: '1',
                ghost: '2',
                points: '3',
                slow: '4'
            },
            snake: {
                grow: 'g'
            },
            board: {
                small: 'q',
                medium: 'w',
                large: 'e',
                fullscreen: 'r'
            },
            grid: {
                increaseCellSize: '+',
                decreaseCellSize: '-'
            }
        },
        vectors: {
            color: '#ff0000',
            size: 2,
            opacity: 0.5
        }
    },
    board: {
        preset: 'medium',
        presets: {
            small: { width: 400, height: 400, cellSize: 20 },
            medium: { width: 800, height: 600, cellSize: 20 },
            large: { width: 1200, height: 800, cellSize: 20 },
            fullscreen: { width: window.innerWidth, height: window.innerHeight, cellSize: 20 }
        },
        width: 800,
        height: 600,
        cellSize: 20,
        backgroundColor: '#000000',
        gridColor: '#111111',
        padding: 10,
    },
    difficulty: {
        current: 'normal',
        levels: {
            easy: {
                speed: 6,
                growth: 1,
                score: 1
            },
            normal: {
                speed: 8,
                growth: 1,
                score: 2
            },
            hard: {
                speed: 10,
                growth: 2,
                score: 3
            }
        },
        presets: {
            easy: {
                baseSpeed: 5,
                powerUpChance: 0.02
            },
            normal: {
                baseSpeed: 8,
                powerUpChance: 0.01
            },
            hard: {
                baseSpeed: 12,
                powerUpChance: 0.005
            }
        }
    },
    snake: {
        initialLength: 5,
        initialDirection: 'right',
        speedProgression: {
            enabled: true,
            increasePerFood: 0.1,
            maxSpeed: 10,
            initialSpeedBoost: 1.5,
            slowEffect: 0.5
        },
        colors: {
            head: '#4CAF50',
            body: '#2E7D32',
            highlight: '#A5D6A7',
            shadow: '#1B5E20',
            glow: 'rgba(76, 175, 80, 0.2)',
            eyes: '#FFFFFF',
            pupil: '#000000',
            tongue: '#FF0000'
        },
        segments: {
            size: 0.8,
            headSize: 1.0,
            headLength: 1.2,
            elevation: 0.1,
            cornerRadius: 4,
            eyeSize: 6,
            pupilSize: 3,
            tongueLength: 10,
            tongueWidth: 3,
            tongueSpeed: 0.01,
            tongueWagRange: 0.5
        },
        controls: {
            up: ['ArrowUp', 'w'],
            down: ['ArrowDown', 's'],
            left: ['ArrowLeft', 'a'],
            right: ['ArrowRight', 'd']
        }
    },
    food: {
        types: ['regular', 'bonus', 'golden'],
        spawnRate: 0.02,
        lifetime: 10000,
        effects: {
            bounceSpeed: {
                regular: 1000,  // ms per bounce cycle
                bonus: 1200,
                golden: 800
            },
            glowIntensity: {
                regular: 0.2,
                bonus: 0.4,
                golden: 0.6
            },
            particleCount: {
                regular: 5,
                bonus: 10,
                golden: 15
            },
            pixelSize: {
                regular: 0.125,     // fraction of cell size
                bonus: 0.125,
                golden: 0.125
            },
            sparkleSpeed: {
                regular: 0,     // no sparkle
                bonus: 800,     // ms per sparkle cycle
                golden: 500
            },
            glow: {
                regular: 10,    // glow radius in pixels
                bonus: 15,
                golden: 20
            }
        },
        colors: {
            regular: {
                primary: '#4CAF50',
                secondary: '#388E3C',
                highlight: '#81C784'
            },
            bonus: {
                primary: '#2196F3',
                secondary: '#1976D2',
                highlight: '#64B5F6'
            },
            golden: {
                primary: '#FFD700',
                secondary: '#FFA000',
                highlight: '#FFE57F'
            }
        },
        points: {
            regular: 10,
            bonus: 25,
            golden: 50
        },
        spawnRates: {
            regular: 0.8,
            bonus: 0.15,
            golden: 0.05
        }
    },
    powerUps: {
        types: ['speed', 'ghost', 'points', 'slow'],
        spawnChance: 0.01,
        effects: {
            speed: {
                duration: 5000,
                strength: 1.5,
                particleCount: 10
            },
            ghost: {
                duration: 5000,
                strength: 1.0,
                particleCount: 8
            },
            points: {
                duration: 10000,
                strength: 2.0,
                particleCount: 12
            },
            slow: {
                duration: 5000,
                strength: 0.5,
                particleCount: 6
            }
        },
        colors: {
            speed: '#FFD700',   // Gold
            ghost: '#4169E1',   // Royal Blue
            points: '#32CD32',  // Lime Green
            slow: '#DC143C'     // Crimson
        }
    },
    powerupBadges: {
        duration: 2000,
        popInDuration: 300,
        popInScale: 1.2,
        spacing: 0.2,        // Spacing as percentage of cell size
        size: 1.5,          // Size as multiplier of cell size
        floatingSize: 2.0,  // Floating badge size as multiplier of cell size
        hoverAmplitude: 2,
        hoverFrequency: 3,
        fadeOutDuration: 500,
        offsetY: -50
    }
} as const;

class ConfigManager {
    private sources: {
        default: GameConfig | null;
        localStorage: GameConfig | null;
        dataAttributes: GameConfig | null;
    };
    private config: GameConfig;

    constructor() {
        this.sources = {
            default: null,
            localStorage: null,
            dataAttributes: null
        };
        
        // Initialize with default config
        this.config = JSON.parse(JSON.stringify(defaultConfig));
        
        // Load configurations in order of increasing priority
        this.loadDefaultConfig();
        this.loadFromLocalStorage();
        this.loadFromDataAttributes();
        
        // Merge configurations according to priority
        this.mergeConfigurations();
    }

    private loadDefaultConfig(): void {
        this.sources.default = JSON.parse(JSON.stringify(defaultConfig));
    }

    public loadFromLocalStorage(): void {
        try {
            const stored = localStorage.getItem('snakeConfig');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (validateConfig(parsed)) {
                    this.sources.localStorage = parsed;
                }
            }
        } catch (error) {
            console.error('Failed to load config from localStorage:', error);
        }
    }

    private loadFromDataAttributes(): void {
        try {
            const container = document.getElementById('snaked-again-container');
            if (!container) return;

            const dataConfig = applyDataAttributes(this.config, container);
            if (!dataConfig) return;

            // Store valid data attributes config
            this.sources.dataAttributes = dataConfig;
            
            // Update grid dimensions immediately if game exists
            const typedWindow = window as unknown as { game?: { grid?: { updateDimensions?: () => void } } };
            if (typedWindow.game?.grid?.updateDimensions) {
                typedWindow.game.grid.updateDimensions();
            }
        } catch (error) {
            console.error('Failed to load config from data attributes:', error);
        }
    }

    private mergeConfigurations(): void {
        this.config = deepMerge(
            JSON.parse(JSON.stringify(defaultConfig)),
            this.sources.localStorage || {},
            this.sources.dataAttributes || {}
        ) as GameConfig;
    }

    reset(): void {
        this.config = JSON.parse(JSON.stringify(defaultConfig));
        localStorage.removeItem('snakeConfig');
        this.mergeConfigurations();
    }

    private savePersistentSettings(configChanges: Partial<GameConfig>): void {
        const persistentKeys = ['board.preset', 'board.cellSize', 'difficulty.current'];
        const persistent = {} as Partial<GameConfig>;

        for (const key of persistentKeys) {
            const [section, setting] = key.split('.');
            const value = configChanges[section as keyof GameConfig]?.[setting as keyof GameConfig];
            
            if (value !== undefined) {
                if (!persistent[section as keyof GameConfig]) {
                    switch (section) {
                        case 'board':
                            persistent.board = {} as GameConfig['board'];
                            break;
                        case 'difficulty':
                            persistent.difficulty = {} as GameConfig['difficulty'];
                            break;
                    }
                }
                
                if (persistent[section as keyof GameConfig]) {
                    (persistent[section as keyof GameConfig] as any)[setting] = value;
                }
            }
        }

        if (Object.keys(persistent).length > 0) {
            const stored = localStorage.getItem('snakeConfig');
            const current = stored ? JSON.parse(stored) : defaultConfig;
            const updated = deepMerge(
                JSON.parse(JSON.stringify(defaultConfig)),
                current,
                persistent
            );
            localStorage.setItem('snakeConfig', JSON.stringify(updated));
        }
    }

    override(customConfig: Partial<GameConfig>): boolean {
        if (!validateConfig(customConfig)) {
            return false;
        }

        this.savePersistentSettings(customConfig);
        this.config = deepMerge(
            JSON.parse(JSON.stringify(defaultConfig)),
            this.config,
            customConfig
        ) as GameConfig;
        return true;
    }

    getConfig(): GameConfig {
        return this.config;
    }

    saveToLocalStorage(): boolean {
        try {
            localStorage.setItem('snakeConfig', JSON.stringify(this.config));
            return true;
        } catch (error) {
            console.error('Failed to save config to localStorage:', error);
            return false;
        }
    }

    getConfigurationSources() {
        return { ...this.sources };
    }
}

export default new ConfigManager();
