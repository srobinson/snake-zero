import { Vector2D } from '../../types-ts/commonTypes';
import { PowerUpEffect } from '../../types-ts/powerUpTypes';
import { EntityManager } from '../../core-ts/EntityManager';
import { EventSystem } from '../../core-ts/EventSystem';
import { PowerUpConfig, powerUpConfig } from '../../powerups-ts/PowerUpConfig';

interface PowerUpComponent {
    effect: PowerUpEffect;
    duration: number;
    startTime?: number;
    active: boolean;
}

interface ActivePowerUp {
    entityId: string;
    effect: PowerUpEffect;
    endTime: number;
}

export class PowerUpSystem {
    private entityManager: EntityManager;
    private eventSystem: EventSystem;
    private config: PowerUpConfig;
    private activePowerUps: Map<string, ActivePowerUp[]>;
    private lastSpawnTime: number;
    private activeCount: number;

    constructor(
        entityManager: EntityManager,
        eventSystem: EventSystem,
        config: Partial<PowerUpConfig> = {}
    ) {
        this.entityManager = entityManager;
        this.eventSystem = eventSystem;
        this.config = { ...powerUpConfig, ...config };
        this.activePowerUps = new Map();
        this.lastSpawnTime = 0;
        this.activeCount = 0;

        // Set up event listeners
        this.eventSystem.on('collision', this.handleCollision.bind(this));
        
        console.log(this);
        
    }

    private handleCollision(data: { entity1: string; entity2: string; type1: string; type2: string }): void {
        const { entity1, entity2, type1, type2 } = data;

        // Check if collision involves snake head and power-up
        if ((type1 === 'snake_head' && type2 === 'power_up') ||
            (type2 === 'snake_head' && type1 === 'power_up')) {
            
            const snakeId = type1 === 'snake_head' ? entity1 : entity2;
            const powerUpId = type1 === 'power_up' ? entity1 : entity2;
            
            const powerUpComponent = this.entityManager.getComponent<PowerUpComponent>(powerUpId);
            if (powerUpComponent) {
                this.applyPowerUp(snakeId, powerUpComponent.effect);
                this.entityManager.removeEntity(powerUpId);
                this.activeCount--;
            }
        }
    }

    private applyPowerUp(snakeId: string, effect: PowerUpEffect): void {
        const now = performance.now();
        const endTime = now + this.config.duration;

        // Remove existing power-up of the same type
        const existing = this.activePowerUps.get(snakeId) || [];
        const filtered = existing.filter(p => p.effect.type !== effect.type);
        
        // Add new power-up
        filtered.push({
            entityId: snakeId,
            effect,
            endTime
        });
        
        this.activePowerUps.set(snakeId, filtered);
        
        // Emit event for power-up start
        this.eventSystem.emit('powerUpStarted', {
            snakeId,
            effect,
            duration: this.config.duration
        });
    }

    private removePowerUp(snakeId: string, powerUp: ActivePowerUp): void {
        const existing = this.activePowerUps.get(snakeId) || [];
        const filtered = existing.filter(p => p !== powerUp);
        
        if (filtered.length === 0) {
            this.activePowerUps.delete(snakeId);
        } else {
            this.activePowerUps.set(snakeId, filtered);
        }

        // Emit event for power-up end
        this.eventSystem.emit('powerUpEnded', {
            snakeId,
            effect: powerUp.effect
        });
    }

    private spawnPowerUp(position: Vector2D): void {
        if (this.activeCount >= this.config.maxActive) return;

        const effect = this.config.effects[
            Math.floor(Math.random() * this.config.effects.length)
        ];

        const color = this.config.colors[effect.type];

        this.entityManager.createEntity({
            position,
            render: {
                color,
                size: this.config.size,
                shape: 'circle',
                layer: 1,
                effects: {
                    glow: true,
                    glowColor: color,
                    glowSize: this.config.size * 0.5,
                    pulse: true,
                    pulseSpeed: 1000,
                    pulseMin: 0.8,
                    pulseMax: 1.2
                }
            },
            powerUp: {
                effect,
                duration: this.config.duration,
                active: false
            },
            collision: {
                type: 'power_up',
                size: this.config.size
            }
        });

        this.activeCount++;
    }

    update(deltaTime: number): void {
        const now = performance.now();

        // Update active power-ups
        for (const [snakeId, powerUps] of this.activePowerUps.entries()) {
            for (const powerUp of powerUps) {
                if (now >= powerUp.endTime) {
                    this.removePowerUp(snakeId, powerUp);
                }
            }
        }

        // Spawn new power-ups
        if (now - this.lastSpawnTime >= this.config.spawnInterval) {
            // Get a random position within the game bounds
            const grid = this.entityManager.getGrid();
            const position = {
                x: Math.random() * (grid.width * grid.cellSize),
                y: Math.random() * (grid.height * grid.cellSize)
            };

            this.spawnPowerUp(position);
            this.lastSpawnTime = now;
        }
    }

    getActivePowerUps(entityId: string): PowerUpEffect[] {
        const powerUps = this.activePowerUps.get(entityId) || [];
        return powerUps.map(p => p.effect);
    }

    clear(): void {
        this.activePowerUps.clear();
        this.activeCount = 0;
        this.lastSpawnTime = 0;
    }

    toJSON(): object {
        return {
            activeCount: this.activeCount,
            activePowerUpsCount: this.activePowerUps.size
        };
    }
}
