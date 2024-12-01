import p5 from 'p5';
import { sketch, setGameConfig } from './game.js';
import { SnakedAgainConfig } from './config/SnakedAgainConfig.js';

export class SnakedAgain {
    #p5Instance;
    #container;
    #canvas;

    /**
     * Initialize a new SnakedAgain game instance
     * @param {string|HTMLElement} container - Container ID or element to mount the game
     * @param {Object|SnakedAgainConfig} config - Game configuration
     */
    constructor(container, config = new SnakedAgainConfig().usePreset('medium').getConfig()) {
        // Handle container parameter
        this.#container = typeof container === 'string' 
            ? document.getElementById(container)
            : container;

        if (!this.#container) {
            throw new Error('Invalid container. Provide a valid element ID or HTMLElement');
        }

        // Add game container class if not present
        if (!this.#container.classList.contains('snaked-again-container')) {
            this.#container.classList.add('snaked-again-container');
        }

        // Handle configuration
        const finalConfig = config instanceof SnakedAgainConfig ? config.getConfig() : new SnakedAgainConfig(config).getConfig();
        setGameConfig(finalConfig);

        // Initialize p5 instance
        this.#p5Instance = new p5(sketch, this.#container);

        // Add canvas class once p5 creates it
        requestAnimationFrame(() => {
            this.#canvas = this.#container.querySelector('canvas');
            if (this.#canvas) {
                this.#canvas.classList.add('snaked-again-canvas');
            }
        });
    }

    /**
     * Stop the game and cleanup resources
     */
    destroy() {
        if (this.#p5Instance) {
            this.#p5Instance.remove();
            this.#p5Instance = null;
        }
    }

    /**
     * Get the configuration builder class
     * @returns {typeof SnakedAgainConfig}
     */
    static get Config() {
        return SnakedAgainConfig;
    }
}
