import { EventSystem } from './EventSystem';

interface GameLoopConfig {
    maxFPS?: number;
    slowMotionFactor?: number;
    panicThreshold?: number;
}

type SystemUpdateFn = (deltaTime: number) => void;

export class GameLoop {
    private eventSystem: EventSystem;
    private systems: SystemUpdateFn[];
    private running: boolean;
    private lastTime: number;
    private frameTime: number;
    private slowMotionFactor: number;
    private panicThreshold: number;
    private accumulator: number;
    private frames: number;
    private lastFPSUpdate: number;
    private currentFPS: number;
    private animationFrameId: number | null;

    constructor(eventSystem: EventSystem, config: GameLoopConfig = {}) {
        this.eventSystem = eventSystem;
        this.systems = [];
        this.running = false;
        this.lastTime = 0;
        this.frameTime = 1000 / (config.maxFPS || 60);
        this.slowMotionFactor = config.slowMotionFactor || 1;
        this.panicThreshold = config.panicThreshold || 300;
        this.accumulator = 0;
        this.frames = 0;
        this.lastFPSUpdate = 0;
        this.currentFPS = 0;
        this.animationFrameId = null;

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.eventSystem.on('pause', () => this.pause());
        this.eventSystem.on('resume', () => this.resume());
        this.eventSystem.on('slowMotion', (factor: number) => this.setSlowMotion(factor));
    }

    addSystem(system: SystemUpdateFn): void {
        this.systems.push(system);
    }

    removeSystem(system: SystemUpdateFn): void {
        const index = this.systems.indexOf(system);
        if (index !== -1) {
            this.systems.splice(index, 1);
        }
    }

    start(): void {
        if (this.running) return;
        
        this.running = true;
        this.lastTime = performance.now();
        this.lastFPSUpdate = this.lastTime;
        this.frames = 0;
        this.accumulator = 0;
        
        this.tick();
        this.eventSystem.emit('gameLoopStarted', null);
    }

    private tick = (): void => {
        if (!this.running) return;

        const currentTime = performance.now();
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Update FPS counter
        this.frames++;
        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.currentFPS = Math.round((this.frames * 1000) / (currentTime - this.lastFPSUpdate));
            this.frames = 0;
            this.lastFPSUpdate = currentTime;
            this.eventSystem.emit('fpsUpdated', { fps: this.currentFPS });
        }

        // Handle spiral of death
        if (deltaTime > this.panicThreshold) {
            console.warn('Game loop panic, skipping frame');
            this.eventSystem.emit('gameLoopPanic', { deltaTime });
            this.accumulator = 0;
            this.animationFrameId = requestAnimationFrame(this.tick);
            return;
        }

        // Apply slow motion
        deltaTime *= this.slowMotionFactor;

        // Fixed timestep accumulator
        this.accumulator += deltaTime;

        // Update systems
        while (this.accumulator >= this.frameTime) {
            try {
                this.systems.forEach(system => system(this.frameTime));
            } catch (error) {
                console.error('Error in game loop update:', error);
                this.eventSystem.emit('gameLoopError', { error });
            }
            this.accumulator -= this.frameTime;
        }

        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(this.tick);
    };

    pause(): void {
        if (!this.running) return;
        
        this.running = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.eventSystem.emit('gameLoopPaused', null);
    }

    resume(): void {
        if (this.running) return;
        
        this.running = true;
        this.lastTime = performance.now();
        this.tick();
        
        this.eventSystem.emit('gameLoopResumed', null);
    }

    setSlowMotion(factor: number): void {
        this.slowMotionFactor = Math.max(0.1, Math.min(1, factor));
        this.eventSystem.emit('slowMotionChanged', { factor: this.slowMotionFactor });
    }

    setMaxFPS(fps: number): void {
        this.frameTime = 1000 / Math.max(1, fps);
    }

    getFPS(): number {
        return this.currentFPS;
    }

    isRunning(): boolean {
        return this.running;
    }

    destroy(): void {
        this.pause();
        this.systems = [];
    }

    toJSON(): object {
        return {
            running: this.running,
            fps: this.currentFPS,
            slowMotionFactor: this.slowMotionFactor,
            systemCount: this.systems.length
        };
    }
}
