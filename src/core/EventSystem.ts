// src/core/EventSystem.ts
import { GameEvent, EventDataMap, EventCallback } from '../config/types';

/**
 * Type-safe event system for game events.
 * Provides a pub/sub interface with generic event handling for precise data typing.
 */
export class EventSystem {
	/** Map of event listeners, using Sets for efficient callback management */
	private listeners: Map<GameEvent, Set<EventCallback<any>>>;

	/**
	 * Initializes the event system with an empty listener map.
	 */
	constructor() {
		this.listeners = new Map();
	}

	/**
	 * Subscribes to a specific game event with a typed callback.
	 * @param event - Event to listen for
	 * @param callback - Callback function receiving event-specific data
	 * @returns Function to unsubscribe the callback
	 */
	public on<T extends GameEvent>(event: T, callback: EventCallback<T>): () => void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(callback);

		// Return unsubscribe function
		return () => this.off(event, callback);
	}

	/**
	 * Unsubscribes a callback from a specific game event.
	 * @param event - Event to unsubscribe from
	 * @param callback - Callback to remove
	 */
	public off<T extends GameEvent>(event: T, callback: EventCallback<T>): void {
		const callbacks = this.listeners.get(event);
		if (callbacks) {
			callbacks.delete(callback);
			if (callbacks.size === 0) {
				this.listeners.delete(event); // Clean up empty event sets
			}
		}
	}

	/**
	 * Emits a game event with type-specific data to all listeners.
	 * @param event - Event to emit
	 * @param data - Data matching the event type
	 */
	public emit<T extends GameEvent>(event: T, data: EventDataMap[T]): void {
		const callbacks = this.listeners.get(event);
		if (callbacks) {
			callbacks.forEach(callback => {
				try {
					(callback as EventCallback<T>)(data); // Type-safe cast
				} catch (error) {
					console.error(`Error in event listener for ${event}:`, error);
				}
			});
		}
	}

	/**
	 * Clears all event listeners across all events.
	 * Useful for cleanup or resetting the system.
	 */
	public clear(): void {
		this.listeners.clear();
	}
}
