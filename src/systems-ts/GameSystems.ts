import { EntityManager } from './entity/EntityManager';
import { PhysicsSystem } from './physics/PhysicsSystem';
import { InputSystem } from './input/InputSystem';
import { CollisionSystem } from './collision/CollisionSystem';
import { CombatSystem } from './combat/CombatSystem';
import { EnemySpawner } from './combat/EnemySpawner';
import { GameEventTarget, Vector2D } from '../types-ts/commonTypes';
import { WhipEffect } from '../effects/WhipEffect';
import { DamageIndicator } from '../effects/DamageIndicator';

interface SystemsConfig {
    grid: any; // Will be typed once Grid is converted
    cellSize: number;
    spawnConfig: {
        minDistance: number;
        maxDistance: number;
        spawnInterval: number;
        maxEnemies: number;
    };
    events: GameEventTarget;
    whipEffect: WhipEffect;
    damageIndicator: DamageIndicator;
}

export class GameSystems {
    private entityManager: EntityManager;
    private physicsSystem: PhysicsSystem;
    private inputSystem: InputSystem;
    private collisionSystem: CollisionSystem;
    private combatSystem: CombatSystem;
    private enemySpawner: EnemySpawner;
    private lastUpdateTime: number;
    private paused: boolean;

    constructor(config: SystemsConfig) {
        // Initialize all systems
        this.entityManager = new EntityManager();
        this.physicsSystem = new PhysicsSystem(this.entityManager);
        this.inputSystem = new InputSystem();
        this.collisionSystem = new CollisionSystem(config.grid, config.cellSize);
        
        this.combatSystem = new CombatSystem(
            this.entityManager,
            this.physicsSystem,
            {
                whipEffect: config.whipEffect,
                damageIndicator: config.damageIndicator,
                events: config.events
            }
        );
        
        this.enemySpawner = new EnemySpawner(
            this.entityManager,
            this.collisionSystem,
            this.combatSystem,
            config.spawnConfig
        );

        // Set initial state
        this.lastUpdateTime = 0;
        this.paused = false;

        // Set boundaries for physics system
        const gridWidth = config.grid.width * config.cellSize;
        const gridHeight = config.grid.height * config.cellSize;
        this.physicsSystem.setBoundaries(gridWidth, gridHeight);
    }

    update(currentTime: number, playerPos: Vector2D): void {
        if (this.paused) return;

        // Calculate delta time
        const deltaTime = this.lastUpdateTime ? currentTime - this.lastUpdateTime : 0;
        this.lastUpdateTime = currentTime;

        // Update all systems
        this.inputSystem.update();
        this.physicsSystem.update(deltaTime);
        
        const player = this.entityManager.getByType('player')[0];
        if (player) {
            this.combatSystem.update(currentTime, player);
        }
        
        this.enemySpawner.update(currentTime, playerPos);
    }

    pause(): void {
        this.paused = true;
    }

    resume(): void {
        this.paused = false;
        this.lastUpdateTime = performance.now();
    }

    isPaused(): boolean {
        return this.paused;
    }

    getEntityManager(): EntityManager {
        return this.entityManager;
    }

    getPhysicsSystem(): PhysicsSystem {
        return this.physicsSystem;
    }

    getInputSystem(): InputSystem {
        return this.inputSystem;
    }

    getCollisionSystem(): CollisionSystem {
        return this.collisionSystem;
    }

    getCombatSystem(): CombatSystem {
        return this.combatSystem;
    }

    getEnemySpawner(): EnemySpawner {
        return this.enemySpawner;
    }

    cleanup(): void {
        // Cleanup all systems
        this.physicsSystem.clear();
        this.inputSystem.clear();
        this.collisionSystem.clear();
        this.entityManager.clear();
        this.combatSystem.clear();
        this.enemySpawner.clear();

        // Reset state
        this.lastUpdateTime = 0;
        this.paused = false;
    }
}
