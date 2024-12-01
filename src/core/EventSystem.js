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
    SPEED_CHANGED: 'speed_changed',
    GRID_RESIZED: 'grid_resized',
    CONFIG_CHANGED: 'config_changed'
};

/**
 * Simple event system for game events
 */
export class EventSystem {
    constructor() {
        this.listeners = new Map();
        this.queuedEvents = [];
        this.isProcessing = false;
        this.maxQueueSize = 1000;
        this.recursionLimit = 10;
        this.recursionCount = 0;
    }

    validateEventType(event) {
        if (typeof event !== 'string') {
            throw new Error('Event type must be a string');
        }
        if (!Object.values(GameEvents).includes(event)) {
            console.warn(`Unknown event type: ${event}`);
        }
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event to subscribe to
     * @param {Function} callback - Callback to execute
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        try {
            this.validateEventType(event);
        } catch (error) {
            console.error(error);
            return () => {};
        }

        if (typeof callback !== 'function') {
            console.error('Event callback must be a function');
            return () => {};
        }

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
        try {
            this.validateEventType(event);
        } catch (error) {
            console.error(error);
            return;
        }

        if (typeof callback !== 'function') {
            console.error('Event callback must be a function');
            return;
        }

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
        try {
            this.validateEventType(event);
        } catch (error) {
            console.error(error);
            return;
        }

        // Check recursion limit
        if (this.recursionCount >= this.recursionLimit) {
            console.error('Event recursion limit reached');
            return;
        }

        // Check queue size limit
        if (this.queuedEvents.length >= this.maxQueueSize) {
            console.error('Event queue size limit reached');
            return;
        }

        // Queue the event if we're already processing events
        if (this.isProcessing) {
            this.queuedEvents.push({ event, data });
            return;
        }

        this.isProcessing = true;
        this.recursionCount++;
        
        try {
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

            // Process any queued events
            while (this.queuedEvents.length > 0) {
                const queuedEvent = this.queuedEvents.shift();
                this.emit(queuedEvent.event, queuedEvent.data);
            }
        } finally {
            this.isProcessing = false;
            this.recursionCount--;
        }
    }

    /**
     * Clear all event listeners
     */
    clear() {
        this.listeners.clear();
        this.queuedEvents = [];
        this.isProcessing = false;
    }

    /**
     * Get all registered event types
     * @returns {string[]} Array of event types
     */
    getEventTypes() {
        return Array.from(this.listeners.keys());
    }

    /**
     * Get number of listeners for an event
     * @param {string} event - Event to check
     * @returns {number} Number of listeners
     */
    getListenerCount(event) {
        const callbacks = this.listeners.get(event);
        return callbacks ? callbacks.size : 0;
    }
}
