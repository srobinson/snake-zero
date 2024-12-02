import { EntityManager } from '../../core-ts/EntityManager';
import { EventSystem } from '../../core-ts/EventSystem';
import { PowerUpEffect } from '../../types-ts/powerUpTypes';

interface UIConfig {
    container: HTMLElement;
    styles: {
        fontFamily: string;
        textColor: string;
        backgroundColor: string;
        accentColor: string;
    };
    labels: {
        score: string;
        length: string;
        fps: string;
        gameOver: string;
        restart: string;
        menu: string;
    };
}

interface UIElements {
    scoreDisplay: HTMLElement;
    lengthDisplay: HTMLElement;
    fpsDisplay: HTMLElement;
    powerUpDisplay: HTMLElement;
    gameOverScreen: HTMLElement;
    menuScreen: HTMLElement;
}

export class UISystem {
    private entityManager: EntityManager;
    private eventSystem: EventSystem;
    private config: UIConfig;
    private elements: UIElements;
    private score: number;
    private length: number;
    private fps: number;
    private activePowerUps: Map<string, { effect: PowerUpEffect; endTime: number }>;
    private lastScoreFlash: number;

    constructor(
        entityManager: EntityManager,
        eventSystem: EventSystem,
        config: UIConfig
    ) {
        this.entityManager = entityManager;
        this.eventSystem = eventSystem;
        this.config = config;
        this.score = 0;
        this.length = 0;
        this.fps = 0;
        this.activePowerUps = new Map();
        this.lastScoreFlash = 0;

        this.elements = this.createUIElements();
        this.setupEventListeners();
        this.applyStyles();
    }

    private createUIElements(): UIElements {
        const { container, labels } = this.config;

        // Create elements
        const scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'score-display';
        scoreDisplay.textContent = `${labels.score}: 0`;

        const lengthDisplay = document.createElement('div');
        lengthDisplay.id = 'length-display';
        lengthDisplay.textContent = `${labels.length}: 0`;

        const fpsDisplay = document.createElement('div');
        fpsDisplay.id = 'fps-display';
        fpsDisplay.textContent = `${labels.fps}: 0`;

        const powerUpDisplay = document.createElement('div');
        powerUpDisplay.id = 'power-up-display';

        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'game-over-screen';
        gameOverScreen.style.display = 'none';
        gameOverScreen.innerHTML = `
            <h2>${labels.gameOver}</h2>
            <p class="final-score"></p>
            <button class="restart-button">${labels.restart}</button>
        `;

        const menuScreen = document.createElement('div');
        menuScreen.id = 'menu-screen';
        menuScreen.innerHTML = `
            <h1>${labels.menu}</h1>
            <button class="start-button">${labels.restart}</button>
        `;

        // Add elements to container
        container.appendChild(scoreDisplay);
        container.appendChild(lengthDisplay);
        container.appendChild(fpsDisplay);
        container.appendChild(powerUpDisplay);
        container.appendChild(gameOverScreen);
        container.appendChild(menuScreen);

        return {
            scoreDisplay,
            lengthDisplay,
            fpsDisplay,
            powerUpDisplay,
            gameOverScreen,
            menuScreen
        };
    }

    private applyStyles(): void {
        const { styles } = this.config;
        const { container } = this.config;

        // Apply container styles
        Object.assign(container.style, {
            fontFamily: styles.fontFamily,
            color: styles.textColor,
            backgroundColor: styles.backgroundColor
        });

        // Apply common element styles
        const elements = Object.values(this.elements);
        elements.forEach(element => {
            Object.assign(element.style, {
                fontFamily: styles.fontFamily,
                color: styles.textColor
            });
        });

        // Apply specific styles
        Object.assign(this.elements.gameOverScreen.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            backgroundColor: styles.backgroundColor,
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 0 1rem rgba(0,0,0,0.5)'
        });

