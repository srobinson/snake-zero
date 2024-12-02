import { Vector2D } from '../../types-ts/commonTypes';
import { EntityManager } from '../../core-ts/EntityManager';
import { EventSystem } from '../../core-ts/EventSystem';
import { CameraSystem } from '../camera/CameraSystem';

interface DebugConfig {
    enabled?: boolean;
    showGrid?: boolean;
    showColliders?: boolean;
    showVelocities?: boolean;
    showFPS?: boolean;
    showEntityCount?: boolean;
    colors?: {
        grid: string;
        collider: string;
        velocity: string;
        text: string;
    };
}

interface DebugCommand {
    name: string;
    description: string;
    execute: (...args: any[]) => void;
}

export class DebugSystem {
    private entityManager: EntityManager;
    private eventSystem: EventSystem;
    private cameraSystem: CameraSystem;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private enabled: boolean;
    private showGrid: boolean;
    private showColliders: boolean;
    private showVelocities: boolean;
    private showFPS: boolean;
    private showEntityCount: boolean;
    private colors: Required<DebugConfig>['colors'];
    private commands: Map<string, DebugCommand>;
    private fps: number;
    private fpsUpdateTime: number;
    private frameCount: number;

    constructor(
        entityManager: EntityManager,
        eventSystem: EventSystem,
        cameraSystem: CameraSystem,
        canvas: HTMLCanvasElement,
        config: DebugConfig = {}
    ) {
        this.entityManager = entityManager;
        this.eventSystem = eventSystem;
        this.cameraSystem = cameraSystem;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        
        this.enabled = config.enabled ?? false;
        this.showGrid = config.showGrid ?? true;
        this.showColliders = config.showColliders ?? true;
        this.showVelocities = config.showVelocities ?? true;
        this.showFPS = config.showFPS ?? true;
        this.showEntityCount = config.showEntityCount ?? true;
        
        this.colors = {
            grid: '#333333',
            collider: '#ff0000',
            velocity: '#00ff00',
            text: '#ffffff',
            ...config.colors
        };

        this.commands = new Map();
        this.fps = 0;
        this.fpsUpdateTime = 0;
        this.frameCount = 0;

        this.setupCommands();
        this.setupEventListeners();

        // Register global debug access if enabled
        if (this.enabled) {
            (window as any).debug = this;
        }
    }

