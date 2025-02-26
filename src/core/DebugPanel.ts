import type P5 from 'p5';
import configManager from '../config/gameConfig';
import { PowerUp } from '../entities/PowerUp';
import { SnakeGame } from '../types';
import { BoardPreset, DebugConfig } from '../config/types';

export class DebugPanel {
	private game: SnakeGame;
	private config: DebugConfig;
	private visible: boolean;
	private frameCount: number;
	private fps: number;
	private fpsUpdateInterval: number;
	private lastFpsUpdate: number;

	constructor(game: SnakeGame) {
		this.game = game;
		this.config = configManager.getConfig().debug;
		this.visible = this.config.enabled;
		this.frameCount = 0;
		this.fps = 0;
		this.fpsUpdateInterval = 500;
		this.lastFpsUpdate = 0;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	handleInput(key: string, isShiftPressed: boolean = false): boolean {
		const shortcuts = Array.isArray(this.config.shortcutKey)
			? this.config.shortcutKey
			: [this.config.shortcutKey];

		if (shortcuts.includes(key)) {
			this.toggle();
			return true;
		}

		if (!this.visible) return false;

		// Grid size controls
		const gridControls = this.config.controls.grid;
		if (key === '=' || key === '+' || key === gridControls.increaseCellSize) {
			return this.adjustCellSize(5);
		} else if (key === '-' || key === '_' || key === gridControls.decreaseCellSize) {
			return this.adjustCellSize(-5);
		}

		// Spawn power-up controls
		const spawnControls = this.config.controls.spawn;
		const powerUpTypes = ['speed', 'ghost', 'points', 'slow'] as const;
		for (const type of powerUpTypes) {
			if (spawnControls[type] === key) {
				this.spawnPowerUp(type);
				return true;
			}
		}

		const foodControls = this.config.controls.food;
		const foodTypes = ['regular', 'bonus', 'golden'] as const;
		for (const type of foodTypes) {
			if (foodControls[type] === key) {
				this.game
					.getEntityManager()
					.getFood()
					.respawn([this.game.getEntityManager().getSnake()], type);
				return true;
			}
		}

		// Snake controls
		const snakeControls = this.config.controls.snake;
		if (snakeControls.grow === key) {
			this.game.getEntityManager().getSnake().grow();
			return true;
		}

		// Board size controls
		const boardControls = this.config.controls.board;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const boardSizeMatch = Object.entries(boardControls).find(([_, k]) => k === key);
		if (boardSizeMatch) {
			const [size] = boardSizeMatch;
			if (['small', 'medium', 'large', 'fullscreen'].includes(size)) {
				this.changeBoardSize(size as BoardPreset);
				return true;
			}
		}

		return false;
	}

	private adjustCellSize(delta: number): boolean {
		const currentPreset = this.game.getConfig().board.preset;
		const presets = this.game.getConfig().board.presets;
		const oldSize = presets[currentPreset].cellSize;
		const newSize = oldSize + delta;

		presets[currentPreset].cellSize = newSize;
		if (currentPreset === 'fullscreen') {
			const { innerWidth, innerHeight } = window;
			presets.fullscreen.width = innerWidth;
			presets.fullscreen.height = innerHeight;
		}

		return this.game.getGrid().updateCellSize(newSize) && this.game.recreate();
	}

	spawnPowerUp(type: 'speed' | 'ghost' | 'points' | 'slow') {
		const newPowerUp = new PowerUp(this.game.getGrid(), [
			this.game.getEntityManager().getSnake(),
			this.game.getEntityManager().getFood(),
		]);
		newPowerUp.setType(type);
		this.game.updatePowerUp(newPowerUp);
	}

	toggle() {
		this.visible = !this.visible;
	}

	update(currentTime: number) {
		this.frameCount++;
		if (currentTime - this.lastFpsUpdate > this.fpsUpdateInterval) {
			this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
			this.frameCount = 0;
			this.lastFpsUpdate = currentTime;
		}
	}

	draw(p5: P5) {
		if (!this.visible) return;

		p5.push();

		// Set text properties
		p5.textSize(this.config.fontSize);
		p5.textAlign(p5.LEFT, p5.TOP);

		// Calculate position and size
		const x = this.config.position.includes('right')
			? p5.width - 200 - this.config.padding
			: this.config.padding;

		const y = this.config.position.includes('bottom')
			? p5.height - 200 - this.config.padding
			: this.config.padding;

		// Pre-calculate height based on visible sections
		let height = this.config.padding;
		const lineHeight = this.config.fontSize * 1.5;

		// Add extra height for speed display
		height += lineHeight * 2;

		if (this.config.showFPS) height += lineHeight;
		if (this.config.showSnakeInfo) height += lineHeight * 4;
		if (this.config.showGridInfo) height += lineHeight * 3;
		if (this.config.showEffects) {
			height += lineHeight;
			const effects = Array.from(this.game.getEntityManager().getSnake().effects.entries());
			height += (effects.length || 1) * lineHeight;
		}
		if (this.config.showControls) height += lineHeight * 4;

		height += this.config.padding;

		// Draw background
		p5.fill(this.config.backgroundColor);
		p5.noStroke();
		p5.rect(x, y, 200, height);

		// Draw text
		p5.fill(this.config.textColor);
		let currentY = y + this.config.padding;

		// Draw current speed prominently at the top
		const speed = this.game.getEntityManager().getSnake().getCurrentSpeed();
		p5.textSize(this.config.fontSize * 1.5);
		p5.textAlign(p5.CENTER);
		p5.text(`${speed.toFixed(1)} cells/sec`, x + 100, currentY);
		currentY += lineHeight * 1.5;

		// Reset text properties for regular debug info
		p5.textSize(this.config.fontSize);
		p5.textAlign(p5.LEFT);
		p5.stroke(this.config.textColor);
		p5.strokeWeight(0.5);
		p5.line(x + 10, currentY, x + 190, currentY);
		p5.noStroke();
		currentY += lineHeight * 0.5;

		if (this.config.showFPS) {
			p5.text(`FPS: ${Math.round(this.fps)}`, x + this.config.padding, currentY);
			currentY += lineHeight;
		}

		if (this.config.showSnakeInfo) {
			const snake = this.game.getEntityManager().getSnake();
			const currentSpeed = snake.getCurrentSpeed
				? snake.getCurrentSpeed()
				: this.game.getConfig().snake.baseSpeed;

			p5.text(`Snake Length: ${snake.segments.length}`, x + this.config.padding, currentY);
			currentY += lineHeight;
			p5.text(`Direction: ${snake.getDirection()}`, x + this.config.padding, currentY);
			currentY += lineHeight;
			p5.text(`Speed: ${currentSpeed.toFixed(1)}`, x + this.config.padding, currentY);
			currentY += lineHeight;
			p5.text(
				`Score: ${this.game.getStateMachine().getCurrentScore()}`,
				x + this.config.padding,
				currentY
			);
			currentY += lineHeight;
		}

		if (this.config.showGridInfo) {
			const size = this.game.getGrid().getSize();
			const currentPreset = this.game.getConfig().board.preset;
			const cellSize = this.game.getConfig().board.presets[currentPreset].cellSize;
			p5.text(`Grid: ${size.width}x${size.height}`, x + this.config.padding, currentY);
			currentY += lineHeight;
			p5.text(`Cell Size: ${cellSize}px`, x + this.config.padding, currentY);
			currentY += lineHeight;
			p5.text(`Board Size: ${currentPreset}`, x + this.config.padding, currentY);
			currentY += lineHeight;
		}

		if (this.config.showEffects) {
			p5.text('Active Effects:', x + this.config.padding, currentY);
			currentY += lineHeight;
			const effects = Array.from(this.game.getEntityManager().getSnake().effects.entries());
			if (effects.length === 0) {
				p5.text('None', x + this.config.padding + 10, currentY);
				currentY += lineHeight;
			} else {
				effects.forEach(([effect, stacks]) => {
					const timeLeft = this.game
						.getEntityManager()
						.getSnake()
						.getEffectTimeRemaining(effect);
					let effectText = `${effect}: ${(timeLeft / 1000).toFixed(1)}s`;

					if (effect === 'points') {
						effectText += ` (${this.game.getEntityManager().getSnake().getPointsMultiplier()}x)`;
					} else if (effect === 'speed') {
						effectText += ` (${stacks.length}x)`;
					}

					p5.text(effectText, x + this.config.padding + 10, currentY);
					currentY += lineHeight;
				});
			}
		}

		if (this.config.showControls) {
			p5.text('Debug Controls:', x + this.config.padding, currentY);
			currentY += lineHeight;
			p5.text(`[1] Speed PowerUp`, x + this.config.padding + 10, currentY);
			currentY += lineHeight;
			p5.text(`[2] Ghost PowerUp`, x + this.config.padding + 10, currentY);
			currentY += lineHeight;
			p5.text(`[3] Points PowerUp`, x + this.config.padding + 10, currentY);
			currentY += lineHeight;
		}

		p5.pop();
	}

	changeBoardSize(preset: BoardPreset) {
		const currentConfig = configManager.getConfig();
		const config = {
			...currentConfig,
			board: {
				...currentConfig.board,
				preset,
			},
		};

		if (preset === 'fullscreen') {
			const cellSize = currentConfig.board.cellSize;
			config.board.width = Math.floor(window.innerWidth / cellSize);
			config.board.height = Math.floor(window.innerHeight / cellSize);
		}

		this.game.setConfig(config);
		this.game.recreate();
	}
}
