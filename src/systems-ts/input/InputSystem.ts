interface TouchState {
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    isActive: boolean;
}

interface InputBinding {
    keys: string[];
    handler: (event: InputEvent) => void;
    continuous?: boolean;
    preventDefault?: boolean;
}

interface BaseInputEvent {
    type: string;
}

interface KeyboardInputEvent extends BaseInputEvent {
    type: 'keydown' | 'keyup' | 'continuous';
    key?: string;
}

interface TouchInputEvent extends BaseInputEvent {
    type: 'touchmove' | 'touchend';
    deltaX: number;
    deltaY: number;
    x: number;
    y: number;
}

type InputEvent = KeyboardInputEvent | TouchInputEvent;

interface Vector2D {
    x: number;
    y: number;
}

export class InputSystem {
    private bindings: Map<string, InputBinding>;
    private pressedKeys: Set<string>;
    private touchState: TouchState;

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

        // Bind methods to preserve 'this' context
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('touchstart', this.handleTouchStart);
        window.addEventListener('touchmove', this.handleTouchMove);
        window.addEventListener('touchend', this.handleTouchEnd);
    }

    cleanup(): void {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('touchstart', this.handleTouchStart);
        window.removeEventListener('touchmove', this.handleTouchMove);
        window.removeEventListener('touchend', this.handleTouchEnd);
    }

    registerBinding(action: string, binding: InputBinding): void {
        this.bindings.set(action, binding);
    }

    removeBinding(action: string): void {
        this.bindings.delete(action);
    }

    private handleKeyDown(event: KeyboardEvent): void {
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

    private handleKeyUp(event: KeyboardEvent): void {
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

    private handleTouchStart(event: TouchEvent): void {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.touchState.startX = touch.clientX;
            this.touchState.startY = touch.clientY;
            this.touchState.lastX = touch.clientX;
            this.touchState.lastY = touch.clientY;
            this.touchState.isActive = true;
        }
    }

    private handleTouchMove(event: TouchEvent): void {
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

    private handleTouchEnd(event: TouchEvent): void {
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

    update(): void {
        for (const [action, binding] of this.bindings) {
            if (binding.continuous) {
                const isActive = binding.keys.some(key => this.pressedKeys.has(key));
                if (isActive) {
                    binding.handler({ type: 'continuous' });
                }
            }
        }
    }

    clear(): void {
        this.pressedKeys.clear();
        this.bindings.clear();
        this.touchState = {
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0,
            isActive: false
        };
    }

    getMovementVector(): Vector2D {
        const movement = { x: 0, y: 0 };
        
        if (this.pressedKeys.has('ArrowUp') || this.pressedKeys.has('KeyW')) {
            movement.y = -1;
        } else if (this.pressedKeys.has('ArrowDown') || this.pressedKeys.has('KeyS')) {
            movement.y = 1;
        }
        
        if (this.pressedKeys.has('ArrowLeft') || this.pressedKeys.has('KeyA')) {
            movement.x = -1;
        } else if (this.pressedKeys.has('ArrowRight') || this.pressedKeys.has('KeyD')) {
            movement.x = 1;
        }
        
        return movement;
    }
}
