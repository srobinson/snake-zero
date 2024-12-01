/**
 * Game events that can be emitted
 */
export const GameEvents = {
    FOOD_COLLECTED: 'food_collected',
    POWER_UP_COLLECTED: 'power_up_collected',
    POWER_UP_EXPIRED: 'power_up_expired',
    COLLISION: 'collision',
    SCORE_CHANGED: 'score_changed',
    STATE_CHANGED: 'state_changed',
    SPEED_CHANGED: 'speed_changed'
};

/**
 * Simple event system for game events
 */
export class EventSystem {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event to subscribe to
     * @param {Function} callback - Callback to execute
     * @returns {Function} Unsubscribe function
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
     * @param {string} event - Event to unsubscribe from
     * @param {Function} callback - Callback to remove
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
     * @param {string} event - Event to emit
     * @param {*} data - Data to pass to callbacks
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
     * Clear all event listeners
     */
    clear() {
        this.listeners.clear();
    }
}
