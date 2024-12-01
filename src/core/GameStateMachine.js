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
        this.game = game;
        this.state = GameStates.MENU;
        this.startTime = 0;
        this.pauseTime = 0;
        this.score = 0;
        this.highScore = this.loadHighScore();
    }

    /**
     * Transitions to a new state if valid
     * @param {string} newState - The state to transition to
     * @returns {boolean} Whether the transition was successful
     */
    transition(newState) {
        // Define valid transitions
        const validTransitions = {
            [GameStates.MENU]: [GameStates.PLAYING],
            [GameStates.PLAYING]: [GameStates.PAUSED, GameStates.GAME_OVER],
            [GameStates.PAUSED]: [GameStates.PLAYING, GameStates.MENU],
            [GameStates.GAME_OVER]: [GameStates.MENU]
        };

        if (!validTransitions[this.state].includes(newState)) {
            console.warn(`Invalid state transition: ${this.state} -> ${newState}`);
            return false;
        }

        // Handle state exit
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
        return true;
    }

    /**
     * Updates the current score
     * @param {number} points - Points to add
     */
    updateScore(points) {
        this.score += points;
    }

    /**
     * Gets the current play time in milliseconds
     */
    getPlayTime() {
        if (this.state === GameStates.PAUSED) {
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
            return saved ? parseInt(saved, 10) : 0;
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
}
