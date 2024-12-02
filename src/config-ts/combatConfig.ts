interface EnemyStats {
    health: number;
    speed: number;
    damage: number;
    score: number;
    size: number;
}

interface EnemyType {
    stats: EnemyStats;
    color: string;
    behavior: string;
    spawnWeight: number;
}

interface SpawnWave {
    enemies: string[];
    delay: number;
    count: number;
}

interface DifficultySettings {
    statMultipliers: {
        health: number;
        speed: number;
        damage: number;
    };
    spawnRate: number;
    maxEnemies: number;
}

interface CombatConfig {
    enemies: Record<string, EnemyType>;
    waves: SpawnWave[];
    difficulty: Record<string, DifficultySettings>;
    powerUps: {
        types: string[];
        spawnChance: number;
        duration: number;
    };
}

export const combatConfig: CombatConfig = {
    enemies: {
        basic: {
            stats: {
                health: 100,
                speed: 1,
                damage: 10,
                score: 100,
                size: 1
            },
            color: '#ff0000',
            behavior: 'chase',
            spawnWeight: 1
        },
        fast: {
            stats: {
                health: 50,
                speed: 2,
                damage: 5,
                score: 150,
                size: 0.8
            },
            color: '#00ff00',
            behavior: 'circle',
            spawnWeight: 0.8
        },
        tank: {
            stats: {
                health: 200,
                speed: 0.5,
                damage: 20,
                score: 200,
                size: 1.5
            },
            color: '#0000ff',
            behavior: 'patrol',
            spawnWeight: 0.6
        },
        ranged: {
            stats: {
                health: 75,
                speed: 0.8,
                damage: 15,
                score: 175,
                size: 0.9
            },
            color: '#ffff00',
            behavior: 'kite',
            spawnWeight: 0.7
        }
    },
    waves: [
        {
            enemies: ['basic'],
            delay: 0,
            count: 3
        },
        {
            enemies: ['basic', 'fast'],
            delay: 10000,
            count: 4
        },
        {
            enemies: ['basic', 'fast', 'tank'],
            delay: 20000,
            count: 5
        },
        {
            enemies: ['fast', 'tank', 'ranged'],
            delay: 30000,
            count: 6
        }
    ],
    difficulty: {
        easy: {
            statMultipliers: {
                health: 0.8,
                speed: 0.8,
                damage: 0.8
            },
            spawnRate: 0.8,
            maxEnemies: 5
        },
        normal: {
            statMultipliers: {
                health: 1,
                speed: 1,
                damage: 1
            },
            spawnRate: 1,
            maxEnemies: 8
        },
        hard: {
            statMultipliers: {
                health: 1.2,
                speed: 1.2,
                damage: 1.2
            },
            spawnRate: 1.2,
            maxEnemies: 12
        }
    },
    powerUps: {
        types: ['health', 'shield', 'damage', 'speed'],
        spawnChance: 0.1,
        duration: 10000
    }
};
