import type p5 from 'p5';
import Game from './main';

let game: Game;
let touchStartX = 0;
let touchStartY = 0;
const MIN_SWIPE_DISTANCE = 30;

function touchStarted(event: TouchEvent): void {
    if (event.touches.length === 1) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
}

function touchEnded(event: TouchEvent): void {
    if (event.changedTouches.length === 1) {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        // Only handle swipes that are long enough
        if (Math.abs(deltaX) >= MIN_SWIPE_DISTANCE || Math.abs(deltaY) >= MIN_SWIPE_DISTANCE) {
            // Determine swipe direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    // Simulate right arrow key
                    game.handleKeyPress('ArrowRight');
                } else {
                    // Simulate left arrow key
                    game.handleKeyPress('ArrowLeft');
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    // Simulate down arrow key
                    game.handleKeyPress('ArrowDown');
                } else {
                    // Simulate up arrow key
                    game.handleKeyPress('ArrowUp');
                }
            }
        }
    }
}

// Initialize p5.js in instance mode
new p5((p: p5) => {
    p.setup = () => {
        game = new Game();
        game.setup(p);
    };

    p.draw = () => {
        game.draw(p);
    };

    p.keyPressed = () => {
        game.handleKeyPress(p.key);
    };

    (p as any).touchStarted = touchStarted;
    (p as any).touchEnded = touchEnded;
});
