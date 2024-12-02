import { Vector2D } from '../../types-ts/commonTypes';
import { EntityManager } from '../../core-ts/EntityManager';
import { EventSystem } from '../../core-ts/EventSystem';

interface FoodConfig {
    size: number;
    spawnInterval: number;
    maxActive: number;
    colors: {
        normal: string;
        special: string;
    };
    specialFoodChance: number;
    specialFoodPoints: number;
    normalFoodPoints: number;
}

interface FoodComponent {
    points: number;
    isSpecial: boolean;
}

export class FoodSystem {
    private entityManager: EntityManager;
    private eventSystem: EventSystem;
    private config: FoodConfig;
    private lastSpawnTime: number;
    private activeCount: number;
    private score: number;

    constructor(
        entityManager: EntityManager,
        eventSystem: EventSystem,
        config: FoodConfig
    ) {
        this.entityManager = entityManager;
        this.eventSystem = eventSystem;
        this.config = config;
        this.lastSpawnTime = 0;
        this.activeCount = 0;
        this.score = 0;

        // Set up event listeners
        this.eventSystem.on('foodEaten', this.handleFoodEaten.bind(this));
    }

    private handleFoodEaten(data: { foodEntity: string }): void {
        const { foodEntity } = data;
        const foodComponent = this.entityManager.getComponent<FoodComponent>(foodEntity);
        
        if (foodComponent) {
            this.score += foodComponent.points;
            this.activeCount--;
            
            this.eventSystem.emit('scoreUpdated', {
                points: foodComponent.points,
                totalScore: this.score,
                isSpecial: foodComponent.isSpecial
            });
        }
    }

    private findValidSpawnPosition(): Vector2D {
        const grid = this.entityManager.getGrid();
        const margin = this.config.size * 2;
        let attempts = 0;
        const maxAttempts = 50;

        while (attempts < maxAttempts) {
            const position = {
                x: margin + Math.random() * (grid.width * grid.cellSize - margin * 2),
                y: margin + Math.random() * (grid.height * grid.cellSize - margin * 2)
            };

            // Check if position is far enough from snake and other food
            const nearbyEntities = this.entityManager.getNearbyEntities(position, 2);
            const isClear = !nearbyEntities.some(entity => {
                const components = this.entityManager.getComponent(entity.id);
                return components?.snake || components?.food;
            });

            if (isClear) {
                return position;
            }

            attempts++;
        }

        // If no valid position found after max attempts, return a random position
        return {
            x: margin + Math.random() * (grid.width * grid.cellSize - margin * 2),
            y: margin + Math.random() * (grid.height * grid.cellSize - margin * 2)
        };
    }

    private spawnFood(): void {
        if (this.activeCount >= this.config.maxActive) return;

        const position = this.findValidSpawnPosition();
        const isSpecial = Math.random() < this.config.specialFoodChance;
        const points = isSpecial ? this.config.specialFoodPoints : this.config.normalFoodPoints;
        const color = isSpecial ? this.config.colors.special : this.config.colors.normal;

        this.entityManager.createEntity({
            position,
            render: {
                color,
                size: this.config.size,
                shape: 'circle',
                layer: 1,
                effects: {
                    glow: isSpecial,
                    glowColor: color,
                    glowSize: this.config.size * 0.5,
                    pulse: isSpecial,
                    pulseSpeed: 800,
                    pulseMin: 0.8,
                    pulseMax: 1.2
                }
            },
            food: {
                points,
                isSpecial
            },
            collision: {
                type: 'food',
                size: this.config.size
            }
        });

        this.activeCount++;
        
        if (isSpecial) {
            this.eventSystem.emit('specialFoodSpawned', { position });
        }
    }

    update(deltaTime: number): void {
        const now = performance.now();

        // Spawn new food
        if (now - this.lastSpawnTime >= this.config.spawnInterval) {
            this.spawnFood();
            this.lastSpawnTime = now;
        }
    }

    getScore(): number {
        return this.score;
    }

    clear(): void {
        // Remove all food entities
        const foodEntities = this.entityManager.getEntitiesWithComponent('food');
        foodEntities.forEach(entity => {
            this.entityManager.removeEntity(entity.id);
        });

        this.activeCount = 0;
        this.lastSpawnTime = 0;
        this.score = 0;
    }

    toJSON(): object {
        return {
            activeCount: this.activeCount,
            score: this.score
        };
    }
}
