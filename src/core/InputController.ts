// src/core/InputController.ts
import type p5 from 'p5';
import type { SnakeGame } from '../types';
import { GameStates } from './types';

/**
 * Manages all user input (keyboard and touch) for the Snake Zero game.
 * Translates raw input events into game commands, delegating actions to the game instance.
 * Responsible for handling state-specific input logic and control mappings.
 */
export class InputController {
	/** p5.js instance for accessing input state (e.g., keyIsDown) */
	private p5: p5 | null;

	/** Reference to the game instance for accessing state and entities */
	private game: SnakeGame;

	/** Starting X coordinate for touch swipe detection */
	private touchStartX: number = 0;

	/** Starting Y coordinate for touch swipe detection */
	private touchStartY: number = 0;

	/** Minimum distance (in pixels) for a swipe to register as a movement */
	private readonly MIN_SWIPE_DISTANCE: number = 30;

	/**
	 * Initializes the input controller with a reference to the game.
	 * @param game - The game instance to interact with
	 */
	constructor(game: SnakeGame) {
		this.game = game;
		this.p5 = null; // Set in setup
	}

	/**
	 * Sets up the p5 instance and configures global touch event listeners.
	 * Prevents default browser behavior (e.g., scrolling, zooming) on touch.
	 * @param p5Instance - The p5.js instance for input handling
	 */
	public setup(p5Instance: p5): void {
		this.p5 = p5Instance;

		// Prevent default touch behavior to ensure smooth gameplay on mobile
		document.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
		document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
	}

	/**
	 * Handles keyboard input events, routing them based on the current game state.
	 * Supports state transitions and snake movement controls.
	 * @param key - The key pressed by the user
	 * @param isShiftPressed - Whether the Shift key is held
	 */
	public handleKeyPress(key: string, isShiftPressed: boolean = false): void {
		// Allow debug panel to handle input first (e.g., debug shortcuts)
		if (this.game.getDebugPanel().handleInput(key, isShiftPressed)) {
			return;
		}

		const state = this.game.getStateMachine().getState();
		const controls = this.game.getConfig().snake.controls;

		switch (state) {
			case GameStates.MENU:
				if (key === ' ') {
					this.game.getStateMachine().transition(GameStates.PLAYING); // Start game
				}
				break;

			case GameStates.PLAYING:
				if (key === ' ') {
					this.game.getStateMachine().transition(GameStates.PAUSED); // Pause game
				} else if (key === 'Escape') {
					this.game.getStateMachine().transition(GameStates.MENU); // Back to menu
				} else {
					// Handle snake movement based on configured controls
					if (controls.up.includes(key)) {
						this.game.getSnake().setDirection('up');
					} else if (controls.down.includes(key)) {
						this.game.getSnake().setDirection('down');
					} else if (controls.left.includes(key)) {
						this.game.getSnake().setDirection('left');
					} else if (controls.right.includes(key)) {
						this.game.getSnake().setDirection('right');
					}
				}
				break;

			case GameStates.PAUSED:
				if (key === ' ') {
					this.game.getStateMachine().transition(GameStates.PLAYING); // Resume game
				} else if (key === 'Escape') {
					this.game.getStateMachine().transition(GameStates.MENU); // Back to menu
				}
				break;

			case GameStates.GAME_OVER:
				if (key === ' ' || key === 'Escape') {
					this.game.getStateMachine().transition(GameStates.MENU); // Restart or menu
				}
				break;
		}
	}

	/**
	 * Handles the start of a touch or mouse event for mobile controls.
	 * Records the initial touch position for swipe detection.
	 * @param event - The touch or mouse event
	 * @returns False to prevent default behavior
	 */
	public touchStarted(event: TouchEvent | MouseEvent): boolean {
		if (!this.game) return false;

		const clientX = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
		const clientY = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;

		this.touchStartX = clientX;
		this.touchStartY = clientY;

		event.preventDefault();
		return false;
	}

	/**
	 * Handles the end of a touch or mouse event, detecting swipes for snake control.
	 * Updates snake direction based on swipe distance and direction.
	 * @param event - The touch or mouse event
	 * @returns False to prevent default behavior
	 */
	public touchEnded(event: TouchEvent | MouseEvent): boolean {
		if (!this.game) return false;

		const clientX =
			event instanceof TouchEvent ? event.changedTouches[0].clientX : event.clientX;
		const clientY =
			event instanceof TouchEvent ? event.changedTouches[0].clientY : event.clientY;

		const deltaX = clientX - this.touchStartX;
		const deltaY = clientY - this.touchStartY;

		if (
			Math.abs(deltaX) > this.MIN_SWIPE_DISTANCE ||
			Math.abs(deltaY) > this.MIN_SWIPE_DISTANCE
		) {
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				this.game.getSnake().setDirection(deltaX > 0 ? 'right' : 'left'); // Horizontal swipe
			} else {
				this.game.getSnake().setDirection(deltaY > 0 ? 'down' : 'up'); // Vertical swipe
			}
		}

		event.preventDefault();
		return false;
	}
}
