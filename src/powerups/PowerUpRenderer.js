/** @typedef {import('../types/commonTypes.js').Position} Position */

/**
 * Handles the visual rendering of power-ups with advanced effects
 */
export class PowerUpRenderer {
    constructor(p5, grid, config) {
        this.p5 = p5;
        this.grid = grid;
        this.config = config;
    }

    /**
     * Draws a power-up with crystal effect
     * @param {Position} position - Grid position of the power-up
     * @param {string} type - Type of power-up
     * @param {string} color - Color of the power-up
     */
    draw(position, type, color) {
        const coords = this.grid.toPixelCoords(position.x, position.y);
        const cellSize = this.grid.getCellSize();
        const center = { x: coords.x + cellSize / 2, y: coords.y + cellSize / 2 };
        
        // Get size from configuration
        const baseSize = this.config.crystal.baseSize;
        const effectScale = cellSize < 20 ? baseSize * 0.5 : baseSize;
        const floatAmplitude = Math.min(2, cellSize * 0.1);
        const floatOffset = Math.sin(this.p5.frameCount * 0.05) * floatAmplitude;
        const glowSize = cellSize * effectScale;
        const iconSize = cellSize * this.config.crystal.iconSize;
        
        this.p5.push();
        this.p5.translate(center.x, center.y + floatOffset);
        
        // Draw outer glow
        this.p5.drawingContext.shadowBlur = Math.min(10, cellSize * 0.2);
        this.p5.drawingContext.shadowColor = color;
        
        // Draw crystal backdrop (hexagonal)
        this.p5.noStroke();
        this.p5.fill(color + '33'); // Semi-transparent
        this.#drawCrystal(glowSize);
        
        // Draw inner icon
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.textSize(iconSize);
        this.p5.fill(255, 230); // Slightly transparent white
        const icons = {
            speed: '⚡',
            ghost: '👻',
            points: '⭐',
            slow: '🐌'
        };
        this.p5.text(icons[type], 0, 0);
        
        // Draw shimmering effect with scaled particles
        this.#drawShimmer(glowSize);
        
        // Draw energy field
        this.#drawEnergyField(glowSize, color);
        
        this.p5.pop();
    }

    /**
     * Draws the crystal hexagonal shape
     * @param {number} size - Size of the crystal
     */
    #drawCrystal(size) {
        const points = 6;
        this.p5.beginShape();
        for (let i = 0; i < points; i++) {
            const angle = (i * this.p5.TWO_PI / points) - this.p5.frameCount * 0.01; // Negative for reverse rotation
            const x = Math.cos(angle) * size/2;
            const y = Math.sin(angle) * size/2;
            this.p5.vertex(x, y);
        }
        this.p5.endShape(this.p5.CLOSE);
    }

    /**
     * Draws rotating shimmer points
     * @param {number} size - Size of the shimmer area
     */
    #drawShimmer(size) {
        const shimmerCount = 5;
        for (let i = 0; i < shimmerCount; i++) {
            const angle = ((this.p5.frameCount * 0.02) + (i * this.p5.TWO_PI / shimmerCount)) % this.p5.TWO_PI; 
            const x = Math.cos(angle) * size * 0.3;
            const y = Math.sin(angle) * size * 0.3;
            
            this.p5.fill(255, 150);
            this.p5.circle(x, y, 4);
        }
    }

    /**
     * Draws an energy field effect around the crystal
     * @param {number} size - Size of the energy field
     * @param {string} color - Color of the energy field
     */
    #drawEnergyField(size, color) {
        const particleCount = 8;
        const time = this.p5.frameCount * 0.05;
        
        // Add glow effect
        this.p5.drawingContext.shadowBlur = size * 0.1;
        this.p5.drawingContext.shadowColor = color;
        
        // Draw solid orbital particles with pulse
        this.p5.fill(color + 'AA'); 
        this.p5.noStroke();
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * this.p5.TWO_PI;
            const x = Math.cos(angle + time) * size * 0.6;
            const y = Math.sin(angle + time) * size * 0.6;
            
            // Add subtle pulse effect
            const pulse = 1 + Math.sin(time * 2 + i) * 0.2;
            const particleSize = size * 0.12 * pulse;
            
            this.p5.circle(x, y, particleSize);
        }
        
        // Reset shadow for other rendering
        this.p5.drawingContext.shadowBlur = 0;
    }
}
