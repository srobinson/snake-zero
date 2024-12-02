import { Vector2D } from '../../types-ts/commonTypes';
import { EntityManager } from '../../core-ts/EntityManager';
import { EventSystem } from '../../core-ts/EventSystem';

interface CameraConfig {
    canvas: HTMLCanvasElement;
    target?: string;
    smoothing?: number;
    zoomLevel?: number;
    minZoom?: number;
    maxZoom?: number;
    bounds?: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
    shake?: {
        duration: number;
        intensity: number;
        decay: number;
    };
}

interface ShakeState {
    duration: number;
    intensity: number;
    decay: number;
    startTime: number;
    offsetX: number;
    offsetY: number;
}

export class CameraSystem {
    private entityManager: EntityManager;
    private eventSystem: EventSystem;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private position: Vector2D;
    private targetPosition: Vector2D;
    private targetEntityId: string | null;
    private smoothing: number;
    private zoomLevel: number;
    private minZoom: number;
    private maxZoom: number;
    private bounds: CameraConfig['bounds'];
    private shakeConfig: Required<CameraConfig>['shake'];
    private activeShake: ShakeState | null;
    private transform: DOMMatrix;

    constructor(
        entityManager: EntityManager,
        eventSystem: EventSystem,
        config: CameraConfig
    ) {
        this.entityManager = entityManager;
        this.eventSystem = eventSystem;
        this.canvas = config.canvas;
        this.ctx = this.canvas.getContext('2d')!;
        this.position = { x: 0, y: 0 };
        this.targetPosition = { x: 0, y: 0 };
        this.targetEntityId = config.target || null;
        this.smoothing = config.smoothing || 0.1;
        this.zoomLevel = config.zoomLevel || 1;
        this.minZoom = config.minZoom || 0.5;
        this.maxZoom = config.maxZoom || 2;
        this.bounds = config.bounds;
        this.shakeConfig = {
            duration: 500,
            intensity: 10,
            decay: 0.9,
            ...config.shake
        };
        this.activeShake = null;
        this.transform = new DOMMatrix();

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.eventSystem.on('collision', this.handleCollision.bind(this));
        this.eventSystem.on('powerUpStarted', () => this.shake(0.5));
        this.eventSystem.on('snakeDied', () => this.shake(1.0));
        this.eventSystem.on('windowResize', this.handleResize.bind(this));
    }

    private handleCollision(data: { type1: string; type2: string }): void {
        const types = [data.type1, data.type2];
        if (types.includes('snake_head') && types.includes('wall')) {
            this.shake(0.7);
        }
    }

    private handleResize(): void {
        this.updateTransform();
    }

    setTarget(entityId: string | null): void {
        this.targetEntityId = entityId;
        if (!entityId) {
            this.targetPosition = { ...this.position };
        }
    }

    setPosition(position: Vector2D): void {
        this.position = { ...position };
        this.targetPosition = { ...position };
        this.updateTransform();
    }

    setZoom(level: number): void {
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        this.updateTransform();
    }

    shake(intensity: number = 1): void {
        this.activeShake = {
            duration: this.shakeConfig.duration,
            intensity: this.shakeConfig.intensity * intensity,
            decay: this.shakeConfig.decay,
            startTime: performance.now(),
            offsetX: 0,
            offsetY: 0
        };
    }

    private updateShake(deltaTime: number): void {
        if (!this.activeShake) return;

        const elapsed = performance.now() - this.activeShake.startTime;
        if (elapsed >= this.activeShake.duration) {
            this.activeShake = null;
            return;
        }

        const progress = elapsed / this.activeShake.duration;
        const intensity = this.activeShake.intensity * Math.pow(1 - progress, 2);

        this.activeShake.offsetX = (Math.random() * 2 - 1) * intensity;
        this.activeShake.offsetY = (Math.random() * 2 - 1) * intensity;
    }

    private updateTransform(): void {
        const canvas = this.canvas;
        const position = this.position;
        const shake = this.activeShake;

        // Reset transform
        this.transform = new DOMMatrix();

        // Move to center of canvas
        this.transform = this.transform.translate(
            canvas.width / 2,
            canvas.height / 2
        );

        // Apply zoom
        this.transform = this.transform.scale(this.zoomLevel);

        // Apply shake
        if (shake) {
            this.transform = this.transform.translate(
                shake.offsetX,
                shake.offsetY
            );
        }

        // Move to camera position
        this.transform = this.transform.translate(
            -position.x,
            -position.y
        );
    }

    private clampPosition(position: Vector2D): Vector2D {
        if (!this.bounds) return position;

        return {
            x: Math.max(this.bounds.minX, Math.min(this.bounds.maxX, position.x)),
            y: Math.max(this.bounds.minY, Math.min(this.bounds.maxY, position.y))
        };
    }

    update(deltaTime: number): void {
        // Update target position if following an entity
        if (this.targetEntityId) {
            const target = this.entityManager.getEntity(this.targetEntityId);
            if (target) {
                this.targetPosition = { ...target.position };
            }
        }

        // Smooth camera movement
        const dx = this.targetPosition.x - this.position.x;
        const dy = this.targetPosition.y - this.position.y;

        this.position = this.clampPosition({
            x: this.position.x + dx * this.smoothing,
            y: this.position.y + dy * this.smoothing
        });

        // Update camera shake
        this.updateShake(deltaTime);

        // Update transform
        this.updateTransform();

        // Apply transform to context
        this.ctx.setTransform(this.transform);
    }

    screenToWorld(screenPos: Vector2D): Vector2D {
        const inverse = this.transform.inverse();
        const point = new DOMPoint(screenPos.x, screenPos.y);
        const transformed = point.matrixTransform(inverse);

        return {
            x: transformed.x,
            y: transformed.y
        };
    }

    worldToScreen(worldPos: Vector2D): Vector2D {
        const point = new DOMPoint(worldPos.x, worldPos.y);
        const transformed = point.matrixTransform(this.transform);

        return {
            x: transformed.x,
            y: transformed.y
        };
    }

    getPosition(): Vector2D {
        return { ...this.position };
    }

    getZoom(): number {
        return this.zoomLevel;
    }

    isShaking(): boolean {
        return this.activeShake !== null;
    }

    toJSON(): object {
        return {
            position: this.position,
            zoom: this.zoomLevel,
            targetEntity: this.targetEntityId,
            isShaking: this.isShaking()
        };
    }
}
