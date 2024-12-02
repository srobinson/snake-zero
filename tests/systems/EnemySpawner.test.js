import { EnemySpawner } from '../../src/systems/combat/EnemySpawner.js';
import { EntityManager } from '../../src/systems/entity/EntityManager.js';
import { CombatSystem } from '../../src/systems/combat/CombatSystem.js';
import { PhysicsSystem } from '../../src/systems/physics/PhysicsSystem.js';

describe('EnemySpawner', () => {
    let spawner;
    let entityManager;
    let combatSystem;
    let physicsSystem;
    let mockConfig;

    beforeEach(() => {
        entityManager = new EntityManager();
        physicsSystem = new PhysicsSystem(entityManager);
        combatSystem = new CombatSystem(entityManager, physicsSystem);
        spawner = new EnemySpawner(entityManager, combatSystem);

        mockConfig = {
            baseHealth: 2,
            baseSpeed: 2,
            spawnRate: 60,
            maxEnemies: 5,
            types: {
                patrol: {
                    health: 2,
                    speed: 1.5,
                    damage: 1
                },
                chaser: {
                    health: 2,
                    speed: 2,
                    damage: 1
                }
            },
            difficulty: {
                normal: {
                    enemyHealthMultiplier: 1.0,
                    enemySpeedMultiplier: 1.0,
                    enemyDamageMultiplier: 1.0,
                    spawnRateMultiplier: 1.0,
                    maxEnemiesMultiplier: 1.0
                }
            }
        };

        spawner.initialize(mockConfig, { width: 20, height: 20 });
    });

    test('should initialize with config', () => {
        expect(spawner.config).toBeDefined();
        expect(spawner.spawnPoints.length).toBeGreaterThan(0);
    });

    test('should spawn enemies at valid positions', () => {
        const player = {
            position: { x: 10, y: 10 }
        };

        spawner.update(Date.now(), player, 'normal');
        
        const enemies = entityManager.getByType('enemy');
        expect(enemies.length).toBe(1);
        
        const enemy = enemies[0];
        expect(enemy.position.x).toBeGreaterThanOrEqual(0);
        expect(enemy.position.x).toBeLessThan(20);
        expect(enemy.position.y).toBeGreaterThanOrEqual(0);
        expect(enemy.position.y).toBeLessThan(20);
    });

    test('should respect max enemies limit', () => {
        const player = {
            position: { x: 10, y: 10 }
        };

        // Spawn maximum number of enemies
        for (let i = 0; i < 10; i++) {
            spawner.update(Date.now() + i * 1000, player, 'normal');
        }

        const enemies = entityManager.getByType('enemy');
        expect(enemies.length).toBeLessThanOrEqual(mockConfig.maxEnemies);
    });

    test('should spawn enemies away from player', () => {
        const player = {
            position: { x: 10, y: 10 }
        };

        spawner.update(Date.now(), player, 'normal');
        
        const enemy = entityManager.getByType('enemy')[0];
        const dx = enemy.position.x - player.position.x;
        const dy = enemy.position.y - player.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        expect(distance).toBeGreaterThanOrEqual(5);
    });
});
