import { Entity, Vector2D } from '../../types-ts/commonTypes';
import { EntityManager } from '../../core-ts/EntityManager';
import { EventSystem } from '../../core-ts/EventSystem';
import { InputSystem } from '../input/InputSystem';

interface SnakeConfig {
    initialLength: number;
    initialPosition: Vector2D;
    segmentSize: number;
    moveSpeed: number;
    growthRate: number;
    colors: {
        head: string;
        body: string;
        tail: string;
    };
}

interface SnakeComponent {
    isHead: boolean;
    isTail: boolean;
    nextSegment?: string;
    prevSegment?: string;
    targetPosition?: Vector2D;
    moveSpeed: number;
    direction: Vector2D;
}

export class SnakeSystem {
    private entityManager: EntityManager;
    private eventSystem: EventSystem;
    private inputSystem: InputSystem;
    private config: SnakeConfig;
    private headEntityId: string | null;
    private tailEntityId: string | null;
    private length: number;
    private growing: number;
    private lastUpdateTime: number;
    private dead: boolean;

    constructor(
        entityManager: EntityManager,
        eventSystem: EventSystem,
        inputSystem: InputSystem,
        config: SnakeConfig
    ) {
        this.entityManager = entityManager;
        this.eventSystem = eventSystem;
        this.inputSystem = inputSystem;
        this.config = config;
        this.headEntityId = null;
        this.tailEntityId = null;
        this.length = 0;
        this.growing = 0;
        this.lastUpdateTime = 0;
        this.dead = false;

        // Set up event listeners
        this.eventSystem.on('collision', this.handleCollision.bind(this));
    }

    initialize(): void {
        this.dead = false;
        this.growing = 0;
        this.createInitialSnake();
    }

    private createInitialSnake(): void {
        const { initialPosition, initialLength, segmentSize, moveSpeed } = this.config;
        const { head: headColor, body: bodyColor, tail: tailColor } = this.config.colors;

        // Create head
        this.headEntityId = this.entityManager.createEntity({
            position: { ...initialPosition },
            render: {
                color: headColor,
                size: segmentSize,
                shape: 'square',
                layer: 2
            },
            snake: {
                isHead: true,
                isTail: false,
                moveSpeed,
                direction: { x: 1, y: 0 }
            },
            collision: {
                type: 'snake_head',
                size: segmentSize
            }
        });

        let prevSegment = this.headEntityId;
        let currentPos = { ...initialPosition };

        // Create body segments
        for (let i = 1; i < initialLength; i++) {
            currentPos = {
                x: initialPosition.x - i * segmentSize,
                y: initialPosition.y
            };

            const isLast = i === initialLength - 1;
            const segmentId = this.entityManager.createEntity({
                position: currentPos,
                render: {
                    color: isLast ? tailColor : bodyColor,
                    size: segmentSize,
                    shape: 'square',
                    layer: 1
                },
                snake: {
                    isHead: false,
                    isTail: isLast,
                    prevSegment,
                    moveSpeed,
                    direction: { x: 1, y: 0 }
                },
                collision: {
                    type: 'snake_body',
                    size: segmentSize
                }
            });

            // Update previous segment's next reference
            const prevComponent = this.entityManager.getComponent<SnakeComponent>(prevSegment);
            if (prevComponent) {
                prevComponent.nextSegment = segmentId;
                this.entityManager.updateComponent(prevSegment, { snake: prevComponent });
            }

            if (isLast) {
                this.tailEntityId = segmentId;
            }
            prevSegment = segmentId;
        }

        this.length = initialLength;
    }

    private handleCollision(data: { entity1: Entity; entity2: Entity; type1: string; type2: string }): void {
        if (this.dead) return;

        const { entity1, entity2, type1, type2 } = data;
        const headId = this.headEntityId;

        if (!headId) return;

        // Check for self-collision
        if ((entity1.id === headId && type2 === 'snake_body') ||
            (entity2.id === headId && type1 === 'snake_body')) {
            this.die();
            return;
        }

        // Check for food collision
        if ((entity1.id === headId && type2 === 'food') ||
            (entity2.id === headId && type1 === 'food')) {
            const foodEntity = type1 === 'food' ? entity1 : entity2;
            this.grow(this.config.growthRate);
            this.eventSystem.emit('foodEaten', { foodEntity });
        }
    }

    private grow(amount: number): void {
        this.growing += amount;
    }

    private die(): void {
        if (this.dead) return;
        this.dead = true;
        this.eventSystem.emit('snakeDied', null);
    }

