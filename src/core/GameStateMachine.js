import { GameEvents } from './EventSystem.js';

/**
 * Possible game states
 */
export const GameStates = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

/**
 * Game state machine that handles state transitions and associated logic
 */
export class GameStateMachine {
    constructor(game) {
        if (!game) throw new Error('Game is required for GameStateMachine');
        
        // Validate game interface
        const requiredMethods = ['getConfig', 'getEvents', 'reset'];
        for (const method of requiredMethods) {
            if (typeof game[method] !== 'function') {
                throw new Error(`Game must implement ${method} method`);
            }
        }
        
        this.game = game;
        this.state = GameStates.MENU;
        this.startTime = 0;
        this.pauseTime = 0;
        this.score = 0;
        this.highScore = this.loadHighScore();
    }

    /**
     * Validates the game interface
     */
    validateGameInterface() {
        const requiredMethods = ['getEvents', 'reset'];
        for (const method of requiredMethods) {
            if (typeof this.game[method] !== 'function') {
                throw new Error(`Game must implement ${method} method`);
            }
        }
    }

    validateState(state) {
        if (!Object.values(GameStates).includes(state)) {
            throw new Error(`Invalid game state: ${state}`);
        }
    }

    /**
     * Transitions to a new state if valid
     * @param {string} newState - The state to transition to
     * @returns {boolean} Whether the transition was successful
     */
    transition(newState) {
        try {
            this.validateState(newState);
        } catch (error) {
            console.error(error);
            return false;
        }

        // Define valid transitions
        const validTransitions = {
            [GameStates.MENU]: [GameStates.PLAYING],
            [GameStates.PLAYING]: [GameStates.PAUSED, GameStates.GAME_OVER],
            [GameStates.PAUSED]: [GameStates.PLAYING, GameStates.MENU],
            [GameStates.GAME_OVER]: [GameStates.MENU]
        };

        if (!validTransitions[this.state]?.includes(newState)) {
            console.warn(`Invalid state transition: ${this.state} -> ${newState}`);
            return false;
        }

        // Handle state exit
        try {
            switch (this.state) {
                case GameStates.PLAYING:
                    if (newState === GameStates.PAUSED) {
                        this.pauseTime = Date.now();
                    }
                    break;
            }

            // Handle state enter
            switch (newState) {
                case GameStates.PLAYING:
                    if (this.state === GameStates.MENU) {
                        this.startTime = Date.now();
                        this.score = 0;
                        this.game.getEvents().emit(GameEvents.SCORE_CHANGED, this.score);
                        this.game.reset();
                    } else if (this.state === GameStates.PAUSED) {
                        const pauseDuration = Date.now() - this.pauseTime;
                        this.startTime += pauseDuration;
                    }
                    break;
                case GameStates.GAME_OVER:
                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        this.saveHighScore();
                    }
                    break;
            }

            this.state = newState;
            this.game.getEvents().emit(GameEvents.STATE_CHANGED, this.state);
            return true;
        } catch (error) {
            console.error('Error during state transition:', error);
            return false;
        }
    }

    /**
     * Updates the current score
     * @param {number} points - Points to add
     */
    updateScore(points) {
        if (typeof points !== 'number' || points < 0) {
            console.error('Invalid points value:', points);
            return;
        }

        try {
            this.score += points;
            this.game.getEvents().emit(GameEvents.SCORE_CHANGED, this.score);
        } catch (error) {
            console.error('Error updating score:', error);
        }
    }

    /**
     * Gets the current play time in milliseconds
     */
    getPlayTime() {
        if (!this.startTime) {
            return 0;
        }

        if (this.state === GameStates.PAUSED) {
            if (!this.pauseTime) {
                console.warn('Pause time not set in PAUSED state');
                return 0;
            }
            return this.pauseTime - this.startTime;
        }

        return Date.now() - this.startTime;
    }

    /**
     * Saves the high score to localStorage
     */
    saveHighScore() {
        try {
            localStorage.setItem('snakeHighScore', this.highScore.toString());
        } catch (error) {
            console.error('Failed to save high score:', error);
        }
    }

    /**
     * Loads the high score from localStorage
     */
    loadHighScore() {
        try {
            const saved = localStorage.getItem('snakeHighScore');
            if (!saved) return 0;
            
            const score = parseInt(saved, 10);
            if (isNaN(score) || score < 0) {
                console.warn('Invalid high score in localStorage');
                return 0;
            }
            return score;
        } catch (error) {
            console.error('Failed to load high score:', error);
            return 0;
        }
    }

    /**
     * Gets the current state
     */
    getState() {
        return this.state;
    }

    /**
     * Checks if the game is in a specific state
     * @param {string} state - State to check
     */
    isInState(state) {
        return this.state === state;
    }

    /**
     * Gets the current score
     */
    getScore() {
        return this.score;
    }

    /**
     * Gets the high score
     */
    getHighScore() {
        return this.highScore;
    }
}
