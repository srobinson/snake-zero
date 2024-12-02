import { EventSystem } from '../../core-ts/EventSystem';

interface TimeConfig {
    startPaused?: boolean;
    timeScale?: number;
    maxDeltaTime?: number;
}

interface Timer {
    id: string;
    duration: number;
    elapsed: number;
    repeat: boolean;
    callback: () => void;
    paused: boolean;
}

export class TimeSystem {
    private eventSystem: EventSystem;
    private paused: boolean;
    private timeScale: number;
    private maxDeltaTime: number;
    private timers: Map<string, Timer>;
    private nextTimerId: number;
    private lastUpdateTime: number;
    private totalTime: number;

    constructor(eventSystem: EventSystem, config: TimeConfig = {}) {
        this.eventSystem = eventSystem;
        this.paused = config.startPaused || false;
        this.timeScale = config.timeScale || 1;
        this.maxDeltaTime = config.maxDeltaTime || 100;
        this.timers = new Map();
        this.nextTimerId = 1;
        this.lastUpdateTime = performance.now();
        this.totalTime = 0;

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.eventSystem.on('pause', () => this.pause());
        this.eventSystem.on('resume', () => this.resume());
        this.eventSystem.on('timeScaleChanged', (scale: number) => this.setTimeScale(scale));
    }

    createTimer(
        duration: number,
        callback: () => void,
        repeat: boolean = false
    ): string {
        const id = `timer_${this.nextTimerId++}`;
        const timer: Timer = {
            id,
            duration,
            elapsed: 0,
            repeat,
            callback,
            paused: this.paused
        };

        this.timers.set(id, timer);
        return id;
    }

    removeTimer(id: string): void {
        this.timers.delete(id);
    }

    pauseTimer(id: string): void {
        const timer = this.timers.get(id);
        if (timer) {
            timer.paused = true;
        }
    }

    resumeTimer(id: string): void {
        const timer = this.timers.get(id);
        if (timer) {
            timer.paused = false;
        }
    }

    resetTimer(id: string): void {
        const timer = this.timers.get(id);
        if (timer) {
            timer.elapsed = 0;
        }
    }

    getTimerProgress(id: string): number {
        const timer = this.timers.get(id);
        if (!timer) return 0;
        return timer.elapsed / timer.duration;
    }

    getTimerRemaining(id: string): number {
        const timer = this.timers.get(id);
        if (!timer) return 0;
        return Math.max(0, timer.duration - timer.elapsed);
    }

    update(rawDeltaTime: number): void {
        const now = performance.now();
        const deltaTime = Math.min(
            rawDeltaTime * this.timeScale,
            this.maxDeltaTime
        );

        if (!this.paused) {
            this.totalTime += deltaTime;

            // Update timers
            this.timers.forEach(timer => {
                if (timer.paused) return;

                timer.elapsed += deltaTime;
                if (timer.elapsed >= timer.duration) {
                    try {
                        timer.callback();
                    } catch (error) {
                        console.error('Error in timer callback:', error);
                    }

                    if (timer.repeat) {
                        timer.elapsed = 0;
                    } else {
                        this.timers.delete(timer.id);
                    }
                }
            });
        }

        this.lastUpdateTime = now;
    }

    pause(): void {
        if (this.paused) return;
        this.paused = true;
        this.eventSystem.emit('timePaused', null);
    }

    resume(): void {
        if (!this.paused) return;
        this.paused = false;
        this.lastUpdateTime = performance.now();
        this.eventSystem.emit('timeResumed', null);
    }

    isPaused(): boolean {
        return this.paused;
    }

    setTimeScale(scale: number): void {
        this.timeScale = Math.max(0, scale);
        this.eventSystem.emit('timeScaleChanged', { scale: this.timeScale });
    }

    getTimeScale(): number {
        return this.timeScale;
    }

    getTotalTime(): number {
        return this.totalTime;
    }

    getFormattedTime(): string {
        const totalSeconds = Math.floor(this.totalTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    clear(): void {
        this.timers.clear();
        this.totalTime = 0;
        this.lastUpdateTime = performance.now();
    }

    toJSON(): object {
        return {
            paused: this.paused,
            timeScale: this.timeScale,
            activeTimers: this.timers.size,
            totalTime: this.totalTime,
            formattedTime: this.getFormattedTime()
        };
    }
}
