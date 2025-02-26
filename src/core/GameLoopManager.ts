// src/core/GameLoopManager.ts
import type P5 from 'p5';
import type { SnakeGame } from '../types';
import { GameRenderer } from './GameRenderer';

/**
 * Manages the game loop for Snake Zero using requestAnimationFrame.
 * Handles starting and stopping the animation loop.
 */
export class GameLoopManager {
	private p5: P5 | null;
	private game: SnakeGame;
	private animationFrameId: number | null;

	constructor(game: SnakeGame) {
		this.p5 = null;
		this.game = game;
		this.animationFrameId = null;
	}

	public setup(p5Instance: P5): void {
		this.p5 = p5Instance;
	}

	public start(): void {
		if (!this.p5) throw new Error('GameLoopManager not set up with p5 instance');
		const gameLoop = (currentTime: number) => {
			this.game.update();
			this.game.getRenderer().render();
			this.animationFrameId = window.requestAnimationFrame(gameLoop);
		};
		this.animationFrameId = window.requestAnimationFrame(gameLoop);
	}

	public stop(): void {
		if (this.animationFrameId !== null) {
			window.cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	public getRenderer(): GameRenderer {
		return this.game.getRenderer();
	}
}