    private setupEventListeners(): void {
        // Listen for FPS updates
        this.eventSystem.on('fpsUpdated', (data: { fps: number }) => {
            this.fps = data.fps;
        });

        // Listen for keyboard shortcuts
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (!this.enabled) return;

            switch (e.key) {
                case '1':
                    this.showGrid = !this.showGrid;
                    break;
                case '2':
                    this.showColliders = !this.showColliders;
                    break;
                case '3':
                    this.showVelocities = !this.showVelocities;
                    break;
                case '4':
                    this.showFPS = !this.showFPS;
                    break;
                case '5':
                    this.showEntityCount = !this.showEntityCount;
                    break;
            }
        });
    }

    private setupCommands(): void {
        this.registerCommand({
            name: 'toggleGrid',
            description: 'Toggle grid visibility',
            execute: () => this.showGrid = !this.showGrid
        });

        this.registerCommand({
            name: 'toggleColliders',
            description: 'Toggle collider visibility',
            execute: () => this.showColliders = !this.showColliders
        });

        this.registerCommand({
            name: 'toggleVelocities',
            description: 'Toggle velocity vectors visibility',
            execute: () => this.showVelocities = !this.showVelocities
        });

        this.registerCommand({
            name: 'listEntities',
            description: 'List all entities and their components',
            execute: () => {
                const entities = this.entityManager.getAllEntities();
                console.table(entities.map(e => ({
                    id: e.id,
                    position: e.position,
                    components: Object.keys(this.entityManager.getComponent(e.id) || {})
                })));
            }
        });

        this.registerCommand({
            name: 'inspectEntity',
            description: 'Inspect a specific entity by ID',
            execute: (entityId: string) => {
                const entity = this.entityManager.getEntity(entityId);
                const components = this.entityManager.getComponent(entityId);
                console.log({ entity, components });
            }
        });
    }

    registerCommand(command: DebugCommand): void {
        this.commands.set(command.name, command);
    }

    executeCommand(name: string, ...args: any[]): void {
        const command = this.commands.get(name);
        if (command) {
            command.execute(...args);
        } else {
            console.warn(`Unknown debug command: ${name}`);
        }
    }

    private drawGrid(): void {
        const grid = this.entityManager.getGrid();
        const { width, height, cellSize } = grid;

        this.ctx.strokeStyle = this.colors.grid;
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

    private drawColliders(): void {
        const entities = this.entityManager.getAllEntities();

        this.ctx.strokeStyle = this.colors.collider;
        this.ctx.lineWidth = 1;

        entities.forEach(entity => {
            const components = this.entityManager.getComponent(entity.id);
            if (!components?.collision) return;

            const { position } = entity;
            const { size } = components.collision;

            this.ctx.beginPath();
            this.ctx.arc(position.x, position.y, size / 2, 0, Math.PI * 2);
            this.ctx.stroke();
        });
    }

    private drawVelocities(): void {
        const entities = this.entityManager.getAllEntities();

        this.ctx.strokeStyle = this.colors.velocity;
        this.ctx.lineWidth = 2;

        entities.forEach(entity => {
            const components = this.entityManager.getComponent(entity.id);
            if (!components?.physics?.velocity) return;

            const { position } = entity;
            const { velocity } = components.physics;
            const length = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            
            if (length === 0) return;

            const scale = 20; // Scale factor for velocity vectors
            const endX = position.x + (velocity.x / length) * scale;
            const endY = position.y + (velocity.y / length) * scale;

            // Draw line
            this.ctx.beginPath();
            this.ctx.moveTo(position.x, position.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();

            // Draw arrowhead
            const angle = Math.atan2(velocity.y, velocity.x);
            const arrowSize = 5;
            
            this.ctx.beginPath();
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(
                endX - arrowSize * Math.cos(angle - Math.PI / 6),
                endY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.lineTo(
                endX - arrowSize * Math.cos(angle + Math.PI / 6),
                endY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.closePath();
            this.ctx.fill();
        });
    }

    private drawStats(): void {
        const camera = this.cameraSystem;
        const screenPos = camera.worldToScreen({ x: 10, y: 20 });
        let y = screenPos.y;
        const lineHeight = 20;

        this.ctx.save();
        this.ctx.resetTransform();
        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = this.colors.text;
        this.ctx.textAlign = 'left';

        if (this.showFPS) {
            this.ctx.fillText(`FPS: ${this.fps}`, 10, y);
            y += lineHeight;
        }

        if (this.showEntityCount) {
            const count = this.entityManager.getAllEntities().length;
            this.ctx.fillText(`Entities: ${count}`, 10, y);
        }

        this.ctx.restore();
    }

    update(deltaTime: number): void {
        if (!this.enabled) return;

        // Save current transform
        this.ctx.save();

        // Draw debug visuals
        if (this.showGrid) {
            this.drawGrid();
        }

        if (this.showColliders) {
            this.drawColliders();
        }

        if (this.showVelocities) {
            this.drawVelocities();
        }

        // Draw stats (with screen-space coordinates)
        this.drawStats();

        // Restore original transform
        this.ctx.restore();
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (enabled) {
            (window as any).debug = this;
        } else {
            delete (window as any).debug;
        }
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    getCommands(): Map<string, DebugCommand> {
        return this.commands;
    }

    toJSON(): object {
        return {
            enabled: this.enabled,
            showGrid: this.showGrid,
            showColliders: this.showColliders,
            showVelocities: this.showVelocities,
            showFPS: this.showFPS,
            showEntityCount: this.showEntityCount,
            fps: this.fps,
            commandCount: this.commands.size
        };
    }
}
