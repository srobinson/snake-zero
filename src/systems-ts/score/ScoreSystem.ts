import { EventSystem } from '../../core-ts/EventSystem';

interface ScoreConfig {
    basePoints: number;
    comboMultiplier: number;
    comboTimeWindow: number;
    highScoreKey?: string;
    maxHighScores?: number;
}

interface ScoreData {
    score: number;
    combo: number;
    multiplier: number;
    timestamp: number;
}

interface HighScore {
    score: number;
    date: number;
    combo: number;
}

export class ScoreSystem {
    private eventSystem: EventSystem;
    private config: ScoreConfig;
    private currentScore: number;
    private currentCombo: number;
    private lastScoreTime: number;
    private highScores: HighScore[];
    private storageKey: string;

    constructor(eventSystem: EventSystem, config: ScoreConfig) {
        this.eventSystem = eventSystem;
        this.config = {
            ...config,
            highScoreKey: config.highScoreKey || 'snakeHighScores',
            maxHighScores: config.maxHighScores || 10
        };
        this.currentScore = 0;
        this.currentCombo = 0;
        this.lastScoreTime = 0;
        this.storageKey = this.config.highScoreKey;
        this.highScores = this.loadHighScores();

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.eventSystem.on('foodEaten', this.handleFoodEaten.bind(this));
        this.eventSystem.on('powerUpCollected', this.handlePowerUpCollected.bind(this));
        this.eventSystem.on('enemyDefeated', this.handleEnemyDefeated.bind(this));
        this.eventSystem.on('snakeDied', this.handleGameEnd.bind(this));
    }

    private handleFoodEaten(data: { points?: number; isSpecial?: boolean }): void {
        const points = data.points || this.config.basePoints;
        this.addScore(points, data.isSpecial || false);
    }

    private handlePowerUpCollected(data: { points?: number }): void {
        const points = data.points || Math.floor(this.config.basePoints * 1.5);
        this.addScore(points, true);
    }

    private handleEnemyDefeated(data: { points?: number }): void {
        const points = data.points || Math.floor(this.config.basePoints * 2);
        this.addScore(points, true);
    }

    private handleGameEnd(): void {
        this.saveScore();
    }

    private addScore(points: number, isSpecial: boolean): void {
        const now = performance.now();
        
        // Update combo
        if (now - this.lastScoreTime <= this.config.comboTimeWindow) {
            this.currentCombo++;
        } else {
            this.currentCombo = 0;
        }
        
        // Calculate multiplier
        const multiplier = Math.pow(this.config.comboMultiplier, this.currentCombo);
        
        // Add score
        const finalPoints = Math.floor(points * multiplier);
        this.currentScore += finalPoints;
        
        // Update last score time
        this.lastScoreTime = now;
        
        // Emit score update event
        this.eventSystem.emit('scoreUpdated', {
            points: finalPoints,
            totalScore: this.currentScore,
            combo: this.currentCombo,
            multiplier,
            isSpecial
        });
    }

    private loadHighScores(): HighScore[] {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading high scores:', error);
            return [];
        }
    }

    private saveHighScores(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.highScores));
        } catch (error) {
            console.error('Error saving high scores:', error);
        }
    }

    private saveScore(): void {
        if (this.currentScore === 0) return;

        const newScore: HighScore = {
            score: this.currentScore,
            date: Date.now(),
            combo: this.currentCombo
        };

        // Add new score and sort
        this.highScores.push(newScore);
        this.highScores.sort((a, b) => b.score - a.score);

        // Keep only top scores
        if (this.highScores.length > this.config.maxHighScores!) {
            this.highScores.length = this.config.maxHighScores!;
        }

        // Save to localStorage
        this.saveHighScores();

        // Emit high score event if applicable
        if (this.isHighScore(this.currentScore)) {
            this.eventSystem.emit('newHighScore', {
                score: this.currentScore,
                rank: this.getScoreRank(this.currentScore)
            });
        }
    }

    isHighScore(score: number): boolean {
        return this.highScores.length < this.config.maxHighScores! ||
               score > this.highScores[this.highScores.length - 1].score;
    }

    getScoreRank(score: number): number {
        return this.highScores.findIndex(hs => score > hs.score) + 1;
    }

    getCurrentScore(): number {
        return this.currentScore;
    }

    getCurrentCombo(): number {
        return this.currentCombo;
    }

    getHighScores(): HighScore[] {
        return [...this.highScores];
    }

    clearHighScores(): void {
        this.highScores = [];
        this.saveHighScores();
        this.eventSystem.emit('highScoresCleared', null);
    }

    reset(): void {
        this.currentScore = 0;
        this.currentCombo = 0;
        this.lastScoreTime = 0;
        this.eventSystem.emit('scoreReset', null);
    }

    toJSON(): object {
        return {
            currentScore: this.currentScore,
            currentCombo: this.currentCombo,
            highScores: this.highScores,
            isNewHighScore: this.isHighScore(this.currentScore)
        };
    }
}
