import type { GameStateType, GameConfig, ScoreResult } from '../types-ts/gameStateTypes';

export class GameState {
    private state: GameStateType;
    private startTime: number;
    private pauseTime: number;
    private score: number;
    private combo: number;
    private lastScoreTime: number;

    constructor() {
        this.reset();
    }

    public reset(): void {
        this.state = 'playing';
        this.startTime = Date.now();
        this.pauseTime = 0;
        this.score = 0;
        this.combo = 0;
        this.lastScoreTime = 0;
    }

    public pause(): void {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.pauseTime = Date.now();
        }
    }

    public resume(): void {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.startTime += Date.now() - this.pauseTime;
            this.pauseTime = 0;
        }
    }

    public gameOver(): void {
        this.state = 'gameover';
    }

    public isPlaying(): boolean {
        return this.state === 'playing';
    }

    public isPaused(): boolean {
        return this.state === 'paused';
    }

    public isGameOver(): boolean {
        return this.state === 'gameover';
    }

    public getPlayTime(): number {
        if (this.state === 'paused') {
            return this.pauseTime - this.startTime;
        }
        return Date.now() - this.startTime;
    }

    public addScore(points: number, config: GameConfig): ScoreResult {
        const now = Date.now();
        
        // Check for combo
        if (now - this.lastScoreTime < config.scoring.comboTimeWindow) {
            this.combo++;
            points *= Math.pow(config.scoring.comboMultiplier, this.combo);
        } else {
            this.combo = 0;
        }

        this.score += Math.round(points);
        this.lastScoreTime = now;
        
        return {
            points: Math.round(points),
            combo: this.combo
        };
    }

    public getScore(): number {
        return this.score;
    }

    public getCombo(): number {
        return this.combo;
    }
}
