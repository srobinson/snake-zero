/**
 * @typedef {Object} InputBinding
 * @property {string[]} keys
 * @property {Function} handler
 * @property {boolean} [continuous]
 * @property {boolean} [preventDefault]
 */

export class InputSystem {
    constructor() {
        this.bindings = new Map();
        this.pressedKeys = new Set();
        this.touchState = {
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0,
            isActive: false
        };

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('touchstart', this.handleTouchStart);
        window.addEventListener('touchmove', this.handleTouchMove);
        window.addEventListener('touchend', this.handleTouchEnd);
    }

    cleanup() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('touchstart', this.handleTouchStart);
        window.removeEventListener('touchmove', this.handleTouchMove);
        window.removeEventListener('touchend', this.handleTouchEnd);
    }

    registerBinding(action, binding) {
        this.bindings.set(action, binding);
    }

    removeBinding(action) {
        this.bindings.delete(action);
    }

    handleKeyDown(event) {
        this.pressedKeys.add(event.code);
        
        for (const [action, binding] of this.bindings) {
            if (binding.keys.includes(event.code)) {
                if (binding.preventDefault) {
                    event.preventDefault();
                }
                binding.handler({ type: 'keydown', key: event.code });
            }
        }
    }

    handleKeyUp(event) {
        this.pressedKeys.delete(event.code);
        
        for (const [action, binding] of this.bindings) {
            if (binding.keys.includes(event.code)) {
                if (binding.preventDefault) {
                    event.preventDefault();
                }
                binding.handler({ type: 'keyup', key: event.code });
            }
        }
    }

    handleTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.touchState.startX = touch.clientX;
            this.touchState.startY = touch.clientY;
            this.touchState.lastX = touch.clientX;
            this.touchState.lastY = touch.clientY;
            this.touchState.isActive = true;
        }
    }

    handleTouchMove(event) {
        if (!this.touchState.isActive) return;

        const touch = event.touches[0];
        const deltaX = touch.clientX - this.touchState.lastX;
        const deltaY = touch.clientY - this.touchState.lastY;

        this.touchState.lastX = touch.clientX;
        this.touchState.lastY = touch.clientY;

        for (const [action, binding] of this.bindings) {
            binding.handler({ 
                type: 'touchmove',
                deltaX,
                deltaY,
                x: touch.clientX,
                y: touch.clientY
            });
        }
    }

    handleTouchEnd(event) {
        if (!this.touchState.isActive) return;

        const deltaX = this.touchState.lastX - this.touchState.startX;
        const deltaY = this.touchState.lastY - this.touchState.startY;

        for (const [action, binding] of this.bindings) {
            binding.handler({ 
                type: 'touchend',
                deltaX,
                deltaY,
                x: this.touchState.lastX,
                y: this.touchState.lastY
            });
        }

        this.touchState.isActive = false;
    }

    update() {
        for (const [action, binding] of this.bindings) {
            if (binding.continuous) {
                const isActive = binding.keys.some(key => this.pressedKeys.has(key));
                if (isActive) {
                    binding.handler({ type: 'continuous' });
                }
            }
        }
    }
}
