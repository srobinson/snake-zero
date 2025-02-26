// src/core/UIManager.ts
import type P5 from 'p5';
import type { PowerUpType, Position } from '../config/types';
import { PowerUpBadge } from '../entities/PowerUpBadge';
import { SnakeGame } from '../types';

/**
 * Manages UI elements like power-up badges in Snake Zero.
 * Handles badge creation, positioning, and updates.
 */
export class UIManager {
	private p5: P5;
	private game: SnakeGame;
	private activeBadges: PowerUpBadge[];
	private floatingBadges: PowerUpBadge[];

	constructor(p5: P5, game: SnakeGame) {
		this.p5 = p5;
		this.game = game;
		this.activeBadges = [];
		this.floatingBadges = [];
	}

	/**
	 * Updates badge states, removing expired ones.
	 */
	public update(): void {
		this.activeBadges = this.activeBadges.filter(badge => badge.update());
		this.repositionBadges();
		this.floatingBadges = this.floatingBadges.filter(badge => badge.update());
	}

	/**
	 * Renders the current score at the top center of the screen.
	 */
	public renderScore(): void {
		const p5 = this.p5;
		p5.push();
		p5.textFont('Press Start 2P');
		p5.textAlign(p5.CENTER, p5.TOP);
		p5.textSize(80);
		p5.strokeWeight(4);
		p5.stroke(0);
		p5.fill(255);
		p5.text(
			this.game.getStateMachine().getCurrentScore(),
			this.game.getGrid().getWidth() / 2,
			20
		);
		p5.pop();
	}

	/**
	 * Adds a power-up badge to the UI and a floating effect.
	 * @param type - Type of power-up for the badge
	 * @param powerUpPosition - Position where power-up was collected
	 */
	public addPowerUpBadge(type: PowerUpType, powerUpPosition: Position): void {
		const config = this.game.getConfig().powerUps.badges;
		const cellSize = this.game.getGrid().getCellSize();
		const badgeSize = cellSize * (cellSize < 20 ? 2.0 : 1.2);
		const floatingBadgeSize = cellSize * (cellSize < 20 ? 2.5 : 1.8);
		const badgeSpacing = cellSize * 0.4;
		const margin = cellSize;
		const powerUpPos = this.game.getGrid().getCellCenter(powerUpPosition);

		const initialX = margin + this.activeBadges.length * (badgeSize + badgeSpacing);
		const uiBadge = new PowerUpBadge(
			this.p5,
			type,
			{
				...this.game.getConfig().powerUps,
				colors: this.game.getConfig().powerUps.colors,
				icons: this.game.getConfig().powerUps.icons,
				effects: this.game.getConfig().powerUps.effects,
				badges: {
					...config,
					duration: this.game.getConfig().powerUps.effects[type].duration,
					size: badgeSize,
					hoverAmplitude: cellSize * config.hoverAmplitude,
					hoverFrequency: config.hoverFrequency || 2,
					popInDuration: config.popInDuration || 300,
					popInScale: config.popInScale || 1.2,
				},
			},
			initialX,
			margin,
			false
		);
		this.activeBadges.push(uiBadge);

		const floatingBadge = new PowerUpBadge(
			this.p5,
			type,
			{
				...this.game.getConfig().powerUps,
				badges: {
					...config,
					duration: 1500,
					size: floatingBadgeSize,
					hoverAmplitude: cellSize * config.hoverAmplitude,
					hoverFrequency: config.hoverFrequency || 2,
				},
			},
			powerUpPos.x,
			powerUpPos.y,
			true
		);
		this.floatingBadges.push(floatingBadge);

		this.repositionBadges();
	}

	/**
	 * Repositions active badges along the top of the screen.
	 */
	private repositionBadges(): void {
		const cellSize = this.game.getGrid().getCellSize();
		const badgeSize = cellSize * (cellSize < 20 ? 2.0 : 1.2);
		const badgeSpacing = cellSize * 0.4;
		const margin = cellSize;

		this.activeBadges.forEach((badge, index) => {
			const newX = margin + index * (badgeSize + badgeSpacing);
			badge.setPosition(newX, margin);
		});
	}

	public getActiveBadges(): PowerUpBadge[] {
		return this.activeBadges;
	}

	public getFloatingBadges(): PowerUpBadge[] {
		return this.floatingBadges;
	}
}
