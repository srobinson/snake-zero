export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.state = 'playing';
        this.startTime = Date.now();
        this.pauseTime = 0;
        this.score = 0;
        this.combo = 0;
        this.lastScoreTime = 0;
    }

    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.pauseTime = Date.now();
        }
    }

    resume() {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.startTime += Date.now() - this.pauseTime;
            this.pauseTime = 0;
        }
    }

    gameOver() {
        this.state = 'gameover';
    }

    isPlaying() {
        return this.state === 'playing';
    }

    isPaused() {
        return this.state === 'paused';
    }

    isGameOver() {
        return this.state === 'gameover';
    }

    getPlayTime() {
        if (this.state === 'paused') {
            return this.pauseTime - this.startTime;
        }
        return Date.now() - this.startTime;
    }

    addScore(points, config) {
        const now = Date.now();
        
        // Check for combo using flat config
        const comboTimeWindow = config.comboTimeWindow || 2000;  // Default 2 seconds
        const comboMultiplier = config.comboMultiplier || 1.5;   // Default 1.5x
        
        if (now - this.lastScoreTime < comboTimeWindow) {
            this.combo++;
            points *= Math.pow(comboMultiplier, this.combo);
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

    getScore() {
        return this.score;
    }

    getCombo() {
        return this.combo;
    }
}
