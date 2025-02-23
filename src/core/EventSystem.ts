import { GameEvent, EventData, EventCallback } from '../config/types';

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