    private updateSegment(entityId: string, deltaTime: number): void {
        const entity = this.entityManager.getEntity(entityId);
        const component = this.entityManager.getComponent<SnakeComponent>(entityId);
        
        if (!entity || !component) return;

        const { position } = entity;
        const { moveSpeed, targetPosition, direction } = component;

        if (targetPosition) {
            const dx = targetPosition.x - position.x;
            const dy = targetPosition.y - position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 1) {
                this.entityManager.updatePosition(entityId, targetPosition);
                component.targetPosition = undefined;
            } else {
                const moveDistance = moveSpeed * deltaTime;
                const ratio = Math.min(moveDistance / distance, 1);
                
                const newPosition = {
                    x: position.x + dx * ratio,
                    y: position.y + dy * ratio
                };
                
                this.entityManager.updatePosition(entityId, newPosition);
            }
        }
    }

    update(deltaTime: number): void {
        if (this.dead) return;

        const now = performance.now();
        if (now - this.lastUpdateTime < 16) return; // Cap at ~60 FPS
        this.lastUpdateTime = now;

        // Update head direction based on input
        if (this.headEntityId) {
            const headComponent = this.entityManager.getComponent<SnakeComponent>(this.headEntityId);
            if (headComponent) {
                const input = this.inputSystem.getMovementVector();
                if (input.x !== 0 || input.y !== 0) {
                    // Prevent 180-degree turns
                    if (Math.abs(input.x + headComponent.direction.x) > 0 ||
                        Math.abs(input.y + headComponent.direction.y) > 0) {
                        headComponent.direction = input;
                    }
                }
            }
        }

        // Update all segments
        let currentId = this.headEntityId;
        while (currentId) {
            const component = this.entityManager.getComponent<SnakeComponent>(currentId);
            if (!component) break;

            this.updateSegment(currentId, deltaTime);
            currentId = component.nextSegment;
        }

        // Handle growth
        if (this.growing > 0 && this.tailEntityId) {
            const tailEntity = this.entityManager.getEntity(this.tailEntityId);
            const tailComponent = this.entityManager.getComponent<SnakeComponent>(this.tailEntityId);
            
            if (tailEntity && tailComponent) {
                const newTailId = this.entityManager.createEntity({
                    position: { ...tailEntity.position },
                    render: {
                        color: this.config.colors.tail,
                        size: this.config.segmentSize,
                        shape: 'square',
                        layer: 1
                    },
                    snake: {
                        isHead: false,
                        isTail: true,
                        prevSegment: this.tailEntityId,
                        moveSpeed: this.config.moveSpeed,
                        direction: { ...tailComponent.direction }
                    },
                    collision: {
                        type: 'snake_body',
                        size: this.config.segmentSize
                    }
                });

                // Update old tail
                tailComponent.isTail = false;
                tailComponent.nextSegment = newTailId;
                this.entityManager.updateComponent(this.tailEntityId, { snake: tailComponent });

                // Update render color of old tail
                const oldTailRender = this.entityManager.getComponent(this.tailEntityId);
                if (oldTailRender) {
                    oldTailRender.render.color = this.config.colors.body;
                    this.entityManager.updateComponent(this.tailEntityId, { render: oldTailRender.render });
                }

                this.tailEntityId = newTailId;
                this.length++;
                this.growing--;
            }
        }
    }

    getLength(): number {
        return this.length;
    }

    isDead(): boolean {
        return this.dead;
    }

    getHeadPosition(): Vector2D | null {
        if (!this.headEntityId) return null;
        const head = this.entityManager.getEntity(this.headEntityId);
        return head ? head.position : null;
    }

    getHeadDirection(): Vector2D | null {
        if (!this.headEntityId) return null;
        const component = this.entityManager.getComponent<SnakeComponent>(this.headEntityId);
        return component ? component.direction : null;
    }

    destroy(): void {
        let currentId = this.headEntityId;
        while (currentId) {
            const component = this.entityManager.getComponent<SnakeComponent>(currentId);
            const nextId = component?.nextSegment;
            this.entityManager.removeEntity(currentId);
            currentId = nextId;
        }

        this.headEntityId = null;
        this.tailEntityId = null;
        this.length = 0;
        this.growing = 0;
        this.dead = true;
    }

    toJSON(): object {
        return {
            length: this.length,
            growing: this.growing,
            dead: this.dead,
            headPosition: this.getHeadPosition(),
            headDirection: this.getHeadDirection()
        };
    }
}
