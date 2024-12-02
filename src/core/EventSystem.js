/**
 * @typedef {'food_collected'|'power_up_collected'|'power_up_expired'|'collision'|'score_changed'|'state_changed'|'speed_changed'} GameEvent
 */

/**
 * @typedef {Object} EventData
 * @property {number} [score] - New score value for SCORE_CHANGED event
 * @property {import('./GameStateMachine').GameState} [state] - New game state for STATE_CHANGED event
 * @property {number} [speed] - New speed value for SPEED_CHANGED event
 * @property {string} [powerUpType] - Type of power-up for POWER_UP_COLLECTED/EXPIRED events
 * @property {Object} [position] - Position data for collision/collection events
 * @property {number} position.x - X coordinate
 * @property {number} position.y - Y coordinate
 */

/**
 * Game events that can be emitted
 * @enum {GameEvent}
 * @readonly
 */
export const GameEvents = /** @type {const} */ ({
    /** Emitted when food is collected by the snake */
    FOOD_COLLECTED: 'food_collected',
    /** Emitted when a power-up is collected by the snake */
    POWER_UP_COLLECTED: 'power_up_collected',
    /** Emitted when a power-up effect expires */
    POWER_UP_EXPIRED: 'power_up_expired',
    /** Emitted when a collision occurs */
    COLLISION: 'collision',
    /** Emitted when the score changes */
    SCORE_CHANGED: 'score_changed',
    /** Emitted when the game state changes */
    STATE_CHANGED: 'state_changed',
    /** Emitted when the snake's speed changes */
    SPEED_CHANGED: 'speed_changed'
});

/**
 * Simple event system for game events.
 * Provides a pub/sub interface for game components to communicate.
 * Handles event subscribe, unsubscribe, and emission with error handling.
 * @class
 */
export class EventSystem {
    /** @type {Map<GameEvent, Set<(data: EventData) => void>>} */
    listeners;

    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {GameEvent} event - Event to subscribe to
     * @param {(data: EventData) => void} callback - Callback to execute when event is emitted
     * @returns {() => void} Unsubscribe function that removes the callback when called
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param {GameEvent} event - Event to unsubscribe from
     * @param {(data: EventData) => void} callback - Callback to remove
     */
    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Emit an event with data
     * @param {GameEvent} event - Event to emit
     * @param {EventData} data - Data to pass to callbacks
     * @throws {Error} If a callback throws an error, it will be caught and logged
     */
    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Clear all event listeners.
     * Useful for cleanup or resetting the event system.
     */
    clear() {
        this.listeners.clear();
    }
}
