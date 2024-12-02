/**
 * @typedef {'menu'|'playing'|'paused'|'game_over'} GameState
 */

/**
 * @typedef {Object} StateTransition
 * @property {GameState} from - Source state
 * @property {GameState} to - Target state
 */

/**
 * @typedef {Object} StateData
 * @property {GameState} state - Current game state
 * @property {number} [score] - Current score (for GAME_OVER)
 * @property {number} [highScore] - High score (for GAME_OVER)
 * @property {number} [playTime] - Play time in ms (for PAUSED/GAME_OVER)
 */

/**
 * @typedef {Object} Game
 * @property {() => void} reset - Resets the game state
 * @property {import('./EventSystem').EventSystem} events - Event system instance
 */

/**
 * Possible game states
 * @enum {GameState}
 * @readonly
 */
export const GameStates = /** @type {const} */ ({
    /** Main menu state */
    MENU: 'menu',
    /** Active game state */
    PLAYING: 'playing',
    /** Paused game state */
    PAUSED: 'paused',
    /** Game over state */
    GAME_OVER: 'game_over'
});

/**
 * Valid state transitions map
 * @type {Record<GameState, GameState[]>}
 * @readonly
 */
const VALID_TRANSITIONS = /** @type {const} */ ({
    [GameStates.MENU]: [GameStates.PLAYING],
    [GameStates.PLAYING]: [GameStates.PAUSED, GameStates.GAME_OVER],
    [GameStates.PAUSED]: [GameStates.PLAYING, GameStates.MENU],
    [GameStates.GAME_OVER]: [GameStates.MENU]
});

/**
 * Game state machine that handles state transitions and associated logic.
 * Manages the game's state lifecycle, including:
 * - State transitions and validation
 * - Score tracking and high score persistence
 * - Game timing and pause functionality
 * @class
 */
export class GameStateMachine {
    /** @type {GameState} */
    #state;
    
    /** @type {number} */
    #startTime;
    
    /** @type {number} */
    #pauseTime;
    
    /** @type {number} */
    #score;
    
    /** @type {number} */
    #highScore;

    /** @type {Game} */
    #game;

    /** @type {import('./EventSystem').EventSystem} */
    #events;

    /**
     * Creates a new GameStateMachine instance
     * @param {Game} game - The game instance
     */
    constructor(game) {
        this.#game = game;
        this.#state = GameStates.MENU;
        this.#startTime = 0;
        this.#pauseTime = 0;
        this.#score = 0;
        this.#highScore = this.#loadHighScore();
        this.#events = game.events;
    }

    /**
     * Validates a state transition
     * @param {StateTransition} transition - The transition to validate
     * @returns {boolean} Whether the transition is valid
     */
    #validateTransition({ from, to }) {
        return VALID_TRANSITIONS[from]?.includes(to) ?? false;
    }

    /**
     * Creates state data for event emission
     * @param {GameState} state - The state to create data for
     * @returns {StateData} State data for event
     */
    #createStateData(state) {
        /** @type {StateData} */
        const data = { state };
        
        switch (state) {
            case GameStates.GAME_OVER:
                data.score = this.#score;
                data.highScore = this.#highScore;
                data.playTime = this.getPlayTime();
                break;
            case GameStates.PAUSED:
                data.playTime = this.getPlayTime();
                break;
        }
        
        return data;
    }

    /**
     * Transitions to a new state if the transition is valid
     * @param {GameState} newState - The state to transition to
     * @returns {boolean} Whether the transition was successful
     */
    transition(newState) {
        const transition = { from: this.#state, to: newState };
        
        if (!this.#validateTransition(transition)) {
            console.warn(`Invalid state transition: ${transition.from} -> ${transition.to}`);
            return false;
        }

        // Handle state exit
        switch (this.#state) {
            case GameStates.PLAYING:
                if (newState === GameStates.PAUSED) {
                    this.#pauseTime = Date.now();
                }
                break;
        }

        // Handle state enter
        switch (newState) {
            case GameStates.PLAYING:
                if (this.#state === GameStates.MENU) {
                    this.#startTime = Date.now();
                    this.#score = 0;
                    this.#game.reset();
                } else if (this.#state === GameStates.PAUSED) {
                    const pauseDuration = Date.now() - this.#pauseTime;
                    this.#startTime += pauseDuration;
                }
                break;
            case GameStates.GAME_OVER:
                if (this.#score > this.#highScore) {
                    this.#highScore = this.#score;
                    this.#saveHighScore();
                }
                break;
        }

        this.#state = newState;
        this.#events.emit('state_changed', this.#createStateData(newState));
        return true;
    }

    /**
     * Updates the current score
     * @param {number} points - Points to add to the current score
     */
    updateScore(points) {
        if (!this.isInState(GameStates.PLAYING)) return;
        this.#score += points;
        this.#events.emit('score_changed', { score: this.#score });
    }

    /**
     * Gets the current play time in milliseconds.
     * If the game is paused, returns the time until pause.
     * @returns {number} Play time in milliseconds
     */
    getPlayTime() {
        if (this.#state === GameStates.PAUSED) {
            return this.#pauseTime - this.#startTime;
        }
        return Date.now() - this.#startTime;
    }

    /**
     * Saves the high score to localStorage.
     */
    #saveHighScore() {
        try {
            localStorage.setItem('snakeHighScore', this.#highScore.toString());
        } catch (error) {
            console.error('Failed to save high score:', error);
        }
    }

    /**
     * Loads the high score from localStorage.
     * Returns 0 if no high score exists or if localStorage is not available.
     * @returns {number} The loaded high score
     */
    #loadHighScore() {
        try {
            const stored = localStorage.getItem('snakeHighScore');
            return stored ? parseInt(stored, 10) : 0;
        } catch (error) {
            console.error('Failed to load high score:', error);
            return 0;
        }
    }

    /**
     * Gets the current game state
     * @returns {GameState} Current state
     */
    getState() {
        return this.#state;
    }

    /**
     * Checks if the game is in a specific state
     * @param {GameState} state - State to check
     * @returns {boolean} True if game is in the specified state
     */
    isInState(state) {
        return this.#state === state;
    }

    /**
     * Gets the current score
     * @returns {number} Current score
     */
    get score() {
        return this.#score;
    }

    /**
     * Gets the current high score
     * @returns {number} High score
     */
    get highScore() {
        return this.#highScore;
    }
}
