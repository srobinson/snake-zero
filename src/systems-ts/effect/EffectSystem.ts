import { Vector2D } from '../../types-ts/commonTypes';
import { EntityManager } from '../../core-ts/EntityManager';
import { EventSystem } from '../../core-ts/EventSystem';

interface Effect {
    id: string;
    type: string;
    position: Vector2D;
    duration: number;
    startTime: number;
    config: any;
}

interface EffectConfig {
    maxEffects?: number;
    defaultDuration?: number;
    effects: {
        [key: string]: {
            duration?: number;
            render: (ctx: CanvasRenderingContext2D, effect: Effect, progress: number) => void;
        };
    };
}

export class EffectSystem {
    private entityManager: EntityManager;
    private eventSystem: EventSystem;
    private ctx: CanvasRenderingContext2D;
    private effects: Map<string, Effect>;
    private effectTypes: Map<string, EffectConfig['effects'][string]>;
    private maxEffects: number;
    private defaultDuration: number;
    private nextEffectId: number;

    constructor(
        entityManager: EntityManager,
        eventSystem: EventSystem,
        canvas: HTMLCanvasElement,
        config: EffectConfig
    ) {
        this.entityManager = entityManager;
        this.eventSystem = eventSystem;
        this.ctx = canvas.getContext('2d')!;
        this.effects = new Map();
        this.effectTypes = new Map();
        this.maxEffects = config.maxEffects || 100;
        this.defaultDuration = config.defaultDuration || 1000;
        this.nextEffectId = 1;

        // Register effect types
        Object.entries(config.effects).forEach(([type, config]) => {
            this.registerEffectType(type, config);
        });

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.eventSystem.on('collision', this.handleCollision.bind(this));
        this.eventSystem.on('powerUpStarted', this.handlePowerUpStart.bind(this));
        this.eventSystem.on('powerUpEnded', this.handlePowerUpEnd.bind(this));
        this.eventSystem.on('snakeDied', this.handleSnakeDeath.bind(this));
    }

    private handleCollision(data: { 
        entity1: string; 
        entity2: string; 
        type1: string; 
        type2: string;
        position?: Vector2D;
    }): void {
        if (!data.position) return;

        if ((data.type1 === 'snake_head' && data.type2 === 'wall') ||
            (data.type2 === 'snake_head' && data.type1 === 'wall')) {
            this.createEffect('collision', data.position, {
                color: '#ff0000',
                size: 20
            });
        }
    }

    private handlePowerUpStart(data: { 
        snakeId: string; 
        effect: { color: string } 
    }): void {
        const entity = this.entityManager.getEntity(data.snakeId);
        if (!entity) return;

        this.createEffect('powerUp', entity.position, {
            color: data.effect.color,
            size: 30,
            duration: 500
        });
    }

    private handlePowerUpEnd(data: { snakeId: string }): void {
        const entity = this.entityManager.getEntity(data.snakeId);
        if (!entity) return;

        this.createEffect('powerDown', entity.position, {
            size: 20,
            duration: 300
        });
    }

    private handleSnakeDeath(): void {
        const snakeSegments = this.entityManager.getEntitiesWithComponent('snake');
        snakeSegments.forEach(segment => {
            this.createEffect('explosion', segment.position, {
                color: '#ff0000',
                size: 30,
                particles: 10
            });
        });
    }

    registerEffectType(type: string, config: EffectConfig['effects'][string]): void {
        this.effectTypes.set(type, {
            duration: config.duration || this.defaultDuration,
            render: config.render
        });
    }

    createEffect(
        type: string,
        position: Vector2D,
        config: any = {}
    ): string | null {
        const effectType = this.effectTypes.get(type);
        if (!effectType) {
            console.warn(`Unknown effect type: ${type}`);
            return null;
        }

        if (this.effects.size >= this.maxEffects) {
            return null;
        }

        const id = `effect_${this.nextEffectId++}`;
        const effect: Effect = {
            id,
            type,
            position: { ...position },
            duration: config.duration || effectType.duration,
            startTime: performance.now(),
            config
        };

        this.effects.set(id, effect);
        return id;
    }

    removeEffect(id: string): void {
        this.effects.delete(id);
    }

    update(deltaTime: number): void {
        const now = performance.now();
        const expiredEffects: string[] = [];

        // Update and render effects
        this.effects.forEach(effect => {
            const effectType = this.effectTypes.get(effect.type);
            if (!effectType) return;

            const age = now - effect.startTime;
            if (age >= effect.duration) {
                expiredEffects.push(effect.id);
                return;
            }

            const progress = age / effect.duration;
            
            // Save context state
            this.ctx.save();
            
            try {
                // Render effect
                effectType.render(this.ctx, effect, progress);
            } catch (error) {
                console.error(`Error rendering effect ${effect.type}:`, error);
            }
            
            // Restore context state
            this.ctx.restore();
        });

        // Remove expired effects
        expiredEffects.forEach(id => this.removeEffect(id));
    }

    clear(): void {
        this.effects.clear();
    }

    getActiveEffects(): Effect[] {
        return Array.from(this.effects.values());
    }

    toJSON(): object {
        return {
            activeEffects: this.effects.size,
            registeredTypes: Array.from(this.effectTypes.keys())
        };
    }
}
