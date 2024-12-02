import { Vector2D } from '../../types-ts/commonTypes';
import { EntityManager } from '../../core-ts/EntityManager';
import { EventSystem } from '../../core-ts/EventSystem';

interface ParticleConfig {
    maxParticles: number;
    defaultLifetime: number;
    defaultSize: number;
    defaultSpeed: number;
    defaultColor: string;
    fadeOut: boolean;
}

interface ParticleEmitterConfig {
    position: Vector2D;
    count: number;
    spread: number;
    speed?: number;
    size?: number;
    color?: string;
    lifetime?: number;
    shape?: 'circle' | 'square';
    fadeOut?: boolean;
}

interface ParticleComponent {
    velocity: Vector2D;
    lifetime: number;
    startTime: number;
    fadeOut: boolean;
}

export class ParticleSystem {
    private entityManager: EntityManager;
    private eventSystem: EventSystem;
    private config: ParticleConfig;
    private activeCount: number;

    constructor(
        entityManager: EntityManager,
        eventSystem: EventSystem,
        config: ParticleConfig
    ) {
        this.entityManager = entityManager;
        this.eventSystem = eventSystem;
        this.config = config;
        this.activeCount = 0;

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.eventSystem.on('collision', this.handleCollision.bind(this));
        this.eventSystem.on('powerUpStarted', this.handlePowerUpStart.bind(this));
        this.eventSystem.on('snakeDied', this.handleSnakeDeath.bind(this));
        this.eventSystem.on('scoreUpdated', this.handleScoreUpdate.bind(this));
    }

    private handleCollision(data: { entity1: string; entity2: string; type1: string; type2: string }): void {
        const { entity1, entity2, type1, type2 } = data;

        // Handle different collision types
        if ((type1 === 'snake_head' && type2 === 'wall') ||
            (type2 === 'snake_head' && type1 === 'wall')) {
            const entity = type1 === 'snake_head' ? entity1 : entity2;
            const position = this.entityManager.getEntity(entity)?.position;
            if (position) {
                this.emitParticles({
                    position,
                    count: 10,
                    spread: Math.PI,
                    color: '#ff0000',
                    speed: 200
                });
            }
        }
    }

    private handlePowerUpStart(data: { snakeId: string; effect: { color: string } }): void {
        const position = this.entityManager.getEntity(data.snakeId)?.position;
        if (position) {
            this.emitParticles({
                position,
                count: 20,
                spread: Math.PI * 2,
                color: data.effect.color,
                speed: 150,
                fadeOut: true
            });
        }
    }

    private handleSnakeDeath(): void {
        const entities = this.entityManager.getEntitiesWithComponent('snake');
        entities.forEach(entity => {
            this.emitParticles({
                position: entity.position,
                count: 15,
                spread: Math.PI * 2,
                color: '#ff0000',
                speed: 200,
                size: 4,
                lifetime: 2000
            });
        });
    }

    private handleScoreUpdate(data: { isSpecial: boolean; points: number }): void {
        if (data.isSpecial) {
            const foodEntities = this.entityManager.getEntitiesWithComponent('food');
            foodEntities.forEach(entity => {
                this.emitParticles({
                    position: entity.position,
                    count: 8,
                    spread: Math.PI * 2,
                    color: '#ffff00',
                    speed: 100,
                    fadeOut: true
                });
            });
        }
    }

    emitParticles(config: ParticleEmitterConfig): void {
        if (this.activeCount >= this.config.maxParticles) return;

        const {
            position,
            count,
            spread,
            speed = this.config.defaultSpeed,
            size = this.config.defaultSize,
            color = this.config.defaultColor,
            lifetime = this.config.defaultLifetime,
            shape = 'circle',
            fadeOut = this.config.fadeOut
        } = config;

        for (let i = 0; i < count; i++) {
            if (this.activeCount >= this.config.maxParticles) break;

            // Calculate random angle within spread
            const angle = (Math.random() - 0.5) * spread;
            const velocity = {
                x: Math.cos(angle) * speed * (0.5 + Math.random() * 0.5),
                y: Math.sin(angle) * speed * (0.5 + Math.random() * 0.5)
            };

            this.entityManager.createEntity({
                position: { ...position },
                render: {
                    color,
                    size: size * (0.5 + Math.random() * 0.5),
                    shape,
                    alpha: 1,
                    layer: 3
                },
                particle: {
                    velocity,
                    lifetime,
                    startTime: performance.now(),
                    fadeOut
                }
            });

            this.activeCount++;
        }
    }

    update(deltaTime: number): void {
        const now = performance.now();
        let removed = 0;

        // Update all particles
        const particles = this.entityManager.getEntitiesWithComponent('particle');
        particles.forEach(entity => {
            const component = this.entityManager.getComponent<ParticleComponent>(entity.id);
            if (!component) return;

            const age = now - component.startTime;
            if (age >= component.lifetime) {
                this.entityManager.removeEntity(entity.id);
                removed++;
                return;
            }

            // Update position
            const newPosition = {
                x: entity.position.x + component.velocity.x * deltaTime / 1000,
                y: entity.position.y + component.velocity.y * deltaTime / 1000
            };
            this.entityManager.updatePosition(entity.id, newPosition);

            // Update alpha if fading out
            if (component.fadeOut) {
                const alpha = 1 - (age / component.lifetime);
                const render = this.entityManager.getComponent(entity.id);
                if (render) {
                    render.render.alpha = alpha;
                    this.entityManager.updateComponent(entity.id, { render: render.render });
                }
            }
        });

        this.activeCount -= removed;
    }

    clear(): void {
        const particles = this.entityManager.getEntitiesWithComponent('particle');
        particles.forEach(entity => {
            this.entityManager.removeEntity(entity.id);
        });
        this.activeCount = 0;
    }

    toJSON(): object {
        return {
            activeParticles: this.activeCount
        };
    }
}
