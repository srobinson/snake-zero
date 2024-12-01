import { gameConfig } from '../config/gameConfig.js';

export class PowerUp {
    constructor(grid) {
        this.grid = grid;
        this.position = { x: 0, y: 0 };
        this.active = false;
        this.type = this.getRandomType();
        this.duration = gameConfig.powerUps.duration;
        this.startTime = 0;
    }

    getRandomType() {
        const types = gameConfig.powerUps.types;
        return types[Math.floor(Math.random() * types.length)];
    }

    respawn() {
        const gridSize = this.grid.getSize();
        this.position = {
            x: Math.floor(Math.random() * gridSize.width),
            y: Math.floor(Math.random() * gridSize.height)
        };
        this.type = this.getRandomType();
        this.active = true;
    }

    collect() {
        this.active = false;
        this.startTime = Date.now();
        return {
            type: this.type,
            duration: this.duration
        };
    }

    isExpired() {
        return Date.now() - this.startTime >= this.duration;
    }

    draw(p) {
        if (!this.active) return;

        const visual = gameConfig.powerUps.visual;
        const color = gameConfig.powerUps.colors[this.type];
        const cellSize = this.grid.cellSize;
        const x = this.position.x * cellSize;
        const y = this.position.y * cellSize;

        // Draw power-up with pulsing effect
        p.push();
        const pulse = (Math.sin(p.frameCount * visual.pulseSpeed) + 1) * 0.5;
        p.fill(...color, visual.baseAlpha + pulse * visual.pulseAlpha);
        p.noStroke();
        
        // Draw star shape
        p.beginShape();
        const radius = cellSize * visual.outerRadius;
        const innerRadius = cellSize * visual.innerRadius;
        for (let i = 0; i < visual.starPoints; i++) {
            const angle = p.TWO_PI * i / visual.starPoints - p.HALF_PI;
            const r = i % 2 === 0 ? radius : innerRadius;
            const px = x + cellSize/2 + r * p.cos(angle);
            const py = y + cellSize/2 + r * p.sin(angle);
            p.vertex(px, py);
        }
        p.endShape(p.CLOSE);
        
        p.pop();
    }
}
