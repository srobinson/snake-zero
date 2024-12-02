import { Position } from '../types-ts/commonTypes';
import { Grid } from '../core-ts/Grid';
import { PowerUpConfig } from './PowerUpConfig';
import p5 from 'p5';

export class PowerUpRenderer {
    private p5: p5;
    private grid: Grid;
    private config: PowerUpConfig;

    constructor(p5: p5, grid: Grid, config: PowerUpConfig) {
        this.p5 = p5;
        this.grid = grid;
        this.config = config;
    }

    public draw(position: Position, type: string, color: string): void {
        const coords = this.grid.toPixelCoords(position.x, position.y);
        const cellSize = this.grid.cellSize;
        const center = { x: coords.x + cellSize / 2, y: coords.y + cellSize / 2 };

        console.log("coords", coords);
        
        
        // Get size from configuration
        const baseSize = this.config.crystal.baseSize;
        const effectScale = cellSize < 20 ? baseSize * 0.5 : baseSize;
        const floatAmplitude = Math.min(2, cellSize * 0.1);
        const floatOffset = Math.sin(this.p5.frameCount * this.config.crystal.floatSpeed) * floatAmplitude;
        const glowSize = cellSize * effectScale;
        const iconSize = cellSize * this.config.crystal.iconSize;
        
        this.p5.push();
        this.p5.translate(center.x, center.y + floatOffset);
        
        // Draw outer glow
        (this.p5.drawingContext as CanvasRenderingContext2D).shadowBlur = Math.min(10, cellSize * 0.2);
        (this.p5.drawingContext as CanvasRenderingContext2D).shadowColor = color;
        
        // Draw crystal backdrop (hexagonal)
        this.p5.noStroke();
        this.p5.fill(color + '33'); // Semi-transparent
        this.drawCrystal(glowSize);
        
        // Draw inner icon
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.textSize(iconSize);
        this.p5.fill(255, 230); // Slightly transparent white
        this.p5.text(this.config.icons[type] || '?', 0, 0);
        
        // Add sparkle effect
        this.drawSparkles(glowSize);
        
        this.p5.pop();
    }

    private drawCrystal(size: number): void {
        const points = 6;
        const angleStep = (Math.PI * 2) / points;
        
        this.p5.beginShape();
        for (let i = 0; i < points; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            this.p5.vertex(x, y);
        }
        this.p5.endShape(this.p5.CLOSE);
    }

    private drawSparkles(size: number): void {
        const sparkleCount = this.config.crystal.shimmerCount;
        const sparkleSize = size * 0.2;
        
        this.p5.stroke(255, 200);
        this.p5.strokeWeight(1);
        
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (this.p5.frameCount * this.config.crystal.shimmerSpeed + (i * Math.PI * 2) / sparkleCount) % (Math.PI * 2);
            const distance = size * 0.6;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            this.p5.line(x - sparkleSize/2, y, x + sparkleSize/2, y);
            this.p5.line(x, y - sparkleSize/2, x, y + sparkleSize/2);
        }
    }
}
