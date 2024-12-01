export class GameState {
    #score = 0;
    #highScore = 0;
    #state = 'playing';
    #difficulty = 'normal';
    #activeEffects = new Set();

    constructor() {
        this.reset();
    }

    get score() {
        return this.#score;
    }

    get highScore() {
        return this.#highScore;
    }

    get state() {
        return this.#state;
    }

    get difficulty() {
        return this.#difficulty;
    }

    get activeEffects() {
        return this.#activeEffects;
    }

    isPlaying() {
        return this.#state === 'playing';
    }

    isGameOver() {
        return this.#state === 'gameover';
    }

    gameOver() {
        this.#state = 'gameover';
    }

    addScore(points) {
        this.#score += points;
        if (this.#score > this.#highScore) {
            this.#highScore = this.#score;
        }
    }

    setState(newState) {
        this.#state = newState;
    }

    setDifficulty(difficulty) {
        this.#difficulty = difficulty;
    }

    reset() {
        this.#score = 0;
        this.#state = 'playing';
        this.#activeEffects.clear();
        // Don't reset high score
    }
}
