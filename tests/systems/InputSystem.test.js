import { InputSystem } from '../../src/systems/input/InputSystem.js';

describe('InputSystem', () => {
    let inputSystem;
    let mockHandler;

    beforeEach(() => {
        inputSystem = new InputSystem();
        mockHandler = jest.fn();
    });

    afterEach(() => {
        inputSystem.cleanup();
    });

    test('should register and handle key bindings', () => {
        inputSystem.registerBinding('move', {
            keys: ['ArrowUp'],
            handler: mockHandler
        });

        // Simulate keydown event
        const keydownEvent = new KeyboardEvent('keydown', { code: 'ArrowUp' });
        window.dispatchEvent(keydownEvent);

        expect(mockHandler).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'keydown',
                key: 'ArrowUp'
            })
        );
    });

    test('should handle continuous input', () => {
        inputSystem.registerBinding('hold', {
            keys: ['Space'],
            handler: mockHandler,
            continuous: true
        });

        // Simulate key press
        const keydownEvent = new KeyboardEvent('keydown', { code: 'Space' });
        window.dispatchEvent(keydownEvent);

        // Update should trigger handler for held keys
        inputSystem.update();

        expect(mockHandler).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'continuous'
            })
        );
    });

    test('should handle touch events', () => {
        inputSystem.registerBinding('swipe', {
            keys: [],
            handler: mockHandler
        });

        // Simulate touch start
        const touchStartEvent = new TouchEvent('touchstart', {
            touches: [{ clientX: 0, clientY: 0 }]
        });
        window.dispatchEvent(touchStartEvent);

        // Simulate touch move
        const touchMoveEvent = new TouchEvent('touchmove', {
            touches: [{ clientX: 100, clientY: 100 }]
        });
        window.dispatchEvent(touchMoveEvent);

        expect(mockHandler).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'touchmove'
            })
        );
    });

    test('should remove bindings', () => {
        inputSystem.registerBinding('test', {
            keys: ['Enter'],
            handler: mockHandler
        });

        inputSystem.removeBinding('test');

        const keyEvent = new KeyboardEvent('keydown', { code: 'Enter' });
        window.dispatchEvent(keyEvent);

        expect(mockHandler).not.toHaveBeenCalled();
    });
});
