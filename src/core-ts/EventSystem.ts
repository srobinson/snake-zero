import { GameEvent, EventData, GameEventTarget } from '../types-ts/commonTypes';

export const GameEvents = {
    FOOD_COLLECTED: 'food_collected',
    POWER_UP_COLLECTED: 'power_up_collected',
    POWER_UP_EXPIRED: 'power_up_expired',
    COLLISION: 'collision',
    SCORE_CHANGED: 'score_changed',
    STATE_CHANGED: 'state_changed',
    SPEED_CHANGED: 'speed_changed'
} as const;

export class EventSystem implements GameEventTarget {
    private listeners: Map<GameEvent, Set<(data: EventData) => void>>;

    constructor() {
        this.listeners = new Map();
    }

    public on(event: GameEvent, callback: (data: EventData) => void): void {
        try {
            let callbacks = this.listeners.get(event);
            if (!callbacks) {
                callbacks = new Set();
                this.listeners.set(event, callbacks);
            }
            callbacks.add(callback);
        } catch (error) {
            console.error(`Error subscribing to event ${event}:`, error);
        }
    }

    public once(event: GameEvent, callback: (data: EventData) => void): void {
        try {
            const onceCallback = (data: EventData) => {
                this.off(event, onceCallback);
                callback(data);
            };
            this.on(event, onceCallback);
        } catch (error) {
            console.error(`Error subscribing once to event ${event}:`, error);
        }
    }

    public off(event: GameEvent, callback: (data: EventData) => void): void {
        try {
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.listeners.delete(event);
                }
            }
        } catch (error) {
            console.error(`Error unsubscribing from event ${event}:`, error);
        }
    }

    public emit(event: GameEvent, data: EventData = {}): void {
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
        } catch (error) {
            console.error(`Error emitting event ${event}:`, error);
        }
    }

    public clear(): void {
        this.listeners.clear();
    }
}
