/**
 * @typedef {Object} GameConfig
 * @property {CanvasRenderingContext2D} ctx
 * @property {EventTarget} events
 * @property {number} width
 * @property {number} height
 */

import { EntityManager } from './entity/EntityManager.js';
import { PhysicsSystem } from './physics/PhysicsSystem.js';
import { InputSystem } from './input/InputSystem.js';
import { CollisionSystem } from './collision/CollisionSystem.js';
import { CombatSystem } from './combat/CombatSystem.js';
import { WhipEffect } from '../effects/WhipEffect.js';
import { DamageIndicator } from '../effects/DamageIndicator.js';

export class GameSystems {
    constructor(config) {
        this.ctx = config.ctx;
        this.events = config.events;
        this.width = config.width;
        this.height = config.height;
        
        this.whipEffect = new WhipEffect(this.ctx);
        this.damageIndicator = new DamageIndicator(this.ctx);

        this.entityManager = new EntityManager();
        this.physicsSystem = new PhysicsSystem(this.entityManager);
        this.inputSystem = new InputSystem();
        this.collisionSystem = new CollisionSystem(this.entityManager);
        this.combatSystem = new CombatSystem(
            this.entityManager, 
            this.physicsSystem,
            {
                whipEffect: this.whipEffect,
                damageIndicator: this.damageIndicator,
                events: this.events
            }
        );

        this.lastUpdateTime = 0;
        this.isPaused = false;
        this.setupCollisionRules();
    }

    setupCollisionRules() {
        this.collisionSystem.registerCollision('snake', 'food', (snake, food) => {
            this.entityManager.remove(food.id);
            if (this.events) {
                this.events.emit('FOOD_COLLECTED', {
                    position: food.position,
                    points: food.points
                });
            }
        });

        this.collisionSystem.registerCollision('snake', 'powerup', (snake, powerup) => {
            this.entityManager.remove(powerup.id);
            if (this.events) {
                this.events.emit('POWER_UP_COLLECTED', {
                    type: powerup.powerUpType,
                    position: powerup.position
                });
            }
        });

        this.collisionSystem.registerCollision('snake', 'enemy', (snake, enemy) => {
            const snakeState = this.entityManager.getById(snake.id).state;
            if (!snakeState?.ghostMode) {
                if (this.events) {
                    this.events.emit('COLLISION', {
                        position: snake.position
                    });
                }
            }
        });

        this.collisionSystem.registerCollision('segment', 'enemy', (segment, enemy) => {
            if (segment.damaging) {
                this.combatSystem.applyDamage(enemy.id, segment.damage);
                if (this.events) {
                    this.events.emit('WHIP_HIT', {
                        position: enemy.position,
                        damage: segment.damage
                    });
                }
            }
        });
    }

    update(currentTime) {
        if (this.isPaused) return;

        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;

        this.inputSystem.update();
        this.physicsSystem.update(deltaTime);
        this.collisionSystem.update();

        const snake = this.entityManager.getByType('snake')[0];
        if (snake) {
            this.combatSystem.update(currentTime, snake);
        }

        this.whipEffect.update(deltaTime);
        this.damageIndicator.update(deltaTime);
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.whipEffect.render();
        this.damageIndicator.render();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.lastUpdateTime = Date.now();
    }

    cleanup() {
        this.entityManager.clear();
        this.physicsSystem.clear();
        this.inputSystem.clear();
        this.collisionSystem.clear();
    }
}
