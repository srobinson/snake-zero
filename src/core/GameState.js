/**
 * @typedef {'playing'|'paused'|'gameover'} GameStateType
 */

/**
 * @typedef {Object} ScoringConfig
 * @property {number} comboTimeWindow - Time window in milliseconds for combo scoring
 * @property {number} comboMultiplier - Multiplier applied to points for each combo level
 */

/**
 * @typedef {Object} ScoreResult
 * @property {number} points - Points earned from the scoring action
 * @property {number} combo - Current combo level after the scoring action
 */

/**
 * Manages the game's state including score, time, and combo system.
 * Handles game flow (play/pause/gameover) and scoring mechanics.
 * @class
 */
export class GameState {
    /** @type {GameStateType} */
    state;
    
    /** @type {number} */
    startTime;
    
    /** @type {number} */
    pauseTime;
    
    /** @type {number} */
    score;
    
    /** @type {number} */
    combo;
    
    /** @type {number} */
    lastScoreTime;

    /**
     * Resets the game state to initial values.
     * Sets state to 'playing', resets score, combo, and timing.
     */
    constructor() {
        this.reset();
    }

    /**
     * Resets the game state to initial values.
     * Sets state to 'playing', resets score, combo, and timing.
     */
    reset() {
        this.state = 'playing';
        this.startTime = Date.now();
        this.pauseTime = 0;
        this.score = 0;
        this.combo = 0;
        this.lastScoreTime = 0;
    }

    /**
     * Pauses the game if currently playing.
     * Records the pause time for accurate play time tracking.
     */
    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.pauseTime = Date.now();
        }
    }

    /**
     * Resumes the game if currently paused.
     * Adjusts start time to account for pause duration.
     */
    resume() {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.startTime += Date.now() - this.pauseTime;
            this.pauseTime = 0;
        }
    }

    /**
     * Sets the game state to game over.
     */
    gameOver() {
        this.state = 'gameover';
    }

    /**
     * Checks if the game is currently in playing state.
     * @returns {boolean} True if game is in playing state
     */
    isPlaying() {
        return this.state === 'playing';
    }

    /**
     * Checks if the game is currently paused.
     * @returns {boolean} True if game is paused
     */
    isPaused() {
        return this.state === 'paused';
    }

    /**
     * Checks if the game is in game over state.
     * @returns {boolean} True if game is in game over state
     */
    isGameOver() {
        return this.state === 'gameover';
    }

    /**
     * Gets the current play time in milliseconds.
     * Accounts for paused time if game is paused.
     * @returns {number} Play time in milliseconds
     */
    getPlayTime() {
        if (this.state === 'paused') {
            return this.pauseTime - this.startTime;
        }
        return Date.now() - this.startTime;
    }

    /**
     * Adds points to the score with combo system.
     * Points are multiplied based on combo timing and multiplier.
     * @param {number} points - Base points to add
     * @param {Object} config - Game configuration object
     * @param {ScoringConfig} config.scoring - Scoring configuration
     * @returns {ScoreResult} Result containing points earned and current combo
     */
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

    /**
     * Gets the current score.
     * @returns {number} Current score
     */
    getScore() {
        return this.score;
    }

    /**
     * Gets the current combo level.
     * @returns {number} Current combo level
     */
    getCombo() {
        return this.combo;
    }
}
