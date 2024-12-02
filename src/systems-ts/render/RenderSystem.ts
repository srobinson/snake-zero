import { Entity, Vector2D } from '../../types-ts/commonTypes';
import { EntityManager } from '../../core-ts/EntityManager';
import { EventSystem } from '../../core-ts/EventSystem';

interface RenderConfig {
    canvas: HTMLCanvasElement;
    backgroundColor?: string;
    gridColor?: string;
    showGrid?: boolean;
}

interface RenderComponent {
    color: string;
    size: number;
    shape?: 'circle' | 'square';
    alpha?: number;
    layer?: number;
    effects?: {
        glow?: boolean;
        glowColor?: string;
        glowSize?: number;
        pulse?: boolean;
        pulseSpeed?: number;
        pulseMin?: number;
        pulseMax?: number;
    };
}

export class RenderSystem {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private entityManager: EntityManager;
    private eventSystem: EventSystem;
    private backgroundColor: string;
    private gridColor: string;
    private showGrid: boolean;
    private lastFrameTime: number;
    private frameCount: number;
    private fps: number;

    constructor(
        entityManager: EntityManager, 
        eventSystem: EventSystem,
        config: RenderConfig
    ) {
        this.canvas = config.canvas;
        this.ctx = this.canvas.getContext('2d')!;
        this.entityManager = entityManager;
        this.eventSystem = eventSystem;
        this.backgroundColor = config.backgroundColor || '#000000';
        this.gridColor = config.gridColor || '#333333';
        this.showGrid = config.showGrid || false;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;

        // Set up event listeners
        this.eventSystem.on('windowResize', this.handleResize.bind(this));
    }

    private handleResize(dimensions: { width: number; height: number }): void {
        this.canvas.width = dimensions.width;
        this.canvas.height = dimensions.height;
    }

    private drawGrid(): void {
        if (!this.showGrid) return;

        const grid = this.entityManager.getGrid();
        const { width, height, cellSize } = grid;

        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 0.5;

        for (let x = 0; x <= width; x++) {
            const xPos = x * cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(xPos, 0);
            this.ctx.lineTo(xPos, height * cellSize);
            this.ctx.stroke();
        }

        for (let y = 0; y <= height; y++) {
            const yPos = y * cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, yPos);
            this.ctx.lineTo(width * cellSize, yPos);
            this.ctx.stroke();
        }
    }

    private drawEntity(entity: Entity): void {
        const component = this.entityManager.getComponent<RenderComponent>(entity.id);
        if (!component) return;

        const { position } = entity;
        const {
            color,
            size,
            shape = 'square',
            alpha = 1,
            effects = {}
        } = component;

        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        // Apply effects
        if (effects.glow) {
            const glowSize = effects.glowSize || size * 0.5;
            const glowColor = effects.glowColor || color;
            
            this.ctx.shadowBlur = glowSize;
            this.ctx.shadowColor = glowColor;
        }

        if (effects.pulse) {
            const now = performance.now();
            const speed = effects.pulseSpeed || 1000;
            const min = effects.pulseMin || 0.8;
            const max = effects.pulseMax || 1.2;
            const scale = min + (Math.sin(now / speed) + 1) * (max - min) / 2;
            this.ctx.scale(scale, scale);
        }

        this.ctx.fillStyle = color;

        if (shape === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(position.x, position.y, size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            const halfSize = size / 2;
            this.ctx.fillRect(
                position.x - halfSize,
                position.y - halfSize,
                size,
                size
            );
        }

        this.ctx.restore();
    }

    update(deltaTime: number): void {
        // Clear canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Get all entities with render components, sorted by layer
        const renderableEntities = this.entityManager
            .getEntitiesWithComponent('render')
            .sort((a, b) => {
                const compA = this.entityManager.getComponent<RenderComponent>(a.id);
                const compB = this.entityManager.getComponent<RenderComponent>(b.id);
                return (compA?.layer || 0) - (compB?.layer || 0);
            });

        // Draw entities
        for (const entity of renderableEntities) {
            this.drawEntity(entity);
        }

        // Update FPS counter
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFrameTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
            this.frameCount = 0;
            this.lastFrameTime = now;
        }
    }

    setShowGrid(show: boolean): void {
        this.showGrid = show;
    }

    setBackgroundColor(color: string): void {
        this.backgroundColor = color;
    }

    setGridColor(color: string): void {
        this.gridColor = color;
    }

    getFPS(): number {
        return this.fps;
    }

    getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    toJSON(): object {
        return {
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            fps: this.fps,
            showGrid: this.showGrid
        };
    }
}
