import { Grid } from '../core-ts/Grid';
import { Position, PowerUpType } from '../types-ts/commonTypes';
import { PowerUpRenderer } from '../powerups-ts/PowerUpRenderer';
import { PowerUpConfig, powerUpConfig } from '../powerups-ts/PowerUpConfig';
import { createPowerUpEffect, PowerUpEffect } from '../types-ts/powerUpTypes';
import configManager from '../config-ts/gameConfig';
import type p5 from 'p5';

interface Obstacle {
    segments?: Position[];
    position?: Position;
}

interface PowerUpGameConfig {
    types: PowerUpType[];
    spawnChance: number;
    effects: {
        [key in PowerUpType]: {
            duration: number;
            speedMultiplier?: number;
            multiplier?: number;
        }
    };
    colors: {
        [key in PowerUpType]: string;
    };
}

export class PowerUp {
    #grid: Grid;
    #renderer: PowerUpRenderer | null;
    #config: PowerUpGameConfig;
    #position: Position;
    #type: PowerUpType;
    #spawnTime: number;

    constructor(grid: Grid, obstacles: Obstacle[] = []) {
        this.#grid = grid;
        this.#renderer = null;
        const gameConfig = configManager.getConfig();
        this.#config = {
            types: gameConfig.powerUps.types,
            spawnChance: gameConfig.powerUps.spawnChance,
            effects: {
                speed: { 
                    speedMultiplier: 1.5,
                    duration: gameConfig.powerUps.effects.speed.duration
                },
                ghost: { 
                    duration: gameConfig.powerUps.effects.ghost.duration
                },
                points: {
                    multiplier: 2,
                    duration: gameConfig.powerUps.effects.points.duration
                },
                slow: {
                    speedMultiplier: 0.5,
                    duration: gameConfig.powerUps.effects.slow.duration
                }
            },
            colors: gameConfig.powerUps.colors
        };

        this.#type = this.getRandomType();
        this.#position = this.getRandomPosition(obstacles);
        this.#spawnTime = Date.now();
    }

    private getRandomPosition(obstacles: Obstacle[]): Position {
        let validPosition = false;
        let attempts = 0;
        const maxAttempts = 100;
        let position: Position = { x: 0, y: 0 };

        while (!validPosition && attempts < maxAttempts) {
            attempts++;
            position = {
                x: Math.floor(Math.random() * this.#grid.width),
                y: Math.floor(Math.random() * this.#grid.height)
            };

            validPosition = !obstacles.some(obstacle => {
                if (obstacle.segments) {
                    return obstacle.segments.some(segment => 
                        segment.x === position.x && segment.y === position.y
                    );
                }
                if (obstacle.position) {
                    return obstacle.position.x === position.x && 
                           obstacle.position.y === position.y;
                }
                return false;
            });
        }

        if (!validPosition) {
            console.warn('Could not find valid position for power-up after', maxAttempts, 'attempts');
        }

        return position;
    }

    private getRandomType(): PowerUpType {
        const validTypes = this.#config.types;
        const index = Math.floor(Math.random() * validTypes.length);
        return validTypes[index];
    }

    public getType(): PowerUpType {
        return this.#type;
    }

    public get type(): PowerUpType {
        return this.#type;
    }

    public set type(value: PowerUpType) {
        this.#type = value;
    }

    public getPosition(): Position {
        return this.#position;
    }

    public getEffect(): any {
        return this.#config.effects[this.#type];
    }

    public getSpawnTime(): number {
        return this.#spawnTime;
    }

    public setRenderer(renderer: PowerUpRenderer): void {
        this.#renderer = renderer;
    }

    public draw(p5Instance: p5): void {
        // Create renderer if not exists
        if (!this.#renderer) {
            this.#renderer = new PowerUpRenderer(p5Instance, this.#grid, powerUpConfig);
        }
        if (this.#renderer) {
            this.#renderer.draw(this.#position, this.#type, this.#config.colors[this.#type]);
        }
    }
}
