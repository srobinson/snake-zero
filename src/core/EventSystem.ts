import { GameController } from './GameController';

/** Game event types */
export type GameEvent = 
    | 'food_collected'
    | 'power_up_collected'
    | 'power_up_expired'
    | 'collision'
    | 'score_changed'
    | 'state_changed'
    | 'speed_changed';

/** Event data structure for different event types */
export interface EventData {
    /** New score value for SCORE_CHANGED event */
    score?: number;
    /** New game state for STATE_CHANGED event */
    state?: any;
    /** New speed value for SPEED_CHANGED event */
    speed?: number;
    /** Type of power-up for POWER_UP_COLLECTED/EXPIRED events */
    powerUpType?: string;
    /** Position data for collision/collection events */
    position?: {
        x: number;
        y: number;
    };
    /** Points value for FOOD_COLLECTED event */
    points?: number;
    /** Points multiplier for FOOD_COLLECTED event */
    multiplier?: number;
}

/** Game events that can be emitted */
export const GameEvents = {
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
} as const;

/** Type for the event callback function */
type EventCallback = (data: EventData) => void;

/**
 * Simple event system for game events.
 * Provides a pub/sub interface for game components to communicate.
 * Handles event subscribe, unsubscribe, and emission with error handling.
 */
export class EventSystem {
    /** Map of event listeners */
    private listeners: Map<GameEvent, Set<EventCallback>>;

    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param event - Event to subscribe to
     * @param callback - Callback to execute when event is emitted
     * @returns Unsubscribe function that removes the callback when called
     */
    on(event: GameEvent, callback: EventCallback): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param event - Event to unsubscribe from
     * @param callback - Callback to remove
     */
    off(event: GameEvent, callback: EventCallback): void {
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
     * @param event - Event to emit
     * @param data - Data to pass to callbacks
     * @throws If a callback throws an error, it will be caught and logged
     */
    emit(event: GameEvent, data: EventData): void {
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
    clear(): void {
        this.listeners.clear();
    }
}
