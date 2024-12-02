import { Entity, Vector2D } from '../../types-ts/commonTypes';
import { EntityManager } from '../entity/EntityManager';
import { CollisionSystem } from '../collision/CollisionSystem';
import { CombatSystem } from './CombatSystem';
import { EnemyBehavior } from '../../types-ts/combatTypes';

interface SpawnConfig {
    minDistance: number;
    maxDistance: number;
    spawnInterval: number;
    maxEnemies: number;
}

interface EnemyConfig {
    health: number;
    size: number;
    behavior: EnemyBehavior;
}

interface EnemyEntity extends Entity {
    type: 'enemy';
    health: number;
    behavior: EnemyBehavior;
}

export class EnemySpawner {
    private entityManager: EntityManager;
    private collisionSystem: CollisionSystem;
    private combatSystem: CombatSystem;
    private config: SpawnConfig;
    private lastSpawnTime: number;
    private enemyConfigs: EnemyConfig[];

    constructor(
        entityManager: EntityManager,
        collisionSystem: CollisionSystem,
        combatSystem: CombatSystem,
        config: SpawnConfig
    ) {
        this.entityManager = entityManager;
        this.collisionSystem = collisionSystem;
        this.combatSystem = combatSystem;
        this.config = config;
        this.lastSpawnTime = 0;
        this.enemyConfigs = [];
    }

    registerEnemyType(config: EnemyConfig): void {
        this.enemyConfigs.push(config);
    }

    update(currentTime: number, playerPos: Vector2D): void {
        if (!this.shouldSpawn(currentTime)) return;

        const spawnPos = this.getSpawnPosition(playerPos);
        if (spawnPos) {
            const config = this.getRandomEnemyConfig();
            if (config) {
                this.spawnEnemy(spawnPos, config);
                this.lastSpawnTime = currentTime;
            }
        }
    }

    private shouldSpawn(currentTime: number): boolean {
        const timeSinceLastSpawn = currentTime - this.lastSpawnTime;
        const currentEnemies = this.entityManager.getByType('enemy').length;
        
        return timeSinceLastSpawn >= this.config.spawnInterval && 
               currentEnemies < this.config.maxEnemies;
    }

    private getSpawnPosition(playerPos: Vector2D): Vector2D | null {
        for (let attempts = 0; attempts < 10; attempts++) {
            const pos = this.collisionSystem.getRandomPosition();
            const distance = Math.sqrt(
                Math.pow(pos.x - playerPos.x, 2) + 
                Math.pow(pos.y - playerPos.y, 2)
            );
            
            if (distance >= this.config.minDistance && 
                distance <= this.config.maxDistance) {
                return pos;
            }
        }
        return null;
    }

    private getRandomEnemyConfig(): EnemyConfig | undefined {
        if (this.enemyConfigs.length === 0) return undefined;
        const index = Math.floor(Math.random() * this.enemyConfigs.length);
        return this.enemyConfigs[index];
    }

    private spawnEnemy(position: Vector2D, config: EnemyConfig): void {
        const enemy: EnemyEntity = {
            id: `enemy-${Date.now()}`,
            type: 'enemy',
            position: { ...position },
            health: config.health,
            size: config.size,
            behavior: { ...config.behavior }
        };

        this.entityManager.register(enemy);
    }

    clear(): void {
        this.lastSpawnTime = 0;
        this.enemyConfigs = [];
    }
}
