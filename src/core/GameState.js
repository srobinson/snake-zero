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

    getScore() {
        return this.score;
    }

    getCombo() {
        return this.combo;
    }
}