        // Style buttons
        const buttons = container.getElementsByTagName('button');
        Array.from(buttons).forEach(button => {
            Object.assign(button.style, {
                backgroundColor: styles.accentColor,
                color: styles.textColor,
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                marginTop: '1rem'
            });
        });
    }

    private setupEventListeners(): void {
        // Game events
        this.eventSystem.on('scoreUpdated', this.handleScoreUpdate.bind(this));
        this.eventSystem.on('snakeLengthChanged', this.handleLengthUpdate.bind(this));
        this.eventSystem.on('powerUpStarted', this.handlePowerUpStart.bind(this));
        this.eventSystem.on('powerUpEnded', this.handlePowerUpEnd.bind(this));
        this.eventSystem.on('snakeDied', this.showGameOver.bind(this));

        // Button events
        const restartButton = this.elements.gameOverScreen.querySelector('.restart-button');
        const startButton = this.elements.menuScreen.querySelector('.start-button');

        if (restartButton) {
            restartButton.addEventListener('click', () => {
                this.eventSystem.emit('gameRestart', null);
                this.hideGameOver();
            });
        }

        if (startButton) {
            startButton.addEventListener('click', () => {
                this.eventSystem.emit('gameStart', null);
                this.hideMenu();
            });
        }
    }

    private handleScoreUpdate(data: { points: number; totalScore: number; isSpecial: boolean }): void {
        this.score = data.totalScore;
        this.elements.scoreDisplay.textContent = `${this.config.labels.score}: ${this.score}`;

        if (data.isSpecial) {
            this.flashScore();
        }
    }

    private handleLengthUpdate(data: { length: number }): void {
        this.length = data.length;
        this.elements.lengthDisplay.textContent = `${this.config.labels.length}: ${this.length}`;
    }

    private handlePowerUpStart(data: { effect: PowerUpEffect; duration: number }): void {
        const { effect, duration } = data;
        const endTime = performance.now() + duration;
        this.activePowerUps.set(effect.type, { effect, endTime });
        this.updatePowerUpDisplay();
    }

    private handlePowerUpEnd(data: { effect: PowerUpEffect }): void {
        this.activePowerUps.delete(data.effect.type);
        this.updatePowerUpDisplay();
    }

    private updatePowerUpDisplay(): void {
        const { powerUpDisplay } = this.elements;
        powerUpDisplay.innerHTML = '';

        for (const [_, { effect }] of this.activePowerUps) {
            const powerUpElement = document.createElement('div');
            powerUpElement.className = 'power-up-indicator';
            powerUpElement.textContent = effect.name;
            powerUpElement.style.color = effect.color;
            powerUpDisplay.appendChild(powerUpElement);
        }
    }

    private flashScore(): void {
        const now = performance.now();
        if (now - this.lastScoreFlash < 100) return;

        const { scoreDisplay } = this.elements;
        scoreDisplay.style.transform = 'scale(1.2)';
        scoreDisplay.style.color = this.config.styles.accentColor;

        setTimeout(() => {
            scoreDisplay.style.transform = 'scale(1)';
            scoreDisplay.style.color = this.config.styles.textColor;
        }, 100);

        this.lastScoreFlash = now;
    }

    showGameOver(): void {
        const { gameOverScreen } = this.elements;
        const finalScore = gameOverScreen.querySelector('.final-score');
        if (finalScore) {
            finalScore.textContent = `Final Score: ${this.score}`;
        }
        gameOverScreen.style.display = 'block';
    }

    hideGameOver(): void {
        this.elements.gameOverScreen.style.display = 'none';
    }

    showMenu(): void {
        this.elements.menuScreen.style.display = 'block';
    }

    hideMenu(): void {
        this.elements.menuScreen.style.display = 'none';
    }

    update(deltaTime: number): void {
        // Update FPS display
        this.fps = Math.round(1000 / deltaTime);
        this.elements.fpsDisplay.textContent = `${this.config.labels.fps}: ${this.fps}`;

        // Update power-up timers
        const now = performance.now();
        for (const [type, { effect, endTime }] of this.activePowerUps) {
            if (now >= endTime) {
                this.eventSystem.emit('powerUpEnded', { effect });
                this.activePowerUps.delete(type);
            }
        }
    }

    destroy(): void {
        // Remove all UI elements
        Object.values(this.elements).forEach(element => {
            element.remove();
        });
    }

    toJSON(): object {
        return {
            score: this.score,
            length: this.length,
            fps: this.fps,
            activePowerUps: Array.from(this.activePowerUps.keys())
        };
    }
}
