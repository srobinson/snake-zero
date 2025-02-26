// src/core/GameRenderer.ts
import type p5 from 'p5';
import type { SnakeGame } from '../types';
import { GameEvents } from '../config/types';
import { GameStates } from './types';
import { Grid } from './Grid';
import { ParticleSystem } from './ParticleSystem';
import { PowerUpBadge } from '../entities/PowerUpBadge';

/**
 * Handles all rendering responsibilities for the Snake Zero game using p5.js.
 * Manages drawing of game elements and UI, including score animation state.
 */
export class GameRenderer {
	private p5: p5;
	private game: SnakeGame;
	private grid: Grid;

	// Score animation state, now fully contained within the renderer
	private scoreScale: number = 1;
	private scoreWiggle: number = 0;
	private scoreAnimationTime: number = 0;
	private readonly SCORE_ANIMATION_DURATION: number = 500;

	constructor(p5Instance: p5, game: SnakeGame) {
		this.p5 = p5Instance;
		this.game = game;
		this.grid = game.getGrid();

		// Listen for score changes to trigger animation
		this.game.getEvents().on(GameEvents.SCORE_CHANGED, () => {
			this.scoreAnimationTime = this.p5.millis(); // Start animation when score changes
		});
	}

	public setup(): void {
		const canvas = this.p5.createCanvas(this.grid.getWidth(), this.grid.getHeight());
		canvas.parent('snaked-again-container');
	}

	public render(): void {
		if (!this.p5) return;
		this.p5.clear();
		const state = this.game.getStateMachine().getState();
		switch (state) {
			case GameStates.MENU:
				this.drawMenu();
				break;
			case GameStates.PLAYING:
				this.drawGame();
				this.game.getUIManager().renderScore();
				break;
			case GameStates.PAUSED:
				this.drawGame();
				this.drawPauseOverlay();
				break;
			case GameStates.GAME_OVER:
				this.drawGame();
				this.drawGameOver();
				break;
		}

		this.game.getParticleSystem().update();
		this.game.getParticleSystem().draw();
	}

	private drawGame(): void {
		const currentTime = this.p5.millis();
		this.grid.drawBackground(this.p5);
		this.grid.drawGridLines(this.p5);
		this.game.getEntityManager().getFood().draw(this.p5);

		const powerUp = this.game.getEntityManager().getPowerUp();
		if (powerUp) powerUp.draw(this.p5);
		this.game.getEntityManager().getSnake().draw(this.p5, currentTime);

		// Access badges directly (assumes they're public or have getters)
		this.game.getActiveBadges().forEach((badge: PowerUpBadge) => badge.draw());
		this.game.getFloatingBadges().forEach((badge: PowerUpBadge) => badge.draw());

		this.drawScore();
		this.game.getDebugPanel().draw(this.p5);
	}

	private drawMenu(): void {
		const p5 = this.p5;
		p5.fill(255);
		p5.textSize(32);
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.text('Snake Zero', this.grid.getWidth() / 2, this.grid.getHeight() / 2 - 60);
		p5.textSize(20);
		p5.text(
			`High Score: ${this.game.getStateMachine().getCurrentHighScore()}`,
			this.grid.getWidth() / 2,
			this.grid.getHeight() / 2
		);
		p5.text('Press SPACE to Start', this.grid.getWidth() / 2, this.grid.getHeight() / 2 + 40);
		p5.textSize(16);
		p5.text(
			'Use Arrow Keys or WASD to move',
			this.grid.getWidth() / 2,
			this.grid.getHeight() / 2 + 80
		);
	}

	private drawPauseOverlay(): void {
		const p5 = this.p5;
		p5.fill(255);
		p5.textSize(16);
		p5.textAlign(p5.RIGHT, p5.TOP);
		p5.text('PAUSED', this.grid.getWidth() - 10, -10);
	}

	private drawGameOver(): void {
		const p5 = this.p5;
		p5.fill(0, 0, 0, 200);
		p5.rect(0, 0, this.grid.getWidth(), this.grid.getHeight());
		p5.fill(255);
		p5.textSize(32);
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.text('Game Over!', this.grid.getWidth() / 2, this.grid.getHeight() / 2 - 40);
		p5.textSize(24);
		p5.text(
			`Score: ${this.game.getStateMachine().getCurrentScore()}`,
			this.grid.getWidth() / 2,
			this.grid.getHeight() / 2 + 10
		);
		if (
			this.game.getStateMachine().getCurrentScore() ===
			this.game.getStateMachine().getCurrentHighScore()
		) {
			p5.text('New High Score!', this.grid.getWidth() / 2, this.grid.getHeight() / 2 + 40);
		}
		p5.textSize(16);
		p5.text('Press SPACE to Restart', this.grid.getWidth() / 2, this.grid.getHeight() / 2 + 80);
		p5.text('Press ESC for Menu', this.grid.getWidth() / 2, this.grid.getHeight() / 2 + 110);
	}

	private drawScore(): void {
		const p5 = this.p5;
		p5.push();
		p5.textFont('Press Start 2P');
		p5.textAlign(p5.CENTER, p5.TOP);
		p5.textSize(80 * this.scoreScale);
		p5.strokeWeight(4);
		p5.stroke(0);
		p5.fill(255, 255, 255);
		p5.drawingContext.shadowBlur = 10;
		p5.drawingContext.shadowColor = 'rgba(255, 255, 0, 0.8)';

		const x = this.grid.getWidth() / 2 + this.scoreWiggle;
		const y = 20;
		p5.text(this.game.getStateMachine().getCurrentScore(), x, y);

		// Manage score animation internally
		if (this.scoreAnimationTime > 0) {
			const elapsed = p5.millis() - this.scoreAnimationTime;
			if (elapsed < this.SCORE_ANIMATION_DURATION) {
				const t = elapsed / this.SCORE_ANIMATION_DURATION;
				p5.drawingContext.shadowBlur = 100; // Intense glow during animation
				this.scoreScale = 1 + (2 - 1) * (1 - t * t); // Quadratic ease-out from 2x to 1x
				this.scoreWiggle = 10 * (1 - t) * Math.sin(t * 40); // Fast, decaying shake
			} else {
				this.scoreScale = 1;
				this.scoreWiggle = 0;
				this.scoreAnimationTime = 0; // End animation
			}
		}

		p5.drawingContext.shadowBlur = 0;
		p5.pop();
	}
}
